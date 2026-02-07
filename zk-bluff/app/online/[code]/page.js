"use client";
import { useEffect, useState } from "react";
import { useRouter, useParams } from "next/navigation";
import { subscribeToGame, joinGameRoom, startGame, uploadHandCommitment } from "@/lib/firebase-game";
import { generateHandCommitment } from "@/lib/zk";
import { CrownIcon, UserIcon } from "lucide-react";

export default function Lobby() {
    const { code } = useParams();
    const router = useRouter();
    const [gameData, setGameData] = useState(null);
    const [userId, setUserId] = useState(null);
    const [settingsBlame, setSettingsBlame] = useState(false);
    const [aiPlayer, setAiPlayer] = useState(false);
    const [bluffMeter, setBluffMeter] = useState(false);

    const setSettingsBlameFunc = () => {
            setSettingsBlame(true);
        }

    const removeSettingsBlameFunc = () => {
            setSettingsBlame(false);
        }

    const addAi = () => {
        setAiPlayer(true);
    }

    const removeAi = () => {
        setAiPlayer(false);
    }

    const addMeter = () => {
        setBluffMeter(true);
    }

    const removeMeter = () => {
        setBluffMeter(false);
    }

    useEffect(() => {
        // try existing id first
        let storedId = localStorage.getItem("zk_user_id");

        // generate new one if doesn't exist
        if (!storedId) {
            storedId = "user_" + Math.random().toString(36).substring(2,9);
            localStorage.setItem("zk_user_id", storedId);
        }
        
        setUserId(storedId);

        const name = localStorage.getItem("zk_user_name") || "Guest";
        joinGameRoom(code, name, storedId);
    }, [code]);

    // subscribe to firebase
    useEffect(() => {
        const unsubscribe = subscribeToGame(code, async (data) => {
            setGameData(data);
            if (data.status === "playing") {
                // When game starts, capture our hand locally, compute Poseidon commitment, upload it.
                try {
                    const storedId = localStorage.getItem("zk_user_id");
                    const me = data.players.find(p => p.id === storedId);
                    if (me) {
                        const myHand = me.hand || [];
                        // Generate salt if not present
                        let salt = localStorage.getItem('my_salt');
                        if (!salt) {
                            salt = Math.floor(Math.random()*1e9).toString();
                            localStorage.setItem('my_salt', salt);
                        }

                        // Map cards to integers: suitIndex * 13 + rankIndex
                        const suitOrder = { hearts:0, diamonds:1, clubs:2, spades:3, joker:4 };
                        const rankOrder = { A:0, "2":1, "3":2, "4":3, "5":4, "6":5, "7":6, "8":7, "9":8, "10":9, J:10, Q:11, K:12, Joker:13 };
                        const cardInts = myHand.map(c => {
                            const s = suitOrder[c.suit] ?? 4;
                            const r = rankOrder[c.rank] ?? 13;
                            if (s === 4) return 52 + (r === 13 ? 1 : 0);
                            return s * 13 + r;
                        });

                        // Save full hand locally and compute commitment
                        localStorage.setItem('my_hand', JSON.stringify(myHand));
                        try {
                            const commitment = await generateHandCommitment(cardInts, salt);
                            // Signal we've locally saved the hand, and upload commitment to Firestore
                            await uploadHandCommitment(code, storedId, commitment, { localSaved: true });

                            // If we're the host, check if everyone committed+saved; if so, finalise after short delay
                            const gameRef = await fetch(`/api/gameStatus?code=${code}`).then(r => r.json()).catch(() => null);
                            if (gameRef && gameRef.hostId === storedId) {
                                const allCommitted = (gameRef.players || []).every(p => p.handCommitment && p.localSaved);
                                if (allCommitted) {
                                    // Small delay to allow last client-side writes to settle
                                    setTimeout(() => {
                                        fetch(`/api/finalizeCommitments?code=${code}`, { method: 'POST' }).catch(e => console.warn(e));
                                    }, 1000);
                                }
                            }
                        } catch (e2) {
                            console.warn('commit upload failed', e2);
                        }
                    }
                } catch (e) {
                    console.warn('hand commitment error', e);
                }

                router.push(`/online/game/${code}`);
            }
        });
        return () => unsubscribe && unsubscribe();
    }, [code, router]);

    if (!gameData) return <div className="text-white text-center mt-20">Loading Game Room...</div>;

    const isHost = gameData.hostId === userId;

    return (
        <div className="flex min-h-screen flex-col justify-center items-center p-10 bg-radial from-[#BA2237] to-[#261447] select-none">
            {settingsBlame && <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm">
                <div className="bg-white/40 outline-4 outline-white p-8 rounded-2xl text-center max-w-lg flex flex-col items-center space-y-10">
                    <h1 className="text-5xl text-white font-bold">SETTINGS</h1>
                    <div className="flex flex-row space-x-5 items-center justify-between w-[200]">
                        <label className="text-white font-bold text-sm md:text-xl ml-1">ADD AI</label>
                        <input type="checkbox" defaultChecked={aiPlayer} onClick={(e) => {if (e.target.checked) {addAi()} else {removeAi()}}} className="cursor-pointer size-5 border-2 border-white accent-[#F30000]/60 checked:text-white"></input>
                    </div>
                    <div className="flex flex-row space-x-5 items-center justify-between w-[200]">
                        <label className="text-white font-bold text-sm md:text-xl ml-1">ADD BLUFF METER</label>
                        <input type="checkbox" defaultChecked={bluffMeter} onClick={(e) => {if (e.target.checked) {addMeter()} else {removeMeter()}}} className="cursor-pointer size-5 border-2 border-white accent-[#F30000]/60 checked:text-white"></input>
                    </div>
                    <button onClick={removeSettingsBlameFunc} className="cursor-pointer text-white text-2xl p-2 font-bold bg-[#F30000]/60 rounded-xl ">BACK BUTTON</button>
                    </div>
                </div>}
            <h1 className="text-white text-4xl md:text-6xl font-bold mb-4 text-center">GAME ROOM CODE: <span className="text-red-500">{code}</span></h1>
            <div className="w-full max-w-2xl bg-black/40 rounded-xl p-8 backdrop-blur-md">
                <div className="flex flex-row justify-between items-center mb-6">
                    <h2 className="text-white text-2xl font-bold flex">
                        <UserIcon className="mr-2"/> PLAYERS ({gameData.players.length})
                    </h2>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {gameData.players.map((p, i) => (
                        <div key={p.id} className="flex items-center bg-white/10 p-4 rounded-lg text-white font-bold text-xl">
                            {p.id === gameData.hostId && <CrownIcon className="text-blue-400 mr-3 size-6"/>}
                            {p.name} {p.id === userId && "(You)"}
                        </div>
                    ))}
                </div>

                <div className="mt-10 flex justify-center">
                    {isHost ? (
                        <button 
                            disabled={gameData.players.length < 3}
                            onClick={() => startGame(code)}
                            className="bg-[#F30000] hover:bg-red-600 text-white text-3xl font-bold py-4 px-12 rounded-2xl shadow-xl transition-transform hover:scale-105 cursor-pointer disabled:cursor-not-allowed"
                        >
                            START GAME
                        </button>
                    ) : (
                        <div className="text-white/70 text-2xl font-bold animate-pulse">
                            WAITING FOR HOST TO START...
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
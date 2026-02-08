"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { subscribeToGame, playTurn, callBS, voteTruth } from "@/lib/firebase-game";
import * as snarkjs from "snarkjs";
import Card from "@/components/card";

export default function OnlineGame() {
    const { code } = useParams();
    const router = useRouter();
    const [game, setGame] = useState(null);
    const [userId, setUserId] = useState(null);
    const [selectedIndices, setSelectedIndices] = useState([]);
    const [isDeclaring, setIsDeclaring] = useState(false);
    const [bsValue, setBsValue] = useState(20);
    const [showMeter, setShowMeter] = useState(true);

    const showMeterFunc = () => {
        setShowMeter(true);
    }

    const hideMeterFunc = () => {
        setShowMeter(false);
    }

    // Heuristic: estimate probability the given player is bluffing
    const estimateBluffProbability = (player = {}, cardsCount = 0) => {
        const bluffAccusals = player.bluffAccusationCounter || 0;
        const successfulDefenses = player.successfulBluffCalls || 0;
        const bluffAccuserTotal = player.bluffCounter || 0;
        const bluffAccuserFailures = player.successfulBluffCounter || 0; // per naming: failed accusations

        // Base probability
        let p = 0.12;

        // If they've been accused more often than they successfully defended, raise suspicion
        const netAccused = bluffAccusals - successfulDefenses;
        if (netAccused > 0) p += Math.min(0.5, netAccused * 0.08);
        else if (netAccused < 0) p -= Math.min(0.2, Math.abs(netAccused) * 0.05);

        // aggressiveness slightly increases/decreases interpretation
        const netAccuser = bluffAccuserTotal - bluffAccuserFailures;
        p += Math.max(-0.1, Math.min(0.15, netAccuser * 0.03));

        // Fewer cards -> higher chance they tried to offload a troublesome card
        const cardFactor = Math.max(0, (6 - (cardsCount || 0)) / 6); // 0..1 roughly
        p += Math.min(0.5, cardFactor * 0.5);

        // Clamp
        p = Math.max(0, Math.min(0.95, p));
        return p;
    };

    useEffect(() => {
        setUserId(localStorage.getItem("zk_user_id"));
        const unsubscribe = subscribeToGame(code, (data) => {
            setGame(data);
            try {
                // Recalculate bluff probability when game updates (e.g., after a play)
                const gs = data.gameState || {};
                const last = gs.lastClaim;
                if (last && typeof last.playerIdx === 'number') {
                    const pl = (data.players || [])[last.playerIdx] || {};
                    const cardsCount = Array.isArray(pl.hand) ? pl.hand.length : (pl.handCount || 0);
                    const prob = estimateBluffProbability(pl, cardsCount);
                    setBsValue(Math.round(prob * 100));
                } else {
                    // default neutral value
                    setBsValue(20);
                }
            } catch (e) {
                // ignore errors here
            }
            try {
                const uid = localStorage.getItem("zk_user_id");
                if (!uid) return;
                const myIdx = (data.players || []).findIndex(p => p.id === uid);
                if (myIdx !== -1) {
                    const p = data.players[myIdx];
                    // If server hands contain real card objects (not hidden placeholders), mirror them in localStorage
                    if (Array.isArray(p.hand) && p.hand.length > 0 && p.hand[0] && p.hand[0].rank) {
                        localStorage.setItem('my_hand', JSON.stringify(p.hand));
                    }
                }
            } catch (e) {
                // ignore storage errors
            }
        });
        return () => unsubscribe && unsubscribe();
    }, [code]);

    if (!game || !game.gameState) return <div className="text-white p-10">Loading Game State...</div>;

    const { players, gameState } = game;
    const myPlayerIndex = players.findIndex(p => p.id === userId);
    let myHand = players[myPlayerIndex]?.hand || [];
    try {
        const stored = localStorage.getItem('my_hand');
        if (stored) {
            const parsed = JSON.parse(stored);
            if (players[myPlayerIndex] && players[myPlayerIndex].id === userId) {
                myHand = parsed;
            }
        }
    } catch (e) {
        // ignore parse errors and fallback to server hand
    }
    const isMyTurn = gameState.turnIndex === myPlayerIndex;
    const targetRank = gameState.targetRank;
    const lastClaim = gameState.lastClaim;
    
    // Win State Helpers
    const isWinPending = gameState.winPending;
    const potentialWinnerName = isWinPending 
        ? players.find(p => p.id === gameState.potentialWinnerId)?.name 
        : "";
    const isGameFinished = game.status === "finished";
    const winnerName = isGameFinished 
        ? players.find(p => p.id === gameState.winnerId)?.name 
        : "";

    // Vote Counting
    const currentVotes = gameState.truthVotes || [];
    const hasVoted = currentVotes.includes(userId);
    const totalPlayers = players.length;
    const votesNeeded = totalPlayers - 1;
    const votesCount = currentVotes.length;

    // --- HANDLERS ---
    const toggleSelect = (idx) => {
        if (!isMyTurn) return;
        if (selectedIndices.includes(idx)) setSelectedIndices(selectedIndices.filter(i => i !== idx));
        else setSelectedIndices([...selectedIndices, idx]);
    };

    const handlePlay = async () => {
        if (selectedIndices.length === 0) return;
        setIsDeclaring(true);
    };

    const confirmPlay = async (rankToClaim) => {
        // Attempt to generate a ZK proof client-side. If it fails, fall back to legacy submit.
        try {
            const secretSalt = localStorage.getItem('my_salt') || (Math.floor(Math.random()*1e9).toString());
            localStorage.setItem('my_salt', secretSalt);

            const ranks = ["A","2","3","4","5","6","7","8","9","10","J","Q","K"];
            // Map selected cards to numeric ranks expected by the circuit
            const myCards = selectedIndices.map(i => {
                const r = myHand[i]?.rank;
                const idx = ranks.indexOf(r);
                return idx === -1 ? 13 : idx; // 13 for Joker or unknown
            });

            const inputs = {
                playedValues: myCards,
                claimedRank: ranks.indexOf(rankToClaim),
                claimedCount: myCards.length
            };

            const { proof, publicSignals } = await snarkjs.groth16.fullProve(
                inputs,
                "/zk/verifyPlay.wasm",
                "/zk/circuit_final.zkey"
            );

            await playTurn(code, userId, selectedIndices, rankToClaim, { proof: JSON.stringify(proof), publicSignals });
            setIsDeclaring(false);
            // Remove played cards from local copy in localStorage so UI updates immediately
            try {
                const stored = localStorage.getItem('my_hand');
                if (stored) {
                    const parsed = JSON.parse(stored);
                    const remaining = parsed.filter((_, i) => !selectedIndices.includes(i));
                    localStorage.setItem('my_hand', JSON.stringify(remaining));
                }
            } catch (e) {}
            setSelectedIndices([]);
        } catch (e) {
            // Proof generation failed or snarkjs not available — submit legacy move (no proof)
            try {
                await playTurn(code, userId, selectedIndices, rankToClaim);
                setIsDeclaring(false);
                try {
                    const stored = localStorage.getItem('my_hand');
                    if (stored) {
                        const parsed = JSON.parse(stored);
                        const remaining = parsed.filter((_, i) => !selectedIndices.includes(i));
                        localStorage.setItem('my_hand', JSON.stringify(remaining));
                    }
                } catch (e) {}
                setSelectedIndices([]);
            } catch (err) {
                // do nothing
            }
        }
    };

    const handleBS = async () => {
        try {
            if (lastClaim && (lastClaim.proof || lastClaim.publicSignals)) {
                // Verify proof client-side using verification key
                const vKey = await fetch('/zk/verification_key.json').then(r => r.json());
                const proofObj = lastClaim.proof ? JSON.parse(lastClaim.proof) : null;
                if (!proofObj) {
                    // malformed proof -> treat as bluff
                    await callBS(code, userId, { proofValid: false });
                    return;
                }
                const valid = await snarkjs.groth16.verify(vKey, lastClaim.publicSignals, proofObj);
                await callBS(code, userId, { proofValid: valid });
            } else {
                await callBS(code, userId);
            }
        } catch (e) {
            alert("Error calling BS: " + e);
        }
    };

    const handleTruth = async () => {
        try {
            await voteTruth(code, userId);
        } catch (e) {
            console.error(e);
        }
    };

    const handleReturnToMenu = () => {
        router.push("/");
    };

    return (
        <main className={`relative min-h-screen bg-linear-to-tl from-[#9F2A2A] to-[#E04C4C] p-4 select-none flex flex-col items-center overflow-hidden`}>
            
            {/* --- WIN PENDING POPUP --- */}
            {isWinPending && !isGameFinished && (
                 <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-none">
                    <div className="m-25 absolute w-[300] h-[200] md:w-[800] md:h-[400] bg-black/60 z-30 flex flex-col text-center items-center space-y-5 rounded-2xl p-5 border-4 border-white/20">
                        <h1 className="text-white text-xl md:text-3xl text-center font-extrabold mt-2 w-full flex items-center justify-center">
                            DO YOU THINK
                        </h1>
                        <h2 className="text-red-600 text-2xl md:text-5xl text-center font-extrabold w-full flex items-center justify-center">
                            {potentialWinnerName?.toUpperCase()}
                        </h2>
                        <h2 className="text-white text-xl md:text-3xl text-center font-extrabold mb-5 w-full flex items-center justify-center">
                            IS SAYING BS?
                        </h2>

                        {/* Voting Status Indicator */}
                        <div className="text-white/80 font-bold text-lg mb-2">
                            Votes for Truth: {votesCount} / {votesNeeded}
                        </div>

                        <div className="flex flex-col md:flex-row text-white space-y-2 md:space-y-0 md:space-x-5 mt-2">
                            
                            {gameState.potentialWinnerId === userId ? (
                                <p className="text-white text-2xl animate-pulse font-bold border-white/50 border-2 p-4 rounded-xl">
                                    WAITING FOR OPPONENTS...
                                </p>
                            ) : hasVoted ? (
                                <p className="text-green-400 text-2xl font-bold border-green-500/50 border-2 p-4 rounded-xl">
                                    YOU VOTED TRUTH. WAITING...
                                </p>
                            ) : (
                                <>
                                    <button onClick={handleBS} className="w-[250] h-[50] md:w-[300] bg-red-600 hover:bg-red-700 rounded-xl text-2xl md:text-4xl font-bold hover:scale-105 transition-transform shadow-lg">
                                        CLAIM BS
                                    </button>
                                    <button onClick={handleTruth} className="w-[250] h-[50] md:w-[300] bg-blue-600 hover:bg-blue-700 rounded-xl text-2xl md:text-4xl font-bold hover:scale-105 transition-transform shadow-lg">
                                        TELLING TRUTH
                                    </button>
                                </>
                            )}
                        </div>
                    </div>
                 </div>
            )}

            {/* --- WINNER SCREEN --- */}
            {isGameFinished && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-none" onClick={handleReturnToMenu}>
                    <div className="m-25 absolute w-[300] h-[200] md:w-[800] md:h-[400] bg-black/60 z-30 flex flex-col text-center justify-center items-center space-y-5 rounded-2xl cursor-pointer border-4 border-yellow-500/50">
                        <h1 className="text-white text-2xl md:text-5xl text-center font-extrabold mt-5 w-full flex items-center justify-center">
                            WINNER!
                        </h1>
                        <h2 className="text-red-600 text-4xl md:text-6xl text-center font-extrabold mt-5 w-full flex items-center justify-center animate-bounce">
                            {winnerName?.toUpperCase()}
                        </h2>
                        <h2 className="text-white text-2xl md:text-4xl text-center font-extrabold mt-5 w-full flex items-center justify-center">
                            WON THE GAME!
                        </h2>
                        <p className="text-white/50 mt-5 text-lg">Click anywhere to exit</p>
                    </div>
                </div>
            )}

            {/* --- TOP HUD: Opponents & Game Info --- */}
            <div className="flex absolute p-4 w-full justify-between items-start mb-4">
                <div className="flex absolute flex-col">
                    <div className="hidden md:flex flex-col bg-black/40 p-4 rounded-xl text-white text-sm">
                    <div className="flex flex-row justify-between">
                        <h3 className="font-bold mb-2 text-white">PLAYERS</h3>
                        <h3 className="font-bold mb-2 text-white">CARD COUNTS</h3>
                    </div>
                        {players.map((p, i) => (
                            <div key={i} className={`flex justify-between w-40 ${gameState.turnIndex === i ? "text-blue-300 font-bold" : ""}`}>
                                <span>{p.name}</span>
                                <span>{p.hand.length} Cards</span>
                            </div>
                        ))}
                    </div>
                    {showMeter && <div className="flex flex-row justify-between mt-5">
                        <label className="text-white font-bold">NOT BS</label>
                        <label className="text-white font-bold">BS</label>
                    </div>}
                    {showMeter && <div className="w-full bg-gray-200 rounded-full h-4">
                        <div
                            className="bg-green-300 h-4 rounded-full"
                            style={{ width: `${bsValue}%` }}
                        />
                    </div>}
                    <div onClick={showMeter ? hideMeterFunc : showMeterFunc} className="shadow-2xl hover:cursor-pointer hover:scale-110 text-xs md:text-xl bg-[#F30000]/60 rounded-xl p-2 text-white items-center justify-center flex font-bold mt-5">
                        {showMeter ? "Hide Meter" : "Show Meter"}
                    </div>
                </div>

                {/* --- LAST CLAIM NOTIFICATION --- */}
                {lastClaim && !isWinPending && !isGameFinished && (
                   <div className="absolute left-1/2 -translate-x-1/2 flex flex-row justify-center items-center z-20 space-x-5">
                        <div className="bg-black/60 border-2 border-white px-5 py-2 rounded-full text-white font-bold text-xl">
                            {lastClaim.bsResult ? (
                                <span className="text-red-400">{lastClaim.bsResult}</span>
                            ) : (
                                <span>{lastClaim.playerName} played {lastClaim.count} {lastClaim.rank}(s)</span>
                            )}
                        </div>
                        
                        {/* BS BUTTON */}
                        {gameState.bsActive && lastClaim.playerIdx !== myPlayerIndex && !lastClaim.bsResult && (
                            <button 
                                onClick={handleBS}
                                className=" bg-red-600 hover:bg-red-700 text-white font-extrabold py-2 px-5 rounded-xl shadow-2xl text-2xl border-4 border-red-800"
                            >
                                CALL BS!
                            </button>
                        )}
                    </div>
                )}
             </div>

            <div className="flex flex-col items-center justify-center mt-20">
                <div className="relative">
                    {/* Center Card */}
                    <div className="opacity-90">
                         {gameState.discardPile.length > 0 ? (
                            <Card card={gameState.centerCard} isCenter={true}/>
                         ) : (
                            <div className="w-32 h-48 border-4 border-white/20 rounded-xl flex items-center justify-center text-white/50 font-bold">
                                PILE EMPTY
                            </div>
                         )}
                    </div>
                </div>
                
                <div className="mt-6 text-center">
                    <p className="text-white/70 text-lg font-bold">CURRENT TARGET RANK</p>
                    <p className="text-6xl font-extrabold text-white drop-shadow-lg">{targetRank}</p>
                </div>
            </div>

            {/* --- DECLARATION MODAL --- */}
            {isDeclaring && (
                <div className="fixed inset-0 bg-black/80 z-50 flex items-center justify-center">
                    <div className="bg-white p-8 rounded-2xl text-center">
                        <h2 className="text-2xl font-bold mb-4 text-black">Confirm Play</h2>
                        <p className="mb-6 text-black">Play {selectedIndices.length} card(s) as <b>{targetRank}</b>?</p>
                        <div className="flex gap-4 justify-center">
                            <button onClick={() => confirmPlay(targetRank)} className="bg-green-600 text-white px-6 py-3 rounded-lg font-bold cursor-pointer">
                                YES, PLAY
                            </button>
                            <button onClick={() => setIsDeclaring(false)} className="bg-gray-400 text-white px-6 py-3 rounded-lg font-bold cursor-pointer">
                                CANCEL
                            </button>
                        </div>
                    </div>
                </div>
            )}

            <div className="w-full absolute bottom-0 pt-4 border-white/10 pb-4">
                <div className="flex justify-center mb-4">
                    {isMyTurn ? (
                        <button 
                            disabled={selectedIndices.length === 0}
                            onClick={handlePlay}
                            className={`px-10 py-3 rounded-xl font-bold text-xl shadow-lg transition-all mb-6 ${
                                selectedIndices.length > 0 
                                ? "bg-blue-500 text-white hover:scale-105" 
                                : "bg-gray-600 text-gray-400 cursor-not-allowed"
                            }`}
                        >
                            {selectedIndices.length > 0 ? "PLAY SELECTED" : "SELECT CARDS"}
                        </button>
                    ) : (
                        <div className="text-white text-xl font-bold animate-pulse">
                             Waiting for {players[gameState.turnIndex].name}...
                        </div>
                    )}
                </div>

                {/* Hand Display */}
                <div className="flex justify-center -space-x-12 px-10 pb-2">
                    {myHand.map((card, idx) => (
                        <Card 
                            key={idx} 
                            card={card} 
                            isSelected={selectedIndices.includes(idx)} 
                            onSelect={() => toggleSelect(idx)}
                        />
                    ))}
                </div>
            </div>
        </main>
    );
}
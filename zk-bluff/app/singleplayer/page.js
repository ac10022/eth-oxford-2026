"use client";

import { useState, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { encodeGameState, decodeGameState } from '@/lib/xor';

export default function offline() {
    const router = useRouter();
    const searchParams = useSearchParams();

    const [joker, setJoker] = useState(false);
    const [aiPlayer, setAiPlayer] = useState(false);
    const [settings, setSettings] = useState(false);

    const [players, setPlayerNum] = useState(3);
    const [popup, setPopup] = useState(false);
    const [winPopup, setWinPopup] = useState(false);
    const [winConst, setWinConst] = useState(false);
    const [winScreen, setWinScreen] = useState(false);
    const [playerNames, setPlayerNames] = useState(["Player 1", "Player 2", "Player 3", "Player 4", "Player 5", "Player 6", "Player 7", "Player 8"]);
    const [tempName, setTempName] = useState("");
    const [index, setIndex] = useState(0);

    const [savedGameState, setSavedGameState] = useState(null);
    
    const [bsResultPopup, setBsResultPopup] = useState(null); 
    const [bsResultPopupConditional, setBsResultPopupConditional] = useState(false); 
    const [blameModalOpen, setBlameModalOpen] = useState(false);

    const popupOpener = () => {
        setPopup(true);
    }

    useEffect(() => {
        const data = searchParams.get("data");
        if (data) {
            const decrypted = decodeGameState(data);
            if (decrypted) {
                if (decrypted.ai) {
                    setAiPlayer(true);
                }
                setPlayerNames(decrypted.names);
                setPlayerNum(decrypted.count);
                setSavedGameState(decrypted);
            }
        }
    }, [searchParams]);

    const setSettingsFunc = () => {
        setSettings(true);
    }

    const setSettingsBackFunc = () => {
        setSettings(false);
    }

    const addJokers = () => {
        setJoker(true);
    }

    const removeJokers = () => {
        setJoker(false);
    }

    const addAi = () => {
        setAiPlayer(true);
    }

    const removeAi = () => {
        setAiPlayer(false);
    }

    const uiChange = () => {
        const num = index;
        const name = tempName;
        if (name != "")
            {setPlayerNames(prev =>
                prev.map((names, i) => (i === num - 1 ? name : names))
            );}
        setTempName("");
        setPopup(false);
    }

    const cancelName = () => {
        setPopup(false);
    }

    const changeName = (num) => {
        setIndex(num);
        setTempName(playerNames[num - 1])
        popupOpener();
    }

    const addPlayer = () => {
        if (aiPlayer && players < 7) setPlayerNum(players + 1);
        else if (!(aiPlayer) && players < 8) setPlayerNum(players + 1);
    };

    const removePlayer = () => {
        if (players > 3) setPlayerNum(players - 1);
    };

    const getLastClaimText = () => {
        if (!savedGameState || !savedGameState.lastClaim) return null;
        const claim = savedGameState.lastClaim;
        
        if (Array.isArray(claim)) {
            const idx = claim[0];
            const name = playerNames[idx] || `Player ${idx + 1}`;
            return `${name} claimed: ${claim[1]} ${claim[2]}(s)`.toUpperCase();
        }

        return claim;
    };

    const getNextPlayerID = () => {
        if (!savedGameState || !savedGameState.lastClaim) return null;
        const claim = savedGameState.lastClaim;
        if (Array.isArray(claim)) {
        const idx = claim[0];
        if (idx + 1 === savedGameState.names.length){
            return 0;
        }
        return idx + 1;
        }
    };

    const onClaimBS = () => {
        const claimData = savedGameState?.lastClaim
        const actualClaimData = savedGameState?.actualClaim

        if (Array.isArray(claimData) && claimData.length === 3) {
            const [claimerNumber, cardClaimCount, cardClaimRank] = claimData;
            const claimerName = playerNames[claimerNumber];
            
            // Logic to check if truthful
            let wasTruthful = true;
            let tally = 0;
            for (let index = 0; index < actualClaimData.length; index++) {
                const element = actualClaimData[index];
                if (element.rank == cardClaimRank || element.rank == "Joker") {
                    tally++;
                } else {
                    wasTruthful = false;
                }
            }
            if (wasTruthful) wasTruthful = tally === cardClaimCount;

            if (wasTruthful) {
                const lastPlayerIndex = (savedGameState.nextIndex - 1 + savedGameState.count) % savedGameState.count;

                if (savedGameState.allHands[lastPlayerIndex].length === 0){
                    setWinPopup(false);
                    setWinScreen(true);
                } else {
                    setBsResultPopup({
                        message: `${claimerName} was NOT bluffing!`,
                        sub: "Who called BS? They must pick up the pile.",
                        type: 'neutral'
                    });
                    setBlameModalOpen(true);
                }
            }
            else {
                setBsResultPopup({
                    message: `${claimerName} WAS bluffing!`,
                    sub: "They must pick up the discard pile.",
                    type: 'good',
                    onConfirm: () => applyPenalty(claimerNumber, `${claimerName} BS'ed! Picked up`)
                });

                // wait for confirmation
                setBsResultPopupConditional(true);
            }
        }
    }

    const handleBlameSelect = (blamerIndex) => {
        const blamerName = playerNames[blamerIndex];
        const claimerIndex = savedGameState.lastClaim[0];
        const claimerName = playerNames[claimerIndex];
        
        setBsResultPopup({
            message: `${claimerName} TOLD THE TRUTH!`,
            sub: `${blamerName} receives the punishment.`,
            type: 'bad',
            onConfirm: () => applyPenalty(blamerIndex, `${claimerName} was honest! ${blamerName} picked up`)
        });
        
        // wait for confirmation
        setBsResultPopupConditional(true);
    }

    const applyPenalty = (victimIndex, messagePrefix) => {
        if (!savedGameState) return;

        const pile = savedGameState.discardPile || [];
        const newAllHands = [...savedGameState.allHands];
        
        newAllHands[victimIndex] = [...newAllHands[victimIndex], ...pile];

        const newState = {
            ...savedGameState,
            allHands: newAllHands,
            discardPile: [], 
            centerCard: null, 
            lastClaim: `${messagePrefix} ${pile.length} cards.`, 
            names: playerNames,
            ai: aiPlayer,
        };

        const encryptedData = encodeGameState(newState);
        const params = new URLSearchParams();
        params.set("data", encryptedData);
        if (joker == true)  {
            router.push(`/devgame-jokergame?${params.toString()}`);
        }
        else if (aiPlayer == true) {
            router.push(`/devgame-ai?${params.toString()}`);
        }
        else {router.push(`/devgame?${params.toString()}`);}
    }

    const onStartGame = () => {
        let activePlayerNames = playerNames.slice(0, players);
        let gameState = {};
        if (aiPlayer) {
            activePlayerNames[players] = "AI Player";
            gameState = {
                count: players+1,
                nextIndex: 0,
                allHands: "", 
                centerCard: "",
                lastClaim: "",
                actualClaim: "",
                names: activePlayerNames,
                discardPile: [],
                ai: true,
            };
        }
        else {        
            gameState = {
                count: players,
                nextIndex: 0,
                allHands: "", 
                centerCard: "",
                lastClaim: "",
                actualClaim: "",
                names: activePlayerNames,
                discardPile: [],
                ai: false,
            };
        }

        if (savedGameState && savedGameState.allHands && savedGameState.count === players) {
            gameState = {
                ...savedGameState,
                names: activePlayerNames 
            };
        }

        const encryptedData = encodeGameState(gameState);
        const params = new URLSearchParams();
        params.set("data", encryptedData);
        if (joker == true)  {
            router.push(`/devgame-jokergame?${params.toString()}`);
        }
        else if (aiPlayer == true) {
            router.push(`/devgame-ai?${params.toString()}`);
        }
        else {router.push(`/devgame?${params.toString()}`);}

    };

    const setWinFunc = () => {
        if (winPopup === false){
        setWinPopup(true);}
    }

    useEffect(() => {if (savedGameState !== null && winConst === false){
                    if (savedGameState.allHands[savedGameState.nextIndex -1] !== undefined)
                        {if (savedGameState.allHands[savedGameState.nextIndex - 1].length === 0){
                            setWinConst(true);
                            setWinFunc();
                            }}   
                        }}, [savedGameState, winPopup])

    return (
        <div className="flex min-h-screen items-center justify-center overflow-auto bg-linear-to-tl bg-radial from-[#BA2237] from-30% to-[#261447] select-none relative">
            
            {settings && <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm">
                <div className="bg-white/40 outline-4 outline-white p-8 rounded-2xl text-center max-w-lg flex flex-col items-center space-y-10">
                    <h1 className="text-5xl text-white font-bold">SETTINGS</h1>
                    <div className="flex flex-row space-x-5 items-center justify-between w-[200]">
                        <label className="text-white font-bold text-sm md:text-xl ml-1">ADD AI</label>
                        <input type="checkbox" defaultChecked={aiPlayer} onClick={(e) => {if (e.target.checked) {addAi()} else {removeAi()}}} className="cursor-pointer size-5 border-2 border-white accent-[#F30000]/60 checked:text-white"></input>
                    </div>
                    <div className="flex flex-row space-x-5 items-center justify-between w-[200]">
                        <label className="text-white font-bold text-sm md:text-xl ml-1">ADD JOKER</label>
                        <input type="checkbox" defaultChecked={joker} onClick={(e) => {if (e.target.checked) {addJokers()} else {removeJokers()}}} className="cursor-pointer size-5 border-2 border-white accent-[#F30000]/60 checked:text-white"></input>
                    </div>
                    <button onClick={setSettingsBackFunc} className="cursor-pointer text-white text-2xl p-2 font-bold bg-[#F30000]/60 rounded-xl ">BACK BUTTON</button>
                    </div>
                </div>}

            {/* BS RESULT POPUP */}
            {bsResultPopupConditional && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm">
                    <div className="bg-white p-8 rounded-2xl text-center max-w-lg flex flex-col items-center gap-4">
                        <h2 className="text-4xl font-extrabold text-black mb-2">{bsResultPopup.message}</h2>
                        <p className="text-xl text-gray-700 font-bold mb-4">{bsResultPopup.sub}</p>
                        
                        <button 
                            onClick={() => {
                                if (bsResultPopup.onConfirm) bsResultPopup.onConfirm();
                                setBsResultPopupConditional(false);
                            }}
                            className="bg-black text-white font-bold py-3 px-8 rounded-xl text-xl hover:scale-105 transition-transform"
                        >
                            CONTINUE
                        </button>
                    </div>
                </div>
            )}

            {/* BLAME SELECTOR MODAL */}
            {blameModalOpen && (
                <div className="fixed inset-0 z-30 flex flex-col items-center justify-center bg-black/90 backdrop-blur-md">
                    <h2 className="text-white text-3xl font-bold mb-8">WHO CALLED BS?</h2>
                    {aiPlayer && (<div className="flex flex-wrap gap-4 justify-center max-w-4xl">
                        {playerNames.slice(0, players-1).map((name, i) => {
                            if (savedGameState && savedGameState.lastClaim && i === savedGameState.lastClaim[0]) return null;
                            
                            return (
                                <button 
                                    key={i}
                                    onClick={() => {
                                        if (bsResultPopup?.type !== "good") {
                                            handleBlameSelect(i);
                                            setBlameModalOpen(false);
                                        } else {
                                            setBsResultPopupConditional(true);
                                        }
                                    }}
                                    className="bg-red-600 hover:bg-red-500 text-white font-bold py-4 px-8 rounded-xl text-2xl transition-transform hover:scale-110 cursor-pointer"
                                >
                                    {name}
                                </button>
                            )
                        })}
                    </div>)}
                    {!aiPlayer && (<div className="flex flex-wrap gap-4 justify-center max-w-4xl">
                        {playerNames.slice(0, players).map((name, i) => {
                            if (savedGameState && savedGameState.lastClaim && i === savedGameState.lastClaim[0]) return null;
                            
                            return (
                                <button 
                                    key={i}
                                    onClick={() => {
                                        if (bsResultPopup?.type !== "good") {
                                            handleBlameSelect(i);
                                            setBlameModalOpen(false);
                                        } else {
                                            setBsResultPopupConditional(true);
                                        }
                                    }}
                                    className="bg-red-600 hover:bg-red-500 text-white font-bold py-4 px-8 rounded-xl text-2xl transition-transform hover:scale-110 cursor-pointer"
                                >
                                    {name}
                                </button>
                            )
                        })}
                    </div>)}
                </div>
            )}

            {/* NAME EDIT POPUP */}
            {popup && <div className="m-25 absolute w-[300] h-[200] md:w-[800] md:h-[400] bg-black/40 z-30 flex flex-col justify-center items-center space-y-5 md:space-y-20 rounded-2xl">
                <h1 className="text-white text-2xl md:text-5xl text-center font-extrabold">ENTER PLAYER {index}'S NAME: </h1>
                <input className="p-4 rounded-xl bg-white/10 border border-white/20 text-white text-xl focus:outline-4 outline-white focus:border-white w-[125] h-[25] md:w-[250] md:h-[50] md:text-3xl text-center font-bold" placeholder="ENTER NAME" onChange={(e) => setTempName(e.target.value)} value={"" || tempName}>
                </input>
                <div className="flex flex-row space-x-5">
                    <button onClick={uiChange} className="disabled:cursor-not-allowed h-[30] w-[75] md:w-[150] md:h-[50] justify-center items-center flex text-white text-xl md:text-4xl font-bold rounded-lg md:rounded-2xl bg-[#F30000]/60 cursor-pointer">
                        SUBMIT
                    </button>
                    <button onClick={cancelName} className="disabled:cursor-not-allowed h-[30] w-[75] md:w-[150] md:h-[50] justify-center items-center flex text-white text-xl md:text-4xl font-bold rounded-lg md:rounded-2xl bg-[#F30000]/60 cursor-pointer">
                        CANCEL
                    </button>
                </div>
            </div>}

            {winPopup && <div className="m-25 absolute w-[300] h-[200] md:w-[800] md:h-[400] bg-black/60 z-30 flex flex-col text-center items-center space-y-5 rounded-2xl">
                <h1 className="text-white text-2xl md:text-5xl text-center font-extrabold mt-5 w-full flex items-center justify-center">DO YOU THINK</h1>
                <h2 className="text-red-600 text-2xl md:text-4xl text-center font-extrabold mt-5 w-full flex items-center justify-center">{playerNames[savedGameState.nextIndex - 1].toUpperCase()}</h2>
                <h2 className="text-white text-2xl md:text-4xl text-center font-extrabold mt-5 w-full flex items-center justify-center">IS SAYING BS?</h2>
                <div className="flex flex-row text-white space-x-5">
                <button onClick={onClaimBS} className="w-[300] h-[50] bg-[#F30000]/60 rounded-xl text-4xl font-bold">CLAIM BS</button>
                <button onClick={() => {setWinScreen(true); setWinPopup(false)}} className="w-[300] h-[50] bg-[#F30000]/60 rounded-xl text-4xl font-bold">TELLING TRUTH</button>
                </div>
            </div>}

            {winScreen && <div onClick={() => router.push(`/game-mode`)} className="m-25 absolute w-[300] h-[200] md:w-[800] md:h-[400] bg-black/60 z-30 flex flex-col text-center justify-center items-center space-y-5 rounded-2xl">
                <h1 className="text-white text-2xl md:text-5xl text-center font-extrabold mt-5 w-full flex items-center justify-center">WINNER!</h1>
                <h2 className="text-red-600 text-2xl md:text-4xl text-center font-extrabold mt-5 w-full flex items-center justify-center">{playerNames[savedGameState.nextIndex - 1].toUpperCase()}</h2>
                <h2 className="text-white text-2xl md:text-4xl text-center font-extrabold mt-5 w-full flex items-center justify-center">WON!</h2>
            </div>}
            
            <main className={`min-w-[300] md:min-w-[1100] flex flex-col justify-center items-center p-5 rounded-2xl bg-black/30 sm:items-start z-10 ${popup || winPopup || winScreen ? "blur" : "bg-black/30"}`}>

                <div className={`${!(savedGameState && players === savedGameState.count) ? "grid grid-cols-3" : "flex"} w-full items-center`}>
                    <div className="flex md:flex-row flex-col md:space-x-5 md:space-y-0 space-y-2 justify-start">
                        {!(savedGameState && players === savedGameState.count) &&<div className="shadow-2xl hover:cursor-pointer hover:scale-110 w-[90] h-[30] md:w-[160] md:h-[50] bg-[#F30000]/60 rounded-xl p text-white items-center justify-center flex font-bold text-xs md:text-xl" onClick={addPlayer}>
                            ADD PLAYER
                        </div>}
                        {!(savedGameState && players === savedGameState.count) &&<div className="shadow-2xl hover:cursor-pointer hover:scale-110 w-[90] h-[30] md:w-[160] md:h-[50] bg-[#F30000]/60 rounded-xl p text-white items-center justify-center flex font-bold text-xs md:text-xl" onClick={removePlayer}>
                            REMOVE PLAYER
                        </div>}
                    </div>
                    
                    <div className="flex flex-row grow items-center justify-center space-x-5">
                        {/* LAST CLAIM DISPLAY */}
                        {savedGameState && players === savedGameState.count && (
                             <div className="mb-2 px-6 py-2 rounded-lg bg-black/20 border border-white/10">
                                <h2 className="text-blue-500 font-bold text-xl md:text-xl text-center">
                                    {getLastClaimText()}
                                </h2>
                             </div>
                        )}

                        {!(savedGameState && players === savedGameState.count) &&<h1 className="text-white text-xl md:text-5xl font-bold items-center flex justify-center">
                            GAME SETUP:
                        </h1>}
                    </div>

                    <div className={`flex ${!(savedGameState && players === savedGameState.count) ? "justify-end" : "justify-center items-center w-full"} md:mr-5 space-x-3`}>
                        {!(savedGameState && players === savedGameState.count) && <div onClick={setSettingsFunc} className="shadow-2xl hover:cursor-pointer hover:scale-110 w-[90] h-[30] text-xs md:text-2xl md:w-[160] md:h-[50] bg-[#F30000]/60 rounded-xl p-2 text-white items-center justify-center flex font-bold">
                            SETTINGS
                        </div>}
                        <div className={`shadow-2xl hover:cursor-pointer hover:scale-110 ${!(savedGameState && players === savedGameState.count) ? "w-[90] h-[30] text-xs md:text-2xl md:w-[160] md:h-[50]" : "w-[90] h-[30] text-xs md:w-[160] md:h-[50] md:text-4xl"} bg-[#F30000]/60 rounded-xl p-2 text-white items-center justify-center flex font-bold`} onClick={onStartGame}>
                            {savedGameState && players === savedGameState.count ? "RESUME" : "START GAME"}
                        </div>
                        {(savedGameState && players === savedGameState.count) && <div className={`ml-4 shadow-2xl hover:cursor-pointer hover:scale-110 ${!(savedGameState && players === savedGameState.count) ? "w-[90] h-[30] text-xs md:text-2xl md:w-[160] md:h-[50]" : "w-[90] h-[30] text-xs md:w-[160] md:h-[50] md:text-4xl"} bg-blue-900 rounded-xl p-2 text-white items-center justify-center flex font-bold`} onClick={onClaimBS}>
                            CLAIM BS
                        </div>}
                    </div>
                </div>

                <div className="flex flex-col md:flex-row space-y-5 md:space-x-5 mt-5">
                     <div className="flex md:flex-col flex-row space-x-5 md:space-x-0 md:space-y-5">
                        <div className={`hover:cursor-pointer hover:scale-105 w-[125] h-[100] md:w-[250] md:h-[200] bg-[#F30000]/60 rounded-2xl text-white flex flex-col justify-center items-center font-bold text-2xl ${getNextPlayerID() === 0 ? "outline-4 outline-red-500":""}`} onClick={() => (savedGameState && players === savedGameState.count) ? undefined : changeName(1)}>
                            {playerNames[0]}
                            <p className="text-xl text-white/70">Host</p>
                        </div>
                        <div className={`hover:cursor-pointer hover:scale-105 w-[125] h-[100] md:w-[250] md:h-[200] bg-[#F30000]/60 rounded-2xl text-white flex justify-center items-center font-bold text-2xl ${getNextPlayerID() === 1 ? "outline-4 outline-red-500":""}`} onClick={() => (savedGameState && players === savedGameState.count) ? undefined : changeName(2)}>
                            {playerNames[1]}
                        </div>
                    </div>
                    <div className="flex md:flex-col flex-row space-x-5 md:space-x-0 md:space-y-5">
                        <div className={`hover:cursor-pointer hover:scale-105 w-[125] h-[100] md:w-[250] md:h-[200] bg-[#F30000]/60 rounded-2xl text-white flex justify-center items-center font-bold text-2xl ${getNextPlayerID() === 2 ? "outline-4 outline-red-500":""}`} onClick={() => (savedGameState && players === savedGameState.count) ? undefined : changeName(3)}>
                            {playerNames[2]}
                        </div>
                        {players >= 4 && <div className={`hover:cursor-pointer hover:scale-105 w-[125] h-[100] md:w-[250] md:h-[200] bg-[#F30000]/60 rounded-2xl text-white flex justify-center items-center font-bold text-2xl ${getNextPlayerID() === 3 ? "outline-4 outline-red-500":""}`} onClick={() => (savedGameState && players === savedGameState.count) ? undefined : changeName(4)}>
                            {playerNames[3]}
                        </div>}
                    </div>
                    <div className="flex md:flex-col flex-row space-x-5 md:space-x-0 md:space-y-5">
                        {players >= 5 && <div className={`hover:cursor-pointer hover:scale-105 w-[125] h-[100] md:w-[250] md:h-[200] bg-[#F30000]/60 rounded-2xl text-white flex justify-center items-center font-bold text-2xl ${getNextPlayerID() === 4 ? "outline-4 outline-red-500":""}`} onClick={() => (savedGameState && players === savedGameState.count) ? undefined : changeName(5)}>
                            {playerNames[4]}
                        </div>}
                        {players >= 6 && <div className={`hover:cursor-pointer hover:scale-105 w-[125] h-[100] md:w-[250] md:h-[200] bg-[#F30000]/60 rounded-2xl text-white flex justify-center items-center font-bold text-2xl ${getNextPlayerID() === 5 ? "outline-4 outline-red-500":""}`} onClick={() => (savedGameState && players === savedGameState.count) ? undefined : changeName(6)}>
                            {playerNames[5]}
                        </div>}
                    </div>
                    <div className="flex md:flex-col flex-row space-x-5 md:space-x-0 md:space-y-5">
                        {players >= 7 && <div className={`hover:cursor-pointer hover:scale-105 w-[125] h-[100] md:w-[250] md:h-[200] bg-[#F30000]/60 rounded-2xl text-white flex justify-center items-center font-bold text-2xl ${getNextPlayerID() === 6 ? "outline-4 outline-red-500":""}`} onClick={() => (savedGameState && players === savedGameState.count) ? undefined : changeName(7)}>
                            {playerNames[6]}
                        </div>}
                        {(!(aiPlayer) && players >= 8) && <div className={`hover:cursor-pointer hover:scale-105 w-[125] h-[100] md:w-[250] md:h-[200] bg-[#F30000]/60 rounded-2xl text-white flex justify-center items-center font-bold text-2xl ${getNextPlayerID() === 7 ? "outline-4 outline-red-500":""}`} onClick={() => (savedGameState && players === savedGameState.count) ? undefined : changeName(8)}>
                            {playerNames[7]}
                        </div>}
                    </div>
                </div>
            </main>
        </div>
    );
}
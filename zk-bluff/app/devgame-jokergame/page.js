"use client"

import { useEffect, useState } from "react"
import Card from "@/components/card"
import { createDeck, shuffleDeck } from "@/lib/deck"
import { useSearchParams } from "next/navigation";
import { useRouter } from 'next/navigation';
import { encodeGameState, decodeGameState } from '@/lib/xor';

export default function Home() {
  const router = useRouter();
  const searchParams = useSearchParams(); 

  // --- STATE ---
  const [hand, setHand] = useState([])
  const [centerCard, setCenterCard] = useState(null) 
  const [discardPile, setDiscardPile] = useState([]) 
  const [targetRank, setTargetRank] = useState("A") 
  const [allHands, setAllHands] = useState([])
  const [curPlayerIndex, setCurPlayerIndex] = useState(0)
  const [selectedIndices, setSelectedIndices] = useState([])
  
  const [lastClaim, setLastClaim] = useState("")
  const [isDeclaring, setIsDeclaring] = useState(false)
  const [isFirstTurn, setIsFirstTurn] = useState(true)

  const [playerNames, setPlayerNames] = useState(["Host"]);
  const [playerCount, setPlayerCount] = useState(3);

  // --- CONSTANTS ---
  const ranks = ["A", "2", "3", "4", "5", "6", "7", "8", "9", "10", "J", "Q", "K"]
  
  const getNextRank = (currentRank) => {
     if (!currentRank) return "A"; 
     const idx = ranks.indexOf(currentRank);
     return ranks[(idx + 1) % ranks.length];
  }

  // --- GAME SETUP ---
  const dealCards = (playerCount) => {
    const deck = createDeck(true)
    const shuffled = shuffleDeck(deck)
    const players = playerCount
    const cardsPerPlayer = Math.floor(53 / players)

    const hands = []
    for (let index = 0; index < players; index++) {
        hands.push(shuffled.splice(-cardsPerPlayer))
    }

    const center = shuffled.pop()
    let playerNum = 0
    for (const card of shuffled) { 
        hands[playerNum].push(card)
        playerNum = (playerNum + 1) % players
    }

    return { hands, centerCard: center, initialPile: [center] }
  }

  // --- INTERACTION ---
  const toggleSelectCard = (index) => {
    let newIndices
    if (selectedIndices.includes(index)) {
      newIndices = selectedIndices.filter(i => i !== index)
    } else {
      newIndices = [...selectedIndices, index]
    }
    setSelectedIndices(newIndices)
    if (newIndices.length === 0) setIsDeclaring(false)
  }

  const handleSubmit = () => {
    setIsDeclaring(true)
  }

  // --- CORE LOGIC ---

  const confirmClaim = (claimedRank) => {
    if (selectedIndices.length === 0) {
      setIsDeclaring(false)
      return
    }

    const cardsToRemove = selectedIndices.length
    
    const playerClaim = hand.filter((_, idx) => selectedIndices.includes(idx))
    const newHand = hand.filter((_, idx) => !selectedIndices.includes(idx))
    
    const newAllHands = [...allHands]
    newAllHands[curPlayerIndex] = newHand

    const newCenterCard = { ...centerCard, rank: claimedRank };
    const newDiscardPile = [...discardPile, ...playerClaim];

    const nextTargetRank = getNextRank(claimedRank);

    const playerName = playerNames[curPlayerIndex] || `Player ${curPlayerIndex + 1}`;
    const claimMsg = `${playerName} claimed ${cardsToRemove} ${claimedRank}(s)`;
    
    setHand(newHand)
    setAllHands(newAllHands)
    setCenterCard(newCenterCard)
    setDiscardPile(newDiscardPile)
    setLastClaim(claimMsg)
    setSelectedIndices([])
    setIsDeclaring(false)
    
    const newClaimArray = [curPlayerIndex, cardsToRemove, claimedRank]
    
    goBackToMenuForNextTurn(newAllHands, newCenterCard, newClaimArray, nextTargetRank, playerClaim, newDiscardPile)
  }

  const goBackToMenuForNextTurn = (updatedAllHands, updatedCenterCard, updatedLastClaim, updatedTargetRank, actualClaim, updatedDiscardPile) => {
    
    const gameState = {
      count: playerCount,
      nextIndex: (curPlayerIndex + 1) % playerCount,
      allHands: updatedAllHands,     
      centerCard: updatedCenterCard, 
      lastClaim: updatedLastClaim,   
      targetRank: updatedTargetRank,
      actualClaim: actualClaim,
      names: playerNames,
      discardPile: updatedDiscardPile 
    };

    const encryptedData = encodeGameState(gameState);
    
    const params = new URLSearchParams();
    params.set("data", encryptedData);
    
    router.push(`/singleplayer?${params.toString()}`);
  }

  // --- LOAD GAME DATA ---
  useEffect(() => {
    const data = searchParams.get("data");
    if (data) {
      const decrypted = decodeGameState(data);
      if (decrypted) {
        localStorage.setItem("game-state", data);

        setPlayerNames(decrypted.names);
        setPlayerCount(decrypted.count);

        if (!decrypted.allHands || decrypted.allHands === "") { 
          // Fresh Game
          const { hands, centerCard, initialPile } = dealCards(decrypted.count);
          setAllHands(hands);
          setCenterCard(centerCard);
          setDiscardPile(initialPile);
          setHand(hands[0]);
          setTargetRank(getNextRank(centerCard.rank))
          setIsFirstTurn(true);
        } else { 
          // Existing Game
          setAllHands(decrypted.allHands);
          setCenterCard(decrypted.centerCard);
          setDiscardPile(decrypted.discardPile || []); 

          // Handle Last Claim Message
          if (Array.isArray(decrypted.lastClaim)) {
             // Reconstruct string for display
             const pIdx = decrypted.lastClaim[0];
             const pName = decrypted.names[pIdx] || `Player ${pIdx + 1}`;
             setLastClaim(`${pName} claimed ${decrypted.lastClaim[1]} ${decrypted.lastClaim[2]}(s)`);
          } else {
             setLastClaim(decrypted.lastClaim);
          }

          setCurPlayerIndex(decrypted.nextIndex);
          setHand(decrypted.allHands[decrypted.nextIndex]);
          
          setTargetRank(decrypted.targetRank || "A"); 
          setIsFirstTurn(false);
        }
      }
    } else {
        // Fallback for dev testing
        const { hands, centerCard, initialPile } = dealCards(playerCount)
        setAllHands(hands)
        setCenterCard(centerCard)
        setDiscardPile(initialPile)
        setHand(hands[0])
        setTargetRank("A")
    }
  }, [searchParams]);

  return (
    
    <main className="min-h-screen bg-linear-to-tl from-[#9F2A2A] to-[#E04C4C] p-6 select-none flex flex-col items-center relative">

      {/* DECLARATION POPUP */}
      {isDeclaring && selectedIndices.length > 0 && (
        <div className="p-2 bg-black/70  w-[300] md:w-[550] rounded-xl shadow-xl flex flex-col items-center gap-4 fixed z-50 top-1/3">
          <p className="font-bold text-white text-2xl text-center">
            YOU ARE PLAYING <span className="text-red-600">{selectedIndices.length}</span> CARD(S).
          </p>
          <p className="text-white text-sm font-bold text-center">
             The required rank is <b className="font-extrabold text-red-600">{targetRank}</b>. 
          </p>
          
          <div className="flex gap-2 flex-wrap justify-center max-w-md">
            <button 
                onClick={() => confirmClaim(targetRank)}
                className="bg-green-600 text-white px-8 py-3 rounded-lg font-bold hover:bg-green-700 transition-colors shadow-lg text-xl"
              >
                CLAIM AS {targetRank}?
            </button>
          </div>

          <button 
            onClick={() => setIsDeclaring(false)}
            className="mt-4 text-red-500 font-bold text-2xl hover:text-red-700 hover:cursor-pointer" 
          >
            CANCEL SELECTION
          </button>
        </div>
      )}
    <div className="flex flex-col text-center">
      <h1 className="text-white text-3xl mb-4 font-bold">{playerNames[curPlayerIndex]?.toUpperCase()}'S TURN</h1>

      {/* CLAIM DISPLAY */}
      {lastClaim && (
        <div className="mb-2 bg-black/30 px-6 py-2 rounded-full border border-white/20 text-white animate-pulse font-bold text-center">
          {lastClaim.toUpperCase()}
        </div>
      )}

      {/* CENTER CARD & TARGET INFO */}
      <div className="flex flex-col items-center gap-2 mb-8 p-4 bg-black/10 rounded-xl">
        <span className="text-white font-bold text-lg">
            {discardPile.length === 0 ? "PILE EMPTY" : (isFirstTurn ? "START THE GAME" : "DISCARD PILE")}
        </span>
        
        <div className={discardPile.length === 0 ? "opacity-20" : "opacity-100"}>
            <Card card={centerCard} isCenter={true} faceDown={!isFirstTurn && discardPile.length > 0} />
        </div>
        
        <div className="flex flex-col items-center mt-2">
            <p className="text-white/60 text-sm">TARGET RANK FOR YOU:</p>
            <p className="text-3xl font-extrabold text-blue-300">
                {targetRank}
            </p>
        </div>
      </div>

      {/* PLAYER CARD COUNT DISPLAY (SIDEBAR) */}
      <div className="md:absolute md:right-4 md:top-4 mb-5 bg-black/40 p-4 rounded-xl text-white">
        <h3 className="font-extrabold mb-2">CARD COUNTS</h3>
        <ul>
          {allHands.map((h, i) => (
            <li key={i} className={`flex justify-between gap-4 ${i === curPlayerIndex ? "text-blue-300 font-bold" : "text-white/80"}`}>
                <span>{playerNames[i] || `P${i+1}`}:</span>
                <span>{h ? h.length : 0}</span>
            </li>
          ))}
        </ul>
      </div>
    </div>

      {/* BUTTONS */}
      <div className="flex gap-4 mb-4">
        {!isDeclaring && (
          <button
            className={`rounded px-6 py-2 font-bold shadow-md transition-all text-white ${
              selectedIndices.length > 0 
                ? "bg-blue-400 text-black hover:scale-105 cursor-pointer" 
                : "bg-gray-800 text-gray-300 cursor-not-allowed opacity-50"
            }`}
            onClick={handleSubmit}
            disabled={selectedIndices.length === 0}
          >
            SELECT CARDS ({selectedIndices.length})
          </button>
        )}
      </div>

      {/* HAND */}
      <div className="flex justify-center -space-x-10 transition-all duration-300 max-w-full overflow-x-auto py-5 mt-auto w-full ">
        {hand.map((card, index) => (
          <Card 
            key={`${curPlayerIndex}-${index}`} 
            card={card} 
            isSelected={selectedIndices.includes(index)}
            onSelect={() => toggleSelectCard(index)}
          />
        ))}
      </div>
    </main>
  )
}
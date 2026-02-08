import { db } from "./firebase";
import { doc, getDoc, setDoc, updateDoc, arrayUnion, onSnapshot, runTransaction } from "firebase/firestore";
import { createDeck, shuffleDeck } from "./deck";

// JOINING & LOBBY

export const joinGameRoom = async (gameCode, playerName, userId) => {
  const gameRef = doc(db, "games", gameCode);
  const gameSnap = await getDoc(gameRef);

  if (!gameSnap.exists()) {
    // Create a new game if none exists
    await setDoc(gameRef, {
      code: gameCode,
      status: "waiting",
      hostId: userId,
      createdAt: Date.now(),
      players: [{
        id: userId,
        name: playerName,
        hand: [],
        isHost: true,

        bluffAccusationCounter: 0,
        successfulBluffCalls: 0,
        bluffCounter: 0,
        successfulBluffCounter: 0
      }],
      gameState: null
    });
  } else {
    // Join existing game
    const data = gameSnap.data();
    if (data.status !== "waiting") throw new Error("Game already started");
    if (data.players.length >= 10){return (<div>HELLO</div>)}
    // Prevent duplicate joining
    const existingPlayer = data.players.find(p => p.id === userId);
    if (!existingPlayer) {
      await updateDoc(gameRef, {
        players: arrayUnion({
          id: userId,
          name: playerName,
          hand: [],
          isHost: false,
          // Bluff tracking counters
          bluffAccusationCounter: 0,
          successfulBluffCalls: 0,
          bluffCounter: 0,
          successfulBluffCounter: 0
        })
      });
    }
  }
};

export const subscribeToGame = (gameCode, callback) => {
  let lastHandCount = null;

  return onSnapshot(doc(db, "games", gameCode), (snap) => {
    if (!snap.exists()) return;

    const data = snap.data();

    try {
      const uid = localStorage.getItem("zk_user_id");
      if (!uid) {
        callback(data);
        return;
      }

      const players = data.players || [];
      const myIdx = players.findIndex(p => p.id === uid);

      if (myIdx !== -1) {
        const me = players[myIdx];

        const serverHandCount = Array.isArray(me.hand)
          ? me.hand.length
          : me.handCount;

        // 🚨 Hand size increased → BS pickup or draw → resync
        if (
          typeof serverHandCount === "number" &&
          lastHandCount !== null &&
          serverHandCount > lastHandCount
        ) {
          localStorage.removeItem("my_hand");
        }

        lastHandCount = serverHandCount;
      }
    } catch (e) {
      // If anything goes wrong, fail safe
      localStorage.removeItem("my_hand");
    }

    callback(data);
  });
};


export const startGame = async (gameCode) => {
  const gameRef = doc(db, "games", gameCode);
  
  await runTransaction(db, async (transaction) => {
    const gameDoc = await transaction.get(gameRef);
    if (!gameDoc.exists()) throw "Game not found";

    const data = gameDoc.data();
    const playerList = data.players;
    
    // Deal Cards
    const deck = shuffleDeck(createDeck(true)); // false/true for Joker
    const centerCard = deck.pop();
    const pile = [centerCard];

    // Distribute
    let pIdx = 0;
    while(deck.length > 0) {
        playerList[pIdx].hand.push(deck.pop());
        pIdx = (pIdx + 1) % playerList.length;
    }

    const ranks = ["A", "2", "3", "4", "5", "6", "7", "8", "9", "10", "J", "Q", "K"];
    const nextTargetRank = ranks[(ranks.indexOf(centerCard.rank) + 1) % ranks.length];

    const initialState = {
        turnIndex: 0,
        centerCard: centerCard,
        discardPile: pile,
        targetRank: nextTargetRank,
        lastClaim: null,
        bsActive: false
    };

    transaction.update(gameRef, {
        status: "playing",
        players: playerList,
        gameState: initialState
    });
  });
};

// GAMEPLAY ACTIONS

export const playTurn = async (gameCode, userId, selectedIndices, claimedRank, opts = {}) => {
    const gameRef = doc(db, "games", gameCode);
    await runTransaction(db, async (transaction) => {
        const gameDoc = await transaction.get(gameRef);
        const data = gameDoc.data();
        const state = data.gameState;
        const players = data.players;
        const playerIdx = players.findIndex(p => p.id === userId);

        if (playerIdx !== state.turnIndex) throw "Not your turn";

        const hand = players[playerIdx].hand || [];

        // Determine if server-side hand contains real card objects or placeholders
        const hasRealCards = hand.length > 0 && hand[0] && hand[0].rank;
        let playedCards = [];
        let newHand = [];

        if (hasRealCards) {
          playedCards = selectedIndices.map(i => hand[i]);
          newHand = hand.filter((_, i) => !selectedIndices.includes(i));
        } else {
          // Placeholder flow: we only have counts; remove by count and create hidden placeholders
          const playedCount = selectedIndices.length;
          const currentCount = hand.length;
          const remaining = Math.max(0, currentCount - playedCount);
          newHand = Array(remaining).fill({ hidden: true });
          playedCards = Array(playedCount).fill({ suit: 'hidden', rank: 'Hidden' });
        }

        players[playerIdx].hand = newHand;

        const newPile = [...state.discardPile, ...playedCards];
        
        const ranks = ["A","2","3","4","5","6","7","8","9","10","J","Q","K"];
        const nextRank = ranks[(ranks.indexOf(claimedRank) + 1) % ranks.length];
        
        // Check win condition
        const isHandEmpty = newHand.length === 0;

        // If the caller provided a ZK proof, we DO NOT store actual card values in the DB.
        // Instead store the proof and publicSignals (client proves honesty).
        const claimObj = {
          playerIdx: playerIdx,
          playerName: players[playerIdx].name,
          count: playedCards.length,
          rank: claimedRank
        };

        if (opts.proof || opts.publicSignals) {
          claimObj.proof = opts.proof ? opts.proof : null;
          claimObj.publicSignals = opts.publicSignals ? opts.publicSignals : null;
          // Keep minimal info only
        } else {
          // Legacy behavior: store actual cards (no proof provided)
          claimObj.actualCards = playedCards;
        }

        transaction.update(gameRef, {
          players: players,
          "gameState.discardPile": newPile,
          "gameState.centerCard": { ...state.centerCard, rank: claimedRank },
          "gameState.lastClaim": claimObj,
          "gameState.targetRank": nextRank,
          "gameState.turnIndex": (state.turnIndex + 1) % players.length,
          "gameState.bsActive": true,
          "gameState.winPending": isHandEmpty, 
          "gameState.potentialWinnerId": isHandEmpty ? userId : null,
          "gameState.truthVotes": [] // Array to store userIds who accepted the truth
        });
    });
};

export const callBS = async (gameCode, challengerId, opts = {}) => {
  // opts: { proofValid: true/false } -- required when lastClaim uses proof
  const gameRef = doc(db, "games", gameCode);
  await runTransaction(db, async (transaction) => {
    const gameDoc = await transaction.get(gameRef);
    const data = gameDoc.data();
    const state = data.gameState;
        
    if (!state.lastClaim) throw "Nothing to call BS on";

    const claim = state.lastClaim;
    const players = data.players;

    let isLie = false;

    if (claim.proof || claim.publicSignals) {
      // rely on caller to verify proof client-side (snarkjs) and pass proofValid
      if (typeof opts.proofValid === 'undefined' || opts.proofValid === null) {
        throw "proofValid required when last claim contains a proof";
      }
      isLie = !opts.proofValid;
    } else if (claim.actualCards) {
      // fallback - server-inspect actual cards
      const actualCards = claim.actualCards;
      const claimedRank = claim.rank;
      actualCards.forEach(card => {
        if (card.rank !== claimedRank && card.rank !== "Joker") isLie = true;
      });
    } else {
      // Default to lie if all fails
      isLie = true;
    }

    const loserIndex = isLie ? claim.playerIdx : data.players.findIndex(p => p.id === challengerId);

    players[loserIndex].hand = [...players[loserIndex].hand, ...state.discardPile];

    // Update bluff tracking counters
    const accuserIdx = data.players.findIndex(p => p.id === challengerId);
    const accusedIdx = claim.playerIdx;

    if (accuserIdx !== -1) {
      players[accuserIdx].bluffCounter = (players[accuserIdx].bluffCounter || 0) + 1;
    }
    if (accusedIdx !== -1) {
      players[accusedIdx].bluffAccusationCounter = (players[accusedIdx].bluffAccusationCounter || 0) + 1;
    }

    // If accusation failed (they were telling the truth), increment both the accused's successful defenses
    // and the accuser's failure counter per requested naming.
    if (!isLie) {
      if (accusedIdx !== -1) {
        players[accusedIdx].successfulBluffCalls = (players[accusedIdx].successfulBluffCalls || 0) + 1;
      }
      if (accuserIdx !== -1) {
        players[accuserIdx].successfulBluffCounter = (players[accuserIdx].successfulBluffCounter || 0) + 1;
      }
    }

    // Win logic
    let gameFinished = false;
    let winnerId = null;

    if (state.winPending) {
      if (isLie) {
        // Potential winner lied. They pick up. Win cancelled.
        state.winPending = false;
        state.potentialWinnerId = null;
      } else {
        // Potential winner told truth. Challenger picks up.
        // Potential winner still has 0 cards - they win.
        gameFinished = true;
        winnerId = players[claim.playerIdx].id;
      }
    }

    transaction.update(gameRef, {
      players: players,
      status: gameFinished ? "finished" : "playing",
      "gameState.discardPile": [],
      "gameState.lastClaim": { 
        ...claim, 
        bsResult: `BS Called! ${isLie ? "It was a LIE!" : "It was TRUE!"} ${players[loserIndex].name} picked up.` 
      },
      "gameState.bsActive": false,
      "gameState.winPending": state.winPending,
      "gameState.potentialWinnerId": state.potentialWinnerId,
      "gameState.winnerId": winnerId,
      "gameState.truthVotes": []
    });
  });
};

// Upload a player's hand commitment (poseidon hash) to their player record.
export const uploadHandCommitment = async (gameCode, userId, commitment, opts = {}) => {
  const gameRef = doc(db, "games", gameCode);
  await runTransaction(db, async (transaction) => {
    const gameDoc = await transaction.get(gameRef);
    if (!gameDoc.exists()) throw "Game not found";
    const data = gameDoc.data();
    const players = data.players || [];
    const idx = players.findIndex(p => p.id === userId);
    if (idx === -1) throw "Player not found";
    players[idx].handCommitment = commitment;
    players[idx].localSaved = opts.localSaved ? true : false;

    // Do NOT scrub here. Finalization/scrubbing should be done explicitly
    // by calling `finalizeCommitments(gameCode)` to avoid race conditions.

    transaction.update(gameRef, { players });
  });
};

// Finalize commitments: scrub raw hands to placeholders when all players have committed and saved locally.
export const finalizeCommitments = async (gameCode) => {
  const gameRef = doc(db, "games", gameCode);
  await runTransaction(db, async (transaction) => {
    const gameDoc = await transaction.get(gameRef);
    if (!gameDoc.exists()) throw "Game not found";
    const data = gameDoc.data();
    const players = data.players || [];

    const allCommitted = players.every(p => p.handCommitment);
    const allSaved = players.every(p => p.localSaved);
    if (!(allCommitted && allSaved)) throw "Not all players have committed and saved";

    for (let i = 0; i < players.length; i++) {
      const p = players[i];
      const count = Array.isArray(p.hand) ? p.hand.length : (p.handCount || 0);
      players[i].hand = Array(count).fill({ hidden: true });
    }

    transaction.update(gameRef, { players, "gameState.handsScrubbed": true });
  });
};

// NEW FUNCTION: Handles the voting logic
export const voteTruth = async (gameCode, userId) => {
    const gameRef = doc(db, "games", gameCode);
    await runTransaction(db, async (transaction) => {
        const gameDoc = await transaction.get(gameRef);
        const data = gameDoc.data();
        const state = data.gameState;
        
        if (!state.winPending || !state.potentialWinnerId) return;
        if (userId === state.potentialWinnerId) return; // Winner cannot vote for themselves

        const currentVotes = state.truthVotes || [];
        
        // Add vote if not already there
        if (!currentVotes.includes(userId)) {
            const newVotes = [...currentVotes, userId];
            const requiredVotes = data.players.length - 1; // All players except the potential winner

            if (newVotes.length >= requiredVotes) {
                // ALL VOTED TRUTH -> CONFIRM WIN
                transaction.update(gameRef, {
                    status: "finished",
                    "gameState.winnerId": state.potentialWinnerId,
                    "gameState.winPending": false,
                    "gameState.truthVotes": newVotes
                });
            } else {
                // ADD VOTE AND WAIT
                transaction.update(gameRef, {
                    "gameState.truthVotes": newVotes
                });
            }
        }
    });
};

export const skipBS = async (gameCode) => {
    // Just closes the BS window of opportunity if needed, or handled automatically by next turn
    // Usually, you don't need a specific "Skip BS" unless you implement a timer or voting.
    // For this version, we assume BS is available until the next person plays.
};
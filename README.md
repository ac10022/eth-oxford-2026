<h1 align="center">ZK-Bluff</h1>
<p align="center">
<strong>An Anti-Cheat Card Game Powered by Zero-Knowledge Proofs</strong>
</p>

<p align="center">
@ETHOxford2026 
</p>

---

## Project Introduction

**ZK-Bluff** is a digital recreation of the classic card game 'bluff', built to solve the trust problem in digital hidden-information games.

In a physical game of Bluff, players rely on social cues to detect lies. In digital versions, players are usually forced to trust a central server or the opposing client not to cheat. ZK-Bluff changes this dynamic by leveraging **zero-knowledge proofs**; players can cryptographically prove they possess the cards they claim to play (or bluff with) without ever revealing their actual hand to the opponent or a central server.

## Bounty Track

We have submitted ZK-Bluff following: **Main Track - Programmable Cryptography**.

> "Zero-knowledge proofs allow proving a statement is true without sharing the underlying data, fully homomorphic encryption enables computations on encrypted information without decrypting it, and multi-party computation lets multiple people or systems calculate results together without revealing their individual inputs."

### Why we fit this track
We make use of **Circom** and **SnarkJS** (languages for ZK-proof systems), to implement programmable cryptography directly into a consumer-facing game. We use zero-knowledge to facilitate gameplay mechanics, namely proving honesty without revealing the hand; objectives that were previously impossible without a trusted third party.

## Features

* Uses `snarkjs` (Groth16) and `circomlibjs` (Poseidon) to generate proofs of valid plays client-side. Players prove they *can* play the cards they claim without showing them. Players cryptographically commit to their hands at the start of the game using Poseidon hashing + salt, preventing card swapping during the match.
* Includes an AI player that calculates 'bluff probability' based on game history, accusation counters, and hand size to make intelligent challenges.
* Real-time lobby system and state synchronization powered by Firebase Firestore.
* An offline mode that allows multiplayer gaming on one phone.

## How It Works

ZK-Bluff operates on a stack of Next.js, Firebase, and ZK circuits.

### 1. Setup and original commitment
When a game starts, the deck is shuffled (using entropy) and dealt. Before gameplay begins, every client:
1.  Takes their hand (array of card IDs).
2.  Generates a random salt.
3.  Creates a Poseidon hash commitment of the hand + salt.
4.  Uploads this commitment to the server. This ensures players cannot modify their starting hand later in the game.

### 2. Each turn
When a player selects cards and plays them:
* The client attempts to generate a zero-knowledge proof using `snarkjs`.
* The circuit verifies if the cards selected actually match the claimed rank.
* A proof is generated. If the player is bluffing, they cannot generate a valid proof for the claimed rank, we use this to detect bluffing.
* Game state (turn index, center card, last claim) is synced via Firebase listeners.

When a player calls BS:
* If a proof exists: The client verifies the ZK proof using the verification key. If the proof is valid, the challenger loses (the claim was honest). If invalid, the claimer loses.
* Otherwise the player has intentionally bluffed, they lose, and pick up the discard pile.

## Starting The Project

To play online, visit [the Vercel deployment](https://zk-bluff.vercel.app/).

### Running ZK-Bluff locally

1.  Clone the repo locally.
2.  Install dependencies via `npm install`.
3.  Ensure you have your Firebase configuration set up in `src/lib/firebase.js`.
4.  Run the development server via: `npm run dev`.
5.  Navigate to `http://localhost:3000` in your browser.

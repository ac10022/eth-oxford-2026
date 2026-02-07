const suits = ["hearts", "diamonds", "clubs", "spades"]
const ranks = ["A", "2", "3", "4", "5", "6", "7", "8", "9", "10", "J", "Q", "K"]

export const createDeck = (isJoker = false) => {
  const deck = suits.flatMap((suit) =>
    ranks.map((rank) => ({
      suit,
      rank,
    }))
  )
  if (isJoker) {
    deck.push(
      {suit: "joker", rank: "Joker"},
      {suit: "joker", rank: "Joker"});
  }
  return deck;
}
export const shuffleDeck = (deck) => {
  const shuffled = [...deck];
  
  const randomValues = new Uint32Array(1);

  for (let i = shuffled.length - 1; i > 0; i--) {
    crypto.getRandomValues(randomValues);
    const j = randomValues[0] % (i + 1);
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }
  
  return shuffled;
};
    
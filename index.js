const express = require("express");
const app = express();
app.use(express.json());

const mnemonicaStack = [
  "4C", "2H", "7D", "3C", "4H", "6D", "AS", "5H", "9S", "2S",
  "QH", "3D", "QC", "8H", "6S", "5S", "9H", "KC", "2D", "JH",
  "3S", "8S", "6H", "10C", "5D", "KD", "2C", "3H", "8D", "5C",
  "KS", "JD", "8C", "10S", "KH", "JC", "7S", "10H", "AD", "4S",
  "7H", "4D", "AC", "9C", "JS", "QD", "7C", "QS", "10D", "6C",
  "AH", "9D"
];

app.post("/cutcard", (req, res) => {
  const { text } = req.body;
  if (!text) return res.status(400).json({ error: "Text is required" });

  const suitMap = {
    h: "H", hearts: "H", heart: "H", "♥": "H",
    s: "S", spades: "S", spade: "S", "♠": "S",
    d: "D", diamonds: "D", diamond: "D", "♦": "D",
    c: "C", clubs: "C", club: "C", "♣": "C"
  };

  const valueMap = {
    ace: "A", one: "A", two: "2", three: "3", four: "4",
    five: "5", six: "6", seven: "7", eight: "8", nine: "9",
    ten: "10", jack: "J", queen: "Q", king: "K"
  };

  const words = text.toLowerCase().split(/\W+/);
  let card = null;
  let cardValue = null;
  let cardSuit = null;
  let targetPosition = null;

  for (let i = 0; i < words.length; i++) {
    const val = valueMap[words[i]] || (/^(10|[2-9]|[ajqk])$/i.test(words[i]) ? words[i].toUpperCase() : null);
    const suit = suitMap[words[i + 1]];
    if (val && suit) {
      cardValue = val.length === 1 ? val.toUpperCase() : val;
      cardSuit = suit;
      card = `${cardValue}${cardSuit}`;
      break;
    }
  }

  // Extract all numbers and remove the one used for the card if it matches
  const numberMatches = [...text.matchAll(/\b([1-9]|[1-4][0-9]|52|10)\b/g)].map(m => parseInt(m[1]));
  const cardNumber = cardValue && /^\d+$/.test(cardValue) ? parseInt(cardValue) : null;
  targetPosition = numberMatches.find(n => n !== cardNumber);

  if (!card || !targetPosition) {
    return res.status(400).json({ error: "Could not extract card and/or position from text" });
  }

  const cardIndex = mnemonicaStack.indexOf(card);
  if (cardIndex === -1) {
    return res.status(404).json({ error: `Card ${card} not found in the stack.` });
  }

  const cardPos = cardIndex + 1; // 1-based position
  let cutIndex;

  if (cardPos > targetPosition) {
    cutIndex = cardPos - targetPosition;
  } else {
    cutIndex = 52 - (targetPosition - cardPos);
  }

  const cutCard = mnemonicaStack[cutIndex];
  const cutCardPosition = cutIndex + 1;

  res.json({
    input: text,
    card,
    cardStackPosition: cardPos,
    targetPosition,
    cutTo: {
      card: cutCard,
      position: cutCardPosition
    }
  });
});

app.listen(3000, () => console.log("API running on port 3000"));

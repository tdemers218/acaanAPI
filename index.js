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

const valueMap = {
  ace: "A", one: "A", two: "2", three: "3", four: "4",
  five: "5", six: "6", seven: "7", eight: "8", nine: "9",
  ten: "10", jack: "J", queen: "Q", king: "K"
};

const suitMap = {
  hearts: "H", heart: "H", h: "H", "♥": "H",
  spades: "S", spade: "S", s: "S", "♠": "S",
  diamonds: "D", diamond: "D", d: "D", "♦": "D",
  clubs: "C", club: "C", c: "C", "♣": "C"
};

app.post("/cutcard", (req, res) => {
  const { text } = req.body;
  if (!text) return res.status(400).json({ error: "Text is required" });

  const lower = text.toLowerCase();
  const words = lower.split(/\W+/);

  let card = null;
  let cardValue = null;
  let cardSuit = null;

  // STEP 1: Detect format like "10 of spades"
  for (let i = 0; i < words.length - 2; i++) {
    const valueWord = words[i];
    const middleWord = words[i + 1];
    const suitWord = words[i + 2];

    const val = valueMap[valueWord] || (valueWord.match(/^(10|[2-9]|[ajqk])$/i) ? valueWord.toUpperCase() : null);
    const suit = suitMap[suitWord];

    if (val && (middleWord === "of" || suitMap[middleWord])) {
      cardValue = val;
      cardSuit = suit;
      break;
    }
  }

  // STEP 2: Extract all numbers
  const numberMatches = [...text.matchAll(/\b(10|[1-9]|[1-4][0-9]|52)\b/g)].map(m => parseInt(m[1]));
  const cardNumber = /^\d+$/.test(cardValue) ? parseInt(cardValue) : null;
  const targetPosition = numberMatches.find(n => n !== cardNumber);

  // STEP 3: Build final card
  if (cardValue && cardSuit) {
    card = `${cardValue}${cardSuit}`;
  }

  // DEBUG
  console.log({ words, cardValue, cardSuit, card, cardNumber, numberMatches, targetPosition });

  if (!card || !targetPosition) {
    return res.status(400).json({ error: "Could not extract card and/or position from text" });
  }

  const cardIndex = mnemonicaStack.indexOf(card);
  if (cardIndex === -1) {
    return res.status(404).json({ error: `Card ${card} not found in the stack.` });
  }

  const cardPos = cardIndex ;
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

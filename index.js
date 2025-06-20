const express = require("express");
const app = express();
app.use(express.json());

const mnemonicaStack = [ "4C", "2H", "7D", "3C", "4H", "6D", "AS", "5H", "9S", "2S", "QH", "3D", "QC", "8H", "6S", "5S", "9H", "KC", "2D", "JH", "3S", "8S", "6H", "10C", "5D", "KD", "2C", "3H", "8D", "5C", "KS", "JD", "8C", "10S", "KH", "JC", "7S", "10H", "AD", "4S", "7H", "4D", "AC", "9C", "JS", "QD", "7C", "QS", "10D", "6C", "AH", "9D" ];

function normalizeCardName(input) {
  const names = {
    ace: "A", two: "2", three: "3", four: "4", five: "5",
    six: "6", seven: "7", eight: "8", nine: "9", ten: "10",
    jack: "J", queen: "Q", king: "K"
  };

  const suits = {
    hearts: "H", heart: "H", "♥": "H", h: "H",
    spades: "S", spade: "S", "♠": "S", s: "S",
    diamonds: "D", diamond: "D", "♦": "D", d: "D",
    clubs: "C", club: "C", "♣": "C", c: "C"
  };

  input = input.toLowerCase();

  let valueMatch = Object.keys(names).find(v => input.includes(v)) || input.match(/\b(10|[2-9]|[ajqk])\b/i)?.[0];
  let suitMatch = Object.keys(suits).find(s => input.includes(s)) || input.match(/[hdcs♠♥♦♣]/i)?.[0];

  if (!valueMatch || !suitMatch) return null;

  return `${names[valueMatch] || valueMatch.toUpperCase()}${suits[suitMatch]}`;
}

function extractNumber(text) {
  const num = text.match(/\b([1-9][0-9]?|52)\b/); // valid deck position
  return num ? parseInt(num[0], 10) : null;
}

function getCutCard(stack, targetCard, targetPos) {
  const currentIndex = stack.indexOf(targetCard);
  if (currentIndex === -1) return null;

  let cutIndex = (currentIndex - targetPos + 1 + 52) % 52;
  return stack[cutIndex];
}

app.post("/cutcard", (req, res) => {
  const { text } = req.body;
  if (!text) return res.status(400).json({ error: "Text is required" });

  const card = normalizeCardName(text);
  const position = extractNumber(text);

  if (!card || !position) {
    return res.status(400).json({ error: "Could not extract card and/or position from text" });
  }

  const cutTo = getCutCard(mnemonicaStack, card, position);
  if (!cutTo) return res.status(404).json({ error: "Card not found in stack" });

  res.json({
    input: text,
    card: card,
    position: position,
    cutTo: cutTo
  });
});

app.listen(3000, () => console.log("API running on port 3000"));

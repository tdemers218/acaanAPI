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

// Map card values in English & French (accent stripped)
const valueMap = {
  ace: "A", as: "A", one: "A", "1": "A",
  two: "2", deux: "2", "2": "2",
  three: "3", trois: "3", "3": "3",
  four: "4", quatre: "4", "4": "4",
  five: "5", cinq: "5", "5": "5",
  six: "6", "6": "6",
  seven: "7", sept: "7", "7": "7",
  eight: "8", huit: "8", "8": "8",
  nine: "9", neuf: "9", "9": "9",
  ten: "10", dix: "10", "10": "10",
  jack: "J", valet: "J", "11": "J",
  queen: "Q", reine: "Q", "12": "Q",
  king: "K", roi: "K", "13": "K"
};

// Map suits in English & French (accent stripped)
const suitMap = {
    hearts: "H", heart: "H", coeur: "H", coeurs: "H", "♥": "H", h: "H",
    spades: "S", spade: "S", pique: "S", piques: "S", "♠": "S", s: "S",
    diamonds: "D", diamond: "D", carreau: "D", carreaux: "D", "♦": "D", d: "D",
    clubs: "C", club: "C", trefle: "C", trèfle: "C", "♣": "C", c: "C"
};

// Helper to remove accents & lowercase string
function normalizeText(str) {
    return str
        .normalize("NFD")
        .replace(/[\u0300-\u036f]/g, "") // remove accents
        .toLowerCase();
}

app.post("/cutcard", (req, res) => {
    const { text } = req.body;
    if (!text) return res.status(400).json({ error: "Text is required" });

    // Normalize input
    const normalized = normalizeText(text);

    // Split words including across line breaks
    const words = normalized.split(/\W+/).filter(Boolean);

    let cardValue = null;
    let cardSuit = null;

    // Find card value + suit anywhere in text
    // Allow "value of suit", "value suit", or even separated by words
    for (let i = 0; i < words.length; i++) {
        // Check 3-word combos: value + (optional "of"/"de") + suit
        if (i + 2 < words.length) {
            const valWord = words[i];
            const midWord = words[i + 1];
            const suitWord = words[i + 2];

            if (
                (valueMap[valWord]) &&
                (midWord === "of" || midWord === "de") &&
                suitMap[suitWord]
            ) {
                cardValue = valueMap[valWord];
                cardSuit = suitMap[suitWord];
                break;
            }
        }

        // Check 2-word combos: value + suit
        if (i + 1 < words.length) {
            const valWord = words[i];
            const suitWord = words[i + 1];

            if (valueMap[valWord] && suitMap[suitWord]) {
                cardValue = valueMap[valWord];
                cardSuit = suitMap[suitWord];
                break;
            }
        }

        // Check 1-word combos like "A", "K", "Q", "10" followed immediately by suit initial "h", "s", etc
        const oneWord = words[i];
        // example: "ah", "10s", "kd"
        if (/^(10|[ajqk2-9])([hsdc])$/.test(oneWord)) {
            const parts = oneWord.match(/^(10|[ajqk2-9])([hsdc])$/);
            cardValue = parts[1].toUpperCase();
            cardSuit = suitMap[parts[2]];
            break;
        }
    }

    if (!cardValue || !cardSuit) {
        return res.status(400).json({ error: "Could not detect card value and suit" });
    }

    // Build card code e.g. "10S"
    const card = `${cardValue}${cardSuit}`;

    // Extract all numbers (1 to 52) as possible positions
    const positionMatches = [...normalized.matchAll(/\b([1-9]|[1-4][0-9]|52)\b/g)].map(m => parseInt(m[1]));

    // Remove card number if cardValue is numeric (e.g. "10")
    const cardNumber = /^\d+$/.test(cardValue) ? parseInt(cardValue) : null;
    const position = positionMatches.find(n => n !== cardNumber);

    if (!position) {
        return res.status(400).json({ error: "Could not detect position number" });
    }

    const cardIndex = mnemonicaStack.indexOf(card);
    if (cardIndex === -1) {
        return res.status(404).json({ error: `Card ${card} not found in stack` });
    }


    const cardPos = cardIndex + 1;
    let cutIndex;

    if (cardPos > position) {
        cutIndex = cardPos - position;
    } else {
        cutIndex = 52 - (position - cardPos);
    }


    const cutCard = mnemonicaStack[cutIndex - 1];
    const cutCardPosition = cutIndex;

    const topCard = mnemonicaStack[(cutIndex) % 52];
    const topCardPosition = ((cutIndex + 1) % 52);


    res.json({
        input: text,
        card, // target card to arrive at `targetPosition`
        cardStackPosition: cardPos,
        targetPosition: position,
        cut: {
            bottomCard: cutCard,
            cardPosition: cutIndex + 1
        },
        afterCut: {
            topCard,
            topCardPosition
        }
    });
});

app.listen(3000, () => console.log("API running on port 3000"));

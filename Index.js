const express = require("express");
const http = require("http");
const WebSocket = require("ws");

const PORT = process.env.PORT || 3000;

// Taille max du stockage (évite explosion RAM)
const MAX_STORAGE = 10000; // derniers messages

// Stockage en mémoire (buffer circulaire)
let storage = [];

const app = express();
const server = http.createServer(app);

const wss = new WebSocket.Server({
  server,
  perMessageDeflate: false, // IMPORTANT pour performance
  maxPayload: 1024 * 1024 // 1MB max par message
});

let clientCount = 0;

// Fonction pour stocker efficacement
function storeMessage(data) {
  storage.push(data);
  if (storage.length > MAX_STORAGE) {
    storage.shift(); // supprime le plus ancien
  }
}

// Broadcast rapide
function broadcast(data, exclude) {
  for (const client of wss.clients) {
    if (client !== exclude && client.readyState === WebSocket.OPEN) {
      client.send(data);
    }
  }
}

// Connexions
wss.on("connection", (ws) => {
  clientCount++;
  console.log("Client connected:", clientCount);

  ws.on("message", (message) => {
    const data = message.toString();

    // Commande spéciale pour récupérer les données
    if (data === "GET_STORAGE") {
      ws.send(JSON.stringify(storage));
      return;
    }

    // Stocker
    storeMessage(data);

    // Broadcast aux autres
    broadcast(data, ws);
  });

  ws.on("close", () => {
    clientCount--;
    console.log("Client disconnected:", clientCount);
  });
});

// Route HTTP (pour vérifier Railway)
app.get("/", (req, res) => {
  res.send("High-load WebSocket running");
});

server.listen(PORT, () => {
  console.log("Server running on port", PORT);
});

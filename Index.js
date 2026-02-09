const express = require("express");
const http = require("http");
const WebSocket = require("ws");

const PORT = process.env.PORT || 3000;
const BROADCAST_INTERVAL = 1000; // 1s
const FORWARD_URL = null; // mettre un wss:// autre serveur si tu veux forward

const app = express();
const server = http.createServer(app);
const wss = new WebSocket.Server({ server, perMessageDeflate: false });

let clientCount = 0;

// Forward simple
let forwardSocket = null;
if (FORWARD_URL) {
  forwardSocket = new WebSocket(FORWARD_URL);
  forwardSocket.on("open", () => console.log("Connected to forward server"));
  forwardSocket.on("close", () => {
    console.log("Forward connection closed, reconnecting in 3s...");
    setTimeout(() => {
      forwardSocket = new WebSocket(FORWARD_URL);
    }, 3000);
  });
}

// Broadcast toutes les secondes
setInterval(() => {
  const data = JSON.stringify({ type: "heartbeat", timestamp: Date.now() });
  wss.clients.forEach(c => {
    if (c.readyState === 1) c.send(data);
  });
}, BROADCAST_INTERVAL);

// Gestion des connections
wss.on("connection", ws => {
  clientCount++;
  console.log("Client connected:", clientCount);

  ws.on("message", msg => {
    console.log("Message reçu:", msg.toString());

    // Broadcast à tous sauf l'envoyeur
    wss.clients.forEach(c => {
      if (c !== ws && c.readyState === 1) c.send(msg.toString());
    });

    // Forward si actif
    if (forwardSocket && forwardSocket.readyState === 1) {
      forwardSocket.send(msg.toString());
    }
  });

  ws.on("close", () => {
    clientCount--;
    console.log("Client disconnected:", clientCount);
  });
});

// Route HTTP simple
app.get("/", (req, res) => res.send("WebSocket server running!"));

server.listen(PORT, () => console.log(`Server running on port ${PORT}`));

const http = require("http");
const WebSocket = require("ws");

const PORT = process.env.PORT || 3000;

// Stockage limité (évite crash RAM)
const MAX_STORAGE = 10000;
let storage = [];

// Serveur HTTP obligatoire pour Railway
const server = http.createServer((req, res) => {
  res.writeHead(200);
  res.end("WebSocket running");
});

const wss = new WebSocket.Server({
  server,
  perMessageDeflate: false
});

// Stocker messages
function store(data) {
  storage.push(data);
  if (storage.length > MAX_STORAGE) {
    storage.shift();
  }
}

// Broadcast
function broadcast(data, exclude) {
  wss.clients.forEach(client => {
    if (client !== exclude && client.readyState === WebSocket.OPEN) {
      client.send(data);
    }
  });
}

let clients = 0;

wss.on("connection", (ws) => {
  clients++;
  console.log("Client connected:", clients);

  ws.on("message", (message) => {
    const data = message.toString();

    // Récupérer stockage
    if (data === "GET_STORAGE") {
      ws.send(JSON.stringify(storage));
      return;
    }

    store(data);
    broadcast(data, ws);
  });

  ws.on("close", () => {
    clients--;
    console.log("Client disconnected:", clients);
  });
});

server.listen(PORT, () => {
  console.log("Server running on port", PORT);
});

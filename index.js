const http = require("http");
const WebSocket = require("ws");

const PORT = process.env.PORT || 3000;

// File de messages (queue)
let queue = [];
const MAX_QUEUE = 50000; // sécurité mémoire

const server = http.createServer((req, res) => {
  res.writeHead(200);
  res.end("WS Queue running");
});

const wss = new WebSocket.Server({
  server,
  perMessageDeflate: false
});

wss.on("connection", (ws) => {

  ws.on("message", (message) => {
    let data;

    try {
      data = JSON.parse(message.toString());
    } catch {
      data = message.toString();
    }

    // ====== SCAN ENVOIE ======
    if (data.type === "scan") {
      if (queue.length < MAX_QUEUE) {
        queue.push(data.data);
      }
      return;
    }

    // ====== MAIN RECUPERE ======
    if (data === "GET" || data.type === "get") {
      if (queue.length > 0) {
        const result = queue.shift(); // retire le premier
        ws.send(JSON.stringify({
          type: "result",
          data: result
        }));
      } else {
        ws.send(JSON.stringify({
          type: "empty"
        }));
      }
    }
  });

});

server.listen(PORT, () => {
  console.log("Queue WebSocket running on port", PORT);
});

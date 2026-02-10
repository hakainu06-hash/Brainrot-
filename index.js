import { WebSocketServer } from "ws";

const PORT = process.env.PORT || 3000;

const wss = new WebSocketServer({ port: PORT });

console.log("WebSocket running on port", PORT);

wss.on("connection", (ws) => {
  console.log("Client connecté");

  ws.on("message", (msg) => {
    console.log("Reçu :", msg.toString());

    // Broadcast à tous les clients
    wss.clients.forEach((client) => {
      if (client.readyState === ws.OPEN) {
        client.send(msg.toString());
      }
    });
  });

  ws.on("close", () => {
    console.log("Client déconnecté");
  });
});

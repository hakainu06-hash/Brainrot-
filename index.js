import { WebSocketServer } from "ws";

const PORT = process.env.PORT || 8080;

const wss = new WebSocketServer({ port: PORT });

console.log("WebSocket server running on port", PORT);

wss.on("connection", (ws) => {
  console.log("Client connecté");

  ws.on("message", (message) => {
    console.log("Message reçu :", message.toString());

    // Broadcast à tous les clients
    wss.clients.forEach((client) => {
      if (client.readyState === ws.OPEN) {
        client.send(message.toString());
      }
    });
  });

  ws.on("close", () => {
    console.log("Client déconnecté");
  });
});

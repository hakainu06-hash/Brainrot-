const WebSocket = require("ws");

const wss = new WebSocket.Server({ port: 8080 });

console.log("✅ WebSocket lancé sur le port 8080");

wss.on("connection", (ws) => {
    console.log("🟢 Client connecté");

    ws.on("message", (msg) => {
        console.log("📩", msg.toString());

        wss.clients.forEach(client => {
            if (client.readyState === WebSocket.OPEN) {
                client.send(msg.toString());
            }
        });
    });
});

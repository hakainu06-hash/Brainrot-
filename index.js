const express = require('express');
const { WebSocketServer } = require('ws');
const chalk = require('chalk');

const app = express();
const PORT = process.env.PORT || 3000;

// Créer le serveur HTTP
const server = app.listen(PORT, () => {
  console.log(chalk.green(`✓ Serveur WebSocket central démarré sur le port ${PORT}`));
});

// Créer le serveur WebSocket
const wss = new WebSocketServer({ server });

// Stocker les clients par type
const scanClients = new Set();
const mainClients = new Set();

// Route de base pour garder Replit actif
app.get('/', (req, res) => {
  res.send(`
    <h1>Discord Auto Joiner - WebSocket Server</h1>
    <p>Serveur actif</p>
    <p>Scan clients: ${scanClients.size}</p>
    <p>Main clients: ${mainClients.size}</p>
  `);
});

// Gérer les connexions WebSocket
wss.on('connection', (ws) => {
  console.log(chalk.blue('→ Nouveau client en attente d\'identification...'));
  
  let clientType = null;

  ws.on('message', (data) => {
    try {
      const message = JSON.parse(data.toString());
      
      // Identification du client
      if (message.type === 'identify') {
        clientType = message.role; // 'scan' ou 'main'
        
        if (clientType === 'scan') {
          scanClients.add(ws);
          console.log(chalk.cyan(`✓ Client SCAN connecté (Total: ${scanClients.size})`));
        } else if (clientType === 'main') {
          mainClients.add(ws);
          console.log(chalk.green(`✓ Client MAIN connecté (Total: ${mainClients.size})`));
        }
        
        ws.send(JSON.stringify({
          type: 'identified',
          role: clientType
        }));
        return;
      }
      
      // Si c'est un SCAN qui envoie un token
      if (message.type === 'token' && clientType === 'scan') {
        console.log(chalk.yellow(`→ Token reçu du SCAN, envoi aux MAIN...`));
        
        // Envoyer le token à tous les clients MAIN
        mainClients.forEach(mainWs => {
          if (mainWs.readyState === 1) {
            mainWs.send(JSON.stringify({
              type: 'token',
              token: message.token
            }));
          }
        });
      }
      
      // Si c'est un MAIN qui envoie un résultat
      if ((message.type === 'success' || message.type === 'error') && clientType === 'main') {
        console.log(chalk.magenta(`← Résultat reçu du MAIN, envoi aux SCAN...`));
        
        // Envoyer le résultat à tous les clients SCAN
        scanClients.forEach(scanWs => {
          if (scanWs.readyState === 1) {
            scanWs.send(JSON.stringify(message));
          }
        });
      }
      
    } catch (error) {
      console.error(chalk.red('Erreur traitement message:'), error.message);
    }
  });

  ws.on('close', () => {
    if (clientType === 'scan') {
      scanClients.delete(ws);
      console.log(chalk.gray(`✗ Client SCAN déconnecté (Restant: ${scanClients.size})`));
    } else if (clientType === 'main') {
      mainClients.delete(ws);
      console.log(chalk.gray(`✗ Client MAIN déconnecté (Restant: ${mainClients.size})`));
    }
  });

  ws.on('error', (error) => {
    console.error(chalk.red('Erreur WebSocket:'), error.message);
  });
});

console.log(chalk.magenta(`
╔═══════════════════════════════════════╗
║  Discord Auto Joiner - WS Central     ║
║     Serveur prêt à relayer les        ║
║     tokens entre SCAN et MAIN         ║
╚═══════════════════════════════════════╝
`));

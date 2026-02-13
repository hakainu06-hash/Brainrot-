const express = require('express');
const { WebSocketServer } = require('ws');
const { Client } = require('discord.js-selfbot-v13');
const chalk = require('chalk');

const app = express();
const PORT = process.env.PORT || 3000;

// Créer le serveur HTTP
const server = app.listen(PORT, () => {
  console.log(chalk.green(`✓ Serveur démarré sur le port ${PORT}`));
  console.log(chalk.cyan(`✓ WebSocket prêt à recevoir des tokens`));
});

// Créer le serveur WebSocket
const wss = new WebSocketServer({ server });

// Configuration
const INVITE_CODE = 'tonInvite'; // Change ça avec ton code d'invite (ex: 'abcd1234')
const DELAY_BETWEEN_JOINS = 5000; // 5 secondes entre chaque join

// Stocker les clients connectés
const clients = new Set();

// Route de base pour garder Replit actif
app.get('/', (req, res) => {
  res.send(`
    <h1>Discord Auto Joiner - Main Server</h1>
    <p>Serveur actif. Clients connectés: ${clients.size}</p>
    <p>En attente de tokens...</p>
  `);
});

// Gérer les connexions WebSocket
wss.on('connection', (ws) => {
  console.log(chalk.blue('→ Nouveau client connecté'));
  clients.add(ws);

  ws.on('message', async (data) => {
    try {
      const message = JSON.parse(data.toString());
      
      if (message.type === 'token') {
        const token = message.token;
        console.log(chalk.yellow(`→ Token reçu: ${token.substring(0, 20)}...`));
        
        // Tenter de rejoindre avec le token
        await joinServer(token, ws);
      }
    } catch (error) {
      console.error(chalk.red('Erreur lors du traitement du message:'), error.message);
    }
  });

  ws.on('close', () => {
    console.log(chalk.gray('✗ Client déconnecté'));
    clients.delete(ws);
  });

  ws.on('error', (error) => {
    console.error(chalk.red('Erreur WebSocket:'), error.message);
  });
});

// Fonction pour rejoindre un serveur avec un token
async function joinServer(token, ws) {
  const client = new Client();
  
  try {
    await client.login(token);
    console.log(chalk.green(`✓ Connecté: ${client.user.tag}`));
    
    // Attendre un peu pour la stabilité
    await delay(2000);
    
    // Rejoindre le serveur
    await client.acceptInvite(INVITE_CODE);
    console.log(chalk.green(`✓ ${client.user.tag} a rejoint le serveur!`));
    
    // Envoyer la confirmation au scan
    if (ws.readyState === 1) {
      ws.send(JSON.stringify({
        type: 'success',
        user: client.user.tag
      }));
    }
    
    // Déconnecter proprement
    await delay(2000);
    client.destroy();
    
  } catch (error) {
    console.error(chalk.red(`✗ Erreur avec le token: ${error.message}`));
    
    // Envoyer l'erreur au scan
    if (ws.readyState === 1) {
      ws.send(JSON.stringify({
        type: 'error',
        error: error.message
      }));
    }
    
    if (client.isReady()) {
      client.destroy();
    }
  }
  
  // Délai entre chaque join
  await delay(DELAY_BETWEEN_JOINS);
}

// Fonction de délai
function delay(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

// Gérer les erreurs non capturées
process.on('unhandledRejection', (error) => {
  console.error(chalk.red('Erreur non gérée:'), error);
});

console.log(chalk.magenta(`
╔═══════════════════════════════════════╗
║   Discord Auto Joiner - Main Server   ║
║        En attente de tokens...        ║
╚═══════════════════════════════════════╝
`));

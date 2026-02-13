const WebSocket = require('ws');
const { Client } = require('discord.js-selfbot-v13');
const chalk = require('chalk');

// Configuration
const WS_SERVER_URL = 'wss://ton-serveur-ws.repl.co'; // URL du serveur WebSocket central
const INVITE_CODE = 'tonInvite'; // Code d'invite Discord
const DELAY_BETWEEN_JOINS = 5000; // 5 secondes entre chaque join

console.log(chalk.magenta(`
╔═══════════════════════════════════════╗
║   Discord Auto Joiner - MAIN CLIENT   ║
║      Réception et traitement des      ║
║              tokens                   ║
╚═══════════════════════════════════════╝
`));

let ws;
let isProcessing = false;

// Connexion au serveur WebSocket
function connect() {
  console.log(chalk.blue('→ Connexion au serveur WebSocket central...'));
  
  ws = new WebSocket(WS_SERVER_URL);

  ws.on('open', () => {
    console.log(chalk.green('✓ Connecté au serveur central!'));
    
    // S'identifier comme MAIN
    ws.send(JSON.stringify({
      type: 'identify',
      role: 'main'
    }));
  });

  ws.on('message', async (data) => {
    try {
      const message = JSON.parse(data.toString());
      
      if (message.type === 'identified') {
        console.log(chalk.cyan(`✓ Identifié comme ${message.role.toUpperCase()}`));
        console.log(chalk.cyan('✓ En attente de tokens...\n'));
      }
      
      if (message.type === 'token') {
        const token = message.token;
        console.log(chalk.yellow(`→ Token reçu: ${token.substring(0, 20)}...`));
        
        // Traiter le token
        await joinServer(token);
      }
    } catch (error) {
      console.error(chalk.red('Erreur traitement message:'), error.message);
    }
  });

  ws.on('close', () => {
    console.log(chalk.yellow('⚠ Connexion fermée'));
    console.log(chalk.blue('→ Reconnexion dans 5 secondes...'));
    setTimeout(connect, 5000);
  });

  ws.on('error', (error) => {
    console.error(chalk.red('Erreur WebSocket:'), error.message);
  });
}

// Fonction pour rejoindre un serveur avec un token
async function joinServer(token) {
  if (isProcessing) {
    console.log(chalk.yellow('⚠ Déjà en traitement, token ignoré'));
    return;
  }
  
  isProcessing = true;
  const client = new Client();
  
  try {
    await client.login(token);
    console.log(chalk.green(`✓ Connecté: ${client.user.tag}`));
    
    // Attendre un peu pour la stabilité
    await delay(2000);
    
    // Rejoindre le serveur
    await client.acceptInvite(INVITE_CODE);
    console.log(chalk.green(`✓ ${client.user.tag} a rejoint le serveur!`));
    
    // Envoyer le succès au serveur
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
    console.error(chalk.red(`✗ Erreur: ${error.message}`));
    
    // Envoyer l'erreur au serveur
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
  
  // Délai avant de traiter le prochain
  await delay(DELAY_BETWEEN_JOINS);
  isProcessing = false;
  console.log(chalk.cyan('→ Prêt pour le prochain token\n'));
}

// Fonction de délai
function delay(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

// Démarrer la connexion
connect();

// Gérer les erreurs non capturées
process.on('unhandledRejection', (error) => {
  console.error(chalk.red('Erreur non gérée:'), error);
});

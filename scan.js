const WebSocket = require('ws');
const chalk = require('chalk');

// Configuration
const WS_SERVER_URL = 'wss://ton-serveur-ws.repl.co'; // URL du serveur WebSocket central (même URL que main.js)
const TOKENS = [
  'ton_token_1',
  'ton_token_2',
  'ton_token_3',
  // Ajoute tous tes tokens ici
];

console.log(chalk.magenta(`
╔═══════════════════════════════════════╗
║   Discord Auto Joiner - SCAN CLIENT   ║
║      Envoi des tokens au serveur      ║
╚═══════════════════════════════════════╝
`));

let ws;
let currentIndex = 0;
let successCount = 0;
let errorCount = 0;

// Connexion au serveur WebSocket
function connect() {
  console.log(chalk.blue('→ Connexion au serveur WebSocket central...'));
  
  ws = new WebSocket(WS_SERVER_URL);

  ws.on('open', () => {
    console.log(chalk.green('✓ Connecté au serveur central!'));
    
    // S'identifier comme SCAN
    ws.send(JSON.stringify({
      type: 'identify',
      role: 'scan'
    }));
  });

  ws.on('message', (data) => {
    try {
      const message = JSON.parse(data.toString());
      
      if (message.type === 'identified') {
        console.log(chalk.cyan(`✓ Identifié comme ${message.role.toUpperCase()}`));
        console.log(chalk.cyan(`→ Envoi de ${TOKENS.length} tokens...\n`));
        sendNextToken();
      }
      
      if (message.type === 'success') {
        successCount++;
        console.log(chalk.green(`✓ SUCCESS: ${message.user} a rejoint!`));
        console.log(chalk.gray(`   Succès: ${successCount} | Erreurs: ${errorCount}\n`));
        sendNextToken();
      } else if (message.type === 'error') {
        errorCount++;
        console.log(chalk.red(`✗ ERREUR: ${message.error}`));
        console.log(chalk.gray(`   Succès: ${successCount} | Erreurs: ${errorCount}\n`));
        sendNextToken();
      }
    } catch (error) {
      console.error(chalk.red('Erreur traitement réponse:'), error.message);
    }
  });

  ws.on('close', () => {
    console.log(chalk.yellow('⚠ Connexion fermée'));
    if (currentIndex < TOKENS.length) {
      console.log(chalk.blue('→ Reconnexion dans 5 secondes...'));
      setTimeout(connect, 5000);
    }
  });

  ws.on('error', (error) => {
    console.error(chalk.red('Erreur WebSocket:'), error.message);
  });
}

// Envoyer le prochain token
function sendNextToken() {
  if (currentIndex >= TOKENS.length) {
    console.log(chalk.magenta('\n╔═══════════════════════════════════════╗'));
    console.log(chalk.magenta('║          SCAN TERMINÉ !               ║'));
    console.log(chalk.magenta('╚═══════════════════════════════════════╝'));
    console.log(chalk.green(`✓ Succès: ${successCount}`));
    console.log(chalk.red(`✗ Erreurs: ${errorCount}`));
    console.log(chalk.cyan(`Total traité: ${TOKENS.length}`));
    
    ws.close();
    return;
  }

  const token = TOKENS[currentIndex];
  currentIndex++;
  
  console.log(chalk.yellow(`→ Envoi du token ${currentIndex}/${TOKENS.length}...`));
  
  ws.send(JSON.stringify({
    type: 'token',
    token: token
  }));
}

// Démarrer la connexion
connect();

// Gérer les erreurs non capturées
process.on('unhandledRejection', (error) => {
  console.error(chalk.red('Erreur non gérée:'), error);
});

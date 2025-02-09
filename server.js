// Import des dépendances nécessaires
const express = require('express');
const app = express();

// Définition des ports possibles
const PORTS = [3001, 3002, 3003];
let currentPortIndex = 0;

// Middleware pour parser le JSON
app.use(express.json());

// Route principale
app.get('/', (req, res) => {
    res.json({
        message: "Hello World!"
    });
});

// Fonction pour démarrer le serveur
function startServer() {
    const PORT = PORTS[currentPortIndex];
    app.listen(PORT)
        .on('error', (err) => {
            if (err.code === 'EADDRINUSE' && currentPortIndex < PORTS.length - 1) {
                currentPortIndex++;
                startServer();
            } else {
                console.error('Erreur lors du démarrage du serveur:', err);
            }
        })
        .on('listening', () => {
            console.log(`🚀 Serveur démarré sur http://localhost:${PORT}`);
        });
}

startServer(); 
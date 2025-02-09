// Import des dépendances nécessaires
const express = require('express');
const app = express();

// Définition du port pour le registre DNS
const PORT = 3000;

// Middleware pour parser le JSON
app.use(express.json());

// Route getServer qui renvoie l'URL du serveur Hello World
app.get('/getServer', (req, res) => {
    res.json({
        code: 200,
        server: "localhost:3001"
    });
});

// Démarrage du serveur de registre
app.listen(PORT, () => {
    console.log(`📋 Registre DNS démarré sur http://localhost:${PORT}`);
}); 
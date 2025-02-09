// Import des dépendances nécessaires
const express = require('express');
const db = require('./db');
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
    app.listen(PORT, async () => {
        await db.load();
        console.log(`�� Serveur e-commerce démarré sur http://localhost:${PORT}`);
    })
        .on('error', (err) => {
            if (err.code === 'EADDRINUSE' && currentPortIndex < PORTS.length - 1) {
                currentPortIndex++;
                startServer();
            } else {
                console.error('Erreur lors du démarrage du serveur:', err);
            }
        });
}

startServer();

// Routes pour les produits
app.get('/products', async (req, res) => {
    try {
        const filters = {
            category: req.query.category,
            inStock: req.query.inStock === 'true' ? true : 
                    req.query.inStock === 'false' ? false : undefined
        };
        const products = await db.getProducts(filters);
        res.json(products);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

app.post('/products', async (req, res) => {
    try {
        const product = await db.addProduct(req.body);
        res.status(201).json(product);
    } catch (error) {
        res.status(400).json({ error: error.message });
    }
});

// Routes pour le panier
app.get('/cart/:userId', async (req, res) => {
    try {
        const cart = await db.getCart(req.params.userId);
        res.json(cart);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

app.post('/cart/:userId', async (req, res) => {
    try {
        const { productId, quantity } = req.body;
        const cart = await db.addToCart(req.params.userId, productId, quantity);
        res.json(cart);
    } catch (error) {
        res.status(400).json({ error: error.message });
    }
}); 
// Import des dépendances nécessaires
const express = require('express');
const validators = require('./validators');
const db = require('./db');
const app = express();

// Définition des ports possibles
const PORTS = [3001, 3002, 3003];
let currentPortIndex = 0;

// Middlewares
app.use(express.json());
app.use(express.static('public'));

// Route principale
app.get('/', (req, res) => {
    res.json({
        message: "Hello World!"
    });
});

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

app.post('/products', 
    validators.productValidators.create,
    validators.validate,
    async (req, res) => {
        try {
            const product = await db.addProduct(req.body);
            res.status(201).json(product);
        } catch (error) {
            res.status(400).json({ error: error.message });
        }
    }
);

// Routes pour le panier
app.get('/cart/:userId',
    validators.cartValidators.getCart,
    validators.validate,
    async (req, res) => {
        try {
            const cart = await db.getCart(req.params.userId);
            if (!cart) {
                return res.status(404).json({ error: 'Cart not found' });
            }
            res.json(cart);
        } catch (error) {
            res.status(500).json({ error: error.message });
        }
    }
);

app.post('/cart/:userId',
    validators.cartValidators.addItem,
    validators.validate,
    async (req, res) => {
        try {
            const cart = await db.addToCart(req.params.userId, req.body.productId, req.body.quantity);
            res.json(cart);
        } catch (error) {
            res.status(400).json({ error: error.message });
        }
    }
);

// Routes additionnelles pour les produits
app.get('/products/:id', 
    validators.productValidators.getById,
    validators.validate,
    async (req, res) => {
        try {
            const product = await db.getProductById(req.params.id);
            if (!product) {
                return res.status(404).json({ error: 'Product not found' });
            }
            res.json(product);
        } catch (error) {
            res.status(500).json({ error: error.message });
        }
    }
);

app.put('/products/:id',
    validators.productValidators.update,
    validators.validate,
    async (req, res) => {
        try {
            const product = await db.updateProduct(req.params.id, req.body);
            res.json(product);
        } catch (error) {
            res.status(400).json({ error: error.message });
        }
    }
);

app.delete('/products/:id', async (req, res) => {
    try {
        const result = await db.deleteProduct(req.params.id);
        if (!result) {
            return res.status(404).json({ error: 'Product not found' });
        }
        res.json(result);
    } catch (error) {
        res.status(400).json({ error: error.message });
    }
});

// Routes pour les commandes
app.post('/orders',
    validators.orderValidators.create,
    validators.validate,
    async (req, res) => {
        try {
            const order = await db.createOrder(req.body.userId, req.body.items);
            res.status(201).json(order);
        } catch (error) {
            res.status(400).json({ error: error.message });
        }
    }
);

app.get('/orders/:userId', async (req, res) => {
    try {
        const orders = await db.getOrders(req.params.userId);
        res.json(orders);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Route additionnelle pour le panier
app.delete('/cart/:userId/item/:productId', async (req, res) => {
    try {
        const cart = await db.removeFromCart(req.params.userId, req.params.productId);
        res.json(cart);
    } catch (error) {
        res.status(400).json({ error: error.message });
    }
});

// Middleware de gestion d'erreurs (doit être le dernier middleware)
app.use((err, req, res, next) => {
    console.error(err.stack);
    res.status(500).json({
        error: 'Une erreur est survenue !',
        message: process.env.NODE_ENV === 'development' ? err.message : undefined
    });
});

// Fonction pour démarrer le serveur
function startServer() {
    const PORT = PORTS[currentPortIndex];
    app.listen(PORT, async () => {
        await db.load();
        console.log(`🚀 Serveur e-commerce démarré sur http://localhost:${PORT}`);
    }).on('error', (err) => {
        if (err.code === 'EADDRINUSE' && currentPortIndex < PORTS.length - 1) {
            currentPortIndex++;
            startServer();
        } else {
            console.error('Erreur lors du démarrage du serveur:', err);
        }
    });
}

startServer();
const fs = require('fs').promises;
const path = require('path');

const dbPath = path.join(__dirname, 'data', 'db.json');

class Database {
    constructor() {
        this.data = null;
    }

    async load() {
        try {
            const data = await fs.readFile(dbPath, 'utf8');
            this.data = JSON.parse(data);
        } catch (error) {
            this.data = {
                products: [],
                orders: [],
                carts: {}
            };
            await this.save();
        }
    }

    async save() {
        await fs.writeFile(dbPath, JSON.stringify(this.data, null, 2));
    }

    // Méthodes pour les produits
    async getProducts(filters = {}) {
        return this.data.products.filter(product => {
            if (filters.category && product.category !== filters.category) return false;
            if (filters.inStock === true && product.stock <= 0) return false;
            if (filters.inStock === false && product.stock > 0) return false;
            return true;
        });
    }

    async getProductById(id) {
        return this.data.products.find(p => p.id === id);
    }

    async addProduct(product) {
        const id = Date.now().toString();
        const newProduct = { id, ...product };
        this.data.products.push(newProduct);
        await this.save();
        return newProduct;
    }

    // Méthodes pour le panier
    async getCart(userId) {
        return this.data.carts[userId] || { items: [], total: 0 };
    }

    async addToCart(userId, productId, quantity) {
        if (!this.data.carts[userId]) {
            this.data.carts[userId] = { items: [], total: 0 };
        }
        
        const product = await this.getProductById(productId);
        if (!product) throw new Error('Product not found');

        const cart = this.data.carts[userId];
        const existingItem = cart.items.find(item => item.productId === productId);

        if (existingItem) {
            existingItem.quantity += quantity;
        } else {
            cart.items.push({
                productId,
                quantity,
                price: product.price
            });
        }

        cart.total = cart.items.reduce((sum, item) => sum + (item.price * item.quantity), 0);
        await this.save();
        return cart;
    }
}

const db = new Database();

module.exports = db; 
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

    // Méthodes additionnelles pour les produits
    async updateProduct(id, updates) {
        const index = this.data.products.findIndex(p => p.id === id);
        if (index === -1) throw new Error('Product not found');
        
        this.data.products[index] = { ...this.data.products[index], ...updates };
        await this.save();
        return this.data.products[index];
    }

    async deleteProduct(id) {
        const index = this.data.products.findIndex(p => p.id === id);
        if (index === -1) throw new Error('Product not found');
        
        this.data.products.splice(index, 1);
        await this.save();
        return { message: 'Product deleted successfully' };
    }

    // Méthodes pour les commandes
    async createOrder(userId, items) {
        const order = {
            id: Date.now().toString(),
            userId,
            items: [],
            total: 0,
            status: 'pending',
            createdAt: new Date().toISOString()
        };

        // Vérifier et ajouter chaque item
        for (const item of items) {
            const product = await this.getProductById(item.productId);
            if (!product) throw new Error(`Product ${item.productId} not found`);
            if (product.stock < item.quantity) throw new Error(`Insufficient stock for product ${product.id}`);

            order.items.push({
                productId: product.id,
                quantity: item.quantity,
                price: product.price,
                subtotal: product.price * item.quantity
            });

            // Mettre à jour le stock
            product.stock -= item.quantity;
        }

        order.total = order.items.reduce((sum, item) => sum + item.subtotal, 0);
        this.data.orders.push(order);
        await this.save();
        return order;
    }

    async getOrders(userId) {
        return this.data.orders.filter(order => order.userId === userId);
    }

    // Méthode additionnelle pour le panier
    async removeFromCart(userId, productId) {
        if (!this.data.carts[userId]) throw new Error('Cart not found');
        
        const cart = this.data.carts[userId];
        const index = cart.items.findIndex(item => item.productId === productId);
        
        if (index === -1) throw new Error('Product not found in cart');
        
        cart.items.splice(index, 1);
        cart.total = cart.items.reduce((sum, item) => sum + (item.price * item.quantity), 0);
        
        await this.save();
        return cart;
    }
}

const db = new Database();

module.exports = db; 
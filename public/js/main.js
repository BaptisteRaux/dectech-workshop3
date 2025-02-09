let cart = { items: [], total: 0 };
const userId = 'user123';

async function loadProducts() {
    const response = await fetch('/products');
    const products = await response.json();
    
    const productsDiv = document.getElementById('products');
    productsDiv.innerHTML = products.map(product => `
        <div class="col-md-4 mb-4">
            <div class="card">
                <div class="card-body">
                    <h5 class="card-title">${product.name}</h5>
                    <p class="card-text">${product.description}</p>
                    <p class="card-text">Prix: ${product.price}€</p>
                    <p class="card-text">Stock: ${product.stock}</p>
                    <button class="btn btn-primary" onclick="addToCart('${product.id}')">
                        Ajouter au panier
                    </button>
                </div>
            </div>
        </div>
    `).join('');
}

async function addToCart(productId) {
    try {
        const response = await fetch(`/cart/${userId}`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ productId, quantity: 1 })
        });
        cart = await response.json();
        updateCartCount();
    } catch (error) {
        alert('Erreur lors de l\'ajout au panier');
    }
}

async function showCart() {
    const response = await fetch(`/cart/${userId}`);
    cart = await response.json();
    
    const cartItems = document.getElementById('cartItems');
    const itemsWithDetails = await Promise.all(cart.items.map(async item => {
        const productResponse = await fetch(`/products/${item.productId}`);
        const product = await productResponse.json();
        return {
            ...item,
            name: product.name
        };
    }));

    cartItems.innerHTML = itemsWithDetails.map(item => `
        <div class="d-flex justify-content-between mb-2">
            <span>${item.name} (${item.quantity})</span>
            <span>${(item.price * item.quantity).toFixed(2)}€</span>
        </div>
    `).join('');
    
    document.getElementById('cartTotal').textContent = cart.total.toFixed(2);
    new bootstrap.Modal(document.getElementById('cartModal')).show();
}

async function checkout() {
    try {
        const response = await fetch('/orders', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                userId,
                items: cart.items.map(item => ({
                    productId: item.productId,
                    quantity: item.quantity
                }))
            })
        });
        
        if (response.ok) {
            alert('Commande effectuée avec succès !');
            cart = { items: [], total: 0 };
            updateCartCount();
            bootstrap.Modal.getInstance(document.getElementById('cartModal')).hide();
        }
    } catch (error) {
        alert('Erreur lors de la commande');
    }
}

function updateCartCount() {
    document.getElementById('cartCount').textContent = cart.items.length;
}

loadProducts();
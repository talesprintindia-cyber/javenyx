const WHATSAPP_NO = "7003282856";
const CART_KEY = 'javenyx_cart_data';

// Helper: Get cart from local storage
function getCart() {
    return JSON.parse(localStorage.getItem(CART_KEY)) || [];
}

// Helper: Update fixed cart count in UI
function updateCartUI() {
    const cart = getCart();
    const count = cart.reduce((sum, item) => sum + item.qty, 0);
    const cartCounts = document.querySelectorAll('.cart-btn-fixed');
    if (cartCounts) {
        cartCounts.forEach(el => el.textContent = `Cart (${count})`);
    }
}

// category.html: Update visual quantity
function updateQty(btn, change) {
    const qtyNum = btn.parentNode.querySelector('.qty-num');
    let currentQty = parseInt(qtyNum.textContent);
    currentQty += change;
    if (currentQty < 1) currentQty = 1;
    qtyNum.textContent = currentQty;
}

// category.html: Add item to cart
function addToCart(btn, sku) {
    const card = btn.closest('.card');
    const qty = parseInt(card.querySelector('.qty-num').textContent);
    let cart = getCart();
    
    const existingIndex = cart.findIndex(item => item.sku === sku);
    if (existingIndex > -1) {
        cart[existingIndex].qty += qty;
    } else {
        cart.push({ sku, qty });
    }
    
    localStorage.setItem(CART_KEY, JSON.stringify(cart));
    btn.textContent = `✓ Added (${qty})`;
    btn.style.background = "#2a4365";
    setTimeout(() => { btn.textContent = "Add to Cart"; btn.style.background = "#c79a24"; }, 1500);
    updateCartUI();
}

// cart.html: Render the checkout page
function renderCartPage(productsDatabase) {
    const cart = getCart();
    const list = document.getElementById('cartItemsList');
    let subtotal = 0;
    
    if (cart.length === 0) {
        list.innerHTML = `<div style="text-align:center;color:#718096;padding:20px;">Your cart is empty.</div>`;
        return;
    }

    list.innerHTML = cart.map((cartItem, index) => {
        const p = productsDatabase.find(pd => pd.sku === cartItem.sku);
        if (!p) return ''; // SKUs mismatch scenario
        const lineTotal = p.price * cartItem.qty;
        subtotal += lineTotal;
        return `
        <div class="cart-item">
          <img src="${p.image || 'https://via.placeholder.com/50'}" alt="${p.title}">
          <div class="cart-item-details">
            <div class="cart-item-title">${p.title}</div>
            <div class="cart-item-price">₹${p.price.toFixed(2)} × ${cartItem.qty}</div>
            <button class="btn-remove" onclick="removeCartItem(${index})">Remove</button>
          </div>
        </div>
      `}).join('');

    document.getElementById('subtotalPrice').textContent = `₹${subtotal.toFixed(2)}`;
    document.getElementById('grandTotalPrice').textContent = `₹${subtotal.toFixed(2)}`;
    generateWACheckoutLink(cart, productsDatabase, subtotal);
}

function removeCartItem(index) {
    let cart = getCart();
    cart.splice(index, 1);
    localStorage.setItem(CART_KEY, JSON.stringify(cart));
    init(); // Reload current view from database scenario
}

function generateWACheckoutLink(cart, productsDatabase, grandTotal) {
    // Structure the message header
    let message = "Hi! I would like to place an order:\n---\n";
    
    // Add each line item
    cart.forEach((cartItem, i) => {
        const p = productsDatabase.find(pd => pd.sku === cartItem.sku);
        if(p){
            message += `${i+1}. ${p.title} (₹${p.price.toFixed(2)}) × ${cartItem.qty}\n`;
        }
    });

    // Add total and footer
    message += `---\nGrand Total: ₹${grandTotal.toFixed(2)}\n\nPlease provide payment details. Thank you!`;
    
    const waCheckoutBtn = document.getElementById('checkoutWA');
    waCheckoutBtn.href = `https://wa.me/${WHATSAPP_NO}?text=${encodeURIComponent(message)}`;
    waCheckoutBtn.classList.remove('hidden');
}

// Initialize on page load across all pages
updateCartUI();
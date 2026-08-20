const WHATSAPP_NO = "7003282856";
const CART_KEY = 'javenyx_carts_v1';

// Helper: Get cart array from local storage
function getCart() {
    return JSON.parse(localStorage.getItem(CART_KEY)) || [];
}

// Helper: Update fixed cart count button across all pages
function updateFixedCartUI() {
    const cart = getCart();
    const count = cart.reduce((sum, item) => sum + item.qty, 0);
    const cartBtn = document.getElementById('cartFixedCount');
    if (cartBtn) {
        if (count > 0) {
            cartBtn.textContent = `Cart (${count})`;
            cartBtn.classList.remove('hidden');
        } else {
            cartBtn.classList.add('hidden');
        }
    }
}

// category.html: Update visual quantity picker
function updateQty(btn, change) {
    const qtyNum = btn.parentNode.querySelector('.qty-num');
    let currentQty = parseInt(qtyNum.textContent);
    currentQty += change;
    if (currentQty < 1) currentQty = 1;
    qtyNum.textContent = currentQty;
}

// category.html: Add item and quantity to cart
function addToCart(btn, sku) {
    const card = btn.closest('.card');
    const qtyNum = card.querySelector('.qty-num');
    const qtyToAdd = parseInt(qtyNum.textContent);
    let cart = getCart();
    
    // Convert SKU to string for stable comparison
    sku = String(sku);

    const existingIndex = cart.findIndex(item => item.sku === sku);
    if (existingIndex > -1) {
        cart[existingIndex].qty += qtyToAdd;
    } else {
        cart.push({ sku, qty: qtyToAdd });
    }
    
    // Save updated cart back to local storage
    localStorage.setItem(CART_KEY, JSON.stringify(cart));
    
    // Success feedback
    btn.textContent = `✓ Added (${qtyToAdd})`;
    btn.style.background = "#2a4365";
    setTimeout(() => { btn.textContent = "Add to Cart"; btn.style.background = "#c79a24"; }, 1500);
    
    // Reset picker
    qtyNum.textContent = "1";
    updateFixedCartUI();
}

// Global search within product view (category.html)
function globalSearch() {
    const search = document.getElementById('searchInput').value.toLowerCase();
    const grid = document.getElementById('productGrid');
    if(!grid || search.length < 2) return;
    
    // Search is performed across the already rendered products
    const matches = products.filter(p => 
        p.cat === currentCat && (
            p.title.toLowerCase().includes(search) || 
            (p.sku && String(p.sku).toLowerCase().includes(search))
        )
    );
    renderProducts(matches);
}

// cart.html: Render the checkout page
function renderCartPage(productsDatabase) {
    const cart = getCart();
    const list = document.getElementById('cartItemsList');
    let total = 0;
    
    if (cart.length === 0) {
        list.innerHTML = `<div style="text-align:center;color:#718096;padding:20px 0;font-size:14px;">Your cart is empty.</div>`;
        return;
    }

    list.innerHTML = cart.map((cartItem, index) => {
        // Find product details from database using string SKU
        const p = productsDatabase.find(pd => String(pd.sku) === cartItem.sku);
        if (!p) return ''; // Skip mismatch scenarious
        const lineTotal = p.price * cartItem.qty;
        total += lineTotal;
        return `
        <div class="cart-item">
          <img src="${p.image || 'https://via.placeholder.com/50'}" alt="${p.title}" loading="lazy">
          <div class="cart-item-details">
            <div class="cart-item-title">${p.title}</div>
            <div class="cart-item-price">₹${p.price.toFixed(2)} × ${cartItem.qty} = ₹${lineTotal.toFixed(2)}</div>
            <button class="btn-remove" onclick="removeCartItem(${index})">Remove</button>
          </div>
        </div>
      `}).join('');

    document.getElementById('grandTotalPrice').textContent = `₹${total.toFixed(2)}`;
    document.getElementById('totalArea').classList.remove('hidden');
    generateWACheckoutLink(cart, productsDatabase, total);
}

function removeCartItem(index) {
    let cart = getCart();
    cart.splice(index, 1);
    localStorage.setItem(CART_KEY, JSON.stringify(cart));
    // Reload database view (category.html logic)
    init();
}

//cart.html: Generate final WhatsApp checkout URL
function generateWACheckoutLink(cart, productsDatabase, grandTotal) {
    // Message Header
    let message = "Hi Javenyx! I would like to place a new order:\n---\n";
    
    // Add each line item
    cart.forEach((cartItem, i) => {
        const p = productsDatabase.find(pd => String(pd.sku) === cartItem.sku);
        if(p){
            message += `${i+1}. ${p.title} (₹${p.price.toFixed(2)}) × ${cartItem.qty}\n`;
        }
    });

    // Total and Footer
    message += `---\nGrand Total: ₹${grandTotal.toFixed(2)}\n\nPlease provide payment details. Thank you!`;
    
    const waCheckoutBtn = document.getElementById('checkoutWA');
    // Important: EncodeURIComponent handles spaces/linebreaks for the URL
    waCheckoutBtn.href = `https://wa.me/${WHATSAPP_NO}?text=${encodeURIComponent(message)}`;
}

// Initialize on page load across all pages
updateFixedCartUI();
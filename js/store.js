/**
 * INNBOX E-Commerce - Storefront Logic
 * Domain: innbox.qweekbd.com
 */

// State Management
let products = [];
let cart = JSON.parse(localStorage.getItem('innbox_cart') || '[]');
let currentCategory = 'all';
let searchQuery = '';
let currentSort = 'default';
let activeProductForModal = null;

// Initialize Store
document.addEventListener('DOMContentLoaded', async () => {
    updateCartUI();
    await loadProducts();
    setupEventListeners();
    applySettingsToStorefront();
});

// Load settings into storefront UI
function applySettingsToStorefront() {
    const settings = window.InnboxAPI ? window.InnboxAPI.getSettings() : {};
    
    // Delivery fees
    const insideRate = document.querySelectorAll('.fee-inside-dhaka');
    const outsideRate = document.querySelectorAll('.fee-outside-dhaka');
    insideRate.forEach(el => el.textContent = `৳${settings.insideDhakaFee || 70}`);
    outsideRate.forEach(el => el.textContent = `৳${settings.outsideDhakaFee || 130}`);

    // Phone & WhatsApp
    const phoneLinks = document.querySelectorAll('.store-phone');
    phoneLinks.forEach(el => {
        el.textContent = settings.storePhone || '+880 1700-000000';
        if (el.tagName === 'A') el.href = `tel:${(settings.storePhone || '').replace(/\s+/g, '')}`;
    });

    const waLinks = document.querySelectorAll('.store-whatsapp-btn');
    waLinks.forEach(el => {
        el.href = `https://wa.me/${(settings.whatsappNumber || '8801700000000').replace(/\D/g, '')}?text=${encodeURIComponent('Hello innbox! I want to inquire about products.')}`;
    });
}

// Fetch and render products
async function loadProducts() {
    const grid = document.getElementById('products-grid');
    if (grid) {
        grid.innerHTML = `
            <div class="col-span-full py-16 text-center">
                <div class="inline-block animate-spin rounded-full h-10 w-10 border-4 border-rose-500 border-t-transparent mb-4"></div>
                <p class="text-stone-500 font-medium">Loading exclusive collection...</p>
            </div>
        `;
    }

    try {
        products = await window.InnboxAPI.getProducts();
        renderProducts();
    } catch (err) {
        console.error('Failed to load products:', err);
        if (grid) {
            grid.innerHTML = `
                <div class="col-span-full py-12 text-center text-red-500">
                    Failed to load products. Please check connection.
                </div>
            `;
        }
    }
}

// Render filtered and sorted products
function renderProducts() {
    const grid = document.getElementById('products-grid');
    if (!grid) return;

    let filtered = products.filter(p => p.is_active !== false);

    // Filter by category
    if (currentCategory !== 'all') {
        filtered = filtered.filter(p => {
            if (currentCategory === 'wellness') return p.category.toLowerCase().includes('wellness');
            return p.category.toLowerCase() === currentCategory.toLowerCase();
        });
    }

    // Filter by search
    if (searchQuery.trim()) {
        const query = searchQuery.toLowerCase();
        filtered = filtered.filter(p => 
            p.title.toLowerCase().includes(query) || 
            (p.description && p.description.toLowerCase().includes(query)) ||
            p.category.toLowerCase().includes(query)
        );
    }

    // Sort
    if (currentSort === 'price-low') {
        filtered.sort((a, b) => (a.discount_price || a.price) - (b.discount_price || b.price));
    } else if (currentSort === 'price-high') {
        filtered.sort((a, b) => (b.discount_price || b.price) - (a.discount_price || a.price));
    } else if (currentSort === 'newest') {
        filtered.sort((a, b) => new Date(b.created_at) - new Date(a.created_at));
    }

    const countEl = document.getElementById('product-count');
    if (countEl) countEl.textContent = `${filtered.length} products found`;

    if (filtered.length === 0) {
        grid.innerHTML = `
            <div class="col-span-full py-20 text-center bg-stone-50 rounded-2xl border border-stone-200">
                <i class="fa-solid fa-box-open text-4xl text-stone-300 mb-3"></i>
                <h3 class="text-lg font-semibold text-stone-800">No items found</h3>
                <p class="text-sm text-stone-500 mt-1">Try selecting another category or clear your search query.</p>
                <button onclick="resetFilters()" class="mt-4 px-5 py-2 text-sm bg-rose-600 hover:bg-rose-700 text-white font-medium rounded-full transition shadow">
                    View All Items
                </button>
            </div>
        `;
        return;
    }

    grid.innerHTML = filtered.map(product => {
        const hasDiscount = product.discount_price && product.discount_price < product.price;
        const currentPrice = hasDiscount ? product.discount_price : product.price;
        const discountPercent = hasDiscount ? Math.round(((product.price - product.discount_price) / product.price) * 100) : 0;
        const defaultSize = (product.sizes && product.sizes.length > 0) ? product.sizes[0] : '';
        const imgUrl = product.thumbnail || (product.images && product.images[0]) || 'https://images.unsplash.com/photo-1596704017254-9b121068fb31?w=400';

        return `
            <div class="group bg-white rounded-2xl overflow-hidden border border-stone-100 shadow-sm hover:shadow-xl transition-all duration-300 flex flex-col">
                <!-- Image & Badges -->
                <div class="relative overflow-hidden aspect-[4/5] bg-stone-100 cursor-pointer" onclick="openQuickView('${product.id}')">
                    <img src="${imgUrl}" alt="${product.title}" 
                         class="w-full h-full object-cover object-center group-hover:scale-105 transition-transform duration-500" 
                         loading="lazy" />
                    
                    <!-- Badges -->
                    <div class="absolute top-3 left-3 flex flex-col gap-1.5 z-10">
                        ${hasDiscount ? `
                            <span class="bg-rose-600 text-white text-[11px] font-bold px-2.5 py-0.5 rounded-full shadow-sm">
                                -${discountPercent}% OFF
                            </span>
                        ` : ''}
                        ${product.is_discreet ? `
                            <span class="bg-stone-900/80 backdrop-blur-sm text-white text-[10px] font-medium px-2 py-0.5 rounded-full flex items-center gap-1">
                                <i class="fa-solid fa-user-shield text-[9px] text-emerald-400"></i> 100% Discreet
                            </span>
                        ` : ''}
                    </div>

                    <!-- Category Pill -->
                    <div class="absolute bottom-3 left-3 z-10">
                        <span class="bg-white/90 backdrop-blur-sm text-stone-800 text-[11px] font-semibold px-2.5 py-1 rounded-lg shadow-sm">
                            ${product.category}
                        </span>
                    </div>

                    <!-- Quick View Overlay Button -->
                    <button type="button" onclick="event.stopPropagation(); openQuickView('${product.id}')" 
                            class="absolute top-3 right-3 w-9 h-9 bg-white/90 hover:bg-rose-600 hover:text-white text-stone-700 rounded-full flex items-center justify-center shadow-md transition-all opacity-0 group-hover:opacity-100 transform translate-y-1 group-hover:translate-y-0"
                            title="Quick View">
                        <i class="fa-regular fa-eye text-sm"></i>
                    </button>
                </div>

                <!-- Product Details -->
                <div class="p-4 flex-1 flex flex-col justify-between">
                    <div>
                        <h3 class="font-semibold text-stone-900 text-sm line-clamp-2 hover:text-rose-700 cursor-pointer transition mb-2" onclick="openQuickView('${product.id}')">
                            ${product.title}
                        </h3>

                        <!-- Price display -->
                        <div class="flex items-baseline gap-2 mb-3">
                            <span class="text-lg font-bold text-rose-700">৳${currentPrice}</span>
                            ${hasDiscount ? `
                                <span class="text-xs text-stone-400 line-through">৳${product.price}</span>
                            ` : ''}
                        </div>

                        <!-- Available Sizes preview -->
                        ${product.sizes && product.sizes.length > 0 ? `
                            <div class="flex flex-wrap gap-1 mb-4">
                                ${product.sizes.slice(0, 4).map(size => `
                                    <span class="text-[10px] font-medium bg-stone-100 text-stone-600 px-2 py-0.5 rounded border border-stone-200">
                                        ${size}
                                    </span>
                                `).join('')}
                                ${product.sizes.length > 4 ? `
                                    <span class="text-[10px] text-stone-400 px-1 py-0.5">+${product.sizes.length - 4} more</span>
                                ` : ''}
                            </div>
                        ` : '<div class="h-6"></div>'}
                    </div>

                    <!-- Action Buttons -->
                    <div class="grid grid-cols-2 gap-2 pt-2 border-t border-stone-100">
                        <button onclick="quickOrder('${product.id}')" 
                                class="w-full py-2 bg-stone-900 hover:bg-stone-800 text-white text-xs font-semibold rounded-xl flex items-center justify-center gap-1.5 transition active:scale-95 shadow-sm">
                            <i class="fa-solid fa-bolt text-rose-400 text-xs"></i> Buy Now
                        </button>
                        <button onclick="addToCart('${product.id}', '${defaultSize}')" 
                                class="w-full py-2 bg-rose-50 hover:bg-rose-100 text-rose-700 hover:text-rose-800 text-xs font-semibold rounded-xl flex items-center justify-center gap-1.5 transition active:scale-95 border border-rose-200/60">
                            <i class="fa-solid fa-bag-shopping text-xs"></i> Add
                        </button>
                    </div>
                </div>
            </div>
        `;
    }).join('');
}

// Reset all search and category filters
function resetFilters() {
    currentCategory = 'all';
    searchQuery = '';
    const searchInput = document.getElementById('search-input');
    if (searchInput) searchInput.value = '';
    
    // Update active tab buttons
    document.querySelectorAll('.cat-pill').forEach(btn => {
        if (btn.dataset.category === 'all') {
            btn.classList.add('bg-rose-700', 'text-white');
            btn.classList.remove('bg-white', 'text-stone-700');
        } else {
            btn.classList.remove('bg-rose-700', 'text-white');
            btn.classList.add('bg-white', 'text-stone-700');
        }
    });

    renderProducts();
}

// Open Quick View Modal
function openQuickView(productId) {
    const product = products.find(p => p.id === productId);
    if (!product) return;
    activeProductForModal = product;

    const modal = document.getElementById('quickview-modal');
    const container = document.getElementById('quickview-content');
    if (!modal || !container) return;

    const hasDiscount = product.discount_price && product.discount_price < product.price;
    const currentPrice = hasDiscount ? product.discount_price : product.price;
    const discountPercent = hasDiscount ? Math.round(((product.price - product.discount_price) / product.price) * 100) : 0;
    const imgUrl = product.thumbnail || (product.images && product.images[0]) || 'https://images.unsplash.com/photo-1596704017254-9b121068fb31?w=600';

    container.innerHTML = `
        <div class="grid grid-cols-1 md:grid-cols-2 gap-6 p-6">
            <!-- Product Image -->
            <div class="relative rounded-2xl overflow-hidden bg-stone-100 aspect-[4/5]">
                <img id="qv-main-img" src="${imgUrl}" alt="${product.title}" class="w-full h-full object-cover">
                <div class="absolute top-3 left-3 flex flex-col gap-1.5">
                    ${hasDiscount ? `
                        <span class="bg-rose-600 text-white text-xs font-bold px-2.5 py-1 rounded-full shadow">
                            -${discountPercent}% OFF
                        </span>
                    ` : ''}
                    <span class="bg-stone-900/85 backdrop-blur-sm text-white text-[11px] font-medium px-2.5 py-0.5 rounded-full flex items-center gap-1.5">
                        <i class="fa-solid fa-shield-halved text-emerald-400"></i> Secret Packaging
                    </span>
                </div>
            </div>

            <!-- Product Info -->
            <div class="flex flex-col justify-between">
                <div>
                    <span class="inline-block text-xs font-semibold text-rose-700 bg-rose-50 px-2.5 py-1 rounded-md mb-2">
                        ${product.category}
                    </span>
                    <h2 class="text-xl font-bold text-stone-900 leading-snug mb-3">${product.title}</h2>
                    
                    <div class="flex items-baseline gap-3 mb-4">
                        <span class="text-2xl font-extrabold text-rose-700">৳${currentPrice}</span>
                        ${hasDiscount ? `<span class="text-sm text-stone-400 line-through">৳${product.price}</span>` : ''}
                    </div>

                    <p class="text-stone-600 text-sm leading-relaxed mb-6">${product.description || 'Premium intimate apparel tailored for superior comfort, soft touch, and discreet elegance.'}</p>

                    <!-- Sizes Selector -->
                    ${product.sizes && product.sizes.length > 0 ? `
                        <div class="mb-5">
                            <div class="flex justify-between items-center mb-2">
                                <label class="text-xs font-bold uppercase tracking-wider text-stone-700">Select Size</label>
                                <button type="button" onclick="openSizeGuideModal()" class="text-xs text-rose-600 hover:underline flex items-center gap-1">
                                    <i class="fa-solid fa-ruler"></i> Size Guide
                                </button>
                            </div>
                            <div class="flex flex-wrap gap-2" id="qv-size-options">
                                ${product.sizes.map((sz, idx) => `
                                    <button type="button" onclick="selectModalSize(this, '${sz}')" 
                                            class="qv-size-btn px-3 py-1.5 text-xs font-semibold rounded-lg border ${idx === 0 ? 'border-rose-600 bg-rose-50 text-rose-700' : 'border-stone-200 bg-white text-stone-700 hover:border-stone-300'} transition">
                                        ${sz}
                                    </button>
                                `).join('')}
                            </div>
                        </div>
                    ` : ''}

                    <!-- Quantity selector -->
                    <div class="mb-6 flex items-center gap-3">
                        <label class="text-xs font-bold uppercase tracking-wider text-stone-700">Quantity</label>
                        <div class="inline-flex items-center border border-stone-200 rounded-lg bg-stone-50">
                            <button type="button" onclick="adjustModalQty(-1)" class="w-8 h-8 flex items-center justify-center text-stone-600 hover:bg-stone-200 rounded-l-lg font-bold">-</button>
                            <span id="qv-qty" class="w-10 text-center font-bold text-sm text-stone-800">1</span>
                            <button type="button" onclick="adjustModalQty(1)" class="w-8 h-8 flex items-center justify-center text-stone-600 hover:bg-stone-200 rounded-r-lg font-bold">+</button>
                        </div>
                    </div>

                    <!-- Privacy Guarantee Box -->
                    <div class="p-3 bg-stone-50 border border-stone-200/80 rounded-xl mb-6 flex items-start gap-3">
                        <i class="fa-solid fa-box text-rose-600 text-lg mt-0.5"></i>
                        <div class="text-xs text-stone-600">
                            <strong class="text-stone-800 block mb-0.5">100% Confidential Delivery:</strong>
                            Packed in a sturdy plain box with no item names or revealing logos outside. The courier agent will only see your name and phone number.
                        </div>
                    </div>
                </div>

                <!-- Action CTA -->
                <div class="grid grid-cols-2 gap-3 pt-4 border-t border-stone-100">
                    <button type="button" onclick="confirmModalBuyNow()" 
                            class="w-full py-3 bg-stone-900 hover:bg-stone-800 text-white font-bold text-sm rounded-xl flex items-center justify-center gap-2 shadow-lg transition">
                        <i class="fa-solid fa-bolt text-rose-400"></i> Buy Now
                    </button>
                    <button type="button" onclick="confirmModalAddToCart()" 
                            class="w-full py-3 bg-rose-600 hover:bg-rose-700 text-white font-bold text-sm rounded-xl flex items-center justify-center gap-2 shadow-lg transition">
                        <i class="fa-solid fa-bag-shopping"></i> Add to Cart
                    </button>
                </div>
            </div>
        </div>
    `;

    // Default selected size
    window.selectedModalSize = (product.sizes && product.sizes.length > 0) ? product.sizes[0] : '';
    window.selectedModalQty = 1;

    modal.classList.remove('hidden');
    modal.classList.add('flex');
}

function closeQuickView() {
    const modal = document.getElementById('quickview-modal');
    if (modal) {
        modal.classList.add('hidden');
        modal.classList.remove('flex');
    }
}

function selectModalSize(btn, size) {
    document.querySelectorAll('.qv-size-btn').forEach(b => {
        b.classList.remove('border-rose-600', 'bg-rose-50', 'text-rose-700');
        b.classList.add('border-stone-200', 'bg-white', 'text-stone-700');
    });
    btn.classList.add('border-rose-600', 'bg-rose-50', 'text-rose-700');
    btn.classList.remove('border-stone-200', 'bg-white', 'text-stone-700');
    window.selectedModalSize = size;
}

function adjustModalQty(delta) {
    let current = window.selectedModalQty || 1;
    current = Math.max(1, current + delta);
    window.selectedModalQty = current;
    const el = document.getElementById('qv-qty');
    if (el) el.textContent = current;
}

function confirmModalAddToCart() {
    if (!activeProductForModal) return;
    addToCart(activeProductForModal.id, window.selectedModalSize, window.selectedModalQty || 1);
    closeQuickView();
}

function confirmModalBuyNow() {
    if (!activeProductForModal) return;
    addToCart(activeProductForModal.id, window.selectedModalSize, window.selectedModalQty || 1);
    closeQuickView();
    openCheckoutDrawer();
}

// Direct quick order (adds 1 to cart & immediately opens checkout)
function quickOrder(productId) {
    const product = products.find(p => p.id === productId);
    if (!product) return;
    const defaultSize = (product.sizes && product.sizes.length > 0) ? product.sizes[0] : '';
    addToCart(productId, defaultSize, 1);
    openCheckoutDrawer();
}

// Cart Operations
function addToCart(productId, size = '', quantity = 1) {
    const product = products.find(p => p.id === productId);
    if (!product) return;

    const chosenSize = size || (product.sizes && product.sizes.length > 0 ? product.sizes[0] : 'Standard');
    const existingIndex = cart.findIndex(item => item.id === productId && item.size === chosenSize);

    if (existingIndex > -1) {
        cart[existingIndex].quantity += quantity;
    } else {
        const hasDiscount = product.discount_price && product.discount_price < product.price;
        const currentPrice = hasDiscount ? product.discount_price : product.price;
        cart.push({
            id: product.id,
            title: product.title,
            price: currentPrice,
            size: chosenSize,
            quantity: quantity,
            image: product.thumbnail || (product.images && product.images[0]) || ''
        });
    }

    saveCart();
    updateCartUI();
    showToast(`Added to cart: ${product.title}`);
}

function updateCartQuantity(index, delta) {
    if (cart[index]) {
        cart[index].quantity += delta;
        if (cart[index].quantity <= 0) {
            cart.splice(index, 1);
        }
        saveCart();
        updateCartUI();
    }
}

function removeFromCart(index) {
    if (cart[index]) {
        cart.splice(index, 1);
        saveCart();
        updateCartUI();
    }
}

function saveCart() {
    localStorage.setItem('innbox_cart', JSON.stringify(cart));
}

function updateCartUI() {
    const totalCount = cart.reduce((sum, item) => sum + item.quantity, 0);
    const subtotal = cart.reduce((sum, item) => sum + (item.price * item.quantity), 0);

    // Badges in header and floating button
    document.querySelectorAll('.cart-count-badge').forEach(badge => {
        badge.textContent = totalCount;
        if (totalCount > 0) {
            badge.classList.remove('hidden');
        } else {
            badge.classList.add('hidden');
        }
    });

    // Cart Drawer items container
    const itemsContainer = document.getElementById('cart-drawer-items');
    const subtotalEl = document.getElementById('cart-subtotal');
    if (subtotalEl) subtotalEl.textContent = `৳${subtotal}`;

    if (itemsContainer) {
        if (cart.length === 0) {
            itemsContainer.innerHTML = `
                <div class="py-16 text-center">
                    <i class="fa-solid fa-basket-shopping text-4xl text-stone-300 mb-3"></i>
                    <p class="text-stone-500 font-medium">Your cart is empty</p>
                    <button onclick="toggleCartDrawer(false)" class="mt-4 px-5 py-2 text-xs font-semibold bg-stone-900 text-white rounded-full hover:bg-stone-800 transition">
                        Continue Shopping
                    </button>
                </div>
            `;
        } else {
            itemsContainer.innerHTML = cart.map((item, idx) => `
                <div class="flex items-center gap-3 p-3 bg-stone-50 rounded-xl border border-stone-100">
                    <img src="${item.image || 'https://images.unsplash.com/photo-1596704017254-9b121068fb31?w=120'}" class="w-16 h-16 object-cover rounded-lg border border-stone-200">
                    <div class="flex-1 min-w-0">
                        <h4 class="text-xs font-bold text-stone-900 truncate">${item.title}</h4>
                        <div class="flex items-center gap-2 mt-0.5 text-[11px] text-stone-500">
                            <span class="bg-white px-1.5 py-0.5 rounded border border-stone-200 font-semibold text-rose-700">Size: ${item.size}</span>
                            <span>৳${item.price} each</span>
                        </div>
                        <div class="flex items-center justify-between mt-2">
                            <div class="inline-flex items-center border border-stone-200 rounded bg-white">
                                <button onclick="updateCartQuantity(${idx}, -1)" class="w-6 h-6 text-xs flex items-center justify-center font-bold text-stone-600 hover:bg-stone-100">-</button>
                                <span class="w-7 text-center text-xs font-bold text-stone-800">${item.quantity}</span>
                                <button onclick="updateCartQuantity(${idx}, 1)" class="w-6 h-6 text-xs flex items-center justify-center font-bold text-stone-600 hover:bg-stone-100">+</button>
                            </div>
                            <span class="text-xs font-bold text-stone-900">৳${item.price * item.quantity}</span>
                        </div>
                    </div>
                    <button onclick="removeFromCart(${idx})" class="text-stone-400 hover:text-red-500 p-1">
                        <i class="fa-solid fa-trash-can text-xs"></i>
                    </button>
                </div>
            `).join('');
        }
    }

    // Refresh Checkout Drawer Summary if open
    updateCheckoutSummary();
}

// Drawer Toggles
function toggleCartDrawer(open = true) {
    const drawer = document.getElementById('cart-drawer');
    const overlay = document.getElementById('cart-drawer-overlay');
    if (!drawer || !overlay) return;

    if (open) {
        drawer.classList.remove('translate-x-full');
        overlay.classList.remove('hidden');
    } else {
        drawer.classList.add('translate-x-full');
        overlay.classList.add('hidden');
    }
}

// Checkout Drawer & Processing
function openCheckoutDrawer() {
    if (cart.length === 0) {
        showToast('Your cart is empty! Add products first.');
        return;
    }
    toggleCartDrawer(false);

    const drawer = document.getElementById('checkout-modal');
    if (drawer) {
        drawer.classList.remove('hidden');
        drawer.classList.add('flex');
        updateCheckoutSummary();
    }
}

function closeCheckoutDrawer() {
    const drawer = document.getElementById('checkout-modal');
    if (drawer) {
        drawer.classList.add('hidden');
        drawer.classList.remove('flex');
    }
}

function updateCheckoutSummary() {
    const settings = window.InnboxAPI ? window.InnboxAPI.getSettings() : { insideDhakaFee: 70, outsideDhakaFee: 130 };
    const deliveryZoneEl = document.querySelector('input[name="checkout_delivery_zone"]:checked');
    const zone = deliveryZoneEl ? deliveryZoneEl.value : 'inside_dhaka';

    const deliveryFee = zone === 'inside_dhaka' ? Number(settings.insideDhakaFee || 70) : Number(settings.outsideDhakaFee || 130);
    const subtotal = cart.reduce((sum, item) => sum + (item.price * item.quantity), 0);
    const total = subtotal + deliveryFee;

    const feeEl = document.getElementById('checkout-delivery-fee');
    const subEl = document.getElementById('checkout-subtotal');
    const totalEl = document.getElementById('checkout-total');
    const itemsPreview = document.getElementById('checkout-items-preview');

    if (feeEl) feeEl.textContent = `৳${deliveryFee}`;
    if (subEl) subEl.textContent = `৳${subtotal}`;
    if (totalEl) totalEl.textContent = `৳${total}`;

    if (itemsPreview) {
        itemsPreview.innerHTML = cart.map(item => `
            <div class="flex items-center justify-between text-xs py-1 border-b border-stone-100 last:border-0">
                <span class="text-stone-700 truncate max-w-[200px]">${item.title} (${item.size}) x ${item.quantity}</span>
                <span class="font-bold text-stone-900">৳${item.price * item.quantity}</span>
            </div>
        `).join('');
    }
}

// Handle Payment Method Selection Toggle
function onPaymentMethodChange(radio) {
    const bkashBox = document.getElementById('bkash-info-box');
    const nagadBox = document.getElementById('nagad-info-box');
    const trxGroup = document.getElementById('trx-id-group');
    
    if (bkashBox) bkashBox.classList.add('hidden');
    if (nagadBox) nagadBox.classList.add('hidden');
    if (trxGroup) trxGroup.classList.add('hidden');

    const settings = window.InnboxAPI ? window.InnboxAPI.getSettings() : {};

    if (radio.value === 'bkash') {
        if (bkashBox) {
            bkashBox.classList.remove('hidden');
            const bkashNum = document.getElementById('bkash-merchant-number');
            if (bkashNum) bkashNum.textContent = settings.bkashNumber || '01700000000';
        }
        if (trxGroup) trxGroup.classList.remove('hidden');
    } else if (radio.value === 'nagad') {
        if (nagadBox) {
            nagadBox.classList.remove('hidden');
            const nagadNum = document.getElementById('nagad-merchant-number');
            if (nagadNum) nagadNum.textContent = settings.nagadNumber || '01700000000';
        }
        if (trxGroup) trxGroup.classList.remove('hidden');
    }
}

// Complete Checkout & Place Order
async function submitOrder(event) {
    event.preventDefault();
    if (cart.length === 0) {
        showToast('Your cart is empty.');
        return;
    }

    const form = document.getElementById('checkout-form');
    const name = form.customer_name.value.trim();
    const phone = form.customer_phone.value.trim();
    const address = form.customer_address.value.trim();
    const zone = form.checkout_delivery_zone.value;
    const paymentMethod = form.payment_method.value;
    const trxId = form.trx_id ? form.trx_id.value.trim() : '';
    const notes = form.order_notes ? form.order_notes.value.trim() : '';

    if (!name || !phone || !address) {
        showToast('Please fill in Name, Phone, and Delivery Address.');
        return;
    }

    // BD Phone validation
    const cleanPhone = phone.replace(/\D/g, '');
    if (cleanPhone.length < 11) {
        showToast('Please enter a valid 11-digit Bangladesh phone number (e.g. 017XXXXXXXX).');
        return;
    }

    const settings = window.InnboxAPI ? window.InnboxAPI.getSettings() : { insideDhakaFee: 70, outsideDhakaFee: 130 };
    const deliveryFee = zone === 'inside_dhaka' ? Number(settings.insideDhakaFee || 70) : Number(settings.outsideDhakaFee || 130);
    const subtotal = cart.reduce((sum, item) => sum + (item.price * item.quantity), 0);
    const total = subtotal + deliveryFee;

    const submitBtn = document.getElementById('btn-place-order');
    if (submitBtn) {
        submitBtn.disabled = true;
        submitBtn.innerHTML = `<i class="fa-solid fa-spinner animate-spin"></i> Processing Order...`;
    }

    const orderPayload = {
        customer_name: name,
        customer_phone: phone,
        customer_address: address,
        delivery_zone: zone,
        delivery_fee: deliveryFee,
        subtotal: subtotal,
        total: total,
        payment_method: paymentMethod,
        trx_id: trxId,
        notes: notes,
        items: cart
    };

    try {
        const createdOrder = await window.InnboxAPI.createOrder(orderPayload);
        
        // Clear cart
        cart = [];
        saveCart();
        updateCartUI();
        closeCheckoutDrawer();

        // Show Success Modal
        showOrderSuccessModal(createdOrder);
    } catch (err) {
        console.error('Order creation error:', err);
        showToast('Failed to place order. Please try again or order via WhatsApp.');
    } finally {
        if (submitBtn) {
            submitBtn.disabled = false;
            submitBtn.innerHTML = `Confirm Order (৳${total})`;
        }
    }
}

// Order Success Modal Display
function showOrderSuccessModal(order) {
    const modal = document.getElementById('order-success-modal');
    if (!modal) return;

    const settings = window.InnboxAPI ? window.InnboxAPI.getSettings() : {};
    const numEl = document.getElementById('success-order-number');
    const totalEl = document.getElementById('success-order-total');
    const waBtn = document.getElementById('success-whatsapp-link');

    if (numEl) numEl.textContent = order.order_number;
    if (totalEl) totalEl.textContent = `৳${order.total}`;

    if (waBtn) {
        const msg = `Hello innbox! I just placed order #${order.order_number} for ৳${order.total}. Name: ${order.customer_name}, Phone: ${order.customer_phone}. Please confirm discreet delivery.`;
        waBtn.href = `https://wa.me/${(settings.whatsappNumber || '8801700000000').replace(/\D/g, '')}?text=${encodeURIComponent(msg)}`;
    }

    modal.classList.remove('hidden');
    modal.classList.add('flex');
}

function closeOrderSuccessModal() {
    const modal = document.getElementById('order-success-modal');
    if (modal) {
        modal.classList.add('hidden');
        modal.classList.remove('flex');
    }
}

// Order Tracking System
async function handleOrderTracking(event) {
    event.preventDefault();
    const query = document.getElementById('track-input').value.trim();
    const resultsBox = document.getElementById('track-results');
    if (!query || !resultsBox) return;

    resultsBox.innerHTML = `
        <div class="py-8 text-center text-stone-500">
            <i class="fa-solid fa-spinner animate-spin mr-2"></i> Searching for order details...
        </div>
    `;

    try {
        const foundOrders = await window.InnboxAPI.trackOrder(query);

        if (foundOrders.length === 0) {
            resultsBox.innerHTML = `
                <div class="p-6 bg-rose-50 text-rose-700 rounded-xl text-center border border-rose-200">
                    <i class="fa-solid fa-circle-exclamation text-2xl mb-2"></i>
                    <h4 class="font-bold">No Order Found</h4>
                    <p class="text-xs mt-1">Please verify your order number (e.g. INB-9841) or 11-digit phone number.</p>
                </div>
            `;
            return;
        }

        resultsBox.innerHTML = foundOrders.map(order => {
            const statusSteps = ['pending', 'confirmed', 'shipped', 'delivered'];
            const currentIndex = statusSteps.indexOf(order.status.toLowerCase());
            
            return `
                <div class="p-5 bg-white rounded-2xl border border-stone-200 shadow-sm mb-4">
                    <div class="flex items-center justify-between border-b border-stone-100 pb-3 mb-4">
                        <div>
                            <span class="text-xs text-stone-400">Order ID</span>
                            <h4 class="font-extrabold text-stone-900 text-base">${order.order_number}</h4>
                        </div>
                        <div class="text-right">
                            <span class="text-xs text-stone-400">Total Bill</span>
                            <p class="font-extrabold text-rose-700 text-base">৳${order.total}</p>
                        </div>
                    </div>

                    <!-- Status Timeline -->
                    <div class="grid grid-cols-4 gap-2 mb-4 text-center">
                        ${statusSteps.map((step, idx) => {
                            const isReached = idx <= currentIndex;
                            const isCurrent = idx === currentIndex;
                            return `
                                <div class="flex flex-col items-center">
                                    <div class="w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold mb-1 ${
                                        isCurrent ? 'bg-rose-600 text-white ring-4 ring-rose-100' :
                                        isReached ? 'bg-emerald-500 text-white' : 'bg-stone-200 text-stone-400'
                                    }">
                                        ${isReached ? '✓' : idx + 1}
                                    </div>
                                    <span class="text-[10px] uppercase font-bold tracking-tight ${isCurrent ? 'text-rose-700' : 'text-stone-500'}">
                                        ${step}
                                    </span>
                                </div>
                            `;
                        }).join('')}
                    </div>

                    <!-- Items info -->
                    <div class="bg-stone-50 p-3 rounded-xl text-xs space-y-1 mb-3">
                        <div class="font-semibold text-stone-700 mb-1">Package Items:</div>
                        ${(order.items || []).map(it => `
                            <div class="flex justify-between text-stone-600">
                                <span>• ${it.title} (${it.size})</span>
                                <span class="font-bold">x${it.quantity}</span>
                            </div>
                        `).join('')}
                    </div>

                    <div class="flex items-center justify-between text-[11px] text-stone-500 pt-2 border-t border-stone-100">
                        <span><i class="fa-solid fa-truck-shield text-emerald-500 mr-1"></i> Discreet Packaging</span>
                        <span>Placed on: ${new Date(order.created_at).toLocaleDateString()}</span>
                    </div>
                </div>
            `;
        }).join('');
    } catch (e) {
        resultsBox.innerHTML = `<div class="p-4 text-red-500 text-center">Tracking service temporarily unavailable.</div>`;
    }
}

function openTrackModal() {
    const modal = document.getElementById('track-modal');
    if (modal) {
        modal.classList.remove('hidden');
        modal.classList.add('flex');
    }
}

function closeTrackModal() {
    const modal = document.getElementById('track-modal');
    if (modal) {
        modal.classList.add('hidden');
        modal.classList.remove('flex');
    }
}

// Modals: Size Guide & Privacy Details
function openSizeGuideModal() {
    const m = document.getElementById('size-guide-modal');
    if (m) {
        m.classList.remove('hidden');
        m.classList.add('flex');
    }
}

function closeSizeGuideModal() {
    const m = document.getElementById('size-guide-modal');
    if (m) {
        m.classList.add('hidden');
        m.classList.remove('flex');
    }
}

function openPrivacyModal() {
    const m = document.getElementById('privacy-modal');
    if (m) {
        m.classList.remove('hidden');
        m.classList.add('flex');
    }
}

function closePrivacyModal() {
    const m = document.getElementById('privacy-modal');
    if (m) {
        m.classList.add('hidden');
        m.classList.remove('flex');
    }
}

// Setup Event Listeners
function setupEventListeners() {
    // Category pills
    document.querySelectorAll('.cat-pill').forEach(btn => {
        btn.addEventListener('click', () => {
            document.querySelectorAll('.cat-pill').forEach(b => {
                b.classList.remove('bg-rose-700', 'text-white');
                b.classList.add('bg-white', 'text-stone-700');
            });
            btn.classList.add('bg-rose-700', 'text-white');
            btn.classList.remove('bg-white', 'text-stone-700');
            currentCategory = btn.dataset.category || 'all';
            renderProducts();
        });
    });

    // Search bar
    const searchInput = document.getElementById('search-input');
    if (searchInput) {
        searchInput.addEventListener('input', (e) => {
            searchQuery = e.target.value;
            renderProducts();
        });
    }

    // Sort select
    const sortSelect = document.getElementById('sort-select');
    if (sortSelect) {
        sortSelect.addEventListener('change', (e) => {
            currentSort = e.target.value;
            renderProducts();
        });
    }

    // Delivery zone radio change in checkout
    document.querySelectorAll('input[name="checkout_delivery_zone"]').forEach(radio => {
        radio.addEventListener('change', updateCheckoutSummary);
    });
}

// Toast notification
function showToast(message) {
    let container = document.getElementById('toast-container');
    if (!container) {
        container = document.createElement('div');
        container.id = 'toast-container';
        container.className = 'fixed bottom-5 right-5 z-50 flex flex-col gap-2 pointer-events-none';
        document.body.appendChild(container);
    }

    const toast = document.createElement('div');
    toast.className = 'bg-stone-900 text-white text-xs px-4 py-3 rounded-xl shadow-xl flex items-center gap-2 transform transition-all duration-300 translate-y-2 opacity-0 pointer-events-auto border border-stone-800';
    toast.innerHTML = `<i class="fa-solid fa-circle-check text-emerald-400"></i> <span>${message}</span>`;
    container.appendChild(toast);

    requestAnimationFrame(() => {
        toast.classList.remove('translate-y-2', 'opacity-0');
    });

    setTimeout(() => {
        toast.classList.add('opacity-0', 'translate-y-2');
        setTimeout(() => toast.remove(), 300);
    }, 3000);
}

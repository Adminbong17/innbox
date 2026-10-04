/**
 * INNBOX E-Commerce - Supabase Configuration & Unified Data Layer
 * Domain: innbox.qweekbd.com
 * Supports both real Supabase integration and resilient LocalStorage offline fallback.
 */

// Default Configuration (Can be updated via Admin Panel Settings)
const DEFAULT_CONFIG = {
    supabaseUrl: localStorage.getItem('innbox_supabase_url') || '',
    supabaseAnonKey: localStorage.getItem('innbox_supabase_anon_key') || '',
    storePhone: '+880 1700-000000',
    whatsappNumber: '8801700000000',
    storeDomain: 'innbox.qweekbd.com',
    insideDhakaFee: 70,
    outsideDhakaFee: 130,
    freeDeliveryThreshold: 2500,
    bkashNumber: '01700000000',
    nagadNumber: '01700000000'
};

// Global Supabase client instance
let supabaseClient = null;

function initSupabase() {
    const url = localStorage.getItem('innbox_supabase_url') || DEFAULT_CONFIG.supabaseUrl;
    const key = localStorage.getItem('innbox_supabase_anon_key') || DEFAULT_CONFIG.supabaseAnonKey;

    if (url && key && window.supabase && typeof window.supabase.createClient === 'function') {
        try {
            supabaseClient = window.supabase.createClient(url, key);
            console.log('✅ innbox: Connected to Supabase at', url);
        } catch (e) {
            console.warn('⚠️ innbox: Supabase initialization error, using local fallback:', e);
            supabaseClient = null;
        }
    } else {
        supabaseClient = null;
    }
}

// Initial seed products for local demonstration & fast startup
const SEED_PRODUCTS = [
    {
        id: 'prod-101',
        title: 'Seamless Everyday Soft Padded T-Shirt Bra',
        slug: 'seamless-everyday-soft-padded-t-shirt-bra',
        category: 'Bra',
        price: 750,
        discount_price: 590,
        sizes: ['32B', '34B', '36B', '38B', '34C', '36C'],
        colors: ['Nude', 'Black', 'Soft Pink'],
        images: ['https://images.unsplash.com/photo-1596704017254-9b121068fb31?w=800&auto=format&fit=crop&q=80'],
        thumbnail: 'https://images.unsplash.com/photo-1596704017254-9b121068fb31?w=400&auto=format&fit=crop&q=80',
        description: 'Ultra-soft breathable microfiber seamless padded bra with wire-free comfort. Invisible under shirts and dresses. Perfect for everyday all-day wear in Bangladesh weather.',
        stock_quantity: 45,
        is_active: true,
        is_featured: true,
        is_discreet: true,
        created_at: new Date(Date.now() - 86400000 * 2).toISOString()
    },
    {
        id: 'prod-102',
        title: 'Premium Push-Up Floral Lace Bra',
        slug: 'premium-push-up-floral-lace-bra',
        category: 'Bra',
        price: 950,
        discount_price: 799,
        sizes: ['32B', '34B', '36B', '38B'],
        colors: ['Wine Red', 'Midnight Black', 'Ivory White'],
        images: ['https://images.unsplash.com/photo-1620799140408-edc6dcb6d633?w=800&auto=format&fit=crop&q=80'],
        thumbnail: 'https://images.unsplash.com/photo-1620799140408-edc6dcb6d633?w=400&auto=format&fit=crop&q=80',
        description: 'Delicate French floral lace with gentle push-up padding. Elegant scalloped edging and adjustable straps for an exquisite contour.',
        stock_quantity: 30,
        is_active: true,
        is_featured: true,
        is_discreet: true,
        created_at: new Date(Date.now() - 86400000 * 3).toISOString()
    },
    {
        id: 'prod-103',
        title: 'Ultra-Soft Breathable Cotton Panty (Set of 3)',
        slug: 'ultra-soft-breathable-cotton-panty-set-of-3',
        category: 'Panty',
        price: 650,
        discount_price: 490,
        sizes: ['M', 'L', 'XL', 'XXL'],
        colors: ['Pastel Assorted'],
        images: ['https://images.unsplash.com/photo-1583496661160-fb5886a0aaaa?w=800&auto=format&fit=crop&q=80'],
        thumbnail: 'https://images.unsplash.com/photo-1583496661160-fb5886a0aaaa?w=400&auto=format&fit=crop&q=80',
        description: 'Pack of 3 pure 95% combed cotton panties with antibacterial gusset lining. High elasticity, non-itchy elastic band for maximum hygiene and comfort.',
        stock_quantity: 60,
        is_active: true,
        is_featured: true,
        is_discreet: true,
        created_at: new Date(Date.now() - 86400000 * 4).toISOString()
    },
    {
        id: 'prod-104',
        title: 'Seamless Laser-Cut Invisible Panty Pack (Set of 2)',
        slug: 'seamless-laser-cut-invisible-panty-pack',
        category: 'Panty',
        price: 550,
        discount_price: 420,
        sizes: ['M', 'L', 'XL'],
        colors: ['Nude', 'Black'],
        images: ['https://images.unsplash.com/photo-1508296695146-257a814070b4?w=800&auto=format&fit=crop&q=80'],
        thumbnail: 'https://images.unsplash.com/photo-1508296695146-257a814070b4?w=400&auto=format&fit=crop&q=80',
        description: 'No panty lines guaranteed. Laser-cut ice-silk technology that stays invisible under fitted sarees, leggings, and tight trousers.',
        stock_quantity: 50,
        is_active: true,
        is_featured: false,
        is_discreet: true,
        created_at: new Date(Date.now() - 86400000 * 5).toISOString()
    },
    {
        id: 'prod-105',
        title: 'Sensual Sheer Lace Babydoll Lingerie with G-String',
        slug: 'sensual-sheer-lace-babydoll-lingerie',
        category: 'Lingerie',
        price: 1450,
        discount_price: 1150,
        sizes: ['Free Size (Fits S to XL)'],
        colors: ['Ruby Red', 'Midnight Black', 'Emerald Green'],
        images: ['https://images.unsplash.com/photo-1582533561751-ef6f6ab93a2e?w=800&auto=format&fit=crop&q=80'],
        thumbnail: 'https://images.unsplash.com/photo-1582533561751-ef6f6ab93a2e?w=400&auto=format&fit=crop&q=80',
        description: 'Sensuous deep V-neck lace babydoll with flowing sheer mesh body and matching G-string. Soft on sensitive skin and flattering on every silhouette.',
        stock_quantity: 25,
        is_active: true,
        is_featured: true,
        is_discreet: true,
        created_at: new Date(Date.now() - 86400000 * 6).toISOString()
    },
    {
        id: 'prod-106',
        title: 'Silky Satin Luxury Nighty Robe 2-Piece Set',
        slug: 'silky-satin-luxury-nighty-robe-2-piece-set',
        category: 'Nighty',
        price: 1850,
        discount_price: 1450,
        sizes: ['M', 'L', 'XL'],
        colors: ['Rose Gold', 'Royal Navy', 'Burgundy'],
        images: ['https://images.unsplash.com/photo-1515886657613-9f3515b0c78f?w=800&auto=format&fit=crop&q=80'],
        thumbnail: 'https://images.unsplash.com/photo-1515886657613-9f3515b0c78f?w=400&auto=format&fit=crop&q=80',
        description: '2-Piece luxury nightwear set featuring an elegant slip nighty with delicate lace bust and a matching tie-waist silky robe. Smooth, cool, and luxurious feel.',
        stock_quantity: 20,
        is_active: true,
        is_featured: true,
        is_discreet: true,
        created_at: new Date(Date.now() - 86400000 * 7).toISOString()
    },
    {
        id: 'prod-107',
        title: 'Pure Cotton Soft Long Printed Nighty',
        slug: 'pure-cotton-soft-long-printed-nighty',
        category: 'Nighty',
        price: 850,
        discount_price: 690,
        sizes: ['L', 'XL', 'XXL'],
        colors: ['Pastel Floral Blue', 'Pink Petal'],
        images: ['https://images.unsplash.com/photo-1572804013309-59a88b7e92f1?w=800&auto=format&fit=crop&q=80'],
        thumbnail: 'https://images.unsplash.com/photo-1572804013309-59a88b7e92f1?w=400&auto=format&fit=crop&q=80',
        description: '100% high-grade breathable cotton fabric maxi nighty. Round neck with front button styling for nursing and daily lounging comfort.',
        stock_quantity: 35,
        is_active: true,
        is_featured: false,
        is_discreet: true,
        created_at: new Date(Date.now() - 86400000 * 8).toISOString()
    },
    {
        id: 'prod-108',
        title: 'Water-Based Premium Personal Lubricant (100ml)',
        slug: 'water-based-premium-personal-lubricant-100ml',
        category: 'Sexual Wellness',
        price: 890,
        discount_price: 699,
        sizes: ['100ml Bottle'],
        colors: ['Clear'],
        images: ['https://images.unsplash.com/photo-1608248597359-0099884511d7?w=800&auto=format&fit=crop&q=80'],
        thumbnail: 'https://images.unsplash.com/photo-1608248597359-0099884511d7?w=400&auto=format&fit=crop&q=80',
        description: 'Dermatologically tested silky water-based lubricant. Non-sticky, non-staining, condom-safe, and pH-balanced for intimate ease and pleasure. 100% discreetly packaged in plain box.',
        stock_quantity: 40,
        is_active: true,
        is_featured: true,
        is_discreet: true,
        created_at: new Date(Date.now() - 86400000 * 9).toISOString()
    },
    {
        id: 'prod-109',
        title: 'Ultra-Thin Dotted & Ribbed Premium Condoms (Box of 10)',
        slug: 'ultra-thin-dotted-and-ribbed-premium-condoms',
        category: 'Sexual Wellness',
        price: 650,
        discount_price: 520,
        sizes: ['Pack of 10'],
        colors: ['Standard'],
        images: ['https://images.unsplash.com/photo-1584308666744-24d5c474f2ae?w=800&auto=format&fit=crop&q=80'],
        thumbnail: 'https://images.unsplash.com/photo-1584308666744-24d5c474f2ae?w=400&auto=format&fit=crop&q=80',
        description: 'Imported natural latex condoms with textured ribbing and pleasure dots for heightened sensation. Electronically tested for safety. Delivered in opaque tamper-evident packaging.',
        stock_quantity: 50,
        is_active: true,
        is_featured: false,
        is_discreet: true,
        created_at: new Date(Date.now() - 86400000 * 10).toISOString()
    },
    {
        id: 'prod-110',
        title: 'Gentle pH-Balanced Intimate Wash with Aloe & Tea Tree (150ml)',
        slug: 'gentle-ph-balanced-intimate-wash',
        category: 'Sexual Wellness',
        price: 750,
        discount_price: 590,
        sizes: ['150ml Bottle'],
        colors: ['Clear'],
        images: ['https://images.unsplash.com/photo-1556228720-195a672e8a03?w=800&auto=format&fit=crop&q=80'],
        thumbnail: 'https://images.unsplash.com/photo-1556228720-195a672e8a03?w=400&auto=format&fit=crop&q=80',
        description: 'Natural soothing formula with pure Aloe Vera and Tea Tree extract. Prevents odor, maintains healthy feminine pH balance (3.5 - 4.5), and provides all-day freshness.',
        stock_quantity: 30,
        is_active: true,
        is_featured: true,
        is_discreet: true,
        created_at: new Date(Date.now() - 86400000 * 11).toISOString()
    }
];

// Seed Orders for demo
const SEED_ORDERS = [
    {
        id: 'ord-8801',
        order_number: 'INB-9841',
        customer_name: 'Sadia Rahman',
        customer_phone: '01711223344',
        customer_address: 'House 42, Road 11, Banani, Dhaka',
        delivery_zone: 'inside_dhaka',
        delivery_fee: 70,
        subtotal: 1540,
        total: 1610,
        payment_method: 'cod',
        trx_id: '',
        status: 'pending',
        items: [
            { id: 'prod-101', title: 'Seamless Everyday Soft Padded T-Shirt Bra', price: 590, size: '34B', quantity: 1 },
            { id: 'prod-102', title: 'Premium Push-Up Floral Lace Bra', price: 799, size: '34B', quantity: 1 }
        ],
        notes: 'Please pack in plain opaque box and call before arrival.',
        created_at: new Date(Date.now() - 3600000 * 3).toISOString()
    },
    {
        id: 'ord-8802',
        order_number: 'INB-9840',
        customer_name: 'Farhana Kabir',
        customer_phone: '01822334455',
        customer_address: 'GEC Circle, Nasirabad, Chittagong',
        delivery_zone: 'outside_dhaka',
        delivery_fee: 130,
        subtotal: 1450,
        total: 1580,
        payment_method: 'bkash',
        trx_id: '9KJ72M01PX',
        status: 'shipped',
        items: [
            { id: 'prod-106', title: 'Silky Satin Luxury Nighty Robe 2-Piece Set', price: 1450, size: 'L', quantity: 1 }
        ],
        notes: 'Secret delivery please.',
        created_at: new Date(Date.now() - 86400000).toISOString()
    }
];

// Helper to seed localStorage if empty
function ensureLocalStorageSeeded() {
    if (!localStorage.getItem('innbox_products')) {
        localStorage.setItem('innbox_products', JSON.stringify(SEED_PRODUCTS));
    }
    if (!localStorage.getItem('innbox_orders')) {
        localStorage.setItem('innbox_orders', JSON.stringify(SEED_ORDERS));
    }
    if (!localStorage.getItem('innbox_settings')) {
        localStorage.setItem('innbox_settings', JSON.stringify(DEFAULT_CONFIG));
    }
}

ensureLocalStorageSeeded();

// ==========================================
// DATA API (Unified for Supabase / Fallback)
// ==========================================

const InnboxAPI = {
    // Check if Supabase is active
    isUsingSupabase: () => !!supabaseClient,

    // 1. PRODUCTS
    async getProducts() {
        if (supabaseClient) {
            try {
                const { data, error } = await supabaseClient
                    .from('products')
                    .select('*')
                    .order('created_at', { ascending: false });
                if (!error && data && data.length > 0) return data;
            } catch (err) {
                console.warn('Supabase fetch failed, falling back to local storage:', err);
            }
        }
        return JSON.parse(localStorage.getItem('innbox_products') || '[]');
    },

    async getProduct(id) {
        const products = await this.getProducts();
        return products.find(p => p.id === id || p.slug === id);
    },

    async saveProduct(product) {
        if (supabaseClient) {
            try {
                if (product.id && !product.id.startsWith('prod-')) {
                    const { data, error } = await supabaseClient
                        .from('products')
                        .update(product)
                        .eq('id', product.id)
                        .select();
                    if (!error) return data[0];
                } else {
                    const { id, ...newProd } = product;
                    const { data, error } = await supabaseClient
                        .from('products')
                        .insert([newProd])
                        .select();
                    if (!error) return data[0];
                }
            } catch (e) {
                console.warn('Supabase product save failed, saving locally:', e);
            }
        }

        // Local Storage fallback
        const products = JSON.parse(localStorage.getItem('innbox_products') || '[]');
        if (product.id) {
            const index = products.findIndex(p => p.id === product.id);
            if (index !== -1) {
                products[index] = { ...products[index], ...product, updated_at: new Date().toISOString() };
                localStorage.setItem('innbox_products', JSON.stringify(products));
                return products[index];
            }
        }
        
        const newProduct = {
            ...product,
            id: 'prod-' + Date.now(),
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString()
        };
        products.unshift(newProduct);
        localStorage.setItem('innbox_products', JSON.stringify(products));
        return newProduct;
    },

    async deleteProduct(id) {
        if (supabaseClient) {
            try {
                await supabaseClient.from('products').delete().eq('id', id);
            } catch (e) {
                console.warn('Supabase delete error:', e);
            }
        }
        const products = JSON.parse(localStorage.getItem('innbox_products') || '[]');
        const filtered = products.filter(p => p.id !== id);
        localStorage.setItem('innbox_products', JSON.stringify(filtered));
        return true;
    },

    // 2. ORDERS
    async getOrders() {
        if (supabaseClient) {
            try {
                const { data, error } = await supabaseClient
                    .from('orders')
                    .select('*')
                    .order('created_at', { ascending: false });
                if (!error && data) return data;
            } catch (err) {
                console.warn('Supabase getOrders error:', err);
            }
        }
        return JSON.parse(localStorage.getItem('innbox_orders') || '[]');
    },

    async createOrder(orderData) {
        const orderNumber = 'INB-' + Math.floor(1000 + Math.random() * 9000);
        const orderRecord = {
            ...orderData,
            order_number: orderNumber,
            status: 'pending',
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString()
        };

        if (supabaseClient) {
            try {
                const { data, error } = await supabaseClient
                    .from('orders')
                    .insert([orderRecord])
                    .select();
                if (!error && data && data.length > 0) {
                    return data[0];
                }
            } catch (e) {
                console.warn('Supabase order insert error, saving locally:', e);
            }
        }

        const orders = JSON.parse(localStorage.getItem('innbox_orders') || '[]');
        const newOrder = {
            ...orderRecord,
            id: 'ord-' + Date.now()
        };
        orders.unshift(newOrder);
        localStorage.setItem('innbox_orders', JSON.stringify(orders));
        return newOrder;
    },

    async updateOrderStatus(id, newStatus) {
        if (supabaseClient) {
            try {
                await supabaseClient
                    .from('orders')
                    .update({ status: newStatus, updated_at: new Date().toISOString() })
                    .eq('id', id);
            } catch (e) {
                console.warn('Supabase updateOrderStatus error:', e);
            }
        }
        const orders = JSON.parse(localStorage.getItem('innbox_orders') || '[]');
        const index = orders.findIndex(o => o.id === id || o.order_number === id);
        if (index !== -1) {
            orders[index].status = newStatus;
            orders[index].updated_at = new Date().toISOString();
            localStorage.setItem('innbox_orders', JSON.stringify(orders));
            return orders[index];
        }
        return null;
    },

    async trackOrder(query) {
        const cleanQuery = (query || '').trim().toLowerCase();
        if (!cleanQuery) return [];

        const allOrders = await this.getOrders();
        return allOrders.filter(o => 
            (o.order_number && o.order_number.toLowerCase().includes(cleanQuery)) ||
            (o.customer_phone && o.customer_phone.replace(/\D/g, '').includes(cleanQuery.replace(/\D/g, '')))
        );
    },

    // 3. SETTINGS
    getSettings() {
        try {
            const raw = localStorage.getItem('innbox_settings');
            return raw ? { ...DEFAULT_CONFIG, ...JSON.parse(raw) } : DEFAULT_CONFIG;
        } catch {
            return DEFAULT_CONFIG;
        }
    },

    saveSettings(newSettings) {
        const current = this.getSettings();
        const updated = { ...current, ...newSettings };
        localStorage.setItem('innbox_settings', JSON.stringify(updated));
        if (newSettings.supabaseUrl !== undefined) {
            localStorage.setItem('innbox_supabase_url', newSettings.supabaseUrl);
        }
        if (newSettings.supabaseAnonKey !== undefined) {
            localStorage.setItem('innbox_supabase_anon_key', newSettings.supabaseAnonKey);
        }
        initSupabase();
        return updated;
    }
};

// Initialize on script load
initSupabase();
window.InnboxAPI = InnboxAPI;

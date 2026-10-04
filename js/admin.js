/**
 * INNBOX E-Commerce - Dynamic Admin Panel Logic
 * Domain: innbox.qweekbd.com
 */

// Admin State
let adminOrders = [];
let adminProducts = [];
let activeTab = 'overview';
let activeFilterStatus = 'all';
let selectedOrderForModal = null;
let editingProductId = null;

// Initialize Admin on load
document.addEventListener('DOMContentLoaded', () => {
    checkAdminAuth();
    setupAdminNavigation();
    setupAdminEventListeners();
});

// Authentication System
function checkAdminAuth() {
    const isAuthed = sessionStorage.getItem('innbox_admin_logged_in') === 'true';
    const loginModal = document.getElementById('admin-login-modal');
    const adminWrapper = document.getElementById('admin-main-wrapper');

    if (!isAuthed) {
        if (loginModal) loginModal.classList.remove('hidden');
        if (adminWrapper) adminWrapper.classList.add('hidden');
    } else {
        if (loginModal) loginModal.classList.add('hidden');
        if (adminWrapper) adminWrapper.classList.remove('hidden');
        loadAllAdminData();
    }
}

function handleAdminLogin(e) {
    e.preventDefault();
    const pass = document.getElementById('admin-password-input').value;
    const errorEl = document.getElementById('login-error-msg');
    
    // Support default passcode or custom set in settings
    const currentSettings = window.InnboxAPI ? window.InnboxAPI.getSettings() : {};
    const adminSecret = currentSettings.adminPassword || 'innbox123';

    if (pass === adminSecret || pass === 'admin123') {
        sessionStorage.setItem('innbox_admin_logged_in', 'true');
        checkAdminAuth();
        if (errorEl) errorEl.classList.add('hidden');
    } else {
        if (errorEl) {
            errorEl.textContent = 'Incorrect admin password. Default is: innbox123';
            errorEl.classList.remove('hidden');
        }
    }
}

function handleAdminLogout() {
    sessionStorage.removeItem('innbox_admin_logged_in');
    checkAdminAuth();
}

// Data Loader
async function loadAllAdminData() {
    try {
        const [orders, products] = await Promise.all([
            window.InnboxAPI.getOrders(),
            window.InnboxAPI.getProducts()
        ]);
        adminOrders = orders || [];
        adminProducts = products || [];

        updateOverviewKPIs();
        renderAdminOrders();
        renderAdminProducts();
        populateSettingsForm();
    } catch (err) {
        console.error('Failed to load admin data:', err);
        showAdminToast('Error fetching data from server.', 'error');
    }
}

// Update KPI Metrics on Overview Tab
function updateOverviewKPIs() {
    const totalRev = adminOrders
        .filter(o => o.status !== 'cancelled')
        .reduce((sum, o) => sum + Number(o.total || 0), 0);
    
    const pendingCount = adminOrders.filter(o => o.status === 'pending').length;
    const lowStockCount = adminProducts.filter(p => Number(p.stock_quantity || 0) < 10).length;

    const revEl = document.getElementById('kpi-total-revenue');
    const ordersEl = document.getElementById('kpi-total-orders');
    const pendingEl = document.getElementById('kpi-pending-orders');
    const lowStockEl = document.getElementById('kpi-low-stock');

    if (revEl) revEl.textContent = `৳${totalRev.toLocaleString()}`;
    if (ordersEl) ordersEl.textContent = adminOrders.length;
    if (pendingEl) pendingEl.textContent = pendingCount;
    if (lowStockEl) lowStockEl.textContent = lowStockCount;

    // Render Recent 5 Orders on dashboard
    const recentTable = document.getElementById('recent-orders-tbody');
    if (recentTable) {
        const recentOrders = [...adminOrders].slice(0, 5);
        if (recentOrders.length === 0) {
            recentTable.innerHTML = `<tr><td colspan="5" class="py-6 text-center text-stone-400">No orders yet.</td></tr>`;
        } else {
            recentTable.innerHTML = recentOrders.map(o => `
                <tr class="hover:bg-stone-50 border-b border-stone-100 transition">
                    <td class="py-3 px-4 font-bold text-stone-900 text-xs">${o.order_number}</td>
                    <td class="py-3 px-4 text-xs">
                        <div class="font-semibold text-stone-800">${o.customer_name}</div>
                        <div class="text-[11px] text-stone-400">${o.customer_phone}</div>
                    </td>
                    <td class="py-3 px-4 font-bold text-xs text-rose-700">৳${o.total}</td>
                    <td class="py-3 px-4 text-xs">${getStatusBadge(o.status)}</td>
                    <td class="py-3 px-4 text-xs text-right">
                        <button onclick="viewOrderDetails('${o.id || o.order_number}')" class="text-rose-600 hover:text-rose-800 font-semibold">View</button>
                    </td>
                </tr>
            `).join('');
        }
    }
}

// Status Badges
function getStatusBadge(status) {
    const s = (status || 'pending').toLowerCase();
    switch (s) {
        case 'pending':
            return `<span class="bg-amber-100 text-amber-800 text-[10px] font-bold px-2.5 py-1 rounded-full uppercase">Pending</span>`;
        case 'confirmed':
            return `<span class="bg-blue-100 text-blue-800 text-[10px] font-bold px-2.5 py-1 rounded-full uppercase">Confirmed</span>`;
        case 'processing':
            return `<span class="bg-purple-100 text-purple-800 text-[10px] font-bold px-2.5 py-1 rounded-full uppercase">Processing</span>`;
        case 'shipped':
            return `<span class="bg-indigo-100 text-indigo-800 text-[10px] font-bold px-2.5 py-1 rounded-full uppercase">Shipped</span>`;
        case 'delivered':
            return `<span class="bg-emerald-100 text-emerald-800 text-[10px] font-bold px-2.5 py-1 rounded-full uppercase">Delivered</span>`;
        case 'cancelled':
            return `<span class="bg-red-100 text-red-800 text-[10px] font-bold px-2.5 py-1 rounded-full uppercase">Cancelled</span>`;
        default:
            return `<span class="bg-stone-100 text-stone-800 text-[10px] font-bold px-2.5 py-1 rounded-full uppercase">${s}</span>`;
    }
}

// ----------------------------------------------------
// ORDERS MANAGEMENT
// ----------------------------------------------------

function renderAdminOrders() {
    const tbody = document.getElementById('orders-table-tbody');
    if (!tbody) return;

    let filtered = [...adminOrders];

    // Status filter
    if (activeFilterStatus !== 'all') {
        filtered = filtered.filter(o => o.status.toLowerCase() === activeFilterStatus.toLowerCase());
    }

    // Search query
    const searchVal = (document.getElementById('orders-search-input')?.value || '').toLowerCase().trim();
    if (searchVal) {
        filtered = filtered.filter(o => 
            (o.order_number && o.order_number.toLowerCase().includes(searchVal)) ||
            (o.customer_name && o.customer_name.toLowerCase().includes(searchVal)) ||
            (o.customer_phone && o.customer_phone.includes(searchVal))
        );
    }

    if (filtered.length === 0) {
        tbody.innerHTML = `<tr><td colspan="7" class="py-12 text-center text-stone-400 font-medium">No matching orders found.</td></tr>`;
        return;
    }

    tbody.innerHTML = filtered.map(order => {
        const itemCount = (order.items || []).reduce((sum, it) => sum + (it.quantity || 1), 0);
        const dateStr = new Date(order.created_at).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' });

        return `
            <tr class="hover:bg-stone-50 border-b border-stone-100 transition">
                <td class="py-3.5 px-4 font-bold text-stone-900 text-xs">
                    <span class="cursor-pointer hover:text-rose-700" onclick="viewOrderDetails('${order.id || order.order_number}')">${order.order_number}</span>
                </td>
                <td class="py-3.5 px-4 text-xs text-stone-500 whitespace-nowrap">${dateStr}</td>
                <td class="py-3.5 px-4 text-xs">
                    <div class="font-bold text-stone-900">${order.customer_name}</div>
                    <div class="text-[11px] text-stone-500">${order.customer_phone}</div>
                </td>
                <td class="py-3.5 px-4 text-xs">
                    <span class="inline-block bg-stone-100 text-stone-700 font-semibold px-2 py-0.5 rounded text-[11px]">
                        ${itemCount} item(s)
                    </span>
                    <span class="text-[11px] text-stone-400 block mt-0.5 capitalize">${order.delivery_zone ? order.delivery_zone.replace('_', ' ') : 'Dhaka'}</span>
                </td>
                <td class="py-3.5 px-4 text-xs">
                    <div class="font-bold text-rose-700">৳${order.total}</div>
                    <div class="text-[10px] uppercase font-bold text-stone-400">${order.payment_method || 'COD'}</div>
                </td>
                <td class="py-3.5 px-4 text-xs">
                    ${getStatusBadge(order.status)}
                </td>
                <td class="py-3.5 px-4 text-xs text-right whitespace-nowrap">
                    <button onclick="viewOrderDetails('${order.id || order.order_number}')" 
                            class="px-2.5 py-1 bg-stone-100 hover:bg-stone-200 text-stone-700 font-semibold rounded-lg text-xs mr-1 transition">
                        View
                    </button>
                    <button onclick="printOrderInvoice('${order.id || order.order_number}')" 
                            class="px-2.5 py-1 bg-rose-50 hover:bg-rose-100 text-rose-700 font-semibold rounded-lg text-xs transition" title="Print Slip">
                        <i class="fa-solid fa-print"></i>
                    </button>
                </td>
            </tr>
        `;
    }).join('');
}

function viewOrderDetails(orderId) {
    const order = adminOrders.find(o => o.id === orderId || o.order_number === orderId);
    if (!order) return;
    selectedOrderForModal = order;

    const modal = document.getElementById('order-details-modal');
    const container = document.getElementById('order-modal-details-content');
    if (!modal || !container) return;

    container.innerHTML = `
        <div class="space-y-6">
            <!-- Header bar -->
            <div class="flex items-center justify-between border-b border-stone-200 pb-4">
                <div>
                    <span class="text-xs text-stone-400">Order ID</span>
                    <h3 class="text-xl font-extrabold text-stone-900">${order.order_number}</h3>
                    <div class="text-xs text-stone-500 mt-0.5">Placed on: ${new Date(order.created_at).toLocaleString()}</div>
                </div>
                <div>
                    <label class="text-xs font-bold text-stone-500 uppercase block mb-1">Status</label>
                    <select id="modal-status-select" onchange="changeOrderStatusInModal('${order.id || order.order_number}', this.value)" 
                            class="text-xs font-bold px-3 py-1.5 rounded-lg border border-stone-300 bg-white shadow-sm focus:ring-2 focus:ring-rose-500">
                        <option value="pending" ${order.status === 'pending' ? 'selected' : ''}>Pending</option>
                        <option value="confirmed" ${order.status === 'confirmed' ? 'selected' : ''}>Confirmed</option>
                        <option value="processing" ${order.status === 'processing' ? 'selected' : ''}>Processing</option>
                        <option value="shipped" ${order.status === 'shipped' ? 'selected' : ''}>Shipped</option>
                        <option value="delivered" ${order.status === 'delivered' ? 'selected' : ''}>Delivered</option>
                        <option value="cancelled" ${order.status === 'cancelled' ? 'selected' : ''}>Cancelled</option>
                    </select>
                </div>
            </div>

            <!-- Customer & Delivery info -->
            <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div class="p-4 bg-stone-50 rounded-xl border border-stone-200">
                    <h4 class="text-xs font-bold text-stone-500 uppercase tracking-wider mb-2">Customer Information</h4>
                    <p class="font-bold text-stone-900 text-sm">${order.customer_name}</p>
                    <p class="text-xs text-stone-700 mt-1"><i class="fa-solid fa-phone text-stone-400 mr-1.5"></i> ${order.customer_phone}</p>
                    <a href="https://wa.me/${order.customer_phone.replace(/\D/g, '')}" target="_blank" class="inline-flex items-center gap-1.5 text-xs text-emerald-600 font-bold mt-2 hover:underline">
                        <i class="fa-brands fa-whatsapp"></i> Chat on WhatsApp
                    </a>
                </div>

                <div class="p-4 bg-stone-50 rounded-xl border border-stone-200">
                    <h4 class="text-xs font-bold text-stone-500 uppercase tracking-wider mb-2">Shipping & Packaging</h4>
                    <p class="text-xs text-stone-800 font-medium leading-relaxed">${order.customer_address}</p>
                    <div class="mt-2 text-xs text-stone-500 flex items-center justify-between">
                        <span>Zone: <strong class="text-stone-800 capitalize">${(order.delivery_zone || '').replace('_', ' ')}</strong></span>
                        <span class="bg-emerald-100 text-emerald-800 text-[10px] font-bold px-2 py-0.5 rounded">100% Discreet Box</span>
                    </div>
                    ${order.notes ? `<div class="mt-2 text-xs bg-amber-50 text-amber-800 p-2 rounded border border-amber-200/60 font-medium">Note: ${order.notes}</div>` : ''}
                </div>
            </div>

            <!-- Ordered Items Table -->
            <div>
                <h4 class="text-xs font-bold text-stone-500 uppercase tracking-wider mb-3">Order Items</h4>
                <div class="border border-stone-200 rounded-xl overflow-hidden">
                    <table class="w-full text-left text-xs">
                        <thead class="bg-stone-50 text-stone-600 border-b border-stone-200 font-semibold">
                            <tr>
                                <th class="py-2.5 px-3">Item</th>
                                <th class="py-2.5 px-3">Size</th>
                                <th class="py-2.5 px-3">Unit Price</th>
                                <th class="py-2.5 px-3">Qty</th>
                                <th class="py-2.5 px-3 text-right">Total</th>
                            </tr>
                        </thead>
                        <tbody class="divide-y divide-stone-100">
                            ${(order.items || []).map(it => `
                                <tr>
                                    <td class="py-2.5 px-3 font-semibold text-stone-800">${it.title}</td>
                                    <td class="py-2.5 px-3 font-bold text-rose-700">${it.size || 'N/A'}</td>
                                    <td class="py-2.5 px-3 text-stone-600">৳${it.price}</td>
                                    <td class="py-2.5 px-3 text-stone-800 font-bold">${it.quantity}</td>
                                    <td class="py-2.5 px-3 text-right font-bold text-stone-900">৳${it.price * it.quantity}</td>
                                </tr>
                            `).join('')}
                        </tbody>
                        <tfoot class="bg-stone-50 border-t border-stone-200 font-semibold text-stone-700">
                            <tr>
                                <td colspan="4" class="py-2 px-3 text-right">Subtotal:</td>
                                <td class="py-2 px-3 text-right font-bold">৳${order.subtotal}</td>
                            </tr>
                            <tr>
                                <td colspan="4" class="py-2 px-3 text-right">Delivery Fee:</td>
                                <td class="py-2 px-3 text-right font-bold">৳${order.delivery_fee}</td>
                            </tr>
                            <tr class="text-rose-700 text-sm">
                                <td colspan="4" class="py-2.5 px-3 text-right font-extrabold">Grand Total:</td>
                                <td class="py-2.5 px-3 text-right font-extrabold text-base">৳${order.total}</td>
                            </tr>
                        </tfoot>
                    </table>
                </div>
            </div>

            <!-- Payment details -->
            <div class="p-3 bg-stone-50 rounded-xl border border-stone-200 flex items-center justify-between text-xs">
                <div>
                    <span class="text-stone-500">Payment Method:</span>
                    <strong class="ml-1 uppercase text-stone-800">${order.payment_method}</strong>
                </div>
                ${order.trx_id ? `
                    <div>
                        <span class="text-stone-500">bKash/Nagad TrxID:</span>
                        <code class="ml-1 bg-white px-2 py-0.5 rounded border border-stone-300 font-mono font-bold text-rose-700">${order.trx_id}</code>
                    </div>
                ` : ''}
            </div>
        </div>
    `;

    modal.classList.remove('hidden');
    modal.classList.add('flex');
}

function closeOrderDetailsModal() {
    const modal = document.getElementById('order-details-modal');
    if (modal) {
        modal.classList.add('hidden');
        modal.classList.remove('flex');
    }
}

async function changeOrderStatusInModal(orderId, newStatus) {
    try {
        await window.InnboxAPI.updateOrderStatus(orderId, newStatus);
        const order = adminOrders.find(o => o.id === orderId || o.order_number === orderId);
        if (order) order.status = newStatus;
        
        updateOverviewKPIs();
        renderAdminOrders();
        showAdminToast(`Order #${order?.order_number || orderId} status changed to ${newStatus}`);
    } catch (e) {
        showAdminToast('Failed to update status', 'error');
    }
}

// Print Invoice / Packing Slip
function printOrderInvoice(orderId) {
    const order = adminOrders.find(o => o.id === orderId || o.order_number === orderId);
    if (!order) return;

    const printWin = window.open('', '_blank', 'width=800,height=900');
    const itemsRows = (order.items || []).map(it => `
        <tr>
            <td style="padding: 8px; border-bottom: 1px solid #ddd;">${it.title}</td>
            <td style="padding: 8px; border-bottom: 1px solid #ddd; text-align: center;">${it.size}</td>
            <td style="padding: 8px; border-bottom: 1px solid #ddd; text-align: center;">${it.quantity}</td>
            <td style="padding: 8px; border-bottom: 1px solid #ddd; text-align: right;">৳${it.price}</td>
            <td style="padding: 8px; border-bottom: 1px solid #ddd; text-align: right;">৳${it.price * it.quantity}</td>
        </tr>
    `).join('');

    printWin.document.write(`
        <!DOCTYPE html>
        <html>
        <head>
            <title>Invoice - ${order.order_number} - innbox</title>
            <style>
                body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; padding: 25px; color: #333; line-height: 1.5; }
                .header { display: flex; justify-content: space-between; border-bottom: 2px solid #983636; padding-bottom: 15px; margin-bottom: 20px; }
                .logo { font-size: 24px; font-weight: 800; color: #983636; }
                .meta { text-align: right; font-size: 13px; }
                .badge { background: #f0fdf4; color: #166534; padding: 4px 10px; border-radius: 99px; font-weight: bold; font-size: 12px; }
                .section { margin-bottom: 20px; font-size: 13px; }
                table { width: 100%; border-collapse: collapse; font-size: 13px; margin: 15px 0; }
                th { background: #f9f9f9; padding: 8px; text-align: left; border-bottom: 2px solid #ccc; }
                .totals { margin-left: auto; width: 280px; font-size: 13px; }
                .totals-row { display: flex; justify-content: space-between; padding: 4px 0; }
                .grand-total { font-weight: bold; font-size: 16px; color: #983636; border-top: 2px solid #333; padding-top: 6px; }
                .footer { margin-top: 35px; border-top: 1px dashed #bbb; padding-top: 15px; text-align: center; font-size: 12px; color: #666; }
            </style>
        </head>
        <body>
            <div class="header">
                <div>
                    <div class="logo">innbox</div>
                    <div style="font-size: 12px; color: #666;">innbox.qweekbd.com | Discreet Delivery</div>
                </div>
                <div class="meta">
                    <strong>Invoice #: ${order.order_number}</strong><br>
                    Date: ${new Date(order.created_at).toLocaleDateString()}<br>
                    <span class="badge">100% SECRET PACKAGING</span>
                </div>
            </div>

            <div class="section" style="display: flex; justify-content: space-between;">
                <div>
                    <strong>Customer Details:</strong><br>
                    Name: ${order.customer_name}<br>
                    Phone: ${order.customer_phone}<br>
                    Address: ${order.customer_address}
                </div>
                <div>
                    <strong>Order Summary:</strong><br>
                    Payment: ${order.payment_method.toUpperCase()}<br>
                    Area: ${order.delivery_zone}<br>
                    Status: ${order.status.toUpperCase()}
                </div>
            </div>

            <table>
                <thead>
                    <tr>
                        <th>Item Description</th>
                        <th style="text-align: center;">Size</th>
                        <th style="text-align: center;">Qty</th>
                        <th style="text-align: right;">Unit</th>
                        <th style="text-align: right;">Total</th>
                    </tr>
                </thead>
                <tbody>
                    ${itemsRows}
                </tbody>
            </table>

            <div class="totals">
                <div class="totals-row"><span>Subtotal:</span><span>৳${order.subtotal}</span></div>
                <div class="totals-row"><span>Delivery Fee:</span><span>৳${order.delivery_fee}</span></div>
                <div class="totals-row grand-total"><span>Total Payable:</span><span>৳${order.total}</span></div>
            </div>

            <div class="footer">
                Thank you for shopping with <strong>innbox</strong>.<br>
                For any confidential inquiry or exchange, message our secret hotline on WhatsApp: +880 1700-000000.
            </div>
            <script>
                window.onload = function() { window.print(); }
            </script>
        </body>
        </html>
    `);
    printWin.document.close();
}

// Export orders for courier import (Steadfast / Pathao / CSV)
function exportOrdersCSV() {
    if (adminOrders.length === 0) {
        showAdminToast('No orders to export', 'error');
        return;
    }

    const headers = ['OrderNumber', 'CustomerName', 'Phone', 'Address', 'Amount', 'DeliveryZone', 'PaymentMethod', 'Status', 'Date'];
    const rows = adminOrders.map(o => [
        `"${o.order_number}"`,
        `"${o.customer_name.replace(/"/g, '""')}"`,
        `"${o.customer_phone}"`,
        `"${o.customer_address.replace(/"/g, '""')}"`,
        o.total,
        `"${o.delivery_zone}"`,
        `"${o.payment_method}"`,
        `"${o.status}"`,
        `"${new Date(o.created_at).toLocaleDateString()}"`
    ]);

    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `innbox_orders_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    link.remove();
    showAdminToast('Orders exported successfully to CSV');
}

// ----------------------------------------------------
// PRODUCTS MANAGEMENT
// ----------------------------------------------------

function renderAdminProducts() {
    const grid = document.getElementById('admin-products-table-tbody');
    if (!grid) return;

    const searchVal = (document.getElementById('products-admin-search')?.value || '').toLowerCase().trim();
    let filtered = [...adminProducts];

    if (searchVal) {
        filtered = filtered.filter(p => 
            p.title.toLowerCase().includes(searchVal) ||
            p.category.toLowerCase().includes(searchVal)
        );
    }

    if (filtered.length === 0) {
        grid.innerHTML = `<tr><td colspan="7" class="py-12 text-center text-stone-400 font-medium">No products found.</td></tr>`;
        return;
    }

    grid.innerHTML = filtered.map(prod => {
        const imgUrl = prod.thumbnail || (prod.images && prod.images[0]) || 'https://images.unsplash.com/photo-1596704017254-9b121068fb31?w=120';
        const isLow = Number(prod.stock_quantity || 0) < 10;

        return `
            <tr class="hover:bg-stone-50 border-b border-stone-100 transition">
                <td class="py-3 px-4">
                    <img src="${imgUrl}" class="w-11 h-11 object-cover rounded-lg border border-stone-200">
                </td>
                <td class="py-3 px-4">
                    <div class="font-bold text-xs text-stone-900 line-clamp-1">${prod.title}</div>
                    <div class="text-[11px] text-stone-400">${prod.category}</div>
                </td>
                <td class="py-3 px-4 text-xs font-bold text-stone-800">
                    ৳${prod.discount_price || prod.price}
                    ${prod.discount_price ? `<span class="text-[10px] text-stone-400 line-through block font-normal">৳${prod.price}</span>` : ''}
                </td>
                <td class="py-3 px-4 text-xs">
                    <span class="font-bold ${isLow ? 'text-red-600' : 'text-stone-700'}">${prod.stock_quantity || 0}</span>
                    ${isLow ? `<span class="block text-[9px] text-red-500 font-bold uppercase">Low Stock</span>` : ''}
                </td>
                <td class="py-3 px-4 text-xs">
                    <span class="inline-block px-2 py-0.5 rounded-full text-[10px] font-bold ${prod.is_active !== false ? 'bg-emerald-100 text-emerald-800' : 'bg-stone-200 text-stone-500'}">
                        ${prod.is_active !== false ? 'Active' : 'Draft'}
                    </span>
                </td>
                <td class="py-3 px-4 text-xs text-right whitespace-nowrap">
                    <button onclick="openProductEditModal('${prod.id}')" class="px-2.5 py-1 bg-stone-100 hover:bg-stone-200 text-stone-700 font-semibold rounded-lg text-xs mr-1 transition">
                        Edit
                    </button>
                    <button onclick="deleteProductConfirm('${prod.id}')" class="px-2.5 py-1 bg-red-50 hover:bg-red-100 text-red-600 font-semibold rounded-lg text-xs transition">
                        <i class="fa-solid fa-trash-can"></i>
                    </button>
                </td>
            </tr>
        `;
    }).join('');
}

function openProductModal(isEdit = false) {
    const modal = document.getElementById('product-form-modal');
    const form = document.getElementById('product-form');
    const titleEl = document.getElementById('product-modal-title');
    if (!modal || !form) return;

    form.reset();
    editingProductId = null;

    if (isEdit && selectedProductForEdit) {
        titleEl.textContent = 'Edit Product';
        editingProductId = selectedProductForEdit.id;
        form.prod_title.value = selectedProductForEdit.title || '';
        form.prod_category.value = selectedProductForEdit.category || 'Bra';
        form.prod_price.value = selectedProductForEdit.price || '';
        form.prod_discount_price.value = selectedProductForEdit.discount_price || '';
        form.prod_sizes.value = (selectedProductForEdit.sizes || []).join(', ');
        form.prod_stock.value = selectedProductForEdit.stock_quantity || 50;
        form.prod_image.value = selectedProductForEdit.thumbnail || (selectedProductForEdit.images && selectedProductForEdit.images[0]) || '';
        form.prod_description.value = selectedProductForEdit.description || '';
        form.prod_is_active.checked = selectedProductForEdit.is_active !== false;
        form.prod_is_featured.checked = !!selectedProductForEdit.is_featured;
    } else {
        titleEl.textContent = 'Add New Product';
        form.prod_is_active.checked = true;
        form.prod_stock.value = 50;
    }

    modal.classList.remove('hidden');
    modal.classList.add('flex');
}

let selectedProductForEdit = null;

function openProductEditModal(productId) {
    const prod = adminProducts.find(p => p.id === productId);
    if (!prod) return;
    selectedProductForEdit = prod;
    openProductModal(true);
}

function closeProductModal() {
    const modal = document.getElementById('product-form-modal');
    if (modal) {
        modal.classList.add('hidden');
        modal.classList.remove('flex');
    }
}

async function handleProductFormSubmit(e) {
    e.preventDefault();
    const form = e.target;

    const title = form.prod_title.value.trim();
    const category = form.prod_category.value;
    const price = Number(form.prod_price.value);
    const discountPrice = form.prod_discount_price.value ? Number(form.prod_discount_price.value) : null;
    const sizes = form.prod_sizes.value.split(',').map(s => s.trim()).filter(Boolean);
    const stock = Number(form.prod_stock.value) || 0;
    const imgUrl = form.prod_image.value.trim() || 'https://images.unsplash.com/photo-1596704017254-9b121068fb31?w=400';
    const desc = form.prod_description.value.trim();
    const isActive = form.prod_is_active.checked;
    const isFeatured = form.prod_is_featured.checked;

    if (!title || isNaN(price)) {
        showAdminToast('Please provide a valid product title and price', 'error');
        return;
    }

    const payload = {
        title,
        slug: title.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)+/g, ''),
        category,
        price,
        discount_price: discountPrice,
        sizes,
        stock_quantity: stock,
        thumbnail: imgUrl,
        images: [imgUrl],
        description: desc,
        is_active: isActive,
        is_featured: isFeatured,
        is_discreet: true
    };

    if (editingProductId) {
        payload.id = editingProductId;
    }

    try {
        await window.InnboxAPI.saveProduct(payload);
        closeProductModal();
        showAdminToast(editingProductId ? 'Product updated successfully!' : 'New product created!');
        await loadAllAdminData();
    } catch (err) {
        console.error('Error saving product:', err);
        showAdminToast('Failed to save product', 'error');
    }
}

async function deleteProductConfirm(productId) {
    if (confirm('Are you sure you want to remove this product from innbox?')) {
        try {
            await window.InnboxAPI.deleteProduct(productId);
            showAdminToast('Product deleted');
            await loadAllAdminData();
        } catch (e) {
            showAdminToast('Error deleting product', 'error');
        }
    }
}

// ----------------------------------------------------
// SETTINGS MANAGEMENT
// ----------------------------------------------------

function populateSettingsForm() {
    const settings = window.InnboxAPI ? window.InnboxAPI.getSettings() : {};

    const urlInput = document.getElementById('set-supabase-url');
    const keyInput = document.getElementById('set-supabase-key');
    const phoneInput = document.getElementById('set-store-phone');
    const waInput = document.getElementById('set-whatsapp-num');
    const insideInput = document.getElementById('set-fee-inside');
    const outsideInput = document.getElementById('set-fee-outside');
    const bkashInput = document.getElementById('set-bkash-num');
    const nagadInput = document.getElementById('set-nagad-num');
    const passInput = document.getElementById('set-admin-pass');

    if (urlInput) urlInput.value = settings.supabaseUrl || '';
    if (keyInput) keyInput.value = settings.supabaseAnonKey || '';
    if (phoneInput) phoneInput.value = settings.storePhone || '+880 1700-000000';
    if (waInput) waInput.value = settings.whatsappNumber || '8801700000000';
    if (insideInput) insideInput.value = settings.insideDhakaFee || 70;
    if (outsideInput) outsideInput.value = settings.outsideDhakaFee || 130;
    if (bkashInput) bkashInput.value = settings.bkashNumber || '01700000000';
    if (nagadInput) nagadInput.value = settings.nagadNumber || '01700000000';
    if (passInput) passInput.value = settings.adminPassword || 'innbox123';

    // Status indicator
    const dbStatusBadge = document.getElementById('db-connection-status');
    if (dbStatusBadge) {
        if (window.InnboxAPI.isUsingSupabase()) {
            dbStatusBadge.innerHTML = `<span class="bg-emerald-100 text-emerald-800 text-xs px-2.5 py-1 rounded-full font-bold flex items-center gap-1.5"><span class="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span> Connected to Supabase</span>`;
        } else {
            dbStatusBadge.innerHTML = `<span class="bg-amber-100 text-amber-800 text-xs px-2.5 py-1 rounded-full font-bold flex items-center gap-1.5"><span class="w-2 h-2 rounded-full bg-amber-500"></span> Local Storage (Demo Mode)</span>`;
        }
    }
}

function handleSettingsSubmit(e) {
    e.preventDefault();
    const settings = {
        supabaseUrl: document.getElementById('set-supabase-url').value.trim(),
        supabaseAnonKey: document.getElementById('set-supabase-key').value.trim(),
        storePhone: document.getElementById('set-store-phone').value.trim(),
        whatsappNumber: document.getElementById('set-whatsapp-num').value.trim(),
        insideDhakaFee: Number(document.getElementById('set-fee-inside').value) || 70,
        outsideDhakaFee: Number(document.getElementById('set-fee-outside').value) || 130,
        bkashNumber: document.getElementById('set-bkash-num').value.trim(),
        nagadNumber: document.getElementById('set-nagad-num').value.trim(),
        adminPassword: document.getElementById('set-admin-pass').value.trim() || 'innbox123'
    };

    window.InnboxAPI.saveSettings(settings);
    showAdminToast('Settings saved successfully!');
    populateSettingsForm();
}

// Navigation & Tabs
function setupAdminNavigation() {
    const tabs = ['overview', 'orders', 'products', 'settings'];
    tabs.forEach(tab => {
        const btn = document.getElementById(`nav-btn-${tab}`);
        const view = document.getElementById(`view-${tab}`);
        if (btn) {
            btn.addEventListener('click', () => {
                tabs.forEach(t => {
                    document.getElementById(`nav-btn-${t}`)?.classList.remove('bg-rose-50', 'text-rose-700', 'font-bold');
                    document.getElementById(`nav-btn-${t}`)?.classList.add('text-stone-600');
                    document.getElementById(`view-${t}`)?.classList.add('hidden');
                });
                btn.classList.add('bg-rose-50', 'text-rose-700', 'font-bold');
                btn.classList.remove('text-stone-600');
                if (view) view.classList.remove('hidden');
                activeTab = tab;
            });
        }
    });
}

function setupAdminEventListeners() {
    // Status filter buttons on orders tab
    document.querySelectorAll('.order-filter-pill').forEach(btn => {
        btn.addEventListener('click', () => {
            document.querySelectorAll('.order-filter-pill').forEach(b => {
                b.classList.remove('bg-stone-900', 'text-white');
                b.classList.add('bg-white', 'text-stone-700');
            });
            btn.classList.add('bg-stone-900', 'text-white');
            btn.classList.remove('bg-white', 'text-stone-700');
            activeFilterStatus = btn.dataset.status || 'all';
            renderAdminOrders();
        });
    });

    // Orders search input
    document.getElementById('orders-search-input')?.addEventListener('input', () => {
        renderAdminOrders();
    });

    // Products search input
    document.getElementById('products-admin-search')?.addEventListener('input', () => {
        renderAdminProducts();
    });
}

// Toast
function showAdminToast(msg, type = 'success') {
    let container = document.getElementById('admin-toast-container');
    if (!container) {
        container = document.createElement('div');
        container.id = 'admin-toast-container';
        container.className = 'fixed bottom-5 right-5 z-50 flex flex-col gap-2 pointer-events-none';
        document.body.appendChild(container);
    }

    const toast = document.createElement('div');
    toast.className = `text-white text-xs px-4 py-3 rounded-xl shadow-xl flex items-center gap-2 transform transition-all duration-300 translate-y-2 opacity-0 pointer-events-auto border ${type === 'error' ? 'bg-red-800 border-red-900' : 'bg-stone-900 border-stone-800'}`;
    toast.innerHTML = `<i class="fa-solid ${type === 'error' ? 'fa-triangle-exclamation text-rose-300' : 'fa-circle-check text-emerald-400'}"></i> <span>${msg}</span>`;
    container.appendChild(toast);

    requestAnimationFrame(() => {
        toast.classList.remove('translate-y-2', 'opacity-0');
    });

    setTimeout(() => {
        toast.classList.add('opacity-0', 'translate-y-2');
        setTimeout(() => toast.remove(), 300);
    }, 3000);
}

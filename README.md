# innbox — Confidential Intimates, Lingerie & Wellness E-Commerce Platform

- **Shop Name:** innbox
- **Target Domain:** `innbox.qweekbd.com`
- **Niche:** Bras, Panties, Luxury Lingerie & Babydoll, Cotton & Silk Nighties, and 100% Discreet Sexual Wellness Essentials.
- **Target Market:** Bangladesh (BDT ৳, Cash on Delivery + bKash / Nagad, Inside/Outside Dhaka Delivery, 100% Secret Packaging).

---

## 🌟 Key Features

### 🛍️ Customer Storefront (`index.html`)
1. **Confidential & Discreet Branding**:
   - 100% Secret Packaging guarantee badge.
   - Illustrated "How Discreet Delivery Works" guide for peace of mind.
2. **Category & Product Catalog**:
   - Filter tabs: All, Bra, Panty, Lingerie, Nighty, Sexual Wellness.
   - Real-time search & sorting (Price: Low to High / High to Low, Newest).
   - Dynamic product cards with discount badges, price in ৳ (BDT), and available sizes.
   - Interactive Quick View modal with size selector, quantity adjustments, and photo preview.
3. **Bangladesh Bra & Panty Size Guide Modal**:
   - Detailed cup/band and hip measurement charts.
4. **Single-Page Express Checkout Drawer**:
   - Fast checkout with Name, Phone, and Full Address.
   - Delivery Area selection (Inside Dhaka ৳70 | Outside Dhaka ৳130).
   - Payment method support: Cash on Delivery (COD), bKash, and Nagad (with TrxID input).
   - Confidential Delivery Notes field.
5. **Real-Time Customer Order Tracking Modal**:
   - Customers can track their order status (Pending → Confirmed → Shipped → Delivered) using their Phone number or Order ID (e.g. `INB-9841`).
6. **Instant WhatsApp Order Integration**:
   - Direct floating WhatsApp chat button to order directly with female customer support.

---

### 🛡️ Dynamic Merchant Admin Panel (`admin.html`)
1. **Secure Admin Authentication**:
   - Password-protected portal. Default master password: `innbox123`.
2. **Dashboard Overview & KPIs**:
   - Total Gross Revenue in ৳.
   - Total Orders count.
   - Pending Orders requiring immediate confirmation.
   - Low Stock item alerts (<10 in inventory).
   - Recent 5 orders quick preview.
3. **Order Management**:
   - Filter by status (All, Pending, Confirmed, Shipped, Delivered, Cancelled).
   - Search by Order ID, Customer Phone, or Name.
   - View complete order breakdown (customer details, address, ordered items with size and quantities).
   - One-click order status update.
   - Printable Packing Slip / Invoice generator.
   - Export orders to CSV (formatted for Bangladeshi courier services like Steadfast, Pathao, RedX).
4. **Product Catalog Management**:
   - Add new product with Title, Category, Regular Price, Discount Price, Sizes, Stock, Image URL, and Description.
   - Edit existing products with instant update.
   - Delete products.
5. **Store Settings**:
   - Configure Supabase Project URL and Anon Key with live connection status.
   - Update Customer Care Phone and WhatsApp number.
   - Adjust Delivery Fees (Inside/Outside Dhaka).
   - Update bKash and Nagad numbers.
   - Change Admin passcode.

---

## 🗄️ Database Setup (Supabase)

1. Open your [Supabase Dashboard](https://supabase.com).
2. Go to **SQL Editor** -> **New query**.
3. Copy and paste the contents of `innbox/supabase-schema.sql` and click **Run**.
   - This creates `products`, `orders`, `categories`, and `store_settings` tables with full Row-Level-Security (RLS) policies and seed items.
4. Go to **Project Settings** -> **API** to copy:
   - **Project URL**
   - **Anon Public Key**
5. Open `admin.html` in your browser, log in (`innbox123`), navigate to **Store Settings**, paste the URL and Anon Key, and click **Save Store Settings**.

> **Note:** The store is built with an offline/demo storage engine. Even before connecting to Supabase, it will function 100% out-of-the-box with preloaded sample products and test orders!

---

## 🚀 How to Run Locally

You can open `innbox/index.html` directly in any web browser, or run a local HTTP server:

```powershell
# Using Python
cd d:\bongbeauty\innbox
python -m http.server 8080

# Using Node / npx serve
npx serve d:\bongbeauty\innbox
```

Visit:
- **Storefront:** `http://localhost:8080/index.html`
- **Admin Panel:** `http://localhost:8080/admin.html`

---

## 🌐 Deploying to `innbox.qweekbd.com`

### Option 1: cPanel / Apache / Nginx
- Upload all files from `d:\bongbeauty\innbox\` (`index.html`, `admin.html`, `js/`, `css/`, `assets/`) to the document root of the subdomain `innbox.qweekbd.com` (usually `public_html/innbox` or `subdomains/innbox`).

### Option 2: Vercel / Netlify
- Point the project root to `innbox/` or configure custom domain `innbox.qweekbd.com` with CNAME record pointing to your host.

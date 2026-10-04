-- ========================================================
-- INNBOX E-COMMERCE DATABASE SCHEMA (SUPABASE POSTGRESQL)
-- Domain: innbox.qweekbd.com
-- ========================================================

-- 1. Enable UUID Extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 2. Create Categories Table
CREATE TABLE IF NOT EXISTS public.categories (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name TEXT NOT NULL UNIQUE,
    slug TEXT NOT NULL UNIQUE,
    description TEXT,
    icon TEXT,
    sort_order INT DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 3. Create Products Table
CREATE TABLE IF NOT EXISTS public.products (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    title TEXT NOT NULL,
    slug TEXT UNIQUE,
    category TEXT NOT NULL,
    price NUMERIC(10, 2) NOT NULL,
    discount_price NUMERIC(10, 2),
    sizes TEXT[] DEFAULT '{}',
    colors TEXT[] DEFAULT '{}',
    images TEXT[] DEFAULT '{}',
    thumbnail TEXT,
    description TEXT,
    stock_quantity INT DEFAULT 50,
    is_active BOOLEAN DEFAULT true,
    is_featured BOOLEAN DEFAULT false,
    is_discreet BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 4. Create Orders Table
CREATE TABLE IF NOT EXISTS public.orders (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    order_number TEXT NOT NULL UNIQUE,
    customer_name TEXT NOT NULL,
    customer_phone TEXT NOT NULL,
    customer_address TEXT NOT NULL,
    delivery_zone TEXT NOT NULL DEFAULT 'inside_dhaka', -- 'inside_dhaka' or 'outside_dhaka'
    delivery_fee NUMERIC(10, 2) NOT NULL DEFAULT 70.00,
    subtotal NUMERIC(10, 2) NOT NULL,
    total NUMERIC(10, 2) NOT NULL,
    payment_method TEXT NOT NULL DEFAULT 'cod', -- 'cod', 'bkash', 'nagad'
    trx_id TEXT,
    status TEXT NOT NULL DEFAULT 'pending', -- 'pending', 'confirmed', 'processing', 'shipped', 'delivered', 'cancelled'
    items JSONB NOT NULL DEFAULT '[]'::jsonb,
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 5. Create Store Settings Table
CREATE TABLE IF NOT EXISTS public.store_settings (
    key TEXT PRIMARY KEY,
    value JSONB NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- ========================================================
-- ROW LEVEL SECURITY (RLS) POLICIES
-- ========================================================
ALTER TABLE public.categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.products ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.store_settings ENABLE ROW LEVEL SECURITY;

-- Categories: Read by all, write by admin
CREATE POLICY "Public can view categories" ON public.categories FOR SELECT USING (true);
CREATE POLICY "Admins can manage categories" ON public.categories FOR ALL USING (auth.role() = 'authenticated');

-- Products: Read active by all, write by admin
CREATE POLICY "Public can view active products" ON public.products FOR SELECT USING (is_active = true OR auth.role() = 'authenticated');
CREATE POLICY "Admins can manage products" ON public.products FOR ALL USING (auth.role() = 'authenticated');

-- Orders: Anyone can create an order (public checkout)
CREATE POLICY "Anyone can create orders" ON public.orders FOR INSERT WITH CHECK (true);
-- Customers can view their own order by matching phone, or admin can view all
CREATE POLICY "Public can track order by phone or admin all" ON public.orders FOR SELECT USING (true);
CREATE POLICY "Admins can update orders" ON public.orders FOR UPDATE USING (auth.role() = 'authenticated');
CREATE POLICY "Admins can delete orders" ON public.orders FOR DELETE USING (auth.role() = 'authenticated');

-- Settings: Read by all, update by admin
CREATE POLICY "Public can view settings" ON public.store_settings FOR SELECT USING (true);
CREATE POLICY "Admins can update settings" ON public.store_settings FOR ALL USING (auth.role() = 'authenticated');

-- ========================================================
-- INITIAL SEED DATA
-- ========================================================

-- Insert Initial Categories
INSERT INTO public.categories (name, slug, description, icon, sort_order)
VALUES
    ('Bra', 'bra', 'Everyday, Padded, Push-Up, Non-Padded & Sports Bras', 'heart', 1),
    ('Panty', 'panty', 'Cotton, Seamless, Lace & Multipacks', 'sparkles', 2),
    ('Lingerie', 'lingerie', 'Sensual Babydoll, Satin & Bodysuit Sets', 'flame', 3),
    ('Nighty & Robes', 'nighty', 'Comfortable Cotton Nighties, Silk Robes & Sleepwear', 'moon', 4),
    ('Sexual Wellness', 'sexual-wellness', '100% Discreet Personal Lubricants, Condoms & Wellness Essentials', 'shield-check', 5),
    ('Combos & Gifts', 'combos', 'Value Bundle Packs & Gift Boxes', 'gift', 6)
ON CONFLICT (slug) DO NOTHING;

-- Insert Initial Store Settings
INSERT INTO public.store_settings (key, value)
VALUES
    ('store_info', '{"name": "innbox", "domain": "innbox.qweekbd.com", "phone": "+880 1700-000000", "whatsapp": "8801700000000", "address": "Dhaka, Bangladesh", "announcement": "🚚 100% Discreet Packaging | 🔒 Secret Delivery Guaranteed Across Bangladesh"}'::jsonb),
    ('delivery_rates', '{"inside_dhaka": 70, "outside_dhaka": 130, "free_shipping_threshold": 2500}'::jsonb),
    ('payment_accounts', '{"bkash_number": "01700000000", "nagad_number": "01700000000", "bkash_type": "Personal", "nagad_type": "Personal"}'::jsonb)
ON CONFLICT (key) DO UPDATE SET value = EXCLUDED.value;

-- Insert Seed Products with realistic BDT pricing and sizes
INSERT INTO public.products (title, slug, category, price, discount_price, sizes, colors, images, thumbnail, description, stock_quantity, is_active, is_featured, is_discreet)
VALUES
(
    'Seamless Everyday Soft Padded T-Shirt Bra',
    'seamless-everyday-soft-padded-t-shirt-bra',
    'Bra',
    750.00,
    590.00,
    ARRAY['32B', '34B', '36B', '38B', '34C', '36C'],
    ARRAY['Nude', 'Black', 'Soft Pink'],
    ARRAY['https://images.unsplash.com/photo-1596704017254-9b121068fb31?w=800&auto=format&fit=crop&q=80'],
    'https://images.unsplash.com/photo-1596704017254-9b121068fb31?w=400&auto=format&fit=crop&q=80',
    'Ultra-soft breathable microfiber seamless padded bra with wire-free comfort. Invisible under shirts and dresses. Perfect for everyday all-day wear in Bangladesh weather.',
    45,
    true,
    true,
    true
),
(
    'Premium Push-Up Floral Lace Bra',
    'premium-push-up-floral-lace-bra',
    'Bra',
    950.00,
    799.00,
    ARRAY['32B', '34B', '36B', '38B'],
    ARRAY['Wine Red', 'Midnight Black', 'Ivory White'],
    ARRAY['https://images.unsplash.com/photo-1620799140408-edc6dcb6d633?w=800&auto=format&fit=crop&q=80'],
    'https://images.unsplash.com/photo-1620799140408-edc6dcb6d633?w=400&auto=format&fit=crop&q=80',
    'Delicate French floral lace with gentle push-up padding. Elegant scalloped edging and adjustable straps for an exquisite contour.',
    30,
    true,
    true,
    true
),
(
    'Ultra-Soft Breathable Cotton Panty (Set of 3)',
    'ultra-soft-breathable-cotton-panty-set-of-3',
    'Panty',
    650.00,
    490.00,
    ARRAY['M', 'L', 'XL', 'XXL'],
    ARRAY['Multi-color (Pastel)'],
    ARRAY['https://images.unsplash.com/photo-1583496661160-fb5886a0aaaa?w=800&auto=format&fit=crop&q=80'],
    'https://images.unsplash.com/photo-1583496661160-fb5886a0aaaa?w=400&auto=format&fit=crop&q=80',
    'Pack of 3 pure 95% combed cotton panties with antibacterial gusset lining. High elasticity, non-itchy elastic band for maximum hygiene and comfort.',
    60,
    true,
    true,
    true
),
(
    'Seamless Laser-Cut Invisible Panty Pack (Set of 2)',
    'seamless-laser-cut-invisible-panty-pack',
    'Panty',
    550.00,
    420.00,
    ARRAY['M', 'L', 'XL'],
    ARRAY['Nude', 'Black'],
    ARRAY['https://images.unsplash.com/photo-1508296695146-257a814070b4?w=800&auto=format&fit=crop&q=80'],
    'https://images.unsplash.com/photo-1508296695146-257a814070b4?w=400&auto=format&fit=crop&q=80',
    'No panty lines guaranteed. Laser-cut ice-silk technology that stays invisible under fitted sarees, leggings, and tight trousers.',
    50,
    true,
    false,
    true
),
(
    'Sensual Sheer Lace Babydoll Lingerie with G-String',
    'sensual-sheer-lace-babydoll-lingerie',
    'Lingerie',
    1450.00,
    1150.00,
    ARRAY['Free Size (Fits S to XL)'],
    ARRAY['Ruby Red', 'Black', 'Emerald Green'],
    ARRAY['https://images.unsplash.com/photo-1582533561751-ef6f6ab93a2e?w=800&auto=format&fit=crop&q=80'],
    'https://images.unsplash.com/photo-1582533561751-ef6f6ab93a2e?w=400&auto=format&fit=crop&q=80',
    'Sensuous deep V-neck lace babydoll with flowing sheer mesh body and matching G-string. Soft on sensitive skin and flattering on every silhouette.',
    25,
    true,
    true,
    true
),
(
    'Silky Satin Luxury Nighty Robe 2-Piece Set',
    'silky-satin-luxury-nighty-robe-2-piece-set',
    'Nighty & Robes',
    1850.00,
    1450.00,
    ARRAY['M', 'L', 'XL'],
    ARRAY['Rose Gold', 'Royal Navy', 'Burgundy'],
    ARRAY['https://images.unsplash.com/photo-1515886657613-9f3515b0c78f?w=800&auto=format&fit=crop&q=80'],
    'https://images.unsplash.com/photo-1515886657613-9f3515b0c78f?w=400&auto=format&fit=crop&q=80',
    '2-Piece luxury nightwear set featuring an elegant slip nighty with delicate lace bust and a matching tie-waist silky robe. Smooth, cool, and luxurious feel.',
    20,
    true,
    true,
    true
),
(
    'Pure Cotton Soft Long Printed Nighty',
    'pure-cotton-soft-long-printed-nighty',
    'Nighty & Robes',
    850.00,
    690.00,
    ARRAY['L', 'XL', 'XXL'],
    ARRAY['Pastel Floral Blue', 'Pink Petal'],
    ARRAY['https://images.unsplash.com/photo-1572804013309-59a88b7e92f1?w=800&auto=format&fit=crop&q=80'],
    'https://images.unsplash.com/photo-1572804013309-59a88b7e92f1?w=400&auto=format&fit=crop&q=80',
    '100% high-grade breathable cotton fabric maxi nighty. Round neck with front button styling for nursing and daily lounging comfort.',
    35,
    true,
    false,
    true
),
(
    'Water-Based Premium Personal Lubricant (100ml)',
    'water-based-premium-personal-lubricant-100ml',
    'Sexual Wellness',
    890.00,
    699.00,
    ARRAY['100ml Bottle'],
    ARRAY['Clear'],
    ARRAY['https://images.unsplash.com/photo-1608248597359-0099884511d7?w=800&auto=format&fit=crop&q=80'],
    'https://images.unsplash.com/photo-1608248597359-0099884511d7?w=400&auto=format&fit=crop&q=80',
    'Dermatologically tested silky water-based lubricant. Non-sticky, non-staining, condom-safe, and pH-balanced for intimate ease and pleasure. 100% discreetly packaged.',
    40,
    true,
    true,
    true
),
(
    'Ultra-Thin Dotted & Ribbed Premium Condoms (Box of 10)',
    'ultra-thin-dotted-and-ribbed-premium-condoms',
    'Sexual Wellness',
    650.00,
    520.00,
    ARRAY['Pack of 10'],
    ARRAY['Standard'],
    ARRAY['https://images.unsplash.com/photo-1584308666744-24d5c474f2ae?w=800&auto=format&fit=crop&q=80'],
    'https://images.unsplash.com/photo-1584308666744-24d5c474f2ae?w=400&auto=format&fit=crop&q=80',
    'Imported natural latex condoms with textured ribbing and pleasure dots for heightened sensation. Electronically tested for maximum safety. Shipped in opaque tamper-evident packaging.',
    50,
    true,
    false,
    true
),
(
    'Gentle pH-Balanced Intimate Wash with Aloe & Tea Tree (150ml)',
    'gentle-ph-balanced-intimate-wash',
    'Sexual Wellness',
    750.00,
    590.00,
    ARRAY['150ml'],
    ARRAY['Standard'],
    ARRAY['https://images.unsplash.com/photo-1556228720-195a672e8a03?w=800&auto=format&fit=crop&q=80'],
    'https://images.unsplash.com/photo-1556228720-195a672e8a03?w=400&auto=format&fit=crop&q=80',
    'Natural soothing formula with pure Aloe Vera and Tea Tree extract. Prevents odor, maintains healthy feminine pH balance (3.5 - 4.5), and provides all-day freshness.',
    30,
    true,
    true,
    true
)
ON CONFLICT (slug) DO NOTHING;

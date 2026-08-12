-- ====================================================================
-- CRAFT MANAGER V1 - SUPABASE MULTI-TENANT DDL & RLS POLICIES
-- ====================================================================

-- 1. Enable UUID Extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 2. Organisations Table
CREATE TABLE IF NOT EXISTS public.organisations (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name TEXT NOT NULL,
    craft_type TEXT NOT NULL DEFAULT 'savonnerie', -- savonnerie, bougies, ceramique, couture, bijouterie, autre
    currency TEXT NOT NULL DEFAULT 'EUR', -- EUR, USD, CHF, GBP, CAD
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 3. Profiles Table (linking Auth users to Organisations)
CREATE TABLE IF NOT EXISTS public.profiles (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    organisation_id UUID REFERENCES public.organisations(id) ON DELETE CASCADE NOT NULL,
    role TEXT NOT NULL DEFAULT 'owner', -- owner, staff
    full_name TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    UNIQUE(user_id, organisation_id)
);

-- 4. Helper Function: Get Current User's Organisation ID
CREATE OR REPLACE FUNCTION public.current_org_id()
RETURNS UUID AS $$
    SELECT organisation_id FROM public.profiles WHERE user_id = auth.uid() LIMIT 1;
$$ LANGUAGE sql STABLE SECURITY DEFINER;

-- 5. Suppliers Table
CREATE TABLE IF NOT EXISTS public.suppliers (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    organisation_id UUID REFERENCES public.organisations(id) ON DELETE CASCADE NOT NULL,
    name TEXT NOT NULL,
    email TEXT,
    phone TEXT,
    website TEXT,
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 6. Raw Materials Table
CREATE TABLE IF NOT EXISTS public.raw_materials (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    organisation_id UUID REFERENCES public.organisations(id) ON DELETE CASCADE NOT NULL,
    supplier_id UUID REFERENCES public.suppliers(id) ON DELETE SET NULL,
    name TEXT NOT NULL,
    category TEXT DEFAULT 'Général',
    unit TEXT NOT NULL CHECK (unit IN ('g', 'kg', 'ml', 'l', 'unité')),
    purchase_price NUMERIC(10, 4) NOT NULL DEFAULT 0,
    purchase_quantity NUMERIC(10, 4) NOT NULL DEFAULT 1,
    cost_per_unit NUMERIC(12, 6) GENERATED ALWAYS AS (
        CASE WHEN purchase_quantity > 0 THEN purchase_price / purchase_quantity ELSE 0 END
    ) STORED,
    stock_quantity NUMERIC(10, 4) NOT NULL DEFAULT 0,
    min_stock_alert NUMERIC(10, 4) DEFAULT 100,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 7. Products Table
CREATE TABLE IF NOT EXISTS public.products (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    organisation_id UUID REFERENCES public.organisations(id) ON DELETE CASCADE NOT NULL,
    name TEXT NOT NULL,
    category TEXT DEFAULT 'Savon',
    sku TEXT,
    selling_price NUMERIC(10, 2) NOT NULL DEFAULT 0, -- Prix de vente TTC conseillé
    packaging_cost NUMERIC(10, 4) NOT NULL DEFAULT 0, -- Coût emballage / boîte
    extra_costs NUMERIC(10, 4) NOT NULL DEFAULT 0, -- Énergie, étiquette, consommables
    curing_days INTEGER NOT NULL DEFAULT 0, -- Jours de séchage / cure (ex: 28 jours)
    stock_quantity INTEGER NOT NULL DEFAULT 0,
    image_url TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 8. Product Ingredients (Bill of Materials / BOM) Table
CREATE TABLE IF NOT EXISTS public.product_ingredients (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    product_id UUID REFERENCES public.products(id) ON DELETE CASCADE NOT NULL,
    raw_material_id UUID REFERENCES public.raw_materials(id) ON DELETE CASCADE NOT NULL,
    quantity_needed NUMERIC(10, 4) NOT NULL DEFAULT 0
);

-- 9. Production Batches (Suivi des Lots & Cure) Table
CREATE TABLE IF NOT EXISTS public.production_batches (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    organisation_id UUID REFERENCES public.organisations(id) ON DELETE CASCADE NOT NULL,
    product_id UUID REFERENCES public.products(id) ON DELETE CASCADE NOT NULL,
    batch_number TEXT NOT NULL, -- ex: LOT-2026-001
    quantity_produced INTEGER NOT NULL DEFAULT 1,
    production_date DATE NOT NULL DEFAULT CURRENT_DATE,
    curing_end_date DATE NOT NULL,
    status TEXT NOT NULL DEFAULT 'curing' CHECK (status IN ('curing', 'ready', 'archived')),
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 10. Sales Table (Caisse Multi-Canaux)
CREATE TABLE IF NOT EXISTS public.sales (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    organisation_id UUID REFERENCES public.organisations(id) ON DELETE CASCADE NOT NULL,
    channel TEXT NOT NULL DEFAULT 'market' CHECK (channel IN ('market', 'direct', 'web')),
    payment_method TEXT NOT NULL DEFAULT 'cash' CHECK (payment_method IN ('cash', 'card', 'qr_transfer', 'gift')),
    total_amount NUMERIC(10, 2) NOT NULL DEFAULT 0,
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 11. Sale Items Table
CREATE TABLE IF NOT EXISTS public.sale_items (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    sale_id UUID REFERENCES public.sales(id) ON DELETE CASCADE NOT NULL,
    product_id UUID REFERENCES public.products(id) ON DELETE CASCADE NOT NULL,
    batch_id UUID REFERENCES public.production_batches(id) ON DELETE SET NULL,
    quantity INTEGER NOT NULL DEFAULT 1,
    unit_price NUMERIC(10, 2) NOT NULL DEFAULT 0
);

-- 12. Expenses Table (Frais d'Exploitation)
CREATE TABLE IF NOT EXISTS public.expenses (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    organisation_id UUID REFERENCES public.organisations(id) ON DELETE CASCADE NOT NULL,
    name TEXT NOT NULL,
    category TEXT NOT NULL DEFAULT 'emplacement_marche',
    amount NUMERIC(10, 2) NOT NULL DEFAULT 0,
    expense_date DATE NOT NULL DEFAULT CURRENT_DATE,
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 13. Clients Table (Carnet Client)
CREATE TABLE IF NOT EXISTS public.clients (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    organisation_id UUID REFERENCES public.organisations(id) ON DELETE CASCADE NOT NULL,
    name TEXT NOT NULL,
    company_name TEXT,
    email TEXT,
    phone TEXT,
    address TEXT,
    client_type TEXT NOT NULL DEFAULT 'b2c' CHECK (client_type IN ('b2c', 'b2b')),
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 14. Orders Table (Carnet de Commandes)
CREATE TABLE IF NOT EXISTS public.orders (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    organisation_id UUID REFERENCES public.organisations(id) ON DELETE CASCADE NOT NULL,
    order_number TEXT NOT NULL, -- e.g. CMD-2026-001
    client_id UUID REFERENCES public.clients(id) ON DELETE CASCADE NOT NULL,
    status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'processing', 'shipped', 'delivered', 'cancelled')),
    payment_status TEXT NOT NULL DEFAULT 'unpaid' CHECK (payment_status IN ('unpaid', 'paid')),
    target_delivery_date DATE,
    total_amount NUMERIC(10, 2) NOT NULL DEFAULT 0,
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 15. Order Items Table
CREATE TABLE IF NOT EXISTS public.order_items (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    order_id UUID REFERENCES public.orders(id) ON DELETE CASCADE NOT NULL,
    product_id UUID REFERENCES public.products(id) ON DELETE CASCADE NOT NULL,
    quantity INTEGER NOT NULL DEFAULT 1,
    unit_price NUMERIC(10, 2) NOT NULL DEFAULT 0
);

-- ====================================================================
-- INDEXES FOR PERFORMANCE
-- ====================================================================
CREATE INDEX IF NOT EXISTS idx_profiles_user ON public.profiles(user_id);
CREATE INDEX IF NOT EXISTS idx_suppliers_org ON public.suppliers(organisation_id);
CREATE INDEX IF NOT EXISTS idx_raw_materials_org ON public.raw_materials(organisation_id);
CREATE INDEX IF NOT EXISTS idx_products_org ON public.products(organisation_id);
CREATE INDEX IF NOT EXISTS idx_batches_org ON public.production_batches(organisation_id);
CREATE INDEX IF NOT EXISTS idx_sales_org ON public.sales(organisation_id);
CREATE INDEX IF NOT EXISTS idx_expenses_org ON public.expenses(organisation_id);
CREATE INDEX IF NOT EXISTS idx_clients_org ON public.clients(organisation_id);
CREATE INDEX IF NOT EXISTS idx_orders_org ON public.orders(organisation_id);

-- ====================================================================
-- ROW LEVEL SECURITY (RLS) POLICIES
-- ====================================================================

-- Enable RLS on all tables
ALTER TABLE public.organisations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.suppliers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.raw_materials ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.products ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.product_ingredients ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.production_batches ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.sales ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.sale_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.expenses ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.clients ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.order_items ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if re-running
DROP POLICY IF EXISTS "Users can access their organisation" ON public.organisations;
DROP POLICY IF EXISTS "Users can access profiles in their organisation" ON public.profiles;
DROP POLICY IF EXISTS "Tenant isolation for suppliers" ON public.suppliers;
DROP POLICY IF EXISTS "Tenant isolation for raw_materials" ON public.raw_materials;
DROP POLICY IF EXISTS "Tenant isolation for products" ON public.products;
DROP POLICY IF EXISTS "Tenant isolation for product_ingredients" ON public.product_ingredients;
DROP POLICY IF EXISTS "Tenant isolation for production_batches" ON public.production_batches;
DROP POLICY IF EXISTS "Tenant isolation for sales" ON public.sales;
DROP POLICY IF EXISTS "Tenant isolation for sale_items" ON public.sale_items;
DROP POLICY IF EXISTS "Tenant isolation for expenses" ON public.expenses;
DROP POLICY IF EXISTS "Tenant isolation for clients" ON public.clients;
DROP POLICY IF EXISTS "Tenant isolation for orders" ON public.orders;
DROP POLICY IF EXISTS "Tenant isolation for order_items" ON public.order_items;

-- Re-create Policies
CREATE POLICY "Users can access their organisation" ON public.organisations
    FOR ALL USING (id = public.current_org_id());

CREATE POLICY "Users can access profiles in their organisation" ON public.profiles
    FOR ALL USING (organisation_id = public.current_org_id());

CREATE POLICY "Tenant isolation for suppliers" ON public.suppliers
    FOR ALL USING (organisation_id = public.current_org_id());

CREATE POLICY "Tenant isolation for raw_materials" ON public.raw_materials
    FOR ALL USING (organisation_id = public.current_org_id());

CREATE POLICY "Tenant isolation for products" ON public.products
    FOR ALL USING (organisation_id = public.current_org_id());

CREATE POLICY "Tenant isolation for product_ingredients" ON public.product_ingredients
    FOR ALL USING (
        product_id IN (SELECT id FROM public.products WHERE organisation_id = public.current_org_id())
    );

CREATE POLICY "Tenant isolation for production_batches" ON public.production_batches
    FOR ALL USING (organisation_id = public.current_org_id());

CREATE POLICY "Tenant isolation for sales" ON public.sales
    FOR ALL USING (organisation_id = public.current_org_id());

CREATE POLICY "Tenant isolation for sale_items" ON public.sale_items
    FOR ALL USING (
        sale_id IN (SELECT id FROM public.sales WHERE organisation_id = public.current_org_id())
    );

CREATE POLICY "Tenant isolation for expenses" ON public.expenses
    FOR ALL USING (organisation_id = public.current_org_id());

CREATE POLICY "Tenant isolation for clients" ON public.clients
    FOR ALL USING (organisation_id = public.current_org_id());

CREATE POLICY "Tenant isolation for orders" ON public.orders
    FOR ALL USING (organisation_id = public.current_org_id());

CREATE POLICY "Tenant isolation for order_items" ON public.order_items
    FOR ALL USING (
        order_id IN (SELECT id FROM public.orders WHERE organisation_id = public.current_org_id())
    );

-- ====================================================================
-- AUTOMATIC NEW USER & ORGANISATION TRIGGER
-- ====================================================================
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
DECLARE
    new_org_id UUID;
    org_name_val TEXT;
    full_name_val TEXT;
BEGIN
    org_name_val := COALESCE(new.raw_user_meta_data->>'organisation_name', 'Ma Savonnerie Artisanale');
    full_name_val := COALESCE(new.raw_user_meta_data->>'full_name', 'Artisan Savonnier');

    -- 1. Create a new Organisation
    INSERT INTO public.organisations (name, craft_type)
    VALUES (org_name_val, 'savonnerie')
    RETURNING id INTO new_org_id;

    -- 2. Create Profile linking User to Organisation
    INSERT INTO public.profiles (user_id, organisation_id, role, full_name)
    VALUES (new.id, new_org_id, 'owner', full_name_val);

    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger to run after new auth.user insert
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();


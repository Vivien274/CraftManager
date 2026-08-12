export type CraftType = 'savonnerie' | 'bijouterie' | 'apiculture' | 'bougies' | 'ceramique' | 'couture' | 'autre';
export type UnitType = 'g' | 'kg' | 'ml' | 'l' | 'unité' | 'cm';

export type PlanTier = 'starter' | 'pro' | 'expert';

export type BatchStatus = 'curing' | 'ready' | 'archived';

export type SaleChannel = 'market' | 'direct' | 'web';

export type PaymentMethod = 'cash' | 'card' | 'qr_transfer' | 'gift';

export interface Organisation {
  id: string;
  name: string;
  craft_type: CraftType;
  currency: string; // 'EUR' | 'USD' | 'CHF'
  plan_tier?: PlanTier;
  created_at: string;
}

export interface Supplier {
  id: string;
  organisation_id: string;
  name: string;
  email?: string;
  phone?: string;
  website?: string;
  notes?: string;
  created_at: string;
}

export interface RawMaterialAllergen {
  name: string; // e.g. Linalool, Limonene, Geraniol
  percentage: number; // e.g. 1.5% inside essential oil
}

export interface RawMaterial {
  id: string;
  organisation_id: string;
  supplier_id?: string;
  name: string;
  category: string;
  unit: UnitType;
  purchase_price: number; // e.g. 45.00 €
  purchase_quantity: number; // e.g. 5000 ml
  cost_per_unit: number; // calculated e.g. 0.009 €/ml
  stock_quantity: number; // e.g. 12500 ml remaining
  min_stock_alert: number;
  inci_name?: string; // Nom INCI officiel (ex: Olea Europaea Fruit Oil)
  cas_number?: string; // Numéro CAS (ex: 8001-25-0)
  allergens?: RawMaterialAllergen[]; // Allergènes déclarables
  clp_phrases?: string[]; // Phrases H/P CLP (ex: H317, H412)
  created_at: string;
}

export interface RecipeIngredient {
  id: string;
  recipe_id: string;
  raw_material_id: string;
  raw_material?: RawMaterial;
  quantity_needed: number;
}

export interface Recipe {
  id: string;
  organisation_id: string;
  name: string;
  category: string;
  batch_output_quantity: number; // Rendement de la fournée (ex: 10 savons)
  curing_days: number; // Jours de cure / séchage
  notes?: string;
  ingredients: RecipeIngredient[];
  created_at: string;
}

export interface ProductIngredient {
  id: string;
  product_id: string;
  raw_material_id: string;
  raw_material?: RawMaterial;
  quantity_needed: number; // in raw_material.unit
}

export interface Product {
  id: string;
  organisation_id: string;
  recipe_id?: string;
  recipe?: Recipe;
  name: string;
  category: string;
  sku?: string;
  selling_price: number; // Prix de vente TTC effectif
  packaging_cost: number; // Coût emballage / flacon / étiquette
  extra_costs: number; // Part fixe
  custom_margin?: number; // Marge de base (%) (ex: 350%)
  is_painful?: boolean; // Option Recette Pénible (+10% marge)
  batch_output_quantity?: number; // Copie / fallback du rendement
  curing_days: number; // Jours de cure / séchage
  stock_quantity: number; // Stock produits finis
  regulatory_type?: 'cosmetic' | 'candle' | 'jewelry' | 'honey' | 'general';
  image_url?: string;
  ingredients?: ProductIngredient[];
  created_at: string;
}

export interface ProductionBatch {
  id: string;
  organisation_id: string;
  product_id: string;
  product?: Product;
  product_name?: string;
  batch_number: string; // e.g. LOT-2026-001
  quantity_produced: number;
  production_date: string; // YYYY-MM-DD
  curing_end_date: string; // YYYY-MM-DD
  status: BatchStatus;
  notes?: string;
  created_at: string;
}

export interface SaleItem {
  id: string;
  sale_id: string;
  product_id: string;
  product?: Product;
  batch_id?: string;
  quantity: number;
  unit_price: number;
}

export interface Sale {
  id: string;
  organisation_id: string;
  channel: SaleChannel;
  payment_method: PaymentMethod;
  total_amount: number;
  notes?: string;
  items: SaleItem[];
  created_at: string;
}

export interface CartItem {
  product: Product;
  quantity: number;
}

export type ExpenseCategory =
  | 'emplacement_marche'
  | 'laboratoire_dip'
  | 'energie_fluides'
  | 'emballage_expedition'
  | 'outillage'
  | 'autre';

export interface Expense {
  id: string;
  organisation_id: string;
  name: string;
  category: ExpenseCategory;
  amount: number;
  expense_date: string;
  notes?: string;
  created_at: string;
}

export type ClientType = 'b2c' | 'b2b';

export interface Client {
  id: string;
  organisation_id: string;
  name: string;
  company_name?: string;
  email?: string;
  phone?: string;
  address?: string;
  client_type: ClientType;
  notes?: string;
  created_at: string;
}

export type OrderStatus = 'pending' | 'processing' | 'shipped' | 'delivered' | 'cancelled';
export type PaymentStatus = 'unpaid' | 'paid';

export interface OrderItem {
  id: string;
  order_id: string;
  product_id: string;
  product?: Product;
  quantity: number;
  unit_price: number;
}

export interface Order {
  id: string;
  organisation_id: string;
  order_number: string; // e.g. CMD-2026-001
  client_id: string;
  client?: Client;
  status: OrderStatus;
  payment_status: PaymentStatus;
  target_delivery_date?: string; // YYYY-MM-DD
  total_amount: number;
  notes?: string;
  items: OrderItem[];
  created_at: string;
}



'use client';

import { useState, useEffect } from 'react';
import {
  Organisation,
  Supplier,
  RawMaterial,
  Product,
  ProductionBatch,
  Sale,
  CartItem,
  SaleChannel,
  PaymentMethod,
  Recipe,
  Expense,
  Client,
  Order,
  OrderItem,
  OrderStatus,
  PaymentStatus,
} from '../types/craft';
import { createClient } from '../supabase/client';

const DEFAULT_ORG: Organisation = {
  id: 'org-1',
  name: "L'Atelier des Restanques",
  craft_type: 'savonnerie',
  currency: 'EUR',
  plan_tier: 'expert',
  created_at: new Date().toISOString(),
};

const DEFAULT_CLIENTS: Client[] = [
  {
    id: 'client-1',
    organisation_id: 'org-1',
    name: 'Sophie Martin',
    company_name: 'Boutique Nature & Sens',
    email: 'contact@nature-sens.fr',
    phone: '06 12 34 56 78',
    address: '14 Rue Saint-Ferréol, 13001 Marseille',
    client_type: 'b2b',
    notes: 'Commande récurrente 50 savons/mois.',
    created_at: new Date().toISOString(),
  },
  {
    id: 'client-2',
    organisation_id: 'org-1',
    name: 'Thomas Laurent',
    company_name: '',
    email: 'thomas.laurent@gmail.com',
    phone: '06 98 76 54 32',
    address: '8 Avenue de la Gare, 13100 Aix-en-Provence',
    client_type: 'b2c',
    notes: 'Commande personnalisée pour mariage.',
    created_at: new Date().toISOString(),
  },
];

const DEFAULT_PRODUCTS: Product[] = [
  {
    id: 'prod-demo-1',
    organisation_id: 'org-1',
    name: 'Savon Bio Lavande & Miel 100g',
    category: 'Savons',
    selling_price: 6.50,
    packaging_cost: 0.50,
    extra_costs: 0.20,
    curing_days: 28,
    stock_quantity: 45,
    created_at: new Date().toISOString(),
  },
  {
    id: 'prod-demo-2',
    organisation_id: 'org-1',
    name: 'Baume À Lèvres Cire d’Abeille 15g',
    category: 'Baumes',
    selling_price: 5.00,
    packaging_cost: 0.40,
    extra_costs: 0.10,
    curing_days: 0,
    stock_quantity: 60,
    created_at: new Date().toISOString(),
  },
  {
    id: 'prod-demo-3',
    organisation_id: 'org-1',
    name: 'Bougie Parfumée Fleur d’Oranger',
    category: 'Bougies',
    selling_price: 14.90,
    packaging_cost: 1.20,
    extra_costs: 0.50,
    curing_days: 3,
    stock_quantity: 20,
    created_at: new Date().toISOString(),
  },
];

export function useCraftStore() {
  const [organisation, setOrganisation] = useState<Organisation>(DEFAULT_ORG);
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [rawMaterials, setRawMaterials] = useState<RawMaterial[]>([]);
  const [recipes, setRecipes] = useState<Recipe[]>([]);
  const [products, setProducts] = useState<Product[]>(DEFAULT_PRODUCTS);
  const [batches, setBatches] = useState<ProductionBatch[]>([]);
  const [sales, setSales] = useState<Sale[]>([]);
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [clients, setClients] = useState<Client[]>(DEFAULT_CLIENTS);
  const [orders, setOrders] = useState<Order[]>([]);
  const [cart, setCart] = useState<CartItem[]>([]);
  const [isLoaded, setIsLoaded] = useState(false);

  // Initialize and load from Supabase or LocalStorage
  useEffect(() => {
    async function loadData() {
      try {
        const supabase = createClient();
        const {
          data: { user },
        } = await supabase.auth.getUser();

        // 1. Load LocalStorage initial cache first (so UI is instant and offline items exist)
        const savedOrg = localStorage.getItem('craft_org');
        const savedSuppliers = localStorage.getItem('craft_suppliers');
        const savedRM = localStorage.getItem('craft_raw_materials');
        const savedRecipes = localStorage.getItem('craft_recipes');
        const savedProducts = localStorage.getItem('craft_products');
        const savedBatches = localStorage.getItem('craft_batches');
        const savedSales = localStorage.getItem('craft_sales');
        const savedExpenses = localStorage.getItem('craft_expenses');
        const savedClients = localStorage.getItem('craft_clients');
        const savedOrders = localStorage.getItem('craft_orders');

        if (savedOrg) setOrganisation(JSON.parse(savedOrg));
        if (savedSuppliers) setSuppliers(JSON.parse(savedSuppliers));
        if (savedRM) setRawMaterials(JSON.parse(savedRM));
        if (savedRecipes) setRecipes(JSON.parse(savedRecipes));
        if (savedProducts) {
          const parsed = JSON.parse(savedProducts);
          if (Array.isArray(parsed) && parsed.length > 0) {
            setProducts(parsed);
          }
        }
        if (savedBatches) setBatches(JSON.parse(savedBatches));
        if (savedSales) setSales(JSON.parse(savedSales));
        if (savedExpenses) setExpenses(JSON.parse(savedExpenses));
        if (savedClients) setClients(JSON.parse(savedClients));
        if (savedOrders) setOrders(JSON.parse(savedOrders));

        // 2. If User is authenticated in Supabase, fetch Cloud Data
        if (user) {
          // Fetch or ensure profile & organization
          let { data: profile } = await supabase
            .from('profiles')
            .select('*, organisations(*)')
            .eq('user_id', user.id)
            .maybeSingle();

          if (!profile) {
            // Auto-create organisation and profile if missing
            const { data: newOrg } = await supabase
              .from('organisations')
              .insert({
                name: user.user_metadata?.organisation_name || "L'Atelier des Restanques",
                craft_type: 'savonnerie',
              })
              .select()
              .single();

            if (newOrg) {
              const { data: newProf } = await supabase
                .from('profiles')
                .insert({
                  user_id: user.id,
                  organisation_id: newOrg.id,
                  role: 'owner',
                  full_name: user.user_metadata?.full_name || 'Artisan Savonnier',
                })
                .select('*, organisations(*)')
                .single();

              profile = newProf;
            }
          }

          if (profile && profile.organisations) {
            const orgObj = profile.organisations as Organisation;
            setOrganisation(orgObj);
            localStorage.setItem('craft_org', JSON.stringify(orgObj));
          }

          // Fetch Raw Materials
          const { data: rmData } = await supabase.from('raw_materials').select('*').order('created_at', { ascending: false });
          const fetchedRM = (rmData as RawMaterial[]) || [];
          setRawMaterials(fetchedRM);
          localStorage.setItem('craft_raw_materials', JSON.stringify(fetchedRM));

          // Fetch Products
          const { data: prodData } = await supabase.from('products').select('*').order('created_at', { ascending: false });
          const fetchedProd = (prodData as Product[]) || [];
          setProducts(fetchedProd);
          localStorage.setItem('craft_products', JSON.stringify(fetchedProd));

          // Fetch Production Batches
          const { data: batchData } = await supabase.from('production_batches').select('*').order('created_at', { ascending: false });
          const fetchedBatches = (batchData as ProductionBatch[]) || [];
          setBatches(fetchedBatches);
          localStorage.setItem('craft_batches', JSON.stringify(fetchedBatches));

          // Fetch Sales
          const { data: saleData } = await supabase.from('sales').select('*, items:sale_items(*)').order('created_at', { ascending: false });
          const fetchedSales = (saleData as Sale[]) || [];
          setSales(fetchedSales);
          localStorage.setItem('craft_sales', JSON.stringify(fetchedSales));

          // Fetch Expenses
          const { data: expData } = await supabase.from('expenses').select('*').order('created_at', { ascending: false });
          const fetchedExpenses = (expData as Expense[]) || [];
          setExpenses(fetchedExpenses);
          localStorage.setItem('craft_expenses', JSON.stringify(fetchedExpenses));

          // Fetch Suppliers
          const { data: supData } = await supabase.from('suppliers').select('*').order('created_at', { ascending: false });
          const fetchedSuppliers = (supData as Supplier[]) || [];
          setSuppliers(fetchedSuppliers);
          localStorage.setItem('craft_suppliers', JSON.stringify(fetchedSuppliers));
        }
      } catch (e) {
        console.error('Error loading data from Supabase/storage:', e);
      } finally {
        setIsLoaded(true);
      }
    }

    loadData();
  }, []);

  const saveOrganisation = (newOrg: Organisation) => {
    setOrganisation(newOrg);
    localStorage.setItem('craft_org', JSON.stringify(newOrg));
  };

  const updateOrganisation = async (updates: Partial<Organisation>) => {
    const updated = { ...organisation, ...updates };
    saveOrganisation(updated);

    try {
      const supabase = createClient();
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (user && updated.id) {
        await supabase
          .from('organisations')
          .update({
            name: updated.name,
            craft_type: updated.craft_type,
            currency: updated.currency,
            plan_tier: updated.plan_tier,
          })
          .eq('id', updated.id);
      }
    } catch (err) {
      console.error('Error updating organisation in Supabase:', err);
    }
  };

  // Recipe Handlers
  const addRecipe = (rec: Omit<Recipe, 'id' | 'organisation_id' | 'created_at'>) => {
    const newRec: Recipe = {
      ...rec,
      id: `rec-${Date.now()}`,
      organisation_id: organisation.id,
      created_at: new Date().toISOString(),
    };
    const updated = [newRec, ...recipes];
    setRecipes(updated);
    localStorage.setItem('craft_recipes', JSON.stringify(updated));
    return newRec;
  };

  const updateRecipe = (id: string, updates: Partial<Recipe>) => {
    const updated = recipes.map((r) => (r.id === id ? { ...r, ...updates } : r));
    setRecipes(updated);
    localStorage.setItem('craft_recipes', JSON.stringify(updated));
  };

  const deleteRecipe = (id: string) => {
    const updated = recipes.filter((r) => r.id !== id);
    setRecipes(updated);
    localStorage.setItem('craft_recipes', JSON.stringify(updated));
  };

  // Product Handlers
  const addProduct = async (prod: Omit<Product, 'id' | 'organisation_id' | 'created_at'>) => {
    let newProd: Product = {
      ...prod,
      id: `prod-${Date.now()}`,
      organisation_id: organisation.id,
      created_at: new Date().toISOString(),
    };

    try {
      const supabase = createClient();
      const payload: any = {
        name: prod.name,
        category: prod.category,
        sku: prod.sku,
        selling_price: prod.selling_price,
        packaging_cost: prod.packaging_cost,
        extra_costs: prod.extra_costs,
        curing_days: prod.curing_days,
        stock_quantity: prod.stock_quantity,
        image_url: prod.image_url,
      };

      if (organisation.id && !organisation.id.startsWith('org-')) {
        payload.organisation_id = organisation.id;
      }

      const { data, error } = await supabase.from('products').insert(payload).select().single();
      if (error) console.error('Supabase product insert error:', error.message);
      if (data) newProd = data as Product;
    } catch (e) {
      console.warn('Supabase product insert offline:', e);
    }

    const updated = [newProd, ...products];
    setProducts(updated);
    localStorage.setItem('craft_products', JSON.stringify(updated));
  };

  const updateProduct = async (id: string, updates: Partial<Product>) => {
    const updated = products.map((p) => (p.id === id ? { ...p, ...updates } : p));
    setProducts(updated);
    localStorage.setItem('craft_products', JSON.stringify(updated));

    try {
      const supabase = createClient();
      await supabase.from('products').update(updates).eq('id', id);
    } catch (e) {
      console.warn('Supabase product update offline:', e);
    }
  };

  const deleteProduct = async (id: string) => {
    const updated = products.filter((p) => p.id !== id);
    setProducts(updated);
    localStorage.setItem('craft_products', JSON.stringify(updated));

    try {
      const supabase = createClient();
      await supabase.from('products').delete().eq('id', id);
    } catch (e) {
      console.warn('Supabase product delete offline:', e);
    }
  };

  // Raw Material Handlers
  const addRawMaterial = async (rm: Omit<RawMaterial, 'id' | 'organisation_id' | 'cost_per_unit' | 'created_at'>) => {
    const cost_per_unit = rm.purchase_quantity > 0 ? rm.purchase_price / rm.purchase_quantity : 0;
    let newRM: RawMaterial = {
      ...rm,
      id: `rm-${Date.now()}`,
      organisation_id: organisation.id,
      cost_per_unit,
      created_at: new Date().toISOString(),
    };

    try {
      const supabase = createClient();
      const payload: any = {
        name: rm.name,
        category: rm.category,
        supplier_id: rm.supplier_id || null,
        unit: rm.unit,
        purchase_price: rm.purchase_price,
        purchase_quantity: rm.purchase_quantity,
        stock_quantity: rm.stock_quantity,
        min_stock_alert: rm.min_stock_alert,
      };

      if (organisation.id && !organisation.id.startsWith('org-')) {
        payload.organisation_id = organisation.id;
      }

      const { data, error } = await supabase.from('raw_materials').insert(payload).select().single();
      if (error) console.error('Supabase raw_material insert error:', error.message);
      if (data) newRM = data as RawMaterial;
    } catch (e) {
      console.warn('Supabase raw_material insert offline:', e);
    }

    const updated = [newRM, ...rawMaterials];
    setRawMaterials(updated);
    localStorage.setItem('craft_raw_materials', JSON.stringify(updated));
  };

  const updateRawMaterial = async (id: string, updates: Partial<RawMaterial>) => {
    const updated = rawMaterials.map((rm) => {
      if (rm.id === id) {
        const pPrice = updates.purchase_price ?? rm.purchase_price;
        const pQty = updates.purchase_quantity ?? rm.purchase_quantity;
        const cost_per_unit = pQty > 0 ? pPrice / pQty : 0;
        return { ...rm, ...updates, cost_per_unit };
      }
      return rm;
    });
    setRawMaterials(updated);
    localStorage.setItem('craft_raw_materials', JSON.stringify(updated));

    try {
      const supabase = createClient();
      await supabase.from('raw_materials').update(updates).eq('id', id);
    } catch (e) {
      console.warn('Supabase raw_material update offline:', e);
    }
  };

  const deleteRawMaterial = async (id: string) => {
    const updated = rawMaterials.filter((rm) => rm.id !== id);
    setRawMaterials(updated);
    localStorage.setItem('craft_raw_materials', JSON.stringify(updated));

    try {
      const supabase = createClient();
      await supabase.from('raw_materials').delete().eq('id', id);
    } catch (e) {
      console.warn('Supabase raw_material delete offline:', e);
    }
  };

  // POS Cart Handlers
  const addToCart = (product: Product, quantity = 1) => {
    const existingIndex = cart.findIndex((item) => item.product.id === product.id);
    if (existingIndex > -1) {
      const updated = [...cart];
      updated[existingIndex].quantity += quantity;
      setCart(updated);
    } else {
      setCart([...cart, { product, quantity }]);
    }
  };

  const updateCartQuantity = (productId: string, quantity: number) => {
    if (quantity <= 0) {
      setCart(cart.filter((item) => item.product.id !== productId));
    } else {
      setCart(
        cart.map((item) =>
          item.product.id === productId ? { ...item, quantity } : item
        )
      );
    }
  };

  const clearCart = () => setCart([]);

  const completeSale = async (channel: SaleChannel, paymentMethod: PaymentMethod) => {
    if (cart.length === 0) return;

    const totalAmount = cart.reduce(
      (sum, item) => sum + item.product.selling_price * item.quantity,
      0
    );

    let newSale: Sale = {
      id: `sale-${Date.now()}`,
      organisation_id: organisation.id,
      channel,
      payment_method: paymentMethod,
      total_amount: totalAmount,
      created_at: new Date().toISOString(),
      items: cart.map((item, idx) => ({
        id: `si-${Date.now()}-${idx}`,
        sale_id: '',
        product_id: item.product.id,
        quantity: item.quantity,
        unit_price: item.product.selling_price,
      })),
    };

    try {
      const supabase = createClient();
      const salePayload: any = {
        channel,
        payment_method: paymentMethod,
        total_amount: totalAmount,
      };

      if (organisation.id && !organisation.id.startsWith('org-')) {
        salePayload.organisation_id = organisation.id;
      }

      const { data: insertedSale, error } = await supabase
        .from('sales')
        .insert(salePayload)
        .select()
        .single();

      if (error) console.error('Supabase sale insert error:', error.message);

      if (insertedSale) {
        newSale = { ...newSale, id: insertedSale.id };
        const saleItemsToInsert = cart.map((item) => ({
          sale_id: insertedSale.id,
          product_id: item.product.id,
          quantity: item.quantity,
          unit_price: item.product.selling_price,
        }));
        await supabase.from('sale_items').insert(saleItemsToInsert);
      }
    } catch (e) {
      console.warn('Supabase sale insert offline:', e);
    }

    const updatedSales = [newSale, ...sales];
    setSales(updatedSales);
    localStorage.setItem('craft_sales', JSON.stringify(updatedSales));

    // Deduct stock
    const updatedProducts = products.map((prod) => {
      const cartItem = cart.find((i) => i.product.id === prod.id);
      if (cartItem) {
        const newQty = Math.max(0, prod.stock_quantity - cartItem.quantity);
        updateProduct(prod.id, { stock_quantity: newQty });
        return {
          ...prod,
          stock_quantity: newQty,
        };
      }
      return prod;
    });

    setProducts(updatedProducts);
    localStorage.setItem('craft_products', JSON.stringify(updatedProducts));

    clearCart();
    return newSale;
  };

  // Supplier Handlers
  const addSupplier = async (sup: Omit<Supplier, 'id' | 'organisation_id' | 'created_at'>) => {
    let newSup: Supplier = {
      ...sup,
      id: `sup-${Date.now()}`,
      organisation_id: organisation.id,
      created_at: new Date().toISOString(),
    };

    try {
      const supabase = createClient();
      const payload: any = { ...sup };
      if (organisation.id && !organisation.id.startsWith('org-')) {
        payload.organisation_id = organisation.id;
      }
      const { data } = await supabase.from('suppliers').insert(payload).select().single();
      if (data) newSup = data as Supplier;
    } catch (e) {
      console.warn('Supabase supplier insert offline:', e);
    }

    const updated = [newSup, ...suppliers];
    setSuppliers(updated);
    localStorage.setItem('craft_suppliers', JSON.stringify(updated));
  };

  // Production Batch Handlers
  const addProductionBatch = async (batch: Omit<ProductionBatch, 'id' | 'organisation_id' | 'created_at'>) => {
    let newBatch: ProductionBatch = {
      ...batch,
      id: `batch-${Date.now()}`,
      organisation_id: organisation.id,
      created_at: new Date().toISOString(),
    };

    try {
      const supabase = createClient();
      const payload: any = {
        product_id: batch.product_id,
        batch_number: batch.batch_number,
        quantity_produced: batch.quantity_produced,
        production_date: batch.production_date,
        curing_end_date: batch.curing_end_date,
        status: batch.status,
        notes: batch.notes,
      };

      if (organisation.id && !organisation.id.startsWith('org-')) {
        payload.organisation_id = organisation.id;
      }

      const { data } = await supabase.from('production_batches').insert(payload).select().single();
      if (data) newBatch = data as ProductionBatch;
    } catch (e) {
      console.warn('Supabase batch insert offline:', e);
    }

    const updated = [newBatch, ...batches];
    setBatches(updated);
    localStorage.setItem('craft_batches', JSON.stringify(updated));
  };

  const updateBatchStatus = async (id: string, status: ProductionBatch['status']) => {
    const updated = batches.map((b) => {
      if (b.id === id) {
        if (status === 'ready' && b.status !== 'ready') {
          updateProduct(b.product_id, {
            stock_quantity: (products.find((p) => p.id === b.product_id)?.stock_quantity || 0) + b.quantity_produced,
          });
        }
        return { ...b, status };
      }
      return b;
    });
    setBatches(updated);
    localStorage.setItem('craft_batches', JSON.stringify(updated));

    try {
      const supabase = createClient();
      await supabase.from('production_batches').update({ status }).eq('id', id);
    } catch (e) {
      console.warn('Supabase batch status update offline:', e);
    }
  };

  const updateProductionBatch = async (id: string, updates: Partial<ProductionBatch>) => {
    const updated = batches.map((b) => (b.id === id ? { ...b, ...updates } : b));
    setBatches(updated);
    localStorage.setItem('craft_batches', JSON.stringify(updated));

    try {
      const supabase = createClient();
      await supabase.from('production_batches').update(updates).eq('id', id);
    } catch (e) {
      console.warn('Supabase batch update offline:', e);
    }
  };

  const addExpense = async (exp: Omit<Expense, 'id' | 'organisation_id' | 'created_at'>) => {
    let newExp: Expense = {
      ...exp,
      id: `exp-${Date.now()}`,
      organisation_id: organisation.id,
      created_at: new Date().toISOString(),
    };

    try {
      const supabase = createClient();
      const payload: any = {
        name: exp.name,
        category: exp.category,
        amount: exp.amount,
        expense_date: exp.expense_date,
        notes: exp.notes,
      };

      if (organisation.id && !organisation.id.startsWith('org-')) {
        payload.organisation_id = organisation.id;
      }

      const { data } = await supabase.from('expenses').insert(payload).select().single();
      if (data) newExp = data as Expense;
    } catch (e) {
      console.warn('Supabase expense insert offline:', e);
    }

    const updated = [newExp, ...expenses];
    setExpenses(updated);
    localStorage.setItem('craft_expenses', JSON.stringify(updated));
  };

  const deleteExpense = async (id: string) => {
    const updated = expenses.filter((e) => e.id !== id);
    setExpenses(updated);
    localStorage.setItem('craft_expenses', JSON.stringify(updated));

    try {
      const supabase = createClient();
      await supabase.from('expenses').delete().eq('id', id);
    } catch (e) {
      console.warn('Supabase expense delete offline:', e);
    }
  };

  // Client Handlers
  const addClient = async (cli: Omit<Client, 'id' | 'organisation_id' | 'created_at'>) => {
    let newCli: Client = {
      ...cli,
      id: `client-${Date.now()}`,
      organisation_id: organisation.id,
      created_at: new Date().toISOString(),
    };

    try {
      const supabase = createClient();
      const payload: any = {
        name: cli.name,
        company_name: cli.company_name,
        email: cli.email,
        phone: cli.phone,
        address: cli.address,
        client_type: cli.client_type,
        notes: cli.notes,
      };

      if (organisation.id && !organisation.id.startsWith('org-')) {
        payload.organisation_id = organisation.id;
      }

      const { data } = await supabase.from('clients').insert(payload).select().single();
      if (data) newCli = data as Client;
    } catch (e) {
      console.warn('Supabase client insert offline:', e);
    }

    const updated = [newCli, ...clients];
    setClients(updated);
    localStorage.setItem('craft_clients', JSON.stringify(updated));
    return newCli;
  };

  const updateClient = async (id: string, updates: Partial<Client>) => {
    const updated = clients.map((c) => (c.id === id ? { ...c, ...updates } : c));
    setClients(updated);
    localStorage.setItem('craft_clients', JSON.stringify(updated));

    try {
      const supabase = createClient();
      await supabase.from('clients').update(updates).eq('id', id);
    } catch (e) {
      console.warn('Supabase client update offline:', e);
    }
  };

  const deleteClient = async (id: string) => {
    const updated = clients.filter((c) => c.id !== id);
    setClients(updated);
    localStorage.setItem('craft_clients', JSON.stringify(updated));

    try {
      const supabase = createClient();
      await supabase.from('clients').delete().eq('id', id);
    } catch (e) {
      console.warn('Supabase client delete offline:', e);
    }
  };

  // Order Handlers
  const addOrder = async (orderData: Omit<Order, 'id' | 'organisation_id' | 'created_at'>) => {
    let newOrder: Order = {
      ...orderData,
      id: `order-${Date.now()}`,
      organisation_id: organisation.id,
      created_at: new Date().toISOString(),
    };

    try {
      const supabase = createClient();
      const payload: any = {
        order_number: orderData.order_number,
        client_id: orderData.client_id,
        status: orderData.status,
        payment_status: orderData.payment_status,
        target_delivery_date: orderData.target_delivery_date,
        total_amount: orderData.total_amount,
        notes: orderData.notes,
      };

      if (organisation.id && !organisation.id.startsWith('org-')) {
        payload.organisation_id = organisation.id;
      }

      const { data: createdOrder } = await supabase.from('orders').insert(payload).select().single();
      if (createdOrder) {
        newOrder = { ...newOrder, id: createdOrder.id };
        
        // Insert order items
        const itemPayloads = orderData.items.map((it) => ({
          order_id: createdOrder.id,
          product_id: it.product_id,
          quantity: it.quantity,
          unit_price: it.unit_price,
        }));
        await supabase.from('order_items').insert(itemPayloads);
      }
    } catch (e) {
      console.warn('Supabase order insert offline:', e);
    }

    const updated = [newOrder, ...orders];
    setOrders(updated);
    localStorage.setItem('craft_orders', JSON.stringify(updated));
    return newOrder;
  };

  const updateOrderStatus = async (id: string, status: OrderStatus) => {
    const targetOrder = orders.find((o) => o.id === id);

    // Auto-reduce product stock upon shipping/delivery if not previously shipped
    if (targetOrder && (status === 'shipped' || status === 'delivered') && targetOrder.status !== 'shipped' && targetOrder.status !== 'delivered') {
      targetOrder.items.forEach((it) => {
        const prod = products.find((p) => p.id === it.product_id);
        if (prod) {
          updateProduct(it.product_id, {
            stock_quantity: Math.max(0, prod.stock_quantity - it.quantity),
          });
        }
      });
    }

    const updated = orders.map((o) => (o.id === id ? { ...o, status } : o));
    setOrders(updated);
    localStorage.setItem('craft_orders', JSON.stringify(updated));

    try {
      const supabase = createClient();
      await supabase.from('orders').update({ status }).eq('id', id);
    } catch (e) {
      console.warn('Supabase order status update offline:', e);
    }
  };

  const updateOrderPaymentStatus = async (id: string, payment_status: PaymentStatus) => {
    const updated = orders.map((o) => (o.id === id ? { ...o, payment_status } : o));
    setOrders(updated);
    localStorage.setItem('craft_orders', JSON.stringify(updated));

    try {
      const supabase = createClient();
      await supabase.from('orders').update({ payment_status }).eq('id', id);
    } catch (e) {
      console.warn('Supabase order payment update offline:', e);
    }
  };

  const deleteOrder = async (id: string) => {
    const updated = orders.filter((o) => o.id !== id);
    setOrders(updated);
    localStorage.setItem('craft_orders', JSON.stringify(updated));

    try {
      const supabase = createClient();
      await supabase.from('orders').delete().eq('id', id);
    } catch (e) {
      console.warn('Supabase order delete offline:', e);
    }
  };

  const importTraceabilitySeed = async () => {
    try {
      const res = await fetch('/traceability_seed.json');
      const data = await res.json();
      const supabase = createClient();
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (user && organisation.id) {
        // 1. Insert Suppliers into Supabase
        const supPayloads = data.suppliers.map((sName: string) => ({
          name: sName,
          organisation_id: organisation.id,
        }));
        const { data: dbSuppliers, error: supErr } = await supabase
          .from('suppliers')
          .insert(supPayloads)
          .select();

        if (supErr) console.error('Error inserting suppliers:', supErr);
        if (dbSuppliers && dbSuppliers.length > 0) {
          setSuppliers((prev) => [...(dbSuppliers as Supplier[]), ...prev]);
        }

        // 2. Insert Raw Materials into Supabase
        const rmPayloads = data.raw_materials.map((rmName: string) => ({
          name: rmName,
          category: rmName.toLowerCase().includes('huile')
            ? 'Huiles Végétales'
            : rmName.toLowerCase().includes('beurre')
            ? 'Beurres'
            : rmName.toLowerCase().includes('lait')
            ? 'Additifs'
            : 'Général',
          unit: 'g',
          purchase_price: 15.0,
          purchase_quantity: 1000,
          stock_quantity: 5000,
          min_stock_alert: 500,
          organisation_id: organisation.id,
        }));
        const { data: dbRM, error: rmErr } = await supabase
          .from('raw_materials')
          .insert(rmPayloads)
          .select();

        if (rmErr) console.error('Error inserting raw_materials:', rmErr);
        if (dbRM && dbRM.length > 0) {
          setRawMaterials((prev) => [...(dbRM as RawMaterial[]), ...prev]);
        }

        // 3. Insert Products into Supabase
        const prodPayloads = data.products.map((p: any) => ({
          name: p.name,
          category: p.category,
          sku: `SKU-${Math.floor(100 + Math.random() * 900)}`,
          selling_price: 7.5,
          packaging_cost: 0.5,
          extra_costs: 0.3,
          curing_days: p.curing_days,
          stock_quantity: 25,
          organisation_id: organisation.id,
        }));
        const { data: dbProducts, error: prodErr } = await supabase
          .from('products')
          .insert(prodPayloads)
          .select();

        if (prodErr) console.error('Error inserting products:', prodErr);

        const realProdMap: Record<string, string> = {};
        if (dbProducts && dbProducts.length > 0) {
          setProducts((prev) => [...(dbProducts as Product[]), ...prev]);
          for (const dp of dbProducts) {
            realProdMap[dp.name] = dp.id;
          }
        }

        // 4. Insert Production Batches with REAL product UUIDs
        const fallbackProdId = dbProducts && dbProducts[0] ? dbProducts[0].id : null;
        if (fallbackProdId) {
          const batchPayloads = data.batches.map((b: any) => ({
            product_id: realProdMap[b.product_name] || fallbackProdId,
            batch_number: b.batch_number,
            quantity_produced: b.quantity_produced,
            production_date: b.production_date,
            curing_end_date: b.curing_end_date,
            status: b.status,
            notes: b.notes,
            organisation_id: organisation.id,
          }));

          const { data: dbBatches, error: batchErr } = await supabase
            .from('production_batches')
            .insert(batchPayloads)
            .select();

          if (batchErr) console.error('Error inserting batches:', batchErr);
          if (dbBatches && dbBatches.length > 0) {
            setBatches((prev) => [...(dbBatches as ProductionBatch[]), ...prev]);
          }
        }
      } else {
        // Fallback for local offline state
        const newSuppliers: Supplier[] = data.suppliers.map((sName: string) => ({
          id: `sup-${Date.now()}-${Math.random().toString(36).substr(2, 5)}`,
          organisation_id: organisation.id,
          name: sName,
          created_at: new Date().toISOString(),
        }));
        setSuppliers((prev) => [...newSuppliers, ...prev]);

        const newRM: RawMaterial[] = data.raw_materials.map((rmName: string) => ({
          id: `rm-${Date.now()}-${Math.random().toString(36).substr(2, 5)}`,
          organisation_id: organisation.id,
          name: rmName,
          category: 'Général',
          unit: 'g',
          purchase_price: 15.0,
          purchase_quantity: 1000,
          cost_per_unit: 0.015,
          stock_quantity: 5000,
          min_stock_alert: 500,
          created_at: new Date().toISOString(),
        }));
        setRawMaterials((prev) => [...newRM, ...prev]);

        const prodMap: Record<string, string> = {};
        const newProducts: Product[] = data.products.map((p: any) => {
          const pid = `prod-${Date.now()}-${Math.random().toString(36).substr(2, 5)}`;
          prodMap[p.name] = pid;
          return {
            id: pid,
            organisation_id: organisation.id,
            name: p.name,
            category: p.category,
            selling_price: 7.5,
            curing_days: p.curing_days,
            stock_quantity: 25,
            created_at: new Date().toISOString(),
          };
        });
        setProducts((prev) => [...newProducts, ...prev]);

        const newBatches: ProductionBatch[] = data.batches.map((b: any) => ({
          id: `batch-${Date.now()}-${Math.random().toString(36).substr(2, 5)}`,
          organisation_id: organisation.id,
          product_id: prodMap[b.product_name] || newProducts[0]?.id || 'prod-1',
          batch_number: b.batch_number,
          quantity_produced: b.quantity_produced,
          production_date: b.production_date,
          curing_end_date: b.curing_end_date,
          status: b.status,
          notes: b.notes,
          created_at: new Date().toISOString(),
        }));
        setBatches((prev) => [...newBatches, ...prev]);
      }
      return true;
    } catch (e) {
      console.error('Error importing traceability seed:', e);
      return false;
    }
  };

  return {
    isLoaded,
    organisation,
    suppliers,
    rawMaterials,
    recipes,
    products,
    batches,
    sales,
    expenses,
    clients,
    orders,
    cart,
    updateOrganisation,
    importTraceabilitySeed,
    addSupplier,
    addRecipe,
    updateRecipe,
    deleteRecipe,
    addProduct,
    updateProduct,
    deleteProduct,
    addRawMaterial,
    updateRawMaterial,
    deleteRawMaterial,
    addProductionBatch,
    updateBatchStatus,
    updateProductionBatch,
    addExpense,
    deleteExpense,
    addClient,
    updateClient,
    deleteClient,
    addOrder,
    updateOrderStatus,
    updateOrderPaymentStatus,
    deleteOrder,
    addToCart,
    updateCartQuantity,
    clearCart,
    completeSale,
  };
}

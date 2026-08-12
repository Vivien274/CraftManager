'use client';

import { useState, useMemo, useEffect } from 'react';
import {
  BookOpenCheck,
  Plus,
  Trash2,
  Clock,
  Sparkles,
  Package,
  Layers,
  ChevronRight,
  Eye,
  X,
  FlaskConical,
  ShoppingBag,
} from 'lucide-react';
import { useCraftStore } from '@/lib/store/craftStore';
import { formatCurrency } from '@/lib/utils/calculator';
import { Product, Recipe, RecipeIngredient } from '@/lib/types/craft';

export default function ProductsPage() {
  const {
    isLoaded,
    products,
    recipes,
    rawMaterials,
    addProduct,
    updateProduct,
    deleteProduct,
    addRecipe,
    updateRecipe,
    deleteRecipe,
  } = useCraftStore();

  const [activeTab, setActiveTab] = useState<'products' | 'recipes'>('products');

  // Product Modal State
  const [isProductModalOpen, setIsProductModalOpen] = useState(false);
  const [editingProductId, setEditingProductId] = useState<string | null>(null);

  const [productName, setProductName] = useState('');
  const [productCategory, setProductCategory] = useState('Savon à Froid');
  const [selectedRecipeId, setSelectedRecipeId] = useState<string>('');
  const [packagingCost, setPackagingCost] = useState<number>(0.5);
  const [customMargin, setCustomMargin] = useState<number>(350);
  const [isPainful, setIsPainful] = useState<boolean>(false);
  const [productSellingPrice, setProductSellingPrice] = useState<number>(8.5);
  const [isPriceOverridden, setIsPriceOverridden] = useState<boolean>(false);
  const [productImageUrl, setProductImageUrl] = useState('');

  // Recipe Modal State
  const [isRecipeModalOpen, setIsRecipeModalOpen] = useState(false);
  const [editingRecipeId, setEditingRecipeId] = useState<string | null>(null);

  const [recipeName, setRecipeName] = useState('');
  const [recipeCategory, setRecipeCategory] = useState('Savon à Froid');
  const [recipeBatchYield, setRecipeBatchYield] = useState<number>(10);
  const [recipeCuringDays, setRecipeCuringDays] = useState<number>(28);
  const [recipeIngredients, setRecipeIngredients] = useState<
    { raw_material_id: string; quantity_needed: number }[]
  >([]);

  const rawMaterialsMap = useMemo(() => {
    const map: Record<string, (typeof rawMaterials)[0]> = {};
    rawMaterials.forEach((rm) => {
      map[rm.id] = rm;
    });
    return map;
  }, [rawMaterials]);

  const recipesMap = useMemo(() => {
    const map: Record<string, Recipe> = {};
    recipes.forEach((r) => {
      map[r.id] = r;
    });
    return map;
  }, [recipes]);

  // Calculate live recipe ingredient cost
  const getRecipeIngredientsBatchCost = (recipe?: Recipe | null, formIngredients?: typeof recipeIngredients) => {
    let sum = 0;
    const ingList = recipe ? recipe.ingredients : formIngredients || [];
    for (const ing of ingList) {
      const rm = rawMaterialsMap[ing.raw_material_id];
      if (rm && rm.purchase_quantity > 0) {
        const costPerUnit = rm.purchase_price / rm.purchase_quantity;
        sum += costPerUnit * ing.quantity_needed;
      }
    }
    return sum;
  };

  // Selected recipe calculation for Product Modal
  const activeSelectedRecipe = recipesMap[selectedRecipeId] || recipes[0];
  const activeRecipeBatchCost = getRecipeIngredientsBatchCost(activeSelectedRecipe);
  const activeRecipeYield = activeSelectedRecipe?.batch_output_quantity || 1;
  const activeRecipeIngUnitCost = activeRecipeBatchCost / activeRecipeYield;

  const totalProductCOGS = activeRecipeIngUnitCost + Number(packagingCost);
  const totalMarginPercent = customMargin + (isPainful ? 10 : 0);
  const recommendedProductPrice = activeRecipeIngUnitCost > 0
    ? activeRecipeIngUnitCost * (1 + totalMarginPercent / 100) + Number(packagingCost)
    : 0;

  // Auto pre-fill product selling price
  useEffect(() => {
    if (!isPriceOverridden && recommendedProductPrice > 0) {
      setProductSellingPrice(Number(recommendedProductPrice.toFixed(2)));
    }
  }, [recommendedProductPrice, isPriceOverridden]);

  if (!isLoaded) {
    return <div className="p-8 text-center text-slate-500 font-medium animate-pulse">Chargement du catalogue...</div>;
  }

  // --- Handlers: Product ---
  const handleOpenCreateProduct = () => {
    setEditingProductId(null);
    setProductName('');
    setProductCategory('Savon à Froid');
    setSelectedRecipeId(recipes[0]?.id || '');
    setPackagingCost(0.5);
    setCustomMargin(350);
    setIsPainful(false);
    setProductSellingPrice(8.5);
    setIsPriceOverridden(false);
    setProductImageUrl('');
    setIsProductModalOpen(true);
  };

  const handleOpenEditProduct = (product: Product) => {
    setEditingProductId(product.id);
    setProductName(product.name);
    setProductCategory(product.category);
    setSelectedRecipeId(product.recipe_id || recipes[0]?.id || '');
    setPackagingCost(product.packaging_cost || 0);
    setCustomMargin(product.custom_margin || 350);
    setIsPainful(product.is_painful || false);
    setProductSellingPrice(product.selling_price);
    setIsPriceOverridden(true);
    setProductImageUrl(product.image_url || '');
    setIsProductModalOpen(true);
  };

  const handleSaveProduct = (e: React.FormEvent) => {
    e.preventDefault();
    if (!productName) return;

    const chosenRecipe = recipesMap[selectedRecipeId];

    if (editingProductId) {
      updateProduct(editingProductId, {
        name: productName,
        category: productCategory,
        recipe_id: selectedRecipeId,
        recipe: chosenRecipe,
        selling_price: Number(productSellingPrice),
        packaging_cost: Number(packagingCost),
        custom_margin: Number(customMargin),
        is_painful: isPainful,
        batch_output_quantity: chosenRecipe?.batch_output_quantity || 10,
        curing_days: chosenRecipe?.curing_days || 28,
        image_url: productImageUrl || undefined,
        ingredients: chosenRecipe?.ingredients.map((i) => ({ ...i, product_id: editingProductId })),
      });
    } else {
      addProduct({
        name: productName,
        category: productCategory,
        recipe_id: selectedRecipeId,
        recipe: chosenRecipe,
        selling_price: Number(productSellingPrice),
        packaging_cost: Number(packagingCost),
        extra_costs: 0,
        custom_margin: Number(customMargin),
        is_painful: isPainful,
        batch_output_quantity: chosenRecipe?.batch_output_quantity || 10,
        curing_days: chosenRecipe?.curing_days || 28,
        stock_quantity: 0,
        image_url: productImageUrl || 'https://images.unsplash.com/photo-1607006344380-b6775a0824a7?w=500&q=80',
        ingredients: chosenRecipe?.ingredients.map((i) => ({ ...i, product_id: '' })),
      });
    }

    setIsProductModalOpen(false);
  };

  // --- Handlers: Recipe ---
  const handleOpenCreateRecipe = () => {
    setEditingRecipeId(null);
    setRecipeName('');
    setRecipeCategory('Savon à Froid');
    setRecipeBatchYield(10);
    setRecipeCuringDays(28);
    setRecipeIngredients(
      rawMaterials.length > 0
        ? [{ raw_material_id: rawMaterials[0].id, quantity_needed: 700 }]
        : []
    );
    setIsRecipeModalOpen(true);
  };

  const handleOpenEditRecipe = (recipe: Recipe) => {
    setEditingRecipeId(recipe.id);
    setRecipeName(recipe.name);
    setRecipeCategory(recipe.category);
    setRecipeBatchYield(recipe.batch_output_quantity);
    setRecipeCuringDays(recipe.curing_days);
    setRecipeIngredients(
      recipe.ingredients.map((i) => ({
        raw_material_id: i.raw_material_id,
        quantity_needed: i.quantity_needed,
      }))
    );
    setIsRecipeModalOpen(true);
  };

  const handleSaveRecipe = (e: React.FormEvent) => {
    e.preventDefault();
    if (!recipeName) return;

    const formattedIngredients: RecipeIngredient[] = recipeIngredients.map((i, idx) => ({
      id: `ring-${Date.now()}-${idx}`,
      recipe_id: editingRecipeId || '',
      raw_material_id: i.raw_material_id,
      quantity_needed: Number(i.quantity_needed),
    }));

    if (editingRecipeId) {
      updateRecipe(editingRecipeId, {
        name: recipeName,
        category: recipeCategory,
        batch_output_quantity: Number(recipeBatchYield),
        curing_days: Number(recipeCuringDays),
        ingredients: formattedIngredients,
      });
    } else {
      addRecipe({
        name: recipeName,
        category: recipeCategory,
        batch_output_quantity: Number(recipeBatchYield),
        curing_days: Number(recipeCuringDays),
        ingredients: formattedIngredients,
      });
    }

    setIsRecipeModalOpen(false);
  };

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="glass-panel p-6 rounded-2xl flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-white">
        <div>
          <h1 className="text-2xl font-black tracking-tight text-slate-900 flex items-center gap-2">
            <BookOpenCheck className="w-7 h-7 text-amber-600" />
            Produits & Recettes
          </h1>
          <p className="text-sm text-slate-500 mt-1">
            Gérez vos recettes d'atelier d'un côté, et vos produits commercialisables avec packaging et marges de l'autre.
          </p>
        </div>

        <div className="flex gap-2">
          {activeTab === 'products' ? (
            <button
              onClick={handleOpenCreateProduct}
              className="bg-gradient-to-r from-amber-500 to-orange-600 hover:from-amber-400 hover:to-orange-500 text-white px-5 py-2.5 rounded-xl font-bold flex items-center gap-2 shadow-md shadow-amber-500/20 transition"
            >
              <Plus className="w-4 h-4" />
              Nouveau produit
            </button>
          ) : (
            <button
              onClick={handleOpenCreateRecipe}
              className="bg-indigo-600 hover:bg-indigo-500 text-white px-5 py-2.5 rounded-xl font-bold flex items-center gap-2 shadow-md shadow-indigo-600/20 transition"
            >
              <Plus className="w-4 h-4" />
              Nouvelle recette
            </button>
          )}
        </div>
      </div>

      {/* Sub-Navigation Tabs */}
      <div className="flex border-b border-slate-200 gap-2">
        <button
          onClick={() => setActiveTab('products')}
          className={`px-5 py-3 font-bold text-xs rounded-t-xl flex items-center gap-2 border-b-2 transition ${
            activeTab === 'products'
              ? 'border-amber-500 text-amber-950 bg-white shadow-sm'
              : 'border-transparent text-slate-500 hover:text-slate-900 hover:bg-slate-100'
          }`}
        >
          <ShoppingBag className="w-4 h-4 text-amber-600" />
          Fiches Produits Finis ({products.length})
        </button>

        <button
          onClick={() => setActiveTab('recipes')}
          className={`px-5 py-3 font-bold text-xs rounded-t-xl flex items-center gap-2 border-b-2 transition ${
            activeTab === 'recipes'
              ? 'border-indigo-600 text-indigo-950 bg-white shadow-sm'
              : 'border-transparent text-slate-500 hover:text-slate-900 hover:bg-slate-100'
          }`}
        >
          <FlaskConical className="w-4 h-4 text-indigo-600" />
          Recettes & Formules d'Atelier ({recipes.length})
        </button>
      </div>

      {/* TAB 1: PRODUCTS LIST */}
      {activeTab === 'products' && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {products.map((product) => {
            const linkedRecipe = recipesMap[product.recipe_id || ''] || product.recipe;
            const ingBatchCost = getRecipeIngredientsBatchCost(linkedRecipe, product.ingredients);
            const yieldQty = linkedRecipe?.batch_output_quantity || product.batch_output_quantity || 1;
            const ingUnitCost = ingBatchCost / yieldQty;
            const cogs = ingUnitCost + (product.packaging_cost || 0);
            const marginEUR = product.selling_price - cogs;
            const marginPct = product.selling_price > 0 ? (marginEUR / product.selling_price) * 100 : 0;

            return (
              <div
                key={product.id}
                onClick={() => handleOpenEditProduct(product)}
                className="glass-panel glass-panel-hover rounded-2xl p-5 border border-slate-200/80 bg-white flex flex-col justify-between cursor-pointer group shadow-sm"
              >
                <div>
                  <div className="flex items-start justify-between gap-3 mb-3">
                    <div className="flex items-center gap-3">
                      {product.image_url ? (
                        <img
                          src={product.image_url}
                          alt={product.name}
                          className="w-12 h-12 rounded-xl object-cover border border-slate-200 shrink-0 group-hover:scale-105 transition-transform"
                        />
                      ) : (
                        <div className="w-12 h-12 rounded-xl bg-slate-100 border border-slate-200 flex items-center justify-center shrink-0 text-slate-500">
                          <Package className="w-6 h-6" />
                        </div>
                      )}
                      <div>
                        <h3 className="font-bold text-slate-900 text-base leading-tight group-hover:text-amber-700 transition">
                          {product.name}
                        </h3>
                        <span className="text-[11px] px-2.5 py-0.5 rounded-full bg-slate-100 text-slate-700 font-semibold border border-slate-200 inline-block mt-1">
                          {product.category}
                        </span>
                      </div>
                    </div>

                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        deleteProduct(product.id);
                      }}
                      className="text-slate-400 hover:text-red-600 p-1 transition"
                      title="Supprimer"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>

                  {/* Linked Recipe Badge */}
                  {linkedRecipe && (
                    <div className="bg-indigo-50 border border-indigo-200 rounded-lg px-2.5 py-1 text-[11px] font-bold text-indigo-900 mb-3 flex items-center gap-1.5">
                      <FlaskConical className="w-3.5 h-3.5 text-indigo-600 shrink-0" />
                      <span className="truncate">Recette : {linkedRecipe.name}</span>
                    </div>
                  )}

                  {/* Key Cost & Margin Metrics */}
                  <div className="grid grid-cols-2 gap-2 my-3 p-3 bg-slate-50 rounded-xl border border-slate-200 text-xs">
                    <div>
                      <span className="text-slate-500 text-[11px] block font-medium">Coût Revient (COGS)</span>
                      <span className="text-amber-700 font-bold text-sm">
                        {formatCurrency(cogs)}
                      </span>
                    </div>
                    <div>
                      <span className="text-slate-500 text-[11px] block font-medium">Prix Vente TTC</span>
                      <span className="text-emerald-700 font-bold text-sm">
                        {formatCurrency(product.selling_price)}
                      </span>
                    </div>

                    <div className="pt-2 border-t border-slate-200 col-span-2">
                      <span className="text-slate-500 text-[11px] block font-medium">Marge Brute unitaire</span>
                      <span className="text-slate-900 font-bold">
                        +{formatCurrency(marginEUR)} ({marginPct.toFixed(0)}%)
                      </span>
                    </div>
                  </div>

                  <div className="flex items-center justify-between text-xs text-slate-600 pt-2 border-t border-slate-100">
                    <div className="flex items-center gap-1.5 font-medium">
                      <Clock className="w-3.5 h-3.5 text-amber-600" />
                      <span>Cure : {linkedRecipe?.curing_days || product.curing_days} j</span>
                    </div>
                    <div className="flex items-center gap-1.5 font-bold text-slate-800">
                      <Layers className="w-3.5 h-3.5 text-indigo-600" />
                      <span>Stock Fini : {product.stock_quantity} u</span>
                    </div>
                  </div>
                </div>

                <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500 font-medium">
                  <span>Pkg : {formatCurrency(product.packaging_cost)}</span>
                  <span className="text-amber-700 font-bold text-[11px] flex items-center gap-1 group-hover:translate-x-0.5 transition-transform">
                    <Eye className="w-3.5 h-3.5" /> Modifier <ChevronRight className="w-3.5 h-3.5" />
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* TAB 2: RECIPES LIST */}
      {activeTab === 'recipes' && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {recipes.map((recipe) => {
            const batchCost = getRecipeIngredientsBatchCost(recipe);
            const ingUnitCost = batchCost / (recipe.batch_output_quantity || 1);

            return (
              <div
                key={recipe.id}
                onClick={() => handleOpenEditRecipe(recipe)}
                className="glass-panel glass-panel-hover rounded-2xl p-5 border border-slate-200/80 bg-white flex flex-col justify-between cursor-pointer group shadow-sm"
              >
                <div>
                  <div className="flex items-start justify-between gap-3 mb-3">
                    <div className="flex items-center gap-3">
                      <div className="w-12 h-12 rounded-xl bg-indigo-50 border border-indigo-200 flex items-center justify-center shrink-0 text-indigo-600">
                        <FlaskConical className="w-6 h-6" />
                      </div>
                      <div>
                        <h3 className="font-bold text-slate-900 text-base leading-tight group-hover:text-indigo-700 transition">
                          {recipe.name}
                        </h3>
                        <span className="text-[11px] px-2.5 py-0.5 rounded-full bg-slate-100 text-slate-700 font-semibold border border-slate-200 inline-block mt-1">
                          {recipe.category}
                        </span>
                      </div>
                    </div>

                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        deleteRecipe(recipe.id);
                      }}
                      className="text-slate-400 hover:text-red-600 p-1 transition"
                      title="Supprimer la recette"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>

                  <div className="space-y-2 my-4 p-3 bg-slate-50 rounded-xl border border-slate-200 text-xs">
                    <div className="flex justify-between items-center">
                      <span className="text-slate-500 font-medium">Coût Ingrédients Fournée</span>
                      <span className="font-bold text-slate-800">{formatCurrency(batchCost)}</span>
                    </div>
                    <div className="flex justify-between items-center text-indigo-700 font-bold border-t border-slate-200 pt-1.5">
                      <span>Coût Ingrédients / Produit</span>
                      <span>{formatCurrency(ingUnitCost)} / u</span>
                    </div>
                  </div>

                  <div className="flex items-center justify-between text-xs text-slate-600 pt-2 border-t border-slate-100">
                    <span className="font-bold text-amber-800">Fournée de {recipe.batch_output_quantity} u</span>
                    <span className="font-medium">Cure : {recipe.curing_days} jours</span>
                  </div>
                </div>

                <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500 font-medium">
                  <span>{recipe.ingredients.length} ingrédient(s)</span>
                  <span className="text-indigo-700 font-bold text-[11px] flex items-center gap-1 group-hover:translate-x-0.5 transition-transform">
                    <Eye className="w-3.5 h-3.5" /> Éditer la formule <ChevronRight className="w-3.5 h-3.5" />
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* MODAL 1: PRODUIT FINI (Spoolio Style) */}
      {isProductModalOpen && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-4">
          <div className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm" onClick={() => setIsProductModalOpen(false)} />

          <div className="relative bg-white w-full sm:max-w-3xl sm:rounded-2xl rounded-t-2xl max-h-[92vh] overflow-hidden shadow-2xl flex flex-col z-10">
            <form onSubmit={handleSaveProduct} className="flex flex-col h-full overflow-y-auto">
              
              <div className="flex justify-between items-center px-6 py-4 border-b border-slate-100">
                <h3 className="text-base font-bold text-slate-900">
                  {editingProductId ? 'Fiche Produit Fini' : 'Nouveau produit fini'}
                </h3>
                <button
                  type="button"
                  onClick={() => setIsProductModalOpen(false)}
                  className="w-8 h-8 flex items-center justify-center rounded-full bg-slate-100 text-slate-500 hover:bg-slate-200 transition"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 p-6">
                {/* Left Column: Commercial & Recipe Picker */}
                <div className="space-y-4 text-xs">
                  <div>
                    <label className="text-[11px] font-bold text-slate-500 uppercase tracking-wide">
                      NOM DU PRODUIT *
                    </label>
                    <input
                      type="text"
                      required
                      className="w-full bg-slate-100 border-0 rounded-xl px-4 py-3 text-sm mt-1.5 focus:outline-none focus:ring-2 focus:ring-amber-500 font-semibold"
                      value={productName}
                      onChange={(e) => setProductName(e.target.value)}
                      placeholder="Ex: Savon au Lait d'Ânesse (100g)"
                    />
                  </div>

                  <div>
                    <label className="text-[11px] font-bold text-slate-500 uppercase tracking-wide">
                      CATÉGORIE
                    </label>
                    <input
                      type="text"
                      className="w-full bg-slate-100 border-0 rounded-xl px-4 py-3 text-sm mt-1.5 focus:outline-none focus:ring-2 focus:ring-amber-500"
                      value={productCategory}
                      onChange={(e) => setProductCategory(e.target.value)}
                      placeholder="Ex: Savons à Froid"
                    />
                  </div>

                  {/* Recipe Link Selector */}
                  <div>
                    <label className="text-[11px] font-bold text-indigo-900 uppercase tracking-wide flex items-center gap-1.5 mb-1.5">
                      <FlaskConical className="w-4 h-4 text-indigo-600" /> RECETTE D'ATELIER ASSOCIÉE *
                    </label>
                    <select
                      value={selectedRecipeId}
                      onChange={(e) => setSelectedRecipeId(e.target.value)}
                      className="w-full bg-indigo-50 border border-indigo-200 rounded-xl px-4 py-3 text-sm font-bold text-indigo-950 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    >
                      {recipes.map((r) => (
                        <option key={r.id} value={r.id}>
                          {r.name} ({r.batch_output_quantity} u/fournée)
                        </option>
                      ))}
                    </select>
                  </div>

                  {/* Packaging Cost */}
                  <div>
                    <label className="text-[11px] font-bold text-slate-500 uppercase tracking-wide">
                      CONDITIONNEMENT / PACKAGING / ÉTIQUETTE (€)
                    </label>
                    <input
                      type="number"
                      step="0.05"
                      className="w-full bg-slate-100 border-0 rounded-xl px-4 py-3 text-sm mt-1.5 focus:outline-none focus:ring-2 focus:ring-amber-500 font-bold"
                      value={packagingCost}
                      onChange={(e) => setPackagingCost(Number(e.target.value))}
                      placeholder="0.50"
                    />
                    <p className="text-[10px] text-slate-400 mt-1">
                      Le coût packaging (étiquette, flacon, boite) est répercuté en direct sur le produit.
                    </p>
                  </div>

                  {/* Options & Margins */}
                  <div className="grid grid-cols-2 gap-3 pt-2">
                    <label
                      className={`flex items-center gap-3 p-3 rounded-xl cursor-pointer transition-colors ${
                        isPainful ? 'bg-amber-50 ring-1 ring-amber-400' : 'bg-slate-100'
                      }`}
                    >
                      <input
                        type="checkbox"
                        checked={isPainful}
                        onChange={(e) => setIsPainful(e.target.checked)}
                        className="w-4 h-4 accent-amber-600 rounded"
                      />
                      <div>
                        <p className="text-xs font-semibold text-slate-800">Recette Pénible</p>
                        <p className="text-[10px] text-amber-600 font-bold">+10% marge</p>
                      </div>
                    </label>

                    <div>
                      <label className="text-[11px] font-bold text-slate-500 uppercase tracking-wide">
                        MARGE DE BASE (%)
                      </label>
                      <input
                        type="number"
                        min={0}
                        max={2000}
                        className="w-full bg-slate-100 border-0 rounded-xl px-4 py-3 text-sm mt-1.5 focus:outline-none focus:ring-2 focus:ring-amber-500 font-bold"
                        value={customMargin}
                        onChange={(e) => setCustomMargin(Number(e.target.value))}
                        placeholder="350"
                      />
                    </div>
                  </div>
                </div>

                {/* Right Column: Spoolio Cost & Price Panel */}
                <div className="flex flex-col justify-between gap-4">
                  <div className="bg-slate-100 rounded-2xl p-5 space-y-3">
                    <p className="text-xs font-bold text-slate-400 uppercase tracking-wide">
                      DÉTAIL DU COÛT DU PRODUIT
                    </p>

                    <div className="space-y-3 text-xs">
                      <div className="flex justify-between items-center">
                        <span className="text-slate-600 font-medium">Coût Ingrédients (Recette)</span>
                        <span className="font-bold text-slate-800">{formatCurrency(activeRecipeIngUnitCost)} / u</span>
                      </div>

                      <div className="flex justify-between items-center">
                        <span className="text-slate-600 font-medium">Coût packaging / étiquette</span>
                        <span className="font-bold text-slate-800">{formatCurrency(packagingCost)} / u</span>
                      </div>

                      <div className="border-t border-dashed border-slate-300 pt-2 flex justify-between items-center font-bold text-slate-900">
                        <span>Coût de revient total (COGS)</span>
                        <span className="text-amber-700 text-sm">{formatCurrency(totalProductCOGS)}</span>
                      </div>

                      {isPainful && (
                        <div className="border-t border-dashed border-slate-300 pt-2 flex justify-between items-center text-amber-700 font-bold">
                          <span>Majoration Pénibilité (+10%)</span>
                          <span>Inclus</span>
                        </div>
                      )}

                      <div className="border-t-2 border-slate-300 pt-3 space-y-1">
                        <span className="text-[10px] text-slate-400 uppercase font-bold tracking-wider block">
                          Prix de Vente Conseillé (Marge {totalMarginPercent}%)
                        </span>
                        <span className="text-xl font-black text-emerald-700 block">
                          {formatCurrency(recommendedProductPrice)}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Selling Price Input Field (Spoolio Style) */}
                  <div>
                    <label className="text-[11px] font-bold text-slate-500 uppercase tracking-wide">
                      PRIX DE VENTE (€)
                    </label>
                    <div className="relative mt-1.5">
                      <input
                        type="number"
                        step="0.10"
                        required
                        className="w-full bg-blue-50 border-2 border-blue-200 rounded-xl px-4 py-3 text-base font-black text-blue-900 focus:outline-none focus:ring-2 focus:ring-blue-500"
                        value={productSellingPrice}
                        onChange={(e) => {
                          setIsPriceOverridden(true);
                          setProductSellingPrice(Number(e.target.value));
                        }}
                        placeholder="Ex: 8.50"
                      />
                      {!isPriceOverridden && recommendedProductPrice > 0 && (
                        <span className="absolute right-3 top-3.5 text-[10px] bg-emerald-100 text-emerald-800 font-bold px-2 py-0.5 rounded-full">
                          Prix Conseillé
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              </div>

              <div className="flex justify-end gap-3 px-6 py-4 border-t border-slate-100 bg-slate-50 rounded-b-2xl">
                <button
                  type="button"
                  onClick={() => setIsProductModalOpen(false)}
                  className="px-6 py-2.5 rounded-full text-slate-600 font-bold hover:bg-slate-200 transition text-xs"
                >
                  Annuler
                </button>
                <button
                  type="submit"
                  className="bg-slate-900 hover:bg-slate-800 text-white px-8 py-2.5 rounded-full font-bold shadow-md text-xs flex items-center gap-2"
                >
                  <Sparkles className="w-4 h-4 text-amber-400" />
                  Enregistrer le produit
                </button>
              </div>

            </form>
          </div>
        </div>
      )}

      {/* MODAL 2: RECETTE D'ATELIER (Formule BOM) */}
      {isRecipeModalOpen && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-4">
          <div className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm" onClick={() => setIsRecipeModalOpen(false)} />

          <div className="relative bg-white w-full sm:max-w-2xl sm:rounded-2xl rounded-t-2xl max-h-[92vh] overflow-hidden shadow-2xl flex flex-col z-10">
            <form onSubmit={handleSaveRecipe} className="flex flex-col h-full overflow-y-auto">
              
              <div className="flex justify-between items-center px-6 py-4 border-b border-slate-100">
                <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
                  <FlaskConical className="w-5 h-5 text-indigo-600" />
                  {editingRecipeId ? 'Éditer la Recette d\'Atelier' : 'Nouvelle Recette / Formule BOM'}
                </h3>
                <button
                  type="button"
                  onClick={() => setIsRecipeModalOpen(false)}
                  className="w-8 h-8 flex items-center justify-center rounded-full bg-slate-100 text-slate-500 hover:bg-slate-200 transition"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              <div className="p-6 space-y-4 text-xs">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="text-[11px] font-bold text-slate-500 uppercase tracking-wide">
                      NOM DE LA RECETTE *
                    </label>
                    <input
                      type="text"
                      required
                      className="w-full bg-slate-100 border-0 rounded-xl px-4 py-3 text-sm mt-1.5 focus:outline-none focus:ring-2 focus:ring-indigo-500 font-semibold"
                      value={recipeName}
                      onChange={(e) => setRecipeName(e.target.value)}
                      placeholder="Ex: Formule Savon Douceur Lait d'Ânesse"
                    />
                  </div>

                  <div>
                    <label className="text-[11px] font-bold text-slate-500 uppercase tracking-wide">
                      CATÉGORIE
                    </label>
                    <input
                      type="text"
                      className="w-full bg-slate-100 border-0 rounded-xl px-4 py-3 text-sm mt-1.5 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                      value={recipeCategory}
                      onChange={(e) => setRecipeCategory(e.target.value)}
                      placeholder="Ex: Savon à Froid"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-[11px] font-bold text-slate-500 uppercase tracking-wide">
                      RENDEMENT FOURNÉE (PRODUITS OBTENUS) *
                    </label>
                    <input
                      type="number"
                      min="1"
                      required
                      className="w-full bg-slate-100 border-0 rounded-xl px-4 py-3 text-sm mt-1.5 focus:outline-none focus:ring-2 focus:ring-indigo-500 font-bold text-indigo-900"
                      value={recipeBatchYield}
                      onChange={(e) => setRecipeBatchYield(Number(e.target.value))}
                      placeholder="10"
                    />
                  </div>

                  <div>
                    <label className="text-[11px] font-bold text-slate-500 uppercase tracking-wide">
                      JOURS DE CURE / SÉCHAGE
                    </label>
                    <input
                      type="number"
                      min="0"
                      className="w-full bg-slate-100 border-0 rounded-xl px-4 py-3 text-sm mt-1.5 focus:outline-none focus:ring-2 focus:ring-indigo-500 font-bold"
                      value={recipeCuringDays}
                      onChange={(e) => setRecipeCuringDays(Number(e.target.value))}
                      placeholder="28"
                    />
                  </div>
                </div>

                {/* Recipe Ingredients Selection */}
                <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 space-y-3">
                  <div className="flex justify-between items-center">
                    <span className="font-bold text-indigo-900 uppercase tracking-wide text-[11px]">
                      INGRÉDIENTS & DOSAGES DE LA FOURNÉE
                    </span>
                    <button
                      type="button"
                      onClick={() => {
                        if (rawMaterials.length > 0) {
                          setRecipeIngredients([
                            ...recipeIngredients,
                            { raw_material_id: rawMaterials[0].id, quantity_needed: 10 },
                          ]);
                        }
                      }}
                      className="text-[11px] text-indigo-700 font-bold hover:underline flex items-center gap-0.5"
                    >
                      <Plus className="w-3.5 h-3.5" /> Ajouter un ingrédient
                    </button>
                  </div>

                  {recipeIngredients.map((ing, index) => {
                    const rm = rawMaterialsMap[ing.raw_material_id];
                    return (
                      <div key={index} className="flex items-center gap-2 bg-white p-2.5 rounded-lg border border-slate-200">
                        <select
                          value={ing.raw_material_id}
                          onChange={(e) => {
                            const updated = [...recipeIngredients];
                            updated[index].raw_material_id = e.target.value;
                            setRecipeIngredients(updated);
                          }}
                          className="w-full bg-transparent border-0 text-xs font-medium text-slate-800 focus:outline-none"
                        >
                          {rawMaterials.map((m) => (
                            <option key={m.id} value={m.id}>
                              {m.name} ({m.unit})
                            </option>
                          ))}
                        </select>

                        <input
                          type="number"
                          step="0.1"
                          placeholder="Qté"
                          value={ing.quantity_needed}
                          onChange={(e) => {
                            const updated = [...recipeIngredients];
                            updated[index].quantity_needed = Number(e.target.value);
                            setRecipeIngredients(updated);
                          }}
                          className="w-20 bg-slate-100 border-0 rounded-md px-2 py-1 text-xs text-right font-bold text-indigo-900"
                        />
                        <span className="text-xs text-slate-400 font-medium">{rm?.unit || 'g'}</span>

                        <button
                          type="button"
                          onClick={() => setRecipeIngredients(recipeIngredients.filter((_, idx) => idx !== index))}
                          className="text-slate-300 hover:text-red-600 p-1"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    );
                  })}
                </div>

                {/* Recipe Cost Summary */}
                <div className="bg-indigo-950 text-white p-4 rounded-xl flex justify-between items-center">
                  <div>
                    <span className="text-[10px] text-indigo-300 uppercase font-bold block">Coût Ingrédients Fournée</span>
                    <span className="text-amber-300 text-base font-bold">
                      {formatCurrency(getRecipeIngredientsBatchCost(null, recipeIngredients))}
                    </span>
                  </div>
                  <div className="text-right">
                    <span className="text-[10px] text-indigo-300 uppercase font-bold block">Coût Ingrédients / Produit</span>
                    <span className="text-emerald-400 text-base font-bold">
                      {formatCurrency(
                        recipeBatchYield > 0
                          ? getRecipeIngredientsBatchCost(null, recipeIngredients) / recipeBatchYield
                          : 0
                      )} / u
                    </span>
                  </div>
                </div>
              </div>

              <div className="flex justify-end gap-3 px-6 py-4 border-t border-slate-100 bg-slate-50 rounded-b-2xl">
                <button
                  type="button"
                  onClick={() => setIsRecipeModalOpen(false)}
                  className="px-6 py-2.5 rounded-full text-slate-600 font-bold hover:bg-slate-200 transition text-xs"
                >
                  Annuler
                </button>
                <button
                  type="submit"
                  className="bg-indigo-600 hover:bg-indigo-500 text-white px-8 py-2.5 rounded-full font-bold shadow-md text-xs flex items-center gap-2"
                >
                  <FlaskConical className="w-4 h-4 text-amber-300" />
                  Enregistrer la recette
                </button>
              </div>

            </form>
          </div>
        </div>
      )}
    </div>
  );
}

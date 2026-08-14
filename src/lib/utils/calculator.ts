import { Product, ProductIngredient, RawMaterial } from '../types/craft';

/**
 * Formats monetary amounts (default EUR €)
 */
export function formatCurrency(amount: number | undefined | null, currency: string = 'EUR'): string {
  const symbol = currency === 'USD' ? '$' : currency === 'CHF' ? 'CHF' : '€';
  const val = typeof amount === 'number' && !isNaN(amount) ? amount : 0;
  const formatted = val.toFixed(2).replace('.', ',');
  return `${formatted} ${symbol}`;
}

export function formatCostPerUnit(cost: number, unit: string, currency: string = 'EUR'): string {
  const symbol = currency === 'USD' ? '$' : currency === 'CHF' ? 'CHF' : '€';

  if (!cost || cost === 0) return `0,00 ${symbol} / ${unit}`;

  let formattedNumber: string;
  if (cost >= 1) {
    formattedNumber = cost.toFixed(2).replace('.', ',');
  } else if (cost >= 0.01) {
    formattedNumber = cost.toFixed(3).replace('.', ',');
  } else {
    formattedNumber = cost.toFixed(4).replace('.', ',');
  }

  // Equivalences pour sous-unités (l -> ml, kg -> g)
  let subEquivalence = '';
  if (unit === 'l' && cost > 0) {
    const costPerMl = cost / 1000;
    const formattedMl = costPerMl < 0.01 ? costPerMl.toFixed(4).replace('.', ',') : costPerMl.toFixed(3).replace('.', ',');
    subEquivalence = ` (soit ${formattedMl} ${symbol}/ml)`;
  } else if (unit === 'kg' && cost > 0) {
    const costPerG = cost / 1000;
    const formattedG = costPerG < 0.01 ? costPerG.toFixed(4).replace('.', ',') : costPerG.toFixed(3).replace('.', ',');
    subEquivalence = ` (soit ${formattedG} ${symbol}/g)`;
  }

  return `${formattedNumber} ${symbol} / ${unit}${subEquivalence}`;
}

/**
 * Calculates cost per unit from purchase price and quantity
 */
export function calculateCostPerUnit(purchasePrice: number, purchaseQuantity: number): number {
  if (!purchaseQuantity || purchaseQuantity <= 0) return 0;
  return purchasePrice / purchaseQuantity;
}

/**
 * Calculates single ingredient cost in recipe
 */
export function calculateIngredientCost(ingredient: ProductIngredient, rawMaterial?: RawMaterial): number {
  if (!rawMaterial) return 0;
  const costPerUnit = calculateCostPerUnit(rawMaterial.purchase_price, rawMaterial.purchase_quantity);
  return ingredient.quantity_needed * costPerUnit;
}

/**
 * Calculates total COGS (Cost of Goods Sold / Coût de revient unitaire) for a product
 */
export function calculateProductCOGS(
  product: Product,
  rawMaterialsMap: Record<string, RawMaterial>
): {
  ingredientsBatchCost: number;
  ingredientsCostPerUnit: number;
  packagingCost: number;
  extraCosts: number;
  totalCOGS: number;
  batchYield: number;
} {
  let ingredientsBatchCost = 0;

  if (product.ingredients) {
    for (const ing of product.ingredients) {
      const rm = rawMaterialsMap[ing.raw_material_id] || ing.raw_material;
      if (rm) {
        ingredientsBatchCost += calculateIngredientCost(ing, rm);
      }
    }
  }

  const batchYield = product.batch_output_quantity && product.batch_output_quantity > 0 ? product.batch_output_quantity : 1;
  const ingredientsCostPerUnit = ingredientsBatchCost / batchYield;

  const packagingCost = product.packaging_cost || 0;
  const extraCosts = product.extra_costs || 0;
  const totalCOGS = ingredientsCostPerUnit + packagingCost + extraCosts;

  return {
    ingredientsBatchCost,
    ingredientsCostPerUnit,
    packagingCost,
    extraCosts,
    totalCOGS,
    batchYield,
  };
}

/**
 * Calculates Gross Margin € and %, Markup Multiplier
 */
export function calculateMarginMetrics(sellingPriceTTC: number, totalCOGS: number) {
  const sellingPriceHT = sellingPriceTTC / 1.2; // Estimation TVA 20% si applicable
  const grossMarginEUR = sellingPriceTTC - totalCOGS;
  const grossMarginPercent = sellingPriceTTC > 0 ? (grossMarginEUR / sellingPriceTTC) * 100 : 0;
  const multiplier = totalCOGS > 0 ? sellingPriceTTC / totalCOGS : 0;

  return {
    sellingPriceHT,
    grossMarginEUR,
    grossMarginPercent,
    multiplier,
  };
}

/**
 * Calculates Ideal Recommended Selling Price TTC based on target margin % (e.g. 70%)
 */
export function calculateIdealPriceFromMargin(totalCOGS: number, targetMarginPercent: number): number {
  if (totalCOGS <= 0) return 0;
  if (targetMarginPercent >= 100) return totalCOGS * 3;
  return totalCOGS / (1 - Math.min(99, Math.max(0, targetMarginPercent)) / 100);
}

/**
 * Calculates Ideal Recommended Selling Price TTC based on target multiplier (e.g. x3.5)
 */
export function calculateIdealPriceFromMultiplier(totalCOGS: number, targetMultiplier: number): number {
  if (totalCOGS <= 0) return 0;
  return totalCOGS * Math.max(1, targetMultiplier);
}

/**
 * Calculates curing end date and days left
 */
export function calculateCuringStatus(productionDateStr: string, curingDays: number): {
  curingEndDateStr: string;
  daysLeft: number;
  progressPercent: number;
  isReady: boolean;
} {
  const prodDate = new Date(productionDateStr);
  const endDate = new Date(prodDate);
  endDate.setDate(prodDate.getDate() + curingDays);

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const totalTimeMs = endDate.getTime() - prodDate.getTime();
  const elapsedTimeMs = today.getTime() - prodDate.getTime();
  
  const diffDays = Math.ceil((endDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
  const daysLeft = Math.max(0, diffDays);

  const progressPercent = totalTimeMs > 0 ? Math.min(100, Math.max(0, (elapsedTimeMs / totalTimeMs) * 100)) : 100;
  const isReady = daysLeft === 0;

  return {
    curingEndDateStr: endDate.toISOString().split('T')[0],
    daysLeft,
    progressPercent: Math.round(progressPercent),
    isReady,
  };
}

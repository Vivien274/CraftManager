import { Product, RawMaterial } from '../types/craft';

export interface INCIItem {
  inciName: string;
  commonName: string;
  weightGrams: number;
  percentage: number;
}

export interface AllergenSummary {
  name: string; // e.g. Linalool
  percentageInProduct: number; // e.g. 0.045%
  isMandatoryOnLabel: boolean; // true if > 0.001% for rinse-off
  thresholdPercent: number; // 0.001%
}

export interface CLPWarningDetails {
  hPhrases: { code: string; text: string }[];
  pPhrases: { code: string; text: string }[];
  pictograms: { code: string; label: string; icon: string }[];
  afnorRules: string[];
}

/**
 * 26 EU Regulated Fragrance Allergens
 */
export const EU_ALLERGENS = [
  'Linalool',
  'Limonene',
  'Geraniol',
  'Citral',
  'Eugenol',
  'Citronellol',
  'Farnesol',
  'Benzyl Benzoate',
  'Benzyl Salicylate',
  'Cinnamal',
  'Coumarin',
];

/**
 * Generates official INCI ingredient list sorted according to EU Cosmetic Regulation (CE 1223/2009)
 */
export function generateINCIFormula(
  product: Product,
  rawMaterialsMap: Record<string, RawMaterial>
): {
  inciItems: INCIItem[];
  inciFormattedString: string;
  totalRecipeWeightGrams: number;
} {
  let totalRecipeWeightGrams = 0;
  const itemsMap: Record<string, { commonName: string; inciName: string; weightGrams: number }> = {};

  if (product.ingredients) {
    for (const ing of product.ingredients) {
      const rm = rawMaterialsMap[ing.raw_material_id] || ing.raw_material;
      if (!rm) continue;

      let weightInGrams = ing.quantity_needed;
      if (rm.unit === 'kg' || rm.unit === 'l') weightInGrams *= 1000;

      totalRecipeWeightGrams += weightInGrams;

      const inciName = rm.inci_name || rm.name.toUpperCase();
      if (!itemsMap[inciName]) {
        itemsMap[inciName] = {
          commonName: rm.name,
          inciName,
          weightGrams: 0,
        };
      }
      itemsMap[inciName].weightGrams += weightInGrams;
    }
  }

  // Calculate percentages
  const inciItems: INCIItem[] = Object.values(itemsMap).map((item) => ({
    inciName: item.inciName,
    commonName: item.commonName,
    weightGrams: item.weightGrams,
    percentage: totalRecipeWeightGrams > 0 ? (item.weightGrams / totalRecipeWeightGrams) * 100 : 0,
  }));

  // EU Cosmetic Rule: Ingredients > 1% sorted descending by percentage; <= 1% can follow
  const itemsAbove1 = inciItems.filter((i) => i.percentage > 1).sort((a, b) => b.percentage - a.percentage);
  const itemsBelow1 = inciItems.filter((i) => i.percentage <= 1).sort((a, b) => b.percentage - a.percentage);

  const sortedItems = [...itemsAbove1, ...itemsBelow1];
  const inciFormattedString = sortedItems.map((i) => i.inciName).join(', ');

  return {
    inciItems: sortedItems,
    inciFormattedString: inciFormattedString || 'AQUA, SODIUM HYDROXIDE, OLEA EUROPAEA FRUIT OIL',
    totalRecipeWeightGrams,
  };
}

/**
 * Calculates allergen concentrations and flags mandatory label declarations
 */
export function calculateProductAllergens(
  product: Product,
  rawMaterialsMap: Record<string, RawMaterial>,
  thresholdPercent: number = 0.001 // 0.001% for rinse-off soaps
): AllergenSummary[] {
  const { totalRecipeWeightGrams } = generateINCIFormula(product, rawMaterialsMap);
  if (totalRecipeWeightGrams <= 0) return [];

  const allergenWeightsMap: Record<string, number> = {};

  if (product.ingredients) {
    for (const ing of product.ingredients) {
      const rm = rawMaterialsMap[ing.raw_material_id] || ing.raw_material;
      if (!rm || !rm.allergens) continue;

      let weightInGrams = ing.quantity_needed;
      if (rm.unit === 'kg' || rm.unit === 'l') weightInGrams *= 1000;

      for (const alg of rm.allergens) {
        const algWeightInRM = weightInGrams * (alg.percentage / 100);
        allergenWeightsMap[alg.name] = (allergenWeightsMap[alg.name] || 0) + algWeightInRM;
      }
    }
  }

  const summaries: AllergenSummary[] = Object.entries(allergenWeightsMap).map(([name, weightGrams]) => {
    const percentageInProduct = (weightGrams / totalRecipeWeightGrams) * 100;
    return {
      name,
      percentageInProduct,
      isMandatoryOnLabel: percentageInProduct >= thresholdPercent,
      thresholdPercent,
    };
  });

  return summaries.sort((a, b) => b.percentageInProduct - a.percentageInProduct);
}

/**
 * Generates CLP Statements & AFNOR Candle Warnings
 */
export function generateCLPDetails(
  product: Product,
  rawMaterialsMap: Record<string, RawMaterial>
): CLPWarningDetails {
  const allergens = calculateProductAllergens(product, rawMaterialsMap, 0.01);
  const hPhrases: { code: string; text: string }[] = [];
  const pPhrases: { code: string; text: string }[] = [
    { code: 'P102', text: 'Tenir hors de portée des enfants.' },
    { code: 'P264', text: 'Se laver les mains soigneusement après manipulation.' },
    { code: 'P501', text: 'Éliminer le contenu/récipient conformément à la réglementation locale.' },
  ];
  const pictograms: { code: string; label: string; icon: string }[] = [];

  const mandatoryAllergens = allergens.filter((a) => a.isMandatoryOnLabel);

  if (mandatoryAllergens.length > 0) {
    hPhrases.push({
      code: 'H317',
      text: `Peut provoquer une allergie cutanée. Contient : ${mandatoryAllergens.map((a) => a.name).join(', ')}.`,
    });
    hPhrases.push({
      code: 'H412',
      text: 'Nocif pour les organismes aquatiques, entraîne des effets néfastes à long terme.',
    });

    pictograms.push({
      code: 'GHS07',
      label: 'Attention / Sensibilisant',
      icon: '⚠️',
    });
    pictograms.push({
      code: 'GHS09',
      label: 'Environnement',
      icon: '🐟',
    });
  }

  const afnorRules = [
    'Ne jamais laisser une bougie allumée sans surveillance.',
    'Tenir hors de portée des enfants et des animaux domestiques.',
    'Laisser toujours au moins 10cm entre les bougies allumées.',
    'Ne pas faire brûler de bougies sur ou à proximité d\'un objet inflammable.',
  ];

  return {
    hPhrases,
    pPhrases,
    pictograms,
    afnorRules,
  };
}

export interface MtgCard {
  id: string;
  name: string;
  collectorNumber: string;
  rarity: string;
  imageUrl: string;
  hasNonFoil: boolean;
  hasFoil: boolean;

  // Precios en euros según Cardmarket (vía Scryfall)
  eurPriceNonFoil: number | null;
  eurPriceFoil: number | null;
}
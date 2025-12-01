/**
 * Representa una carta de Magic: The Gathering del set Final Fantasy.
 * Modelo simplificado con la información esencial para la aplicación.
 */
export interface MtgCard {
  /** ID único de la carta en Scryfall */
  id: string;
  
  /** Nombre de la carta */
  name: string;
  
  /** Número de coleccionista (ej: "001", "042") */
  collectorNumber: string;
  
  /** Rareza: common, uncommon, rare, mythic */
  rarity: string;
  
  /** URL de la imagen de la carta */
  imageUrl: string;
  
  /** Indica si existe una versión no-foil de la carta */
  hasNonFoil: boolean;
  
  /** Indica si existe una versión foil de la carta */
  hasFoil: boolean;

  /** Precio en euros de la versión normal (Cardmarket vía Scryfall) */
  eurPriceNonFoil: number | null;
  
  /** Precio en euros de la versión foil (Cardmarket vía Scryfall) */
  eurPriceFoil: number | null;
}
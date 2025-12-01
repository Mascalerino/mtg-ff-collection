/**
 * Respuesta paginada de la API de Scryfall.
 * Contiene una lista de cartas y metadata de paginación.
 */
export interface ScryfallList<T = ScryfallCard> {
  /** Tipo de objeto (siempre "list") */
  object: string;
  
  /** Número total de cartas en la búsqueda */
  total_cards: number;
  
  /** Indica si hay más páginas de resultados */
  has_more: boolean;
  
  /** URL de la siguiente página (si existe) */
  next_page?: string;
  
  /** Array de cartas en la página actual */
  data: T[];
}

/**
 * Representación de una carta según la API de Scryfall.
 * Solo incluye los campos que necesitamos para nuestra aplicación.
 */
export interface ScryfallCard {
  /** ID único de la carta en Scryfall */
  id: string;
  
  /** Nombre de la carta */
  name: string;
  
  /** Código del set (ej: "fin" para Final Fantasy) */
  set: string;
  
  /** Número de coleccionista */
  collector_number: string;
  
  /** Rareza de la carta */
  rarity: string;
  
  /** Indica si está disponible en foil */
  foil: boolean;
  
  /** Indica si está disponible en no-foil */
  nonfoil: boolean;
  
  /** URLs de imágenes de la carta (si es de una sola cara) */
  image_uris?: {
    small?: string;
    normal?: string;
    large?: string;
  };
  
  /** Caras de la carta (para cartas de doble cara) */
  card_faces?: Array<{
    name: string;
    image_uris?: {
      small?: string;
      normal?: string;
      large?: string;
    };
  }>;
  
  /** Precios de la carta en diferentes monedas y versiones */
  prices?: {
    /** Precio en euros (versión normal) */
    eur?: string | null;
    /** Precio en euros (versión foil) */
    eur_foil?: string | null;
  };
}
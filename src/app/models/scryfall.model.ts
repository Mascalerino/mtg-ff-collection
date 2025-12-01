export interface ScryfallList<T = ScryfallCard> {
  object: string;
  total_cards: number;
  has_more: boolean;
  next_page?: string;
  data: T[];
}

export interface ScryfallCard {
  id: string;
  name: string;
  set: string;
  collector_number: string;
  rarity: string;
  foil: boolean;
  nonfoil: boolean;
  image_uris?: {
    small?: string;
    normal?: string;
    large?: string;
  };
  card_faces?: Array<{
    name: string;
    image_uris?: {
      small?: string;
      normal?: string;
      large?: string;
    };
  }>;
  prices?: {
    eur?: string | null;
    eur_foil?: string | null;
    // (Existen más campos como usd, usd_foil... pero no los necesitamos ahora)
  };
}
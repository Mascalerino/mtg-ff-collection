import { MtgCard } from '../models/mtg-card.model';

/**
 * Helper para generar URLs relacionadas con cartas de MTG.
 */
export class UrlHelper {
  /**
   * Genera la URL de búsqueda de Cardmarket para una carta específica.
   * @param card - La carta para la cual generar la URL
   * @returns URL de búsqueda en Cardmarket
   */
  static getCardmarketUrl(card: MtgCard): string {
    const query = encodeURIComponent(card.name);
    return `https://www.cardmarket.com/en/Magic/Products/Search?searchString=${query}`;
  }
}

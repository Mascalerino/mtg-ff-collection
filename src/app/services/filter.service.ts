import { Injectable } from '@angular/core';
import { MtgCard } from '../models/mtg-card.model';

/**
 * Tipos de filtros disponibles para la colección de cartas.
 */
export type RarityFilter = 'all' | 'common' | 'uncommon' | 'rare' | 'mythic';
export type OwnershipFilter = 'all' | 'owned' | 'missing' | 'foilOwned' | 'wanted';
export type PrintFilter = 'all' | 'hasFoil' | 'hasNonFoil';

/**
 * Interfaz para los criterios de filtrado.
 */
export interface FilterCriteria {
  searchTerm: string;
  rarity: RarityFilter;
  ownership: OwnershipFilter;
  print: PrintFilter;
}

/**
 * Servicio para aplicar filtros a la colección de cartas.
 * Centraliza toda la lógica de filtrado en un solo lugar.
 */
@Injectable({
  providedIn: 'root',
})
export class FilterService {
  /**
   * Filtra una lista de cartas según los criterios especificados.
   * @param cards - Lista de cartas a filtrar
   * @param criteria - Criterios de filtrado
   * @param getOwnershipInfo - Función para obtener información de propiedad de una carta
   * @returns Lista de cartas filtradas
   */
  filterCards(
    cards: MtgCard[],
    criteria: FilterCriteria,
    getOwnershipInfo: (cardId: string) => {
      isOwned: boolean;
      isFoilOwned: boolean;
      isWanted: boolean;
    }
  ): MtgCard[] {
    let filtered = cards;

    // Filtrar por término de búsqueda
    filtered = this.filterBySearchTerm(filtered, criteria.searchTerm);

    // Filtrar por rareza
    filtered = this.filterByRarity(filtered, criteria.rarity);

    // Filtrar por propiedad
    filtered = this.filterByOwnership(filtered, criteria.ownership, getOwnershipInfo);

    // Filtrar por tipo de impresión (foil/nonfoil)
    filtered = this.filterByPrint(filtered, criteria.print);

    return filtered;
  }

  /**
   * Filtra cartas por término de búsqueda en el nombre.
   * @param cards - Lista de cartas
   * @param searchTerm - Término de búsqueda
   * @returns Cartas que coinciden con el término
   */
  private filterBySearchTerm(cards: MtgCard[], searchTerm: string): MtgCard[] {
    const term = searchTerm.trim().toLowerCase();
    if (!term) return cards;
    
    return cards.filter((card) => card.name.toLowerCase().includes(term));
  }

  /**
   * Filtra cartas por rareza.
   * @param cards - Lista de cartas
   * @param rarity - Filtro de rareza
   * @returns Cartas que coinciden con la rareza
   */
  private filterByRarity(cards: MtgCard[], rarity: RarityFilter): MtgCard[] {
    if (rarity === 'all') return cards;
    
    return cards.filter((card) => card.rarity === rarity);
  }

  /**
   * Filtra cartas por estado de propiedad.
   * @param cards - Lista de cartas
   * @param ownership - Filtro de propiedad
   * @param getOwnershipInfo - Función para obtener información de propiedad
   * @returns Cartas que coinciden con el criterio de propiedad
   */
  private filterByOwnership(
    cards: MtgCard[],
    ownership: OwnershipFilter,
    getOwnershipInfo: (cardId: string) => {
      isOwned: boolean;
      isFoilOwned: boolean;
      isWanted: boolean;
    }
  ): MtgCard[] {
    if (ownership === 'all') return cards;

    return cards.filter((card) => {
      const info = getOwnershipInfo(card.id);
      
      switch (ownership) {
        case 'owned':
          return info.isOwned;
        case 'missing':
          return !info.isOwned;
        case 'foilOwned':
          return info.isFoilOwned;
        case 'wanted':
          return info.isWanted;
        default:
          return true;
      }
    });
  }

  /**
   * Filtra cartas por disponibilidad de impresión (foil/nonfoil).
   * @param cards - Lista de cartas
   * @param print - Filtro de tipo de impresión
   * @returns Cartas que coinciden con el tipo de impresión
   */
  private filterByPrint(cards: MtgCard[], print: PrintFilter): MtgCard[] {
    if (print === 'all') return cards;

    if (print === 'hasFoil') {
      return cards.filter((card) => card.hasFoil);
    }
    
    if (print === 'hasNonFoil') {
      return cards.filter((card) => card.hasNonFoil);
    }

    return cards;
  }
}

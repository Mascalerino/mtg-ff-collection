import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MtgCard } from './models/mtg-card.model';
import { ScryfallService } from './services/scryfall.service';
import { CollectionService } from './services/collection.service';
import { TranslationService } from './services/translation.service';
import { FilterService, FilterCriteria, RarityFilter, OwnershipFilter } from './services/filter.service';
import { UrlHelper } from './helpers/url.helper';
import { FileHelper } from './helpers/file.helper';

/**
 * Tipos de ordenamiento disponibles.
 */
export type SortBy = 
  | 'collectorNumber' 
  | 'collectorNumberDesc' 
  | 'nameAsc' 
  | 'nameDesc' 
  | 'priceAsc' 
  | 'priceDesc';

/**
 * Componente principal de la aplicación MTG Final Fantasy Collection.
 * Gestiona la visualización y filtrado de cartas, así como la colección del usuario.
 */
@Component({
  selector: 'app-root',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.scss'],
})
export class AppComponent implements OnInit {
  /** Idioma actual de la interfaz */
  language: 'es' | 'en' = 'es';

  /** Tipo de set seleccionado: 'unique' o 'complete' */
  setType: 'unique' | 'complete' = 'unique';

  /** Lista completa de cartas del set */
  cards: MtgCard[] = [];
  
  /** Indica si se están cargando las cartas */
  loading = false;

  /** Clave de error de traducción para errores de carga */
  errorKey: string | null = null;
  
  /** Clave de error de traducción para errores de importación */
  importErrorKey: string | null = null;

  /** Término de búsqueda para filtrar por nombre */
  searchTerm = '';
  
  /** Filtro de rareza seleccionado */
  filterRarity: RarityFilter = 'all';
  
  /** Filtro de propiedad seleccionado */
  filterOwnership: OwnershipFilter = 'all';
  
  /** Criterio de ordenamiento seleccionado */
  sortBy: SortBy = 'collectorNumber';

  constructor(
    private scryfallService: ScryfallService,
    private collectionService: CollectionService,
    private translationService: TranslationService,
    private filterService: FilterService
  ) {}

  /**
   * Inicializa el componente.
   * Carga el idioma guardado y las cartas del set.
   */
  ngOnInit(): void {
    this.initializeLanguage();
    this.initializeSetType();
    this.loadCards();
  }

  // ==================== INITIALIZATION ====================

  /**
   * Inicializa el idioma de la aplicación.
   * Carga el idioma guardado en localStorage o usa el predeterminado.
   */
  private initializeLanguage(): void {
    this.translationService.getCurrentLanguage().subscribe((lang) => {
      this.language = lang;
    });
  }

  /**
   * Inicializa el tipo de set.
   * Carga el tipo guardado en localStorage o usa el predeterminado.
   */
  private initializeSetType(): void {
    const savedSetType = localStorage.getItem('mtg-setType') as 'unique' | 'complete' | null;
    if (savedSetType) {
      this.setType = savedSetType;
    }
  }

  // ==================== I18N ====================

  /**
   * Cambia el idioma de la interfaz.
   * @param lang - Nuevo idioma a establecer
   */
  changeLanguage(lang: 'es' | 'en'): void {
    this.translationService.loadLanguage(lang);
  }

  /**
   * Cambia el tipo de set y recarga las cartas.
   * @param type - Tipo de set ('unique' o 'complete')
   */
  onSetTypeChange(type: 'unique' | 'complete'): void {
    this.setType = type;
    localStorage.setItem('mtg-setType', type);
    this.loadCards();
  }

  /**
   * Traduce una clave al idioma actual.
   * @param key - Clave de traducción
   * @returns Texto traducido
   */
  t(key: string): string {
    return this.translationService.translate(key);
  }

  // ==================== CARD LOADING ====================

  /**
   * Carga todas las cartas del set Final Fantasy desde Scryfall.
   * Las ordena por número de coleccionista.
   */
  private loadCards(): void {
    this.loading = true;
    this.errorKey = null;

    const url = this.setType === 'unique'
      ? 'https://api.scryfall.com/cards/search?q=set:fin+lang:en'
      : 'https://api.scryfall.com/cards/search?q=set:fin&unique=prints';

    this.scryfallService.getFinalFantasyCards(url).subscribe({
      next: (cards) => {
        this.cards = this.sortCardsByCollectorNumber(cards);
        this.loading = false;
      },
      error: () => {
        this.loading = false;
        this.errorKey = 'loadingError';
      },
    });
  }

  /**
   * Ordena las cartas por número de coleccionista de forma numérica.
   * @param cards - Array de cartas a ordenar
   * @returns Array de cartas ordenado
   */
  private sortCardsByCollectorNumber(cards: MtgCard[]): MtgCard[] {
    return cards.sort((a, b) =>
      a.collectorNumber.localeCompare(b.collectorNumber, 'en', {
        numeric: true,
      })
    );
  }

  // ==================== COLLECTION MANAGEMENT ====================

  /**
   * Obtiene la cantidad de copias normales de una carta.
   * @param cardId - ID de la carta
   * @returns Cantidad de copias normales
   */
  getNormalQty(cardId: string): number {
    return this.collectionService.getNormalQty(cardId);
  }

  /**
   * Obtiene la cantidad de copias foil de una carta.
   * @param cardId - ID de la carta
   * @returns Cantidad de copias foil
   */
  getFoilQty(cardId: string): number {
    return this.collectionService.getFoilQty(cardId);
  }

  /**
   * Actualiza la cantidad de copias normales de una carta.
   * @param cardId - ID de la carta
   * @param value - Nueva cantidad
   */
  onNormalQtyChange(cardId: string, value: any): void {
    this.collectionService.setCardQuantities(
      cardId,
      Number(value) || 0,
      this.getFoilQty(cardId)
    );
  }

  /**
   * Actualiza la cantidad de copias foil de una carta.
   * @param cardId - ID de la carta
   * @param value - Nueva cantidad
   */
  onFoilQtyChange(cardId: string, value: any): void {
    this.collectionService.setCardQuantities(
      cardId,
      this.getNormalQty(cardId),
      Number(value) || 0
    );
  }

  /**
   * Verifica si una carta está en la wishlist.
   * @param cardId - ID de la carta
   * @returns true si está en la wishlist
   */
  isWanted(cardId: string): boolean {
    return this.collectionService.isWanted(cardId);
  }

  /**
   * Alterna el estado de wishlist de una carta.
   * @param cardId - ID de la carta
   */
  toggleWanted(cardId: string): void {
    this.collectionService.toggleWanted(cardId);
  }

  // ==================== CARDMARKET ====================

  /**
   * Genera la URL de Cardmarket para una carta específica.
   * @param card - Carta para la cual generar la URL
   * @returns URL de búsqueda en Cardmarket
   */
  getCardmarketUrl(card: MtgCard): string {
    return UrlHelper.getCardmarketUrl(card);
  }

  // ==================== STATISTICS ====================

  /**
   * Obtiene el número total de cartas en el set.
   * @returns Total de cartas
   */
  get totalCards(): number {
    return this.cards.length;
  }

  /**
   * Obtiene el número de cartas diferentes que el usuario posee.
   * @returns Número de cartas poseídas
   */
  get ownedCards(): number {
    return this.cards.filter((card) => this.isCardOwned(card)).length;
  }

  /**
   * Obtiene el número de cartas únicas (sin repetir) que el usuario posee.
   * @returns Número de cartas únicas
   */
  get uniqueOwnedCards(): number {
    return this.cards.filter((card) => this.isCardOwned(card)).length;
  }

  /**
   * Calcula el número total de cartas repetidas.
   * Las repetidas son todas las copias extras después de la primera de cada carta.
   * @returns Número de cartas repetidas
   */
  get repeatedCards(): number {
    let repeated = 0;
    this.cards.forEach((card) => {
      const normalQty = this.getNormalQty(card.id);
      const foilQty = this.getFoilQty(card.id);
      const totalCopies = normalQty + foilQty;
      
      if (totalCopies > 1) {
        repeated += (totalCopies - 1);
      }
    });
    return repeated;
  }

  // ==================== RARITY STATISTICS ====================

  /**
   * Obtiene el número total de cartas que existen de una rareza específica.
   * @param rarity - Rareza a consultar
   * @returns Número total de cartas de esa rareza en el set
   */
  getRarityTotalCards(rarity: string): number {
    return this.cards.filter((card) => card.rarity === rarity).length;
  }

  /**
   * Obtiene el número de cartas únicas (sin repetir) que el usuario posee de una rareza específica.
   * @param rarity - Rareza a consultar
   * @returns Número de cartas únicas de esa rareza
   */
  getRarityOwnedCards(rarity: string): number {
    return this.cards
      .filter((card) => card.rarity === rarity)
      .filter((card) => this.isCardOwned(card))
      .length;
  }

  /**
   * Obtiene el número de cartas repetidas de una rareza específica.
   * @param rarity - Rareza a consultar
   * @returns Número de cartas repetidas
   */
  getRarityRepeatedCards(rarity: string): number {
    let repeated = 0;
    this.cards
      .filter((card) => card.rarity === rarity)
      .forEach((card) => {
        const totalCopies = this.getNormalQty(card.id) + this.getFoilQty(card.id);
        if (totalCopies > 1) {
          repeated += (totalCopies - 1);
        }
      });
    return repeated;
  }

  /**
   * Calcula el valor estimado de la colección de una rareza específica.
   * @param rarity - Rareza a consultar
   * @returns Valor en euros
   */
  getRarityValue(rarity: string): number {
    return this.cards
      .filter((card) => card.rarity === rarity)
      .reduce((sum, card) => {
        const normalValue = this.getNormalQty(card.id) * (card.eurPriceNonFoil ?? 0);
        const foilValue = this.getFoilQty(card.id) * (card.eurPriceFoil ?? 0);
        return sum + normalValue + foilValue;
      }, 0);
  }

  /**
   * Calcula el porcentaje de completitud de la colección.
   * @returns Porcentaje de 0 a 100
   */
  get completionPercentage(): number {
    return this.totalCards === 0 ? 0 : (this.ownedCards / this.totalCards) * 100;
  }

  /**
   * Calcula el valor estimado de la colección en euros.
   * Suma el valor de todas las copias poseídas según precios de Cardmarket.
   * @returns Valor total en euros
   */
  get collectionValueEur(): number {
    return this.cards.reduce((sum, card) => {
      const normalValue = this.getNormalQty(card.id) * (card.eurPriceNonFoil ?? 0);
      const foilValue = this.getFoilQty(card.id) * (card.eurPriceFoil ?? 0);
      return sum + normalValue + foilValue;
    }, 0);
  }

  /**
   * Verifica si el usuario posee al menos una copia de una carta.
   * @param card - Carta a verificar
   * @returns true si posee al menos una copia
   */
  private isCardOwned(card: MtgCard): boolean {
    return this.getNormalQty(card.id) > 0 || this.getFoilQty(card.id) > 0;
  }

  /**
   * Verifica si el usuario posee al menos una copia foil de una carta.
   * @param card - Carta a verificar
   * @returns true si posee al menos una copia foil
   */
  private isCardFoilOwned(card: MtgCard): boolean {
    return this.getFoilQty(card.id) > 0;
  }

  // ==================== FILTERED STATISTICS ====================

  /**
   * Verifica si hay filtros activos (distintos de "all").
   * @returns true si hay algún filtro activo
   */
  get hasActiveFilters(): boolean {
    return (
      this.searchTerm.trim() !== '' ||
      this.filterRarity !== 'all' ||
      this.filterOwnership !== 'all'
    );
  }

  /**
   * Verifica si el filtro de propiedad actual es uno que requiere mostrar
   * el valor total de las cartas filtradas (no solo las poseídas).
   * @returns true si debe mostrar estadísticas completas del filtro
   */
  get shouldShowTotalFilterStats(): boolean {
    return (
      this.filterOwnership === 'missing' ||
      this.filterOwnership === 'foilOwned' ||
      this.filterOwnership === 'wanted'
    );
  }

  /**
   * Obtiene el número total de cartas en el filtro actual.
   * @returns Total de cartas filtradas
   */
  get filteredTotalCards(): number {
    return this.filteredCards.length;
  }

  /**
   * Obtiene el número de cartas diferentes que el usuario posee dentro del filtro.
   * Solo se muestra cuando no hay filtros de propiedad específicos.
   * @returns Número de cartas poseídas en el filtro
   */
  get filteredOwnedCards(): number {
    return this.filteredCards.filter((card) => this.isCardOwned(card)).length;
  }

  /**
   * Calcula el porcentaje de completitud dentro del filtro actual.
   * Solo se muestra cuando no hay filtros de propiedad específicos.
   * @returns Porcentaje de 0 a 100
   */
  get filteredCompletionPercentage(): number {
    return this.filteredTotalCards === 0
      ? 0
      : (this.filteredOwnedCards / this.filteredTotalCards) * 100;
  }

  /**
   * Calcula el valor estimado de las cartas filtradas en euros.
   * Si hay un filtro de propiedad específico, muestra el valor total de todas las cartas.
   * Si no, muestra solo el valor de las cartas poseídas.
   * @returns Valor total en euros de las cartas filtradas
   */
  get filteredCollectionValueEur(): number {
    if (this.shouldShowTotalFilterStats) {
      // Mostrar el valor total de mercado de todas las cartas filtradas
      return this.filteredCards.reduce((sum, card) => {
        const normalValue = card.eurPriceNonFoil ?? 0;
        const foilValue = card.eurPriceFoil ?? 0;
        // Sumar el precio más alto (o ambos si están disponibles)
        return sum + Math.max(normalValue, foilValue);
      }, 0);
    } else {
      // Mostrar el valor de las cartas poseídas en el filtro
      return this.filteredCards.reduce((sum, card) => {
        const normalValue = this.getNormalQty(card.id) * (card.eurPriceNonFoil ?? 0);
        const foilValue = this.getFoilQty(card.id) * (card.eurPriceFoil ?? 0);
        return sum + normalValue + foilValue;
      }, 0);
    }
  }

  /**
   * Calcula el valor total de mercado de todas las cartas filtradas.
   * Suma el precio más alto (normal o foil) de cada carta.
   * @returns Valor total en euros de todas las cartas filtradas
   */
  get filteredTotalMarketValue(): number {
    return this.filteredCards.reduce((sum, card) => {
      const normalValue = card.eurPriceNonFoil ?? 0;
      const foilValue = card.eurPriceFoil ?? 0;
      return sum + Math.max(normalValue, foilValue);
    }, 0);
  }

  // ==================== FILTERING ====================

  /**
   * Obtiene la lista de cartas filtradas y ordenadas según los criterios actuales.
   * @returns Array de cartas que cumplen con todos los filtros, ordenadas
   */
  get filteredCards(): MtgCard[] {
    const criteria: FilterCriteria = {
      searchTerm: this.searchTerm,
      rarity: this.filterRarity,
      ownership: this.filterOwnership,
      print: 'all',
    };

    const filtered = this.filterService.filterCards(
      this.cards,
      criteria,
      (cardId) => ({
        isOwned: this.isCardOwned(this.cards.find((c) => c.id === cardId)!),
        isFoilOwned: this.isCardFoilOwned(this.cards.find((c) => c.id === cardId)!),
        isWanted: this.isWanted(cardId),
      })
    );

    return this.sortCards(filtered);
  }

  /**
   * Ordena un array de cartas según el criterio seleccionado.
   * @param cards - Array de cartas a ordenar
   * @returns Array de cartas ordenado
   */
  private sortCards(cards: MtgCard[]): MtgCard[] {
    const sorted = [...cards];

    switch (this.sortBy) {
      case 'collectorNumber':
        return sorted.sort((a, b) =>
          a.collectorNumber.localeCompare(b.collectorNumber, 'en', { numeric: true })
        );
      
      case 'collectorNumberDesc':
        return sorted.sort((a, b) =>
          b.collectorNumber.localeCompare(a.collectorNumber, 'en', { numeric: true })
        );
      
      case 'nameAsc':
        return sorted.sort((a, b) => a.name.localeCompare(b.name));
      
      case 'nameDesc':
        return sorted.sort((a, b) => b.name.localeCompare(a.name));
      
      case 'priceAsc':
        return sorted.sort((a, b) => {
          const priceA = a.eurPriceNonFoil ?? 0;
          const priceB = b.eurPriceNonFoil ?? 0;
          return priceA - priceB;
        });
      
      case 'priceDesc':
        return sorted.sort((a, b) => {
          const priceA = a.eurPriceNonFoil ?? 0;
          const priceB = b.eurPriceNonFoil ?? 0;
          return priceB - priceA;
        });
      
      default:
        return sorted;
    }
  }

  // ==================== IMPORT/EXPORT ====================

  /**
   * Exporta la colección actual como archivo JSON.
   * Descarga automáticamente el archivo en el navegador.
   */
  exportCollection(): void {
    const data = this.collectionService.getAll();
    FileHelper.exportAsJson(data, 'mtg-ff-collection');
  }

  /**
   * Maneja la selección de un archivo para importar la colección.
   * Lee el archivo, valida los datos y actualiza la colección.
   * @param event - Evento del input file
   */
  async onImportFileSelected(event: any): Promise<void> {
    const file = event.target.files[0];
    if (!file) return;

    try {
      const data = await FileHelper.readJsonFile(file);
      this.collectionService.replaceAll(data);
      
      // Forzar actualización de la vista
      this.cards = [...this.cards];
      this.importErrorKey = null;
    } catch (error) {
      this.importErrorKey = 'importError';
      console.error('Error importing collection:', error);
    } finally {
      // Limpiar el input para permitir reimportar el mismo archivo
      event.target.value = '';
    }
  }
}
import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MtgCard } from './models/mtg-card.model';
import { ScryfallService } from './services/scryfall.service';
import { CollectionService } from './services/collection.service';
import { TranslationService } from './services/translation.service';
import { FilterService, FilterCriteria, RarityFilter, OwnershipFilter, PrintFilter } from './services/filter.service';
import { UrlHelper } from './helpers/url.helper';
import { FileHelper } from './helpers/file.helper';

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
  
  /** Filtro de tipo de impresión seleccionado */
  filterPrint: PrintFilter = 'all';

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

  // ==================== I18N ====================

  /**
   * Cambia el idioma de la interfaz.
   * @param lang - Nuevo idioma a establecer
   */
  changeLanguage(lang: 'es' | 'en'): void {
    this.translationService.loadLanguage(lang);
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

    this.scryfallService.getFinalFantasyCards().subscribe({
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

  // ==================== FILTERING ====================

  /**
   * Obtiene la lista de cartas filtradas según los criterios actuales.
   * @returns Array de cartas que cumplen con todos los filtros
   */
  get filteredCards(): MtgCard[] {
    const criteria: FilterCriteria = {
      searchTerm: this.searchTerm,
      rarity: this.filterRarity,
      ownership: this.filterOwnership,
      print: this.filterPrint,
    };

    return this.filterService.filterCards(
      this.cards,
      criteria,
      (cardId) => ({
        isOwned: this.isCardOwned(this.cards.find((c) => c.id === cardId)!),
        isFoilOwned: this.isCardFoilOwned(this.cards.find((c) => c.id === cardId)!),
        isWanted: this.isWanted(cardId),
      })
    );
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
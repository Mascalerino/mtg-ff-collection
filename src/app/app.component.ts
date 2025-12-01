import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { HttpClient } from '@angular/common/http';
import { MtgCard } from './models/mtg-card.model';
import { ScryfallService } from './services/scryfall.service';
import { CollectionService, OwnedCardInfo } from './services/collection.service';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.scss'],
})
export class AppComponent implements OnInit {
  // Idioma actual
  language: 'es' | 'en' = 'es';

  // Diccionario cargado desde los archivos JSON
  translations: Record<string, string> = {};

  // Datos de cartas
  cards: MtgCard[] = [];
  loading = false;

  // Claves de error (traducibles)
  errorKey: string | null = null;
  importErrorKey: string | null = null;

  // Filtros
  searchTerm = '';
  filterRarity: 'all' | 'common' | 'uncommon' | 'rare' | 'mythic' = 'all';
  filterOwnership: 'all' | 'owned' | 'missing' | 'foilOwned' | 'wanted' = 'all';
  filterPrint: 'all' | 'hasFoil' | 'hasNonFoil' = 'all';

  constructor(
    private http: HttpClient,
    private scryfallService: ScryfallService,
    private collectionService: CollectionService
  ) {}

  ngOnInit(): void {
    // ⬇️ Cargar idioma guardado en localStorage (si existe)
    const savedLang = localStorage.getItem('mtg_ff_lang') as 'es' | 'en' | null;
    if (savedLang === 'es' || savedLang === 'en') {
      this.language = savedLang;
    }

    // Cargar diccionario del idioma actual
    this.loadLanguage(this.language);

    // Cargar cartas
    this.loadCards();
  }

  // ---------- I18N ----------

  /** Carga el archivo JSON de idioma correspondiente */
  loadLanguage(lang: 'es' | 'en'): void {
    this.http
      .get<Record<string, string>>(`/assets/i18n/${lang}.json`)
      .subscribe({
        next: (data) => {
          this.language = lang;
          this.translations = data;

          // ⬇️ GUARDAR idioma en localStorage
          localStorage.setItem('mtg_ff_lang', lang);
        },
        error: () => {
          this.translations = {};
        },
      });
  }

  /** Cambiar idioma desde el select */
  changeLanguage(lang: 'es' | 'en'): void {
    this.loadLanguage(lang);
  }

  /** Método para traducir */
  t(key: string): string {
    return this.translations[key] ?? key;
  }

  // ---------- CARGA DE CARTAS ----------

  private loadCards(): void {
    this.loading = true;
    this.errorKey = null;

    this.scryfallService.getFinalFantasyCards().subscribe({
      next: (cards) => {
        this.cards = cards.sort((a, b) =>
          a.collectorNumber.localeCompare(b.collectorNumber, 'en', {
            numeric: true,
          })
        );
        this.loading = false;
      },
      error: () => {
        this.loading = false;
        this.errorKey = 'loadingError';
      },
    });
  }

  // ---------- COLECCIÓN (CANTIDADES + WISHLIST) ----------

  getNormalQty(cardId: string): number {
    return this.collectionService.getNormalQty(cardId);
  }

  getFoilQty(cardId: string): number {
    return this.collectionService.getFoilQty(cardId);
  }

  onNormalQtyChange(cardId: string, v: any): void {
    this.collectionService.setCardQuantities(cardId, Number(v) || 0, this.getFoilQty(cardId));
  }

  onFoilQtyChange(cardId: string, v: any): void {
    this.collectionService.setCardQuantities(cardId, this.getNormalQty(cardId), Number(v) || 0);
  }

  isWanted(id: string): boolean {
    return this.collectionService.isWanted(id);
  }

  toggleWanted(id: string): void {
    this.collectionService.toggleWanted(id);
  }

  // ---------- CARDMARKET ----------

  getCardmarketUrl(card: MtgCard): string {
    const query = encodeURIComponent(card.name);
    return `https://www.cardmarket.com/en/Magic/Products/Search?searchString=${query}`;
  }

  // ---------- RESUMEN ----------

  get totalCards() {
    return this.cards.length;
  }

  get ownedCards() {
    return this.cards.filter((c) => this.isOwned(c)).length;
  }

  get completionPercentage() {
    return this.totalCards === 0 ? 0 : (this.ownedCards / this.totalCards) * 100;
  }

  get collectionValueEur() {
    return this.cards.reduce((sum, card) => {
      return (
        sum +
        this.getNormalQty(card.id) * (card.eurPriceNonFoil ?? 0) +
        this.getFoilQty(card.id) * (card.eurPriceFoil ?? 0)
      );
    }, 0);
  }

  private isOwned(card: MtgCard) {
    return this.getNormalQty(card.id) > 0 || this.getFoilQty(card.id) > 0;
  }

  private isFoilOwned(card: MtgCard) {
    return this.getFoilQty(card.id) > 0;
  }

  // ---------- FILTROS ----------

  get filteredCards() {
    let list = this.cards;

    const q = this.searchTerm.trim().toLowerCase();
    if (q) list = list.filter((c) => c.name.toLowerCase().includes(q));

    if (this.filterRarity !== 'all') list = list.filter((c) => c.rarity === this.filterRarity);

    if (this.filterOwnership === 'owned') list = list.filter((c) => this.isOwned(c));
    if (this.filterOwnership === 'missing') list = list.filter((c) => !this.isOwned(c));
    if (this.filterOwnership === 'foilOwned') list = list.filter((c) => this.isFoilOwned(c));
    if (this.filterOwnership === 'wanted') list = list.filter((c) => this.isWanted(c.id));

    if (this.filterPrint === 'hasFoil') list = list.filter((c) => c.hasFoil);
    if (this.filterPrint === 'hasNonFoil') list = list.filter((c) => c.hasNonFoil);

    return list;
  }

  // ---------- EXPORT / IMPORT ----------

  exportCollection() {
    const data = this.collectionService.getAll();
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });

    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'mtg-ff-collection.json';
    a.click();
    URL.revokeObjectURL(url);
  }

  onImportFileSelected(ev: any) {
    const file = ev.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = () => {
      try {
        const json = JSON.parse(reader.result as string);
        this.collectionService.replaceAll(json);
        this.cards = [...this.cards];
        this.importErrorKey = null;
      } catch {
        this.importErrorKey = 'importError';
      }
      ev.target.value = '';
    };
    reader.readAsText(file);
  }
}
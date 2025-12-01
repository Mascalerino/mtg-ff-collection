import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, of, switchMap, map } from 'rxjs';
import { ScryfallCard, ScryfallList } from '../models/scryfall.model';
import { MtgCard } from '../models/mtg-card.model';

/**
 * Servicio para interactuar con la API de Scryfall.
 * Obtiene información de cartas del set Final Fantasy (FIN).
 */
@Injectable({
  providedIn: 'root',
})
export class ScryfallService {
  private readonly BASE_URL = 'https://api.scryfall.com';

  constructor(private http: HttpClient) {}

  /**
   * Obtiene todas las cartas del set FINAL FANTASY (código FIN).
   * Maneja la paginación automáticamente para obtener todas las cartas.
   * @returns Observable con el array de cartas del set Final Fantasy
   */
  getFinalFantasyCards(): Observable<MtgCard[]> {
    const firstPageUrl = `${this.BASE_URL}/cards/search?q=set%3Afin`;

    return this.fetchAllPages(firstPageUrl).pipe(
      map((cards) => cards.map((c) => this.mapToMtgCard(c)))
    );
  }

  /**
   * Obtiene todas las páginas de resultados de Scryfall de forma recursiva.
   * La API de Scryfall pagina los resultados, este método los combina todos.
   * @param url - URL de la página actual
   * @param acc - Acumulador de cartas de páginas anteriores
   * @returns Observable con todas las cartas de todas las páginas
   */
  private fetchAllPages(
    url: string,
    acc: ScryfallCard[] = []
  ): Observable<ScryfallCard[]> {
    return this.http.get<ScryfallList>(url).pipe(
      switchMap((resp) => {
        const combined = [...acc, ...resp.data];
        if (resp.has_more && resp.next_page) {
          return this.fetchAllPages(resp.next_page, combined);
        } else {
          return of(combined);
        }
      })
    );
  }

  /**
   * Mapea una carta de la API de Scryfall a nuestro modelo simplificado.
   * Extrae la información relevante como imagen, precios, y disponibilidad de versiones.
   * @param card - Carta en formato Scryfall
   * @returns Carta en nuestro modelo simplificado (MtgCard)
   */
  private mapToMtgCard(card: ScryfallCard): MtgCard {
    // Obtener URL de imagen (puede estar en image_uris o en la primera cara)
    const imageUrl =
      card.image_uris?.normal ??
      card.card_faces?.[0]?.image_uris?.normal ??
      '';

    // Parsear precio en euros para versión normal
    let eurPriceNonFoil: number | null = null;
    if (card.prices?.eur) {
      const parsed = parseFloat(card.prices.eur);
      eurPriceNonFoil = isNaN(parsed) ? null : parsed;
    }

    // Parsear precio en euros para versión foil
    let eurPriceFoil: number | null = null;
    if (card.prices?.eur_foil) {
      const parsed = parseFloat(card.prices.eur_foil);
      eurPriceFoil = isNaN(parsed) ? null : parsed;
    }

    return {
      id: card.id,
      name: card.name,
      collectorNumber: card.collector_number,
      rarity: card.rarity,
      imageUrl,
      hasNonFoil: !!card.nonfoil,
      hasFoil: !!card.foil,
      eurPriceNonFoil,
      eurPriceFoil,
    };
  }
}
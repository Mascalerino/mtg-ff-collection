import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, of, switchMap, map } from 'rxjs';
import { ScryfallCard, ScryfallList } from '../models/scryfall.model';
import { MtgCard } from '../models/mtg-card.model';

@Injectable({
  providedIn: 'root',
})
export class ScryfallService {
  private readonly BASE_URL = 'https://api.scryfall.com';

  constructor(private http: HttpClient) {}

  /**
   * Devuelve todas las cartas del set FINAL FANTASY (código FIN) como MtgCard[]
   */
  getFinalFantasyCards(): Observable<MtgCard[]> {
    const firstPageUrl = `${this.BASE_URL}/cards/search?q=set%3Afin`;

    return this.fetchAllPages(firstPageUrl).pipe(
      map((cards) => cards.map((c) => this.mapToMtgCard(c)))
    );
  }

  /**
   * Llama recursivamente a todas las páginas de la búsqueda de Scryfall.
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
   * Mapea la carta de Scryfall a nuestro modelo simplificado.
   * Incluye precios en euros (Cardmarket) para normal y foil.
   */
  private mapToMtgCard(card: ScryfallCard): MtgCard {
    const imageUrl =
      card.image_uris?.normal ??
      card.card_faces?.[0]?.image_uris?.normal ??
      '';

    let eurPriceNonFoil: number | null = null;
    if (card.prices?.eur) {
      const parsed = parseFloat(card.prices.eur);
      eurPriceNonFoil = isNaN(parsed) ? null : parsed;
    }

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
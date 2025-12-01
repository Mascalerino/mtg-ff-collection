import { Injectable } from '@angular/core';

export interface OwnedCardInfo {
  cardId: string;
  normalQty: number;
  foilQty: number;
  wanted?: boolean; // carta marcada como deseada
}

@Injectable({
  providedIn: 'root',
})
export class CollectionService {
  private readonly STORAGE_KEY = 'ff-mtg-collection';
  private cache: OwnedCardInfo[] | null = null;

  private loadFromStorage(): OwnedCardInfo[] {
    if (this.cache) {
      return this.cache;
    }
    const raw = localStorage.getItem(this.STORAGE_KEY);
    this.cache = raw ? (JSON.parse(raw) as OwnedCardInfo[]) : [];
    return this.cache;
  }

  private saveToStorage(data: OwnedCardInfo[]): void {
    this.cache = data;
    localStorage.setItem(this.STORAGE_KEY, JSON.stringify(data));
  }

  getAll(): OwnedCardInfo[] {
    return this.loadFromStorage();
  }

  getCard(cardId: string): OwnedCardInfo | undefined {
    return this.loadFromStorage().find((c) => c.cardId === cardId);
  }

  setCardQuantities(cardId: string, normalQty: number, foilQty: number): void {
    const collection = this.loadFromStorage();
    const existing = collection.find((c) => c.cardId === cardId);

    const n = Math.max(0, normalQty || 0);
    const f = Math.max(0, foilQty || 0);

    // Si ya existe la carta en la colección
    if (existing) {
      // Actualizamos cantidades
      existing.normalQty = n;
      existing.foilQty = f;

      // Si no hay copias y tampoco está marcada como deseada, la eliminamos
      if (n === 0 && f === 0 && !existing.wanted) {
        const idx = collection.indexOf(existing);
        collection.splice(idx, 1);
      }

      this.saveToStorage(collection);
      return;
    }

    // Si no existe y no hay copias, no la añadimos (a no ser que se marque como deseada, que se hace en toggleWanted)
    if (n === 0 && f === 0) {
      return;
    }

    // Nueva entrada sin wishlist por defecto
    collection.push({
      cardId,
      normalQty: n,
      foilQty: f,
      wanted: false,
    });

    this.saveToStorage(collection);
  }

  getNormalQty(cardId: string): number {
    return this.getCard(cardId)?.normalQty ?? 0;
  }

  getFoilQty(cardId: string): number {
    return this.getCard(cardId)?.foilQty ?? 0;
  }

  isWanted(cardId: string): boolean {
    return !!this.getCard(cardId)?.wanted;
  }

  toggleWanted(cardId: string): void {
    const collection = this.loadFromStorage();
    let existing = collection.find((c) => c.cardId === cardId);

    if (!existing) {
      // Si no existe, la creamos como deseada, con 0 copias
      existing = {
        cardId,
        normalQty: 0,
        foilQty: 0,
        wanted: true,
      };
      collection.push(existing);
      this.saveToStorage(collection);
      return;
    }

    // Invertimos el estado de "wanted"
    existing.wanted = !existing.wanted;

    // Si ya no está deseada y no hay copias, la borramos para limpiar
    if (!existing.wanted && existing.normalQty === 0 && existing.foilQty === 0) {
      const idx = collection.indexOf(existing);
      collection.splice(idx, 1);
    }

    this.saveToStorage(collection);
  }

  /**
   * Reemplaza toda la colección por la que viene de un JSON importado.
   * Conserva el campo "wanted" si existe.
   */
  replaceAll(data: OwnedCardInfo[]): void {
    if (!Array.isArray(data)) {
      throw new Error('El JSON importado no es un array válido.');
    }

    const cleaned: OwnedCardInfo[] = [];
    for (const item of data) {
      if (!item || typeof item !== 'object') continue;
      if (!item.cardId || typeof item.cardId !== 'string') continue;

      const normal = Math.max(0, Number((item as any).normalQty) || 0);
      const foil = Math.max(0, Number((item as any).foilQty) || 0);
      const wanted = !!(item as any).wanted;

      // Si no hay copias y tampoco está marcada como deseada, la ignoramos
      if (normal === 0 && foil === 0 && !wanted) continue;

      cleaned.push({
        cardId: item.cardId,
        normalQty: normal,
        foilQty: foil,
        wanted,
      });
    }

    this.saveToStorage(cleaned);
  }
}
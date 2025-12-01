import { Injectable } from '@angular/core';

/**
 * Información sobre una carta en la colección del usuario.
 */
export interface OwnedCardInfo {
  /** ID único de la carta */
  cardId: string;
  /** Cantidad de copias normales (no foil) */
  normalQty: number;
  /** Cantidad de copias foil */
  foilQty: number;
  /** Indica si la carta está marcada como deseada en la wishlist */
  wanted?: boolean;
}

/**
 * Servicio para gestionar la colección de cartas del usuario.
 * Guarda y recupera datos de localStorage, incluyendo cantidades y wishlist.
 */
@Injectable({
  providedIn: 'root',
})
export class CollectionService {
  private readonly STORAGE_KEY = 'ff-mtg-collection';
  private cache: OwnedCardInfo[] | null = null;

  /**
   * Carga la colección desde localStorage.
   * Utiliza caché para evitar parsear JSON múltiples veces.
   * @returns Array con la información de todas las cartas en la colección
   */
  private loadFromStorage(): OwnedCardInfo[] {
    if (this.cache) {
      return this.cache;
    }
    const raw = localStorage.getItem(this.STORAGE_KEY);
    this.cache = raw ? (JSON.parse(raw) as OwnedCardInfo[]) : [];
    return this.cache;
  }

  /**
   * Guarda la colección en localStorage y actualiza la caché.
   * @param data - Datos de la colección a guardar
   */
  private saveToStorage(data: OwnedCardInfo[]): void {
    this.cache = data;
    localStorage.setItem(this.STORAGE_KEY, JSON.stringify(data));
  }

  /**
   * Obtiene toda la colección.
   * @returns Array con todas las cartas en la colección
   */
  getAll(): OwnedCardInfo[] {
    return this.loadFromStorage();
  }

  /**
   * Obtiene la información de una carta específica de la colección.
   * @param cardId - ID de la carta a buscar
   * @returns Información de la carta o undefined si no está en la colección
   */
  getCard(cardId: string): OwnedCardInfo | undefined {
    return this.loadFromStorage().find((c) => c.cardId === cardId);
  }

  /**
   * Actualiza las cantidades (normal y foil) de una carta.
   * Si las cantidades son 0 y no está en la wishlist, elimina la carta de la colección.
   * @param cardId - ID de la carta
   * @param normalQty - Cantidad de copias normales
   * @param foilQty - Cantidad de copias foil
   */
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

    // Si no existe y no hay copias, no la añadimos
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

  /**
   * Obtiene la cantidad de copias normales de una carta.
   * @param cardId - ID de la carta
   * @returns Cantidad de copias normales (0 si no está en la colección)
   */
  getNormalQty(cardId: string): number {
    return this.getCard(cardId)?.normalQty ?? 0;
  }

  /**
   * Obtiene la cantidad de copias foil de una carta.
   * @param cardId - ID de la carta
   * @returns Cantidad de copias foil (0 si no está en la colección)
   */
  getFoilQty(cardId: string): number {
    return this.getCard(cardId)?.foilQty ?? 0;
  }

  /**
   * Verifica si una carta está marcada como deseada en la wishlist.
   * @param cardId - ID de la carta
   * @returns true si está en la wishlist, false en caso contrario
   */
  isWanted(cardId: string): boolean {
    return !!this.getCard(cardId)?.wanted;
  }

  /**
   * Alterna el estado de wishlist de una carta.
   * Si la carta no existe en la colección, la crea con wanted=true.
   * Si existe, invierte su estado wanted.
   * Si queda con wanted=false y sin copias, la elimina de la colección.
   * @param cardId - ID de la carta
   */
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
   * Reemplaza toda la colección por datos importados.
   * Valida y limpia los datos antes de guardarlos.
   * Conserva el campo "wanted" si existe en los datos importados.
   * @param data - Array con los datos de la colección a importar
   * @throws Error si los datos no son un array válido
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
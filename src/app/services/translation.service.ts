import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { BehaviorSubject, Observable } from 'rxjs';

/**
 * Servicio para gestionar las traducciones de la aplicación.
 * Soporta español e inglés, cargando los archivos JSON desde assets/i18n.
 */
@Injectable({
  providedIn: 'root',
})
export class TranslationService {
  private readonly STORAGE_KEY = 'mtg_ff_lang';
  private readonly DEFAULT_LANGUAGE: 'es' | 'en' = 'es';

  private currentLanguage$ = new BehaviorSubject<'es' | 'en'>(this.DEFAULT_LANGUAGE);
  private translations: Record<string, string> = {};

  constructor(private http: HttpClient) {
    this.initializeLanguage();
  }

  /**
   * Inicializa el idioma desde localStorage o usa el idioma por defecto.
   */
  private initializeLanguage(): void {
    const savedLang = localStorage.getItem(this.STORAGE_KEY) as 'es' | 'en' | null;
    if (savedLang === 'es' || savedLang === 'en') {
      this.loadLanguage(savedLang);
    } else {
      this.loadLanguage(this.DEFAULT_LANGUAGE);
    }
  }

  /**
   * Carga el archivo JSON de traducciones para el idioma especificado.
   * @param lang - El idioma a cargar ('es' o 'en')
   */
  loadLanguage(lang: 'es' | 'en'): void {
    this.http
      .get<Record<string, string>>(`/assets/i18n/${lang}.json`)
      .subscribe({
        next: (data) => {
          this.translations = data;
          this.currentLanguage$.next(lang);
          localStorage.setItem(this.STORAGE_KEY, lang);
        },
        error: () => {
          this.translations = {};
          console.error(`Error loading language file: ${lang}.json`);
        },
      });
  }

  /**
   * Obtiene la traducción para una clave específica.
   * Si no existe la traducción, devuelve la clave original.
   * @param key - La clave de traducción
   * @returns La cadena traducida o la clave si no se encuentra
   */
  translate(key: string): string {
    return this.translations[key] ?? key;
  }

  /**
   * Obtiene el idioma actual como Observable.
   * @returns Observable del idioma actual
   */
  getCurrentLanguage(): Observable<'es' | 'en'> {
    return this.currentLanguage$.asObservable();
  }

  /**
   * Obtiene el idioma actual de forma síncrona.
   * @returns El idioma actual
   */
  getCurrentLanguageValue(): 'es' | 'en' {
    return this.currentLanguage$.value;
  }
}

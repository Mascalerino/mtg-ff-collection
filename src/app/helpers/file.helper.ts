/**
 * Helper para operaciones relacionadas con archivos.
 */
export class FileHelper {
  /**
   * Exporta datos como archivo JSON descargable.
   * @param data - Datos a exportar
   * @param filename - Nombre del archivo (sin extensión)
   */
  static exportAsJson(data: any, filename: string): void {
    const blob = new Blob([JSON.stringify(data, null, 2)], { 
      type: 'application/json' 
    });

    const url = URL.createObjectURL(blob);
    const anchor = document.createElement('a');
    anchor.href = url;
    anchor.download = `${filename}.json`;
    anchor.click();
    URL.revokeObjectURL(url);
  }

  /**
   * Lee el contenido de un archivo como texto.
   * @param file - Archivo a leer
   * @returns Promise con el contenido del archivo como string
   */
  static readFileAsText(file: File): Promise<string> {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      
      reader.onload = () => {
        resolve(reader.result as string);
      };
      
      reader.onerror = () => {
        reject(new Error('Error reading file'));
      };
      
      reader.readAsText(file);
    });
  }

  /**
   * Lee un archivo JSON y lo parsea.
   * @param file - Archivo JSON a leer
   * @returns Promise con los datos parseados
   */
  static async readJsonFile<T = any>(file: File): Promise<T> {
    const text = await this.readFileAsText(file);
    return JSON.parse(text) as T;
  }
}

// ============================================================
// storage.ts
// خدمة عامة (Generic) للتعامل مع الـ LocalStorage
// بتخزن أي نوع بيانات <T> تحت مفتاح معين
// ============================================================

export class StorageService<T> {
  private readonly storageKey: string;

  constructor(storageKey: string) {
    this.storageKey = storageKey;
  }

  /** يخزن البيانات في الـ LocalStorage بعد ما يحولها لـ JSON */
  save(data: T): void {
    try {
      const serialized = JSON.stringify(data);
      localStorage.setItem(this.storageKey, serialized);
    } catch (error) {
      console.error("Failed to save to localStorage:", error);
    }
  }

  /** يرجع البيانات المخزنة، أو null لو مفيش حاجة أو حصل خطأ */
  load(): T | null {
    try {
      const raw = localStorage.getItem(this.storageKey);
      if (raw === null) return null;
      return JSON.parse(raw) as T;
    } catch (error) {
      console.error("Failed to load from localStorage:", error);
      return null;
    }
  }

  /** بيتأكد هل فيه بيانات مخزنة تحت المفتاح ده أصلاً */
  exists(): boolean {
    return localStorage.getItem(this.storageKey) !== null;
  }

  /** يمسح البيانات المخزنة تحت المفتاح ده */
  clear(): void {
    localStorage.removeItem(this.storageKey);
  }

  getKey(): string {
    return this.storageKey;
  }
}

// ============================================================
// dom.ts
// دالة مساعدة بسيطة لجلب عنصر من الصفحة بأمان (Type-safe)
// ============================================================

/**
 * بيجيب عنصر من الـ DOM بالـ id بتاعه.
 * لو العنصر مش موجود بيرمي Error فوراً، عشان نمسك أي غلطة
 * في الـ HTML بدري بدل ما ناخد undefined في مكان تاني في الكود.
 */
export function getElement<T extends HTMLElement = HTMLElement>(id: string): T {
  const element = document.getElementById(id);
  if (!element) {
    throw new Error(`Element with id '${id}' not found`);
  }
  return element as T;
}

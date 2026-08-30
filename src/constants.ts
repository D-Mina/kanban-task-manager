// ============================================================
// constants.ts
// كل القيم الثابتة (Constants) في مكان واحد
// ============================================================

import { Column, TaskStatus } from "./types";

/** المفتاح اللي هنخزن بيه المهام في الـ LocalStorage */
export const STORAGE_KEY = "kanban-tasks";

/** قواعد التحقق (Validation) من بيانات الفورم */
export const VALIDATION_RULES = {
  title: {
    minLength: 3,
    maxLength: 100,
  },
  description: {
    maxLength: 500,
  },
};

/** تعريف أعمدة اللوحة بالترتيب اللي هتتعرض بيه */
export const COLUMNS: Column[] = [
  {
    id: TaskStatus.ToDo,
    title: "To Do",
    icon: "fa-solid fa-clipboard-list",
  },
  {
    id: TaskStatus.InProgress,
    title: "In Progress",
    icon: "fa-solid fa-spinner",
  },
  {
    id: TaskStatus.Completed,
    title: "Completed",
    icon: "fa-solid fa-circle-check",
  },
];

/** ثوابت زمنية (بالميلي ثانية) وقيم تحكم في سلوك الواجهة */
export const TIME = {
  MINUTE: 60 * 1000,
  HOUR: 60 * 60 * 1000,
  DAY: 24 * 60 * 60 * 1000,
  WEEK_DAYS: 7,
  DUE_SOON_DAYS: 2, // لو باقي يومين أو أقل على الديدلاين تبقى "قريبة"
  NOTIFICATION_DURATION: 3000, // مدة ظهور الإشعار
  FADE_OUT_DURATION: 300, // مدة انيميشن الاختفاء
};

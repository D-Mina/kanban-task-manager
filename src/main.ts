// ============================================================
// main.ts
// نقطة الدخول: بننتظر تحميل الصفحة، وبعدين نشغل التطبيق
// ============================================================

import { KanbanApp } from "./kanban-app";
import "./style.css";

document.addEventListener("DOMContentLoaded", () => {
  new KanbanApp();
});

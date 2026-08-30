// ============================================================
// types.ts
// كل الـ Types والـ Interfaces اللي بنستخدمها في التطبيق
// ============================================================

/** حالات المهمة الممكنة على اللوحة */
export enum TaskStatus {
  ToDo = "todo",
  InProgress = "in-progress",
  Completed = "completed",
}

/** درجات الأولوية المتاحة للمهمة */
export type TaskPriority = "low" | "medium" | "high";

/** شكل المهمة زي ما بتتخزن في الـ LocalStorage */
export interface Task {
  id: string;
  title: string;
  description: string;
  status: TaskStatus;
  priority: TaskPriority;
  dueDate: string; // ISO date string, ممكن تبقى فاضية
  createdAt: string; // ISO datetime string
}

/** البيانات اللي بتيجي من الفورم (قبل ما تتحول لـ Task كامل) */
export interface TaskFormData {
  title: string;
  description: string;
  dueDate: string;
  priority: TaskPriority;
}

/** تعريف عمود من أعمدة اللوحة */
export interface Column {
  id: TaskStatus;
  title: string;
  icon: string; // اسم كلاس الأيقونة من Font Awesome
}

/** نوع الإشعار اللي بيظهر للمستخدم */
export type NotificationType = "success" | "error";

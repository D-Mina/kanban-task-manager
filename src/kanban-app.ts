// ============================================================
// kanban-app.ts
// الكلاس الرئيسي اللي بيشغل كل حاجة: البيانات + الأحداث + الرسم
// ============================================================

import { Task, TaskFormData, TaskStatus, NotificationType } from "./types";
import { STORAGE_KEY, VALIDATION_RULES, COLUMNS, TIME } from "./constants";
import { StorageService } from "./storage";
import { getElement } from "./dom";

export class KanbanApp {
  // ---------- الحالة (State) ----------
  private tasks: Task[] = [];
  private readonly storage: StorageService<Task[]>;
  private editingTaskId: string | null = null;

  // ---------- عناصر الفورم ----------
  private readonly formElement: HTMLFormElement;
  private readonly titleInput: HTMLInputElement;
  private readonly descriptionInput: HTMLTextAreaElement;
  private readonly dueDateInput: HTMLInputElement;
  private readonly prioritySelect: HTMLSelectElement;

  // ---------- عناصر اللوحة والمودال ----------
  private readonly columnsContainer: HTMLElement;
  private readonly modalOverlay: HTMLElement;
  private readonly addTaskBtn: HTMLButtonElement;
  private readonly closeModalBtn: HTMLButtonElement;
  private readonly cancelBtn: HTMLButtonElement;
  private readonly charCount: HTMLElement;
  private readonly modalTitle: HTMLElement;
  private readonly modalIcon: HTMLElement;
  private readonly submitBtn: HTMLButtonElement;
  private readonly submitBtnText: HTMLElement;

  // ---------- عناصر رسائل الخطأ ----------
  private readonly titleError: HTMLElement;
  private readonly dateError: HTMLElement;
  private readonly descriptionError: HTMLElement;

  constructor() {
    this.storage = new StorageService<Task[]>(STORAGE_KEY);

    // ربط عناصر الفورم
    this.formElement = getElement<HTMLFormElement>("task-form");
    this.titleInput = getElement<HTMLInputElement>("task-title");
    this.descriptionInput = getElement<HTMLTextAreaElement>("task-description");
    this.dueDateInput = getElement<HTMLInputElement>("task-due-date");
    this.prioritySelect = getElement<HTMLSelectElement>("task-priority");

    // ربط عناصر اللوحة والمودال
    this.columnsContainer = getElement("columns-container");
    this.modalOverlay = getElement("modal-overlay");
    this.addTaskBtn = getElement<HTMLButtonElement>("add-task-btn");
    this.closeModalBtn = getElement<HTMLButtonElement>("close-modal-btn");
    this.cancelBtn = getElement<HTMLButtonElement>("cancel-btn");
    this.charCount = getElement("char-count");
    this.modalTitle = getElement("modal-title");
    this.modalIcon = getElement("modal-icon");
    this.submitBtn = getElement<HTMLButtonElement>("submit-btn");
    this.submitBtnText = getElement("submit-btn-text");

    // ربط عناصر الأخطاء
    this.titleError = getElement("title-error");
    this.dateError = getElement("date-error");
    this.descriptionError = getElement("description-error");

    this.loadTasks();
    this.bindEvents();
    this.render();
  }

  // ============================================================
  // CRUD Operations
  // ============================================================

  private loadTasks(): void {
    const stored = this.storage.load();
    this.tasks = stored ?? [];
  }

  private saveTasks(): void {
    this.storage.save(this.tasks);
  }

  private generateId(): string {
    return `task-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;
  }

  private addTask(data: TaskFormData): void {
    const newTask: Task = {
      id: this.generateId(),
      title: data.title.trim(),
      description: data.description.trim(),
      status: TaskStatus.ToDo,
      priority: data.priority,
      dueDate: data.dueDate,
      createdAt: new Date().toISOString(),
    };

    this.tasks.push(newTask);
    this.saveTasks();
    this.render();
  }

  private updateTaskStatus(taskId: string, newStatus: TaskStatus): void {
    const task = this.tasks.find((t) => t.id === taskId);
    if (!task) return;

    task.status = newStatus;
    this.saveTasks();
    this.render();
  }

  private deleteTask(taskId: string): void {
    this.tasks = this.tasks.filter((t) => t.id !== taskId);
    this.saveTasks();
    this.render();
  }

  private updateTask(taskId: string, data: TaskFormData): void {
    const task = this.tasks.find((t) => t.id === taskId);
    if (!task) return;

    task.title = data.title.trim();
    task.description = data.description.trim();
    task.priority = data.priority;
    task.dueDate = data.dueDate;
    this.saveTasks();
    this.render();
  }

  private getTaskById(taskId: string): Task | undefined {
    return this.tasks.find((t) => t.id === taskId);
  }

  private getTasksByStatus(status: TaskStatus): Task[] {
    return this.tasks.filter((t) => t.status === status);
  }

  // ============================================================
  // ربط الأحداث (Event Binding)
  // ============================================================

  private bindEvents(): void {
    this.addTaskBtn.addEventListener("click", () => this.openModal());
    this.closeModalBtn.addEventListener("click", () => this.closeModal());
    this.cancelBtn.addEventListener("click", () => this.closeModal());

    // قفل المودال لما تدوس بره الصندوق الأبيض
    this.modalOverlay.addEventListener("click", (e) => {
      if (e.target === this.modalOverlay) this.closeModal();
    });

    // قفل المودال بزرار Escape
    document.addEventListener("keydown", (e) => {
      if (e.key === "Escape" && !this.modalOverlay.classList.contains("hidden")) {
        this.closeModal();
      }
    });

    // عداد الحروف في الوصف
    this.descriptionInput.addEventListener("input", () => {
      const length = this.descriptionInput.value.length;
      this.charCount.textContent = `${length}/${VALIDATION_RULES.description.maxLength}`;

      if (length > VALIDATION_RULES.description.maxLength) {
        this.charCount.classList.add("text-red-500");
        this.charCount.classList.remove("text-slate-400");
      } else {
        this.charCount.classList.remove("text-red-500");
        this.charCount.classList.add("text-slate-400");
      }
    });

    // مسح رسالة الخطأ لما المستخدم يبدأ يكتب تاني
    this.titleInput.addEventListener("input", () =>
      this.clearFieldError(this.titleInput, this.titleError)
    );
    this.dueDateInput.addEventListener("input", () =>
      this.clearFieldError(this.dueDateInput, this.dateError)
    );

    // إرسال الفورم
    this.formElement.addEventListener("submit", (e) => {
      e.preventDefault();
      this.handleFormSubmit();
    });

    // Event Delegation لكل الأزرار الموجودة جوه الكروت (Edit / Delete / Status)
    this.columnsContainer.addEventListener("click", (e) => {
      const target = e.target as HTMLElement;

      if (target.classList.contains("status-btn")) {
        const taskId = target.dataset.taskId;
        const status = target.dataset.status as TaskStatus | undefined;
        if (taskId && status) this.updateTaskStatus(taskId, status);
      }

      if (target.classList.contains("delete-btn")) {
        const taskId = target.dataset.taskId;
        if (taskId) this.deleteTask(taskId);
      }

      if (target.classList.contains("edit-btn")) {
        const taskId = target.dataset.taskId;
        if (taskId) this.openEditModal(taskId);
      }
    });
  }

  // ============================================================
  // التحكم في المودال
  // ============================================================

  private openModal(): void {
    this.editingTaskId = null;
    this.setModalMode("add");
    this.modalOverlay.classList.remove("hidden");
    this.modalOverlay.classList.add("flex");
    document.body.style.overflow = "hidden";
    this.titleInput.focus();
  }

  private openEditModal(taskId: string): void {
    const task = this.getTaskById(taskId);
    if (!task) return;

    this.editingTaskId = taskId;
    this.setModalMode("edit");

    this.titleInput.value = task.title;
    this.descriptionInput.value = task.description;
    this.dueDateInput.value = task.dueDate;
    this.prioritySelect.value = task.priority;
    this.charCount.textContent = `${task.description.length}/${VALIDATION_RULES.description.maxLength}`;

    this.modalOverlay.classList.remove("hidden");
    this.modalOverlay.classList.add("flex");
    document.body.style.overflow = "hidden";
    this.titleInput.focus();
  }

  private setModalMode(mode: "add" | "edit"): void {
    const submitIcon = this.submitBtn.querySelector("i");

    if (mode === "add") {
      this.modalTitle.textContent = "Create New Task";
      this.modalIcon.className = "fa-solid fa-plus-circle text-indigo-500";
      this.submitBtnText.textContent = "Add Task";
      submitIcon?.classList.replace("fa-save", "fa-plus");
    } else {
      this.modalTitle.textContent = "Edit Task";
      this.modalIcon.className = "fa-solid fa-pen-to-square text-indigo-500";
      this.submitBtnText.textContent = "Save Changes";
      submitIcon?.classList.replace("fa-plus", "fa-save");
    }
  }

  private closeModal(): void {
    this.editingTaskId = null;
    this.modalOverlay.classList.add("hidden");
    this.modalOverlay.classList.remove("flex");
    document.body.style.overflow = "";
    this.formElement.reset();
    this.charCount.textContent = `0/${VALIDATION_RULES.description.maxLength}`;
    this.clearAllErrors();
  }

  // ============================================================
  // التحقق من صحة الفورم (Validation)
  // ============================================================

  private validateForm(): boolean {
    let isValid = true;
    this.clearAllErrors();

    // التحقق من العنوان
    const title = this.titleInput.value.trim();
    if (!title) {
      this.showFieldError(this.titleInput, this.titleError, "Task title is required");
      isValid = false;
    } else if (title.length < VALIDATION_RULES.title.minLength) {
      this.showFieldError(
        this.titleInput,
        this.titleError,
        `Title must be at least ${VALIDATION_RULES.title.minLength} characters`
      );
      isValid = false;
    } else if (title.length > VALIDATION_RULES.title.maxLength) {
      this.showFieldError(
        this.titleInput,
        this.titleError,
        `Title must be less than ${VALIDATION_RULES.title.maxLength} characters`
      );
      isValid = false;
    }

    // التحقق من تاريخ الاستحقاق (منمنعش تاريخ فات)
    const dueDate = this.dueDateInput.value;
    if (dueDate) {
      const selectedDate = new Date(dueDate);
      const today = new Date();
      today.setHours(0, 0, 0, 0);

      if (selectedDate < today) {
        this.showFieldError(this.dueDateInput, this.dateError, "Due date cannot be in the past");
        isValid = false;
      }
    }

    // التحقق من طول الوصف
    if (this.descriptionInput.value.length > VALIDATION_RULES.description.maxLength) {
      this.showFieldError(
        this.descriptionInput,
        this.descriptionError,
        `Description must be less than ${VALIDATION_RULES.description.maxLength} characters`
      );
      isValid = false;
    }

    return isValid;
  }

  private showFieldError(
    input: HTMLElement,
    errorElement: HTMLElement,
    message: string
  ): void {
    input.classList.add("border-red-500", "focus:ring-red-500", "focus:border-red-500");
    input.classList.remove("border-slate-300", "focus:ring-indigo-500", "focus:border-indigo-500");
    errorElement.textContent = message;
    errorElement.classList.remove("hidden");
  }

  private clearFieldError(input: HTMLElement, errorElement: HTMLElement): void {
    input.classList.remove("border-red-500", "focus:ring-red-500", "focus:border-red-500");
    input.classList.add("border-slate-300", "focus:ring-indigo-500", "focus:border-indigo-500");
    errorElement.classList.add("hidden");
  }

  private clearAllErrors(): void {
    this.clearFieldError(this.titleInput, this.titleError);
    this.clearFieldError(this.dueDateInput, this.dateError);
    this.clearFieldError(this.descriptionInput, this.descriptionError);
  }

  private handleFormSubmit(): void {
    if (!this.validateForm()) return;

    const formData: TaskFormData = {
      title: this.titleInput.value,
      description: this.descriptionInput.value,
      dueDate: this.dueDateInput.value,
      priority: this.prioritySelect.value as TaskFormData["priority"],
    };

    if (this.editingTaskId) {
      this.updateTask(this.editingTaskId, formData);
      this.closeModal();
      this.showNotification("Task updated successfully!", "success");
    } else {
      this.addTask(formData);
      this.closeModal();
      this.showNotification("Task added successfully!", "success");
    }
  }

  // ============================================================
  // الرسم (Rendering)
  // ============================================================

  private render(): void {
    this.columnsContainer.innerHTML = "";
    COLUMNS.forEach((column) => {
      const columnElement = this.createColumnElement(column);
      this.columnsContainer.appendChild(columnElement);
    });
  }

  private createColumnElement(column: (typeof COLUMNS)[number]): HTMLElement {
    const columnEl = document.createElement("div");
    columnEl.className =
      "bg-white/60 backdrop-blur-sm rounded-2xl p-5 flex flex-col min-h-[500px] border border-slate-200/50 shadow-sm";
    columnEl.dataset.status = column.id;

    const tasksInColumn = this.getTasksByStatus(column.id);

    const columnStyles: Record<TaskStatus, { icon: string; bg: string; border: string }> = {
      [TaskStatus.ToDo]: { icon: "text-slate-500", bg: "bg-slate-100", border: "border-slate-200" },
      [TaskStatus.InProgress]: { icon: "text-amber-500", bg: "bg-amber-50", border: "border-amber-200" },
      [TaskStatus.Completed]: { icon: "text-emerald-500", bg: "bg-emerald-50", border: "border-emerald-200" },
    };
    const style = columnStyles[column.id];

    columnEl.innerHTML = `
      <div class="flex items-center gap-3 mb-5">
        <div class="w-10 h-10 ${style.bg} rounded-xl flex items-center justify-center">
          <i class="${column.icon} ${style.icon} text-lg"></i>
        </div>
        <div class="flex-1">
          <h2 class="font-semibold text-slate-800">${column.title}</h2>
          <p class="text-xs text-slate-400">${tasksInColumn.length} ${
      tasksInColumn.length === 1 ? "task" : "tasks"
    }</p>
        </div>
      </div>
      <div class="flex-1 flex flex-col gap-4 overflow-y-auto pr-1 -mr-1" id="tasks-${column.id}">
        ${
          tasksInColumn.length === 0
            ? `<div class="flex flex-col items-center justify-center py-12 text-slate-400">
                <i class="fa-regular fa-folder-open text-4xl mb-3 opacity-50"></i>
                <p class="text-sm">No tasks yet</p>
                <p class="text-xs mt-1">Click + to add one</p>
              </div>`
            : tasksInColumn.map((task) => this.createTaskCardHTML(task)).join("")
        }
      </div>
    `;

    return columnEl;
  }

  private createTaskCardHTML(task: Task): string {
    const formattedDueDate = task.dueDate
      ? new Date(task.dueDate).toLocaleDateString("en-US", { month: "short", day: "numeric" })
      : "";

    const isOverdue =
      !!task.dueDate && new Date(task.dueDate) < new Date() && task.status !== TaskStatus.Completed;
    const isDueSoon =
      !!task.dueDate && !isOverdue && this.isDueSoon(task.dueDate) && task.status !== TaskStatus.Completed;
    const isCompleted = task.status === TaskStatus.Completed;

    const priorityStyles: Record<
      Task["priority"],
      { bg: string; text: string; dot: string; label: string }
    > = {
      high: { bg: "bg-red-50", text: "text-red-600", dot: "bg-red-500", label: "High Priority" },
      medium: { bg: "bg-amber-50", text: "text-amber-600", dot: "bg-amber-500", label: "Medium" },
      low: { bg: "bg-blue-50", text: "text-blue-600", dot: "bg-blue-500", label: "Low" },
    };
    const priority = priorityStyles[task.priority || "medium"];

    const timeAgo = this.getTimeAgo(task.createdAt);
    const taskNumber = this.getTaskNumber(task.id);

    const statusDotColor: Record<TaskStatus, string> = {
      [TaskStatus.ToDo]: "bg-slate-300",
      [TaskStatus.InProgress]: "bg-amber-400",
      [TaskStatus.Completed]: "bg-emerald-500",
    };

    return `
      <div class="group bg-white rounded-xl p-4 shadow-sm border border-slate-100 hover:shadow-md hover:border-slate-200 transition-all duration-200 ${
        isOverdue ? "ring-2 ring-red-100 border-red-200" : ""
      } ${isCompleted ? "opacity-75" : ""}" data-task-id="${task.id}">

        <!-- الشريط العلوي -->
        <div class="flex items-center justify-between mb-3">
          <div class="flex items-center gap-2">
            <span class="w-2 h-2 rounded-full ${statusDotColor[task.status]}"></span>
            <span class="text-[10px] font-medium text-slate-400 uppercase tracking-wider">#${taskNumber}</span>
          </div>
          <div class="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
            <button class="edit-btn text-slate-400 hover:text-indigo-500 hover:bg-indigo-50 w-7 h-7 rounded-lg flex items-center justify-center transition-colors" data-task-id="${task.id}" title="Edit task">
              <i class="fa-solid fa-pen text-xs pointer-events-none"></i>
            </button>
            <button class="delete-btn text-slate-400 hover:text-red-500 hover:bg-red-50 w-7 h-7 rounded-lg flex items-center justify-center transition-colors" data-task-id="${task.id}" title="Delete task">
              <i class="fa-solid fa-trash-can text-xs pointer-events-none"></i>
            </button>
          </div>
        </div>

        <!-- العنوان -->
        <h3 class="font-semibold text-slate-800 mb-2 leading-snug ${isCompleted ? "line-through text-slate-500" : ""}">
          ${this.escapeHtml(task.title)}
        </h3>

        <!-- الوصف -->
        ${
          task.description
            ? `<p class="text-slate-500 text-sm mb-4 leading-relaxed line-clamp-2">${this.escapeHtml(
                task.description
              )}</p>`
            : ""
        }

        <!-- التاجات -->
        <div class="flex flex-wrap items-center gap-2 mb-4">
          <span class="${priority.bg} ${priority.text} text-[10px] font-semibold px-2 py-1 rounded-full flex items-center gap-1.5 uppercase tracking-wide">
            <span class="w-1.5 h-1.5 rounded-full ${priority.dot}"></span>
            ${priority.label}
          </span>

          ${
            isOverdue
              ? `<span class="bg-red-100 text-red-600 text-[10px] font-semibold px-2 py-1 rounded-full uppercase tracking-wide flex items-center gap-1">
                  <i class="fa-solid fa-triangle-exclamation"></i> Overdue
                </span>`
              : ""
          }

          ${
            isDueSoon
              ? `<span class="bg-orange-100 text-orange-600 text-[10px] font-semibold px-2 py-1 rounded-full uppercase tracking-wide">Due Soon</span>`
              : ""
          }

          ${
            isCompleted
              ? `<span class="bg-emerald-100 text-emerald-600 text-[10px] font-semibold px-2 py-1 rounded-full uppercase tracking-wide flex items-center gap-1">
                  <i class="fa-solid fa-check"></i> Done
                </span>`
              : ""
          }
        </div>

        <!-- معلومات إضافية -->
        <div class="flex items-center gap-3 text-xs text-slate-400 pb-3 mb-3 border-b border-slate-100">
          ${
            formattedDueDate
              ? `<div class="flex items-center gap-1.5 ${
                  isOverdue ? "text-red-500" : isDueSoon ? "text-orange-500" : ""
                }">
                  <i class="fa-regular fa-calendar"></i>
                  <span>${formattedDueDate}</span>
                </div>`
              : ""
          }
          <div class="flex items-center gap-1.5" title="Created ${new Date(task.createdAt).toLocaleString()}">
            <i class="fa-regular fa-clock"></i>
            <span>${timeAgo}</span>
          </div>
        </div>

        <!-- أزرار التحكم -->
        <div class="flex flex-wrap gap-2">
          ${this.getStatusButtonsHTML(task)}
        </div>
      </div>
    `;
  }

  /** بيتأكد هل تاريخ الاستحقاق قريب (خلال DUE_SOON_DAYS) */
  private isDueSoon(dueDate: string): boolean {
    const due = new Date(dueDate);
    const now = new Date();
    const daysRemaining = Math.ceil((due.getTime() - now.getTime()) / TIME.DAY);
    return daysRemaining >= 0 && daysRemaining <= TIME.DUE_SOON_DAYS;
  }

  /** رقم تسلسلي للمهمة زي #001 حسب مكانها في المصفوفة */
  private getTaskNumber(taskId: string): string {
    const index = this.tasks.findIndex((t) => t.id === taskId);
    return String(index + 1).padStart(3, "0");
  }

  /** بيحول تاريخ الإنشاء لنص "من كام وقت" (Just now, 5m ago, ...) */
  private getTimeAgo(createdAt: string): string {
    const created = new Date(createdAt);
    const diffMs = new Date().getTime() - created.getTime();

    const minutes = Math.floor(diffMs / TIME.MINUTE);
    const hours = Math.floor(diffMs / TIME.HOUR);
    const days = Math.floor(diffMs / TIME.DAY);

    if (minutes < 1) return "Just now";
    if (minutes < 60) return `${minutes}m ago`;
    if (hours < 24) return `${hours}h ago`;
    if (days < TIME.WEEK_DAYS) return `${days}d ago`;

    return created.toLocaleDateString("en-US", { month: "short", day: "numeric" });
  }

  /** بيبني أزرار تغيير الحالة المناسبة (كل حالة غير حالة المهمة الحالية) */
  private getStatusButtonsHTML(task: Task): string {
    const buttons: string[] = [];
    const baseClasses =
      "text-[11px] px-3 py-2 rounded-lg font-semibold transition-all duration-200 flex items-center gap-1.5 hover:scale-105 active:scale-95";

    if (task.status !== TaskStatus.ToDo) {
      buttons.push(`
        <button class="status-btn ${baseClasses} bg-slate-100 text-slate-600 hover:bg-slate-200 hover:text-slate-700" data-task-id="${task.id}" data-status="${TaskStatus.ToDo}">
          <i class="fa-solid fa-arrow-rotate-left pointer-events-none"></i> <span class="pointer-events-none">To Do</span>
        </button>
      `);
    }

    if (task.status !== TaskStatus.InProgress) {
      buttons.push(`
        <button class="status-btn ${baseClasses} bg-amber-100 text-amber-700 hover:bg-amber-200" data-task-id="${task.id}" data-status="${TaskStatus.InProgress}">
          <i class="fa-solid fa-play pointer-events-none"></i> <span class="pointer-events-none">Start</span>
        </button>
      `);
    }

    if (task.status !== TaskStatus.Completed) {
      buttons.push(`
        <button class="status-btn ${baseClasses} bg-emerald-100 text-emerald-700 hover:bg-emerald-200" data-task-id="${task.id}" data-status="${TaskStatus.Completed}">
          <i class="fa-solid fa-check pointer-events-none"></i> <span class="pointer-events-none">Complete</span>
        </button>
      `);
    }

    return buttons.join("");
  }

  /** بيهرب أي HTML جوه نص المستخدم عشان يمنع أي XSS */
  private escapeHtml(text: string): string {
    const div = document.createElement("div");
    div.textContent = text;
    return div.innerHTML;
  }

  /** بيعرض إشعار صغير فوق الصفحة (Toast) ويختفي لوحده */
  private showNotification(message: string, type: NotificationType): void {
    document.querySelector(".notification")?.remove();

    const notification = document.createElement("div");
    notification.className = `notification ${type}`;
    notification.textContent = message;
    document.body.appendChild(notification);

    setTimeout(() => {
      notification.classList.add("fade-out");
      setTimeout(() => notification.remove(), TIME.FADE_OUT_DURATION);
    }, TIME.NOTIFICATION_DURATION);
  }
}

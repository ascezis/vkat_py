/**
 * Контракты схем учебного контента, задач и хранилища «вкат.py».
 *
 * Файл подключается через jsconfig.json (см. TECH-DEBT P2): IDE подхватывает
 * эти типы для автодополнения и подсветки опечаток в схемах — например,
 * `explain` вместо `explanation` или `require_ifs` вместо `require_if`
 * подчёркиваются прямо в редакторе, без шага сборки (checkJs: true).
 *
 * Уровни строгости:
 *  - Контент (TaskItem/TaskTest/AstRequirements/...) — строгие интерфейсы:
 *    это основная ценность контрактов, сюда опечатки должны попадать.
 *  - UI-модули (VkatApp/VkatRenderers/VkatProfiles/...) — Record<string, any>:
 *    они смешивают состояние и методы, их контракты — отдельная работа
 *    (см. Sprint 3 в TECH-DEBT). Это осознанная неполнота, не ошибка.
 *
 * Zero-Build: это чистый d.ts, компилировать его не нужно.
 */

// ─── Ambient (окружения без DOM-типов) ──────────────────────────────────────

/** Pyodide loader (assets/pyodide/pyodide.js) — глобальная функция. */
declare function loadPyodide(config?: {
  indexURL?: string;
  checkAPIVersion?: boolean;
  instantiateWasm?: (imports: Record<string, unknown>, successCallback: (instance: unknown, module: unknown) => void) => unknown;
}): Promise<any>;

/** Web Worker global (app/checker-worker.js). */
declare function importScripts(...urls: string[]): void;

/** Node-хвост для vm-запуска: (typeof window !== 'undefined' ? window : global). */
declare var global: any;

// ─── Типы учебных элементов ─────────────────────────────────────────────────

type ItemType = 'theory' | 'quiz' | 'predict' | 'code';
type CodeTier = 'warmup' | 'main' | 'star';

/** AST-требования к коду ученика (анализ в checker.js / checker-worker.js). */
interface AstRequirements {
  require_for?: boolean;
  require_while?: boolean;
  require_loop?: boolean;
  require_def?: boolean;
  require_return?: boolean;
  require_if?: boolean;
  require_try?: boolean;
  require_raise?: boolean;
  /** Запрещённые вызовы функций: ['max', 'min', 'sorted'] */
  forbid_calls?: string[];
  /** Запрещённые вызовы методов: ['isdigit', 'isnumeric'] */
  forbid_methods?: string[];
  /** Обязательные вызовы: ['draw_line'] */
  require_calls?: string[];
}

/**
 * Тест функции в namespace ученика.
 * `call` вычисляется через eval: `"double(7)"`, `"len(count_chars('abca'))"`.
 */
interface TaskTest {
  call?: string;
  /** Ожидаемое возвращаемое значение (float сравнивается с rel_tol=1e-5). */
  returns?: unknown;
  /** Ожидаемый перехваченный stdout вызова. */
  stdout?: string;
  /** Скрытый тест: ученику показывается hint, а не diff вывода. */
  hidden?: boolean;
}

/**
 * Блок теории. Встречаются типы: p, note, code, list, table.
 * У 'list' — items: string[], у 'table' — своя структура, поэтому блок
 * допускает неизвестные поля (index signature) при известных основных.
 */
interface TheoryBlock {
  type: string;
  html?: string;
  code?: string;
  output?: string;
  items?: string[];
  [key: string]: unknown;
}

/**
 * Учебный элемент темы. Обязательны id и type; остальные поля зависят от type.
 */
interface TaskItem {
  id: string;
  type: ItemType;
  title?: string;
  /** Текст условия практического задания. */
  assignment?: string;
  /** Необязательный элемент (★), не блокирует прогресс. */
  tier?: CodeTier;
  optional?: boolean;
  /** Задание-починка: готовый код с ошибкой. */
  kind?: 'fix';

  // theory
  blocks?: TheoryBlock[];

  // quiz
  question?: string;
  options?: string[];
  /** Индекс правильного варианта в options[]. */
  correct?: number;

  // predict
  explanation?: string[];

  // quiz / predict / code
  code?: string;
  /** Стартовая заготовка кода для практического задания (fix-задания). */
  starterCode?: string;
  /**
   * Мягкий режим (onboarding): при несовпадении expectedOutput любой непустой
   * вывод зачитывается, вместо ошибки показывается наводка на целевую фразу.
   */
  lenientOutput?: boolean;
  expectedOutput?: string;
  explain?: string;

  // code
  tests?: TaskTest[];
  astRequirements?: AstRequirements;
  /** Авторский тест уровня 0: исполняется с доступом к sys/io. */
  testCode?: string;
  testErrorMessage?: string;
  hiddenTestHint?: string;
  improveTip?: string;
  successMessage?: string;
  /** Прогрессивные подсказки: текст, затем {code} с заготовкой. */
  hints?: Array<string | { code: string }>;
}

/** Тема курса (content/core/*.js: window.COURSE_TOPICS.push({...})). */
interface CourseTopic {
  id: string;
  title?: string;
  /** Оценка времени прохождения в минутах. */
  minutes?: number;
  items?: TaskItem[];
  /** Legacy-поля тем «Начало» (app.js читает topic.tasks). */
  stageId?: string;
  tasks?: Array<Record<string, unknown>>;
  [key: string]: unknown;
}

/** Этап курса (content/stages.js: window.COURSE_STAGES = [...]). */
interface CourseStage {
  id: string;
  title?: string;
  description?: string;
  /** id тем этапа в порядке прохождения. */
  topics?: string[];
  /** Тексты финального экрана этапа. */
  finish?: { title?: string; text?: string; [key: string]: unknown };
  [key: string]: unknown;
}

/** Эталон и неправильные решения для самопроверки курса (dev/selftest). */
interface SelftestEntry {
  reference: string;
  wrong: Array<[string, string]>;
}

// ─── Профили и хранилище (app/storage.js) ───────────────────────────────────

interface ProfilePosition {
  topicId: string;
  itemId: string;
}

interface ProfileData {
  schema: number;
  completed: string[];
  drafts: Record<string, string>;
  position: ProfilePosition;
  updated: number;
  /** HMAC-подпись массива completed (Issue #10). */
  sig?: string;
}

interface ProfileMeta {
  id: string;
  name: string;
  pinHash?: string;
  created: number;
  lastUsed: number;
}

/** Экспортируемый бандл профиля (exportProfile/importProfile). */
interface ProfileExportBundle {
  vkat_export_version: number;
  vkat_app_version: string;
  exportedAt: string;
  profile: { id: string; name: string; created: number };
  data: ProfileData | null;
}

// ─── Чекер (app/checker.js) ─────────────────────────────────────────────────

interface CheckResult {
  passed: boolean;
  title: string;
  sub: string;
  stdout: string;
  improveTips: string[];
  isSyntaxError?: boolean;
  isRuntimeError?: boolean;
  isSandboxError?: boolean;
  friendlyExplain?: string | null;
  failedTest?: {
    call: string;
    expected: unknown;
    actual: unknown;
    type: string;
    hidden: boolean;
  };
}

/** Минимальный контракт PyodideWorkerBridge для тестов и отладки. */
interface PyodideWorkerBridgeLike {
  DEFAULT_TIMEOUT_MS: number;
  INIT_TIMEOUT_MS: number;
  MAX_CONSECUTIVE_CRASHES: number;
  worker: Worker | null;
  isReady: boolean;
  useFallback: boolean;
  ensureReady(): Promise<boolean>;
  checkSolution(code: string, task: TaskItem, timeoutMs?: number): Promise<CheckResult>;
  runCode(code: string, timeoutMs?: number): Promise<{ stdout: string; error: string | null }>;
}

interface CodeCheckerApi {
  getBridge(): PyodideWorkerBridgeLike;
  PyodideWorkerBridge: { new (): PyodideWorkerBridgeLike };
  initPyodide(onProgress?: (msg: string) => void): Promise<boolean>;
  fallbackInitPyodideInThread(onProgress?: (msg: string) => void): Promise<boolean | any>;
  checkSolution(userCode: string, task: TaskItem, timeoutMs?: number): Promise<CheckResult>;
  runCode(code: string, timeoutMs?: number): Promise<{ stdout: string; error: string | null }>;
  fuzzyMatchOutputJS(actual: string, expected: string): { match: boolean; tip: string | null };
}

// ─── Глобальные объекты приложения (window.*) ───────────────────────────────
// UI-модули осознанно Record<string, any>: их внутреннее состояние (DOM-кэш,
// флаги, модалки) не имеет зафиксированного контракта — фиксация типов для
// каждого модуля отдельная задача (TECH-DEBT Sprint 3+). Контракты есть у
// модулей, у которых они реально помогают: storage, checker, контент.

interface Window {
  VKAT_VERSION?: string;
  COURSE_STAGES?: CourseStage[];
  COURSE_TOPICS?: CourseTopic[];
  COURSE_SELFTEST?: Record<string, SelftestEntry>;
  CHEATSHEET_SECTIONS?: Array<Record<string, unknown>>;
  PYODIDE_WASM_BASE64?: string;
  PYODIDE_STDLIB_BASE64?: string;
  VKAT_CONNECT_ENDPOINT?: string;

  FriendlyErrors?: { explain(raw: string): string | null };
  CodeHints?: Record<string, any>;
  /** Класс автоинтеллекта редактора (new CodeIntelliSense(textarea, popup)). */
  CodeIntelliSense?: any;
  /** Класс подсветки Python (new PythonHighlighter(editor, highlight)). */
  PythonHighlighter?: any;
  Glyphs?: Record<string, any>;
  VkatGridWarp?: Record<string, any>;

  VkatStorage?: VkatStorageApi;
  CodeChecker?: CodeCheckerApi;

  // UI-модули — смешанное состояние + методы, контракт не зафиксирован
  VkatApp?: Record<string, any>;
  VkatRenderers?: Record<string, any>;
  VkatCheckers?: Record<string, any>;
  VkatProfiles?: Record<string, any>;
  VkatConnect?: Record<string, any>;
  VkatStorage?: Record<string, any>;
}

/** Минимальный контракт VkatStorage для IntelliSense. */
interface VkatStorageApi {
  KEYS: Record<string, string>;
  listProfiles(): Promise<ProfileMeta[]>;
  createProfile(name: string, pin?: string): Promise<ProfileMeta>;
  deleteProfile(id: string): Promise<void>;
  selectProfile(id: string, pin?: string): Promise<ProfileData>;
  getActiveProfileSync(): ProfileMeta | null;
  getActiveProfile(): Promise<ProfileMeta | null>;
  clearActiveProfile(): void;
  getLastProfileId(): string | null;
  getProgressCount(id: string): number;
  load(): Promise<ProfileData>;
  save(patch: Partial<Pick<ProfileData, 'completed' | 'drafts' | 'position'>>): Promise<void>;
  saveDraftDebounced(taskId: string, code: string): void;
  flushSync(): void;
  checkLegacyData(): boolean;
  migrateLegacyToProfile(profileId: string, stages?: CourseStage[], topics?: CourseTopic[]): Promise<void>;
  exportProfile(id: string): Promise<ProfileExportBundle>;
  importProfile(jsonString: string): Promise<ProfileMeta>;
  resetAll(): Promise<void>;
  getSetting(key: string, defaultValue?: unknown): unknown;
  setSetting(key: string, value: unknown): void;
  getOutbox(): Array<Record<string, unknown>>;
  setOutbox(items: Array<Record<string, unknown>>): void;
}

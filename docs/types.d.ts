/**
 * Контракты схем учебного контента, задач и хранилища «вкат.py».
 *
 * Файл подключается через jsconfig.json (см. TECH-DEBT P2): IDE подхватывает
 * эти типы автоматически для автодополнения и подсветки опечаток в схемах —
 * например, `explain` вместо `explanation` или `require_ifs` вместо
 * `require_if` подчёркиваются прямо в редакторе, без шага сборки.
 *
 * Чтобы включить проверку в отдельном файле вручную (даже без checkJs),
 * добавьте в его начало директиву `// @ts-check`.
 *
 * Zero-Build: это чистый d.ts, компилировать его не нужно.
 */

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

/** Блок теории: абзац, врезка или исполняемый пример кода. */
interface TheoryBlock {
  type: 'p' | 'note' | 'code';
  html?: string;
  code?: string;
  output?: string;
}

/**
 * Учебный элемент темы. Обязательны id и type; остальные поля зависят от type.
 */
interface TaskItem {
  id: string;
  type: ItemType;
  title?: string;
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
  initialCode?: string;
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
  hints?: [string, string, string];
}

interface CourseTopic {
  id: string;
  title?: string;
  items: TaskItem[];
}

interface CourseStage {
  id: string;
  topics: string[];
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

// ─── Глобальные объекты приложения (window.*) ───────────────────────────────

/** Минимальный контракт VkatStorage для IntelliSense. */
interface VkatStorageApi {
  listProfiles(): Promise<ProfileMeta[]>;
  createProfile(name: string, pin?: string): Promise<ProfileMeta>;
  deleteProfile(id: string): Promise<void>;
  selectProfile(id: string, pin?: string): Promise<ProfileData>;
  getActiveProfileSync(): ProfileMeta | null;
  getActiveProfile(): Promise<ProfileMeta | null>;
  clearActiveProfile(): void;
  getProgressCount(id: string): number;
  load(): Promise<ProfileData>;
  save(patch: Partial<Pick<ProfileData, 'completed' | 'drafts' | 'position'>>): Promise<void>;
  saveDraftDebounced(taskId: string, code: string): void;
  flushSync(): void;
  getSetting(key: string, defaultValue?: unknown): unknown;
  setSetting(key: string, value: unknown): void;
}

/** Минимальный контракт CodeChecker (app/checker.js). */
interface CodeCheckerApi {
  initPyodide(onProgress?: (msg: string) => void): Promise<boolean>;
  checkSolution(userCode: string, task: TaskItem, timeoutMs?: number): Promise<CheckResult>;
  runCode(code: string, timeoutMs?: number): Promise<{ stdout: string; error: string | null }>;
}

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

interface Window {
  VKAT_VERSION?: string;
  COURSE_STAGES?: CourseStage[];
  COURSE_TOPICS?: CourseTopic[];
  COURSE_SELFTEST?: Record<string, SelftestEntry>;
  CHEATSHEET_SECTIONS?: Array<Record<string, unknown>>;
  FriendlyErrors?: { explain(raw: string): string | null };
  CodeHints?: Record<string, (...args: unknown[]) => unknown>;
  VkatStorage?: VkatStorageApi;
  CodeChecker?: CodeCheckerApi;
  VkatCheckers?: Record<string, (...args: unknown[]) => unknown>;
  VkatConnect?: Record<string, (...args: unknown[]) => unknown>;
  VkatApp?: Record<string, (...args: unknown[]) => unknown>;
}

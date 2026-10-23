/**
 * вкат.py — Проверка учебных заданий (логика «Проверить»)
 *
 * Три независимых обработчика — по одному на каждый тип проверяемого задания:
 *
 *   runCheck()        — code: отправляет код в Pyodide через CodeChecker,
 *                       показывает результат, отмечает задание пройденным.
 *   runPredictCheck() — predict: сравнивает ответ ученика с фактическим выводом
 *                       (или с полем expectedOutput), засчитывает после первой отправки.
 *   runQuizCheck()    — quiz: сверяет выбранный вариант с task.correct,
 *                       разрешает повторную попытку при ошибке.
 *
 * Зависимости (глобальные):
 *   window.VkatApp.dom           — кэш DOM-элементов
 *   window.VkatApp.state         — состояние приложения
 *   window.VkatApp.getCurrentTask()        — текущий элемент
 *   window.VkatApp.saveStorage()           — сохранение прогресса
 *   window.VkatApp.updateCourseProgress()  — обновление прогресс-бара
 *   window.VkatRenderers.renderStepDots()  — обновление точек шагов
 *   window.CodeChecker           — движок Pyodide (checker.js)
 */

(function (window) {
  'use strict';

  // ─── Утилита: показать результат на экране ──────────────────────────────────
  // На ноутбуках 1366×768 результат проверки оказывался ниже видимой области панели.
  // Показываем блок целиком, если он помещается (иначе — хотя бы строку результата),
  // чтобы кнопки «Проверить / Следующее» остались на виду.
  function revealResult(box) {
    if (!box || !box.scrollIntoView) return;
    const pane = box.closest('.pane');
    const fits = pane && box.offsetHeight < pane.clientHeight - 100;
    const target = fits ? box : (box.querySelector('.result-row') || box);
    const reduce = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    requestAnimationFrame(() => target.scrollIntoView({ block: 'nearest', behavior: reduce ? 'auto' : 'smooth' }));
  }

  // ─── Утилита: нормализация строки вывода ────────────────────────────────────

  function normalize(str) {
    if (!str) return '';
    return str
      .replace(/\r\n/g, '\n')
      .split('\n')
      .map(line => line.trimEnd())
      .join('\n')
      .trim();
  }

  // ─── Проверка Code ────────────────────────────────────────────────────────────

  /**
   * Запускает решение ученика через CodeChecker.checkSolution().
   * При успехе — отмечает задание пройденным и показывает кнопку «Дальше».
   * При ошибке — показывает трассировку и дружелюбное объяснение (FriendlyErrors).
   */
  async function runCheck() {
    const dom = window.VkatApp.dom;
    const state = window.VkatApp.state;
    const task = window.VkatApp.getCurrentTask();
    if (!task || state.isChecking) return;

    state.isChecking = true;
    dom.btnRun.disabled = true;
    dom.btnRun.textContent = 'Проверяем...';

    try {
      const code = dom.editor.value;
      const result = await window.CodeChecker.checkSolution(code, task);

      dom.resultBox.classList.add('visible');
      revealResult(dom.resultBox);

      if (result.passed) {
        // Успех
        dom.resultMark.className = 'result-mark ok';
        dom.resultMark.textContent = '✓';
        dom.resultTitle.className = 'result-title';
        dom.resultTitle.textContent = result.title;
        dom.resultSub.textContent = result.sub;
        dom.errorExplain.style.display = 'none';

        // Отмечаем задачу выполненной
        state.completedTasks.add(task.id);
        window.VkatApp.saveStorage();
        window.VkatApp.updateCourseProgress();
        window.VkatRenderers.renderStepDots(state.topics[state.currentTopicIndex]);

        // Консоль
        if (result.stdout && result.stdout.trim().length > 0) {
          dom.consoleOut.style.display = 'block';
          dom.consoleOut.className = 'console';
          dom.consoleOut.textContent = result.stdout;
        } else {
          dom.consoleOut.style.display = 'none';
        }

        // Блок "Как сделать лучше"
        if (result.improveTips && result.improveTips.length > 0) {
          dom.improveBox.classList.add('visible');
          dom.improveContent.innerHTML = result.improveTips.map(tip => `<p>${tip}</p>`).join('');
        } else {
          dom.improveBox.classList.remove('visible');
        }

        // Кнопка перехода к следующему заданию
        dom.btnNext.style.display = 'inline-block';
        dom.btnNext.focus();
      } else {
        // Ошибка
        dom.resultMark.className = 'result-mark err';
        dom.resultMark.textContent = '×';
        dom.resultTitle.className = 'result-title err';
        dom.resultTitle.textContent = result.title;
        dom.resultSub.textContent = result.sub;

        // Понятное объяснение ошибки, если есть
        if (result.friendlyExplain) {
          dom.errorExplain.style.display = 'block';
          dom.errorExplainText.textContent = result.friendlyExplain;
        } else {
          dom.errorExplain.style.display = 'none';
        }

        // Консоль с трассировкой ошибки
        if (result.stdout && result.stdout.trim().length > 0) {
          dom.consoleOut.style.display = 'block';
          dom.consoleOut.className = 'console err';
          dom.consoleOut.textContent = result.stdout;
        } else {
          dom.consoleOut.style.display = 'none';
        }

        dom.improveBox.classList.remove('visible');
        dom.btnNext.style.display = 'none';
      }
    } catch (err) {
      console.error('Ошибка проверки:', err);
      dom.resultBox.classList.add('visible');
      dom.resultMark.className = 'result-mark err';
      dom.resultMark.textContent = '×';
      dom.resultTitle.className = 'result-title err';
      dom.resultTitle.textContent = 'Ошибка среды выполнения Python';
      dom.resultSub.textContent = err.message || String(err);
      dom.errorExplain.style.display = 'none';
      dom.consoleOut.style.display = 'none';
      dom.improveBox.classList.remove('visible');
      dom.btnNext.style.display = 'none';
    } finally {
      state.isChecking = false;
      dom.btnRun.disabled = false;
      dom.btnRun.textContent = 'Проверить';
    }
  }

  // ─── Проверка Predict ────────────────────────────────────────────────────────

  /**
   * Запускает проверку предсказания.
   * Приоритет источника ответа: task.expectedOutput → реальный запуск через Pyodide.
   * Засчитывает задание после ПЕРВОЙ отправки независимо от верности ответа.
   */
  async function runPredictCheck() {
    const dom = window.VkatApp.dom;
    const state = window.VkatApp.state;
    const task = window.VkatApp.getCurrentTask();
    if (!task) return;

    dom.btnPredictCheck.disabled = true;
    dom.btnPredictCheck.textContent = 'Запускаем...';

    try {
      let actualVal = '';
      if (typeof task.expectedOutput === 'string') {
        actualVal = normalize(task.expectedOutput);
      } else if (window.CodeChecker && typeof window.CodeChecker.runCode === 'function') {
        const runRes = await window.CodeChecker.runCode(task.code);
        actualVal = normalize(runRes.stdout);
      }

      const userVal = normalize(dom.predictInput.value);

      // Сохраняем черновик ответа
      state.codeDrafts[task.id] = dom.predictInput.value;

      // Элемент считается пройденным после первой отправки (не блокирует!)
      state.completedTasks.add(task.id);
      window.VkatApp.saveStorage();
      window.VkatApp.updateCourseProgress();
      window.VkatRenderers.renderStepDots(state.topics[state.currentTopicIndex]);

      dom.predictResultBox.classList.add('visible');
      revealResult(dom.predictResultBox);

      const isMatch = userVal === actualVal;
      if (isMatch) {
        dom.predictResultMark.className = 'result-mark ok';
        dom.predictResultMark.textContent = '✓';
        dom.predictResultTitle.className = 'result-title';
        dom.predictResultTitle.textContent = 'Ответ совпал';
        dom.predictResultSub.textContent = `Фактический вывод:\n${actualVal || '(пустая строка)'}`;
      } else {
        dom.predictResultMark.className = 'result-mark err';
        dom.predictResultMark.textContent = '×';
        dom.predictResultTitle.className = 'result-title err';
        dom.predictResultTitle.textContent = 'Ответ отличается от фактического вывода';

        let diffMsg = `Твой ответ:\n${userVal || '(пусто)'}\n\nФактический вывод программы:\n${actualVal || '(пусто)'}`;
        if (actualVal.includes('\n') && !userVal.includes('\n')) {
          diffMsg += '\n\nПодсказка: каждый вызов print() выводит значение с новой строки.';
        } else if (
          (userVal.startsWith('"') && userVal.endsWith('"')) ||
          (userVal.startsWith("'") && userVal.endsWith("'"))
        ) {
          const stripped = userVal.slice(1, -1);
          if (stripped === actualVal) {
            diffMsg += '\n\nПодсказка: функция print() выводит текст строки без кавычек.';
          }
        }
        dom.predictResultSub.textContent = diffMsg;
      }

      dom.predictExplainContent.textContent = task.explain || '';
      dom.btnPredictNext.style.display = 'inline-block';
      dom.btnPredictNext.focus();
    } catch (err) {
      console.error('Ошибка в predict:', err);
      dom.predictResultBox.classList.add('visible');
      dom.predictResultMark.className = 'result-mark err';
      dom.predictResultMark.textContent = '×';
      dom.predictResultTitle.className = 'result-title err';
      dom.predictResultTitle.textContent = 'Ошибка при проверке';
      dom.predictResultSub.textContent = err.message || String(err);
      dom.btnPredictNext.style.display = 'inline-block';
    } finally {
      dom.btnPredictCheck.disabled = false;
      dom.btnPredictCheck.textContent = 'Проверить';
    }
  }

  // ─── Проверка Quiz ────────────────────────────────────────────────────────────

  /**
   * Проверяет ответ на вопрос с вариантами.
   * Верный ответ: засчитывает задание, показывает «Дальше».
   * Неверный ответ: сообщение об ошибке, можно попробовать снова.
   */
  function runQuizCheck() {
    const dom = window.VkatApp.dom;
    const state = window.VkatApp.state;
    const task = window.VkatApp.getCurrentTask();
    if (!task) return;

    if (state.selectedQuizOption === null) {
      alert('Пожалуйста, выбери вариант ответа.');
      return;
    }

    const isCorrect = state.selectedQuizOption === task.correct;

    dom.quizResultBox.classList.add('visible');
    revealResult(dom.quizResultBox);

    if (isCorrect) {
      dom.quizResultMark.className = 'result-mark ok';
      dom.quizResultMark.textContent = '✓';
      dom.quizResultTitle.className = 'result-title';
      dom.quizResultTitle.textContent = 'Верно!';
      dom.quizResultSub.textContent = 'Правильный вариант выбран.';
      dom.quizExplainContent.textContent = task.explain || '';

      state.completedTasks.add(task.id);
      window.VkatApp.saveStorage();
      window.VkatApp.updateCourseProgress();
      window.VkatRenderers.renderStepDots(state.topics[state.currentTopicIndex]);

      dom.btnQuizNext.style.display = 'inline-block';
      dom.btnQuizNext.focus();
    } else {
      dom.quizResultMark.className = 'result-mark err';
      dom.quizResultMark.textContent = '×';
      dom.quizResultTitle.className = 'result-title err';
      dom.quizResultTitle.textContent = 'Неверно';
      dom.quizResultSub.textContent = 'Подумай ещё и выбери другой вариант ответа.';
      dom.quizExplainContent.textContent = '';
      dom.btnQuizNext.style.display = 'none';
    }
  }

  // ─── Экспорт публичного API ───────────────────────────────────────────────────

  window.VkatCheckers = {
    runCheck,
    runPredictCheck,
    runQuizCheck
  };

})(window);

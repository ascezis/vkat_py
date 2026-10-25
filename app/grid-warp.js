/**
 * вкат.py — Интерактивная «антигравитационная» точечная сетка (Grid Warp)
 * 
 * Точки сетки смещаются от курсора мыши наружу, создавая эффект
 * выпуклой линзы / гравитационной волны, как в Google Antigravity.
 * При бездействии мыши анимация плавно засыпает (0% CPU).
 */
(function (window) {
  'use strict';

  function initGridWarp(canvasEl, containerEl) {
    if (!canvasEl) return null;
    const ctx = canvasEl.getContext('2d');
    if (!ctx) return null;

    const SPACING = 24;          // Шаг сетки (пиксели, совпадает с оригиналом CSS)
    const RADIUS = 560;          // Радиус линзы вокруг курсора
    const MAX_FORCE = 7;        // Максимальное смещение точек наружу
    const REST_COLOR = 'rgba(255, 255, 255, 0.12)';   // Цвет точек в покое (#2a2a2a)
    const DOT_RADIUS = 1.1;      // Базовый радиус точки

    let width = 0;
    let height = 0;
    let dpr = 1;
    let points = [];
    let mouse = { x: -9999, y: -9999, targetX: -9999, targetY: -9999, active: false };
    let isRunning = false;
    let animFrameId = null;
    let idleCounter = 0;

    function resize() {
      const rect = containerEl ? containerEl.getBoundingClientRect() : canvasEl.getBoundingClientRect();
      width = Math.max(Math.floor(rect.width), window.innerWidth || 1200);
      height = Math.max(Math.floor(rect.height), window.innerHeight || 800);
      dpr = Math.min(window.devicePixelRatio || 1, 2);

      canvasEl.width = Math.floor(width * dpr);
      canvasEl.height = Math.floor(height * dpr);
      canvasEl.style.width = width + 'px';
      canvasEl.style.height = height + 'px';

      ctx.setTransform(1, 0, 0, 1, 0, 0);
      ctx.scale(dpr, dpr);

      buildPoints();
      wake();
    }

    function buildPoints() {
      points = [];
      const cols = Math.ceil(width / SPACING) + 2;
      const rows = Math.ceil(height / SPACING) + 2;
      const offsetX = (width - (cols - 1) * SPACING) / 2;
      const offsetY = (height - (rows - 1) * SPACING) / 2;

      for (let r = 0; r < rows; r++) {
        for (let c = 0; c < cols; c++) {
          const x0 = offsetX + c * SPACING;
          const y0 = offsetY + r * SPACING;
          points.push({
            x0: x0,
            y0: y0,
            x: x0,
            y: y0,
            vx: 0,
            vy: 0
          });
        }
      }
    }

    function onMouseMove(e) {
      const rect = canvasEl.getBoundingClientRect();
      mouse.targetX = e.clientX - rect.left;
      mouse.targetY = e.clientY - rect.top;
      mouse.active = true;
      wake();
    }

    function onTouchMove(e) {
      if (!e.touches || e.touches.length === 0) return;
      const t = e.touches[0];
      const rect = canvasEl.getBoundingClientRect();
      mouse.targetX = t.clientX - rect.left;
      mouse.targetY = t.clientY - rect.top;
      mouse.active = true;
      wake();
    }

    function onMouseLeave() {
      mouse.active = false;
      mouse.targetX = -9999;
      mouse.targetY = -9999;
      wake();
    }

    function wake() {
      idleCounter = 0;
      if (!isRunning) {
        isRunning = true;
        loop();
      }
    }

    function loop() {
      if (!isRunning) return;

      // Уважение к системной настройке «меньше движения»
      if (window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
        drawStaticFrame();
        isRunning = false;
        return;
      }

      // Плавное следование фокуса за курсором (lerp)
      if (mouse.active) {
        mouse.x += (mouse.targetX - mouse.x) * 0.22;
        mouse.y += (mouse.targetY - mouse.y) * 0.22;
      } else {
        mouse.x += (-9999 - mouse.x) * 0.15;
        mouse.y += (-9999 - mouse.y) * 0.15;
      }

      ctx.clearRect(0, 0, width, height);

      let maxMotion = 0;
      const radiusSq = RADIUS * RADIUS;
      const activePoints = [];
      const restingPoints = [];

      for (let i = 0; i < points.length; i++) {
        const p = points[i];
        let targetX = p.x0;
        let targetY = p.y0;
        let highlight = 0;

        const dx = p.x0 - mouse.x;
        const dy = p.y0 - mouse.y;
        const distSq = dx * dx + dy * dy;

        if (distSq < radiusSq) {
          const dist = Math.sqrt(distSq);
          const norm = 1 - dist / RADIUS;
          // Плавная выпуклая кривая смещения наружу
          const force = (norm * norm) * MAX_FORCE;
          const angle = Math.atan2(dy, dx);

          targetX = p.x0 + Math.cos(angle) * force;
          targetY = p.y0 + Math.sin(angle) * force;
          highlight = norm;
        }

        // Пружинный возврат к исходной позиции (spring damping)
        const ax = (targetX - p.x) * 0.20;
        const ay = (targetY - p.y) * 0.20;
        p.vx = (p.vx + ax) * 0.72;
        p.vy = (p.vy + ay) * 0.72;
        p.x += p.vx;
        p.y += p.vy;

        const motion = Math.abs(p.vx) + Math.abs(p.vy) + Math.abs(p.x - p.x0) + Math.abs(p.y - p.y0);
        if (motion > maxMotion) maxMotion = motion;

        if (highlight > 0.01) {
          activePoints.push({ x: p.x, y: p.y, highlight });
        } else {
          restingPoints.push(p);
        }
      }

      // Батч-отрисовка точек в покое (один вызов fill на всю сетку)
      ctx.fillStyle = REST_COLOR;
      ctx.beginPath();
      for (let i = 0; i < restingPoints.length; i++) {
        const p = restingPoints[i];
        ctx.moveTo(p.x + DOT_RADIUS, p.y);
        ctx.arc(p.x, p.y, DOT_RADIUS, 0, Math.PI * 2);
      }
      ctx.fill();

      // Отрисовка подсвеченных точек линзы с плавным усилением альфы и размера
      for (let i = 0; i < activePoints.length; i++) {
        const p = activePoints[i];
        const r = DOT_RADIUS + p.highlight * 0.55;
        const alpha = 0.12 + p.highlight * 0.38;
        ctx.fillStyle = `rgba(255, 255, 255, ${alpha.toFixed(2)})`;
        ctx.beginPath();
        ctx.arc(p.x, p.y, r, 0, Math.PI * 2);
        ctx.fill();
      }

      // Засыпание при остановке мыши и стабилизации сетки
      if ((!mouse.active || Math.hypot(mouse.targetX - mouse.x, mouse.targetY - mouse.y) < 0.2) && maxMotion < 0.04) {
        idleCounter++;
        if (idleCounter > 12) {
          isRunning = false;
          drawStaticFrame();
          return;
        }
      } else {
        idleCounter = 0;
      }

      animFrameId = requestAnimationFrame(loop);
    }

    function drawStaticFrame() {
      ctx.clearRect(0, 0, width, height);
      ctx.fillStyle = REST_COLOR;
      ctx.beginPath();
      for (let i = 0; i < points.length; i++) {
        const p = points[i];
        p.x = p.x0;
        p.y = p.y0;
        p.vx = 0;
        p.vy = 0;
        ctx.moveTo(p.x0 + DOT_RADIUS, p.y0);
        ctx.arc(p.x0, p.y0, DOT_RADIUS, 0, Math.PI * 2);
      }
      ctx.fill();
    }

    function pause() {
      isRunning = false;
      if (animFrameId) {
        cancelAnimationFrame(animFrameId);
        animFrameId = null;
      }
    }

    function resume() {
      const rect = containerEl ? containerEl.getBoundingClientRect() : canvasEl.getBoundingClientRect();
      if (Math.abs(rect.width - width) > 10 || Math.abs(rect.height - height) > 10) {
        resize();
      } else {
        wake();
      }
    }

    function destroy() {
      pause();
      window.removeEventListener('resize', resize);
      window.removeEventListener('blur', onMouseLeave);
      document.removeEventListener('mouseleave', onMouseLeave);
      const target = containerEl || window;
      target.removeEventListener('mousemove', onMouseMove);
      target.removeEventListener('mouseleave', onMouseLeave);
      target.removeEventListener('touchstart', onTouchMove);
      target.removeEventListener('touchmove', onTouchMove);
      target.removeEventListener('touchend', onMouseLeave);
    }

    // Слушатели событий
    window.addEventListener('resize', resize, { passive: true });
    window.addEventListener('blur', onMouseLeave, { passive: true });
    document.addEventListener('mouseleave', onMouseLeave, { passive: true });

    const eventTarget = containerEl || window;
    eventTarget.addEventListener('mousemove', onMouseMove, { passive: true });
    eventTarget.addEventListener('mouseleave', onMouseLeave, { passive: true });
    eventTarget.addEventListener('touchstart', onTouchMove, { passive: true });
    eventTarget.addEventListener('touchmove', onTouchMove, { passive: true });
    eventTarget.addEventListener('touchend', onMouseLeave, { passive: true });

    resize();

    return {
      pause,
      resume,
      resize,
      destroy
    };
  }

  window.VkatGridWarp = {
    init: initGridWarp
  };
})(typeof window !== 'undefined' ? window : global);

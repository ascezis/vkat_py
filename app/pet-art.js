/**
 * ПИТОМЕЦ. Контракт арт-компонента (один экземпляр на экран).
 * Подключить styles.css, pet-art.css, pet-art.js. Вставить PetArt.render()
 * в панель. #pet-stage носит ровно один класс позы: pet-egg или
 * pet-state-{hatch,idle,eat,play,sleep,hungry,sad,happy-full,full}.
 * Фаза яйца: дополнительный класс pet-cracks-0..3; после третьей — вылупление.
 * #pet-message — живая реплика (textContent). #pet-status — подпись позы.
 * button[data-pet-action="eat|play|sleep"] — намерение, обрабатывает экран.
 * meter#pet-stat-{food,mood,energy}, #pet-value-{food,mood,energy} —
 * доступное значение и видимый процент. .pet-stat-fill рисует ширину через scaleX.
 * data-pet-level="normal|low|critical" на строке выставляет setStats().
 * Вызывать PetArt.pose(stage, name, message?) при событии. Повторный клик
 * перезапускает такт. После hatch/eat/play рендерер вызывает pose через
 * 1600/1450/1000 мс даже при reduced-motion; отменяет таймер при новом событии.
 * После eat — full; затем оценить статы при следующем изменении модели.
 * PetArt.expression({food,mood,energy}): food < 35 → hungry, mood < 35 → sad,
 * все >= 75 → happy-full, иначе idle. Явные действия и яйцо приоритетнее.
 * Уровни полос: < 20 критичный, < 35 низкий, остальные нормальные.
 * PetArt.cracks(stage, 0..3), PetArt.setStats(stage, {food,mood,energy}).
 * Модуль только отображает переданные значения, не хранит состояние игры.
 */
(() => {
  'use strict';
  const poses = {
    egg: ['Яйцо', 'тук…'], hatch: ['Вылупление', 'я здесь!'],
    idle: ['В покое', 'мррр'], eat: ['Ест', 'ням-ням'], full: ['Сыт', 'ур-р…'],
    play: ['Играет', 'лови искру!'], sleep: ['Спит', 'тише…'],
    hungry: ['Голоден', 'где моя миска?'], sad: ['Грустит', 'посиди со мной…'],
    'happy-full': ['Счастлив', 'мррр!']
  };
  const stats = { food: 'Сытость', mood: 'Настроение', energy: 'Энергия' };
  const actions = [
    ['eat','Кормить','M2 9h12q-1 5-6 5T2 9z M5 6l1-2m3 2 1-3'],
    ['play','Играть','M2 7q0-2 3-2h6q3 0 3 2l1 5q0 2-2 1l-3-2H6l-3 2q-2 1-2-1z M4 8h4m-2-2v4m4-2h1'],
    ['sleep','Спать','M12 12A6 6 0 0 1 5 3a6 6 0 1 0 8 9z']
  ];
  const eye = x => `<g transform="translate(${x} 110)"><g class="pet-blink">
    <ellipse rx="10" ry="15"/><circle class="pet-light" cx="-2" cy="-6" r="3.4"/>
    <path class="pet-accent pet-eye-star" d="M2 0l1.5 3L7 4.5 3.5 6 2 9 .5 6-3 4.5.5 3z"/></g></g>`;
  const sprite = `<svg class="pet-sprite" viewBox="0 0 320 200" aria-hidden="true" focusable="false">
    <path class="pet-platform" d="M47 162h239m-227 4h12m5 0h77m68 0h42"/>
    <ellipse class="pet-shadow" cx="158" cy="159" rx="49" ry="3"/>
    <g class="pet-mood"><g class="pet-actor"><g class="pet-body">
      <path class="pet-light" d="M101 125q1-21 13-38 11-18 32-22 8-2 13-16 3-7 7 2 2 7 0 12 9-3 15-11 5-4 5 3l-3 12q24 7 31 33 3 12 9 23 9 16-2 25-5 4-14 3-6 10-20 7-10 6-23 1-12 5-23 0-16 4-25-5-13 2-20-6-7-9 5-23z"/>
      <path class="pet-shading" d="M96 139q9 11 22 6 9 12 25 6 13 6 23 1 12 5 22-1 14 3 20-6 10 2 17-5-1 14-18 11-6 10-20 7-10 6-23 1-12 5-23 0-16 4-25-5-17 2-20-15z"/>
      <path class="pet-sheen" d="M118 90q6-11 19-15"/>
      <g class="pet-face"><g class="pet-open">${eye(137)}${eye(178)}</g>
        <path class="pet-lids" d="M128 113q9 7 17 0m24 0q9 7 17 0"/>
        <g class="pet-dots"><circle cx="137" cy="117" r="3"/><circle cx="178" cy="117" r="3"/></g>
        <path class="pet-smile" d="M151 124q6 8 13 0"/>
        <ellipse class="pet-chew" cx="158" cy="126" rx="5" ry="4"/>
        <g class="pet-accent"><ellipse cx="120" cy="125" rx="6" ry="3"/><ellipse cx="194" cy="125" rx="6" ry="3"/></g>
      </g></g></g></g>
    <g class="pet-bowl"><path class="pet-accent" d="M236 148h42q-3 14-21 14t-21-14z"/><path class="pet-light" d="M239 146q3-6 7-4 5-9 11-3 7-4 10 2 6-2 8 5z"/></g>
    <path class="pet-crumb pet-accent" d="M228 132h4v4h-4zm9-7h3v3h-3zm-6-8h2v2h-2z"/>
    <path class="pet-sparks pet-accent" d="M94 66l2 7 7 2-7 2-2 7-2-7-7-2 7-2zm133 23 2 5 5 2-5 2-2 5-2-5-5-2 5-2zm-9-35h4v4h-4z"/>
    <g class="pet-zzz"><text x="216" y="110">z</text><text x="228" y="97">z</text><text x="242" y="81">Z</text></g>
    <g class="pet-shell"><g class="pet-shell-top">
      <path class="pet-light" d="M115 116c1-29 24-65 43-65s43 36 44 65l-14-7-13 12-16-13-14 10-15-12z"/>
      <path class="pet-accent" d="M142 76h5v5h-5zm31 5h3v3h-3z"/>
      <path class="pet-crack pet-crack-one" d="M159 108l-7-10 6-7"/>
      <path class="pet-crack pet-crack-two" d="M158 91l-8-9 4-8"/>
      <path class="pet-crack pet-crack-three" d="M152 98l-10-2-5-7"/>
      </g><g class="pet-shell-base"><path class="pet-light" d="M115 115l15-10 15 12 14-10 16 13 13-12 14 7c3 30-15 45-44 45s-46-15-43-45z"/>
      <path class="pet-shading" d="M120 139q34 26 77 0-10 21-39 21-26 0-38-21z"/></g></g>
    </svg>`;
  function render() {
    return `<section class="pet-stage pet-egg pet-cracks-0" id="pet-stage" aria-label="Питомец Байт">
      <header class="pet-heading"><h2>Байт<span aria-hidden="true">.</span></h2><span id="pet-status">Яйцо</span></header>
      <div class="pet-field">${sprite}</div>
      <p class="pet-bubble" role="status"><span aria-hidden="true">&gt;</span> <span id="pet-message">тук…</span><i aria-hidden="true"></i></p>
      <div class="pet-stats">${Object.entries(stats).map(([key,label]) => `<div class="pet-stat" data-pet-level="critical"><label for="pet-stat-${key}">${label}</label><span class="pet-track"><span class="pet-stat-fill"></span></span><meter id="pet-stat-${key}" min="0" max="100" value="0"></meter><span id="pet-value-${key}" aria-hidden="true">0%</span></div>`).join('')}</div>
      <div class="pet-actions">${actions.map(([key,label,path]) => `<button type="button" data-pet-action="${key}" disabled><svg viewBox="0 0 16 16" aria-hidden="true"><path d="${path}"/></svg>${label}</button>`).join('')}</div></section>`;
  }
  const poseClass = name => name === 'egg' ? 'pet-egg' : 'pet-state-' + name;
  function pose(stage, name, message) {
    if (!Object.hasOwn(poses, name)) return;
    const current = poseClass(name);
    if (stage.classList.contains(current) && ['eat','play','hatch'].includes(name)) {
      stage.classList.remove(current);
      void stage.offsetWidth;
    }
    for (const key of Object.keys(poses)) stage.classList.toggle(poseClass(key), key === name);
    stage.querySelector('#pet-status').textContent = poses[name][0];
    stage.querySelector('#pet-message').textContent = message ?? poses[name][1];
    for (const button of stage.querySelectorAll('[data-pet-action]')) button.disabled = ['egg','hatch'].includes(name);
  }
  function cracks(stage, count) {
    for (let i = 0; i <= 3; i++) stage.classList.toggle('pet-cracks-' + i, i === Math.min(3, Math.max(0, Math.floor(count))));
  }
  function setStats(stage, values) {
    for (const key of Object.keys(stats)) {
      const meter = stage.querySelector('#pet-stat-' + key);
      meter.value = Math.round(values[key]);
      const value = meter.value;
      const row = meter.closest('.pet-stat');
      row.dataset.petLevel = value < 20 ? 'critical' : value < 35 ? 'low' : 'normal';
      row.querySelector('.pet-stat-fill').style.transform = `scaleX(${value / 100})`;
      row.querySelector('#pet-value-' + key).textContent = value + '%';
    }
  }
  function expression({food, mood, energy}) {
    if (food < 35) return 'hungry';
    if (mood < 35) return 'sad';
    return Math.min(food, mood, energy) >= 75 ? 'happy-full' : 'idle';
  }
  window.PetArt = { render, pose, cracks, setStats, expression };
})();

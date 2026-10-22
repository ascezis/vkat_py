/**
 * вкат.py — Экран профилей и система входа
 *
 * Модуль управляет отображением и взаимодействием со списком профилей:
 *   - рендер карточек существующих профилей
 *   - создание нового профиля с опциональным PIN
 *   - PIN-модалка для защищённых профилей
 *   - быстрый гостевой вход
 *   - справочное модальное окно о системе профилей
 *
 * Зависимости (глобальные):
 *   window.VkatStorage   — фасад хранилища (storage.js)
 *   window.VkatApp.dom   — кэш DOM-элементов (инициализирован в app.js)
 *   window.VkatApp.state — глобальное состояние приложения
 *   window.VkatApp.loadStorage()  — загрузка прогресса активного профиля
 *   window.VkatApp.showScreen(s)  — переключение экранов
 */

(function (window) {
  'use strict';

  // ─── Вспомогательные утилиты ────────────────────────────────────────────────

  function escapeHtml(str) {
    if (!str) return '';
    return str
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;');
  }

  function pluralize(n, one, two, five) {
    n = Math.abs(n) % 100;
    const n1 = n % 10;
    if (n > 10 && n < 20) return five;
    if (n1 > 1 && n1 < 5) return two;
    if (n1 === 1) return one;
    return five;
  }

  // ─── Экран профилей ──────────────────────────────────────────────────────────

  async function renderProfilesScreen() {
    if (!window.VkatStorage) return;
    const profiles = await window.VkatStorage.listProfiles();
    if (profiles.length === 0) {
      showCreateProfileView(true);
    } else {
      showProfileListView(profiles);
    }
  }

  function showProfileListView(profiles) {
    const dom = window.VkatApp.dom;
    if (dom.profilesViewList) dom.profilesViewList.style.display = 'flex';
    if (dom.profilesViewCreate) dom.profilesViewCreate.style.display = 'none';
    if (!dom.profilesGrid) return;

    dom.profilesGrid.innerHTML = '';
    const lastId = window.VkatStorage ? window.VkatStorage.getLastProfileId() : null;

    profiles.forEach(p => {
      const card = document.createElement('div');
      card.className = 'profile-card' + (p.id === lastId ? ' active-hint' : '');

      const doneCount = window.VkatStorage ? window.VkatStorage.getProgressCount(p.id) : 0;

      const initial = (p.name || '?').trim().charAt(0).toUpperCase();
      const progressText = doneCount > 0 ? `${doneCount} ${pluralize(doneCount, 'шаг пройден', 'шага пройдено', 'шагов пройдено')}` : 'новый ученик';

      card.innerHTML = `
        ${p.id === lastId ? '<span class="profile-badge-last">последний вход</span>' : ''}
        <div class="profile-card-actions">
          <button type="button" class="profile-card-action-btn btn-export" title="Скачать профиль (.json)">↓ .json</button>
          <button type="button" class="profile-card-action-btn btn-delete" title="Удалить профиль">✕</button>
        </div>
        <div class="profile-avatar">${escapeHtml(initial)}</div>
        <div class="profile-card-name">${escapeHtml(p.name)}</div>
        <div class="profile-card-progress">${progressText}</div>
      `;

      const exportBtn = card.querySelector('.btn-export');
      if (exportBtn) {
        exportBtn.addEventListener('click', async (e) => {
          e.stopPropagation();
          try {
            await window.VkatStorage.exportProfile(p.id);
          } catch (err) {
            alert('Ошибка экспорта профиля: ' + err.message);
          }
        });
      }

      const deleteBtn = card.querySelector('.btn-delete');
      if (deleteBtn) {
        deleteBtn.addEventListener('click', async (e) => {
          e.stopPropagation();
          if (confirm(`Точно удалить профиль "${p.name}" и все его данные на этом компьютере?`)) {
            await window.VkatStorage.deleteProfile(p.id);
            await renderProfilesScreen();
          }
        });
      }

      card.addEventListener('click', () => {
        handleProfileSelection(p);
      });

      dom.profilesGrid.appendChild(card);
    });

    // Карточка "+ Новый профиль"
    const newCard = document.createElement('div');
    newCard.className = 'profile-card profile-card-new';
    newCard.id = 'btn-add-profile';
    newCard.innerHTML = `
      <div class="profile-new-icon">+</div>
      <div class="profile-card-name">Новый профиль</div>
      <div class="profile-card-progress">добавить ученика</div>
    `;
    newCard.addEventListener('click', () => {
      showCreateProfileView(false);
    });
    dom.profilesGrid.appendChild(newCard);
  }

  function showCreateProfileView(isFirst) {
    const dom = window.VkatApp.dom;
    if (dom.profilesViewList) dom.profilesViewList.style.display = 'none';
    if (dom.profilesViewCreate) dom.profilesViewCreate.style.display = 'flex';

    if (dom.createProfileHeading) {
      dom.createProfileHeading.textContent = isFirst ? 'вкат.py / добро пожаловать' : 'Как тебя зовут?';
    }
    if (dom.inputProfileName) dom.inputProfileName.value = '';
    if (dom.inputProfilePin) dom.inputProfilePin.value = '';

    if (dom.btnCancelCreateProfile) {
      dom.btnCancelCreateProfile.style.display = isFirst ? 'none' : 'inline-block';
    }

    const hasLegacy = window.VkatStorage ? window.VkatStorage.checkLegacyData() : false;
    if (dom.legacyMigrationBox) {
      dom.legacyMigrationBox.style.display = hasLegacy ? 'block' : 'none';
    }
    if (dom.checkMigrateLegacy) {
      dom.checkMigrateLegacy.checked = hasLegacy;
    }

    requestAnimationFrame(() => {
      if (dom.inputProfileName) dom.inputProfileName.focus();
    });
  }

  // ─── Выбор и активация профиля ───────────────────────────────────────────────

  function handleProfileSelection(profile) {
    if (profile.pinHash) {
      openPinModal(profile);
    } else {
      activateProfileAndStart(profile.id);
    }
  }

  async function activateProfileAndStart(profileId, pin) {
    try {
      await window.VkatStorage.selectProfile(profileId, pin);
      await window.VkatApp.loadStorage();
      window.VkatApp.showScreen('start');
    } catch (err) {
      console.error('Ошибка входа в профиль:', err);
      alert('Не удалось войти в профиль: ' + err.message);
    }
  }

  // ─── PIN-модалка ─────────────────────────────────────────────────────────────

  let currentPinTargetProfile = null;

  function openPinModal(profile) {
    const dom = window.VkatApp.dom;
    currentPinTargetProfile = profile;
    if (dom.pinModalTitle) dom.pinModalTitle.textContent = profile.name;
    if (dom.pinErrorAlert) dom.pinErrorAlert.textContent = '';
    if (dom.inputModalPin) dom.inputModalPin.value = '';
    updatePinDots('');
    if (dom.pinModal) dom.pinModal.style.display = 'flex';
    requestAnimationFrame(() => {
      if (dom.inputModalPin) dom.inputModalPin.focus();
    });
  }

  function closePinModal() {
    const dom = window.VkatApp.dom;
    if (dom.pinModal) dom.pinModal.style.display = 'none';
    currentPinTargetProfile = null;
    if (dom.inputModalPin) dom.inputModalPin.value = '';
    updatePinDots('');
  }

  function updatePinDots(val) {
    const dom = window.VkatApp.dom;
    if (!dom.pinDots) return;
    const dots = dom.pinDots.querySelectorAll('.pin-dot');
    dots.forEach((dot, idx) => {
      dot.classList.toggle('filled', idx < val.length);
    });
  }

  async function submitPin() {
    const dom = window.VkatApp.dom;
    if (!currentPinTargetProfile) return;
    const pin = dom.inputModalPin ? dom.inputModalPin.value : '';
    try {
      await window.VkatStorage.selectProfile(currentPinTargetProfile.id, pin);
      closePinModal();
      await window.VkatApp.loadStorage();
      window.VkatApp.showScreen('start');
    } catch (err) {
      if (dom.pinErrorAlert) dom.pinErrorAlert.textContent = 'Неверный PIN-код';
      if (dom.inputModalPin) dom.inputModalPin.value = '';
      updatePinDots('');
      requestAnimationFrame(() => {
        if (dom.inputModalPin) dom.inputModalPin.focus();
      });
    }
  }

  // ─── Быстрый гостевой вход ────────────────────────────────────────────────────

  async function startAsGuest() {
    try {
      const profiles = await window.VkatStorage.listProfiles();
      // Ищем гостевой профиль строго без PIN-кода (чтобы быстрый вход никогда не блокировался)
      let guest = profiles.find(p => p.name.toLowerCase() === 'гость' && !p.pinHash);
      if (!guest) {
        guest = await window.VkatStorage.createProfile('Гость');
      }
      await window.VkatStorage.selectProfile(guest.id);
      await window.VkatApp.loadStorage();
      window.VkatApp.showScreen('start');
    } catch (err) {
      console.error('Ошибка быстрого старта:', err);
      alert('Не удалось запустить гостевой режим: ' + err.message);
    }
  }

  // ─── Справочное модальное окно о профилях ────────────────────────────────────

  function openProfileHelp() {
    const dom = window.VkatApp.dom;
    if (dom.modalProfileHelp) dom.modalProfileHelp.style.display = 'flex';
  }

  function closeProfileHelp() {
    const dom = window.VkatApp.dom;
    if (dom.modalProfileHelp) dom.modalProfileHelp.style.display = 'none';
  }

  // ─── Настройка событий (вызывается из app.js::setupEvents) ──────────────────

  function setupProfileEvents() {
    const dom = window.VkatApp.dom;

    if (dom.btnQuickStartList) dom.btnQuickStartList.addEventListener('click', startAsGuest);
    if (dom.btnQuickStartCreate) dom.btnQuickStartCreate.addEventListener('click', startAsGuest);

    if (dom.btnShowProfileHelpList) dom.btnShowProfileHelpList.addEventListener('click', openProfileHelp);
    if (dom.btnShowProfileHelpCreate) dom.btnShowProfileHelpCreate.addEventListener('click', openProfileHelp);
    if (dom.btnCloseProfileHelpX) dom.btnCloseProfileHelpX.addEventListener('click', closeProfileHelp);
    if (dom.btnCloseProfileHelpOk) dom.btnCloseProfileHelpOk.addEventListener('click', closeProfileHelp);
    if (dom.modalProfileHelp) {
      dom.modalProfileHelp.addEventListener('click', (e) => {
        if (e.target === dom.modalProfileHelp) closeProfileHelp();
      });
    }

    if (dom.btnCancelCreateProfile) {
      dom.btnCancelCreateProfile.addEventListener('click', () => renderProfilesScreen());
    }

    if (dom.formCreateProfile) {
      dom.formCreateProfile.addEventListener('submit', async (e) => {
        e.preventDefault();
        const name = dom.inputProfileName ? dom.inputProfileName.value.trim() : '';
        const pin = dom.inputProfilePin ? dom.inputProfilePin.value.trim() : '';
        if (!name) return;

        if (name.toLowerCase() === 'гость' && pin) {
          alert('Имя «Гость» зарезервировано для быстрого входа без PIN-кода. Пожалуйста, укажите другое имя или оставьте PIN пустым.');
          return;
        }

        try {
          const profile = await window.VkatStorage.createProfile(name, pin);
          const shouldMigrate = dom.checkMigrateLegacy && dom.checkMigrateLegacy.checked;
          if (shouldMigrate && window.VkatStorage.checkLegacyData()) {
            await window.VkatStorage.migrateLegacyToProfile(profile.id);
          }
          await window.VkatStorage.selectProfile(profile.id, pin);
          await window.VkatApp.loadStorage();
          window.VkatApp.showScreen('start');
        } catch (err) {
          alert('Ошибка создания профиля: ' + err.message);
        }
      });
    }

    if (dom.inputModalPin) {
      dom.inputModalPin.addEventListener('input', () => {
        dom.inputModalPin.value = dom.inputModalPin.value.replace(/\D/g, '').slice(0, 4);
        const val = dom.inputModalPin.value;
        updatePinDots(val);
        if (dom.pinErrorAlert) dom.pinErrorAlert.textContent = '';
        if (val.length === 4) {
          submitPin();
        }
      });

      dom.inputModalPin.addEventListener('keydown', (e) => {
        if (e.key === 'Enter') {
          e.preventDefault();
          submitPin();
        }
      });
    }

    if (dom.btnModalPinSubmit) dom.btnModalPinSubmit.addEventListener('click', submitPin);
    if (dom.btnModalPinCancel) dom.btnModalPinCancel.addEventListener('click', closePinModal);
    if (dom.btnModalPinCloseX) dom.btnModalPinCloseX.addEventListener('click', closePinModal);
    if (dom.pinModal) {
      dom.pinModal.addEventListener('click', (e) => {
        if (e.target === dom.pinModal) closePinModal();
      });
    }

    if (dom.inputImportFile) {
      dom.inputImportFile.addEventListener('change', (e) => {
        const file = e.target.files && e.target.files[0];
        if (!file) return;
        const reader = new FileReader();
        reader.onload = async (evt) => {
          try {
            const jsonStr = evt.target.result;
            const importedMeta = await window.VkatStorage.importProfile(jsonStr);
            await renderProfilesScreen();
            alert(`Профиль "${importedMeta.name}" успешно импортирован!`);
          } catch (err) {
            alert('Ошибка импорта профиля: ' + err.message);
          } finally {
            dom.inputImportFile.value = '';
          }
        };
        reader.readAsText(file);
      });
    }
  }

  // ─── Экспорт публичного API ───────────────────────────────────────────────────

  window.VkatProfiles = {
    renderProfilesScreen,
    openPinModal,
    closePinModal,
    closeProfileHelp,
    setupProfileEvents
  };

})(window);

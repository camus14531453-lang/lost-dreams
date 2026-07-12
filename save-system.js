/* ============================================================
   故园旧梦 · Lost Dreams — save-system.js
   localStorage 持久化：设置 / 存档（6 格 + 自动存档）/ 结局与章节解锁
   ============================================================ */
(function () {
  'use strict';

  const KEYS = {
    settings: 'lostdreams.settings.v1',
    saves:    'lostdreams.saves.v1',
    flags:    'lostdreams.flags.v1'
  };

  const SLOT_COUNT = 6;

  const DEFAULT_SETTINGS = {
    lang: 'en',          // 原版 demo 为英文，默认英文
    playerName: '',
    textSpeed: 6,     // 1-10（越大越快）
    autoSpeed: 5,     // 1-10（越大越快）
    musicVol: 70,     // 0-100
    sfxVol: 80,       // 0-100
    motion: 'high',   // low | mid | high
    font: 'poetic',   // poetic | readable
    helpSeen: false
  };

  function read(key, fallback) {
    try {
      const raw = localStorage.getItem(key);
      if (!raw) return fallback;
      return Object.assign({}, fallback, JSON.parse(raw));
    } catch (e) {
      return fallback;
    }
  }

  function write(key, val) {
    try { localStorage.setItem(key, JSON.stringify(val)); } catch (e) {}
  }

  /* ---------- 设置 ---------- */
  let settings = read(KEYS.settings, DEFAULT_SETTINGS);

  function getSettings() { return settings; }
  function setSetting(name, value) {
    settings[name] = value;
    write(KEYS.settings, settings);
  }

  /* ---------- 存档 ---------- */
  function readSaves() {
    try {
      const raw = localStorage.getItem(KEYS.saves);
      const data = raw ? JSON.parse(raw) : {};
      return {
        slots: Array.isArray(data.slots) && data.slots.length === SLOT_COUNT
          ? data.slots : new Array(SLOT_COUNT).fill(null),
        auto: data.auto || null
      };
    } catch (e) {
      return { slots: new Array(SLOT_COUNT).fill(null), auto: null };
    }
  }

  let saves = readSaves();

  function persistSaves() { write(KEYS.saves, saves); }

  /* record: { nodeId, chapterKey, ts, snippet:{zh,en}, thumb } */
  function saveToSlot(index, record) {
    saves.slots[index] = record;
    persistSaves();
  }

  function deleteSlot(index) {
    saves.slots[index] = null;
    persistSaves();
  }

  function getSlots() { return saves.slots; }

  function setAutosave(record) {
    saves.auto = record;
    persistSaves();
  }

  function getAutosave() { return saves.auto; }

  /* ---------- 解锁标记（章节 / 结局） ---------- */
  let flags = read(KEYS.flags, { chapters: { 'ch.prologue': true }, endings: {} });

  function unlockChapter(key) {
    if (!flags.chapters[key]) {
      flags.chapters[key] = true;
      write(KEYS.flags, flags);
    }
  }
  function isChapterUnlocked(key) { return !!flags.chapters[key]; }

  function unlockEnding(key) {
    const fresh = !flags.endings[key];
    if (fresh) {
      flags.endings[key] = Date.now();
      write(KEYS.flags, flags);
    }
    return fresh;
  }
  function isEndingUnlocked(key) { return !!flags.endings[key]; }

  window.SaveSystem = {
    SLOT_COUNT,
    getSettings, setSetting,
    getSlots, saveToSlot, deleteSlot,
    setAutosave, getAutosave,
    unlockChapter, isChapterUnlocked,
    unlockEnding, isEndingUnlocked
  };
})();

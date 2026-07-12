/* ============================================================
   故园旧梦 · Lost Dreams — i18n.js
   全局双语系统：UI 字符串表 + 语言切换（无刷新即时更新）
   ============================================================ */
(function () {
  'use strict';

  const STRINGS = {
    /* ---- boot ---- */
    'boot.loading':      { zh: '正在拾起残片……', en: 'Gathering the fragments…' },

    /* ---- title ---- */
    'title.tagline':     { zh: '人的记忆，像一条游动的鱼。', en: 'Human memory is like a swimming fish.' },
    'title.start':       { zh: '开始游戏', en: 'New Game' },
    'title.continue':    { zh: '继续游戏', en: 'Continue' },
    'title.chapters':    { zh: '章节选择', en: 'Chapters' },
    'title.saves':       { zh: '存档 / 读档', en: 'Save / Load' },
    'title.settings':    { zh: '设置', en: 'Settings' },
    'title.gallery':     { zh: '结局图鉴', en: 'Endings' },
    'title.credits':     { zh: '制作信息', en: 'Credits' },
    'title.rebuilt':     { zh: '重构版', en: 'Rebuilt' },

    /* ---- common ---- */
    'common.back':       { zh: '返回', en: 'Back' },
    'common.close':      { zh: '关闭', en: 'Close' },
    'common.confirm':    { zh: '确认', en: 'Confirm' },
    'common.cancel':     { zh: '取消', en: 'Cancel' },
    'common.on':         { zh: '开', en: 'On' },
    'common.off':        { zh: '关', en: 'Off' },

    /* ---- game hud ---- */
    'game.auto':         { zh: '自动', en: 'Auto' },
    'game.skip':         { zh: '快进', en: 'Skip' },
    'game.log':          { zh: '记录', en: 'Log' },
    'game.hide':         { zh: '隐藏', en: 'Hide' },
    'game.save':         { zh: '存档', en: 'Save' },
    'game.load':         { zh: '读档', en: 'Load' },
    'game.settings':     { zh: '设置', en: 'Set' },
    'game.menu':         { zh: '菜单', en: 'Menu' },
    'game.skipVideo':    { zh: '点击跳过 ▸', en: 'Click to skip ▸' },
    'game.clickContinue':{ zh: '点击继续', en: 'Click to continue' },
    'game.narrator':     { zh: '旁白', en: 'Narrator' },
    'game.frags':        { zh: '记忆残片', en: 'Memory fragments' },

    /* ---- 心象 · 数值系统 ---- */
    'stats.title':       { zh: '心　象', en: 'INNER STATE' },
    'stats.toggle':      { zh: '心象', en: 'State' },
    'stats.san':         { zh: '神志', en: 'Lucidity' },
    'stats.sanHint':     { zh: '尚存的清醒。见幻象、被否认时消减。', en: 'What lucidity remains. Illusions and denial wear it down.' },
    'stats.fade':        { zh: '褪色', en: 'Fading' },
    'stats.fadeHint':    { zh: '真实旧事褪去的深度。沉入旧影、封存记忆时加深。', en: 'How far the real past has faded. Deepens as you sink into old images.' },
    'stats.love':        { zh: '眷恋', en: 'Longing' },
    'stats.loveHint':    { zh: '对她、对这一场旧梦的眷恋。答对时增长。', en: 'Your longing for her, and for this old dream. Grows with the right answers.' },
    'toast.bedLocked':   { zh: '先看看电视与塔罗牌，再躺下。', en: 'Watch the TV and the tarot first, then lie down.' },

    /* ---- tooltips ---- */
    'tip.lang':          { zh: '切换语言 Language', en: 'Switch language 语言' },
    'tip.auto':          { zh: '自动播放（A）', en: 'Auto play (A)' },
    'tip.skip':          { zh: '快进（按住 Ctrl / Shift）', en: 'Fast-forward (hold Ctrl / Shift)' },
    'tip.log':           { zh: '对话记录', en: 'Dialogue log' },
    'tip.save':          { zh: '保存进度（S）', en: 'Save progress (S)' },
    'tip.load':          { zh: '读取进度（L）', en: 'Load progress (L)' },
    'tip.set':           { zh: '打开设置', en: 'Open settings' },
    'tip.hide':          { zh: '隐藏界面（H）', en: 'Hide UI (H)' },
    'tip.menu':          { zh: '返回主菜单（Esc）', en: 'Main menu (Esc)' },

    /* ---- room hub ---- */
    'room.bed':          { zh: '床 · 入梦', en: 'Bed · Sleep' },
    'room.tv':           { zh: '电视 · 旧影', en: 'TV · Old Light' },
    'room.card':         { zh: '塔罗牌 · 卜问', en: 'Tarot · Divine' },
    'room.hint':         { zh: '房间里有些东西在等你。', en: 'Something in this room is waiting for you.' },

    /* ---- saves ---- */
    'saves.title':       { zh: '存档 / 读档', en: 'Save / Load' },
    'saves.tabSave':     { zh: '存 档', en: 'SAVE' },
    'saves.tabLoad':     { zh: '读 档', en: 'LOAD' },
    'saves.empty':       { zh: '空存档位', en: 'Empty slot' },
    'saves.emptyHint':   { zh: '尚未写下任何梦', en: 'No dream recorded yet' },
    'saves.slot':        { zh: '存档位', en: 'Slot' },
    'saves.auto':        { zh: '自动存档', en: 'Autosave' },
    'saves.delete':      { zh: '删除', en: 'Delete' },
    'saves.confirmOverwrite': { zh: '覆盖这个存档吗？原有的梦将被抹去。', en: 'Overwrite this save? The old dream will fade.' },
    'saves.confirmLoad': { zh: '读取这个存档吗？当前未保存的进度将丢失。', en: 'Load this save? Unsaved progress will be lost.' },
    'saves.confirmDelete': { zh: '删除这个存档吗？此操作无法撤销。', en: 'Delete this save? This cannot be undone.' },
    'saves.noData':      { zh: '这里没有可读取的梦。', en: 'There is no dream to load here.' },

    /* ---- settings ---- */
    'settings.title':    { zh: '设置', en: 'Settings' },
    'settings.lang':     { zh: '语言', en: 'Language' },
    'settings.textSpeed':{ zh: '文字速度', en: 'Text speed' },
    'settings.autoSpeed':{ zh: '自动播放速度', en: 'Auto-play speed' },
    'settings.music':    { zh: '音乐音量', en: 'Music volume' },
    'settings.sfx':      { zh: '音效音量', en: 'SFX volume' },
    'settings.fullscreen':{ zh: '全屏', en: 'Fullscreen' },
    'settings.motion':   { zh: '动效强度', en: 'Motion' },
    'settings.motionLow':{ zh: '低', en: 'Low' },
    'settings.motionMid':{ zh: '中', en: 'Mid' },
    'settings.motionHigh':{ zh: '高', en: 'High' },
    'settings.font':     { zh: '字体模式', en: 'Font mode' },
    'settings.fontPoetic':{ zh: '诗性', en: 'Poetic' },
    'settings.fontReadable':{ zh: '易读', en: 'Readable' },

    /* ---- gallery ---- */
    'gallery.title':     { zh: '结局图鉴', en: 'Endings' },
    'gallery.note':      { zh: '被拾回的梦，会在这里留下痕迹。', en: 'Dreams you recover leave their trace here.' },
    'gallery.locked':    { zh: '？？？', en: '???' },
    'gallery.lockedHint':{ zh: '尚未寻回', en: 'Not yet recovered' },

    /* ---- credits ---- */
    'credits.title':     { zh: '制作信息', en: 'Credits' },
    'credits.originalTitle': { zh: '原作', en: 'Original Work' },
    'credits.original':  { zh: '原案 / 美术 / 音乐', en: 'Story / Art / Music' },
    'credits.rebuild':   { zh: '系统重构 / UI 设计', en: 'System Rebuild / UI Design' },
    'credits.thanks':    { zh: '特别致意', en: 'Special Thanks' },
    'credits.thanksBody':{ zh: '致所有存放在夜里的记忆。', en: 'To every memory left in the keeping of the night.' },

    /* ---- chapters ---- */
    'chapters.title':    { zh: '章节选择', en: 'Chapters' },
    'chapters.note':     { zh: '走过的路，可以再走一遍。', en: 'A road once walked can be walked again.' },
    'chapters.locked':   { zh: '未解锁', en: 'Locked' },

    /* ---- chapter names ---- */
    'ch.prologue':       { zh: '序章 · 夜归', en: 'Prologue · Night Walk' },
    'ch.room':           { zh: '第一章 · 房间', en: 'Chapter I · The Room' },
    'ch.dream1':         { zh: '梦境一 · 似曾相识', en: 'Dream I · Déjà vu' },
    'ch.dream2':         { zh: '梦境二 · 金鱼', en: 'Dream II · The Goldfish' },
    'ch.finale':         { zh: '终章 · 收束', en: 'Finale · Convergence' },

    /* ---- name input ---- */
    'name.prompt':       { zh: '你的名字是？', en: 'What is your name?' },
    'name.placeholder':  { zh: '写下你的名字……', en: 'Write your name…' },
    'name.confirm':      { zh: '就叫这个', en: 'That is my name' },
    'name.skip':         { zh: '保持无名', en: 'Stay nameless' },

    /* ---- fish trace ---- */
    'trace.title':       { zh: '封　存', en: 'SEALING' },
    'trace.hint':        { zh: '从发光的起点落笔，沿纹路描出这尾鱼', en: 'Start at the glowing point, trace the fish along the pattern' },
    'trace.start':       { zh: '起', en: 'START' },
    'trace.done':        { zh: '记忆已封存', en: 'The memory is sealed' },
    'trace.skip':        { zh: '跳过', en: 'Skip' },

    /* ---- endings ---- */
    'end.card':          { zh: '热寂之牌', en: 'The Heat-Death Card' },
    'end.cardDesc':      { zh: '宇宙终将走向热寂。是终结，还是开始？', en: 'The universe will undergo heat death. An ending, or a beginning?' },
    'end.dream1':        { zh: '旧日之影', en: 'Shadow of Bygone Days' },
    'end.dream1Desc':    { zh: '当一个时代开始被浪漫化，亲历者已忘了它的模样。', en: 'When an era is romanticized, those who lived it have forgotten its face.' },
    'end.dream2':        { zh: '金鱼的告别', en: 'The Goldfish’s Farewell' },
    'end.dream2Desc':    { zh: '再见了。你不会再记起我。', en: 'Goodbye. You won’t remember me again.' },
    'end.true':          { zh: '真结局 · 走出房间', en: 'True Ending · Out the Door' },
    'end.trueDesc':      { zh: '神志尚存、旧事褪尽、心有眷恋——你带着这场梦，走进了天光。', en: 'Lucid enough, the real past faded, longing kept — you walk into the dawn, carrying the dream.' },
    'end.lost':          { zh: '囚困 · 失神', en: 'Trapped · Mind Undone' },
    'end.lostDesc':      { zh: '神志垫底。你连自己是谁都记不清了，只好留下。', en: 'Lucidity bottomed out. You could no longer recall who you were, and so you stayed.' },
    'end.cold':          { zh: '囚困 · 无凭', en: 'Trapped · Without Longing' },
    'end.coldDesc':      { zh: '眷恋不足。你从不曾真正爱过这里，却也回不去了。', en: 'Not enough longing. You never truly loved this place, yet could not leave it.' },
    'end.cling':         { zh: '囚困 · 未忘', en: 'Trapped · Still Clinging' },
    'end.clingDesc':     { zh: '褪色未满。你仍攥着真实的旧事不肯放手，于是被永远留下。', en: 'Not fully faded. You still clung to the real past, and so you were kept forever.' },

    /* ---- 血色囚困结局 ---- */
    'blood.lost':        { zh: '失了神志的孩子，连梦都认不出了。', en: 'A child who has lost their mind can’t even tell a dream apart.' },
    'blood.cold':        { zh: '你从不曾真正眷恋这里。可你，已经回不去了。', en: 'You never truly longed for this place. Yet now, you cannot go back.' },
    'blood.cling':       { zh: '你还攥着那些真实的旧事，不肯放手。', en: 'You still clutch the real, bygone things, unwilling to let go.' },
    'blood.trap':        { zh: '愚蠢的，善于遗忘的人类。永远留在这里吧！', en: 'Foolish, forgetful human. Stay here forever!' },
    'blood.epigraph':    { zh: '一个时代被浪漫化的开端，就是与真实过去的永别。', en: 'The dawn of an era’s romance is the farewell to its real past.' },

    /* ---- log ---- */
    'log.title':         { zh: '对话记录', en: 'Dialogue Log' },
    'log.empty':         { zh: '还没有留下任何话语。', en: 'No words have been spoken yet.' },

    /* ---- help ---- */
    'help.title':        { zh: '操作提示', en: 'Controls' },
    'help.advance':      { zh: '继续对话', en: 'Advance dialogue' },
    'help.esc':          { zh: '菜单 / 关闭弹窗', en: 'Menu / close dialogs' },
    'help.hide':         { zh: '隐藏界面', en: 'Hide UI' },
    'help.saveload':     { zh: '存档 / 读档', en: 'Save / Load' },
    'help.auto':         { zh: '自动播放', en: 'Auto play' },
    'help.skip':         { zh: '按住快进', en: 'Hold to skip' },
    'help.dontShow':     { zh: '知道了，不再显示', en: 'Got it, don’t show again' },

    /* ---- confirms & toasts ---- */
    'confirm.toTitle':   { zh: '返回主菜单？未保存的进度将丢失。', en: 'Return to the main menu? Unsaved progress will be lost.' },
    'confirm.newGame':   { zh: '从头开始新的梦？', en: 'Begin the dream anew?' },
    'toast.saved':       { zh: '已保存', en: 'Saved' },
    'toast.loaded':      { zh: '已读取', en: 'Loaded' },
    'toast.deleted':     { zh: '已删除', en: 'Deleted' },
    'toast.autoOn':      { zh: '自动播放：开', en: 'Auto: on' },
    'toast.autoOff':     { zh: '自动播放：关', en: 'Auto: off' },
    'toast.skipOn':      { zh: '快进：开', en: 'Skip: on' },
    'toast.skipOff':     { zh: '快进：关', en: 'Skip: off' },
    'toast.uiHidden':    { zh: '界面已隐藏 — 点击任意处恢复', en: 'UI hidden — click anywhere to restore' },
    'toast.endingUnlocked': { zh: '寻回了一段梦 —— ', en: 'A dream recovered — ' },
    'toast.frag':        { zh: '拾得记忆残片 ✦ ', en: 'Memory fragment recovered ✦ ' }
  };

  let lang = 'zh';
  const listeners = [];

  function t(key) {
    const entry = STRINGS[key];
    if (!entry) return key;
    return entry[lang] || entry.zh || key;
  }

  function getLang() { return lang; }

  function setLang(next) {
    if (next !== 'zh' && next !== 'en') return;
    lang = next;
    document.documentElement.lang = (lang === 'zh') ? 'zh-CN' : 'en';
    document.body.setAttribute('data-lang', lang);
    applyAll();
    listeners.forEach(fn => { try { fn(lang); } catch (e) {} });
  }

  /* 扫描 data-i18n 属性，即时刷新所有 UI 文案（无需刷新页面） */
  function applyAll() {
    document.querySelectorAll('[data-i18n]').forEach(el => {
      el.textContent = t(el.getAttribute('data-i18n'));
    });
  }

  function onChange(fn) { listeners.push(fn); }

  /* 剧情文本取词：{zh,en} 对象 → 当前语言字符串 */
  function pick(obj) {
    if (obj == null) return '';
    if (typeof obj === 'string') return obj;
    return obj[lang] || obj.zh || obj.en || '';
  }

  window.I18N = { t, pick, getLang, setLang, applyAll, onChange };
})();

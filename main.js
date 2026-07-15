/* ============================================================
   故园旧梦 · Lost Dreams — main.js
   状态机 / 剧情引擎 / 房间探索 / 鼠标系统 / 粒子层 / 音频 / UI
   依赖：i18n.js, story.js, save-system.js
   ============================================================ */
(function () {
  'use strict';

  const $  = (sel, root) => (root || document).querySelector(sel);
  const $$ = (sel, root) => Array.from((root || document).querySelectorAll(sel));

  const body = document.body;
  const SS = window.SaveSystem;
  const I18N = window.I18N;
  const STORY = window.STORY;

  /* ==========================================================
     音频管理
     ========================================================== */
  const AudioMan = (() => {
    const TRACKS = {
      title:  'assets/audio/title-theme.mp4',
      street: 'assets/audio/street-theme.mp4',
      room:   'assets/audio/room-theme.mp4',
      card:   'assets/audio/card-theme.mp4',
      snow:   'assets/audio/snow-theme.mp4',
      dream:  'assets/audio/dream-theme.mp4'
    };
    let bgmEl = null;
    let bgmKey = null;
    let extraEl = null;          // 视频伴音等一次性音轨
    let musicVol = SS.getSettings().musicVol / 100;
    let sfxVol = SS.getSettings().sfxVol / 100;
    let unlocked = false;
    const retiring = new Set(); // 正在淡出的旧音轨（每条独立定时器，杜绝悬空泄漏）

    const clickEl = new Audio('assets/audio/ui-click.mp4');
    clickEl.preload = 'auto';

    function unlock() {
      if (unlocked) return;
      unlocked = true;
      if (bgmEl && bgmEl.paused) bgmEl.play().catch(() => {});
    }
    ['pointerdown', 'keydown'].forEach(ev =>
      document.addEventListener(ev, unlock, { passive: true }));

    function retire(el) {
      if (!el) return;
      retiring.add(el);
      const t = setInterval(() => {
        el.volume = Math.max(0, el.volume - 0.08);
        if (el.volume <= 0.01) {
          clearInterval(t);
          el.pause();
          el.removeAttribute('src');
          el.load();
          retiring.delete(el);
        }
      }, 60);
    }

    function playBgm(key) {
      if (key === bgmKey) return;
      retire(bgmEl);
      bgmKey = key;
      bgmEl = null;
      if (!key || !TRACKS[key]) return;
      const el = new Audio(TRACKS[key]);
      el.loop = true;
      el.volume = musicVol;
      bgmEl = el;
      el.play().catch(() => {}); // 首次可能被拦截，unlock 时补播
    }

    function playExtra(src, loop) {
      stopExtra();
      extraEl = new Audio(src);
      extraEl.loop = !!loop;
      extraEl.volume = musicVol;
      extraEl.play().catch(() => {});
    }
    function stopExtra() {
      if (extraEl) {
        extraEl.pause();
        extraEl.removeAttribute('src');
        extraEl.load();
        extraEl = null;
      }
    }

    /* 全部立即停止（页面关闭/离开时兜底，绝不留后台音轨） */
    function stopAll() {
      retiring.forEach(el => { el.pause(); el.removeAttribute('src'); el.load(); });
      retiring.clear();
      if (bgmEl) { bgmEl.pause(); }
      stopExtra();
    }

    /* 标签页隐藏即静音，回来再续播 —— 防止后台窗口持续出声 */
    document.addEventListener('visibilitychange', () => {
      if (document.visibilityState === 'hidden') {
        if (bgmEl && !bgmEl.paused) { bgmEl.dataset.resume = '1'; bgmEl.pause(); }
        if (extraEl && !extraEl.paused) { extraEl.dataset.resume = '1'; extraEl.pause(); }
        retiring.forEach(el => el.pause());
      } else {
        if (bgmEl && bgmEl.dataset.resume) { delete bgmEl.dataset.resume; bgmEl.play().catch(() => {}); }
        if (extraEl && extraEl.dataset.resume) { delete extraEl.dataset.resume; extraEl.play().catch(() => {}); }
      }
    });
    window.addEventListener('pagehide', stopAll);
    window.addEventListener('beforeunload', stopAll);

    function click() {
      if (sfxVol <= 0) return;
      clickEl.volume = sfxVol;
      clickEl.currentTime = 0;
      clickEl.play().catch(() => {});
    }

    function setMusicVol(v) {
      musicVol = v / 100;
      if (bgmEl) bgmEl.volume = musicVol;
      if (extraEl) extraEl.volume = musicVol;
    }
    function setSfxVol(v) { sfxVol = v / 100; }

    return { playBgm, playExtra, stopExtra, stopAll, click, setMusicVol, setSfxVol };
  })();

  /* ==========================================================
     粒子 / 雾 / 星 / 雪 / 鼠标拖尾 —— 单画布
     ========================================================== */
  const FX = (() => {
    const canvas = $('#fx-canvas');
    const ctx = canvas.getContext('2d');
    let W = 0, H = 0;
    let mode = 'dust';
    let parts = [];
    let trail = [];
    let running = true;

    const DENSITY = { low: 0.3, mid: 0.65, high: 1 };

    function resize() {
      W = canvas.width = window.innerWidth;
      H = canvas.height = window.innerHeight;
    }
    window.addEventListener('resize', resize);
    resize();

    function count(base) {
      return Math.round(base * (DENSITY[SS.getSettings().motion] || 1));
    }

    function build() {
      parts = [];
      if (mode === 'dust') {
        for (let i = 0; i < count(46); i++) {
          parts.push({
            x: Math.random() * W, y: Math.random() * H,
            r: 0.6 + Math.random() * 1.6,
            vx: (Math.random() - 0.5) * 0.12,
            vy: -0.05 - Math.random() * 0.18,
            a: 0.05 + Math.random() * 0.25,
            ph: Math.random() * Math.PI * 2
          });
        }
      } else if (mode === 'snow') {
        for (let i = 0; i < count(120); i++) {
          parts.push({
            x: Math.random() * W, y: Math.random() * H,
            r: 0.8 + Math.random() * 2.4,
            vx: (Math.random() - 0.5) * 0.3,
            vy: 0.4 + Math.random() * 1.1,
            a: 0.25 + Math.random() * 0.5,
            ph: Math.random() * Math.PI * 2
          });
        }
      } else if (mode === 'stars') {
        for (let i = 0; i < count(110); i++) {
          parts.push({
            x: Math.random() * W, y: Math.random() * H,
            r: 0.4 + Math.random() * 1.4,
            vx: 0, vy: 0,
            a: 0.15 + Math.random() * 0.7,
            ph: Math.random() * Math.PI * 2
          });
        }
      }
    }

    function setMode(m) {
      if (m === mode) return;
      mode = m || 'none';
      build();
    }
    function rebuild() { build(); }

    function addTrail(x, y) {
      if (SS.getSettings().motion === 'low') return;
      trail.push({ x, y, life: 1 });
      if (trail.length > 26) trail.shift();
    }

    let t = 0;
    function frame() {
      requestAnimationFrame(frame);
      if (!running) return;
      t += 0.016;
      ctx.clearRect(0, 0, W, H);

      // 粒子
      for (const p of parts) {
        if (mode === 'stars') {
          const tw = 0.5 + 0.5 * Math.sin(t * 1.4 + p.ph);
          ctx.globalAlpha = p.a * tw;
        } else {
          p.x += p.vx + Math.sin(t * 0.6 + p.ph) * 0.08;
          p.y += p.vy;
          if (p.y < -6) { p.y = H + 6; p.x = Math.random() * W; }
          if (p.y > H + 6) { p.y = -6; p.x = Math.random() * W; }
          if (p.x < -6) p.x = W + 6;
          if (p.x > W + 6) p.x = -6;
          ctx.globalAlpha = p.a * (0.7 + 0.3 * Math.sin(t + p.ph));
        }
        ctx.fillStyle = mode === 'snow' ? '#dfe6ef' : '#e9e4d3';
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
        ctx.fill();
      }

      // 鼠标流光尾迹
      for (let i = trail.length - 1; i >= 0; i--) {
        const q = trail[i];
        q.life -= 0.045;
        if (q.life <= 0) { trail.splice(i, 1); continue; }
        ctx.globalAlpha = q.life * 0.28;
        ctx.fillStyle = '#c9a86a';
        ctx.beginPath();
        ctx.arc(q.x, q.y, 1.6 * q.life + 0.4, 0, Math.PI * 2);
        ctx.fill();
      }
      ctx.globalAlpha = 1;
    }
    build();
    frame();

    return { setMode, addTrail, rebuild };
  })();

  /* ==========================================================
     自绘鼠标
     ========================================================== */
  const Cursor = (() => {
    const el = $('#cursor');
    const dot = $('.c-dot', el);
    const ring = $('.c-ring', el);
    const glyph = $('.c-glyph', el);
    let mx = -100, my = -100, rx = -100, ry = -100;
    let lastTrail = 0;

    if (!window.matchMedia('(pointer: fine)').matches) {
      return { set() {} };
    }

    document.addEventListener('mousemove', (e) => {
      mx = e.clientX; my = e.clientY;
      body.classList.add('cursor-active');
      const now = performance.now();
      if (now - lastTrail > 40) { FX.addTrail(mx, my); lastTrail = now; }
      // 依据悬停目标切换形态
      const target = e.target;
      const btn = target.closest ? target.closest('button, [data-hotspot], input[type="range"]') : null;
      if (btn) {
        if (btn.disabled) set('disabled');
        else if (btn.classList.contains('btn-choice')) set('choice');
        else set('pointer');
      } else {
        set('default');
      }
    }, { passive: true });

    document.addEventListener('mouseleave', () => body.classList.remove('cursor-active'));

    function loop() {
      requestAnimationFrame(loop);
      rx += (mx - rx) * 0.22;
      ry += (my - ry) * 0.22;
      // 只写 CSS 变量，位移由 CSS transform 消费（GPU 合成，不触发 layout）
      const s = el.style;
      s.setProperty('--cx', mx + 'px');
      s.setProperty('--cy', my + 'px');
      s.setProperty('--rx', rx + 'px');
      s.setProperty('--ry', ry + 'px');
    }
    loop();

    function set(state) {
      if (body.getAttribute('data-cursor') !== state) {
        body.setAttribute('data-cursor', state);
      }
    }
    return { set };
  })();

  /* ==========================================================
     描鱼符小游戏 · 封存 —— 独立黑幕水波场景，沿纹路描出鱼符，成符发光消散
     流程：dream 淡出→黑水场景淡入→描纹路→绽放→水波淡出→回到 dream
     ========================================================== */
  const FishTrace = (() => {
    const canvas = $('#trace-canvas');
    const ui = $('#trace-ui');
    const hintEl = $('#trace-hint');
    const skipBtn = $('#trace-skip');
    const ctx = canvas.getContext('2d');

    // 鱼形轮廓（归一化 0..1，鱼头在左），首尾相接为闭合描线
    const SHAPE = [
      [0.06, 0.50], [0.16, 0.34], [0.30, 0.24], [0.46, 0.21],
      [0.62, 0.25], [0.74, 0.33], [0.83, 0.40],
      [0.99, 0.10], [0.87, 0.50], [0.99, 0.90],
      [0.83, 0.60], [0.74, 0.67], [0.62, 0.75],
      [0.46, 0.79], [0.30, 0.76], [0.16, 0.66], [0.06, 0.50]
    ];

    let path = [];          // 重采样后的屏幕坐标点
    let eyeXY = null;
    let cx = 0, cy = 0;     // 场景中心（水波源）
    let progress = 0;       // 已描到的点索引
    let started = false;    // 是否已从起点落笔
    let active = false;
    let raf = 0;
    let doneCb = null;
    let phase = 'in';       // in | trace | bloom | out
    let phaseT = 0;         // 当前阶段计时
    let mx = -1, my = -1;
    let skipTimer = null;
    let ripples = [];       // 水波 {x,y,r,life,max}
    let rippleClock = 0;

    function resample(pts, W, H, count) {
      const boxW = Math.min(W * 0.56, 700);
      const boxH = boxW * 0.6;
      const ox = (W - boxW) / 2;
      const oy = (H - boxH) / 2 - H * 0.01;
      cx = W / 2; cy = oy + boxH / 2;
      const raw = pts.map(([x, y]) => [ox + x * boxW, oy + y * boxH]);
      let total = 0;
      const seg = [];
      for (let i = 0; i < raw.length - 1; i++) {
        const d = Math.hypot(raw[i + 1][0] - raw[i][0], raw[i + 1][1] - raw[i][1]);
        seg.push(d); total += d;
      }
      const out = [];
      const step = total / (count - 1);
      let acc = 0, si = 0;
      out.push({ x: raw[0][0], y: raw[0][1] });
      for (let k = 1; k < count; k++) {
        const target = k * step;
        while (si < seg.length - 1 && acc + seg[si] < target) { acc += seg[si]; si++; }
        const t = seg[si] ? (target - acc) / seg[si] : 0;
        out.push({
          x: raw[si][0] + (raw[si + 1][0] - raw[si][0]) * t,
          y: raw[si][1] + (raw[si + 1][1] - raw[si][1]) * t
        });
      }
      eyeXY = { x: ox + 0.2 * boxW, y: oy + 0.42 * boxH };
      return out;
    }

    function start(cb) {
      doneCb = cb;
      active = true;
      phase = 'in'; phaseT = 0;
      progress = 0;
      started = false;
      ripples = []; rippleClock = 0;
      mx = my = -1;
      canvas.hidden = false;
      ui.hidden = false;
      skipBtn.hidden = true;
      hintEl.textContent = I18N.t('trace.hint');
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
      path = resample(SHAPE, canvas.width, canvas.height, 120);

      canvas.addEventListener('pointermove', onMove);
      canvas.addEventListener('pointerdown', onMove);
      window.addEventListener('resize', onResize);
      skipBtn.addEventListener('click', onSkip);
      skipTimer = setTimeout(() => { skipBtn.hidden = false; }, 8000);
      loop();
    }

    function onResize() {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
      path = resample(SHAPE, canvas.width, canvas.height, 120);
    }

    function onMove(e) {
      if (!active || phase !== 'trace') return;
      mx = e.clientX; my = e.clientY;
      const threshold = Math.max(52, canvas.width * 0.055);
      // 必须先在起点附近落笔
      if (!started) {
        if (Math.hypot(path[0].x - mx, path[0].y - my) < threshold) started = true;
        else return;
      }
      const look = 9;
      const prev = progress;
      for (let i = progress; i <= Math.min(path.length - 1, progress + look); i++) {
        const d = Math.hypot(path[i].x - mx, path[i].y - my);
        if (d < threshold && i > progress) progress = i;
      }
      if (progress > prev && Math.random() < 0.4) {
        spawnRipple(path[progress].x, path[progress].y, 60);
      }
      if (progress >= path.length - 1) complete();
    }

    function spawnRipple(x, y, max) {
      ripples.push({ x, y, r: 2, life: 1, max });
      if (ripples.length > 40) ripples.shift();
    }

    function complete() {
      if (phase !== 'trace') return;
      phase = 'bloom'; phaseT = 0;
      hintEl.textContent = I18N.t('trace.done');
      skipBtn.hidden = true;
      AudioMan.click();
      // 成符时从中心迸发的水波
      spawnRipple(cx, cy, Math.max(canvas.width, canvas.height) * 0.7);
      setTimeout(() => spawnRipple(cx, cy, Math.max(canvas.width, canvas.height) * 0.9), 180);
    }

    function onSkip() { phase = 'out'; phaseT = 0; }

    function drawWaterBg(fade) {
      const W = canvas.width, H = canvas.height;
      // 不透明黑水底（fade 控制与 dream 的交叠）
      ctx.save();
      ctx.globalAlpha = fade;
      const g = ctx.createRadialGradient(cx, cy, 0, cx, cy, Math.max(W, H) * 0.75);
      g.addColorStop(0, '#0c1526');
      g.addColorStop(0.5, '#080d18');
      g.addColorStop(1, '#04060c');
      ctx.fillStyle = g;
      ctx.fillRect(0, 0, W, H);
      ctx.restore();
    }

    function drawRipples(fade, dt) {
      ctx.save();
      ctx.globalAlpha = fade;
      ctx.lineWidth = 1.2;
      for (let i = ripples.length - 1; i >= 0; i--) {
        const rp = ripples[i];
        rp.r += (rp.max - rp.r) * 0.045 + 0.6;
        rp.life -= 0.012;
        if (rp.life <= 0 || rp.r >= rp.max) { ripples.splice(i, 1); continue; }
        ctx.strokeStyle = `rgba(143,163,191,${rp.life * 0.5})`;
        ctx.beginPath();
        ctx.arc(rp.x, rp.y, rp.r, 0, Math.PI * 2);
        ctx.stroke();
      }
      ctx.restore();
    }

    function loop() {
      raf = requestAnimationFrame(loop);
      if (!active) return;
      const W = canvas.width, H = canvas.height;
      const now = performance.now();
      const t = now / 1000;
      ctx.clearRect(0, 0, W, H);

      phaseT += 0.016;
      let sceneFade = 1;
      let bloom = 0;
      if (phase === 'in') {
        sceneFade = Math.min(1, phaseT / 0.6);
        if (phaseT >= 0.6) { phase = 'trace'; phaseT = 0; }
      } else if (phase === 'bloom') {
        bloom = Math.min(1, phaseT / 0.9);
        if (phaseT >= 1.2) { phase = 'out'; phaseT = 0; }
      } else if (phase === 'out') {
        sceneFade = Math.max(0, 1 - phaseT / 0.7);
        bloom = 1;
        if (phaseT >= 0.72) { finish(true); return; }
      }

      // 环境水波：从中心缓慢外扩
      rippleClock += 0.016;
      if (rippleClock > 1.4) { rippleClock = 0; spawnRipple(cx, cy, Math.max(W, H) * 0.55); }

      drawWaterBg(sceneFade);
      drawRipples(sceneFade, 0.016);

      const contentFade = sceneFade;

      // 未描出的纹路：清晰可辨的中等青灰实线 + 内层虚线导引
      ctx.save();
      ctx.lineCap = 'round'; ctx.lineJoin = 'round';
      ctx.strokeStyle = `rgba(150,170,198,${0.5 * contentFade})`;
      ctx.lineWidth = 2.4;
      ctx.shadowBlur = 8; ctx.shadowColor = 'rgba(143,163,191,0.5)';
      ctx.beginPath();
      for (let i = 0; i < path.length; i++) {
        const p = path[i]; i ? ctx.lineTo(p.x, p.y) : ctx.moveTo(p.x, p.y);
      }
      ctx.stroke();
      // 流动虚线，指示描绘方向
      ctx.setLineDash([2, 12]);
      ctx.lineDashOffset = -(t * 40) % 14;
      ctx.strokeStyle = `rgba(233,228,211,${0.35 * contentFade})`;
      ctx.lineWidth = 1.2;
      ctx.shadowBlur = 0;
      ctx.beginPath();
      for (let i = 0; i < path.length; i++) {
        const p = path[i]; i ? ctx.lineTo(p.x, p.y) : ctx.moveTo(p.x, p.y);
      }
      ctx.stroke();
      ctx.restore();

      // 已描出的暗金鱼符 + 辉光
      const upto = phase === 'trace' ? progress : path.length - 1;
      if (upto > 0) {
        ctx.save();
        ctx.setLineDash([]);
        ctx.lineCap = 'round'; ctx.lineJoin = 'round';
        ctx.shadowBlur = 14 + bloom * 46;
        ctx.shadowColor = 'rgba(201,168,106,0.95)';
        ctx.strokeStyle = `rgba(235,226,198,${contentFade})`;
        ctx.lineWidth = 3 + bloom * 3.5;
        ctx.beginPath();
        for (let i = 0; i <= upto; i++) {
          const p = path[i]; i ? ctx.lineTo(p.x, p.y) : ctx.moveTo(p.x, p.y);
        }
        if (phase !== 'trace') ctx.closePath();
        ctx.stroke();
        ctx.restore();
      }

      // 起点标记（未落笔时脉冲提示"起"）
      if (phase === 'trace' && !started) {
        const pr = 1 + 0.3 * Math.sin(t * 5);
        ctx.save();
        ctx.globalAlpha = contentFade;
        ctx.shadowBlur = 22; ctx.shadowColor = 'rgba(201,168,106,0.95)';
        ctx.strokeStyle = 'rgba(201,168,106,0.95)';
        ctx.lineWidth = 2;
        ctx.beginPath(); ctx.arc(path[0].x, path[0].y, 16 * pr, 0, Math.PI * 2); ctx.stroke();
        ctx.fillStyle = 'rgba(235,226,198,0.95)';
        ctx.beginPath(); ctx.arc(path[0].x, path[0].y, 5, 0, Math.PI * 2); ctx.fill();
        ctx.restore();
      }

      // 描线中：方向导引彗星，从当前进度向前扫，明确"往哪描"
      if (phase === 'trace' && started && progress < path.length - 1) {
        const span = 14;
        const head = Math.min(path.length - 1, progress + 2 + Math.floor(((t * 26) % span)));
        for (let k = 0; k < 8; k++) {
          const idx = head - k;
          if (idx <= progress) break;
          const p = path[idx];
          ctx.save();
          ctx.globalAlpha = (1 - k / 8) * 0.9 * contentFade;
          ctx.shadowBlur = 14; ctx.shadowColor = 'rgba(201,168,106,0.9)';
          ctx.fillStyle = 'rgba(233,224,196,0.95)';
          ctx.beginPath(); ctx.arc(p.x, p.y, 4 - k * 0.35, 0, Math.PI * 2); ctx.fill();
          ctx.restore();
        }
      }

      // 鱼眼：成符时点亮
      if (eyeXY) {
        ctx.save();
        ctx.globalAlpha = contentFade * (phase === 'trace' ? 0.35 : 1);
        ctx.shadowBlur = 10 + bloom * 20; ctx.shadowColor = 'rgba(233,224,196,0.9)';
        ctx.fillStyle = 'rgba(233,224,196,0.95)';
        ctx.beginPath(); ctx.arc(eyeXY.x, eyeXY.y, 2.5 + bloom * 3, 0, Math.PI * 2); ctx.fill();
        ctx.restore();
      }
    }

    function finish(completed) {
      stop();
      const cb = doneCb; doneCb = null;
      if (cb) cb(completed);
    }

    function stop() {
      if (!active && canvas.hidden) return;
      active = false;
      cancelAnimationFrame(raf);
      clearTimeout(skipTimer);
      canvas.removeEventListener('pointermove', onMove);
      canvas.removeEventListener('pointerdown', onMove);
      window.removeEventListener('resize', onResize);
      skipBtn.removeEventListener('click', onSkip);
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      canvas.hidden = true;
      ui.hidden = true;
      skipBtn.hidden = true;
    }

    return { start, stop };
  })();

  /* ==========================================================
     心象 · 数值系统（神志 / 褪色 / 眷恋）
     可展开面板 + 实时浮动增减 + 结局判定
     ========================================================== */
  const Stats = (() => {
    const CFG = STORY.stats;
    const panel = $('#stats-panel');
    const toggleBtn = $('#hud-stats');
    const rows = {};
    CFG.keys.forEach(k => {
      const row = panel.querySelector(`.stat-row[data-stat="${k}"]`);
      rows[k] = {
        row,
        bar: row.querySelector('.stat-bar i'),
        val: row.querySelector('.stat-val'),
        delta: row.querySelector('.stat-delta')
      };
    });

    let vals = Object.assign({}, CFG.init);
    let applied = {};
    let open = false;
    let pinned = false;
    let autoHideTimer = null;

    const clamp = (v, k) => Math.max(0, Math.min(CFG.max[k], v));

    function render() {
      CFG.keys.forEach(k => {
        rows[k].bar.style.width = (vals[k] / CFG.max[k] * 100) + '%';
        rows[k].val.textContent = Math.round(vals[k]);
      });
    }

    function clearDelta(k) {
      const el = rows[k].delta;
      el.classList.remove('up', 'down', 'show');
      el.textContent = '';
      if (rows[k].deltaTimer) { clearTimeout(rows[k].deltaTimer); rows[k].deltaTimer = null; }
    }
    function showDelta(k, d) {
      const el = rows[k].delta;
      clearDelta(k);
      el.textContent = (d > 0 ? '+' : '') + d;
      void el.offsetWidth;
      el.classList.add(d > 0 ? 'up' : 'down', 'show');
      rows[k].row.classList.add('flash');
      setTimeout(() => rows[k].row.classList.remove('flash'), 520);
      // 动画结束后清掉浮标，回到只显示数值的常态
      rows[k].deltaTimer = setTimeout(() => clearDelta(k), 1450);
    }

    function setOpen(o) {
      open = o;
      panel.hidden = !o;
      toggleBtn.classList.toggle('on', o);
      toggleBtn.setAttribute('aria-expanded', String(o));
    }
    function openTransient() {
      if (pinned) return;
      setOpen(true);
      clearTimeout(autoHideTimer);
      autoHideTimer = setTimeout(() => { if (!pinned) setOpen(false); }, 3000);
    }

    function applyDelta(delta) {
      let changed = false;
      for (const k in delta) {
        if (!(k in vals)) continue;
        const before = vals[k];
        vals[k] = clamp(vals[k] + delta[k], k);
        if (vals[k] !== before) { showDelta(k, delta[k]); changed = true; }
      }
      render();
      if (changed) { toggleBtn.classList.add('pulse'); setTimeout(() => toggleBtn.classList.remove('pulse'), 600); openTransient(); }
      return changed;
    }

    function applyOnce(key, delta) {
      if (applied[key]) return;
      applied[key] = true;
      applyDelta(delta);
    }

    function verdict() {
      const p = CFG.pass;
      if (vals.san <= p.san) return 'lost';    // 神志垫底
      if (vals.love < p.love) return 'cold';   // 眷恋不足
      if (vals.fade < p.fade) return 'cling';  // 褪色未满（未完全遗忘）
      return 'true';
    }

    function reset() { vals = Object.assign({}, CFG.init); applied = {}; CFG.keys.forEach(clearDelta); render(); }
    function serialize() { return { vals: Object.assign({}, vals), applied: Object.assign({}, applied) }; }
    function load(data) {
      vals = Object.assign({}, CFG.init, data && data.vals);
      applied = Object.assign({}, data && data.applied);
      CFG.keys.forEach(clearDelta);
      render();
    }
    function get() { return Object.assign({}, vals); }

    toggleBtn.addEventListener('click', () => {
      pinned = !open ? true : !pinned;   // 手动打开=固定；再点=收回
      if (open && pinned) { pinned = false; setOpen(false); }
      else { setOpen(!open); }
      clearTimeout(autoHideTimer);
    });

    render();
    return { applyOnce, applyDelta, verdict, reset, serialize, load, get, setOpen };
  })();

  /* ==========================================================
     通用 UI：toast / tooltip / ripple / 确认弹窗
     ========================================================== */
  const toastEl = $('#toast');
  let toastTimer = null;
  function toast(msg) {
    toastEl.textContent = msg;
    toastEl.hidden = false;
    requestAnimationFrame(() => toastEl.classList.add('show'));
    clearTimeout(toastTimer);
    toastTimer = setTimeout(() => {
      toastEl.classList.remove('show');
      setTimeout(() => { toastEl.hidden = true; }, 350);
    }, 2200);
  }

  const tipEl = $('#tooltip');
  document.addEventListener('mouseover', (e) => {
    const t = e.target.closest ? e.target.closest('[data-tip]') : null;
    if (!t || !t.getAttribute('data-tip')) { tipEl.classList.remove('show'); return; }
    const raw = t.getAttribute('data-tip');
    const text = raw.startsWith('i18n:') ? I18N.t(raw.slice(5)) : raw;
    if (!text) return;
    tipEl.textContent = text;
    tipEl.hidden = false;
    const r = t.getBoundingClientRect();
    tipEl.style.left = Math.min(window.innerWidth - 150, Math.max(8, r.left + r.width / 2 - 60)) + 'px';
    tipEl.style.top = Math.max(8, r.top - 34) + 'px';
    tipEl.classList.add('show');
  });
  document.addEventListener('mouseout', (e) => {
    if (e.target.closest && e.target.closest('[data-tip]')) tipEl.classList.remove('show');
  });

  // 按钮涟漪 + 点击音
  document.addEventListener('click', (e) => {
    const btn = e.target.closest ? e.target.closest('button') : null;
    if (!btn || btn.disabled) return;
    AudioMan.click();
    const r = btn.getBoundingClientRect();
    const rip = document.createElement('span');
    rip.className = 'ripple';
    const size = Math.max(r.width, r.height);
    rip.style.width = rip.style.height = size + 'px';
    rip.style.left = (e.clientX - r.left - size / 2) + 'px';
    rip.style.top = (e.clientY - r.top - size / 2) + 'px';
    btn.appendChild(rip);
    setTimeout(() => rip.remove(), 650);
  }, true);

  /* ---- 确认弹窗 ---- */
  const confirmModal = $('#confirm-modal');
  let confirmCb = null;
  function askConfirm(msg, onOk) {
    $('#confirm-text').textContent = msg;
    confirmCb = onOk;
    openOverlay(confirmModal);
  }
  $('#confirm-ok').addEventListener('click', () => {
    closeOverlay(confirmModal);
    const cb = confirmCb; confirmCb = null;
    if (cb) cb();
  });
  $('#confirm-cancel').addEventListener('click', () => {
    confirmCb = null;
    closeOverlay(confirmModal);
  });

  /* ---- overlay 开关 ---- */
  function openOverlay(el) {
    el.hidden = false;
    requestAnimationFrame(() => el.classList.add('show'));
  }
  function closeOverlay(el) {
    el.classList.remove('show');
    setTimeout(() => { el.hidden = true; }, 300);
  }
  function anyOverlayOpen() {
    return $$('.overlay').some(o => !o.hidden);
  }
  $$('.overlay [data-close-overlay]').forEach(b =>
    b.addEventListener('click', () => closeOverlay(b.closest('.overlay'))));
  $$('.overlay').forEach(o => o.addEventListener('click', (e) => {
    // confirm / name 弹层必须显式选择，不允许点背景关闭
    if (e.target === o && o.id !== 'confirm-modal' && o.id !== 'name-overlay') closeOverlay(o);
  }));

  /* ==========================================================
     屏幕状态机
     ========================================================== */
  const Screens = (() => {
    let current = 'boot';
    let returnTo = 'title';       // 子页面返回目标

    function raw(name) { return $('#screen-' + name); }

    function go(name, opts) {
      opts = opts || {};
      if (name === current) return;
      const fader = $('#fader');
      fader.classList.add('on');
      setTimeout(() => {
        raw(current).classList.remove('active');
        raw(name).classList.add('active');
        current = name;
        body.setAttribute('data-screen', name);
        if (opts.onShown) opts.onShown();
        // 每屏对应的粒子氛围
        if (name === 'title') { FX.setMode('dust'); AudioMan.playBgm('title'); }
        else if (name !== 'game') FX.setMode('dust');
        fader.classList.remove('on');
      }, 560 * (SS.getSettings().motion === 'low' ? 0.5 : 1));
    }

    function openSub(name, from) {
      returnTo = from || current;
      go(name);
    }
    function back() { go(returnTo); returnTo = 'title'; }
    function get() { return current; }

    $$('[data-back]').forEach(b => b.addEventListener('click', back));

    return { go, openSub, back, get };
  })();

  /* ==========================================================
     剧情引擎
     ========================================================== */
  const Engine = (() => {
    const bgA = $('#bg-a');
    const bgB = $('#bg-b');
    const stageVideo = $('#stage-video');
    const flashEl = $('#stage-flash');
    const dialogWrap = $('#dialog-wrap');
    const dialogBox = $('#dialog-box');
    const dialogText = $('#dialog-text');
    const namebox = $('#namebox');
    const nameText = $('#name-text');
    const contHint = $('#continue-hint');
    const choiceArea = $('#choice-area');
    const hudChapter = $('#hud-chapter');
    const videoHint = $('#video-hint');
    const clickHint = $('#click-hint');
    const fishStrip = $('#fish-strip');
    const fishTrack = $('#fish-track');

    // 文字框四角饰线
    ['tl', 'tr', 'bl', 'br'].forEach(c => {
      const i = document.createElement('i');
      i.className = 'dlg-corner ' + c;
      dialogBox.appendChild(i);
    });

    let nodeId = null;
    let node = null;
    let mode = 'idle';           // line | visual | video | choice | hub | strip
    let typing = false;
    let typeTimer = null;
    let autoTimer = null;
    let nodeTimer = null;
    let fullText = '';
    let charIdx = 0;
    let activeBg = bgA;
    let lastBg = null;
    let chapterKey = 'ch.prologue';
    let auto = false;
    let skip = false;
    let holdSkip = false;
    let log = [];
    let choicesMade = {};
    let frags = {};              // 记忆残片（数值系统：集齐收束）
    let fishHandler = null;
    let videoExtraCleanup = null;

    /* ---- 进度标记（完成的场景，用于门禁：床解锁 / 梦二解锁） ---- */
    function renderFrags() { /* 计数 HUD 已由心象面板取代，保留空实现兼容旧调用 */ }
    function grantFrag(key) {
      if (!key || frags[key]) return;
      frags[key] = true;
      writeAutosave();
    }
    function isBedUnlocked() {
      return STORY.bedUnlock.every(k => frags[k]);
    }

    /* ---- 速度换算 ---- */
    function typeInterval() {
      if (skip || holdSkip) return 8;
      const s = SS.getSettings().textSpeed;      // 1..10
      return Math.max(12, 96 - s * 8.5);
    }
    function autoDelay() {
      const s = SS.getSettings().autoSpeed;      // 1..10
      return 3800 - s * 320;                     // 3480ms .. 600ms
    }

    /* ---- 背景交叉淡入 ---- */
    function setBg(src, bgMode) {
      if (!src) { bgA.classList.remove('show'); bgB.classList.remove('show'); lastBg = null; return; }
      if (src === lastBg) return;
      lastBg = src;
      const next = activeBg === bgA ? bgB : bgA;
      next.classList.toggle('contain-stars', bgMode === 'contain-stars');
      next.src = src;
      next.classList.add('show');
      activeBg.classList.remove('show');
      activeBg = next;
    }

    /* ---- 打字机 ---- */
    function typeLine(text, done) {
      clearInterval(typeTimer);
      typing = true;
      charIdx = 0;
      fullText = text;
      dialogText.textContent = '';
      contHint.classList.remove('on');
      typeTimer = setInterval(() => {
        charIdx++;
        dialogText.textContent = fullText.slice(0, charIdx);
        if (charIdx >= fullText.length) {
          clearInterval(typeTimer);
          typing = false;
          contHint.classList.add('on');
          if (done) done();
        }
      }, typeInterval());
    }
    function completeLine() {
      clearInterval(typeTimer);
      typing = false;
      dialogText.textContent = fullText;
      contHint.classList.add('on');
      armAuto();
    }

    function armAuto() {
      clearTimeout(autoTimer);
      if (mode !== 'line') return;
      if (skip || holdSkip) {
        autoTimer = setTimeout(advance, 160);
      } else if (auto) {
        autoTimer = setTimeout(advance, autoDelay());
      }
    }

    /* ---- 通用清场 ---- */
    function clearTransient() {
      clearInterval(typeTimer);
      clearTimeout(autoTimer);
      clearTimeout(nodeTimer);
      typing = false;
      choiceArea.hidden = true;
      choiceArea.innerHTML = '';
      videoHint.hidden = true;
      clickHint.hidden = true;
      FishTrace.stop();
      body.classList.remove('trace-mode');
      stageVideo.hidden = true;
      stageVideo.pause();
      stageVideo.removeAttribute('src');
      stageVideo.loop = false;
      stageVideo.onended = null;
      if (videoExtraCleanup) { videoExtraCleanup(); videoExtraCleanup = null; }
      fishStrip.hidden = true;
      fishTrack.innerHTML = '';
      if (fishHandler) {
        document.removeEventListener('mousemove', fishHandler);
        fishHandler = null;
      }
      RoomHub.exit();
    }

    /* ---- 展示节点 ---- */
    function showNode(id) {
      const n = STORY.nodes[id];
      if (!n) { console.warn('missing node', id); return; }
      clearTransient();
      nodeId = id;
      node = n;
      mode = n.type;

      if (n.chapter) {
        chapterKey = n.chapter;
        SS.unlockChapter(n.chapter);
      }
      hudChapter.textContent = I18N.t(chapterKey);

      if (n.bgm !== undefined) AudioMan.playBgm(n.bgm);
      if (n.fx) FX.setMode(n.fx);
      if (n.bg) setBg(n.bg, n.bgMode);
      else if (n.type === 'choice' && !n.keepBg && n.bg === null) setBg(null);

      // 闪黑入场（原 demo D2 的闪烁）
      if (n.flash && SS.getSettings().motion !== 'low') {
        flashEl.hidden = false;
        flashEl.classList.add('on');
        setTimeout(() => flashEl.classList.remove('on'), 130);
        setTimeout(() => {
          flashEl.classList.add('on');
          setTimeout(() => { flashEl.classList.remove('on'); flashEl.hidden = true; }, 420);
        }, 380);
      }

      // 数值结算：非 choice/trace 节点在展示时结算一次（trace 在描完时结算，choice 在点选时结算）
      if (n.stats && n.type !== 'choice' && n.type !== 'trace') {
        Stats.applyOnce('node:' + id, n.stats);
      }

      switch (n.type) {
        case 'line':    showLine(n); break;
        case 'visual':  showVisual(n); break;
        case 'video':   showVideo(n); break;
        case 'choice':  showChoice(n); break;
        case 'strip':   showStrip(n); break;
        case 'trace':   showTrace(n); break;
        case 'hub':     showHub(n); break;
        case 'verdict': runVerdict(); break;
      }

      // 行进类节点写入自动存档
      if (n.type === 'line' || n.type === 'hub' || n.type === 'choice') {
        writeAutosave();
      }
    }

    function showLine(n) {
      dialogWrap.hidden = false;
      dialogBox.classList.toggle('em', n.style === 'em');
      dialogBox.classList.toggle('narration', !n.speaker);

      if (n.video) {   // 街景循环影像叠加
        stageVideo.hidden = false;
        stageVideo.src = n.video;
        stageVideo.loop = true;
        stageVideo.muted = true;
        stageVideo.play().catch(() => {});
      }

      if (n.speaker && STORY.speakers[n.speaker]) {
        const sp = STORY.speakers[n.speaker];
        namebox.hidden = false;
        namebox.className = sp.cls || '';
        // 玩家输入的名字显示在 user 文字框上方（与「？」名牌同位）
        nameText.textContent = (n.speaker === 'me' && SS.getSettings().playerName)
          ? SS.getSettings().playerName
          : I18N.pick(sp);
      } else {
        namebox.hidden = true;
      }

      const text = I18N.pick(n.text);
      log.push({ speaker: n.speaker || null, text: n.text, nodeId });
      typeLine(text, armAuto);
    }

    function showVisual(n) {
      dialogWrap.hidden = true;
      namebox.hidden = true;
      if (n.autoNext) {
        nodeTimer = setTimeout(() => showNode(n.next), n.autoNext);
      } else {
        clickHint.hidden = false;   // 明确告诉玩家：这里需要点击
      }
    }

    function showTrace(n) {
      dialogWrap.hidden = true;
      namebox.hidden = true;
      body.classList.add('trace-mode');
      FishTrace.start((completed) => {
        body.classList.remove('trace-mode');
        if (completed) {
          grantFrag(n.frag);
          if (n.stats) Stats.applyOnce('node:' + nodeId, n.stats);   // 封存成功才 +褪色
        }
        showNode(n.next);
      });
    }

    function showVideo(n) {
      dialogWrap.hidden = true;
      namebox.hidden = true;
      stageVideo.hidden = false;
      stageVideo.src = n.src;
      stageVideo.muted = false;
      stageVideo.loop = false;
      stageVideo.play().catch(() => {});
      videoHint.hidden = false;
      if (n.audio === 'tv') {
        AudioMan.playExtra('assets/audio/tv-audio.mp4', false);
        videoExtraCleanup = () => AudioMan.stopExtra();
      }
      stageVideo.onended = () => finishNode();
    }

    function showChoice(n) {
      dialogWrap.hidden = true;
      namebox.hidden = true;
      choiceArea.hidden = false;
      choiceArea.innerHTML = '';
      if (n.prompt) {
        const p = document.createElement('div');
        p.className = 'choice-prompt';
        p.textContent = I18N.pick(n.prompt);
        choiceArea.appendChild(p);
      }
      n.choices.forEach((c, i) => {
        const b = document.createElement('button');
        b.className = 'btn btn-choice' + (c.subtle ? ' subtle' : '');
        b.style.animationDelay = (0.12 + i * 0.14) + 's';
        const locked = c.lock && !frags[c.lock];
        if (locked) {
          b.classList.add('locked');
          b.disabled = true;
          b.textContent = I18N.pick(c.text);
          if (c.lockHint) {
            const lh = document.createElement('span');
            lh.className = 'choice-lock-hint';
            lh.textContent = I18N.pick(c.lockHint);
            b.appendChild(lh);
          }
          choiceArea.appendChild(b);
          return;
        }
        b.textContent = I18N.pick(c.text);
        const cKey = nodeId + ':' + i;
        if (choicesMade[cKey]) b.classList.add('chosen-before');
        b.addEventListener('click', (e) => {
          e.stopPropagation();
          choicesMade[cKey] = true;
          if (c.stats) Stats.applyOnce('choice:' + cKey, c.stats);   // 选项结算数值
          if (c.frag) grantFrag(c.frag);
          b.classList.add('picked');
          $$('.btn-choice', choiceArea).forEach(x => { x.disabled = true; });
          setTimeout(() => showNode(c.next), 480);
        });
        choiceArea.appendChild(b);
      });
    }

    function showStrip(n) {
      dialogWrap.hidden = true;
      fishStrip.hidden = false;
      const PANELS = 15, center = Math.floor(PANELS / 2);
      for (let i = 0; i < PANELS; i++) {
        const img = document.createElement('img');
        img.src = n.image;
        img.alt = '';
        fishTrack.appendChild(img);
      }
      const baseOff = () => -center * window.innerWidth;
      fishTrack.style.transform = `translateX(${baseOff()}px)`;
      fishHandler = (e) => {
        const ratio = Math.max(0, Math.min(1, e.clientX / window.innerWidth));
        const off = (ratio - 0.5) * 2 * 5 * window.innerWidth * 0.66;
        fishTrack.style.transform = `translateX(${baseOff() + off}px)`;
      };
      document.addEventListener('mousemove', fishHandler);
      nodeTimer = setTimeout(() => finishNode(), n.duration || 6000);
    }

    function showHub() {
      dialogWrap.hidden = true;
      namebox.hidden = true;
      setBg(null);
      RoomHub.enter();
    }

    /* ---- 结局判定：三值决定去留 ---- */
    function runVerdict() {
      dialogWrap.hidden = true;
      namebox.hidden = true;
      const v = Stats.verdict();
      if (v === 'true') {
        showNode('d2_true');
      } else {
        bloodEnding(v);   // lost | cold | cling
      }
    }

    /* ---- 血色囚困结局 ---- */
    function bloodEnding(variant) {
      clearTransient();
      mode = 'blood';
      node = null;
      SS.unlockEnding(variant);
      AudioMan.playBgm(null);
      AudioMan.stopExtra();

      const bo = $('#blood-overlay');
      const bt = $('#blood-text');
      const be = $('#blood-epigraph');
      bo.hidden = false;
      bo.classList.remove('veil');
      bt.classList.remove('show', 'drip');
      be.classList.remove('show');
      bt.textContent = '';
      be.textContent = '';

      requestAnimationFrame(() => bo.classList.add('veil'));
      setTimeout(() => { bt.textContent = I18N.t('blood.' + variant); bt.classList.add('show', 'drip'); }, 1000);
      setTimeout(() => { bt.textContent = I18N.t('blood.trap'); }, 3600);
      setTimeout(() => { be.textContent = I18N.t('blood.epigraph'); be.classList.add('show'); }, 5000);
      setTimeout(() => {
        // 淡出血色 → 重置这一轮 → 从房间重新开始（不回主页，可存读档）
        bo.classList.remove('veil');
        bt.classList.remove('show', 'drip');
        be.classList.remove('show');
        setTimeout(() => { bo.hidden = true; }, 1400);
        Stats.reset();
        frags = {};
        choicesMade = {};
        chapterKey = 'ch.room';
        showNode('room');
        writeAutosave();
      }, 8800);
    }

    /* ---- 前进 ---- */
    function finishNode() {
      if (node && node.ending) {
        const fresh = SS.unlockEnding(node.ending);
        if (fresh) toast(I18N.t('toast.endingUnlocked') + I18N.t('end.' + node.ending));
      }
      if (node && node.frag) grantFrag(node.frag);
      const nxt = node && node.next;
      if (nxt === '@credits') {
        resetToIdle();
        refreshContinue();
        Screens.go('credits');
        return;
      }
      if (nxt === '@title') {
        // 真结局：走出房间，回到主页；本轮完成，清空自动存档
        resetToIdle();
        Stats.reset();
        frags = {};
        choicesMade = {};
        SS.setAutosave(null);
        refreshContinue();
        Screens.go('title');
        return;
      }
      if (nxt) showNode(nxt);
    }

    function resetToIdle() {
      clearTransient();
      mode = 'idle';
      node = null;
      nodeId = null;
      clearTimeout(autoTimer);
    }

    function advance() {
      if (anyOverlayOpen()) return;
      if (body.classList.contains('ui-hidden')) { setUiHidden(false); return; }
      if (mode === 'line') {
        if (typing) { completeLine(); return; }
        finishNode();
      } else if (mode === 'visual') {
        if (!node.autoNext) finishNode();
      } else if (mode === 'video' || mode === 'strip') {
        finishNode();       // 点击跳过
      }
      // choice / hub 由各自元素处理
    }

    /* ---- 自动存档 & 存档记录 ---- */
    function makeRecord() {
      const snippet = node && node.text ? node.text
        : (node && node.prompt ? node.prompt
        : { zh: I18N.t(chapterKey), en: I18N.t(chapterKey) });
      return {
        nodeId,
        chapterKey,
        ts: Date.now(),
        snippet,
        thumb: lastBg || 'assets/bg/room-thumb.jpg',
        choicesMade,
        frags,
        stats: Stats.serialize()
      };
    }
    function writeAutosave() {
      SS.setAutosave(makeRecord());
    }

    function loadRecord(rec) {
      if (!rec) return;
      choicesMade = rec.choicesMade || {};
      frags = rec.frags || {};
      Stats.load(rec.stats);
      chapterKey = rec.chapterKey || 'ch.prologue';
      log = [];
      Screens.go('game', {
        onShown: () => {
          if (rec.thumb) { lastBg = null; setBg(rec.thumb); }
          showNode(rec.nodeId);
          maybeShowHelp();
        }
      });
    }

    function startNew() {
      log = [];
      choicesMade = {};
      frags = {};
      Stats.reset();
      lastBg = null;
      setAuto(false); setSkip(false);
      Screens.go('game', {
        onShown: () => {
          showNode(STORY.startNode);
          maybeShowHelp();
        }
      });
    }

    function jumpChapter(nodeKey) {
      log = [];
      setAuto(false); setSkip(false);
      Screens.go('game', {
        onShown: () => {
          showNode(nodeKey);
          maybeShowHelp();
        }
      });
    }

    /* ---- auto / skip / hide ---- */
    function setAuto(v) {
      auto = v;
      $('#ctl-auto').classList.toggle('on', v);
      if (v) { setSkipInternal(false); armAuto(); }
      else clearTimeout(autoTimer);
    }
    function setSkipInternal(v) {
      skip = v;
      $('#ctl-skip').classList.toggle('on', v);
    }
    function setSkip(v) {
      setSkipInternal(v);
      if (v) {
        auto = false;
        $('#ctl-auto').classList.remove('on');
        if (mode === 'line' && !typing) armAuto();
        else if (mode === 'line' && typing) { clearInterval(typeTimer); typeLine(fullText.slice ? fullText : '', armAuto); }
      } else clearTimeout(autoTimer);
    }
    function setHoldSkip(v) {
      if (holdSkip === v) return;
      holdSkip = v;
      if (v && mode === 'line') { if (!typing) armAuto(); }
      if (!v && !skip && !auto) clearTimeout(autoTimer);
    }

    function setUiHidden(v) {
      body.classList.toggle('ui-hidden', v);
      if (v) toast(I18N.t('toast.uiHidden'));
    }

    /* ---- 帮助（首次） ---- */
    function maybeShowHelp() {
      if (!SS.getSettings().helpSeen) openOverlay($('#help-overlay'));
    }

    /* ---- 舞台点击推进 ---- */
    $('#screen-game').addEventListener('click', (e) => {
      if (e.target.closest('button') || e.target.closest('#control-bar') ||
          e.target.closest('#hud-top') || e.target.closest('#room-actions')) return;
      // 房间热点由 RoomHub 处理；用 target 判断而非 mode——因为热点激活会先把 mode 改成
      // video/line/choice，若仍走 advance() 会把刚打开的视频当场跳过（历史大 bug）
      if (e.target.closest('#room-hub') || mode === 'hub') return;
      advance();
    });

    I18N.onChange(() => {
      // 语言切换即时刷新当前行 / 名字 / 章节名
      hudChapter.textContent = I18N.t(chapterKey);
      if (mode === 'line' && node) {
        const text = I18N.pick(node.text);
        fullText = text;
        if (!typing) dialogText.textContent = text;
        if (node.speaker && STORY.speakers[node.speaker]) {
          nameText.textContent = (node.speaker === 'me' && SS.getSettings().playerName)
            ? SS.getSettings().playerName
            : I18N.pick(STORY.speakers[node.speaker]);
        }
      }
      if (mode === 'choice' && node) showChoice(node);
    });

    /* 标签页隐藏时暂停舞台视频，回来续播（防后台出声） */
    document.addEventListener('visibilitychange', () => {
      if (document.visibilityState === 'hidden') {
        if (!stageVideo.hidden && !stageVideo.paused) {
          stageVideo.dataset.resume = '1';
          stageVideo.pause();
        }
      } else if (stageVideo.dataset.resume) {
        delete stageVideo.dataset.resume;
        stageVideo.play().catch(() => {});
      }
    });

    return {
      startNew, jumpChapter, loadRecord, makeRecord, advance,
      show: showNode,
      reset: resetToIdle,
      isBedUnlocked,
      setAuto, setSkip, setHoldSkip, setUiHidden,
      get log() { return log; },
      get auto() { return auto; },
      get skip() { return skip; },
      get mode() { return mode; },
      get uiHidden() { return body.classList.contains('ui-hidden'); }
    };
  })();

  /* ==========================================================
     房间自由探索（原 p5 场景重制：DOM 视差 + 像素级热点）
     ========================================================== */
  const RoomHub = (() => {
    const hub = $('#room-hub');
    const actions = $('#room-actions');
    let built = false;
    let activeFlag = false;
    let layers = [];
    let spots = [];
    let label = null;
    let mx = 0;
    let raf = 0;
    let hovered = null;
    let lastNorm = null;        // 脏标记：视差是否变化
    let lastHoveredDrawn = undefined;
    let introDone = false;

    // 视差深度：数值越大越靠前、移动越多（克制，避免露边）
    const PAR_FACTOR = 1.4;          // 视差位移系数
    const MARGIN = 1.16;             // 覆盖余量（16%），远大于最大视差位移 → 永不露白/露黑边
    let introStart = 0;

    const LAYER_SRCS = [
      { src: 'assets/bg/room-1.png', par: 0 },
      { src: 'assets/bg/room-2.png', par: 9 },
      { src: 'assets/bg/room-3.png', par: 19 },
      { src: 'assets/bg/room-4.png', par: 32 }
    ];
    const SPOT_DEFS = [
      { key: 'bed',  base: 'assets/bg/bed.png',  hover: 'assets/bg/bed-hover.png',  par: 24, label: 'room.bed',  go: 'bed_choice', gate: 'bed' },
      { key: 'tv',   base: 'assets/bg/tv.png',   hover: 'assets/bg/tv-hover.png',   par: 24, label: 'room.tv',   go: 'tv_video' },
      { key: 'card', base: 'assets/bg/card.png', hover: 'assets/bg/card-hover.png', par: 24, label: 'room.card', go: 'card_1' }
    ];

    // 床须先看完电视与塔罗牌才可点（未解锁时灰暗、不可交互）
    function spotLocked(s) { return s.gate === 'bed' && !Engine.isBedUnlocked(); }

    function build() {
      if (built) return;
      built = true;
      LAYER_SRCS.forEach(l => {
        const img = document.createElement('img');
        img.className = 'hub-layer';
        img.alt = '';
        img.addEventListener('load', layout);   // 加载完成即重排，修正 naturalWidth=0 的临时错位
        img.src = l.src;
        hub.appendChild(img);
        layers.push({ el: img, par: l.par });
      });
      SPOT_DEFS.forEach(s => {
        const img = document.createElement('img');
        img.className = 'hub-layer';
        img.alt = '';
        img.setAttribute('data-hotspot', s.key);
        img.addEventListener('load', layout);
        img.src = s.base;
        hub.appendChild(img);
        // 命中检测用预生成的 alpha mask（file:// 下 canvas.getImageData 会因跨源污染抛错）
        const spot = { ...s, el: img, mask: (window.HOTSPOT_MASKS || {})[s.key] || null };
        spots.push(spot);
        layers.push({ el: img, par: s.par, spot });
      });
      label = document.createElement('div');
      label.className = 'hub-label';
      document.body.appendChild(label);

      // 底部真实按钮（移动端 / 无障碍冗余入口，桌面端 CSS 隐藏）
      SPOT_DEFS.forEach(s => {
        const b = document.createElement('button');
        b.className = 'btn hotspot-chip';
        b.dataset.spot = s.key;
        b.setAttribute('data-i18n', s.label);
        b.textContent = I18N.t(s.label);
        b.addEventListener('click', () => {
          if (spotLocked(s)) { toast(I18N.t('toast.bedLocked')); return; }
          activate(s);
        });
        actions.appendChild(b);
        s.chip = b;
      });
    }

    // 进入房间时刷新床 chip 的禁用态 + 灰色锁定滤镜
    function refreshChips() {
      SPOT_DEFS.forEach(s => {
        if (s.chip) s.chip.classList.toggle('chip-locked', spotLocked(s));
      });
      if (spots.length) applySpotFilters();
    }

    function cover(el) {
      const W = window.innerWidth, H = window.innerHeight;
      const nw = el.naturalWidth || 2560, nh = el.naturalHeight || 1600;
      const s = Math.max(W / nw, H / nh) * MARGIN;
      return { s, dw: nw * s, dh: nh * s, W, H };
    }

    function layout() {
      layers.forEach(l => {
        const { dw, dh } = cover(l.el);
        l.el.style.width = dw + 'px';
        l.el.style.height = dh + 'px';
        l.el.style.minWidth = '0';
      });
    }

    function frame() {
      raf = requestAnimationFrame(frame);
      const W = window.innerWidth;
      const norm = (mx - W / 2) / W;    // -0.5 .. 0.5
      // 入场：景深错位淡入，1s 内落定
      const now = performance.now();
      const k = Math.min(1, (now - introStart) / 1000);
      const introRunning = k < 1;
      // 脏标记：入场结束后，视差与悬停都没变 → 本帧什么都不写（避免 Safari 每帧重光栅化大图）
      if (!introRunning && introDone && norm === lastNorm && hovered === lastHoveredDrawn) return;
      if (!introRunning && !introDone) { introDone = true; applySpotFilters(); }
      lastNorm = norm;
      lastHoveredDrawn = hovered;
      const ease = 1 - Math.pow(1 - k, 3);
      hub.style.opacity = ease;
      // 只做位移/缩放（GPU 合成，便宜）；辉光/灰度由 applySpotFilters 在状态改变时设置一次
      layers.forEach((l) => {
        const isHover = l.spot && hovered === l.spot;
        const off = -norm * l.par * PAR_FACTOR;
        const lift = isHover ? -9 : 0;
        const depth = l.par / 32;
        const introShift = (1 - ease) * (16 + depth * 26);
        const introScale = 1 + (1 - ease) * (0.02 + depth * 0.05);
        const hoverScale = isHover ? 1.02 : 1;
        l.el.style.transform =
          `translate(calc(-50% + ${off}px), calc(-50% + ${lift + introShift}px)) scale(${introScale * hoverScale})`;
      });
    }

    // 仅在锁定/悬停状态改变时调用一次。
    // 锁定态用 opacity 变暗（GPU 合成，与视差 transform 不冲突，file:// 也安全）；
    // 不用 grayscale 滤镜——滤镜 + 每帧 transform 会让 Safari 每帧重光栅化整张大图。
    function applySpotFilters() {
      spots.forEach(s => {
        const el = s.el;
        if (spotLocked(s)) {
          el.style.filter = '';
          el.style.opacity = '0.38';
          el.style.zIndex = '';
        } else if (hovered === s && introDone) {
          el.style.opacity = '';
          el.style.filter = 'brightness(1.13) saturate(1.05) drop-shadow(0 0 18px rgba(220,200,150,0.55))';
          el.style.zIndex = '5';
        } else {
          el.style.opacity = '';
          el.style.filter = '';
          el.style.zIndex = '';
        }
      });
    }

    function hitSpot(x, y) {
      const W = window.innerWidth, H = window.innerHeight;
      const norm = (mx - W / 2) / W;
      // 逆序：上层优先
      for (let i = spots.length - 1; i >= 0; i--) {
        const s = spots[i];
        if (!s.mask) continue;
        const { s: sc, dw, dh } = cover(s.el);
        const nw = s.el.naturalWidth || 2560, nh = s.el.naturalHeight || 1600;
        const off = -norm * s.par * PAR_FACTOR;
        const x0 = (W - dw) / 2 + off;
        const y0 = (H - dh) / 2;
        const sx = (x - x0) / sc;   // 源图（naturalWidth×naturalHeight）像素坐标
        const sy = (y - y0) / sc;
        if (sx < 0 || sy < 0 || sx >= nw || sy >= nh) continue;
        const mxCell = Math.floor(sx / nw * s.mask.w);
        const myCell = Math.floor(sy / nh * s.mask.h);
        if (s.mask.bits.charAt(myCell * s.mask.w + mxCell) === '1') return s;
      }
      return null;
    }

    function onMove(e) {
      mx = e.clientX;
      const s = hitSpot(e.clientX, e.clientY);
      const locked = s && spotLocked(s);
      // 锁定的床不参与辉光 hover
      const glowSpot = locked ? null : s;
      if (glowSpot !== hovered) {
        hovered = glowSpot;
        applySpotFilters();   // 状态改变时才重设滤镜（一次）
      }
      if (s) {
        label.textContent = locked ? I18N.t('room.bed') + ' ·  🔒' : I18N.t(s.label);
        label.classList.toggle('locked', !!locked);
        label.classList.add('on');
        label.style.left = e.clientX + 'px';
        label.style.top = (e.clientY - 44) + 'px';
        Cursor.set(locked ? 'disabled' : 'pointer');
      } else {
        label.classList.remove('on', 'locked');
      }
    }

    function onClick(e) {
      if (e.target.closest('button')) return;
      const s = hitSpot(e.clientX, e.clientY);
      if (!s) return;
      if (spotLocked(s)) { AudioMan.click(); toast(I18N.t('toast.bedLocked')); return; }
      AudioMan.click();
      activate(s);
    }

    function activate(s) {
      exitVisual();
      Engine.show(s.go);
    }

    let hintedOnce = false;
    function enter() {
      build();
      layout();
      refreshChips();
      hub.hidden = false;
      actions.hidden = false;
      hub.style.opacity = 0;
      introStart = performance.now();
      introDone = false;
      lastNorm = null;
      lastHoveredDrawn = undefined;
      activeFlag = true;
      hub.addEventListener('mousemove', onMove);
      hub.addEventListener('click', onClick);
      window.addEventListener('resize', layout);
      frame();
      if (!hintedOnce) {
        hintedOnce = true;
        setTimeout(() => { if (activeFlag) toast(I18N.t('room.hint')); }, 1100);
      }
    }

    function exitVisual() {
      if (label) label.classList.remove('on');
      if (hovered) { hovered.el.style.filter = ''; hovered.el.style.zIndex = ''; hovered = null; applySpotFilters(); }
    }

    function exit() {
      if (!activeFlag) return;
      activeFlag = false;
      exitVisual();
      hub.hidden = true;
      actions.hidden = true;
      hub.removeEventListener('mousemove', onMove);
      hub.removeEventListener('click', onClick);
      window.removeEventListener('resize', layout);
      cancelAnimationFrame(raf);
    }

    return { enter, exit };
  })();

  /* ==========================================================
     存档 / 读档界面
     ========================================================== */
  const SavesUI = (() => {
    const grid = $('#slot-grid');
    let mode = 'save';           // save | load
    let fromGame = false;

    function fmtTime(ts) {
      const d = new Date(ts);
      const p = (n) => String(n).padStart(2, '0');
      return `${d.getFullYear()}.${p(d.getMonth() + 1)}.${p(d.getDate())} ${p(d.getHours())}:${p(d.getMinutes())}`;
    }

    function open(m, from) {
      mode = m;
      fromGame = from === 'game';
      $('#tab-save').classList.toggle('on', mode === 'save');
      $('#tab-load').classList.toggle('on', mode === 'load');
      $('#tab-save').disabled = !fromGame;    // 标题页进入只能读档
      render();
      Screens.openSub('saves', from);
    }

    function render() {
      grid.innerHTML = '';
      const slots = SS.getSlots();
      const list = [{ rec: SS.getAutosave(), isAuto: true }]
        .concat(slots.map((rec, i) => ({ rec, i })));

      list.forEach(({ rec, i, isAuto }) => {
        const el = document.createElement('div');
        el.className = 'save-slot';
        el.setAttribute('role', 'button');
        el.tabIndex = 0;
        el.addEventListener('keydown', (e) => {
          if (e.key === 'Enter' || e.code === 'Space') { e.preventDefault(); el.click(); }
        });
        const tag = isAuto ? I18N.t('saves.auto') : `${I18N.t('saves.slot')} ${i + 1}`;

        if (rec) {
          el.innerHTML = `
            <img class="slot-thumb" src="${rec.thumb}" alt="" />
            <span class="slot-body">
              <span class="slot-tag">${tag}</span>
              <span class="slot-chapter">${I18N.t(rec.chapterKey)}</span>
              <span class="slot-snippet">${I18N.pick(rec.snippet)}</span>
              <span class="slot-time">${fmtTime(rec.ts)}</span>
            </span>`;
          if (!isAuto) {
            const del = document.createElement('button');
            del.className = 'slot-del';
            del.textContent = I18N.t('saves.delete');
            del.addEventListener('click', (e) => {
              e.stopPropagation();
              askConfirm(I18N.t('saves.confirmDelete'), () => {
                SS.deleteSlot(i);
                toast(I18N.t('toast.deleted'));
                render();
              });
            });
            el.appendChild(del);
          }
        } else {
          el.innerHTML = `
            <span class="slot-thumb empty">…</span>
            <span class="slot-body">
              <span class="slot-tag empty">${tag}</span>
              <span class="slot-chapter">${I18N.t('saves.empty')}</span>
              <span class="slot-snippet">${I18N.t('saves.emptyHint')}</span>
            </span>`;
        }

        el.addEventListener('click', () => {
          if (mode === 'save') {
            if (isAuto) return;
            const write = () => {
              SS.saveToSlot(i, Engine.makeRecord());
              toast(I18N.t('toast.saved'));
              render();
            };
            if (rec) askConfirm(I18N.t('saves.confirmOverwrite'), write);
            else write();
          } else {
            if (!rec) { toast(I18N.t('saves.noData')); return; }
            askConfirm(I18N.t('saves.confirmLoad'), () => {
              toast(I18N.t('toast.loaded'));
              Engine.loadRecord(rec);
            });
          }
        });
        grid.appendChild(el);
      });
    }

    $('#tab-save').addEventListener('click', () => { mode = 'save'; $('#tab-save').classList.add('on'); $('#tab-load').classList.remove('on'); render(); });
    $('#tab-load').addEventListener('click', () => { mode = 'load'; $('#tab-load').classList.add('on'); $('#tab-save').classList.remove('on'); render(); });

    I18N.onChange(render);
    return { open, render };
  })();

  /* ==========================================================
     设置界面
     ========================================================== */
  const SettingsUI = (() => {
    const s = SS.getSettings;

    function paintSeg(rootSel, val) {
      $$(rootSel + ' .btn-seg').forEach(b =>
        b.classList.toggle('on', b.getAttribute('data-val') === val));
    }
    function paintRange(input, valEl, val, suffix) {
      input.value = val;
      const pct = (val - input.min) / (input.max - input.min) * 100;
      input.style.setProperty('--fill', pct + '%');
      valEl.textContent = suffix ? val + suffix : val;
    }

    function paintAll() {
      const st = s();
      paintSeg('#set-lang', st.lang);
      paintSeg('#set-motion', st.motion);
      paintSeg('#set-font', st.font);
      paintSeg('#set-fullscreen', document.fullscreenElement ? 'on' : 'off');
      paintRange($('#set-textspeed'), $('#val-textspeed'), st.textSpeed);
      paintRange($('#set-autospeed'), $('#val-autospeed'), st.autoSpeed);
      paintRange($('#set-music'), $('#val-music'), st.musicVol, '%');
      paintRange($('#set-sfx'), $('#val-sfx'), st.sfxVol, '%');
    }

    // 分段控件
    $('#set-lang').addEventListener('click', (e) => {
      const b = e.target.closest('.btn-seg'); if (!b) return;
      const v = b.getAttribute('data-val');
      SS.setSetting('lang', v);
      I18N.setLang(v);
      paintAll();
    });
    $('#set-motion').addEventListener('click', (e) => {
      const b = e.target.closest('.btn-seg'); if (!b) return;
      const v = b.getAttribute('data-val');
      SS.setSetting('motion', v);
      body.setAttribute('data-motion', v);
      FX.rebuild();
      paintAll();
    });
    $('#set-font').addEventListener('click', (e) => {
      const b = e.target.closest('.btn-seg'); if (!b) return;
      const v = b.getAttribute('data-val');
      SS.setSetting('font', v);
      body.setAttribute('data-font', v);
      paintAll();
    });
    $('#set-fullscreen').addEventListener('click', (e) => {
      const b = e.target.closest('.btn-seg'); if (!b) return;
      if (b.getAttribute('data-val') === 'on') {
        document.documentElement.requestFullscreen && document.documentElement.requestFullscreen().catch(() => {});
      } else {
        document.exitFullscreen && document.fullscreenElement && document.exitFullscreen();
      }
      setTimeout(paintAll, 300);
    });
    document.addEventListener('fullscreenchange', paintAll);

    // 滑杆
    function bindRange(input, key, valEl, suffix, after) {
      input.addEventListener('input', () => {
        const v = Number(input.value);
        SS.setSetting(key, v);
        paintRange(input, valEl, v, suffix);
        if (after) after(v);
      });
    }
    bindRange($('#set-textspeed'), 'textSpeed', $('#val-textspeed'));
    bindRange($('#set-autospeed'), 'autoSpeed', $('#val-autospeed'));
    bindRange($('#set-music'), 'musicVol', $('#val-music'), '%', (v) => AudioMan.setMusicVol(v));
    bindRange($('#set-sfx'), 'sfxVol', $('#val-sfx'), '%', (v) => AudioMan.setSfxVol(v));

    I18N.onChange(paintAll);
    return { paintAll };
  })();

  /* ==========================================================
     图鉴 / 章节
     ========================================================== */
  function renderGallery() {
    const grid = $('#gallery-grid');
    grid.innerHTML = '';
    STORY.endings.forEach(e => {
      const un = SS.isEndingUnlocked(e.key);
      const card = document.createElement('div');
      card.className = 'ending-card' + (un ? '' : ' locked') + (e.bad ? ' bad' : '');
      card.innerHTML = `
        <img src="${e.thumb}" alt="" />
        <div class="ending-meta">
          <div class="ending-name">${un ? I18N.t(e.name) : I18N.t('gallery.locked')}</div>
          <div class="ending-desc">${un ? I18N.t(e.desc) : I18N.t('gallery.lockedHint')}</div>
        </div>`;
      grid.appendChild(card);
    });
  }

  function renderChapters() {
    const grid = $('#chapter-grid');
    grid.innerHTML = '';
    STORY.chapters.forEach(c => {
      const un = SS.isChapterUnlocked(c.key);
      const b = document.createElement('button');
      b.className = 'chapter-card';
      b.disabled = !un;
      b.innerHTML = `
        <img src="${c.thumb}" alt="" />
        <span class="ch-name">${un ? I18N.t(c.key) : I18N.t('chapters.locked')}</span>`;
      if (un) b.addEventListener('click', () => Engine.jumpChapter(c.node));
      grid.appendChild(b);
    });
  }
  I18N.onChange(() => { renderGallery(); renderChapters(); });

  /* ==========================================================
     日志
     ========================================================== */
  function openLog() {
    const list = $('#log-list');
    list.innerHTML = '';
    if (!Engine.log.length) {
      list.innerHTML = `<li class="log-empty">${I18N.t('log.empty')}</li>`;
    } else {
      Engine.log.forEach(entry => {
        const li = document.createElement('li');
        const name = entry.speaker && STORY.speakers[entry.speaker]
          ? I18N.pick(STORY.speakers[entry.speaker])
          : I18N.t('game.narrator');
        li.innerHTML = `<span class="log-name">${name}</span><span class="log-text">${I18N.pick(entry.text)}</span>`;
        list.appendChild(li);
      });
    }
    openOverlay($('#log-overlay'));
    requestAnimationFrame(() => { list.scrollTop = list.scrollHeight; });
  }

  /* ==========================================================
     标题页 / 全局按钮绑定
     ========================================================== */
  function refreshContinue() {
    $('#btn-continue').disabled = !SS.getAutosave();
  }

  /* ---- 命名环节：新游戏前询问玩家名字 ---- */
  const nameOverlay = $('#name-overlay');
  const nameInput = $('#name-input');
  function askName(onDone) {
    nameInput.value = SS.getSettings().playerName || '';
    nameInput.placeholder = I18N.t('name.placeholder');
    openOverlay(nameOverlay);
    setTimeout(() => nameInput.focus(), 60);
    const finish = (name) => {
      SS.setSetting('playerName', name);
      closeOverlay(nameOverlay);
      onDone();
    };
    const confirmBtn = $('#name-confirm');
    const skipBtn = $('#name-skip');
    confirmBtn.onclick = () => finish(nameInput.value.trim());
    skipBtn.onclick = () => finish('');
    nameInput.onkeydown = (e) => {
      if (e.key === 'Enter') { e.preventDefault(); finish(nameInput.value.trim()); }
    };
  }

  function beginNewGame() {
    askName(() => Engine.startNew());
  }

  $('#btn-new').addEventListener('click', () => {
    if (SS.getAutosave()) askConfirm(I18N.t('confirm.newGame'), beginNewGame);
    else beginNewGame();
  });
  $('#btn-continue').addEventListener('click', () => Engine.loadRecord(SS.getAutosave()));
  $('#btn-chapters').addEventListener('click', () => { renderChapters(); Screens.openSub('chapters', 'title'); });
  $('#btn-saves').addEventListener('click', () => SavesUI.open('load', 'title'));
  $('#btn-settings').addEventListener('click', () => { SettingsUI.paintAll(); Screens.openSub('settings', 'title'); });
  $('#btn-gallery').addEventListener('click', () => { renderGallery(); Screens.openSub('gallery', 'title'); });
  $('#btn-credits').addEventListener('click', () => Screens.openSub('credits', 'title'));

  $('#lang-toggle').addEventListener('click', () => {
    const next = I18N.getLang() === 'zh' ? 'en' : 'zh';
    SS.setSetting('lang', next);
    I18N.setLang(next);
  });

  /* ---- 游戏内控制条 ---- */
  $('#ctl-auto').addEventListener('click', () => {
    Engine.setAuto(!Engine.auto);
    toast(I18N.t(Engine.auto ? 'toast.autoOn' : 'toast.autoOff'));
  });
  $('#ctl-skip').addEventListener('click', () => {
    Engine.setSkip(!Engine.skip);
    toast(I18N.t(Engine.skip ? 'toast.skipOn' : 'toast.skipOff'));
  });
  $('#ctl-log').addEventListener('click', openLog);
  $('#ctl-save').addEventListener('click', () => SavesUI.open('save', 'game'));
  $('#ctl-load').addEventListener('click', () => SavesUI.open('load', 'game'));
  $('#ctl-set').addEventListener('click', () => { SettingsUI.paintAll(); Screens.openSub('settings', 'game'); });
  $('#hud-lang').addEventListener('click', () => {
    const next = I18N.getLang() === 'zh' ? 'en' : 'zh';
    SS.setSetting('lang', next);
    I18N.setLang(next);
  });
  $('#hud-hide').addEventListener('click', () => Engine.setUiHidden(true));
  $('#hud-menu').addEventListener('click', () => {
    askConfirm(I18N.t('confirm.toTitle'), () => {
      refreshContinue();
      Screens.go('title');
    });
  });

  $('#help-dismiss').addEventListener('click', () => {
    SS.setSetting('helpSeen', true);
    closeOverlay($('#help-overlay'));
  });

  /* ==========================================================
     键盘
     ========================================================== */
  document.addEventListener('keydown', (e) => {
    const scr = Screens.get();
    if (e.key === 'Escape') {
      const openO = $$('.overlay').find(o => !o.hidden);
      if (openO) { closeOverlay(openO); confirmCb = null; return; }
      if (scr === 'game') $('#hud-menu').click();
      else if (['saves', 'settings', 'gallery', 'credits', 'chapters'].includes(scr)) Screens.back();
      return;
    }
    if (anyOverlayOpen()) return;

    if (scr === 'game') {
      if (e.code === 'Space' || e.key === 'Enter') { e.preventDefault(); Engine.advance(); }
      else if (e.key === 'h' || e.key === 'H') Engine.setUiHidden(!Engine.uiHidden);
      else if (e.key === 's' || e.key === 'S') SavesUI.open('save', 'game');
      else if (e.key === 'l' || e.key === 'L') SavesUI.open('load', 'game');
      else if (e.key === 'a' || e.key === 'A') $('#ctl-auto').click();
      else if (e.key === 'Control' || e.key === 'Shift') Engine.setHoldSkip(true);
    } else if (scr === 'title') {
      if (e.key === 'Enter') $('#btn-new').click();
    }
  });
  document.addEventListener('keyup', (e) => {
    if (e.key === 'Control' || e.key === 'Shift') Engine.setHoldSkip(false);
  });

  /* ==========================================================
     启动：加载设置 → 预载资源 → 标题
     ========================================================== */
  (function boot() {
    const st = SS.getSettings();
    body.setAttribute('data-motion', st.motion);
    body.setAttribute('data-font', st.font);
    AudioMan.setMusicVol(st.musicVol);
    AudioMan.setSfxVol(st.sfxVol);
    I18N.setLang(st.lang);
    refreshContinue();

    const preload = [
      // 只预载序章最先用到的图，房间大图进房时再按需加载（加快首屏）
      'assets/bg/ext-1.jpg', 'assets/bg/ext-2.jpg', 'assets/bg/ext-3.jpg'
    ];
    const bar = $('#boot-progress');
    let done = 0;
    const tick = () => {
      done++;
      bar.style.width = Math.round(done / preload.length * 100) + '%';
    };
    const jobs = preload.map(src => new Promise(res => {
      const img = new Image();
      img.onload = img.onerror = () => { tick(); res(); };
      img.src = src;
    }));
    Promise.all([
      Promise.all(jobs),
      new Promise(res => setTimeout(res, 1400))    // 至少停留一瞬，让呼吸感成立
    ]).then(() => {
      Screens.go('title');
    });
  })();

})();

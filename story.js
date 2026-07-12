/* ============================================================
   故园旧梦 · Lost Dreams — story.js
   剧情节点数据。原 demo 的正文为英文，全部原样保留于 en 字段；
   zh 为对应的文学化中文译文。
   节点类型：
     line   — 对白/旁白（speaker 为空 = 旁白/独白）
     visual — 纯画面节点（原 demo 的无文字过场，点击继续）
     video  — 视频节点（可点击跳过）
     choice — 分支选择
     hub    — 房间自由探索场景
   可选字段：bg / fx(dust|snow|stars|none) / bgm / flash / strip(鱼卷轴) /
             ending(解锁结局) / chapter(章节起点标记) / style('em'强调)
   ============================================================ */
(function () {
  'use strict';

  const A = 'assets/';

  const story = {

    /* ================= 序章 · 夜归 ================= */

    intro_video: {
      type: 'video',
      chapter: 'ch.prologue',
      src: A + 'video/intro.mp4',
      bgm: null,
      next: 'ext_1'
    },

    ext_1: {
      type: 'visual',
      bg: A + 'bg/ext-1.jpg',
      bgm: 'street',
      fx: 'dust',
      stats: { san: -15 },     // 楼梯上瞥见幻象 → 神志下降
      // TODO: 原 demo 此处为无文字过场图（所有外景/1.png），未删除其位置
      next: 'ext_2'
    },

    ext_2: {
      type: 'visual',
      bg: A + 'bg/ext-2.jpg',
      fx: 'dust',
      // TODO: 原 demo 此处为无文字过场图（所有外景/2.png）
      next: 'street'
    },

    street: {
      type: 'line',
      bg: A + 'bg/ext-3.jpg',
      video: A + 'video/street.mp4',   // 原 demo：123.mp4 循环叠加于外景之上
      fx: 'none',
      speaker: null,
      text: {
        zh: '刚才……是不是看见了什么？还是我眼花了。……算了，先回家吧。',
        en: 'Did I just see something, or was my vision playing tricks on me? …Forget it, I should just head home.'
      },
      next: 'room'
    },

    /* ================= 第一章 · 房间 ================= */

    room: {
      type: 'hub',
      chapter: 'ch.room',
      bgm: 'room',
      fx: 'dust'
      // 热点：bed / tv / card，由 main.js 的 RoomHub 渲染
    },

    /* ---- 电视 ---- */
    tv_video: {
      type: 'video',
      src: A + 'video/tv-show.mp4',
      audio: 'tv',
      frag: 'tv',
      stats: { fade: 20 },     // 沉入旧影 → 褪色（遗忘）上升
      next: 'room'
    },

    /* ---- 塔罗牌 ---- */
    card_1: {
      type: 'line',
      bg: A + 'bg/tarot.jpg',
      bgMode: 'contain-stars',
      bgm: 'card',
      fx: 'stars',
      speaker: null,
      text: {
        zh: '奇怪的塔罗牌……总觉得，好像在哪里见过。',
        en: 'Strange tarot cards? It feels like I\'ve seen them somewhere before.'
      },
      next: 'card_2'
    },
    card_2: {
      type: 'line',
      speaker: null,
      text: {
        zh: '宇宙终将走向热寂。',
        en: 'The universe will undergo heat death.'
      },
      next: 'card_3'
    },
    card_3: {
      type: 'line',
      speaker: null,
      style: 'em',            // 原 demo 此句为红色强调
      text: {
        zh: '（是终结，还是开始？）',
        en: '(An ending, or a beginning?)'
      },
      ending: 'card',
      frag: 'card',
      stats: { san: -15, fade: 10 },   // 热寂之牌 → 神志下降、褪色上升
      next: 'room'
    },

    /* ---- 床 · 入梦选择 ---- */
    bed_choice: {
      type: 'choice',
      bg: null,
      fx: 'snow',              // 原 demo：snow.GIF 背景，此处以粒子雪重制
      bgm: 'snow',
      prompt: {
        zh: '雪落进房间里。要做哪一个梦？',
        en: 'Snow drifts into the room. Which dream will you enter?'
      },
      choices: [
        {
          text: { zh: '梦境一', en: 'Dream 1' },   // 原图片按钮 Ui/D1.png：“Dream 1 ▶”
          next: 'd1_1'
        },
        {
          text: { zh: '梦境二', en: 'Dream 2' },   // 原图片按钮 Ui/D2.png：“Dream 2 ▶”
          lock: 'dream1',      // 须先走完梦境一
          lockHint: { zh: '（那扇门还没打开……先做完第一个梦。）', en: '(That door won’t open yet… finish the first dream.)' },
          next: 'd2_intro'
        },
        {
          text: { zh: '再想想……（回到房间）', en: 'Not yet… (back to the room)' },
          subtle: true,
          next: 'room'
        }
      ]
    },

    /* ================= 梦境一 · 似曾相识 ================= */

    d1_1: {
      type: 'line',
      chapter: 'ch.dream1',
      bg: A + 'bg/raven-11.jpg',
      bgm: 'dream',
      fx: 'dust',
      speaker: 'me',
      stats: { san: -10, fade: 20 },   // 又一次见到「？」→ 神志降、褪色升
      text: {
        zh: '我好像……在哪里见过你。',
        en: 'I feel like I\'ve seen you somewhere before.'
      },
      next: 'd1_2'
    },
    d1_2: {
      type: 'line',
      bg: A + 'bg/raven-12.jpg',
      speaker: 'them',
      text: {
        zh: '当然见过。只是你忘了。',
        en: 'Of course you have. You just forgot.'
      },
      next: 'd1_3'
    },
    d1_3: {
      type: 'line',
      bg: A + 'bg/raven-11.jpg',
      speaker: 'me',
      text: {
        zh: '我是在做梦吗？',
        en: 'Am I dreaming?'
      },
      next: 'd1_4'
    },
    d1_4: {
      type: 'line',
      bg: A + 'bg/raven-14.jpg',
      speaker: 'them',
      text: {
        zh: '可以说是梦，也可以说——你正身处自己的记忆之中。',
        en: 'You could say it’s a dream, or you could say you’re inside your memories.'
      },
      next: 'd1_5'
    },
    d1_5: {
      type: 'line',
      bg: A + 'bg/raven-13.jpg',
      speaker: 'me',
      text: {
        zh: '鱼，代表什么？',
        en: 'What do fish represent?'
      },
      next: 'd1_6'
    },
    d1_6: {
      type: 'line',
      bg: A + 'bg/raven-14.jpg',
      speaker: 'them',
      text: {
        zh: '鱼代表记忆。你得把今晚的记忆存放在这里，才能离开。',
        en: 'Fish represent memories. You have to store tonight’s memories here before you can leave.'
      },
      next: 'd1_trace'
    },
    d1_trace: {
      type: 'trace',            // 封存·描鱼符：完成才 +褪色（把这段记忆封存起来）
      keepBg: true,
      bg: A + 'bg/raven-14.jpg',
      frag: 'fish',
      stats: { fade: 10 },      // 仅在描完（封存成功）时结算，见 engine
      next: 'd1_choice'
    },
    d1_choice: {
      type: 'choice',
      keepBg: true,
      prompt: {
        zh: '（要问下去吗？）',
        en: '(Do you ask?)'
      },
      choices: [
        {
          text: { zh: '为什么？', en: 'Why?' },          // 正解：追问 → 眷恋 +
          stats: { love: 30 },
          next: 'd1_why'
        },
        {
          text: { zh: '…………', en: '. . .' },            // 沉默离开：不加眷恋，且神志 -
          subtle: true,
          stats: { san: -15 },
          frag: 'dream1',       // 即便沉默，也算走完梦境一（解锁梦境二）
          next: 'room'
        }
      ]
    },
    d1_why: {
      type: 'line',
      bg: A + 'bg/raven-14.jpg',
      speaker: 'them',
      text: {
        zh: '人总是怀念过去。当一个时代开始被浪漫化，就说明亲历过它的人，已经忘了它原本的模样。',
        en: 'People always long for the past. When an era begins to be romanticized, it means those who lived through it have already forgotten what it truly looked like.'
      },
      ending: 'dream1',
      frag: 'dream1',
      next: 'room'
    },

    /* ================= 梦境二 · 金鱼 ================= */

    d2_intro: {
      type: 'visual',
      chapter: 'ch.dream2',
      bg: A + 'bg/raven-31.jpg',
      bgm: 'dream',
      fx: 'dust',
      flash: true,             // 原 demo：31 渐入 → 闪黑 → 32 渐入
      autoNext: 2400,
      next: 'd2_1'
    },
    d2_1: {
      type: 'line',
      bg: A + 'bg/raven-32.jpg',
      speaker: 'me',
      stats: { san: -10, fade: 20 },   // 又一次见到「？」
      text: {
        zh: '我知道你是谁。',
        en: 'I know who you are.'
      },
      next: 'd2_2'
    },
    d2_2: {
      type: 'line',
      bg: A + 'bg/raven-34.jpg',
      speaker: 'them',
      text: {
        zh: '我是谁？',
        en: 'Who am I?'
      },
      next: 'd2_who'
    },
    d2_who: {
      type: 'choice',
      keepBg: true,
      prompt: {
        zh: '（她在等一个回答。）',
        en: '(She waits for an answer.)'
      },
      choices: [
        {
          text: { zh: '你是一条金鱼。你，也是我。', en: 'You’re a goldfish. You’re also me.' },
          stats: { love: 30 },       // 正解：认出彼此 → 眷恋 +
          next: 'd2_fish'
        },
        {
          text: { zh: '你只是一场幻觉。', en: 'You’re only an illusion.' },
          subtle: true,
          stats: { san: -15 },       // 否认 → 神志 -，不加眷恋
          next: 'd2_fish'
        }
      ]
    },
    d2_fish: {
      type: 'strip',           // 胶卷式鱼群：鼠标左右拉动，数秒后自动继续
      bg: A + 'bg/raven-32.jpg',
      image: A + 'bg/fish.png',
      duration: 6000,
      stats: { fade: 20 },     // 鱼群穿身而过 → 褪色升（记忆封存）
      next: 'd2_4'
    },
    d2_4: {
      type: 'line',
      bg: A + 'bg/raven-35.jpg',
      speaker: 'them',
      text: {
        zh: '你知道米沙熊吗？我和米沙熊一样，来自过去，却已不再属于过去。',
        en: 'Do you know Misha Bear? Just like Misha Bear, I come from the past, but I no longer belong to it.'
      },
      next: 'd2_bear'
    },
    d2_bear: {
      type: 'video',
      src: A + 'video/bear.mp4',   // 原 demo：xiong.mp4 插曲
      frag: 'dream2',
      next: 'd2_verdict'
    },

    /* ---- 结局判定：三个数值决定去留 ---- */
    d2_verdict: { type: 'verdict' },   // 由 engine 依据 神志/褪色/眷恋 分流

    /* 真结局：三值达标 → 平静告别 → 走出房间 → 主页 */
    d2_true: {
      type: 'line',
      bg: A + 'bg/raven-33.jpg',
      speaker: 'them',
      text: {
        zh: '再见了。你不会再记起我。',
        en: 'Goodbye. You won’t remember me again.'
      },
      ending: 'true',
      next: 'd2_wake'
    },
    d2_wake: {
      type: 'line',
      bg: A + 'bg/ext-2.jpg',
      bgm: 'title',
      fx: 'dust',
      speaker: null,
      text: {
        zh: '你推开门。雪停了，天要亮了。那尾鱼，连同今晚，都留在了身后。',
        en: 'You push the door open. The snow has stopped; dawn is near. The fish, and this whole night, stay behind you.'
      },
      next: '@title'
    }
  };

  /* 说话人表：名字也走双语 */
  const speakers = {
    me:   { zh: '我', en: 'Me',  cls: 'self'  },
    them: { zh: '？', en: '?',   cls: 'other' }
  };

  /* 章节选择入口（按解锁顺序） */
  const chapters = [
    { key: 'ch.prologue', node: 'intro_video', thumb: 'assets/bg/ext-3.jpg' },
    { key: 'ch.room',     node: 'room',        thumb: 'assets/bg/room-thumb.jpg' },
    { key: 'ch.dream1',   node: 'd1_1',        thumb: 'assets/bg/raven-12.jpg' },
    { key: 'ch.dream2',   node: 'd2_intro',    thumb: 'assets/bg/raven-31.jpg' }
  ];

  /* 结局图鉴：真结局 + 三个变种（囚困）结局 + 途中拾得的心象 */
  const endings = [
    { key: 'true', name: 'end.true', desc: 'end.trueDesc', thumb: 'assets/bg/ext-2.jpg' },
    { key: 'lost', name: 'end.lost', desc: 'end.lostDesc', thumb: 'assets/bg/raven-35.jpg', bad: true },
    { key: 'cold', name: 'end.cold', desc: 'end.coldDesc', thumb: 'assets/bg/raven-34.jpg', bad: true },
    { key: 'cling', name: 'end.cling', desc: 'end.clingDesc', thumb: 'assets/bg/raven-33.jpg', bad: true },
    { key: 'card',   name: 'end.card',   desc: 'end.cardDesc',   thumb: 'assets/bg/tarot.jpg' },
    { key: 'dream1', name: 'end.dream1', desc: 'end.dream1Desc', thumb: 'assets/bg/raven-14.jpg' }
  ];

  /* 数值系统（心象）——三值门槛与初值，engine 依此判定去留 */
  const stats = {
    keys: ['san', 'fade', 'love'],
    init: { san: 100, fade: 0, love: 0 },
    max:  { san: 100, fade: 100, love: 100 },
    // 真结局门槛：神志未垫底 且 完全褪色 且 眷恋达标
    pass: { san: 30, fade: 100, love: 50 }   // san 需 > 30；fade 需 >= 100；love 需 >= 50
  };

  /* 房间热点解锁：看完电视与塔罗牌，床才能点 */
  const bedUnlock = ['tv', 'card'];

  window.STORY = { nodes: story, speakers, chapters, endings, stats, bedUnlock, startNode: 'intro_video' };
})();

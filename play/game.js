(() => {
'use strict';
// =====================================================================
//  DUNGEON MOWER
// =====================================================================
const AT = window.ATLAS;
AT.zombie_anim_f0 = AT.zombie_anim_f10;
const $ = id => document.getElementById(id);
const TAU = Math.PI * 2;
const rnd = (a, b) => a + Math.random() * (b - a);
const irnd = (a, b) => Math.floor(rnd(a, b + 1));
const pick = a => a[(Math.random() * a.length) | 0];
const clamp = (v, a, b) => v < a ? a : v > b ? b : v;
const dist2 = (ax, ay, bx, by) => (ax - bx) * (ax - bx) + (ay - by) * (ay - by);
const angDiff = (a, b) => { let d = (b - a) % TAU; if (d > Math.PI) d -= TAU; if (d < -Math.PI) d += TAU; return d; };
const fmt = s => { s = Math.max(0, Math.floor(s)); return String(Math.floor(s / 60)).padStart(2, '0') + ':' + String(s % 60).padStart(2, '0'); };
const shuffle = a => { for (let i = a.length - 1; i > 0; i--) { const j = (Math.random() * (i + 1)) | 0; [a[i], a[j]] = [a[j], a[i]]; } return a; };

// ------------------------------------------------------------- save data
const SAVE_KEY = 'underkeep.v1';
const defSave = () => ({ coins: 0, shop: {}, heroes: { knight: true }, hero: 'knight', best: { time: 0, kills: 0, level: 0 }, wins: 0, runs: 0, maps: {}, stage: 'keep',
  settings: { music: 55, sfx: 80, lang: 'en', shake: 1, nums: 1 } });
const parseSave = raw => { let o; try { o = Object.assign(defSave(), JSON.parse(raw || '{}')); } catch (e) { o = defSave(); } o.settings = Object.assign(defSave().settings, o.settings || {}); return o; };
const cloudData = () => { try { return ADS.ready && ADS.sdk.data ? ADS.sdk.data : null; } catch (e) { return null; } };
let SV;
try { SV = parseSave(localStorage.getItem(SAVE_KEY)); } catch (e) { SV = defSave(); }
const persist = () => {
  const str = JSON.stringify(SV);
  const d = cloudData();
  if (d) { try { d.setItem(SAVE_KEY, str); return; } catch (e) {} }
  try { localStorage.setItem(SAVE_KEY, str); } catch (e) {}
};
// after the CrazyGames SDK is ready, its Data Module is the source of truth (cloud save for signed-in players)
function loadCloudSave() {
  const d = cloudData(); if (!d) return;
  try {
    const raw = d.getItem(SAVE_KEY);
    if (raw) SV = parseSave(raw);
    else { let local = null; try { local = localStorage.getItem(SAVE_KEY); } catch (e) {} if (local) { SV = parseSave(local); persist(); } }
  } catch (e) {}
}
const shopLv = k => SV.shop[k] || 0;

// ------------------------------------------------------------- text
const TX = {
  en: {
    sub: '', start: 'Start', armory: 'Armory', settings: 'Settings', credits: 'Credits',
    chooseHero: 'Choose a hero', back: 'Back', go: 'Descend', refund: 'Refund all', music: 'Music', sfx: 'Sound', lang: 'Language',
    shake: 'Screen shake', numbers: 'Damage numbers', on: 'On', off: 'Off', paused: 'Paused', resume: 'Resume', giveUp: 'Give up',
    levelUp: 'Level up!', take: 'Take', survived: 'Survived', level: 'Level', killed: 'Killed', earned: 'Coins', title: 'Title', again: 'Again',
    cArt: 'Art', cMusic: 'Music & sound', cFont: 'Font', dead: 'You fell', win: 'Cleared', newRecord: 'New record',
    reroll: n => `Reroll (${n})`, best: t => `Best ${t}`, unlock: 'Unlock', unlockCost: (c, h) => h >= c ? `Locked — click to unlock for ${c} coins` : `Locked — needs ${c} coins (you have ${h})`, coinsN: n => `${n} coins`, lv: n => `Lv ${n}`, isNew: 'NEW', evolve: 'EVOLVE', max: 'MAX',
    pairsW: x => `Evolves at max level if you hold ${x}`, pairsP: x => `Needed to evolve ${x}`, start_w: 'Starts with', gold: n => `+${n} coins`, heal: 'Roast chicken', healD: 'Restore 30 health.',
    goldBag: 'Coin pouch', goldBagD: 'Take 25 coins.',
    swarm: 'Swarm!', ctrlKeys: 'Move: WASD / arrow keys · Attacks are automatic', ctrlTouch: 'Drag to move · Attacks are automatic', adRevive: 'Watch ad to revive', adDouble: n => `Watch ad: coins x2 (+${n})`, adReroll: 'Watch ad to reroll', adFail: 'No ad available right now', adPreview: 'Ad slot — a real ad plays here in the CrazyGames build', rush: 'Gold rush! Coins x2', unlocked: x => `${x} unlocked`, mimic: 'Mimic!', chooseStage: 'Choose a place', lockedBy: x => `Clear ${x} to open`, clearedMark: 'Cleared', bestOn: t => `Best ${t}`, noRecord: 'Not yet attempted', stageMods: (h, g) => `Enemies ×${h} · Coins ×${g}`, bossIn: 'Boss!', revived: 'Revived!', cleared: 'Clear!',
    evolved: 'evolved!', chestGot: 'From the chest', weapon: 'Weapon', dmg: 'Damage'
  },
  ko: {
    sub: '', start: '시작', armory: '무기고', settings: '설정', credits: '크레딧',
    chooseHero: '영웅 선택', back: '뒤로', go: '입장', refund: '전부 환불', music: '음악', sfx: '효과음', lang: '언어',
    shake: '화면 흔들림', numbers: '피해 숫자', on: '켬', off: '끔', paused: '일시정지', resume: '계속', giveUp: '포기',
    levelUp: '레벨 업!', take: '받기', survived: '생존', level: '레벨', killed: '처치', earned: '코인', title: '타이틀', again: '다시',
    cArt: '그래픽', cMusic: '음악·효과음', cFont: '글꼴', dead: '쓰러졌다', win: '클리어', newRecord: '신기록',
    reroll: n => `다시 뽑기 (${n})`, best: t => `최고 ${t}`, unlock: '해금', unlockCost: (c, h) => h >= c ? `잠김 — 누르면 코인 ${c}개로 해금` : `잠김 — 해금하려면 코인 ${c}개 필요 (보유 ${h}개)`, coinsN: n => `코인 ${n}`, lv: n => `Lv ${n}`, isNew: '신규', evolve: '진화', max: 'MAX',
    pairsW: x => `최대 레벨 + ${x} 보유 시 진화`, pairsP: x => `${x} 진화에 필요`, start_w: '시작 무기', gold: n => `코인 +${n}`, heal: '통닭', healD: '체력 30 회복.',
    goldBag: '코인 주머니', goldBagD: '코인 25개 획득.',
    swarm: '포위!', ctrlKeys: '이동: WASD / 방향키 · 공격은 자동', ctrlTouch: '드래그해서 이동 · 공격은 자동', adRevive: '광고 보고 부활', adDouble: n => `광고 보고 코인 2배 (+${n})`, adReroll: '광고 보고 다시 뽑기', adFail: '지금은 볼 수 있는 광고가 없어요', adPreview: '광고 자리 — CrazyGames 버전에서는 여기서 실제 광고가 나와요', rush: '황금 러시! 코인 2배', unlocked: x => `${x} 해금`, mimic: '미믹!', chooseStage: '장소 선택', lockedBy: x => `${x} 클리어 시 열림`, clearedMark: '클리어', bestOn: t => `최고 ${t}`, noRecord: '아직 도전 기록 없음', stageMods: (h, g) => `적 체력 ×${h} · 코인 ×${g}`, bossIn: '보스 출현!', revived: '부활!', cleared: '클리어!',
    evolved: '진화!', chestGot: '상자에서 나온 것', weapon: '무기', dmg: '피해량'
  }
};
const L = () => TX[SV.settings.lang];
const nm = o => o[SV.settings.lang];

// ------------------------------------------------------------- data
const HEROES = {
  knight: { spr: 'knight_m', weapon: 'sword', cost: 0, mod: { hp: 1.1 }, en: ['Aldric', 'Knight. +10% max health.'], ko: ['알드릭', '기사. 최대 체력 +10%.'] },
  elf: { spr: 'elf_f', weapon: 'bow', cost: 300, mod: { spd: 1.1 }, en: ['Sefa', 'Ranger. +10% move speed.'], ko: ['세파', '레인저. 이동 속도 +10%.'] },
  dwarf: { spr: 'dwarf_m', weapon: 'axe', cost: 600, mod: { armor: 1 }, en: ['Brom', 'Miner. Takes 1 less damage.'], ko: ['브롬', '광부. 받는 피해 -1.'] },
  wizard: { spr: 'wizzard_m', weapon: 'bombs', cost: 1000, mod: { area: 1.1 }, en: ['Orrin', 'Alchemist. +10% area.'], ko: ['오린', '연금술사. 범위 +10%.'] },
  lizard: { spr: 'lizard_m', weapon: 'spear', cost: 1500, mod: { might: 1.1 }, en: ['Kesh', 'Hunter. +10% damage.'], ko: ['케쉬', '사냥꾼. 피해 +10%.'] },
  maren: { spr: 'knight_f', weapon: 'knives', cost: 2200, mod: { cd: 0.92 }, en: ['Maren', 'Duelist. -8% cooldown.'], ko: ['마렌', '결투가. 쿨다운 -8%.'] },
  hild: { spr: 'dwarf_f', weapon: 'hammers', cost: 3000, mod: { regen: 0.3 }, en: ['Hild', 'Smith. +0.3 health per second.'], ko: ['힐드', '대장장이. 초당 체력 +0.3.'] }
};

const WP = {
  sword: { icon: 'weapon_knight_sword', evoIcon: 'weapon_lavish_sword', pair: 'might',
    lv: [{ dmg: 14, cd: 1.05, area: 1, n: 1 }, { dmg: 18 }, { n: 2 }, { dmg: 24, area: 1.15 }, { dmg: 30, cd: 0.8 }], evo: { dmg: 42, cd: 0.75, area: 1.4, n: 1 },
    en: ['Longsword', 'Slashes in an arc in front of you.', ['Damage +4', 'Also slashes behind you', 'Damage +6, area +15%', 'Damage +6, faster'], 'Lavish Blade', 'Spins in a full circle.'],
    ko: ['롱소드', '앞쪽을 크게 벤다.', ['피해 +4', '뒤쪽도 벤다', '피해 +6, 범위 +15%', '피해 +6, 더 빠르게'], '화려한 검', '한 바퀴를 통째로 벤다.'] },
  knives: { icon: 'weapon_knife', evoIcon: 'weapon_red_gem_sword', pair: 'haste',
    lv: [{ dmg: 7, cd: 0.6, n: 1, pierce: 1 }, { n: 2 }, { dmg: 10 }, { n: 3, pierce: 2 }, { cd: 0.42 }], evo: { dmg: 15, cd: 0.4, n: 8, pierce: 3 },
    en: ['Throwing Knives', 'Throws knives where you face.', ['+1 knife', 'Damage +3', '+1 knife, pierce +1', 'Faster'], 'Ruby Fan', 'Blades burst out in every direction.'],
    ko: ['투척 단검', '바라보는 방향으로 단검을 던진다.', ['단검 +1', '피해 +3', '단검 +1, 관통 +1', '더 빠르게'], '루비 부채', '사방으로 칼날이 터져 나간다.'] },
  axe: { icon: 'weapon_throwing_axe', evoIcon: 'weapon_waraxe', pair: 'reach',
    lv: [{ dmg: 18, cd: 1.6, n: 1, area: 1 }, { n: 2 }, { dmg: 26 }, { area: 1.2 }, { n: 3, dmg: 32 }], evo: { dmg: 48, cd: 1.1, n: 5, area: 1.5 },
    en: ['Hand Axe', 'Lobs spinning axes overhead. Hits everything.', ['+1 axe', 'Damage +8', 'Area +20%', '+1 axe, damage +6'], 'War Axe', 'A rain of enormous axes.'],
    ko: ['손도끼', '빙글빙글 도는 도끼를 던져 올린다. 전부 관통.', ['도끼 +1', '피해 +8', '범위 +20%', '도끼 +1, 피해 +6'], '전투 도끼', '거대한 도끼가 비처럼 쏟아진다.'] },
  hammers: { icon: 'weapon_hammer', evoIcon: 'weapon_big_hammer', pair: 'vitality',
    lv: [{ dmg: 9, n: 1, area: 1, spd: 3.2 }, { n: 2 }, { dmg: 13, area: 1.15 }, { n: 3 }, { n: 4, spd: 4.2 }], evo: { dmg: 24, n: 4, area: 1.45, spd: 4.6 },
    en: ['Orbiting Hammer', 'Hammers circle around you.', ['+1 hammer', 'Damage +4, area +15%', '+1 hammer', '+1 hammer, faster'], 'Grand Hammer', 'Huge hammers that send enemies flying.'],
    ko: ['회전 망치', '망치가 주위를 맴돈다.', ['망치 +1', '피해 +4, 범위 +15%', '망치 +1', '망치 +1, 더 빠르게'], '거대 망치', '적을 날려 버리는 거대한 망치.'] },
  bow: { icon: 'weapon_bow', evoIcon: 'weapon_bow_2', pair: 'swift',
    lv: [{ dmg: 11, cd: 1.0, n: 1, pierce: 2 }, { n: 2 }, { dmg: 16, pierce: 3 }, { cd: 0.8 }, { n: 3, dmg: 21 }], evo: { dmg: 26, cd: 0.38, n: 5, pierce: 7 },
    en: ['Shortbow', 'Shoots the nearest enemies.', ['+1 arrow', 'Damage +5, pierce +1', 'Faster', '+1 arrow, damage +5'], 'Twin Bow', 'A volley of piercing arrows.'],
    ko: ['단궁', '가장 가까운 적을 쏜다.', ['화살 +1', '피해 +5, 관통 +1', '더 빠르게', '화살 +1, 피해 +5'], '쌍궁', '꿰뚫는 화살이 일제히 날아간다.'] },
  bombs: { icon: 'bomb_f0', evoIcon: 'bomb_f2', pair: 'greed',
    lv: [{ dmg: 26, cd: 2.3, n: 1, area: 1 }, { n: 2 }, { dmg: 36, area: 1.15 }, { n: 3 }, { dmg: 46, cd: 1.8 }], evo: { dmg: 62, cd: 1.5, n: 4, area: 1.35 },
    en: ['Bombs', 'Throws bombs at nearby enemies.', ['+1 bomb', 'Damage +10, area +15%', '+1 bomb', 'Damage +10, faster'], 'Powder Storm', 'Every blast sets off more blasts.'],
    ko: ['폭탄', '근처 적에게 폭탄을 던진다.', ['폭탄 +1', '피해 +10, 범위 +15%', '폭탄 +1', '피해 +10, 더 빠르게'], '화약 폭풍', '폭발이 또 다른 폭발을 부른다.'] },
  spear: { icon: 'weapon_spear', evoIcon: 'weapon_saw_sword', pair: 'charm',
    lv: [{ dmg: 16, cd: 1.15, area: 1, dirs: 1 }, { dmg: 22 }, { dirs: 2 }, { dmg: 28, area: 1.2 }, { dirs: 4 }], evo: { dmg: 46, cd: 0.8, area: 1.4, dirs: 8 },
    en: ['Spear', 'Thrusts through everything in a line.', ['Damage +6', 'Also thrusts behind you', 'Damage +6, reach +20%', 'Thrusts in four directions'], 'Saw Lance', 'Shreds in eight directions.'],
    ko: ['창', '일직선상의 모든 것을 꿰뚫는다.', ['피해 +6', '뒤쪽도 찌른다', '피해 +6, 사거리 +20%', '네 방향으로 찌른다'], '톱날 창', '여덟 방향을 갈아 버린다.'] }
};
const PS = {
  vitality: { icon: 'ui_heart_full', max: 5, en: ['Heart Container', '+20 max health, +0.2 health per second.'], ko: ['심장 그릇', '최대 체력 +20, 초당 체력 +0.2.'] },
  might: { icon: 'flask_big_red', max: 5, en: ['Red Flask', '+10% damage.'], ko: ['붉은 플라스크', '피해 +10%.'] },
  haste: { icon: 'flask_big_blue', max: 5, en: ['Blue Flask', '-7% weapon cooldown.'], ko: ['푸른 플라스크', '무기 쿨다운 -7%.'] },
  swift: { icon: 'flask_big_green', max: 5, en: ['Green Flask', '+8% move speed.'], ko: ['초록 플라스크', '이동 속도 +8%.'] },
  reach: { icon: 'flask_big_yellow', max: 5, en: ['Gold Flask', '+10% area.'], ko: ['황금 플라스크', '범위 +10%.'] },
  greed: { icon: 'coin_anim_f0', max: 5, en: ['Lucky Coin', '+30% pickup range, +10% coins.'], ko: ['행운의 동전', '획득 범위 +30%, 코인 +10%.'] },
  charm: { icon: 'skull', max: 2, en: ['Bone Charm', '+1 projectile for every weapon.'], ko: ['뼈 부적', '모든 무기의 투사체 +1.'] }
};
const SHOP = {
  might: { icon: 'weapon_regular_sword', max: 5, base: 120, en: ['Whetstone', '+5% damage.'], ko: ['숫돌', '피해 +5%.'] },
  armor: { icon: 'weapon_mace', max: 3, base: 160, en: ['Padding', 'Take 1 less damage.'], ko: ['덧댄 갑옷', '받는 피해 -1.'] },
  maxhp: { icon: 'ui_heart_full', max: 5, base: 100, en: ['Hearty', '+10% max health.'], ko: ['튼튼함', '최대 체력 +10%.'] },
  recovery: { icon: 'flask_red', max: 3, base: 140, en: ['Bandages', '+0.2 health per second.'], ko: ['붕대', '초당 체력 +0.2.'] },
  speed: { icon: 'flask_green', max: 3, base: 120, en: ['Boots', '+5% move speed.'], ko: ['장화', '이동 속도 +5%.'] },
  magnet: { icon: 'button_blue_up', max: 3, base: 90, en: ['Lodestone', '+20% pickup range.'], ko: ['자철석', '획득 범위 +20%.'] },
  growth: { icon: 'flask_blue', max: 5, base: 130, en: ['Study', '+6% experience.'], ko: ['공부', '경험치 +6%.'] },
  greed: { icon: 'chest_full_open_anim_f2', max: 5, base: 110, en: ['Purse', '+10% coins.'], ko: ['지갑', '코인 +10%.'] },
  reroll: { icon: 'lever_left', max: 3, base: 200, en: ['Second Thoughts', '+1 reroll each run.'], ko: ['재고', '판마다 다시 뽑기 +1.'] },
  revival: { icon: 'angel_idle_anim_f0', max: 1, base: 900, en: ['Last Breath', 'Get back up once per run.'], ko: ['마지막 숨', '판마다 한 번 다시 일어선다.'] },
  insight: { icon: 'flask_yellow', max: 1, base: 1200, en: ['Insight', '+1 choice when leveling up.'], ko: ['통찰', '레벨 업 선택지 +1.'] }
};
const shopCost = (k) => Math.round(SHOP[k].base * (1 + shopLv(k) * 0.9) / 5) * 5;

const EN = {
  tiny_zombie: { hp: 5, spd: 30, dmg: 3, xp: 1 }, goblin: { hp: 9, spd: 38, dmg: 4, xp: 1 }, imp: { hp: 7, spd: 50, dmg: 3, xp: 1 },
  skelet: { hp: 14, spd: 32, dmg: 5, xp: 1 }, tiny_slug: { hp: 11, spd: 22, dmg: 4, xp: 1 }, muddy: { hp: 28, spd: 22, dmg: 6, xp: 2 },
  swampy: { hp: 28, spd: 24, dmg: 6, xp: 2 }, zombie: { hp: 22, spd: 30, dmg: 5, xp: 2 }, ice_zombie: { hp: 30, spd: 30, dmg: 6, xp: 2 },
  masked_orc: { hp: 44, spd: 36, dmg: 8, xp: 3 }, orc_warrior: { hp: 52, spd: 34, dmg: 9, xp: 3 }, orc_shaman: { hp: 40, spd: 31, dmg: 8, xp: 3 },
  necromancer: { hp: 62, spd: 28, dmg: 9, xp: 4 }, wogol: { hp: 62, spd: 40, dmg: 9, xp: 4 }, chort: { hp: 84, spd: 44, dmg: 11, xp: 5 },
  crate: { hp: 16, spd: 0, dmg: 0, xp: 0 }, mimic: { hp: 220, spd: 54, dmg: 9, xp: 12, spr: 'chest_mimic_open' },
  pumpkin_dude: { hp: 95, spd: 34, dmg: 11, xp: 5 }, doc: { hp: 115, spd: 30, dmg: 12, xp: 6 }, slug: { hp: 160, spd: 20, dmg: 13, xp: 7 },
  ogre: { hp: 1500, spd: 30, dmg: 22, xp: 50, boss: 1, en: 'Ogre', ko: '오우거' },
  big_zombie: { hp: 3200, spd: 32, dmg: 26, xp: 90, boss: 1, en: 'Rotting Giant', ko: '썩은 거인' },
  big_demon: { hp: 7500, spd: 36, dmg: 32, xp: 200, boss: 1, en: 'Pit Lord', ko: '구덩이 군주' }
};
const WAVES = [
  ['tiny_zombie', 'goblin'], ['goblin', 'imp', 'tiny_zombie'], ['skelet', 'imp', 'tiny_slug'], ['skelet', 'zombie', 'muddy'],
  ['zombie', 'swampy', 'muddy'], ['ice_zombie', 'masked_orc', 'skelet'], ['masked_orc', 'orc_warrior', 'imp'], ['orc_warrior', 'orc_shaman', 'necromancer'],
  ['necromancer', 'wogol', 'ice_zombie'], ['wogol', 'chort', 'orc_warrior'], ['chort', 'pumpkin_dude', 'doc'], ['doc', 'slug', 'pumpkin_dude', 'chort']
];
const BOSSES = [{ t: 240, type: 'ogre' }, { t: 480, type: 'big_zombie' }, { t: 660, type: 'big_demon', final: true }];
const SWARMS = [150, 390, 570];
const SEWER_WAVES = [
  ['tiny_slug', 'tiny_zombie'], ['tiny_slug', 'goblin', 'muddy'], ['muddy', 'swampy', 'tiny_slug'], ['swampy', 'zombie', 'slug'],
  ['zombie', 'ice_zombie', 'muddy'], ['ice_zombie', 'slug', 'swampy'], ['orc_shaman', 'swampy', 'slug'], ['necromancer', 'ice_zombie', 'muddy'],
  ['slug', 'wogol', 'zombie'], ['doc', 'slug', 'necromancer'], ['doc', 'slug', 'wogol'], ['slug', 'doc', 'chort']
];
const HELL_WAVES = [
  ['imp', 'goblin'], ['imp', 'skelet', 'chort'], ['imp', 'chort', 'masked_orc'], ['chort', 'orc_warrior', 'imp'],
  ['chort', 'necromancer', 'pumpkin_dude'], ['wogol', 'chort', 'imp'], ['pumpkin_dude', 'chort', 'orc_warrior'], ['necromancer', 'wogol', 'chort'],
  ['doc', 'chort', 'pumpkin_dude'], ['chort', 'pumpkin_dude', 'doc'], ['doc', 'slug', 'chort'], ['chort', 'doc', 'pumpkin_dude', 'wogol']
];
const STAGES = {
  keep: { waves: WAVES, bosses: BOSSES, hp: 1, gold: 1, spikes: 5, cycle: 3.6, tint: null, fount: ['red', 'blue'], floor: 0.86, cols: 14, decal: ['skull'], wall: 'keep', icon: 'ogre_idle_anim_f0',
    en: ['The Keep', 'Stage 1.'], ko: ['성채', '스테이지 1.'] },
  sewers: { waves: SEWER_WAVES, bosses: [{ t: 240, type: 'big_zombie' }, { t: 480, type: 'ogre' }, { t: 660, type: ['big_zombie', 'ogre'], final: true }], hp: 1.35, gold: 1.3, spikes: 8, cycle: 3.0, tint: '#b4dcbc', fount: ['blue'], floor: 0.7, cols: 10, decal: ['hole', 'skull', 'floor_ladder'], wall: 'sewers', need: 'keep', icon: 'big_zombie_idle_anim_f0',
    en: ['The Sewers', 'Stage 2. Slugs and swamp monsters. 2 final bosses.'], ko: ['하수도', '스테이지 2. 슬러그·늪 몬스터. 최종 보스 2마리.'] },
  hell: { waves: HELL_WAVES, bosses: [{ t: 240, type: 'ogre' }, { t: 480, type: 'big_demon' }, { t: 660, type: ['big_demon', 'big_demon'], final: true }], hp: 1.8, gold: 1.7, spikes: 13, cycle: 2.5, tint: '#ffbcaa', fount: ['red'], floor: 0.8, cols: 8, decal: ['skull', 'skull', 'hole'], wall: 'hell', need: 'sewers', icon: 'big_demon_idle_anim_f0',
    en: ['The Pit Gate', 'Stage 3. Demons, lots of spike traps. 2 final bosses.'], ko: ['지옥문', '스테이지 3. 악마 몬스터, 가시 함정 다수. 최종 보스 2마리.'] }
};
const mapRec = id => (SV.maps && SV.maps[id]) || { best: 0, cleared: false };
const stageOpen = id => !STAGES[id].need || mapRec(STAGES[id].need).cleared;
const ELITES = [90, 200, 330, 420, 540, 620];

// ------------------------------------------------------------- assets
const sheet = new Image();
let flashSheet, redSheet, sheetData;
const loadState = { img: false, fonts: false };
function buildSheets() {
  const mk = (color) => {
    const c = document.createElement('canvas'); c.width = sheet.width; c.height = sheet.height;
    const x = c.getContext('2d'); x.drawImage(sheet, 0, 0); x.globalCompositeOperation = 'source-in'; x.fillStyle = color; x.fillRect(0, 0, c.width, c.height);
    return c;
  };
  flashSheet = mk('#fdf7ed'); redSheet = mk('#da4e38');
  const c = document.createElement('canvas'); c.width = sheet.width; c.height = sheet.height;
  const x = c.getContext('2d'); x.drawImage(sheet, 0, 0); sheetData = x.getImageData(0, 0, c.width, c.height).data;
}
const sampleCache = {};
function samples(name) {
  if (sampleCache[name]) return sampleCache[name];
  const f = AT[name], out = [];
  if (f) for (let y = 0; y < f[3]; y++) for (let x = 0; x < f[2]; x++) {
    const i = ((f[1] + y) * sheet.width + f[0] + x) * 4;
    if (sheetData[i + 3] > 200) out.push([x - f[2] / 2, y - f[3], `rgb(${sheetData[i]},${sheetData[i + 1]},${sheetData[i + 2]})`]);
  }
  return (sampleCache[name] = out);
}
const animCache = {};
function frames(base, kind) {
  const key = base + '|' + kind;
  if (animCache[key]) return animCache[key];
  const out = [];
  const tries = kind ? [`${base}_${kind}_anim_f`, `${base}_anim_f`] : [`${base}_anim_f`, `${base}_run_anim_f`];
  for (const p of tries) { for (let i = 0; i < 8 && AT[p + i]; i++) out.push(p + i); if (out.length) break; }
  if (!out.length && AT[base]) out.push(base);
  return (animCache[key] = out);
}

// sprite drawing on the view canvas (anchor = bottom-centre)
let V, vctx; // view
function spr(name, x, y, opts) {
  const f = AT[name]; if (!f) return;
  const src = opts && opts.flash ? flashSheet : opts && opts.red ? redSheet : sheet;
  const s = (opts && opts.scale) || 1, w = f[2] * s, h = f[3] * s;
  const flip = opts && opts.flip;
  if (opts && opts.alpha != null) vctx.globalAlpha = opts.alpha;
  if (flip) { vctx.save(); vctx.translate(Math.round(x), 0); vctx.scale(-1, 1); vctx.drawImage(src, f[0], f[1], f[2], f[3], Math.round(-w / 2), Math.round(y - h), w, h); vctx.restore(); }
  else vctx.drawImage(src, f[0], f[1], f[2], f[3], Math.round(x - w / 2), Math.round(y - h), w, h);
  if (opts && opts.alpha != null) vctx.globalAlpha = 1;
}
function sprRot(name, x, y, ang, off, opts) { // draws a vertical sprite pointing along ang, pivot at x,y; off = distance from pivot to sprite base
  const f = AT[name]; if (!f) return;
  const s = (opts && opts.scale) || 1;
  vctx.save(); vctx.translate(Math.round(x), Math.round(y)); vctx.rotate(ang + Math.PI / 2);
  if (opts && opts.alpha != null) vctx.globalAlpha = opts.alpha;
  vctx.drawImage(opts && opts.flash ? flashSheet : sheet, f[0], f[1], f[2], f[3], -f[2] * s / 2, -(f[3] * s + off), f[2] * s, f[3] * s);
  vctx.restore();
}
// icons for the DOM
function iconCanvas(name, box) {
  const f = AT[name], c = document.createElement('canvas');
  if (!f) return c;
  const k = Math.max(1, Math.round(box / Math.max(f[2], f[3])));
  c.width = f[2]; c.height = f[3];
  c.style.width = f[2] * k + 'px'; c.style.height = f[3] * k + 'px';
  const x = c.getContext('2d'); x.imageSmoothingEnabled = false;
  if (sheet.complete) x.drawImage(sheet, f[0], f[1], f[2], f[3], 0, 0, f[2], f[3]);
  return c;
}
let U = 3;
function readU() { U = parseFloat(getComputedStyle(document.documentElement).getPropertyValue('--u')) || 3; }
function fillIcons(root) { (root || document).querySelectorAll('.ico[data-icon]').forEach(el => { el.innerHTML = ''; el.appendChild(iconCanvas(el.dataset.icon, U * 6)); }); }

// ------------------------------------------------------------- audio
const AU = { ctx: null, buf: {}, last: {}, music: null, track: null, unlocked: false };
const SFX_NAMES = ['coin', 'coins', 'fanfare', 'levelup', 'pick', 'heal', 'hit', 'hurt', 'dead', 'sword', 'knife', 'thunk', 'boom', 'bigboom', 'move', 'select', 'pausein', 'pauseout', 'portal', 'chest', 'impact', 'shoot', 'deny'];
function audioUnlock() {
  if (AU.unlocked) { if (AU.ctx && AU.ctx.state === 'suspended') AU.ctx.resume(); return; }
  AU.unlocked = true;
  try {
    AU.ctx = new (window.AudioContext || window.webkitAudioContext)();
    AU.out = AU.ctx.createGain(); AU.out.connect(AU.ctx.destination); setVolumes();
    SFX_NAMES.forEach(n => fetch(`assets/audio/${n}.mp3`).then(r => r.arrayBuffer()).then(b => AU.ctx.decodeAudioData(b)).then(d => { AU.buf[n] = d; }).catch(() => {}));
  } catch (e) {}
  if (AU.want) playMusic(AU.want, true);
}
function setVolumes() {
  if (AU.out) AU.out.gain.value = Math.pow(SV.settings.sfx / 100, 1.5) * 0.9;
  if (AU.music) AU.music.volume = Math.pow(SV.settings.music / 100, 1.5) * 0.7;
}
function sfx(n, vol = 1, vary = 0.08, minGap = 0.045) {
  const c = AU.ctx, b = AU.buf[n]; if (!c || !b) return;
  const t = c.currentTime; if (AU.last[n] && t - AU.last[n] < minGap) return; AU.last[n] = t;
  const s = c.createBufferSource(); s.buffer = b; s.playbackRate.value = 1 + rnd(-vary, vary);
  const gn = c.createGain(); gn.gain.value = vol; s.connect(gn); gn.connect(AU.out); s.start();
}
// music runs through Web Audio so loops join sample-exact (an <audio> element leaves a gap at the mp3 seam)
function musicBuf(name) {
  AU.mbuf = AU.mbuf || {};
  if (!AU.mbuf[name]) AU.mbuf[name] = fetch(`assets/audio/${name}.mp3`).then(r => r.arrayBuffer()).then(b => AU.ctx.decodeAudioData(b)).then(d => {
    // skip the encoder padding at both ends (never more than 120 ms, so musical rests stay)
    const n = d.length, cap = Math.min(n >> 2, Math.floor(d.sampleRate * 0.12)), th = 0.0015;
    let a = cap, z = cap;
    for (let ch = 0; ch < d.numberOfChannels; ch++) {
      const x = d.getChannelData(ch);
      let i = 0; while (i < cap && Math.abs(x[i]) < th) i++; if (i < a) a = i;
      let j = 0; while (j < cap && Math.abs(x[n - 1 - j]) < th) j++; if (j < z) z = j;
    }
    return { d, a: a / d.sampleRate, b: (n - z) / d.sampleRate };
  });
  return AU.mbuf[name];
}
function mkMusic(name, loop) {
  const c = AU.ctx, g = c.createGain(); g.connect(c.destination);
  const o = {
    _v: 1, _src: null, _m: null, _off: 0, _t0: 0, _on: false,
    get volume() { return this._v; },
    set volume(v) { this._v = Math.max(0, Math.min(1, v)); g.gain.value = this._v; },
    _start() {
      if (!this._m || this._src || !this._on) return;
      const m = this._m, len = m.b - m.a; let off = this._off;
      if (loop) off %= len; else if (off >= len) return;
      const s = c.createBufferSource(); s.buffer = m.d; s.connect(g);
      if (loop) { s.loop = true; s.loopStart = m.a; s.loopEnd = m.b; s.start(0, m.a + off); }
      else s.start(0, m.a + off, len - off);
      this._t0 = c.currentTime - off; this._src = s;
    },
    play() { this._on = true; this._start(); return Promise.resolve(); },
    pause() {
      this._on = false; const s = this._src; if (!s) return;
      this._off = c.currentTime - this._t0; this._src = null;
      try { s.stop(); } catch (e) {} s.disconnect();
    },
  };
  musicBuf(name).then(m => { o._m = m; o._start(); }).catch(() => {});
  return o;
}
function playMusic(name, force) {
  AU.want = name;
  if (!AU.unlocked) return;
  if (AU.track === name && !force) return;
  const old = AU.music;
  if (old) { const o = old; let v = o.volume; const iv = setInterval(() => { v -= 0.05; if (v <= 0) { o.pause(); clearInterval(iv); } else o.volume = v; }, 40); }
  AU.track = name;
  if (!name) { AU.music = null; return; }
  const a = AU.ctx ? mkMusic(name, name !== 'ending') : new Audio(`assets/audio/${name}.mp3`); if (!AU.ctx) a.loop = name !== 'ending'; AU.music = a; setVolumes();
  a.play().catch(() => {});
}

// ------------------------------------------------------------- ads (CrazyGames SDK v3; preview fallback)
const STANDALONE = true;
const ADS = {
  sdk: null, ready: false, busy: false,
  async init() {
    try {
      const S = window.CrazyGames && window.CrazyGames.SDK; if (!S) return;
      await S.init();
      if (S.environment === 'disabled') return;
      this.sdk = S; this.ready = true;
    } catch (e) {}
  },
  call(fn) { try { if (this.ready) fn(this.sdk); } catch (e) {} },
  mute(on) {
    if (AU.out) AU.out.gain.value = on ? 0 : Math.pow(SV.settings.sfx / 100, 1.5) * 0.9;
    if (AU.music) { if (on) AU.music.pause(); else AU.music.play().catch(() => {}); }
  },
  show(type, onDone, onFail) {
    if (this.busy) return; this.busy = true;
    const end = ok => { this.busy = false; this.mute(false); if (ok) { onDone && onDone(); } else { onFail && onFail(); } };
    if (!this.ready) {
      if (type === 'midgame') { this.busy = false; onDone && onDone(); return; }
      const el = $('adPrev'); $('adPrevTxt').textContent = L().adPreview; el.classList.add('show'); this.mute(true);
      let n = 3; $('adPrevN').textContent = n;
      const iv = setInterval(() => { n--; $('adPrevN').textContent = n; if (n <= 0) { clearInterval(iv); el.classList.remove('show'); end(true); } }, 1000);
      return;
    }
    try { this.sdk.ad.requestAd(type, { adStarted: () => this.mute(true), adFinished: () => end(true), adError: () => end(false) }); }
    catch (e) { end(false); }
  }
};
const gpStart = () => ADS.call(S => S.game.gameplayStart());
const gpStop = () => ADS.call(S => S.game.gameplayStop());

// ------------------------------------------------------------- display
const cv = $('c'), ctx = cv.getContext('2d');
let SC = 3, VW = 400, VH = 240, DPR = 1;
function resize() {
  DPR = window.devicePixelRatio || 1;
  const W = Math.round(innerWidth * DPR), H = Math.round(innerHeight * DPR);
  cv.width = W; cv.height = H;
  const cw = innerWidth, ch = innerHeight, portrait = ch > cw * 1.15;
  const scCss = Math.min(cw / (portrait ? 225 : 330), ch / (portrait ? 330 : 205));
  SC = Math.max(2, Math.floor(scCss * DPR));
  VW = Math.ceil(W / SC); VH = Math.ceil(H / SC);
  if (!V) { V = document.createElement('canvas'); vctx = V.getContext('2d'); }
  V.width = VW; V.height = VH; vctx.imageSmoothingEnabled = false;
  ctx.imageSmoothingEnabled = false;
  LIGHT.canvas = null;
  readU(); fillIcons();
}

// ------------------------------------------------------------- world
const TS = 16, COLS = 64, ROWS = 46;
const AW = COLS * TS, AH = ROWS * TS;
let floorMap = [], props = [], wallDeco = [];
let spikes = [], crateSpots = [];
function genWorld(stId) {
  const ST_ = STAGES[stId || 'keep'];
  floorMap = [];
  for (let y = 0; y < ROWS; y++) for (let x = 0; x < COLS; x++) {
    const r = Math.random();
    floorMap.push(r < ST_.floor ? 'floor_1' : r < 0.9 ? 'floor_2' : r < 0.93 ? 'floor_3' : r < 0.95 ? 'floor_4' : r < 0.965 ? 'floor_5' : r < 0.98 ? 'floor_6' : r < 0.99 ? 'floor_7' : 'floor_8');
  }
  props = [];
  const cx = AW / 2, cy = AH / 2;
  const place = (name, solid, r) => {
    for (let t = 0; t < 40; t++) {
      const x = irnd(3, COLS - 4) * TS + 8, y = irnd(3, ROWS - 3) * TS + 14;
      if (dist2(x, y, cx, cy) < 120 * 120) continue;
      if (props.some(p => dist2(p.x, p.y, x, y) < 70 * 70)) continue;
      props.push({ name, x, y, solid, r }); return;
    }
  };
  for (let i = 0; i < ST_.cols; i++) place('column', true, 7);
  crateSpots = [];
  for (let i = 0; i < 10; i++) { const n0 = props.length; place('crate', true, 7); if (props.length > n0) crateSpots.push(props.pop()); }
  for (let i = 0; i < 16; i++) { const x = irnd(1, COLS - 2) * TS + 8, y = irnd(1, ROWS - 2) * TS + 12; props.push({ name: pick(ST_.decal), x, y, solid: false, decal: true }); }
  spikes = [];
  for (let c = 0; c < ST_.spikes; c++) {
    for (let t = 0; t < 30; t++) {
      const tx = irnd(2, COLS - 4), ty = irnd(2, ROWS - 4);
      if (Math.abs(tx * TS - cx) < 110 && Math.abs(ty * TS - cy) < 90) continue;
      if (spikes.some(s => Math.abs(s.tx - tx) < 5 && Math.abs(s.ty - ty) < 5)) continue;
      if (props.some(o => o.solid && Math.abs(o.x - tx * TS) < 40 && Math.abs(o.y - ty * TS) < 40)) continue;
      const shape = pick([[[0, 0], [1, 0], [0, 1], [1, 1]], [[0, 0], [1, 0], [2, 0]], [[0, 0], [0, 1], [0, 2]], [[0, 0], [1, 0], [2, 0], [0, 1], [1, 1], [2, 1]]]);
      const off = rnd(0, ST_.cycle);
      for (const [ox, oy] of shape) spikes.push({ tx: tx + ox, ty: ty + oy, x: (tx + ox) * TS + 8, y: (ty + oy) * TS + 8, off, cyc: ST_.cycle });
      break;
    }
  }
  wallDeco = [];
  for (let x = 1; x < COLS - 1; x++) {
    const r = Math.random();
    if (ST_.wall === 'sewers') { if (r < 0.16) wallDeco[x] = 'wall_goo'; else if (r < 0.24) wallDeco[x] = pick(['wall_hole_1', 'wall_hole_2']); else if (r < 0.27) wallDeco[x] = 'wall_banner_green'; }
    else if (ST_.wall === 'hell') { if (r < 0.1) wallDeco[x] = 'wall_banner_red'; else if (r < 0.2) wallDeco[x] = pick(['wall_hole_1', 'wall_hole_2']); }
    else if (r < 0.06) wallDeco[x] = pick(['wall_banner_red', 'wall_banner_blue', 'wall_banner_green', 'wall_banner_yellow']);
    else if (r < 0.1) wallDeco[x] = pick(['wall_hole_1', 'wall_hole_2']);
    else if (r < 0.12) wallDeco[x] = 'wall_goo';
  }
  wallDeco.fountains = [];
  for (let i = 0; i < 4; i++) { const x = 6 + i * 16 + irnd(0, 6); wallDeco[x] = null; wallDeco.fountains.push({ x, c: pick(ST_.fount) }); }
}
function spikeFrame(s, t) {
  const ph = ((t + s.off) % s.cyc) / s.cyc;
  if (ph < 0.56) return 0; if (ph < 0.6) return 1; if (ph < 0.64) return 2; if (ph < 0.86) return 3; if (ph < 0.92) return 2; return 1;
}
function tileSpr(name, tx, ty, camx, camy) {
  const f = AT[name]; if (!f) return;
  vctx.drawImage(sheet, f[0], f[1], f[2], f[3], tx * TS - camx, ty * TS - camy, f[2], f[3]);
}

// ------------------------------------------------------------- lighting (ordered dither)
const LIGHT = { canvas: null };
const BAYER = [0, 8, 2, 10, 12, 4, 14, 6, 3, 11, 1, 9, 15, 7, 13, 5];
function lightSprite(R) {
  const key = 'l' + R; if (LIGHT[key]) return LIGHT[key];
  const c = document.createElement('canvas'); c.width = c.height = R * 2;
  const x = c.getContext('2d'), im = x.createImageData(R * 2, R * 2);
  for (let j = 0; j < R * 2; j++) for (let i = 0; i < R * 2; i++) {
    const d = Math.hypot(i - R + 0.5, j - R + 0.5) / R;
    let v = clamp(1.15 - d * 1.15, 0, 1);
    const th = (BAYER[(j & 3) * 4 + (i & 3)] + 0.5) / 16 * 0.25;
    v = Math.min(1, Math.floor((v + th) * 4) / 4);
    im.data[(j * R * 2 + i) * 4 + 3] = v * 255;
  }
  x.putImageData(im, 0, 0);
  return (LIGHT[key] = c);
}

// ------------------------------------------------------------- run state
let G = null;
const state = { mode: 'load', paused: false };
function newRun(heroId) {
  const H = HEROES[heroId];
  const m = H.mod || {};
  const base = {
    maxhp: Math.round(100 * (m.hp || 1) * (1 + 0.1 * shopLv('maxhp'))),
    might: (m.might || 1) * (1 + 0.05 * shopLv('might')),
    armor: (m.armor || 0) + shopLv('armor'),
    regen: (m.regen || 0) + 0.2 * shopLv('recovery'),
    spd: 62 * (m.spd || 1) * (1 + 0.05 * shopLv('speed')),
    magnet: 34 * (1 + 0.2 * shopLv('magnet')),
    growth: 1 + 0.06 * shopLv('growth'),
    greed: 1 + 0.1 * shopLv('greed'),
    area: m.area || 1, cd: m.cd || 1
  };
  G = {
    hero: heroId, base, t: 0, kills: 0, gold: 0, lvl: 1, xp: 0, pendingLv: 0,
    p: { x: AW / 2, y: AH / 2 + 30, hp: base.maxhp, inv: 0, face: 1, dirx: 1, diry: 0, moving: false, anim: 0, hurtT: 0 },
    weapons: [], passives: {}, enemies: [], shots: [], pickups: [], parts: [], nums: [], blasts: [], swings: [],
    spawnAcc: 0, bossesDone: {}, swarmsDone: {}, elitesDone: {}, boss: null, rerolls: shopLv('reroll'), revive: shopLv('revival') > 0,
    stage: SV.stage || 'keep', bossList: [], finalLeft: 0, rushAt: rnd(170, 400), rushT: 0, rushDone: false, crateT: 30,
    shake: 0, hitstop: 0, cam: { x: AW / 2 - VW / 2, y: AH / 2 - VH / 2 }, won: false, over: false, lightPulse: 0, redT: 0
  };
  genWorld(G.stage);
  for (const c of crateSpots) spawnEnemy('crate', c.x, c.y, { static: true });
  addWeapon(H.weapon);
}
const S = () => { // live stats
  const b = G.base, p = G.passives;
  return {
    maxhp: b.maxhp + 20 * (p.vitality || 0), regen: b.regen + 0.2 * (p.vitality || 0), might: b.might * (1 + 0.1 * (p.might || 0)),
    cd: b.cd * Math.pow(0.93, p.haste || 0), spd: b.spd * (1 + 0.08 * (p.swift || 0)), area: b.area * (1 + 0.1 * (p.reach || 0)),
    magnet: b.magnet * (1 + 0.3 * (p.greed || 0)), greed: b.greed * (1 + 0.1 * (p.greed || 0)), amount: p.charm || 0, armor: b.armor, growth: b.growth
  };
};
let ST = null; // cached stats, refreshed on change
const refreshStats = () => { ST = S(); };

function wStats(w) {
  const d = WP[w.id];
  if (w.evo) return Object.assign({}, d.lv.reduce((a, b) => Object.assign(a, b), {}), d.evo);
  const o = {}; for (let i = 0; i < w.lvl; i++) Object.assign(o, d.lv[i]); return o;
}
function addWeapon(id) { G.weapons.push({ id, lvl: 1, evo: false, t: 0.4, dmg: 0, q: 0, qt: 0, q2: null, hits: new Map(), spin: 0 }); refreshStats(); }
function weapon(id) { return G.weapons.find(w => w.id === id); }

// ------------------------------------------------------------- input
const keys = {};
const stick = { on: false, ox: 0, oy: 0, x: 0, y: 0, id: null };
addEventListener('keydown', e => {
  const k = e.key.toLowerCase(); keys[k] = true;
  audioUnlock();
  if (k === 'escape' || k === 'p') {
    if (state.mode === 'play') { if (state.paused) resume(); else pauseGame(); }
    else if (['sSettings', 'sCredits', 'sArmory', 'sHero'].includes(curScreen)) back();
  }
  if (state.mode === 'level' && ['1', '2', '3', '4'].includes(k)) { const b = $('choices').children[+k - 1]; if (b) b.click(); }
  if (state.mode === 'chest' && (k === 'enter' || k === ' ') && !$('bTake').disabled) { e.preventDefault(); $('bTake').click(); }
});
addEventListener('keyup', e => { keys[e.key.toLowerCase()] = false; });
cv.addEventListener('pointerdown', e => {
  audioUnlock();
  if (state.mode !== 'play' || state.paused) return;
  stick.on = true; stick.id = e.pointerId; stick.ox = e.clientX; stick.oy = e.clientY; stick.x = 0; stick.y = 0;
  const s = $('stick'); s.style.display = 'block'; s.style.left = e.clientX + 'px'; s.style.top = e.clientY + 'px'; s.firstElementChild.style.transform = '';
});
addEventListener('pointermove', e => {
  if (!stick.on || e.pointerId !== stick.id) return;
  const R = U * 14; let dx = e.clientX - stick.ox, dy = e.clientY - stick.oy; const d = Math.hypot(dx, dy);
  if (d > R) { dx *= R / d; dy *= R / d; }
  stick.x = dx / R; stick.y = dy / R;
  $('stick').firstElementChild.style.transform = `translate(${dx}px,${dy}px)`;
});
const stickEnd = e => { if (e.pointerId !== stick.id) return; stick.on = false; stick.x = stick.y = 0; $('stick').style.display = 'none'; };
addEventListener('pointerup', stickEnd); addEventListener('pointercancel', stickEnd);
addEventListener('blur', () => { if (state.mode === 'play' && !state.paused) pauseGame(); });
document.addEventListener('visibilitychange', () => {
  if (document.hidden) { if (state.mode === 'play' && !state.paused) pauseGame(); if (AU.music) AU.music.pause(); if (AU.ctx) AU.ctx.suspend(); }
  else { if (AU.music) AU.music.play().catch(() => {}); if (AU.ctx) AU.ctx.resume(); }
});
addEventListener('resize', resize);

// ------------------------------------------------------------- spawning
function spawnPos(margin) {
  const cam = G.cam;
  for (let t = 0; t < 10; t++) {
    const a = rnd(0, TAU), r = Math.hypot(VW, VH) / 2 + (margin || 24);
    const x = clamp(G.p.x + Math.cos(a) * r, 10, AW - 10), y = clamp(G.p.y + Math.sin(a) * r, 18, AH - 6);
    if (x < cam.x - 8 || x > cam.x + VW + 8 || y < cam.y - 8 || y > cam.y + VH + 24) return [x, y];
  }
  const x = G.p.x < AW / 2 ? AW - 20 : 20; return [x, rnd(20, AH - 20)];
}
const STG = () => STAGES[G.stage];
function hpMul() { const m = G.t / 60; return (1 + m * 0.17 + Math.max(0, m - 7) * 0.22) * STG().hp; }
function spawnEnemy(type, x, y, o = {}) {
  const d = EN[type];
  const runF = frames(d.spr || type, 'run'), idleF = frames(d.spr || type, 'idle');
  const f0 = AT[runF[0]];
  const big = d.boss ? 1 : 0, sc = o.elite ? 2 : 1;
  const hp = d.boss ? d.hp * (1 + G.t / 900) * STG().hp : d.hp * hpMul() * (o.elite ? 14 : 1);
  const e = {
    type, x, y, hp, maxhp: hp, spd: d.spd * rnd(0.9, 1.1) * (o.elite ? 0.9 : 1), dmg: d.dmg * (o.elite ? 1.6 : 1) * (1 + G.t / 900) * (1 + (STG().hp - 1) * 0.5), static: !!o.static, xp: d.xp * (o.elite ? 10 : 1),
    run: runF, idle: idleF, h: f0 ? f0[3] : 16, r: (big ? 13 : f0 && f0[3] > 18 ? 7 : 6) * sc, sc, elite: !!o.elite, boss: !!d.boss, final: !!o.final,
    flash: 0, kbx: 0, kby: 0, anim: rnd(0, 1), face: 1, hitCd: {}, dash: 0, dashT: rnd(3, 5), summonT: 6, tele: 0, swarm: o.swarm ? { vx: o.vx, vy: o.vy, t: 9 } : null
  };
  G.enemies.push(e);
  return e;
}
function spawner(dt) {
  const t = G.t;
  const WV = STG().waves, wave = WV[Math.min(WV.length - 1, Math.floor(t / 60))];
  const rate = Math.min(1.0 + (t / 60) * 0.95, 13) * (G.boss ? 0.6 : 1);
  G.spawnAcc += dt * rate;
  while (G.spawnAcc >= 1) {
    G.spawnAcc -= 1;
    if (G.enemies.length >= 300) break;
    const [x, y] = spawnPos(); spawnEnemy(pick(wave), x, y);
  }
  for (const b of STG().bosses) if (t >= b.t && !G.bossesDone[b.t]) {
    G.bossesDone[b.t] = true;
    const types = [].concat(b.type);
    if (b.final) G.finalLeft = types.length;
    types.forEach(tp => { const [x, y] = spawnPos(40 + G.bossList.length * 30); const e = spawnEnemy(tp, x, y, { final: b.final }); G.bossList.push(e); G.boss = e; });
    banner(L().bossIn); sfx('portal', 1, 0); G.shake = 0.5;
  }
  if (t >= G.rushAt && !G.rushDone) { G.rushDone = true; G.rushT = 20; banner(L().rush); sfx('coins', 1, 0); }
  G.crateT -= dt;
  if (G.crateT <= 0) {
    G.crateT = 30;
    if (G.enemies.filter(e => e.static).length < 8) for (let k = 0; k < 10; k++) { const sp = pick(crateSpots); if (sp && dist2(sp.x, sp.y, G.p.x, G.p.y) > 200 * 200 && !G.enemies.some(e => e.static && e.x === sp.x && e.y === sp.y)) { spawnEnemy('crate', sp.x, sp.y, { static: true }); break; } }
  }
  for (const s of SWARMS) if (t >= s && !G.swarmsDone[s]) {
    G.swarmsDone[s] = true; banner(L().swarm);
    const type = wave[0], n = 34, R = Math.hypot(VW, VH) / 2 + 10;
    for (let i = 0; i < n; i++) {
      const a = i / n * TAU, x = clamp(G.p.x + Math.cos(a) * R, 8, AW - 8), y = clamp(G.p.y + Math.sin(a) * R, 16, AH - 4);
      const e = spawnEnemy(type, x, y); e.spd *= 1.1;
    }
  }
  for (const s of ELITES) if (t >= s && !G.elitesDone[s]) {
    G.elitesDone[s] = true; const [x, y] = spawnPos(30); spawnEnemy(pick(wave), x, y, { elite: true });
  }
}

// ------------------------------------------------------------- spatial hash
const CELL = 32; let grid = new Map();
function buildGrid() {
  grid = new Map();
  for (const e of G.enemies) { const k = ((e.x / CELL) | 0) * 4096 + ((e.y / CELL) | 0); let c = grid.get(k); if (!c) grid.set(k, c = []); c.push(e); }
}
function queryR(x, y, r, fn) {
  const x0 = ((x - r) / CELL) | 0, x1 = ((x + r) / CELL) | 0, y0 = ((y - r) / CELL) | 0, y1 = ((y + r) / CELL) | 0;
  for (let cx = x0; cx <= x1; cx++) for (let cy = y0; cy <= y1; cy++) { const c = grid.get(cx * 4096 + cy); if (c) for (const e of c) if (e.hp > 0) fn(e); }
}
function nearest(x, y, maxR, exclude) {
  let best = null, bd = maxR * maxR;
  for (const e of G.enemies) { if (e.hp <= 0 || e.static || (exclude && exclude.has(e))) continue; const d = dist2(x, y, e.x, e.y); if (d < bd) { bd = d; best = e; } }
  return best;
}

// ------------------------------------------------------------- damage & death
function damage(e, amount, w, kx, ky, kb) {
  if (e.hp <= 0) return;
  let dmg = amount * ST.might * rnd(0.9, 1.1);
  const crit = Math.random() < 0.08; if (crit) dmg *= 2;
  dmg = Math.max(1, Math.round(dmg));
  e.hp -= dmg; e.flash = 0.12;
  if (w) w.dmg += Math.min(dmg, dmg + e.hp);
  const kbk = (kb || 1) * (e.boss ? 0.08 : e.elite ? 0.3 : 1);
  if (kx || ky) { const d = Math.hypot(kx, ky) || 1; e.kbx += kx / d * 90 * kbk; e.kby += ky / d * 90 * kbk; }
  if (SV.settings.nums && (G.nums.length < 60 || crit)) G.nums.push({ x: e.x + rnd(-4, 4), y: e.y - e.h * e.sc - 2, v: dmg, t: 0, crit });
  sfx('hit', 0.35, 0.15, 0.06);
  if (e.hp <= 0) kill(e);
}
function kill(e) {
  if (e.static) {
    for (const pt of samples('crate').filter(() => Math.random() < 0.12)) G.parts.push({ x: e.x + pt[0], y: e.y + pt[1], vx: rnd(-60, 60), vy: rnd(-90, -20), g: 220, c: pt[2], t: 0, life: rnd(0.4, 0.8), sz: 1 });
    sfx('thunk', 0.7, 0.1);
    for (let i = 0; i < irnd(3, 6); i++) dropCoin(e.x + rnd(-8, 8), e.y + rnd(-6, 6), 2);
    const r = Math.random();
    if (r < 0.14) G.pickups.push({ k: 'heart', x: e.x, y: e.y, t: 0 });
    else if (r < 0.2) G.pickups.push({ k: 'keg', x: e.x, y: e.y, t: 0 });
    return;
  }
  G.kills++;
  const pts = samples(e.run[0]); const n = e.boss ? 60 : e.elite ? 30 : 10;
  for (let i = 0; i < n && pts.length; i++) {
    const p = pick(pts); const a = rnd(0, TAU), s = rnd(20, 70) * (e.boss ? 1.6 : 1);
    G.parts.push({ x: e.x + p[0] * e.sc, y: e.y + p[1] * e.sc, vx: Math.cos(a) * s, vy: Math.sin(a) * s - 30, g: 160, c: p[2], t: 0, life: rnd(0.35, 0.7), sz: e.sc });
  }
  if (e.boss || e.elite || e.type === 'mimic') {
    dropChest(e.x, e.y, e.elite && !e.boss);
    for (let i = 0; i < (e.boss ? 24 : 8); i++) dropCoin(e.x + rnd(-14, 14), e.y + rnd(-10, 10), e.boss ? 4 : 2);
    G.shake = e.boss ? 0.9 : 0.4; G.hitstop = e.boss ? 0.25 : 0.06;
    sfx(e.boss ? 'bigboom' : 'boom', 0.9, 0);
    if (e.boss) {
      G.bossList = G.bossList.filter(b => b !== e && b.hp > 0); G.boss = G.bossList[0] || null;
      if (e.final && --G.finalLeft <= 0) win();
    }
  } else {
    if (G.rushT > 0) dropCoin(e.x, e.y, e.xp * 2); else if (Math.random() < 0.85) dropCoin(e.x, e.y, e.xp);
    const r = Math.random();
    if (r < 0.004) G.pickups.push({ k: 'heart', x: e.x, y: e.y, t: 0 });
    else if (r < 0.0062) G.pickups.push({ k: 'keg', x: e.x, y: e.y, t: 0 });
  }
}
function dropCoin(x, y, v) {
  if (G.pickups.length > 380) { const o = G.pickups.find(p => p.k === 'coin' && !p.pull); if (o) { o.v += v; return; } }
  G.pickups.push({ k: 'coin', x, y, v, t: rnd(0, 1), pull: false, vx: 0, vy: 0 });
}
function dropChest(x, y, mayMimic) { G.pickups.push({ k: mayMimic && Math.random() < 0.25 ? 'mimic' : 'chest', x: clamp(x, 16, AW - 16), y: clamp(y, 20, AH - 8), t: 0 }); }
function burst(x, y, n, cols, spd, life, grav) {
  for (let i = 0; i < n; i++) { const a = rnd(0, TAU), v = rnd(0.25, 1) * spd; G.parts.push({ x, y, vx: Math.cos(a) * v, vy: Math.sin(a) * v * 0.7, g: grav || 0, c: pick(cols), t: 0, life: life * rnd(0.6, 1.2), sz: Math.random() < 0.25 ? 2 : 1 }); }
}
function hurtPlayer(d) {
  const p = G.p; if (p.inv > 0 || G.over) return;
  d = Math.max(1, Math.round(d - ST.armor));
  p.hp -= d; p.inv = 0.6; p.hurtT = 0.25; G.shake = Math.max(G.shake, 0.25); G.redT = 0.25;
  sfx('hurt', 0.7, 0.05);
  if (p.hp <= 0) {
    if (G.revive) {
      G.revive = false; p.hp = Math.round(ST.maxhp * 0.5); p.inv = 2; banner(L().revived); nuke(false); sfx('heal', 1, 0);
    } else if (!STANDALONE && !G.adRevived && !G.won) offerRevive();
    else die();
  }
}
function offerRevive() {
  state.mode = 'offer'; G.p.hp = 0; gpStop();
  $('hud').classList.remove('show'); $('offerMsg').textContent = ''; showScreen('sOffer');
}
function doRevive() {
  const p = G.p; G.adRevived = true;
  p.hp = Math.round(ST.maxhp * 0.5); p.inv = 2.5;
  showScreen(null); $('hud').classList.add('show'); state.mode = 'play';
  banner(L().revived); nuke(false); sfx('heal', 1, 0); gpStart();
}
$('bAdRevive').onclick = () => { if (state.mode !== 'offer') return; sfx('select', 0.6, 0); ADS.show('rewarded', doRevive, () => { $('offerMsg').textContent = L().adFail; }); };
$('bNoRevive').onclick = () => { if (state.mode !== 'offer') return; showScreen(null); state.mode = 'play'; die(); };
function nuke(withBoss) {
  for (const e of G.enemies) if (e.hp > 0 && (!e.boss || withBoss) && Math.abs(e.x - G.p.x) < VW / 2 + 20 && Math.abs(e.y - G.p.y) < VH / 2 + 30) damage(e, 9999, null, e.x - G.p.x, e.y - G.p.y, 2);
  G.shake = 0.8; G.flashT = 0.25; sfx('bigboom', 1, 0);
  G.blasts.push({ x: G.p.x, y: G.p.y - 8, r: 140, t: 0, life: 0.5, big: true });
  burst(G.p.x, G.p.y - 10, 90, ['#facb3e', '#ee8e2e', '#da4e38', '#fdf7ed'], 260, 0.8, 40);
}

// ------------------------------------------------------------- weapons
function fireWeapons(dt) {
  const p = G.p;
  for (const w of G.weapons) {
    const s = wStats(w);
    const n = (s.n || 1) + ST.amount;
    if (w.id === 'hammers') { updateHammers(w, s, n, dt); continue; }
    w.t -= dt;
    // queued shots (knives fire one after another)
    if (w.q > 0) { w.qt -= dt; if (w.qt <= 0) { w.q--; w.qt = 0.07; throwKnife(w, s, w.q2); } }
    if (w.t > 0) continue;
    w.t = s.cd * ST.cd;
    switch (w.id) {
      case 'sword': {
        const dirs = w.evo ? [0] : n >= 2 ? [0, Math.PI] : [0];
        const tg = nearest(p.x, p.y - 8, 34 * s.area * ST.area + 30);
        const base = tg ? Math.atan2(tg.y - tg.h / 2 - (p.y - 8), tg.x - p.x) : (p.face > 0 ? 0 : Math.PI);
        dirs.forEach((d, i) => G.swings.push({ w, ang: base + d, t: -i * 0.12, dur: w.evo ? 0.32 : 0.2, arc: w.evo ? TAU : 2.6, r: 30 * s.area * ST.area, dmg: s.dmg, hit: new Set(), spr: w.evo ? 'weapon_lavish_sword' : 'weapon_knight_sword', flip: i % 2 }));
        if (n > 2 && !w.evo) for (let k = 2; k < n; k++) G.swings.push({ w, ang: base + (k % 2 ? -Math.PI / 2 : Math.PI / 2), t: -k * 0.1, dur: 0.2, arc: 2.6, r: 30 * s.area * ST.area, dmg: s.dmg, hit: new Set(), spr: 'weapon_knight_sword' });
        sfx('sword', 0.55); break;
      }
      case 'knives': {
        const a = Math.atan2(p.diry, p.dirx);
        if (w.evo) { for (let i = 0; i < n; i++) throwKnife(w, s, a + i / n * TAU); }
        else { w.q = n; w.qt = 0; w.q2 = a; }
        break;
      }
      case 'axe': {
        for (let i = 0; i < n; i++) {
          const vx = (i - (n - 1) / 2) * 34 + p.face * 18 + rnd(-12, 12);
          G.shots.push({ w, kind: 'axe', spr: w.evo ? 'weapon_waraxe' : 'weapon_throwing_axe', x: p.x, y: p.y - 12, vx, vy: rnd(-215, -185), g: 400, rot: 0, vr: 11 * (vx >= 0 ? 1 : -1), life: 2.4, t: 0, dmg: s.dmg, pierce: 999, r: 7 * s.area * ST.area, hit: new Set(), sc: w.evo ? 1 : 1 });
        }
        sfx('thunk', 0.5); break;
      }
      case 'bow': {
        const used = new Set();
        for (let i = 0; i < n; i++) {
          const tgt = nearest(p.x, p.y, 230, used); if (tgt) used.add(tgt);
          const a = tgt ? Math.atan2(tgt.y - tgt.h / 2 - (p.y - 10), tgt.x - p.x) + (w.evo ? rnd(-0.05, 0.05) : 0) : (p.face > 0 ? 0 : Math.PI) + rnd(-0.3, 0.3);
          G.shots.push({ w, kind: 'arrow', spr: 'weapon_arrow', x: p.x, y: p.y - 10, vx: Math.cos(a) * 310, vy: Math.sin(a) * 310, rot: a, life: 1.1, t: -i * 0.05, dmg: s.dmg, pierce: s.pierce, r: 5, hit: new Set() });
        }
        sfx('shoot', 0.35); break;
      }
      case 'bombs': {
        for (let i = 0; i < n; i++) {
          const cands = []; queryR(p.x, p.y, 150, e => cands.push(e));
          const tg = cands.length ? pick(cands) : null;
          const tx = tg ? tg.x + rnd(-8, 8) : p.x + rnd(-80, 80), ty = tg ? tg.y + rnd(-6, 6) : p.y + rnd(-60, 60);
          G.shots.push({ w, kind: 'bomb', spr: 'bomb_f0', sx: p.x, sy: p.y - 10, tx: clamp(tx, 8, AW - 8), ty: clamp(ty, 10, AH - 4), x: p.x, y: p.y, t: -i * 0.1, fly: 0.45, fuse: 0.45, life: 1.2, dmg: s.dmg, r: 28 * s.area * ST.area, evo: w.evo });
        }
        break;
      }
      case 'spear': {
        const nd = w.evo ? 8 : s.dirs;
        const tg = nearest(p.x, p.y - 8, 50 * s.area * ST.area + 20);
        const base = tg ? Math.atan2(tg.y - tg.h / 2 - (p.y - 10), tg.x - p.x) : Math.hypot(p.dirx, p.diry) > 0.1 ? Math.atan2(p.diry, p.dirx) : (p.face > 0 ? 0 : Math.PI);
        for (let i = 0; i < nd; i++) G.swings.push({ w, kind: 'thrust', ang: base + i / nd * TAU * (nd === 2 ? 1 : 1), t: 0, dur: 0.26, len: 50 * s.area * ST.area, dmg: s.dmg, hit: new Set(), spr: w.evo ? 'weapon_saw_sword' : 'weapon_spear' });
        sfx('knife', 0.5); break;
      }
    }
  }
}
function throwKnife(w, s, a) {
  const p = G.p; const ja = a + rnd(-0.06, 0.06);
  G.shots.push({ w, kind: 'knife', spr: w.evo ? 'weapon_red_gem_sword' : 'weapon_knife', x: p.x, y: p.y - 10, vx: Math.cos(ja) * 270, vy: Math.sin(ja) * 270, rot: ja, life: 0.95, t: 0, dmg: s.dmg, pierce: s.pierce, r: 5, hit: new Set() });
  sfx('knife', 0.3, 0.12);
}
function updateHammers(w, s, n, dt) {
  const p = G.p; w.spin += dt * s.spd;
  w.orbs = [];
  const R = 32 * s.area * ST.area;
  for (let i = 0; i < n; i++) {
    const a = w.spin + i / n * TAU, x = p.x + Math.cos(a) * R, y = p.y - 10 + Math.sin(a) * R * 0.85;
    w.orbs.push({ x, y, a });
    queryR(x, y, 12, e => {
      if (dist2(x, y, e.x, e.y - e.h * e.sc / 2) > (e.r + 9) * (e.r + 9)) return;
      const last = w.hits.get(e) || -9; if (G.t - last < 0.45) return; w.hits.set(e, G.t);
      damage(e, s.dmg, w, e.x - p.x, e.y - p.y, w.evo ? 2.5 : 1.2);
    });
  }
  if (w.hits.size > 600) w.hits.clear();
}
function updateSwings(dt) {
  const p = G.p;
  for (let i = G.swings.length - 1; i >= 0; i--) {
    const s = G.swings[i]; s.t += dt;
    if (s.t < 0) continue;
    const k = clamp(s.t / s.dur, 0, 1);
    if (s.kind === 'thrust') {
      const ext = k < 0.4 ? k / 0.4 : 1 - (k - 0.4) / 0.6;
      const L = s.len * ext, cx = Math.cos(s.ang), cy = Math.sin(s.ang), ox = p.x, oy = p.y - 10;
      if (k < 0.6) queryR(ox + cx * L / 2, oy + cy * L / 2, L / 2 + 10, e => {
        if (s.hit.has(e)) return;
        const ex = e.x - ox, ey = e.y - e.h * e.sc / 2 - oy, along = ex * cx + ey * cy, perp = Math.abs(ex * -cy + ey * cx);
        if (along > -4 && along < L + 4 && perp < e.r + 5) { s.hit.add(e); damage(e, s.dmg, s.w, cx, cy, 1.4); }
      });
      s.ext = ext;
    } else {
      const a0 = s.ang - s.arc / 2, cur = a0 + s.arc * k;
      s.cur = cur;
      queryR(p.x, p.y - 8, s.r + 10, e => {
        if (s.hit.has(e)) return;
        const ex = e.x - p.x, ey = e.y - e.h * e.sc / 2 - (p.y - 8), d = Math.hypot(ex, ey);
        if (d > s.r + e.r) return;
        const ea = Math.atan2(ey, ex), rel = ((ea - a0) % TAU + TAU) % TAU;
        if (s.arc >= TAU - 0.01 || rel <= s.arc * k + 0.2) { s.hit.add(e); damage(e, s.dmg, s.w, ex, ey, 1.6); }
      });
    }
    if (s.t >= s.dur) G.swings.splice(i, 1);
  }
}
function updateShots(dt) {
  for (let i = G.shots.length - 1; i >= 0; i--) {
    const s = G.shots[i]; s.t += dt;
    if (s.t < 0) continue;
    if (s.kind === 'bomb') {
      if (s.t < s.fly) { const k = s.t / s.fly; s.x = s.sx + (s.tx - s.sx) * k; s.y = s.sy + (s.ty - s.sy) * k; s.z = Math.sin(k * Math.PI) * 34; }
      else { s.x = s.tx; s.y = s.ty; s.z = 0; }
      if (s.t >= s.fly + s.fuse) { explode(s.x, s.y, s.r, s.dmg, s.w); if (s.evo) for (let j = 0; j < 3; j++) { const a = rnd(0, TAU); G.blasts.push({ x: s.x + Math.cos(a) * s.r, y: s.y + Math.sin(a) * s.r * 0.7, r: s.r * 0.7, t: -0.15 - j * 0.08, life: 0.35, dmg: s.dmg * 0.6, w: s.w, pending: true }); } G.shots.splice(i, 1); }
      continue;
    }
    if (s.g) s.vy += s.g * dt;
    s.x += s.vx * dt; s.y += s.vy * dt;
    if (s.vr) s.rot += s.vr * dt;
    queryR(s.x, s.y, s.r + 14, e => {
      if (s.pierce <= 0 || s.hit.has(e)) return;
      if (dist2(s.x, s.y, e.x, e.y - e.h * e.sc / 2) > (e.r + s.r) * (e.r + s.r)) return;
      s.hit.add(e); s.pierce--; damage(e, s.dmg, s.w, s.vx, s.vy, s.kind === 'axe' ? 0.6 : 1);
    });
    if (s.pierce <= 0 || s.t > s.life) G.shots.splice(i, 1);
  }
}
function explode(x, y, r, dmg, w) {
  G.blasts.push({ x, y, r, t: 0, life: 0.35 });
  queryR(x, y, r + 16, e => { if (dist2(x, y, e.x, e.y) < (r + e.r) * (r + e.r)) damage(e, dmg, w, e.x - x, e.y - y, 1.8); });
  G.shake = Math.max(G.shake, 0.15); sfx('boom', 0.5, 0.15, 0.07);
  burst(x, y - 4, Math.round(10 + r * 0.6), ['#fdf7ed', '#facb3e', '#ee8e2e', '#da4e38', '#c56025'], r * 3.2, 0.42, 30);
  burst(x, y - 4, 8, ['#483b3a', '#775c55', '#333333'], r * 1.4, 0.7, -20);
}

// ------------------------------------------------------------- level-up & chest
const xpNeed = l => 4 + l * 5 + Math.max(0, l - 12) * 8 + Math.max(0, l - 25) * 10;
function gainXP(v) {
  G.xp += v * ST.growth;
  while (G.xp >= xpNeed(G.lvl)) { G.xp -= xpNeed(G.lvl); G.lvl++; G.pendingLv++; }
  if (G.pendingLv > 0 && state.mode === 'play') openLevel();
}
function canEvolve(w) { return !w.evo && w.lvl >= 5 && (G.passives[WP[w.id].pair] || 0) > 0; }
function choicePool() {
  const out = [];
  for (const w of G.weapons) if (!w.evo && w.lvl < 5) out.push({ kind: 'w', id: w.id, wt: 3 });
  if (G.weapons.length < 6) for (const id in WP) if (!weapon(id)) out.push({ kind: 'w', id, wt: 1.6 });
  const owned = Object.keys(G.passives);
  for (const id of owned) if (G.passives[id] < PS[id].max) out.push({ kind: 'p', id, wt: 2.2 });
  if (owned.length < 6) for (const id in PS) if (!G.passives[id]) out.push({ kind: 'p', id, wt: 1.3 });
  return out;
}
function rollChoices(n) {
  const pool = choicePool(), res = [];
  while (res.length < n && pool.length) {
    const tot = pool.reduce((a, b) => a + b.wt, 0); let r = Math.random() * tot, idx = 0;
    for (; idx < pool.length; idx++) { r -= pool[idx].wt; if (r <= 0) break; }
    res.push(pool.splice(Math.min(idx, pool.length - 1), 1)[0]);
  }
  if (!res.length) { res.push({ kind: 'heal' }); res.push({ kind: 'gold' }); }
  return res;
}
function applyChoice(c) {
  if (c.kind === 'w') { const w = weapon(c.id); if (w) w.lvl++; else addWeapon(c.id); }
  else if (c.kind === 'p') { G.passives[c.id] = (G.passives[c.id] || 0) + 1; if (c.id === 'vitality') G.p.hp += 20; }
  else if (c.kind === 'heal') G.p.hp = Math.min(ST.maxhp, G.p.hp + 30);
  else if (c.kind === 'gold') G.gold += 25;
  refreshStats(); G.p.hp = Math.min(G.p.hp, ST.maxhp); buildInv();
}
function choiceInfo(c) {
  const Lx = L();
  if (c.kind === 'heal') return { icon: 'flask_big_red', t: Lx.heal, d: Lx.healD, tag: '' };
  if (c.kind === 'gold') return { icon: 'coin_anim_f0', t: Lx.goldBag, d: Lx.goldBagD, tag: '' };
  if (c.kind === 'w') {
    const d = nm(WP[c.id]), w = weapon(c.id);
    if (!w) { const pr = nm(PS[WP[c.id].pair])[0]; return { icon: WP[c.id].icon, t: d[0], d: d[1] + ' (' + Lx.pairsW(pr) + ')', tag: Lx.isNew, cls: 'new' }; }
    return { icon: WP[c.id].icon, t: d[0], d: d[2][w.lvl - 1], tag: Lx.lv(w.lvl + 1) };
  }
  const d = nm(PS[c.id]), lv = G.passives[c.id] || 0;
  const pairW = Object.keys(WP).find(k => WP[k].pair === c.id);
  return { icon: PS[c.id].icon, t: d[0], d: d[1] + (pairW ? ' (' + Lx.pairsP(nm(WP[pairW])[0]) + ')' : ''), tag: lv ? Lx.lv(lv + 1) : Lx.isNew, cls: lv ? '' : 'new' };
}
let curChoices = [];
function openLevel() {
  state.mode = 'level'; gpStop();
  sfx('levelup', 0.9, 0);
  // level-up shockwave pushes enemies back
  queryR(G.p.x, G.p.y, 70, e => { const dx = e.x - G.p.x, dy = e.y - G.p.y, d = Math.hypot(dx, dy) || 1; e.kbx += dx / d * 160 * (e.boss ? 0.1 : 1); e.kby += dy / d * 160 * (e.boss ? 0.1 : 1); });
  burst(G.p.x, G.p.y - 10, 40, ['#72d6ce', '#cae6f5', '#fdf7ed', '#49a790'], 140, 0.6, 0);
  showChoices(rollChoices(3 + shopLv('insight')));
  showScreen('sLevel');
}
function showChoices(list) {
  curChoices = list;
  const box = $('choices'); box.innerHTML = '';
  list.forEach((c, i) => {
    const inf = choiceInfo(c);
    const b = document.createElement('button'); b.className = 'choice';
    b.innerHTML = `<div class="ic"></div><div class="t"><span></span><em class="${inf.cls || ''}"></em></div><div class="d"></div>`;
    b.querySelector('.ic').appendChild(iconCanvas(inf.icon, U * 16));
    b.querySelector('.t span').textContent = `${i + 1}. ${inf.t}`; b.querySelector('.t em').textContent = inf.tag; b.querySelector('.d').textContent = inf.d;
    b.onmouseenter = () => sfx('move', 0.4, 0);
    b.onclick = () => {
      if (state.mode !== 'level') return;
      sfx('select', 0.7, 0); applyChoice(c); G.pendingLv--;
      if (G.pendingLv > 0) { showChoices(rollChoices(3 + shopLv('insight'))); sfx('levelup', 0.7, 0); }
      else { showScreen(null); state.mode = 'play'; gpStart(); }
    };
    box.appendChild(b);
  });
  const rb = $('bReroll'); rb.textContent = G.rerolls > 0 ? L().reroll(G.rerolls) : L().adReroll; rb.style.display = G.rerolls > 0 || (!STANDALONE && (G.adRerolls || 0) < 3) ? '' : 'none';
}
$('bReroll').onclick = () => {
  if (state.mode !== 'level') return;
  if (G.rerolls > 0) { G.rerolls--; sfx('move', 0.6, 0); showChoices(rollChoices(3 + shopLv('insight'))); return; }
  if (STANDALONE || (G.adRerolls || 0) >= 3) return;
  ADS.show('rewarded', () => { G.adRerolls = (G.adRerolls || 0) + 1; sfx('move', 0.6, 0); showChoices(rollChoices(3 + shopLv('insight'))); }, () => { $('bReroll').textContent = L().adFail; });
};

// chest
let chestAnim = null;
function openChest() {
  state.mode = 'chest'; gpStop(); showScreen('sChest'); sfx('chest', 0.9, 0);
  const evo = G.weapons.find(canEvolve);
  const rewards = [];
  if (evo) rewards.push({ kind: 'evo', id: evo.id });
  else {
    const r = Math.random(), n = r < 0.06 ? 5 : r < 0.26 ? 3 : 1;
    for (let i = 0; i < n; i++) {
      const pool = choicePool().filter(c => c.kind === 'w' ? weapon(c.id) : G.passives[c.id]);
      const c = pool.length ? pick(pool) : { kind: 'gold' };
      rewards.push(c); if (c.kind !== 'gold') applyChoice(c); else G.gold += 25;
    }
  }
  if (evo) { evo.evo = true; refreshStats(); buildInv(); }
  const goldBonus = Math.round(irnd(10, 40) * STG().gold); G.gold += Math.round(goldBonus * ST.greed);
  $('chestOut').innerHTML = ''; $('bTake').disabled = true;
  const reel = $('reel'); reel.innerHTML = '';
  const allIcons = [...Object.values(WP).map(w => w.icon), ...Object.values(PS).map(p => p.icon)];
  const slots = rewards.map(() => { const s = document.createElement('div'); s.className = 'slot'; reel.appendChild(s); return s; });
  chestAnim = { t: 0, rewards, slots, allIcons, shown: 0, goldBonus, tick: 0 };
}
function iconForReward(c) { if (c.kind === 'evo') return WP[c.id].evoIcon; if (c.kind === 'w') return WP[c.id].icon; if (c.kind === 'p') return PS[c.id].icon; return 'coin_anim_f0'; }
function updateChestUI(dt) {
  const A = chestAnim; if (!A) return;
  A.t += dt;
  // chest canvas
  const c = $('chestCv'), x = c.getContext('2d'); x.imageSmoothingEnabled = false; x.clearRect(0, 0, c.width, c.height);
  const fr = A.t < 0.25 ? 0 : A.t < 0.45 ? 1 : 2, f = AT['chest_full_open_anim_f' + fr];
  x.drawImage(sheet, f[0], f[1], 16, 16, 32, 22, 32, 32);
  if (A.t > 0.45) { for (let i = 0; i < 10; i++) { const a = A.t * 2 + i * 0.63, r = 18 + Math.sin(A.t * 6 + i) * 4; x.fillStyle = i % 2 ? '#facb3e' : '#fdf7ed'; x.fillRect(Math.round(48 + Math.cos(a) * r), Math.round(30 + Math.sin(a) * r * 0.6), 1, 1); } }
  // reels spin then stop one by one
  const stopAt = i => 1.0 + i * 0.45;
  A.slots.forEach((s, i) => {
    if (A.t < stopAt(i)) {
      A.tick -= dt;
      if (A.t > 0.4 && (s.dataset.k || 0) < A.t * 14) { s.dataset.k = Math.ceil(A.t * 14); s.innerHTML = ''; s.appendChild(iconCanvas(pick(A.allIcons), U * 15)); if (i === 0) sfx('move', 0.25, 0.3, 0.06); }
    } else if (!s.dataset.done) {
      s.dataset.done = 1; s.innerHTML = ''; s.appendChild(iconCanvas(iconForReward(A.rewards[i]), U * 15)); sfx('pick', 0.7, 0);
      const out = $('chestOut'), r = A.rewards[i], line = document.createElement('div');
      if (r.kind === 'evo') { line.className = 'evo'; line.textContent = `${nm(WP[r.id])[3]} ${L().evolved}`; sfx('fanfare', 1, 0); G.shake = 0.3; }
      else if (r.kind === 'gold') line.textContent = L().gold(25);
      else { const inf = choiceInfo(r); line.innerHTML = `<b></b> `; line.firstChild.textContent = r.kind === 'w' ? nm(WP[r.id])[0] + ' ' + L().lv(weapon(r.id).lvl) : nm(PS[r.id])[0] + ' ' + L().lv(G.passives[r.id]); void inf; }
      out.appendChild(line);
      if (i === A.slots.length - 1) {
        const g = document.createElement('div'); g.innerHTML = '<b></b>'; g.firstChild.textContent = L().gold(Math.round(A.goldBonus * ST.greed)); out.appendChild(g);
        sfx('coins', 0.8, 0); $('bTake').disabled = false; $('bTake').focus();
      }
    }
  });
}
$('bTake').onclick = () => { if (state.mode !== 'chest') return; sfx('select', 0.6, 0); chestAnim = null; showScreen(null); state.mode = 'play'; if (G.pendingLv > 0) openLevel(); else gpStart(); };

// ------------------------------------------------------------- update
function update(dt) {
  const p = G.p;
  if (G.hitstop > 0) { G.hitstop -= dt; dt *= 0.1; }
  G.t += dt;
  // input
  let mx = (keys['d'] || keys['arrowright'] ? 1 : 0) - (keys['a'] || keys['arrowleft'] ? 1 : 0);
  let my = (keys['s'] || keys['arrowdown'] ? 1 : 0) - (keys['w'] || keys['arrowup'] ? 1 : 0);
  if (stick.on && Math.hypot(stick.x, stick.y) > 0.15) { mx = stick.x; my = stick.y; }
  const ml = Math.hypot(mx, my);
  p.moving = ml > 0.1;
  if (p.moving) { mx /= Math.max(1, ml); my /= Math.max(1, ml); p.dirx = mx; p.diry = my; if (Math.abs(mx) > 0.15) p.face = mx > 0 ? 1 : -1; }
  p.x = clamp(p.x + mx * ST.spd * dt, 8, AW - 8); p.y = clamp(p.y + my * ST.spd * dt, 14, AH - 2);
  for (const o of props) if (o.solid) { const dx = p.x - o.x, dy = p.y - o.y, d = Math.hypot(dx, dy); if (d < o.r + 5 && d > 0) { p.x = o.x + dx / d * (o.r + 5); p.y = o.y + dy / d * (o.r + 5); } }
  p.anim += dt * (p.moving ? 9 : 5);
  if (p.inv > 0) p.inv -= dt; if (p.hurtT > 0) p.hurtT -= dt;
  p.hp = Math.min(ST.maxhp, p.hp + ST.regen * dt);
  if (G.redT > 0) G.redT -= dt; if (G.flashT > 0) G.flashT -= dt;

  if (!G.won) spawner(dt);
  buildGrid();
  fireWeapons(dt);
  updateSwings(dt);
  updateShots(dt);

  // enemies
  const farR = Math.hypot(VW, VH) * 0.9;
  for (let i = G.enemies.length - 1; i >= 0; i--) {
    const e = G.enemies[i];
    if (e.hp <= 0) { G.enemies.splice(i, 1); continue; }
    if (e.static) {
      if (e.flash > 0) e.flash -= dt;
      const ox = p.x - e.x, oy = p.y - e.y, od = Math.hypot(ox, oy);
      if (od < e.r + 5 && od > 0) { p.x = e.x + ox / od * (e.r + 5); p.y = e.y + oy / od * (e.r + 5); }
      continue;
    }
    e.anim += dt * 8; if (e.flash > 0) e.flash -= dt;
    let dx = p.x - e.x, dy = p.y - e.y; const d = Math.hypot(dx, dy) || 1;
    let sp = e.spd;
    if (e.swarm) { e.swarm.t -= dt; if (e.swarm.t <= 0) e.swarm = null; }
    if (e.boss) {
      e.dashT -= dt; e.summonT -= dt;
      if (e.dash > 0) { e.dash -= dt; sp *= 3.4; }
      else if (e.tele > 0) { e.tele -= dt; sp = 0; e.flash = Math.max(e.flash, (e.tele * 10 | 0) % 2 ? 0.05 : 0); if (e.tele <= 0) { e.dash = 0.65; e.dx = dx / d; e.dy = dy / d; sfx('impact', 0.7, 0); } }
      else if (e.dashT <= 0) { e.tele = 0.55; e.dashT = rnd(3.5, 5.5); }
      if (e.summonT <= 0 && e.type !== 'ogre') { e.summonT = 7; const st = e.type === 'big_zombie' ? 'tiny_zombie' : 'imp'; for (let k = 0; k < 6; k++) spawnEnemy(st, e.x + rnd(-20, 20), e.y + rnd(-14, 14)); }
      if (e.dash > 0) { dx = e.dx; dy = e.dy; }
    }
    const nx = e.dash > 0 ? dx : dx / d, ny = e.dash > 0 ? dy : dy / d;
    e.x += (nx * sp + e.kbx) * dt; e.y += (ny * sp + e.kby) * dt;
    e.kbx *= Math.pow(0.0005, dt); e.kby *= Math.pow(0.0005, dt);
    if (Math.abs(nx) > 0.1) e.face = nx > 0 ? 1 : -1;
    e.x = clamp(e.x, 6, AW - 6); e.y = clamp(e.y, 12, AH - 2);
    // separation
    if (!e.boss) {
      let cnt = 0;
      queryR(e.x, e.y, e.r * 2, o => {
        if (o === e || cnt > 5) return; cnt++;
        const ox = e.x - o.x, oy = e.y - o.y, dd = ox * ox + oy * oy, rr = (e.r + o.r) * 0.8;
        if (dd < rr * rr && dd > 0.01) { const k = (rr - Math.sqrt(dd)) / Math.sqrt(dd) * 0.5; e.x += ox * k; e.y += oy * k; }
      });
      for (const o of props) if (o.solid) { const ox = e.x - o.x, oy = e.y - o.y, dd = Math.hypot(ox, oy); if (dd < o.r + e.r * 0.7 && dd > 0) { e.x = o.x + ox / dd * (o.r + e.r * 0.7); e.y = o.y + oy / dd * (o.r + e.r * 0.7); } }
    }
    // contact
    if (d < e.r + 6) hurtPlayer(e.dmg);
    // recycle stragglers
    if (!e.boss && !e.elite && e.type !== 'mimic' && d > farR) { const [x, y] = spawnPos(); e.x = x; e.y = y; }
  }

  // spike traps
  for (const sk of spikes) {
    if (spikeFrame(sk, G.t) !== 3) continue;
    if (Math.abs(p.x - sk.x) < 7 && Math.abs(p.y - 3 - sk.y) < 7) hurtPlayer(8 * STG().hp);
    queryR(sk.x, sk.y, 12, e => { if (e.static || e.boss || Math.abs(e.x - sk.x) > 8 || Math.abs(e.y - 3 - sk.y) > 8) return; if ((e.spikeT || 0) > G.t) return; e.spikeT = G.t + 0.5; damage(e, 30, null, 0, -1, 0.3); });
  }
  if (G.rushT > 0) G.rushT -= dt;
  // pickups
  const mag = ST.magnet;
  for (let i = G.pickups.length - 1; i >= 0 && !G.over; i--) {
    const k = G.pickups[i]; k.t += dt;
    const dx = p.x - k.x, dy = (p.y - 6) - k.y, d = Math.hypot(dx, dy);
    if (k.k === 'coin') {
      if (!k.pull && d < mag) { k.pull = true; k.vx = -dx / d * 60; k.vy = -dy / d * 60; }
      if (k.pull) { const acc = 900; k.vx += dx / d * acc * dt; k.vy += dy / d * acc * dt; const v = Math.hypot(k.vx, k.vy), mv = 320; if (v > mv) { k.vx *= mv / v; k.vy *= mv / v; } k.x += k.vx * dt; k.y += k.vy * dt; }
      if (d < 7) { G.pickups.splice(i, 1); G.gold += k.v * ST.greed * STG().gold; gainXP(k.v); sfx('coin', 0.28, 0.1, 0.035); }
    } else if (d < (k.k === 'mimic' ? 26 : 12)) {
      G.pickups.splice(i, 1);
      if (k.k === 'heart') { p.hp = Math.min(ST.maxhp, p.hp + 30); sfx('heal', 0.8, 0); G.nums.push({ x: p.x, y: p.y - 30, v: '+30', t: 0, heal: true }); }
      else if (k.k === 'keg') nuke(false);
      else if (k.k === 'chest') { openChest(); }
      else if (k.k === 'mimic') { const m = spawnEnemy('mimic', k.x, k.y); m.flash = 0.2; sfx('impact', 1, 0); G.shake = 0.4; banner(L().mimic); }
    }
  }
  // fx
  for (let i = G.parts.length - 1; i >= 0; i--) { const q = G.parts[i]; q.t += dt; q.vy += (q.g || 0) * dt; q.x += q.vx * dt; q.y += q.vy * dt; q.vx *= 0.96; if (q.t > q.life) G.parts.splice(i, 1); }
  for (let i = G.nums.length - 1; i >= 0; i--) { const n = G.nums[i]; n.t += dt; if (n.t > 0.7) G.nums.splice(i, 1); }
  for (let i = G.blasts.length - 1; i >= 0; i--) {
    const b = G.blasts[i]; b.t += dt;
    if (b.pending && b.t >= 0) { b.pending = false; explode(b.x, b.y, b.r, b.dmg, b.w); G.blasts.splice(i, 1); continue; }
    if (b.t > b.life) G.blasts.splice(i, 1);
  }
  if (G.shake > 0) G.shake -= dt;

  // camera
  const tx = p.x - VW / 2, ty = p.y - 12 - VH / 2;
  G.cam.x += (tx - G.cam.x) * Math.min(1, dt * 10); G.cam.y += (ty - G.cam.y) * Math.min(1, dt * 10);
  G.cam.x = clamp(G.cam.x, -40, Math.max(-40, AW + 40 - VW)); G.cam.y = clamp(G.cam.y, -56, Math.max(-56, AH + 48 - VH));
  if (VW > AW + 80) G.cam.x = (AW - VW) / 2; if (VH > AH + 104) G.cam.y = (AH - VH) / 2;

  // music by phase
  if (!G.won) playMusic(G.t < 240 ? 'level1' : G.t < 480 ? 'level2' : 'level3');
  hud();
}

// ------------------------------------------------------------- render
function render(attract) {
  const cam = attract ? attract : G.cam;
  let sx = 0, sy = 0;
  if (!attract && G.shake > 0 && SV.settings.shake) { const m = Math.min(G.shake, 0.6) * 6; sx = Math.round(rnd(-m, m)); sy = Math.round(rnd(-m, m)); }
  const cx = Math.round(cam.x) + sx, cy = Math.round(cam.y) + sy;
  vctx.fillStyle = '#161216'; vctx.fillRect(0, 0, VW, VH);
  // floor
  const tx0 = Math.max(0, Math.floor(cx / TS)), tx1 = Math.min(COLS - 1, Math.floor((cx + VW) / TS));
  const ty0 = Math.max(0, Math.floor(cy / TS)), ty1 = Math.min(ROWS - 1, Math.floor((cy + VH) / TS));
  for (let ty = ty0; ty <= ty1; ty++) for (let tx = tx0; tx <= tx1; tx++) tileSpr(floorMap[ty * COLS + tx], tx, ty, cx, cy);
  const st_t = attract ? performance.now() / 1000 : G.t;
  for (const sk of spikes) if (sk.tx >= tx0 - 1 && sk.tx <= tx1 + 1 && sk.ty >= ty0 - 1 && sk.ty <= ty1 + 1) tileSpr('floor_spikes_anim_f' + spikeFrame(sk, st_t), sk.tx, sk.ty, cx, cy);
  // top wall
  if (cy < 8) {
    for (let x = Math.max(-1, tx0 - 1); x <= Math.min(COLS, tx1 + 1); x++) {
      const side = x === -1 || x === COLS;
      if (side) continue;
      tileSpr('wall_top_mid', x, -2, cx, cy); tileSpr('wall_mid', x, -1, cx, cy);
      if (wallDeco[x]) tileSpr(wallDeco[x], x, -1, cx, cy);
    }
    const ft = (performance.now() / 160 | 0) % 3;
    for (const f of wallDeco.fountains) { tileSpr('wall_fountain_top_' + (1 + ((performance.now() / 300 | 0) % 3)), f.x, -2, cx, cy); tileSpr(`wall_fountain_mid_${f.c}_anim_f${ft}`, f.x, -1, cx, cy); tileSpr(`wall_fountain_basin_${f.c}_anim_f${ft}`, f.x, 0, cx, cy); }
  }
  // side walls
  for (let y = Math.max(-2, ty0 - 2); y <= Math.min(ROWS, ty1 + 1); y++) {
    if (cx < 16) tileSpr(y === -2 ? 'wall_edge_top_left' : y === ROWS ? 'wall_edge_bottom_left' : 'wall_edge_mid_left', -1, y, cx, cy);
    if (cx + VW > AW - 16) tileSpr(y === -2 ? 'wall_edge_top_right' : y === ROWS ? 'wall_edge_bottom_right' : 'wall_edge_mid_right', COLS, y, cx, cy);
  }
  // decals and pickups (ground layer)
  const inView = (x, y, m = 40) => x > cx - m && x < cx + VW + m && y > cy - m && y < cy + VH + m * 2;
  for (const o of props) if (o.decal && inView(o.x, o.y)) spr(o.name, o.x - cx, o.y - cy, { alpha: 0.55 });
  const tnow = performance.now() / 1000;
  for (const k of (attract ? [] : G.pickups)) {
    if (!inView(k.x, k.y)) continue;
    const X = k.x - cx, Y = k.y - cy;
    if (k.k === 'coin') {
      const fr = 'coin_anim_f' + (((tnow * 8 + k.t * 4) | 0) % 4);
      spr(fr, X, Y); if (k.v >= 3) spr(fr, X + 2, Y - 2); if (k.v >= 8) spr(fr, X - 2, Y - 3);
    } else if (k.k === 'heart') spr('ui_heart_full', X, Y - Math.round(Math.abs(Math.sin(tnow * 3)) * 2));
    else if (k.k === 'keg') spr('bomb_f' + ((tnow * 6 | 0) % 3), X, Y);
    else if (k.k === 'chest' || k.k === 'mimic') { shadow(X, Y, 14); spr('chest_full_open_anim_f0', X, Y - Math.round(Math.abs(Math.sin(tnow * 4)) * 2)); if ((tnow * 4 | 0) % 2) vctx.fillStyle = '#facb3e', vctx.fillRect(X + 6, Y - 18, 1, 1); }
  }
  // depth-sorted actors
  const list = [];
  for (const o of props) if (!o.decal && inView(o.x, o.y, 60)) list.push({ y: o.y, d: () => spr(o.name, o.x - cx, o.y - cy) });
  if (attract) for (const o of crateSpots) if (inView(o.x, o.y, 60)) list.push({ y: o.y, d: () => spr('crate', o.x - cx, o.y - cy) });
  const src = attract ? ATTRACT.mobs : G.enemies;
  for (const e of src) if (inView(e.x, e.y)) list.push({ y: e.y, d: () => drawEnemy(e, cx, cy) });
  if (!attract) {
    list.push({ y: G.p.y, d: () => drawPlayer(cx, cy) });
    for (const s of G.shots) if (s.kind === 'bomb' && s.t >= 0) list.push({ y: s.y, d: () => { shadow(s.x - cx, s.y - cy, 8); spr('bomb_f' + (s.t < s.fly ? 0 : ((s.t * 12 | 0) % 2) + 1), s.x - cx, s.y - cy - (s.z || 0)); } });
  } else list.push({ y: ATTRACT.hero.y, d: () => { shadow(ATTRACT.hero.x - cx, ATTRACT.hero.y - cy, 10); const f = frames(HEROES[SV.hero].spr, 'idle'); spr(f[(tnow * 5 | 0) % f.length], ATTRACT.hero.x - cx, ATTRACT.hero.y - cy); } });
  list.sort((a, b) => a.y - b.y).forEach(o => o.d());
  const tint = !attract && STG().tint;
  if (tint) { vctx.globalCompositeOperation = 'multiply'; vctx.fillStyle = tint; vctx.fillRect(0, 0, VW, VH); vctx.globalCompositeOperation = 'source-over'; }
  // bottom wall (foreground)
  if (cy + VH > AH - 8) for (let x = Math.max(0, tx0 - 1); x <= Math.min(COLS - 1, tx1 + 1); x++) { tileSpr('wall_top_mid', x, ROWS, cx, cy); tileSpr('wall_mid', x, ROWS + 1, cx, cy); }
  if (!attract) {
    // projectiles
    for (const s of G.shots) {
      if (s.t < 0 || s.kind === 'bomb') continue;
      if (s.kind === 'axe') sprRot(s.spr, s.x - cx, s.y - cy, s.rot, -AT[s.spr][3] / 2);
      else sprRot(s.spr, s.x - cx, s.y - cy, s.rot, -AT[s.spr][3] / 2);
    }
    // swings & hammers
    drawWeaponsFx(cx, cy);
    // blasts
    for (const b of G.blasts) {
      if (b.t < 0) continue;
      void b;
    }
    for (const q of G.parts) { vctx.globalAlpha = clamp(1 - q.t / q.life + 0.3, 0, 1); vctx.fillStyle = q.c; vctx.fillRect(Math.round(q.x - cx), Math.round(q.y - cy), q.sz, q.sz); }
    vctx.globalAlpha = 1;
  }
  // light
  drawLight(cx, cy, attract);
  if (!attract) {
    // damage numbers above the dark
    vctx.font = '8px Galmuri7'; vctx.textAlign = 'center'; vctx.textBaseline = 'alphabetic';
    for (const n of G.nums) {
      const X = Math.round(n.x - cx), Y = Math.round(n.y - cy - n.t * 22 + (n.t > 0.5 ? (n.t - 0.5) * 10 : 0));
      const s = String(n.v);
      vctx.fillStyle = '#222'; vctx.fillText(s, X + 1, Y + 1);
      vctx.fillStyle = n.heal ? '#4ba747' : n.crit ? '#facb3e' : '#fdf7ed'; vctx.fillText(s, X, Y);
    }
    // player hp bar
    const p = G.p, bw = 16, X = Math.round(p.x - cx - bw / 2), Y = Math.round(p.y - cy + 3);
    vctx.fillStyle = '#222'; vctx.fillRect(X - 1, Y - 1, bw + 2, 4);
    vctx.fillStyle = '#62232f'; vctx.fillRect(X, Y, bw, 2);
    vctx.fillStyle = '#da4e38'; vctx.fillRect(X, Y, Math.round(bw * clamp(p.hp / ST.maxhp, 0, 1)), 2);
    // off-screen chest pointer
    for (const k of G.pickups) if ((k.k === 'chest' || k.k === 'mimic') && !(k.x > cx && k.x < cx + VW && k.y > cy && k.y < cy + VH)) {
      const a = Math.atan2(k.y - p.y, k.x - p.x); const ex = clamp(k.x - cx, 10, VW - 10), ey = clamp(k.y - cy, 22, VH - 10);
      sprRot('weapon_arrow', ex, ey, a, -10);
    }
    if (G.redT > 0) { vctx.fillStyle = `rgba(218,78,56,${G.redT * 0.6})`; vctx.fillRect(0, 0, VW, 2); vctx.fillRect(0, VH - 2, VW, 2); vctx.fillRect(0, 0, 2, VH); vctx.fillRect(VW - 2, 0, 2, VH); }
    if (G.flashT > 0) { vctx.fillStyle = `rgba(253,247,237,${G.flashT * 2})`; vctx.fillRect(0, 0, VW, VH); }
  }
  ctx.drawImage(V, 0, 0, VW * SC, VH * SC);
}
function shadow(x, y, w) {
  vctx.fillStyle = 'rgba(17,10,14,0.45)';
  const X = Math.round(x - w / 2), Y = Math.round(y - 2);
  vctx.fillRect(X + 2, Y, w - 4, 1); vctx.fillRect(X, Y + 1, w, 1); vctx.fillRect(X + 2, Y + 2, w - 4, 1);
}
function pixelRing(x, y, r, col, th) {
  vctx.fillStyle = col; x = Math.round(x); y = Math.round(y);
  const n = Math.max(12, Math.round(r * 5));
  for (let i = 0; i < n; i++) { const a = i / n * TAU; vctx.fillRect(Math.round(x + Math.cos(a) * r), Math.round(y + Math.sin(a) * r * 0.7), th, th); }
}
function drawEnemy(e, cx, cy) {
  const fr = (e.dash > 0 || Math.abs(e.kbx) > 5 || true) ? e.run : e.idle;
  const name = fr[(e.anim | 0) % fr.length];
  const X = e.x - cx, Y = e.y - cy;
  shadow(X, Y, e.boss ? 22 : e.elite ? 18 : 10);
  const flip = e.face < 0;
  if (e.elite || e.boss && e.tele > 0) {
    const s = e.sc;
    for (const [ox, oy] of [[-1, 0], [1, 0], [0, -1], [0, 1]]) spr(name, X + ox, Y + oy, { red: true, flip, scale: s });
  }
  spr(name, X, Y, { flip, scale: e.sc, flash: e.flash > 0 });
  if ((e.elite || e.boss) && e.hp < e.maxhp && !e.boss) {
    const bw = 20, bx = Math.round(X - bw / 2), by = Math.round(Y - e.h * e.sc - 5);
    vctx.fillStyle = '#222'; vctx.fillRect(bx - 1, by - 1, bw + 2, 3); vctx.fillStyle = '#da4e38'; vctx.fillRect(bx, by, Math.round(bw * e.hp / e.maxhp), 1);
  }
}
function drawPlayer(cx, cy) {
  const p = G.p, H = HEROES[G.hero];
  const f = p.hurtT > 0 ? [`${H.spr}_hit_anim_f0`] : frames(H.spr, p.moving ? 'run' : 'idle');
  const name = f[(p.anim | 0) % f.length];
  const X = p.x - cx, Y = p.y - cy;
  shadow(X, Y, 12);
  if (p.inv > 0 && ((p.inv * 20) | 0) % 2) return;
  spr(name, X, Y, { flip: p.face < 0, flash: p.hurtT > 0.15 });
}
function drawWeaponsFx(cx, cy) {
  const p = G.p;
  for (const s of G.swings) {
    if (s.t < 0) continue;
    const ox = p.x - cx, oy = p.y - 10 - cy;
    if (s.kind === 'thrust') {
      const L = s.len * (s.ext || 0), h = AT[s.spr][3];
      sprRot(s.spr, ox, oy, s.ang, L - h + 4);
    } else {
      const h = AT[s.spr][3];
      for (let k = 2; k >= 0; k--) {
        const a = s.cur - k * 0.28 * (s.arc > 6 ? 1 : 1);
        sprRot(s.spr, ox, oy + 2, a, Math.max(0, s.r - h - 2), { alpha: k ? 0.35 / k : 1, flash: k > 0 });
      }
    }
  }
  for (const w of G.weapons) if (w.orbs) for (const o of w.orbs) sprRot(w.evo ? 'weapon_big_hammer' : 'weapon_hammer', o.x - cx, o.y - cy, o.a + Math.PI / 2, -AT[w.evo ? 'weapon_big_hammer' : 'weapon_hammer'][3] / 2);
}
function drawLight(cx, cy, attract) {
  if (!LIGHT.canvas || LIGHT.canvas.width !== VW || LIGHT.canvas.height !== VH) { LIGHT.canvas = document.createElement('canvas'); LIGHT.canvas.width = VW; LIGHT.canvas.height = VH; LIGHT.ctx = LIGHT.canvas.getContext('2d'); }
  const lc = LIGHT.ctx;
  lc.globalCompositeOperation = 'source-over'; lc.clearRect(0, 0, VW, VH);
  lc.fillStyle = 'rgba(14,8,18,0.62)'; lc.fillRect(0, 0, VW, VH);
  lc.globalCompositeOperation = 'destination-out';
  const R = Math.round(Math.max(VW, VH) * 0.42) & ~1;
  const ls = lightSprite(R);
  const px = attract ? ATTRACT.hero.x : G.p.x, py = attract ? ATTRACT.hero.y : G.p.y;
  lc.drawImage(ls, Math.round(px - cx - R), Math.round(py - 10 - cy - R));
  const small = lightSprite(40);
  if (cy < 30) for (const f of wallDeco.fountains) lc.drawImage(small, Math.round(f.x * TS + 8 - cx - 40), Math.round(-4 - cy - 40));
  if (!attract) {
    for (const b of G.blasts) if (b.t >= 0) lc.drawImage(small, Math.round(b.x - cx - 40), Math.round(b.y - cy - 40));
    for (const k of G.pickups) if (k.k === 'chest' || k.k === 'mimic') lc.drawImage(small, Math.round(k.x - cx - 40), Math.round(k.y - 8 - cy - 40));
  }
  vctx.drawImage(LIGHT.canvas, 0, 0);
}

// ------------------------------------------------------------- HUD
let invSig = '';
function buildInv() {
  const box = $('inv'), sig = G.weapons.map(w => w.id + w.lvl + w.evo).join() + JSON.stringify(G.passives);
  if (sig === invSig) return; invSig = sig;
  box.innerHTML = '';
  const add = (icon, lv, evo, target) => { const s = document.createElement('div'); s.className = 'slot' + (evo ? ' evo' : ''); s.appendChild(iconCanvas(icon, U * 8)); const b = document.createElement('b'); b.textContent = evo ? '★' : lv; s.appendChild(b); (target || box).appendChild(s); };
  G.weapons.forEach(w => add(w.evo ? WP[w.id].evoIcon : WP[w.id].icon, w.lvl, w.evo));
  Object.keys(G.passives).forEach(k => add(PS[k].icon, G.passives[k], false));
  const pi = $('pauseInv'); pi.innerHTML = '';
  G.weapons.forEach(w => { const s = document.createElement('div'); s.className = 'slot'; s.appendChild(iconCanvas(w.evo ? WP[w.id].evoIcon : WP[w.id].icon, U * 12)); const b = document.createElement('b'); b.textContent = w.evo ? '★' : w.lvl; s.appendChild(b); pi.appendChild(s); });
  Object.keys(G.passives).forEach(k => { const s = document.createElement('div'); s.className = 'slot'; s.appendChild(iconCanvas(PS[k].icon, U * 12)); const b = document.createElement('b'); b.textContent = G.passives[k]; s.appendChild(b); pi.appendChild(s); });
}
let hudLast = {};
function hud() {
  const set = (id, v) => { if (hudLast[id] !== v) { hudLast[id] = v; $(id).textContent = v; } };
  set('timer', fmt(G.t)); set('kills', G.kills); set('gold', Math.floor(G.gold)); set('lvl', 'LV ' + G.lvl);
  $('xpfill').style.width = (G.xp / xpNeed(G.lvl) * 100).toFixed(1) + '%';
  const bb = $('bossbar');
  const alive = G.bossList.filter(b => b.hp > 0);
  if (alive.length) {
    bb.classList.add('show');
    set('bossName', alive.length > 1 ? alive.map(b => nm(EN[b.type])).join(' · ') : nm(EN[alive[0].type]));
    const hp = alive.reduce((a, b) => a + b.hp, 0), mx = alive.reduce((a, b) => a + b.maxhp, 0);
    $('bossFill').style.width = (hp / mx * 100).toFixed(1) + '%';
  }
  else bb.classList.remove('show');
}
let bannerT = 0;
function banner(t) { const b = $('banner'); b.textContent = t; b.classList.toggle('long', t.length > 22); b.classList.add('show'); clearTimeout(bannerT); bannerT = setTimeout(() => b.classList.remove('show'), t.length > 22 ? 4200 : 2600); }

// ------------------------------------------------------------- run end
function die() {
  if (G.over) return; G.over = true;
  sfx('dead', 1, 0); playMusic(null);
  const p = G.p, f = AT[`${HEROES[G.hero].spr}_hit_anim_f0`] ? `${HEROES[G.hero].spr}_hit_anim_f0` : frames(HEROES[G.hero].spr, 'idle')[0];
  for (const pt of samples(f)) G.parts.push({ x: p.x + pt[0], y: p.y + pt[1], vx: rnd(-50, 50), vy: rnd(-90, -20), g: 200, c: pt[2], t: 0, life: rnd(0.6, 1.2), sz: 1 });
  state.mode = 'dying'; G.dieT = 1.4;
}
function win() {
  G.won = true; G.over = true; banner(L().cleared); playMusic('ending');
  for (const e of G.enemies) if (e.hp > 0 && !e.static) { e.hp = 0; e.elite = false; e.boss = false; e.type === 'mimic' && (e.type = 'imp'); kill(e); }
  for (const k of G.pickups) if (k.k === 'coin') { G.gold += k.v * ST.greed * STG().gold; k.pull = true; }
  sfx('coins', 1, 0);
  state.mode = 'dying'; G.dieT = 3.2;
}
function finalBossName(st) { const f = STAGES[st].bosses.find(b => b.final); return [].concat(f.type).map(t => nm(EN[t])).filter((v, i, a) => a.indexOf(v) === i).join(' · '); }
function finishRun() {
  const earned = Math.floor(G.gold);
  SV.coins += earned; SV.runs++;
  const rec = [];
  if (G.t > SV.best.time) { SV.best.time = G.t; rec.push(L().survived); }
  if (G.kills > SV.best.kills) { SV.best.kills = G.kills; rec.push(L().killed); }
  if (G.lvl > SV.best.level) SV.best.level = G.lvl;
  if (G.won) SV.wins++;
  SV.maps = SV.maps || {};
  const nextId = Object.keys(STAGES).find(k => STAGES[k].need === G.stage);
  const wasOpen = nextId ? stageOpen(nextId) : true;
  const mr = mapRec(G.stage);
  SV.maps[G.stage] = { best: Math.max(mr.best, G.t), cleared: mr.cleared || G.won };
  persist();
  $('endTitle').textContent = G.won ? L().win : L().dead; $('endTitle').className = G.won ? 'gold' : '';
  $('eTime').textContent = fmt(G.t); $('eLvl').textContent = G.lvl; $('eKills').textContent = G.kills; $('eGold').textContent = '+' + earned;
  gpStop(); if (G.won) ADS.call(S => S.game.happytime());
  const bd = $('bDouble');
  bd.style.display = earned > 0 && !STANDALONE ? '' : 'none'; bd.disabled = false; bd.textContent = L().adDouble(earned);
  bd.onclick = () => {
    if (bd.disabled) return; bd.disabled = true;
    ADS.show('rewarded', () => { SV.coins += earned; persist(); $('eGold').textContent = '+' + earned * 2; bd.style.display = 'none'; sfx('coins', 1, 0); refreshTitle(); }, () => { bd.textContent = L().adFail; });
  };
  $('eRec').textContent = rec.length ? `${L().newRecord} — ${rec.join(', ')}` : '';
  const hintEl = $('eHint');
  if (nextId && !wasOpen && stageOpen(nextId)) { hintEl.textContent = L().unlocked(nm(STAGES[nextId])[0]); hintEl.className = 'hint new'; sfx('fanfare', 1, 0); }
  else hintEl.textContent = '';
  const tb = $('eWeapons'); tb.innerHTML = '';
  const mx = Math.max(1, ...G.weapons.map(w => w.dmg));
  G.weapons.slice().sort((a, b) => b.dmg - a.dmg).forEach(w => {
    const r = document.createElement('div'); r.className = 'dmgRow';
    const ic = document.createElement('span'); ic.className = 'ico'; ic.appendChild(iconCanvas(w.evo ? WP[w.id].evoIcon : WP[w.id].icon, U * 10));
    const n = document.createElement('span'); n.textContent = w.evo ? nm(WP[w.id])[3] : nm(WP[w.id])[0];
    const bar = document.createElement('div'); bar.className = 'bar'; bar.innerHTML = `<i style="width:${(w.dmg / mx * 100).toFixed(1)}%"></i>`;
    const v = document.createElement('span'); v.className = 'n'; v.textContent = Math.round(w.dmg).toLocaleString();
    r.append(ic, n, bar, v); tb.appendChild(r);
  });
  state.mode = 'end'; $('hud').classList.remove('show'); showScreen('sEnd');
  if (!G.won) playMusic('title');
}

// ------------------------------------------------------------- screens
let curScreen = 'sLoad', screenStack = [];
function showScreen(id) { document.querySelectorAll('.screen').forEach(s => s.classList.toggle('show', s.id === id)); curScreen = id; if (id) fillIcons($(id)); }
function go(id) { screenStack.push(curScreen); showScreen(id); sfx('select', 0.5, 0); }
function back() { sfx('move', 0.5, 0); const id = screenStack.pop() || 'sTitle'; showScreen(id); if (id === 'sTitle') refreshTitle(); }
document.querySelectorAll('[data-back]').forEach(b => b.onclick = back);
document.addEventListener('mouseover', e => { if (e.target.closest && e.target.closest('.btn,.hero,.item .btn')) sfx('move', 0.25, 0, 0.08); });
function applyLang() {
  document.documentElement.lang = SV.settings.lang;
  document.querySelectorAll('[data-t]').forEach(el => { const v = L()[el.dataset.t]; if (typeof v === 'string') el.textContent = v; });
  refreshTitle();
}
function refreshTitle() {
  $('bankTitle').textContent = SV.coins ? `${SV.coins} ◆` : '';
  $('bankTitle').textContent = SV.coins ? (SV.settings.lang === 'ko' ? `코인 ${SV.coins}` : `${SV.coins} coins`) : '';
  $('recTitle').textContent = SV.best.time ? L().best(fmt(SV.best.time)) : '';
  document.querySelectorAll('.bank').forEach(b => b.textContent = SV.coins);
}
function toTitle() {
  state.mode = 'title'; state.paused = false; $('hud').classList.remove('show'); screenStack = [];
  showScreen('sTitle'); refreshTitle(); playMusic('title'); genWorld(); initAttract();
}
$('bStart').onclick = () => { audioUnlock(); buildHeroes(); go('sHero'); };
$('bArmory').onclick = () => { audioUnlock(); buildShop(); go('sArmory'); };
$('bSettings').onclick = () => { audioUnlock(); syncSettings(); go('sSettings'); };
$('bCredits').onclick = () => { audioUnlock(); go('sCredits'); };

// hero select
let heroAnims = [];
function buildHeroes() {
  const box = $('heroes'); box.innerHTML = ''; heroAnims = [];
  Object.keys(HEROES).forEach(id => {
    const h = HEROES[id], owned = SV.heroes[id];
    const b = document.createElement('button'); b.className = 'hero' + (SV.hero === id ? ' sel' : '') + (owned ? '' : ' locked');
    const fr = frames(h.spr, 'run'), f0 = AT[fr[0]], k = Math.max(2, Math.round(U * 18 / f0[3]));
    const c = document.createElement('canvas'); c.width = f0[2]; c.height = f0[3]; c.style.width = f0[2] * k + 'px'; c.style.height = f0[3] * k + 'px';
    heroAnims.push({ c, fr });
    b.appendChild(c);
    const n = document.createElement('div'); n.className = 'nm'; n.textContent = nm(h)[0]; b.appendChild(n);
    if (!owned) { const p = document.createElement('div'); p.className = 'price'; p.appendChild(iconCanvas('coin_anim_f0', U * 5)); p.append(String(h.cost)); b.appendChild(p); }
    b.onclick = () => {
      if (!SV.heroes[id]) {
        if (SV.coins >= h.cost) { SV.coins -= h.cost; SV.heroes[id] = true; SV.hero = id; persist(); sfx('fanfare', 0.8, 0); buildHeroes(); refreshTitle(); }
        else { sfx('deny', 0.6, 0); heroInfo(id); }
        return;
      }
      SV.hero = id; persist(); sfx('select', 0.5, 0); buildHeroes();
    };
    b.onmouseenter = () => heroInfo(id);
    box.appendChild(b);
  });
  heroInfo(SV.hero);
  refreshTitle();
}
function heroInfo(id) {
  const h = HEROES[id], el = $('heroInfo'); el.innerHTML = '';
  const ic = document.createElement('div'); ic.appendChild(iconCanvas(WP[h.weapon].icon, U * 14)); el.appendChild(ic);
  const t = document.createElement('div'); t.innerHTML = '<div class="t"></div><div class="d"></div><div class="d"></div>';
  t.children[0].textContent = nm(h)[0]; t.children[1].textContent = nm(h)[1]; t.children[2].textContent = `${L().start_w}: ${nm(WP[h.weapon])[0]}`;
  if (!SV.heroes[id]) { const lk = document.createElement('div'); lk.className = 'lock'; lk.textContent = L().unlockCost(h.cost, SV.coins); t.appendChild(lk); }
  el.appendChild(t);
}
$('bGo').onclick = () => { if (!SV.heroes[SV.hero]) SV.hero = 'knight'; buildStages(); go('sStage'); };
function buildStages() {
  const box = $('stages'); box.innerHTML = '';
  if (!stageOpen(SV.stage)) SV.stage = 'keep';
  Object.keys(STAGES).forEach(id => {
    const st = STAGES[id], open = stageOpen(id), rec = mapRec(id);
    const b = document.createElement('button'); b.className = 'stage' + (SV.stage === id ? ' sel' : '') + (open ? '' : ' locked');
    const ic = document.createElement('div'); ic.className = 'sic'; ic.appendChild(iconCanvas(st.icon, U * 26)); b.appendChild(ic);
    const tx = document.createElement('div'); tx.className = 'stx';
    const t = document.createElement('div'); t.className = 't'; t.textContent = nm(st)[0];
    const d = document.createElement('div'); d.className = 'd'; d.textContent = open ? nm(st)[1] : L().lockedBy(nm(STAGES[st.need])[0]);
    const m = document.createElement('div'); m.className = 'm'; m.textContent = L().stageMods(st.hp, st.gold);
    const r = document.createElement('div'); r.className = 'r'; r.textContent = rec.best ? `${L().bestOn(fmt(rec.best))}${rec.cleared ? ' · ' + L().clearedMark : ''}` : L().noRecord;
    tx.append(t, d, m, r); b.appendChild(tx);
    b.onclick = () => { if (!open) { sfx('deny', 0.6, 0); return; } SV.stage = id; persist(); sfx('select', 0.5, 0); buildStages(); };
    box.appendChild(b);
  });
}
$('bGo2').onclick = () => { if (!stageOpen(SV.stage)) SV.stage = 'keep'; startRun(); };

// armory
function buildShop() {
  const box = $('shop'); box.innerHTML = '';
  Object.keys(SHOP).forEach(k => {
    const it = SHOP[k], lv = shopLv(k), maxed = lv >= it.max, cost = shopCost(k);
    const d = document.createElement('div'); d.className = 'item' + (maxed ? ' max' : '');
    const ic = document.createElement('span'); ic.className = 'ico'; ic.appendChild(iconCanvas(it.icon, U * 10));
    const t = document.createElement('div'); t.className = 't'; t.textContent = nm(it)[0];
    const pips = document.createElement('div'); pips.className = 'pips'; for (let i = 0; i < it.max; i++) { const p = document.createElement('i'); if (i < lv) p.className = 'on'; pips.appendChild(p); }
    const ds = document.createElement('div'); ds.className = 'd'; ds.textContent = nm(it)[1];
    const b = document.createElement('button'); b.className = 'btn small';
    if (maxed) b.textContent = L().max; else { b.appendChild(iconCanvas('coin_anim_f0', U * 5)); b.append(String(cost)); if (SV.coins < cost) b.disabled = true; }
    b.onclick = () => { if (maxed || SV.coins < cost) return; SV.coins -= cost; SV.shop[k] = lv + 1; persist(); sfx('pick', 0.8, 0); buildShop(); refreshTitle(); };
    d.append(ic, t, pips, ds, b); box.appendChild(d);
  });
  refreshTitle();
}
$('bRefund').onclick = () => {
  let back = 0;
  for (const k in SV.shop) { const lv = SV.shop[k]; for (let i = 0; i < lv; i++) back += Math.round(SHOP[k].base * (1 + i * 0.9) / 5) * 5; }
  SV.coins += back; SV.shop = {}; persist(); sfx('coins', 0.8, 0); buildShop();
};

// settings
function syncSettings() {
  $('oMusic').value = SV.settings.music; $('oSfx').value = SV.settings.sfx;
  const seg = (id, v) => document.querySelectorAll(`#${id} button`).forEach(b => b.classList.toggle('on', String(b.dataset.v) === String(v)));
  seg('oLang', SV.settings.lang); seg('oShake', SV.settings.shake); seg('oNums', SV.settings.nums);
}
$('oMusic').oninput = e => { SV.settings.music = +e.target.value; setVolumes(); persist(); };
$('oSfx').oninput = e => { SV.settings.sfx = +e.target.value; setVolumes(); persist(); };
$('oSfx').onchange = () => sfx('coin', 0.8, 0);
document.querySelectorAll('#oLang button').forEach(b => b.onclick = () => { SV.settings.lang = b.dataset.v; persist(); syncSettings(); applyLang(); sfx('select', 0.5, 0); });
document.querySelectorAll('#oShake button').forEach(b => b.onclick = () => { SV.settings.shake = +b.dataset.v; persist(); syncSettings(); sfx('select', 0.5, 0); });
document.querySelectorAll('#oNums button').forEach(b => b.onclick = () => { SV.settings.nums = +b.dataset.v; persist(); syncSettings(); sfx('select', 0.5, 0); });

// pause
function pauseGame() { if (state.mode !== 'play') return; state.paused = true; gpStop(); buildInv(); showScreen('sPause'); screenStack = []; sfx('pausein', 0.7, 0); if (AU.music) AU.music.volume *= 0.35; }
function resume() { state.paused = false; gpStart(); showScreen(null); sfx('pauseout', 0.7, 0); setVolumes(); }
$('pauseBtn').onclick = () => pauseGame();
$('bResume').onclick = resume;
$('bPSettings').onclick = () => { syncSettings(); screenStack = ['sPause']; showScreen('sSettings'); };
$('bGiveUp').onclick = () => { state.paused = false; showScreen(null); setVolumes(); die(); };
$('bAgain').onclick = () => ADS.show('midgame', startRun, startRun);
$('bEndTitle').onclick = () => ADS.show('midgame', toTitle, toTitle);
$('bEndArmory').onclick = () => { toTitle(); buildShop(); go('sArmory'); };

function startRun() {
  audioUnlock(); sfx('portal', 0.8, 0);
  newRun(SV.hero); refreshStats();
  state.mode = 'play'; state.paused = false; screenStack = [];
  showScreen(null); $('hud').classList.add('show'); fillIcons($('hud')); invSig = ''; buildInv(); hudLast = {}; hud();
  playMusic('level1');
  banner(nm(STAGES[G.stage])[0]);
  gpStart();
  if (SV.runs < 3) {
    const ch = $('ctrlHint'); ch.textContent = matchMedia('(pointer: coarse)').matches ? L().ctrlTouch : L().ctrlKeys; ch.classList.add('show');
    clearTimeout(ch._t); ch._t = setTimeout(() => ch.classList.remove('show'), 7000);
  }
}

// ------------------------------------------------------------- title attract scene
const ATTRACT = { mobs: [], hero: { x: 0, y: 0 }, cam: { x: 0, y: 0 } };
function initAttract() {
  ATTRACT.hero = { x: AW / 2, y: 70 };
  ATTRACT.cam = { x: AW / 2 - VW / 2, y: -40 };
  ATTRACT.mobs = [];
  const types = ['goblin', 'imp', 'skelet', 'tiny_zombie', 'masked_orc', 'chort', 'wogol', 'muddy', 'orc_warrior', 'pumpkin_dude'];
  for (let i = 0; i < 16; i++) {
    const t = pick(types), fr = frames(t, 'run');
    ATTRACT.mobs.push({ type: t, run: fr, idle: frames(t, 'idle'), x: rnd(AW / 2 - 260, AW / 2 + 260), y: rnd(60, 260), vx: rnd(-14, 14), vy: rnd(-6, 6), anim: rnd(0, 4), face: 1, sc: 1, h: AT[fr[0]][3], flash: 0, hp: 1, maxhp: 1 });
  }
}
function updateAttract(dt) {
  const t = performance.now() / 1000;
  ATTRACT.cam.x = AW / 2 - VW / 2 + Math.sin(t * 0.12) * 60; ATTRACT.cam.y = -30 + Math.sin(t * 0.09) * 20;
  ATTRACT.hero.x = AW / 2; ATTRACT.hero.y = ATTRACT.cam.y + VH * 0.62;
  for (const m of ATTRACT.mobs) {
    m.anim += dt * 7; m.x += m.vx * dt; m.y += m.vy * dt;
    if (Math.random() < dt * 0.3) { m.vx = rnd(-16, 16); m.vy = rnd(-8, 8); }
    if (Math.abs(m.x - ATTRACT.hero.x) < 50 && Math.abs(m.y - ATTRACT.hero.y) < 40) { m.vx += Math.sign(m.x - ATTRACT.hero.x) * 10 * dt * 10; }
    m.x = clamp(m.x, ATTRACT.cam.x - 40, ATTRACT.cam.x + VW + 40); m.y = clamp(m.y, 20, AH - 20);
    m.face = m.vx >= 0 ? 1 : -1;
  }
}

// ------------------------------------------------------------- main loop
let last = performance.now();
function frame(now) {
  const dt = Math.min(1 / 30, (now - last) / 1000); last = now;
  if (state.mode === 'title' || ['sHero', 'sArmory', 'sSettings', 'sCredits'].includes(curScreen) && state.mode !== 'play') {
    if (V && sheet.complete) { updateAttract(dt); render(ATTRACT.cam); }
    heroAnims.forEach(h => { const x = h.c.getContext('2d'); x.clearRect(0, 0, h.c.width, h.c.height); const f = AT[h.fr[((now / 110) | 0) % h.fr.length]]; x.drawImage(sheet, f[0], f[1], f[2], f[3], 0, 0, f[2], f[3]); });
  } else if (G && (state.mode === 'play' || state.mode === 'level' || state.mode === 'chest' || state.mode === 'dying' || state.mode === 'end' || state.mode === 'offer')) {
    if (state.mode === 'play' && !state.paused) update(dt);
    else if (state.mode === 'dying') {
      G.dieT -= dt;
      const p = G.p; for (let i = G.parts.length - 1; i >= 0; i--) { const q = G.parts[i]; q.t += dt; q.vy += (q.g || 0) * dt; q.x += q.vx * dt; q.y += q.vy * dt; if (q.t > q.life) G.parts.splice(i, 1); }
      for (let i = G.nums.length - 1; i >= 0; i--) { G.nums[i].t += dt; if (G.nums[i].t > 0.7) G.nums.splice(i, 1); }
      if (G.won) { G.t += 0; for (const e of G.enemies) e.anim += dt * 4; G.enemies = G.enemies.filter(e => e.hp > 0); } else { void p; }
      if (G.dieT <= 0) finishRun();
    }
    if (state.mode === 'chest') updateChestUI(dt);
    if (!(state.mode === 'dying' && !G.won && G.dieT < 1.2 && false)) renderGame();
  }
  requestAnimationFrame(frame);
}
function renderGame() {
  if (G.over && !G.won) { // hero has burst: hide body
    const keep = G.p.inv; G.p.inv = 0.05; render(); G.p.inv = keep; return;
  }
  render();
}


// ------------------------------------------------------------- boot
function boot() {
  resize();
  ADS.init().then(() => { ADS.call(S => S.game.loadingStart()); loadCloudSave(); step(); });
  const fill = $('loadFill');
  let done = 0; const need = 3;
  const step = () => { done++; fill.style.width = (done / need * 100) + '%'; if (done >= need) setTimeout(() => { applyLang(); toTitle(); ADS.call(S => S.game.loadingStop()); }, 150); };
  sheet.onload = () => { buildSheets(); step(); };
  sheet.src = 'assets/tiles.png';
  Promise.all(['Galmuri11', 'Galmuri7', 'Galmuri9'].map(f => document.fonts.load(`12px ${f}`))).then(step, step);
  requestAnimationFrame(frame);
}
boot();
})();

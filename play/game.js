(() => {
'use strict';
// =====================================================================
//  SLAYGROUND
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
const I18 = window.I18N;
const detectLang = () => { try { for (const l of (navigator.languages || [navigator.language || 'en'])) { const k = String(l).toLowerCase().slice(0, 2); if (I18[k]) return k; } } catch (e) {} return 'en'; };
const defSave = () => ({ coins: 0, shop: {}, heroes: { knight: true }, hero: 'knight', best: { time: 0, kills: 0, level: 0 }, wins: 0, runs: 0, maps: {}, stage: 'keep', tor: {}, q: {},
  stats: { kills: 0, chests: 0, bosses: 0, evos: 0, shrines: 0, torMax: 0 },
  settings: { music: 55, sfx: 80, lang: detectLang(), shake: 1, nums: 1 } });
const parseSave = raw => {
  let o; try { o = Object.assign(defSave(), JSON.parse(raw || '{}')); } catch (e) { o = defSave(); }
  o.settings = Object.assign(defSave().settings, o.settings || {}); o.stats = Object.assign(defSave().stats, o.stats || {});
  if (!I18[o.settings.lang]) o.settings.lang = 'en';
  if (!o.tor) o.tor = {}; if (!o.q) o.q = {};
  return o;
};
const cloudData = () => { try { return ADS.ready && ADS.kind === 'cg' && ADS.sdk.data ? ADS.sdk.data : null; } catch (e) { return null; } };
let SV;
try { SV = parseSave(localStorage.getItem(SAVE_KEY)); } catch (e) { SV = defSave(); }
const persist = () => {
  const str = JSON.stringify(SV);
  const d = cloudData();
  if (d) { try { d.setItem(SAVE_KEY, str); return; } catch (e) {} }
  try { localStorage.setItem(SAVE_KEY, str); } catch (e) {}
  try { if (ADS.ready && ADS.kind === 'pg') { const pr = ADS.sdk.storage.set([SAVE_KEY], [str]); if (pr && pr.catch) pr.catch(() => {}); } } catch (e) {}
  if (typeof ACC !== 'undefined') ACC.push();
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
const str = k => { const a = I18[SV.settings.lang] || I18.en; return a[k] != null ? a[k] : (I18.en[k] != null ? I18.en[k] : ''); };
const fill = (s, a) => String(s).replace(/\{(\d)\}/g, (_, i) => a[i]);
const T = (k, ...a) => fill(str(k), a);
const LP = new Proxy({}, { get: (_, k) => { const s = str(k); return typeof s === 'string' && /\{\d\}/.test(s) ? (...a) => fill(s, a) : s; } });
const L = () => LP;
const nm = o => o._nm();
const num = v => String(Math.round(v * 100) / 100);
const statText = d => d.map(([k, v]) => T('st.' + k, v == null ? '' : num(v))).join(str('sep')) + str('dot');

// ------------------------------------------------------------- data
const HEROES = {
  knight: { name: 'Aldric', spr: 'knight_m', weapon: 'oath', cost: 0, mod: { hp: 1.1 }, desc: [['hp', 10]] },
  elf: { name: 'Sefa', spr: 'elf_f', weapon: 'moonbow', cost: 800, mod: { spd: 1.1 }, desc: [['spd', 10]] },
  dwarf: { name: 'Brom', spr: 'dwarf_m', weapon: 'quake', cost: 1800, mod: { armor: 1 }, desc: [['armor', 1]] },
  wizard: { name: 'Orrin', spr: 'wizzard_m', weapon: 'comet', cost: 3200, mod: { area: 1.1 }, desc: [['area', 10]] },
  lizard: { name: 'Kesh', spr: 'lizard_m', weapon: 'fang', cost: 5000, mod: { might: 1.1 }, desc: [['dmg', 10]] },
  maren: { name: 'Maren', spr: 'bandit', weapon: 'twin', cost: 7200, mod: { cd: 0.92 }, desc: [['cd', 8]] },
  hild: { name: 'Hild', spr: 'eknight', weapon: 'skyforge', cost: 9800, mod: { regen: 0.3 }, desc: [['regen', 0.3]] },
  faelan: { name: 'Faelan', spr: 'ranger', weapon: 'gale', cost: 12800, mod: { dash: 0.7 }, desc: [['dash', 30]] },
  ysolde: { name: 'Ysolde', spr: 'elfpr', weapon: 'frost', cost: 16000, mod: { growth: 1.15 }, desc: [['xp', 15]] },
  sska: { name: 'Aurel', spr: 'fguard', weapon: 'shade', cost: 20000, mod: { crit: 0.1 }, desc: [['crit', 10]] }
};

const WP = {
  sword: { icon: 'weapon_knight_sword', evoIcon: 'weapon_lavish_sword', pair: 'might',
    lv: [{ dmg: 14, cd: 1.05, area: 1, n: 1 }, { dmg: 18 }, { n: 2 }, { dmg: 24, area: 1.15 }, { dmg: 30, cd: 0.8 }], evo: { dmg: 42, cd: 0.75, area: 1.4, n: 1 } },
  knives: { icon: 'weapon_knife', evoIcon: 'weapon_red_gem_sword', pair: 'haste',
    lv: [{ dmg: 7, cd: 0.6, n: 1, pierce: 1 }, { n: 2 }, { dmg: 10 }, { n: 3, pierce: 2 }, { cd: 0.42 }], evo: { dmg: 15, cd: 0.4, n: 8, pierce: 3 } },
  axe: { icon: 'weapon_throwing_axe', evoIcon: 'weapon_waraxe', pair: 'reach',
    lv: [{ dmg: 18, cd: 1.6, n: 1, area: 1 }, { n: 2 }, { dmg: 26 }, { area: 1.2 }, { n: 3, dmg: 32 }], evo: { dmg: 48, cd: 1.1, n: 5, area: 1.5 } },
  hammers: { icon: 'weapon_hammer', evoIcon: 'weapon_big_hammer', pair: 'vitality',
    lv: [{ dmg: 9, n: 1, area: 1, spd: 3.2 }, { n: 2 }, { dmg: 13, area: 1.15 }, { n: 3 }, { n: 4, spd: 4.2 }], evo: { dmg: 24, n: 4, area: 1.45, spd: 4.6 } },
  bow: { icon: 'weapon_bow', evoIcon: 'k_bow_03', pair: 'swift',
    lv: [{ dmg: 11, cd: 1.0, n: 1, pierce: 2 }, { n: 2 }, { dmg: 16, pierce: 3 }, { cd: 0.8 }, { n: 3, dmg: 21 }], evo: { dmg: 26, cd: 0.38, n: 5, pierce: 7 } },
  bombs: { icon: 'bomb_f0', evoIcon: 'bomb_f2', pair: 'greed',
    lv: [{ dmg: 26, cd: 2.3, n: 1, area: 1 }, { n: 2 }, { dmg: 36, area: 1.15 }, { n: 3 }, { dmg: 46, cd: 1.8 }], evo: { dmg: 62, cd: 1.5, n: 4, area: 1.35 } },
  spear: { icon: 'weapon_spear', evoIcon: 'weapon_saw_sword', pair: 'charm',
    lv: [{ dmg: 16, cd: 1.15, area: 1, dirs: 1 }, { dmg: 22 }, { dirs: 2 }, { dmg: 28, area: 1.2 }, { dirs: 4 }], evo: { dmg: 46, cd: 0.8, area: 1.4, dirs: 8 } },
  staff: { icon: 'weapon_green_magic_staff', evoIcon: 'weapon_red_magic_staff', pair: 'tome',
    lv: [{ dmg: 10, cd: 1.4, n: 1 }, { n: 2 }, { dmg: 14 }, { n: 3 }, { dmg: 18, cd: 1.1 }], evo: { dmg: 24, cd: 0.9, n: 4 } },
  katana: { icon: 'weapon_katana', evoIcon: 'weapon_anime_sword', pair: 'keen',
    lv: [{ dmg: 22, cd: 1.9, area: 1 }, { dmg: 30 }, { cd: 1.6 }, { dmg: 40, area: 1.2 }, { dmg: 48, cd: 1.3 }], evo: { dmg: 60, cd: 1.1, area: 1.4 } },
  cleaver: { icon: 'weapon_cleaver', evoIcon: 'weapon_double_axe', pair: 'pulse',
    lv: [{ dmg: 15, cd: 1.7, n: 1, area: 1 }, { dmg: 20 }, { n: 2 }, { dmg: 25, area: 1.25 }, { n: 3, cd: 1.4 }], evo: { dmg: 36, cd: 1.2, n: 3, area: 1.6 } },
  oath: { icon: 'weapon_golden_sword', evoIcon: 'weapon_golden_sword', sig: 'knight',
    lv: [{ dmg: 15, cd: 1.15, area: 1, n: 1 }, { dmg: 20 }, { n: 2 }, { dmg: 26, area: 1.15 }, { dmg: 33, cd: 0.9 }], evo: { dmg: 44, cd: 0.8, area: 1.35, n: 6 } },
  moonbow: { icon: 'weapon_bow_2', evoIcon: 'weapon_bow_2', sig: 'elf',
    lv: [{ dmg: 10, cd: 0.95, n: 1, split: 2 }, { n: 2 }, { dmg: 14 }, { split: 3 }, { n: 3, cd: 0.78 }], evo: { dmg: 17, cd: 0.7, n: 3, split: 4 } },
  quake: { icon: 'k_stoneblock_01', evoIcon: 'k_stoneblock_01', sig: 'dwarf',
    lv: [{ dmg: 20, cd: 1.9, len: 5, n: 1, area: 1 }, { dmg: 26 }, { len: 7 }, { dmg: 33, area: 1.2 }, { n: 2 }], evo: { dmg: 42, cd: 1.5, len: 8, n: 4, area: 1.25 } },
  comet: { icon: 'k_shard_01', evoIcon: 'k_shard_01', sig: 'wizard',
    lv: [{ dmg: 32, cd: 2.6, n: 1, area: 1 }, { dmg: 42 }, { n: 2 }, { dmg: 52, area: 1.2 }, { n: 3, cd: 2.1 }], evo: { dmg: 60, cd: 1.9, n: 3, area: 1.3 } },
  fang: { icon: 'weapon_machete', evoIcon: 'weapon_machete', sig: 'lizard',
    lv: [{ dmg: 26, cd: 0.7, area: 1, poison: 8, dirs: 1 }, { dmg: 34 }, { poison: 13 }, { dirs: 2 }, { dmg: 44, cd: 0.55 }], evo: { dmg: 50, cd: 0.5, poison: 18, dirs: 3 } },
  twin: { icon: 'weapon_duel_sword', evoIcon: 'weapon_duel_sword', sig: 'maren',
    lv: [{ dmg: 9, cd: 0.75, n: 2, bounce: 1 }, { dmg: 12 }, { bounce: 2 }, { n: 3 }, { dmg: 16, cd: 0.6 }], evo: { dmg: 19, cd: 0.55, n: 4, bounce: 5 } },
  skyforge: { icon: 'k_ingot_01', evoIcon: 'k_ingot_01', sig: 'hild',
    lv: [{ dmg: 24, cd: 1.7, n: 1, area: 1 }, { dmg: 30 }, { n: 2 }, { area: 1.25 }, { n: 3, dmg: 38 }], evo: { dmg: 46, cd: 1.4, n: 4, area: 1.35 } },
  gale: { icon: 'k_cotton_01', evoIcon: 'k_cotton_01', sig: 'faelan',
    lv: [{ dmg: 6, cd: 3.2, n: 1, area: 1, life: 2.6 }, { dmg: 8 }, { life: 3.6 }, { n: 2 }, { dmg: 11, area: 1.3 }], evo: { dmg: 13, cd: 2.6, n: 3, area: 1.4, life: 4.5 } },
  frost: { icon: 'k_gem_01', evoIcon: 'k_gem_01', sig: 'ysolde',
    lv: [{ dmg: 14, cd: 0.95, area: 1, slow: 0.3 }, { dmg: 19 }, { area: 1.2 }, { dmg: 25, slow: 0.45 }, { dmg: 32, area: 1.4 }], evo: { dmg: 40, cd: 0.8, area: 1.55, slow: 0.55 } },
  shade: { icon: 'k_necklace_01', evoIcon: 'k_necklace_01', sig: 'sska',
    lv: [{ dmg: 22, cd: 1.0, n: 2 }, { dmg: 28 }, { n: 3 }, { dmg: 36 }, { n: 4, cd: 0.8 }], evo: { dmg: 44, cd: 0.7, n: 6 } },
  mace: { icon: 'weapon_mace', evoIcon: 'weapon_baton_with_spikes', pair: 'guard',
    lv: [{ dmg: 16, cd: 2.6, area: 1 }, { dmg: 22 }, { area: 1.2 }, { dmg: 28, cd: 2.1 }, { dmg: 34, area: 1.4 }], evo: { dmg: 46, cd: 1.7, area: 1.75 } }
};
const PS = {
  vitality: { icon: 'sh_tankard', max: 5, desc: [['hpf', 20], ['regen', 0.2]] },
  might: { icon: 'k_gloves_01', max: 5, desc: [['dmg', 10]] },
  haste: { icon: 'k_scroll_01', max: 5, desc: [['cd', 7]] },
  swift: { icon: 'k_boots_01', max: 5, desc: [['spd', 8]] },
  reach: { icon: 'k_hat_01', max: 5, desc: [['area', 10]] },
  greed: { icon: 'k_coin_03', max: 5, desc: [['magnet', 30], ['coin', 10]] },
  charm: { icon: 'k_arrow_02', max: 2, desc: [['proj', 1]] },
  tome: { icon: 'k_spellbook_01', max: 5, desc: [['xp', 8]] },
  keen: { icon: 'k_skull_01', max: 5, desc: [['crit', 6]] },
  pulse: { icon: 'k_fruit_01', max: 5, desc: [['regen', 0.4]] },
  guard: { icon: 'k_shield_01', max: 3, desc: [['armor', 1]] }
};
const SHOP = {
  might: { icon: 'k_sword_01', max: 5, base: 120, desc: [['dmg', 5]] },
  armor: { icon: 'k_helmet_01', max: 3, base: 160, desc: [['armor', 1]] },
  maxhp: { icon: 'ui_heart_full', max: 5, base: 100, desc: [['hp', 10]] },
  recovery: { icon: 'k_cup_02', max: 3, base: 140, desc: [['regen', 0.2]] },
  speed: { icon: 'k_leaf_01', max: 3, base: 120, desc: [['spd', 5]] },
  growth: { icon: 'k_book_03', max: 5, base: 130, desc: [['xp', 6]] },
  greed: { icon: 'bag_gold', max: 5, base: 110, desc: [['coin', 10], ['magnet', 20]] },
  crit: { icon: 'k_ring_01', max: 5, base: 140, desc: [['crit', 2]] },
  dash: { icon: 'floor_stairs', max: 3, base: 150, desc: [['dash', 10]] },
  reroll: { icon: 'lever_left', max: 3, base: 200, desc: [['reroll', 1]] },
  revival: { icon: 'angel_idle_anim_f0', max: 1, base: 900, desc: [['revive']] },
  insight: { icon: 'k_key_01', max: 1, base: 1200, desc: [['choice']] }
};
const shopCost = (k) => Math.round(SHOP[k].base * 1.6 * (1 + shopLv(k) * 1.25) * GS('SHOPMUL', 1) / 5) * 5;
const heroCost = h => Math.round(h.cost * GS('HEROMUL', 1) / 10) * 10;
const BLESS = {
  wrath: { icon: 'wall_banner_red', desc: [['dmg', 20]], f: b => { b.might += 0.2; } },
  wind: { icon: 'k_staff_03', desc: [['cd', 12]], f: b => { b.cd += 0.12; } },
  life: { icon: 'k_pearl_01', desc: [['hpf', 20]], extra: 'blLife', heal: 1, f: b => { b.hp += 20; } },
  gold: { icon: 'sh_chest', desc: [['coin', 40]], f: b => { b.greed += 0.4; } },
  pact: { icon: 'sh_ptri', desc: [['dmg', 35]], extra: 'blPact', f: b => { b.might += 0.35; b.hp -= 25; } }
};
const POT = { pfreeze: 'k_potion_01', phaste: 'sh_ptall', pmagnet: 'flask_big_pink' };

const EN = {
  tiny_zombie: { hp: 5, spd: 30, dmg: 3, xp: 1 }, goblin: { hp: 9, spd: 38, dmg: 4, xp: 1 }, imp: { hp: 7, spd: 50, dmg: 3, xp: 1 },
  skelet: { hp: 14, spd: 32, dmg: 5, xp: 1 }, tiny_slug: { hp: 11, spd: 22, dmg: 4, xp: 1 }, muddy: { hp: 28, spd: 22, dmg: 6, xp: 2 },
  swampy: { hp: 28, spd: 24, dmg: 6, xp: 2 }, zombie: { hp: 22, spd: 30, dmg: 5, xp: 2 }, ice_zombie: { hp: 30, spd: 30, dmg: 6, xp: 2 },
  masked_orc: { hp: 44, spd: 36, dmg: 8, xp: 3 }, orc_warrior: { hp: 52, spd: 34, dmg: 9, xp: 3 }, orc_shaman: { hp: 40, spd: 31, dmg: 8, xp: 3 },
  necromancer: { hp: 62, spd: 28, dmg: 9, xp: 4 }, wogol: { hp: 62, spd: 40, dmg: 9, xp: 4 }, chort: { hp: 84, spd: 44, dmg: 11, xp: 5 },
  crate: { hp: 16, spd: 0, dmg: 0, xp: 0 }, mimic: { hp: 220, spd: 54, dmg: 9, xp: 12, spr: 'chest_mimic_open' },
  pumpkin_dude: { hp: 95, spd: 34, dmg: 11, xp: 5 }, doc: { hp: 115, spd: 30, dmg: 12, xp: 6 }, slug: { hp: 160, spd: 20, dmg: 13, xp: 7 },
  ogre: { hp: 1500, spd: 30, dmg: 22, xp: 50, boss: 1 },
  big_zombie: { hp: 3200, spd: 32, dmg: 26, xp: 90, boss: 1, summon: 'tiny_zombie' },
  big_demon: { hp: 7500, spd: 36, dmg: 32, xp: 200, boss: 1, summon: 'imp' },
  warchief: { hp: 2400, spd: 36, dmg: 24, xp: 70, boss: 1, spr: 'govr', summon: 'gscout' },
  shaman: { hp: 3000, spd: 30, dmg: 22, xp: 90, boss: 1, spr: 'wizard', bsc: 1.4, summon: 'gbrute' },
  lich: { hp: 4200, spd: 30, dmg: 26, xp: 120, boss: 1, spr: 'ent', bsc: 1.2, summon: 'skelet' },
  pumpking: { hp: 3600, spd: 38, dmg: 28, xp: 100, boss: 1, spr: 'bear', summon: 'imp' },
  troll: { hp: 3000, spd: 32, dmg: 24, xp: 80, boss: 1, spr: 'troll', summon: 'mushs' },
  mushking: { hp: 3400, spd: 26, dmg: 22, xp: 90, boss: 1, spr: 'mushl', bsc: 1.3, summon: 'mushs' },
  golem: { hp: 4600, spd: 26, dmg: 30, xp: 120, boss: 1, spr: 'golem', summon: 'skelet' }
};
EN.tgoblin = { hp: 70, spd: 60, dmg: 0, xp: 0, spr: 'fairy', flee: 1 };
// new regulars from the Forest pack
EN.mushs = { hp: 10, spd: 26, dmg: 4, xp: 1, spr: 'mushs' }; EN.gscout = { hp: 30, spd: 42, dmg: 6, xp: 2, spr: 'gscout' };
EN.gbrute = { hp: 58, spd: 33, dmg: 10, xp: 3, spr: 'gbrute' }; EN.gshaman = { hp: 42, spd: 30, dmg: 8, xp: 3, spr: 'gshaman' };
EN.wolf = { hp: 34, spd: 56, dmg: 7, xp: 2, spr: 'wolf' };
EN.swampy.spr = 'mushn';
EN.orc_shaman.shoot = 1; EN.necromancer.shoot = 1; EN.gshaman.shoot = 1; EN.wolf.zig = 1; EN.wogol.leap = 1; EN.chort.leap = 1; EN.imp.zig = 1; EN.goblin.zig = 1;
EN.ogre.pats = ['dash', 'slam']; EN.big_zombie.pats = ['dash', 'slam', 'ring']; EN.big_demon.pats = ['ring', 'spiral', 'dash', 'slam'];
EN.warchief.pats = ['dash', 'spray', 'slam']; EN.shaman.pats = ['ring', 'spray', 'slam']; EN.lich.pats = ['spiral', 'ring', 'slam']; EN.pumpking.pats = ['dash', 'slam'];
EN.troll.pats = ['dash', 'spray', 'slam']; EN.mushking.pats = ['ring', 'slam']; EN.golem.pats = ['slam', 'dash'];
const RISE = new Set(['skelet', 'zombie', 'tiny_zombie', 'ice_zombie']);
const WAVES = [
  ['tiny_zombie', 'goblin'], ['goblin', 'imp', 'tiny_zombie'], ['skelet', 'imp', 'tiny_slug'], ['skelet', 'zombie', 'muddy'],
  ['zombie', 'swampy', 'muddy'], ['zombie', 'masked_orc', 'skelet', 'orc_shaman'], ['masked_orc', 'orc_warrior', 'imp', 'orc_shaman'], ['orc_warrior', 'orc_shaman', 'masked_orc', 'necromancer'],
  ['necromancer', 'wogol', 'zombie'], ['wogol', 'chort', 'orc_warrior'], ['chort', 'pumpkin_dude', 'doc'], ['doc', 'slug', 'pumpkin_dude', 'chort']
];
const BOSSES = [{ t: 195, type: 'ogre' }, { t: 390, type: 'big_zombie' }, { t: 540, type: 'big_demon', final: true }];
const SWARMS = [120, 315, 465];
const SEWER_WAVES = [
  ['tiny_slug', 'mushs'], ['tiny_slug', 'muddy', 'mushs'], ['muddy', 'swampy', 'tiny_slug'], ['swampy', 'zombie', 'slug'],
  ['zombie', 'mushs', 'muddy'], ['slug', 'swampy', 'mushs'], ['necromancer', 'swampy', 'slug'], ['necromancer', 'zombie', 'muddy'],
  ['slug', 'doc', 'mushs'], ['doc', 'slug', 'necromancer'], ['doc', 'slug', 'swampy'], ['slug', 'doc', 'necromancer', 'swampy']
];
const CAMP_WAVES = [
  ['gscout', 'wolf'], ['gscout', 'gbrute'], ['gbrute', 'gscout', 'wolf'], ['masked_orc', 'gbrute'],
  ['orc_warrior', 'gshaman', 'gscout'], ['orc_warrior', 'gbrute', 'wolf'], ['gshaman', 'orc_warrior', 'gbrute'], ['orc_warrior', 'wolf', 'masked_orc'],
  ['wolf', 'gshaman', 'gbrute'], ['orc_warrior', 'gshaman', 'wolf'], ['gbrute', 'orc_warrior', 'gshaman'], ['gbrute', 'wolf', 'orc_warrior', 'gshaman']
];
const CRYPT_WAVES = [
  ['tiny_zombie', 'skelet'], ['skelet', 'tiny_zombie', 'ice_zombie'], ['skelet', 'ice_zombie', 'necromancer'], ['ice_zombie', 'skelet', 'tiny_zombie'],
  ['ice_zombie', 'necromancer', 'skelet'], ['necromancer', 'skelet', 'ice_zombie'], ['necromancer', 'ice_zombie', 'chort'], ['necromancer', 'wogol', 'skelet'],
  ['ice_zombie', 'necromancer', 'chort'], ['doc', 'necromancer', 'ice_zombie'], ['doc', 'wogol', 'necromancer'], ['doc', 'necromancer', 'chort', 'ice_zombie']
];
const HELL_WAVES = [
  ['imp', 'chort'], ['imp', 'wogol', 'chort'], ['imp', 'chort', 'pumpkin_dude'], ['chort', 'wogol', 'imp'],
  ['chort', 'pumpkin_dude', 'doc'], ['wogol', 'chort', 'imp'], ['pumpkin_dude', 'chort', 'wogol'], ['doc', 'wogol', 'chort'],
  ['doc', 'chort', 'pumpkin_dude'], ['chort', 'pumpkin_dude', 'doc'], ['doc', 'wogol', 'chort'], ['chort', 'doc', 'pumpkin_dude', 'wogol']
];
const STAGES = {
  keep: { waves: WAVES, bosses: BOSSES, hp: 1, gold: 1, spikes: 5, cycle: 3.6, tint: null, fount: ['red', 'blue'], floor: 0.86, cols: 4, decal: ['skull'], wall: 'keep', icon: 'ogre_idle_anim_f0' },
  sewers: { waves: SEWER_WAVES, bosses: [{ t: 195, type: 'troll' }, { t: 390, type: 'mushking' }, { t: 540, type: ['troll', 'mushking'], final: true }], hp: 1.35, gold: 1.3, spikes: 8, cycle: 3.0, tint: '#b4dcbc', fount: ['blue'], floor: 0.7, cols: 0, decal: ['hole', 'skull', 'floor_ladder'], wall: 'sewers', need: 'keep', icon: 'big_zombie_idle_anim_f0' },
  camp: { waves: CAMP_WAVES, bosses: [{ t: 195, type: 'warchief' }, { t: 390, type: 'shaman' }, { t: 540, type: ['warchief', 'shaman'], final: true }], hp: 1.6, gold: 1.55, spikes: 6, cycle: 3.2, tint: '#ecdfb0', fount: ['red'], floor: 0.8, cols: 3, decal: ['skull', 'hole'], wall: 'camp', need: 'sewers', icon: 'orc_warrior_idle_anim_f0', charge: true },
  crypt: { waves: CRYPT_WAVES, bosses: [{ t: 195, type: 'golem' }, { t: 390, type: 'lich' }, { t: 540, type: ['lich', 'golem'], final: true }], hp: 1.9, gold: 1.85, spikes: 9, cycle: 2.8, tint: '#b6c6f4', fount: ['blue'], floor: 0.75, cols: 0, decal: ['skull', 'skull', 'skull'], wall: 'crypt', need: 'camp', icon: 'necromancer_anim_f0', rise: true, light: 0.78 },
  hell: { waves: HELL_WAVES, bosses: [{ t: 195, type: 'pumpking' }, { t: 390, type: 'big_demon' }, { t: 540, type: ['big_demon', 'pumpking'], final: true }], hp: 2.3, gold: 2.2, spikes: 13, cycle: 2.5, tint: '#ffbcaa', fount: ['red'], floor: 0.8, cols: 4, decal: ['skull', 'skull', 'hole'], wall: 'hell', need: 'crypt', icon: 'big_demon_idle_anim_f0' }
};
function upLines(id) {
  const lv = WP[id].lv, cur = Object.assign({}, lv[0]), out = [];
  for (let i = 1; i < lv.length; i++) {
    const d = lv[i], parts = [];
    for (const k in d) {
      if (k === 'dmg') parts.push(T('up.dmg', d.dmg - cur.dmg));
      else if (k === 'n') parts.push(T('up.n', d.n - cur.n));
      else if (k === 'cd' || k === 'spd') parts.push(T('up.cd'));
      else if (k === 'area') parts.push(T('up.area', Math.round((d.area - cur.area) * 100)));
      else if (k === 'pierce') parts.push(T('up.pierce', d.pierce - cur.pierce));
      else if (k === 'dirs') parts.push(T('up.dirs'));
      else if (k === 'split' || k === 'bounce' || k === 'len') parts.push(T('up.n', d[k] - cur[k]));
      else if (k === 'poison' || k === 'slow' || k === 'life') parts.push(T('up.fx'));
    }
    Object.assign(cur, d); out.push(parts.join(str('sep')));
  }
  return out;
}
const hn = id => str('hn.' + id) || HEROES[id].name;
for (const id in WP) WP[id]._nm = () => { const a = str('w.' + id); return [a[0], a[1], upLines(id), a[2], a[3]]; };
for (const id in PS) PS[id]._nm = () => [T('p.' + id), statText(PS[id].desc)];
for (const id in SHOP) SHOP[id]._nm = () => [T('s.' + id), statText(SHOP[id].desc)];
for (const id in HEROES) HEROES[id]._nm = () => [hn(id), T('cl.' + id) + str('dot') + str('gap') + statText(HEROES[id].desc)];
for (const id in STAGES) STAGES[id]._nm = () => str('m.' + id);
for (const id in EN) if (EN[id].boss) EN[id]._nm = () => T('b.' + id);
const QUESTS = [['kills', 500, 100], ['kills', 5000, 400], ['kills', 25000, 1500], ['clear', 'keep', 150], ['clear', 'sewers', 300], ['clear', 'camp', 450], ['clear', 'crypt', 600], ['clear', 'hell', 1000],
  ['evolve', 1, 150], ['evolve', 10, 600], ['lvl', 20, 150], ['lvl', 40, 500], ['time', 5, 100], ['time', 8, 300], ['heroes', 4, 300], ['heroes', 10, 1500],
  ['chests', 25, 300], ['bosses', 10, 300], ['bosses', 50, 1200], ['shrines', 10, 250], ['torment', 1, 500], ['torment', 3, 1500]].map(([t, n, r]) => ({ id: t + '_' + n, t, n, r }));
const mapRec = id => (SV.maps && SV.maps[id]) || { best: 0, cleared: false, tor: 0 };
const curTor = id => Math.max(0, Math.min((SV.tor && SV.tor[id]) || 0, mapRec(id).tor || 0, 5));
const qProg = q => { const st = SV.stats; switch (q.t) { case 'kills': return st.kills; case 'clear': return mapRec(q.n).cleared ? 1 : 0; case 'evolve': return st.evos; case 'lvl': return SV.best.level; case 'time': return Math.floor(SV.best.time / 60); case 'heroes': return Object.keys(SV.heroes).length; case 'chests': return st.chests; case 'bosses': return st.bosses; case 'shrines': return st.shrines; case 'torment': return st.torMax || 0; } return 0; };
const qGoal = q => q.t === 'clear' ? 1 : q.n;
const qText = q => q.t === 'clear' ? T('q.clear', nm(STAGES[q.n])[0]) : T('q.' + q.t, q.n);
const qDia = q => Math.max(5, Math.round(q.r / 20));
function checkQuests() { const done = []; for (const q of QUESTS) if (!SV.q[q.id] && qProg(q) >= qGoal(q)) { SV.q[q.id] = 1; SV.dia = (SV.dia || 0) + qDia(q); done.push(q); } if (done.length) persist(); return done; }
const stageOpen = id => !STAGES[id].need || mapRec(STAGES[id].need).cleared;
const ELITES = [70, 160, 265, 340, 435, 500];

// ------------------------------------------------------------- assets
const sheet = new Image();
let flashSheet, redSheet, iceSheet, sheetData;
const loadState = { img: false, fonts: false };
function buildSheets() {
  const mk = (color) => {
    const c = document.createElement('canvas'); c.width = sheet.width; c.height = sheet.height;
    const x = c.getContext('2d'); x.drawImage(sheet, 0, 0); x.globalCompositeOperation = 'source-in'; x.fillStyle = color; x.fillRect(0, 0, c.width, c.height);
    return c;
  };
  flashSheet = mk('#fdf7ed'); redSheet = mk('#da4e38'); iceSheet = mk('#8fd8f0');
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
  const src = opts && opts.flash ? flashSheet : opts && opts.red ? redSheet : opts && opts.ice ? iceSheet : sheet;
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
function heroPic(el, box) {
  if (!el || !HEROES[SV.hero]) return; el.innerHTML = '';
  const f = frames(HEROES[SV.hero].spr, 'idle')[0], cv = iconCanvas(f, box * 1.45), fr = AT[f], k = fr ? parseFloat(cv.style.width) / fr[2] : 1;
  cv.style.marginTop = (-(fr && fr[3] > 20 ? 7 : 0) * k) + 'px'; el.appendChild(cv);
}
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
function sfx(n, vol = 1, vary = 0.08, minGap = 0.045, rate = 1) {
  const c = AU.ctx, b = AU.buf[n]; if (!c || !b) return;
  const t = c.currentTime; if (AU.last[n] && t - AU.last[n] < minGap) return; AU.last[n] = t;
  const s = c.createBufferSource(); s.buffer = b; s.playbackRate.value = rate * (1 + rnd(-vary, vary));
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

// ------------------------------------------------------------- ads (portal builds: CrazyGames SDK v3 or Playgama Bridge; site build: none)
const PORTAL = window.DM_PORTAL || '';
const STANDALONE = !PORTAL;
const ADS = {
  sdk: null, ready: false, busy: false, kind: '', pgCb: null, pgGot: false,
  async init() {
    try {
      if (PORTAL === 'cg') {
        const S = window.CrazyGames && window.CrazyGames.SDK; if (!S) return;
        await S.init();
        if (S.environment === 'disabled') return;
        this.sdk = S; this.kind = 'cg'; this.ready = true;
      } else if (PORTAL === 'pg') {
        const B = window.bridge; if (!B) return;
        await B.initialize();
        this.sdk = B; this.kind = 'pg'; this.ready = true;
        const fin = ok => { const cb = this.pgCb; this.pgCb = null; if (cb) cb(ok); };
        B.advertisement.on(B.EVENT_NAME.INTERSTITIAL_STATE_CHANGED, st => { if (st === 'opened') this.mute(true); else if (st === 'closed' || st === 'failed') fin(true); });
        B.advertisement.on(B.EVENT_NAME.REWARDED_STATE_CHANGED, st => { if (st === 'opened') this.mute(true); else if (st === 'rewarded') this.pgGot = true; else if (st === 'closed') fin(this.pgGot); else if (st === 'failed') fin(false); });
        try { B.platform.on(B.EVENT_NAME.AUDIO_STATE_CHANGED, on => { this.audioOff = !on; if (!this.busy) this.mute(!on); }); } catch (e) {}
        try { B.platform.on(B.EVENT_NAME.PAUSE_STATE_CHANGED, on => { if (on) { if (state.mode === 'play' && !state.paused) pauseGame(); this.mute(true); } else if (!this.busy) this.mute(!!this.audioOff); }); } catch (e) {}
        try { const k = String(B.platform.language || '').toLowerCase().slice(0, 2); if (I18[k] && !localStorage.getItem(SAVE_KEY)) SV.settings.lang = k; } catch (e) {}
        try { const got = await B.storage.get([SAVE_KEY]); const raw = Array.isArray(got) ? got[0] : got; if (raw) SV = parseSave(typeof raw === 'string' ? raw : JSON.stringify(raw)); } catch (e) {}
        try { this.audioOff = B.platform.isAudioEnabled === false; } catch (e) {}
      } else if (STANDALONE && window.DM_SITEADS && window.DM_SITEADS.rewarded) {
        const S = window.DM_SITEADS; if (S.init) await S.init();
        this.sdk = S; this.kind = 'site'; this.ready = true;
      }
    } catch (e) {}
  },
  call(fn) { try { if (this.ready && this.kind === 'cg') fn(this.sdk); } catch (e) {} },
  ev(name) {
    if (!this.ready) return;
    try {
      if (this.kind === 'cg') { const g = this.sdk.game; ({ gp1: () => g.gameplayStart(), gp0: () => g.gameplayStop(), load1: () => g.loadingStart(), load0: () => g.loadingStop(), win: () => g.happytime() }[name] || (() => {}))(); }
      else if (this.kind === 'pg') { const m = { load0: 'game_ready', win: 'player_got_achievement' }[name]; if (m) this.sdk.platform.sendMessage(m); }
    } catch (e) {}
  },
  mute(on) {
    if (!on && this.audioOff) on = true;
    if (AU.out) AU.out.gain.value = on ? 0 : Math.pow(SV.settings.sfx / 100, 1.5) * 0.9;
    if (AU.music) { if (on) AU.music.pause(); else AU.music.play().catch(() => {}); }
  },
  show(type, onDone, onFail) {
    if (this.busy) return; this.busy = true; try { if (window.GStats) GStats.ad(type === 'midgame' ? 'int' : 'rew'); } catch (e) {}
    if (type !== 'midgame') { const od = onDone; onDone = () => { try { if (window.GStats) GStats.ad('rew_ok'); } catch (e) {} od && od(); }; }
    let fired = false;
    const end = ok => { if (fired) return; fired = true; this.busy = false; this.mute(false); if (ok) { onDone && onDone(); } else { onFail && onFail(); } };
    if (!this.ready) {
      if (type === 'midgame') { end(true); return; }
      const el = $('adPrev'); $('adPrevTxt').textContent = L().adPreview; el.classList.add('show'); this.mute(true);
      let n = 3; $('adPrevN').textContent = n;
      const iv = setInterval(() => { n--; $('adPrevN').textContent = n; if (n <= 0) { clearInterval(iv); el.classList.remove('show'); end(true); } }, 1000);
      return;
    }
    try {
      if (this.kind === 'cg') { this.sdk.ad.requestAd(type, { adStarted: () => this.mute(true), adFinished: () => end(true), adError: () => end(false) }); return; }
      if (this.kind === 'site') { this.mute(true); const pr = type === 'midgame' ? (this.sdk.interstitial ? this.sdk.interstitial() : Promise.resolve()) : this.sdk.rewarded(); Promise.resolve(pr).then(ok => end(type === 'midgame' ? true : !!ok), () => end(type === 'midgame')); setTimeout(() => end(type === 'midgame'), 60000); return; }
      const A = this.sdk.advertisement;
      if (type === 'midgame') {
        if (!A.isInterstitialSupported) { end(true); return; }
        this.pgCb = () => end(true); A.showInterstitial('between_runs');
        setTimeout(() => { if (!fired && A.interstitialState !== 'opened' && A.interstitialState !== 'loading') { this.pgCb = null; end(true); } }, 2500); // too soon since the last one: the platform skips it silently
        setTimeout(() => { if (!fired && A.interstitialState !== 'opened') { this.pgCb = null; end(true); } }, 9000);
      } else {
        if (!A.isRewardedSupported) { end(false); return; }
        this.pgGot = false; this.pgCb = ok => end(ok); A.showRewarded('reward');
        setTimeout(() => { if (!fired && A.rewardedState !== 'opened' && A.rewardedState !== 'rewarded') { this.pgCb = null; end(false); } }, 12000);
      }
    } catch (e) { end(false); }
  }
};
const gpStart = () => ADS.ev('gp1');
const gpStop = () => ADS.ev('gp0');
const NOREW = () => { if (STANDALONE) return ADS.kind !== 'site'; try { return ADS.kind === 'pg' && !ADS.sdk.advertisement.isRewardedSupported; } catch (e) { return false; } };

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
let spikes = [], crateSpots = [], shrineSpots = [];
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
  pitGroups = []; buildLayout(stId || 'keep');
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
  shrineSpots = [];
  for (let i = 0; i < 3; i++) for (let t = 0; t < 60; t++) {
    const x = irnd(4, COLS - 5) * TS + 8, y = irnd(5, ROWS - 4) * TS + 8;
    if (dist2(x, y, cx, cy) < 190 * 190) continue;
    if (props.some(o => o.solid && dist2(o.x, o.y, x, y) < 44 * 44) || crateSpots.some(o => dist2(o.x, o.y, x, y) < 44 * 44)) continue;
    if (shrineSpots.some(o => dist2(o.x, o.y, x, y) < 250 * 250)) continue;
    if (spikes.some(k => Math.abs(k.x - x) < 30 && Math.abs(k.y - y) < 30)) continue;
    shrineSpots.push({ x, y }); break;
  }
  wallDeco = [];
  for (let x = 1; x < COLS - 1; x++) {
    const r = Math.random();
    if (ST_.wall === 'camp') { if (r < 0.2) wallDeco[x] = pick(['wall_banner_red', 'wall_banner_yellow']); else if (r < 0.25) wallDeco[x] = 'wall_hole_1'; }
    else if (ST_.wall === 'crypt') { if (r < 0.14) wallDeco[x] = pick(['wall_hole_1', 'wall_hole_2']); else if (r < 0.2) wallDeco[x] = 'wall_banner_blue'; else if (r < 0.24) wallDeco[x] = 'wall_goo'; }
    else if (ST_.wall === 'sewers') { if (r < 0.16) wallDeco[x] = 'wall_goo'; else if (r < 0.24) wallDeco[x] = pick(['wall_hole_1', 'wall_hole_2']); else if (r < 0.27) wallDeco[x] = 'wall_banner_green'; }
    else if (ST_.wall === 'hell') { if (r < 0.1) wallDeco[x] = 'wall_banner_red'; else if (r < 0.2) wallDeco[x] = pick(['wall_hole_1', 'wall_hole_2']); }
    else if (r < 0.06) wallDeco[x] = pick(['wall_banner_red', 'wall_banner_blue', 'wall_banner_green', 'wall_banner_yellow']);
    else if (r < 0.1) wallDeco[x] = pick(['wall_hole_1', 'wall_hole_2']);
    else if (r < 0.12) wallDeco[x] = 'wall_goo';
  }
  wallDeco.fountains = [];
  for (let i = 0; i < 4; i++) { const x = 6 + i * 16 + irnd(0, 6); wallDeco[x] = null; wallDeco.fountains.push({ x, c: pick(ST_.fount) }); }
}
// ------------------------------------------------------------- stage layouts
let pitGroups = [];
function addWall(tx, ty, w, deco) { // ty = tile row of the wall face
  const x0 = tx * TS, yb = (ty + 1) * TS;
  props.push({ wall: true, x: x0 + w * TS / 2, y: yb, x0, w, deco: deco || [] });
  for (let px = x0 + 6; px <= x0 + w * TS - 6; px += 9) props.push({ name: '', decal: true, coll: true, solid: true, x: px, y: yb - 5, r: 8 });
  (deco || []).forEach((d, i) => { if (d === 'wall_goo') props.push({ name: 'wall_goo_base', decal: true, x: x0 + i * TS + 8, y: yb + TS }); });
}
function addPit(tx, ty) { props.push({ name: 'hole', decal: true, pit: true, solid: true, x: tx * TS + 8, y: (ty + 1) * TS, r: 8 }); }
function addCol(tx, ty) { props.push({ name: 'column', x: tx * TS + 8, y: (ty + 1) * TS - 2, solid: true, r: 7 }); }
function addCrate(tx, ty) { props.push({ name: 'crate', x: tx * TS + 8, y: (ty + 1) * TS, solid: true, r: 7, deco: true }); }
function blob(cx0, cy0, n) { const cells = [[cx0, cy0]], seen = new Set([cx0 + ',' + cy0]); pitGroups.push(cells); while (cells.length < n) { const [x, y] = pick(cells), d = pick([[1, 0], [-1, 0], [0, 1], [0, -1]]), k = (x + d[0]) + ',' + (y + d[1]); if (seen.has(k)) continue; seen.add(k); cells.push([x + d[0], y + d[1]]); } cells.forEach(([x, y]) => addPit(x, y)); }
function buildLayout(id) {
  const mir = (f) => { f(1); }; void mir;
  if (id === 'keep') { // colonnade hall with banner walls in the four corners
    for (const x of [19, 25, 38, 44]) for (const y of [14, 31]) addCol(x, y);
    const b = () => pick(['wall_banner_red', 'wall_banner_blue']);
    addWall(7, 8, 5, [null, b(), null, b(), null]); addWall(52, 8, 5, [null, b(), null, b(), null]);
    addWall(7, 37, 5, [null, null, b(), null, null]); addWall(52, 37, 5, [null, null, b(), null, null]);
  } else if (id === 'sewers') { // broken slime walls in two bands, sinkholes between them
    for (const y of [11, 34]) for (const x of [5, 15, 42, 52]) addWall(x, y, 6, [null, 'wall_goo', null, Math.random() < 0.5 ? 'wall_hole_1' : null, 'wall_goo', null]);
    blob(31, 7, 6); blob(31, 39, 6); blob(9, 23, 5); blob(54, 23, 5);
  } else if (id === 'camp') { // crate barricades in a ring with gaps, flag walls at the edges
    for (let i = 0; i < 8; i++) { const a = i / 8 * TAU + 0.39, rx = 15, ry = 11; const tx = Math.round(32 + Math.cos(a) * rx), ty = Math.round(23 + Math.sin(a) * ry); for (let k = -1; k <= 1; k++) { const ax = Math.round(-Math.sin(a) * k), ay = Math.round(Math.cos(a) * k); addCrate(tx + ax, ty + ay); } }
    addWall(29, 5, 6, [null, 'wall_banner_red', null, null, 'wall_banner_yellow', null]); addWall(29, 41, 6, [null, 'wall_banner_yellow', null, null, 'wall_banner_red', null]);
    addWall(4, 22, 3, [null, 'wall_banner_red', null]); addWall(57, 22, 3, [null, 'wall_banner_red', null]);
  } else if (id === 'crypt') { // rows of tomb walls forming aisles
    for (const y of [8, 16, 31, 38]) for (const x of [6, 14, 22, 37, 45, 53]) { if ((y === 16 || y === 31) && (x === 22 || x === 37)) continue; addWall(x, y, 4, [Math.random() < 0.4 ? 'wall_hole_1' : null, null, Math.random() < 0.3 ? 'wall_hole_2' : null, null]); }
    for (const [x, y] of [[12, 23], [51, 23]]) { addCol(x, y - 2); addCol(x, y + 2); }
  } else if (id === 'hell') { // lava sinkholes scattered across the floor
    for (const [x, y, n] of [[12, 9, 9], [50, 10, 8], [10, 35, 8], [52, 35, 9], [31, 6, 6], [31, 40, 6], [20, 23, 5], [44, 23, 5]]) blob(x, y, n);
  }
}
function drawWallBlock(o, cx, cy) {
  const y0 = o.y - TS - cy, x0 = o.x0 - cx;
  for (let i = 0; i < o.w; i++) {
    const top = i === 0 ? 'wall_top_left' : i === o.w - 1 ? 'wall_top_right' : 'wall_top_mid';
    const fr = o.deco[i] || (i === 0 ? 'wall_left' : i === o.w - 1 ? 'wall_right' : 'wall_mid');
    const f1 = AT[top], f2 = AT[fr];
    if (f1) vctx.drawImage(sheet, f1[0], f1[1], 16, 16, Math.round(x0 + i * TS), Math.round(y0 - TS), 16, 16);
    if (f2) vctx.drawImage(sheet, f2[0], f2[1], 16, 16, Math.round(x0 + i * TS), Math.round(y0), 16, 16);
  }
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
function mkBase(heroId, shop) {
  const H = HEROES[heroId], m = H.mod || {}, lv = k => (shop && shop[k]) || 0;
  return {
    maxhp: Math.round(100 * (m.hp || 1) * (1 + 0.1 * lv('maxhp'))),
    might: (m.might || 1) * (1 + 0.05 * lv('might')),
    armor: (m.armor || 0) + lv('armor'),
    regen: (m.regen || 0) + 0.2 * lv('recovery'),
    spd: 62 * (m.spd || 1) * (1 + 0.05 * lv('speed')),
    magnet: 34 * (1 + 0.2 * lv('magnet') + 0.2 * lv('greed')),
    growth: (1 + 0.06 * lv('growth')) * (m.growth || 1),
    greed: 1 + 0.1 * lv('greed'),
    area: m.area || 1, cd: m.cd || 1, crit: 0.08 + (m.crit || 0) + 0.02 * lv('crit'), dashCd: 3 * (m.dash || 1) * (1 - 0.1 * lv('dash')),
    insight: lv('insight')
  };
}
function mkPlayer(heroId, shop, id, local, name) {
  const base = mkBase(heroId, shop), tm = HTIER[heroId] || 0; if (local) relApply(base);
  base.maxhp = Math.round(base.maxhp * (1 + 0.045 * tm)); base.might *= 1 + 0.04 * tm;
  return {
    id, local, name: name || '', hero: heroId, base, shop: shop || {},
    p: { x: AW / 2 + (id ? (id % 2 ? 26 : -26) * Math.ceil(id / 2) : 0), y: AH / 2 + 30, hp: base.maxhp, inv: 0, face: 1, dirx: 1, diry: 0, moving: false, anim: 0, hurtT: 0, dashT: 0, dashCd: 0, ddx: 1, ddy: 0 },
    weapons: [], passives: {}, bl: { might: 0, cd: 0, greed: 0, hp: 0 }, ST: null,
    rerolls: ((shop && shop.reroll) || 0) + Math.max(0, Math.round(GS('REROLLS', 0))), revive: ((shop && shop.revival) || 0) > 0, adRevived: false, adRerolls: 0,
    tr: { shield: false, shT: 0, moveT: 0, ripT: 0, gems: 0, healAcc: 0, healT: 0, dashHit: null }, down: false, reviveT: 0, input: null
  };
}
let curPL = null;
function use(pl) {
  curPL = pl; G.p = pl.p; G.weapons = pl.weapons; G.passives = pl.passives; G.base = pl.base; G.bl = pl.bl; G.hero = pl.hero;
  if (!pl.ST) pl.ST = S(); ST = pl.ST;
}
const LPL = () => G.players.find(q => q.local) || G.players[0];
const alivePL = () => G.players.filter(q => !q.down);
function newRun(heroId, opts) {
  opts = opts || {};
  G = {
    hero: heroId, t: 0, kills: 0, gold: 0, lvl: 1, xp: 0, pendingLv: 0, players: [],
    enemies: [], shots: [], pickups: [], parts: [], nums: [], blasts: [], swings: [], zones: [], zaps: [], slashes: [], eshots: [], warns: [], hazards: [], totem: null, bloodT: 0, meteorT: 0, combo: 0, comboT: 0, bestCombo: 0, splats: [], rings: [], amb: [], comboTier: 0, words: [], frameKills: 0, coinChain: 0, coinT: 0, slowT: 0, beatT: 0,
    spawnAcc: 0, bossesDone: {}, swarmsDone: {}, elitesDone: {}, boss: null,
    stage: opts.stage || SV.stage || 'keep', bossList: [], finalLeft: 0, rushAt: rnd(140, 330), wraith: null, wraithHit: 0, flow: null, flowAt: null, drumT: 0, drumAt: null, eruptAt: null, rushT: 0, rushDone: false, crateT: 30,
    tor: opts.tor != null ? opts.tor : curTor(SV.stage || 'keep'), fz: 0, fzIdle: 0, frenzyT: 0, freezeT: 0, hasteT: 0, ghosts: [], risers: [], shrines: [], shrineOpen: false, chargeT: 70,
    shake: 0, hitstop: 0, cam: { x: AW / 2 - VW / 2, y: AH / 2 - VH / 2 }, won: false, over: false, lightPulse: 0, redT: 0,
    mode: opts.mode || 'solo', daily: opts.daily || null
  };
  const roster = opts.roster || [{ hero: heroId, shop: SV.shop, local: true, name: '' }];
  roster.forEach((r, i) => G.players.push(mkPlayer(r.hero, r.shop, i, !!r.local, r.name)));
  if (opts.seed != null) withSeed(opts.seed, () => genWorld(G.stage)); else genWorld(G.stage);
  G.shrines = shrineSpots.map(o => ({ x: o.x, y: o.y, used: false }));
  for (const c of crateSpots) spawnEnemy('crate', c.x, c.y, { static: true });
  for (const pl of G.players) { if (MOD('glass')) { pl.base.might *= 1.5; pl.base.maxhp = Math.round(pl.base.maxhp * 0.6); pl.p.hp = pl.base.maxhp; } use(pl); addWeapon(HEROES[pl.hero].weapon); }
  if (opts.guest) { G.guest = true; G.enemies = []; }
  use(LPL());
}
function withSeed(seed, fn) {
  let x = (seed >>> 0) || 1; const old = Math.random;
  Math.random = () => { x ^= x << 13; x >>>= 0; x ^= x >>> 17; x ^= x << 5; x >>>= 0; return x / 4294967296; };
  try { fn(); } finally { Math.random = old; }
}
const S = () => { // live stats
  const b = G.base, p = G.passives, bl = G.bl;
  return {
    maxhp: Math.max(20, b.maxhp + 20 * (p.vitality || 0) + bl.hp), regen: b.regen + 0.2 * (p.vitality || 0) + 0.4 * (p.pulse || 0), might: b.might * (1 + 0.1 * (p.might || 0)) * (1 + bl.might),
    cd: b.cd * Math.pow(0.93, p.haste || 0) * (1 - Math.min(0.5, bl.cd)), spd: b.spd * (1 + 0.08 * (p.swift || 0)), area: b.area * (1 + 0.1 * (p.reach || 0)),
    magnet: b.magnet * (1 + 0.3 * (p.greed || 0)), greed: b.greed * (1 + 0.1 * (p.greed || 0)) * (1 + bl.greed), amount: p.charm || 0, armor: b.armor + (p.guard || 0), growth: b.growth * (1 + 0.08 * (p.tome || 0)),
    crit: b.crit + 0.06 * (p.keen || 0), dashCd: b.dashCd
  };
};
let ST = null; // cached stats, refreshed on change
const refreshStats = () => { ST = S(); if (curPL) curPL.ST = ST; };

const SIGPW = { oath: 0.7, moonbow: 0.66, quake: 2.6, comet: 1.4, fang: 2.6, twin: 0.64, skyforge: 1.15, gale: 3.2, frost: 3.4, shade: 0.85 };
const HTIER = { knight: 0, elf: 1, dwarf: 2, wizard: 3, lizard: 4, maren: 5, hild: 6, faelan: 7, ysolde: 8, sska: 9 };
const tierMul = h => 1 + 0.13 * (HTIER[h] || 0);
// each class has its own arsenal and its own evolution partners
const HKIT = { // signature + 3 class weapons; no two heroes share more than one class weapon
  knight: { oath: 'guard', sword: 'might', mace: 'vitality', spear: 'reach' },
  elf: { moonbow: 'swift', sword: 'keen', knives: 'haste', staff: 'charm' },
  dwarf: { quake: 'guard', axe: 'might', hammers: 'charm', bombs: 'vitality' },
  wizard: { comet: 'tome', staff: 'reach', bombs: 'greed', cleaver: 'haste' },
  lizard: { fang: 'keen', spear: 'haste', bow: 'swift', katana: 'might' },
  maren: { twin: 'haste', knives: 'keen', katana: 'swift', cleaver: 'might' },
  hild: { skyforge: 'vitality', hammers: 'might', mace: 'guard', cleaver: 'greed' },
  faelan: { gale: 'swift', bow: 'reach', axe: 'pulse', sword: 'charm' },
  ysolde: { frost: 'tome', staff: 'keen', hammers: 'reach', spear: 'pulse' },
  sska: { shade: 'keen', katana: 'charm', bombs: 'greed', mace: 'might' }
};
const pairOf = id => (HKIT[G.hero] && HKIT[G.hero][id]) || WP[id].pair;
function wStats(w) {
  const d = WP[w.id];
  const o = w.evo ? Object.assign({}, d.lv.reduce((a, b) => Object.assign(a, b), {}), d.evo) : (() => { const q = {}; for (let i = 0; i < w.lvl; i++) Object.assign(q, d.lv[i]); return q; })();
  if (d.sig) o.dmg *= SIGPW[w.id] * tierMul(d.sig);
  return o;
}
function addWeapon(id) { G.weapons.push({ id, pl: curPL, lvl: 1, evo: false, t: 0.4, dmg: 0, q: 0, qt: 0, q2: null, hits: new Map(), spin: 0 }); refreshStats(); }
function weapon(id) { return G.weapons.find(w => w.id === id); }

// ------------------------------------------------------------- input
const keys = {};
const stick = { on: false, ox: 0, oy: 0, x: 0, y: 0, id: null };
addEventListener('keydown', e => {
  const k = e.key.toLowerCase(); keys[k] = true;
  audioUnlock();
  if (k === 'escape' || k === 'p') {
    if (state.mode === 'play') { if (state.paused) resume(); else pauseGame(); }
    else if (['sSettings', 'sCredits', 'sArmory', 'sHero', 'sQuests', 'sLang', 'sStage', 'sMode', 'sCol', 'sAttend', 'sGacha'].includes(curScreen) || (k === 'escape' && curScreen === 'sAccount')) back();
  }
  if (k === 'm' && state.mode === 'play') { SV.settings.mini = SV.settings.mini === false; persist(); }
  if (state.mode === 'level' && ['1', '2', '3', '4'].includes(k)) { const b = $('choices').children[+k - 1]; if (b) b.click(); }
  if (state.mode === 'chest' && (k === 'enter' || k === ' ') && !$('bTake').disabled) { e.preventDefault(); $('bTake').click(); }
  else if ((k === ' ' || k === 'shift') && state.mode === 'play' && !state.paused) { e.preventDefault(); tryDash(); }
});
function onDash(pl) { pl.tr.ripT = pl.hero === 'maren' ? 2 : 0; pl.tr.dashHit = pl.hero === 'faelan' ? new Set() : null; if (typeof NET !== 'undefined' && NET.role === 'guest') NET.dash = true; }
function tryDash() {
  if (!G || G.over || state.mode !== 'play' || state.paused) return;
  const p = G.p; if (p.dashCd > 0) return;
  let dx = p.dirx, dy = p.diry; const l = Math.hypot(dx, dy);
  if (l < 0.1) { dx = p.face; dy = 0; } else { dx /= l; dy /= l; }
  p.ddx = dx; p.ddy = dy; p.dashT = 0.18; p.dashCd = ST.dashCd; p.inv = Math.max(p.inv, 0.34); sfx('knife', 0.55, 0.2); onDash(curPL);
}
$('dashBtn').addEventListener('pointerdown', e => { e.preventDefault(); e.stopPropagation(); audioUnlock(); tryDash(); });
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
addEventListener('blur', () => { if (state.mode === 'play' && !state.paused && !(G && G.mode === 'party')) pauseGame(); });
document.addEventListener('visibilitychange', () => {
  if (document.hidden) { if (state.mode === 'play' && !state.paused && !(G && G.mode === 'party')) pauseGame(); if (AU.music) AU.music.pause(); if (AU.ctx) AU.ctx.suspend(); }
  else { if (AU.music) AU.music.play().catch(() => {}); if (AU.ctx) AU.ctx.resume(); }
});
addEventListener('resize', resize);

// ------------------------------------------------------------- spawning
function spawnPos(margin) {
  const al = alivePL(), anchor = (al.length ? pick(al) : G.players[0]).p, cam = G.players.length > 1 ? { x: anchor.x - VW / 2, y: anchor.y - 12 - VH / 2 } : G.cam;
  const P = anchor;
  for (let t = 0; t < 10; t++) {
    const a = rnd(0, TAU), r = Math.hypot(VW, VH) / 2 + (margin || 24);
    const x = clamp(P.x + Math.cos(a) * r, 10, AW - 10), y = clamp(P.y + Math.sin(a) * r, 18, AH - 6);
    if (x < cam.x - 8 || x > cam.x + VW + 8 || y < cam.y - 8 || y > cam.y + VH + 24) return [x, y];
  }
  const x = P.x < AW / 2 ? AW - 20 : 20; return [x, rnd(20, AH - 20)];
}
const STG = () => STAGES[G.stage];
const MOD = k => !!(G && G.daily && G.daily.mods.includes(k));
const SHP = () => STG().hp * (1 + 0.25 * G.tor);
const GS = (k, d) => { try { return window.GStats ? GStats.cfg(k, d) : d; } catch (e) { return d; } }; // remote tuning (Roa)
let COINV = 0.3; // share of a gem's value paid out as coins
try { if (window.GStats) GStats.ready.then(() => { COINV = GS('COINV', 0.3); }); } catch (e) {}
const boostLeft = () => Math.max(0, ((SV.boost || 0) - Date.now()) / 1000);
const CVAL = 0.4; // run-coin scale (economy pass 11/25)
const SGOLD = () => CVAL * (G.drumT > 0 ? 1.5 : 1) * STG().gold * (1 + 0.2 * G.tor) * (MOD('rich') ? 1.5 : 1) * (G.bloodT > 0 ? 2 : 1) * (boostLeft() > 0 ? 1.5 : 1);
const tempo = () => (G.frenzyT > 0 ? 0.6 : 1) * (G.hasteT > 0 ? 0.8 : 1);
function hpMul() { const u = G.t / 45; return (1 + u * 0.42 + u * u * 0.006) * SHP() * (MOD('brute') ? 1.3 : 1) * (G.players && G.players.length > 1 ? 1 + 0.45 * (G.players.length - 1) : 1); }
function spawnEnemy(type, x, y, o = {}) {
  const d = EN[type];
  const runF = frames(d.spr || type, 'run'), idleF = frames(d.spr || type, 'idle');
  const f0 = AT[runF[0]];
  const big = d.boss ? 1 : 0, sc = o.elite ? 2 : (d.bsc || 1);
  const hp = d.boss ? d.hp * 1.8 * (1 + G.t / 490) * SHP() * (G.players && G.players.length > 1 ? 1 + 0.6 * (G.players.length - 1) : 1) : d.hp * hpMul() * (o.elite ? 14 : 1);
  const e = {
    type, x, y, hp, maxhp: hp, spd: d.spd * rnd(0.9, 1.1) * (o.elite ? 0.9 : 1) * (MOD('swift') ? 1.2 : 1), dmg: d.dmg * 1.6 * (o.elite ? 1.6 : 1) * (1.12 + G.t / 430) * (1 + (STG().hp - 1) * 0.5) * (1 + 0.1 * G.tor), static: !!o.static, xp: d.xp * (o.elite ? 10 : 1),
    run: runF, idle: idleF, h: f0 ? f0[3] : 16, r: big ? 13 : (f0 && f0[3] > 18 ? 7 : 6) * sc, sc, elite: !!o.elite, boss: !!d.boss, final: !!o.final,
    flash: 0, kbx: 0, kby: 0, anim: rnd(0, 1), face: 1, hitCd: {}, dash: 0, dashT: rnd(3, 5), summonT: 6, tele: 0, swarm: o.swarm ? { vx: o.vx, vy: o.vy, t: 9 } : null
  };
  G.enemies.push(e);
  return e;
}
function spawner(dt) {
  const t = G.t;
  const WV = STG().waves, wave = WV[Math.min(WV.length - 1, Math.floor(t / 45))];
  const rate = Math.min(2.1 + (t / 45) * 1.3, 18) * (G.totem ? 1.8 : 1) * (G.bloodT > 0 ? 1.3 : 1) * (G.boss ? 0.6 : 1) * (MOD('horde') ? 1.35 : 1) * (G.players.length > 1 ? 1 + 0.3 * (G.players.length - 1) : 1);
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
    G.elitesDone[s] = true; for (let q = 0; q < (MOD('elite') ? 2 : 1); q++) { const [x, y] = spawnPos(30 + q * 20); spawnEnemy(pick(wave), x, y, { elite: true }); }
  }
  if (STG().charge) {
    G.chargeT -= dt;
    if (G.chargeT <= 0) {
      G.chargeT = 55; banner(T('charge')); sfx('impact', 0.8, 0);
      const dir = Math.random() < 0.5 ? 1 : -1, x0 = clamp(G.p.x - dir * (VW / 2 + 16), 8, AW - 8), type = wave[wave.length - 1];
      for (let i = 0; i < 12; i++) { const e = spawnEnemy(type, x0 + rnd(-10, 10), clamp(G.p.y - 88 + i * 16, 16, AH - 4)); e.charge = { vx: dir, t: 3 }; }
    }
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
  const crit = Math.random() < ST.crit; if (crit) dmg *= 2;
  const T0 = curPL && curPL.tr;
  if (T0 && T0.ripT > 0 && G.hero === 'maren') dmg *= 1.5;
  if (crit && T0 && G.hero === 'lizard' && T0.healAcc < 5 && !G.over) { T0.healAcc++; G.p.hp = Math.min(ST.maxhp, G.p.hp + 1); }
  dmg = Math.max(1, Math.round(dmg));
  e.hp -= dmg; e.flash = 0.12;
  if (!e.static) { const I = INT(); if (crit) { sparks(e.x, e.y - e.h * e.sc * 0.5, Math.round(2 + I), ['#fdf7ed', '#facb3e'], 170); }
    else if (Math.random() < 0.3) sparks(e.x, e.y - e.h * e.sc * 0.5, 1 + (I > 2 ? 1 : 0), ['#fdf7ed'], 130); }
  if (G.hero === 'sska' && !e.boss && !e.static && e.hp > 0 && e.hp < e.maxhp * 0.15) { e.hp = 0; G.slashes.push({ x: e.x, y: e.y - 6, t: 0, life: 0.18, small: true }); }
  if (w) w.dmg += Math.min(dmg, dmg + e.hp);
  const kbk = (kb || 1) * (e.boss ? 0.08 : e.elite ? 0.3 : 1);
  if (kx || ky) { const d = Math.hypot(kx, ky) || 1; e.kbx += kx / d * 90 * kbk; e.kby += ky / d * 90 * kbk; }
  if (SV.settings.nums && (G.nums.length < 60 || crit)) G.nums.push({ x: e.x + rnd(-4, 4), y: e.y - e.h * e.sc - 2, v: dmg, t: 0, crit });
  sfx('hit', crit ? 0.5 : 0.35, 0.15, 0.06, crit ? 1.35 : 1);
  if (e.hp <= 0) kill(e);
}
function kill(e) {
  if (e.static) {
    for (const pt of samples('crate').filter(() => Math.random() < 0.12)) G.parts.push({ x: e.x + pt[0], y: e.y + pt[1], vx: rnd(-60, 60), vy: rnd(-90, -20), g: 220, c: pt[2], t: 0, life: rnd(0.4, 0.8), sz: 1 });
    sfx('thunk', 0.7, 0.1);
    for (let i = 0; i < irnd(3, 6); i++) dropCoin(e.x + rnd(-8, 8), e.y + rnd(-6, 6), 2);
    const r = Math.random();
    if (r < 0.12) G.pickups.push({ k: 'heart', x: e.x, y: e.y, t: 0 });
    else if (r < 0.17) G.pickups.push({ k: 'keg', x: e.x, y: e.y, t: 0 });
    else if (r < 0.29) G.pickups.push({ k: 'pmagnet', x: e.x, y: e.y, t: 0 });
    else if (r < 0.36) G.pickups.push({ k: pick(['pfreeze', 'phaste']), x: e.x, y: e.y, t: 0 });
    return;
  }
  G.kills++; SV.stats.kills++; G.frameKills++; { const C = colSV(); C.e[e.type] = (C.e[e.type] || 0) + 1; }
  if (Math.random() < 0.004) G.pickups.push({ k: 'coin', x: e.x, y: e.y, v: 40, t: 0, pull: false, vx: 0, vy: 0, lucky: true });
  if (G.hero === 'wizard' && !G.sparking && Math.random() < 0.25) {
    G.sparking = true; const hit = new Set([e]);
    for (let j = 0; j < 2; j++) { const t2 = nearest(e.x, e.y, 80, hit); if (!t2) break; hit.add(t2); G.zaps.push({ x1: e.x, y1: e.y - 6, x2: t2.x, y2: t2.y - 6, t: 0 }); damage(t2, 14 * (1 + 0.04 * G.lvl), null, 0, 0, 0.2); }
    G.sparking = false;
  }
  if (G.frenzyT <= 0) G.fz = Math.min(1, G.fz + 0.011); G.fzIdle = 0;
  splat(e); const I = INT();
  if (e.boss) ring(e.x, e.y - 10, 4, 90, 0.6, '#fdf7ed', 1); else if (e.elite) ring(e.x, e.y - 8, 3, 26, 0.35, '#fdf7ed', 1);
  const pts = samples(e.run[0]); const n = Math.round((e.boss ? 60 : e.elite ? 30 : 10) * (0.8 + I * 0.35));
  for (let i = 0; i < n && pts.length; i++) {
    const p = pick(pts); const a = rnd(0, TAU), s = rnd(20, 70) * (e.boss ? 1.6 : 1);
    G.parts.push({ x: e.x + p[0] * e.sc, y: e.y + p[1] * e.sc, vx: Math.cos(a) * s, vy: Math.sin(a) * s - 30, g: 160, c: p[2], t: 0, life: rnd(0.35, 0.7), sz: e.sc });
  }
  if (e.bounty > 0) { for (let i = 0; i < 18; i++) dropCoin(e.x + rnd(-16, 16), e.y + rnd(-10, 10), 4); banner(T('bountyDone')); sfx('fanfare', 0.9, 0); }
  if (e.type === 'tgoblin') { for (let i = 0; i < 26; i++) dropCoin(e.x + rnd(-18, 18), e.y + rnd(-12, 12), 4); G.pickups.push({ k: 'pmagnet', x: e.x, y: e.y, t: 0 }); sfx('coins', 1, 0); return; }
  if (e.type === 'slug' && !e.split) for (let i = 0; i < 2; i++) { const q = spawnEnemy('tiny_slug', e.x + rnd(-8, 8), e.y + rnd(-6, 6)); q.split = true; }
  if (e.type === 'doc') G.hazards.push({ x: e.x, y: e.y, r: 16, t: 0, life: 4, tick: 0, dmg: e.dmg * 0.4 });
  if (e.boss || e.elite || e.type === 'mimic') {
    if (e.elite) G.pickups.push({ k: 'pmagnet', x: e.x + 10, y: e.y, t: 0 });
    dropChest(e.x, e.y, e.elite && !e.boss);
    for (let i = 0; i < (e.boss ? 24 : 8); i++) dropCoin(e.x + rnd(-14, 14), e.y + rnd(-10, 10), e.boss ? 4 : 2);
    G.shake = e.boss ? 0.9 : 0.4; G.hitstop = e.boss ? 0.12 : 0.06; if (e.boss) { G.slowT = 0.6; G.flashT = 0.15; }
    sfx(e.boss ? 'bigboom' : 'boom', 0.9, 0);
    if (e.boss) {
      SV.stats.bosses++;
      G.bossList = G.bossList.filter(b => b !== e && b.hp > 0); G.boss = G.bossList[0] || null;
      if (e.final && --G.finalLeft <= 0) win();
    }
  } else {
    if (G.rushT > 0) dropCoin(e.x, e.y, e.xp * 2); else if (Math.random() < 0.85) dropCoin(e.x, e.y, e.xp);
    const r = Math.random();
    if (r < 0.004) G.pickups.push({ k: 'heart', x: e.x, y: e.y, t: 0 });
    else if (r < 0.0062) G.pickups.push({ k: 'keg', x: e.x, y: e.y, t: 0 });
    else if (r < 0.0085) G.pickups.push({ k: 'pmagnet', x: e.x, y: e.y, t: 0 });
    if (STG().rise && !G.won && !e.risen && RISE.has(e.type) && Math.random() < 0.22) G.risers.push({ x: e.x, y: e.y, type: e.type, t: 1.4 });
  }
}
function dropCoin(x, y, v) {
  if (G.pickups.length > 380) { const o = G.pickups.find(p => p.k === 'coin' && !p.pull); if (o) { o.v += v; return; } }
  const a = rnd(0, TAU), sp = rnd(10, 55); G.pickups.push({ k: 'coin', x, y, v, t: rnd(0, 1), pull: false, vx: Math.cos(a) * sp, vy: Math.sin(a) * sp * 0.6 });
}
function dropChest(x, y, mayMimic) { G.pickups.push({ k: mayMimic && Math.random() < 0.25 ? 'mimic' : 'chest', x: clamp(x, 16, AW - 16), y: clamp(y, 20, AH - 8), t: 0 }); }
function burst(x, y, n, cols, spd, life, grav) {
  for (let i = 0; i < n; i++) { const a = rnd(0, TAU), v = rnd(0.25, 1) * spd; G.parts.push({ x, y, vx: Math.cos(a) * v, vy: Math.sin(a) * v * 0.7, g: grav || 0, c: pick(cols), t: 0, life: life * rnd(0.6, 1.2), sz: Math.random() < 0.25 ? 2 : 1 }); }
}
function hurtPlayer(d) {
  const p = G.p; if (p.inv > 0 || G.over || curPL.down) return;
  if (curPL.tr.shield) { curPL.tr.shield = false; curPL.tr.shT = 0; p.inv = 0.6; G.blasts.push({ x: p.x, y: p.y - 8, r: 16, t: 0, life: 0.3, ring: true }); sfx('impact', 0.5, 0.1); return; }
  if (G.hero === 'dwarf' && !p.moving) d *= 0.65;
  d = Math.max(1, Math.round(d - ST.armor));
  p.hp -= d; p.inv = 0.6; p.hurtT = 0.25; G.shake = Math.max(G.shake, 0.25); G.redT = 0.25;
  sfx('hurt', 0.7, 0.05);
  if (p.hp <= 0 && G.players.length > 1) {
    if (curPL.revive) { curPL.revive = false; p.hp = Math.round(ST.maxhp * 0.5); p.inv = 2; banner(L().revived); return; }
    curPL.down = true; p.hp = 0; curPL.reviveT = 0; sfx('dead', 0.8, 0);
    if (!alivePL().length) die();
    return;
  }
  if (p.hp <= 0) {
    if (curPL.revive) {
      curPL.revive = false; p.hp = Math.round(ST.maxhp * 0.5); p.inv = 2; banner(L().revived); nuke(false); sfx('heal', 1, 0);
    } else if (!NOREW() && !curPL.adRevived && !G.won) offerRevive();
    else die();
  }
}
function offerRevive() {
  state.mode = 'offer'; G.p.hp = 0; gpStop();
  $('hud').classList.remove('show'); $('offerMsg').textContent = ''; showScreen('sOffer');
}
function doRevive() {
  const p = G.p; curPL.adRevived = true;
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

// ------------------------------------------------------------- impact
const INT = () => 1 + Math.min(2, G.lvl / 14 + G.t / 410); // effects grow with the run
const now = () => performance.now() / 1000;
function ring(x, y, r0, r1, life, c, th) { if (G.rings.length < 60) G.rings.push({ x, y, r0, r1, t0: now(), life, c, th: th || 1 }); }
function sparks(x, y, n, cols, sp) { if (G.parts.length > 1100) return; for (let i = 0; i < n; i++) { const a = rnd(0, TAU), v = rnd(0.5, 1) * (sp || 160); G.parts.push({ x, y, vx: Math.cos(a) * v, vy: Math.sin(a) * v - 20, g: 120, c: pick(cols), t: 0, life: rnd(0.12, 0.28), sz: 1 }); } }
const SPLAT = ['#3d1a22', '#4a1d24', '#2a2030', '#33281c'];
function splat(e) {
  if (G.splats.length > 320) G.splats.shift();
  const pts = [], n = e.boss ? 26 : e.elite ? 16 : 8, R = (e.boss ? 14 : e.elite ? 9 : 5) * Math.max(1, e.sc * 0.8);
  for (let i = 0; i < n; i++) { const a = rnd(0, TAU), d = Math.pow(Math.random(), 0.6) * R; pts.push([Math.round(Math.cos(a) * d), Math.round(Math.sin(a) * d * 0.6), Math.random() < 0.25 ? 2 : 1]); }
  const col = e.type && /slime|slug|swampy|muddy|zombie|goblin|orc/.test(e.type) ? '#26331c' : e.type && /skelet|skull|necro|lich|ice/.test(e.type) ? '#3a3a46' : pick(SPLAT);
  G.splats.push({ x: e.x, y: e.y, pts, c: col, t0: now() });
}

// ------------------------------------------------------------- dopamine
function bigText(word, col, sub) {
  const el = $('bigText'); if (!el) return; el.firstChild.textContent = word; el.lastChild.textContent = sub || ''; el.style.color = col || '#facb3e';
  el.classList.remove('show'); void el.offsetWidth; el.classList.add('show');
}
function confetti(x, y, n) { const cs = ['#da4e38', '#facb3e', '#9cdb43', '#72d6ce', '#9b5ba5', '#fdf7ed']; for (let i = 0; i < n; i++) { const a = rnd(0, TAU), sp = rnd(60, 190); G.parts.push({ x, y, vx: Math.cos(a) * sp, vy: Math.sin(a) * sp - 90, g: 260, c: pick(cs), t: 0, life: rnd(0.6, 1.2), sz: 1 + (Math.random() < 0.3 ? 1 : 0) }); } }
// rarity of level-up cards: rare (+4% damage), epic (taken twice), legendary (twice + full heal + coins)
const RARC = ['', '#4ba3d6', '#9b5ba5', '#facb3e'];
function rollRarity(c) {
  if (c.kind === 'evo') return 3; if (c.kind === 'b' || c.kind === 'heal' || c.kind === 'gold') return 0;
  const luck = 1 + 0.15 * (G.passives.greed || 0), r = Math.random();
  return r < 0.02 * luck ? 3 : r < 0.09 * luck ? 2 : r < 0.27 * luck ? 1 : 0;
}
function applyRarity(c) {
  const rr = c.rar || 0; if (!rr || c.kind === 'evo') return;
  G.bl.might += rr === 1 ? 0.04 : rr === 2 ? 0.06 : 0.1;
  if (rr >= 2) { if (c.kind === 'w') { const w = weapon(c.id); if (w && !w.evo && w.lvl < 5) w.lvl++; } else if (c.kind === 'p' && (G.passives[c.id] || 0) < PS[c.id].max) G.passives[c.id]++; }
  if (rr === 3) { refreshStats(); G.p.hp = ST.maxhp; G.gold += Math.round(60 * SGOLD()); sparks(G.p.x, G.p.y - 12, 14, ['#facb3e', '#fdf7ed'], 120); }
  refreshStats(); buildInv();
}
// account level (persists between runs)
const accNeed = l => Math.round(220 * Math.pow(l, 1.3));
function accGain(xp) {
  const A = SV.acc = SV.acc || { lvl: 1, xp: 0 }; let ups = 0, coins = 0;
  A.xp += xp; while (A.xp >= accNeed(A.lvl)) { A.xp -= accNeed(A.lvl); A.lvl++; ups++; coins += 40 + 15 * A.lvl; }
  if (coins) SV.coins += coins; return { ups, coins, lvl: A.lvl };
}
// daily login streak
const dayKey = (t) => { const d = t ? new Date(t) : new Date(); return d.getFullYear() * 10000 + (d.getMonth() + 1) * 100 + d.getDate(); };
const ATT = [5, 5, 8, 8, 10, 12, 30];
const attReward = n => ATT[(n - 1) % 7] * (n > 7 ? 1.5 : 1) | 0;
function attState() {
  const L0 = SV.login = SV.login || { d: 0, n: 0 }, key = dayKey(), yk = dayKey(Date.now() - 864e5);
  if (L0.d === key) return { n: L0.n, pending: false };
  return { n: L0.d === yk ? L0.n + 1 : 1, pending: true };
}
function attClaim() {
  const s = attState(); if (!s.pending) return 0;
  const r = attReward(s.n); SV.login.n = s.n; SV.login.d = dayKey(); SV.dia = (SV.dia || 0) + r; persist(); return r;
}
// daily missions
const MPOOL = [['kills', 300, 5], ['kills', 800, 8], ['runs', 2, 4], ['runs', 4, 8], ['time', 4, 6], ['time', 7, 9], ['chests', 3, 5], ['bosses', 1, 7], ['lvl', 15, 5], ['lvl', 25, 8], ['gold', 300, 5], ['gold', 800, 8], ['daily', 1, 7], ['evos', 1, 8]];
const MBONUS = 15;
function missions() {
  const key = dayKey(); let M = SV.dm;
  if (!M || M.d !== key) {
    let x = (key * 2246822519) >>> 0; const r2 = () => { x ^= x << 13; x >>>= 0; x ^= x >>> 17; x ^= x << 5; x >>>= 0; return x / 4294967296; };
    const pool = MPOOL.slice(), pick = [], used = {};
    while (pick.length < 3 && pool.length) { const m = pool.splice((r2() * pool.length) | 0, 1)[0]; if (used[m[0]]) continue; used[m[0]] = 1; pick.push(m); }
    M = SV.dm = { d: key, l: pick.map(([t, n, r]) => ({ t, n, r, p: 0, c: 0 })), b: 0 };
  }
  return M;
}
const mDone = m => m.p >= m.n;
const mClaimable = () => { const M = missions(); return M.l.some(m => mDone(m) && !m.c) || (!M.b && M.l.every(m => m.c)); };
function mTrack(run) {
  const M = missions(), fin = [];
  for (const m of M.l) {
    const was = mDone(m), v = run[m.t] || 0;
    if (m.t === 'time' || m.t === 'lvl') m.p = Math.max(m.p, v); else m.p += v;
    m.p = Math.min(m.p, m.n); if (!was && mDone(m)) fin.push(m);
  }
  return fin;
}
const mText = m => T('m.' + m.t, m.n);
// relics: permanent run bonuses, found in the treasure draw
const RELICS = {
  heart: { icon: 'sh_jar', st: 'maxhp', per: 0.04 }, fury: { icon: 'k_helmet_02', st: 'might', per: 0.03 },
  sand: { icon: 'k_candle_01', st: 'cd', per: -0.02 }, wind: { icon: 'k_flower_01', st: 'spd', per: 0.03 },
  sage: { icon: 'sh_teapot', st: 'area', per: 0.03 }, greed: { icon: 'k_coin_05', st: 'greed', per: 0.05 },
  reaper: { icon: 'k_bone01', st: 'crit', add: 0.015 }, ward: { icon: 'k_armor_01', st: 'armor', add: 0.25 }
};
const RLV = [0, 1, 3, 6, 10, 15]; // copies needed for Lv1..5
const relLv = id => { const n = ((SV.rel || {})[id]) || 0; let l = 0; while (l < 5 && n >= RLV[l + 1]) l++; return l; };
function relApply(b) { for (const id in RELICS) { const L = relLv(id); if (!L) continue; const R = RELICS[id]; if (R.add) b[R.st] += R.add * L; else if (R.st === 'maxhp') b.maxhp = Math.round(b.maxhp * (1 + R.per * L)); else b[R.st] *= 1 + R.per * L; } }
const DRAW1 = 30, DRAW10 = 270;
function drawOne() {
  const r = Math.random(), locked = Object.keys(HEROES).filter(k => !SV.heroes[k]);
  if (r < 0.03 && locked.length) { const k = pick(locked); SV.heroes[k] = true; return { k: 'hero', id: k }; }
  if (r < 0.28) { const v = Math.random() < 0.5 ? 300 : Math.random() < 0.7 ? 700 : 1500; SV.coins += v; return { k: 'coin', v }; }
  const id = pick(Object.keys(RELICS)), before = relLv(id); SV.rel = SV.rel || {}; SV.rel[id] = (SV.rel[id] || 0) + 1; return { k: 'rel', id, nw: before === 0, up: relLv(id) > before };
}
function doDraw(n) {
  const cost = n === 10 ? DRAW10 : DRAW1; if ((SV.dia || 0) < cost) { sfx('deny', 0.7, 0); $('gMsg').textContent = T('noDia'); return; }
  SV.dia -= cost; const out = []; for (let i = 0; i < n; i++) out.push(drawOne());
  if (n === 10 && !out.some(o => o.k === 'rel' || o.k === 'hero')) { SV.coins -= out[9].v || 0; out[9] = (() => { const id = pick(Object.keys(RELICS)), b0 = relLv(id); SV.rel = SV.rel || {}; SV.rel[id] = (SV.rel[id] || 0) + 1; return { k: 'rel', id, nw: b0 === 0, up: relLv(id) > b0 }; })(); }
  persist(); checkQuests(); showDraw(out); buildGacha(); refreshTitle();
}
function showDraw(out) {
  const box = $('gOut'); box.innerHTML = ''; $('gMsg').textContent = '';
  out.forEach((o, i) => {
    const d = document.createElement('div'); d.className = 'slot gs ' + o.k + (o.nw || o.k === 'hero' ? ' rare' : ''); d.style.animationDelay = (i * 0.07) + 's';
    const ic = o.k === 'hero' ? frames(HEROES[o.id].spr, 'idle')[0] : o.k === 'coin' ? 'coin_anim_f0' : RELICS[o.id].icon;
    d.appendChild(iconCanvas(ic, U * 10));
    const cp = document.createElement('i'); cp.className = 'cap'; cp.textContent = o.k === 'hero' ? hn(o.id) : o.k === 'coin' ? T('coinsN', o.v) : T('rel.' + o.id);
    d.appendChild(cp);
    if (o.nw || o.up || o.k === 'hero') { const b = document.createElement('b'); b.className = 'lv'; b.textContent = o.k === 'hero' || o.nw ? 'NEW' : 'Lv' + relLv(o.id); d.appendChild(b); }
    box.appendChild(d);
  });
  sfx(out.some(o => o.k === 'hero' || o.nw) ? 'fanfare' : 'coins', 0.9, 0);
}
function buildGacha() {
  $('gDia').textContent = SV.dia || 0;
  const g = $('gRel'); g.innerHTML = '';
  for (const id in RELICS) {
    const L = relLv(id), n = ((SV.rel || {})[id]) || 0, R = RELICS[id];
    const d = document.createElement('div'); d.className = 'rel' + (L ? '' : ' lock');
    d.appendChild(iconCanvas(R.icon, U * 7));
    const t = document.createElement('div'); t.className = 'rt';
    const nmE = document.createElement('b'); nmE.textContent = T('rel.' + id) + (L ? '  Lv' + L : ''); t.appendChild(nmE);
    const ef = document.createElement('span'); const v = R.add ? R.add * Math.max(1, L) : Math.abs(R.per) * 100 * Math.max(1, L);
    ef.textContent = T('relE.' + id, R.add ? (R.st === 'crit' ? (v * 100).toFixed(1) : v.toFixed(2)) : Math.round(v)); t.appendChild(ef);
    const pr = document.createElement('i'); pr.className = 'bar'; const fi = document.createElement('i'); fi.style.width = (L >= 5 ? 100 : Math.min(100, (n - RLV[L]) / (RLV[L + 1] - RLV[L]) * 100)) + '%'; pr.appendChild(fi); t.appendChild(pr);
    d.appendChild(t); g.appendChild(d);
  }
  $('gOne').textContent = T('draw1', DRAW1); $('gTen').textContent = T('draw10', DRAW10);
  $('gOne').disabled = (SV.dia || 0) < DRAW1; $('gTen').disabled = (SV.dia || 0) < DRAW10;
}
// collection
const colSV = () => SV.col || (SV.col = { e: {}, w: {}, c: {} });
const COLE = Object.keys(EN).filter(k => k !== 'crate');
const COLW = []; for (const id in WP) { COLW.push(id); if (WP[id].evo && WP[id].evoIcon && WP[id].evoIcon !== WP[id].icon) COLW.push('evo_' + id); }
const colSeen = (tab, id) => tab === 'w' ? !!colSV().w[id] : (colSV().e[id] || 0) > 0;
const colRew = (tab, id) => tab === 'w' ? (id.startsWith('evo_') ? 30 : 10) : (EN[id].boss ? 40 : 8);
const colNew = (tab, id) => colSeen(tab, id) && !colSV().c[tab + ':' + id];
const colClaimable = () => COLW.some(id => colNew('w', id)) || COLE.some(id => colNew('e', id));
const enName = id => { const n = L()['en.' + id] || I18.en['en.' + id]; return n || id; };
function colIcon(tab, id) {
  if (tab === 'w') { const ev = id.startsWith('evo_'), w = WP[ev ? id.slice(4) : id]; return ev ? w.evoIcon || w.icon : w.icon; }
  const s = EN[id].spr || id, f = frames(s, 'idle'); return f[0] || frames(s, 'run')[0] || frames(s)[0];
}
let colTab = 'w', colSel = null;
function buildCol(tab) {
  if (tab) { colTab = tab; colSel = null; }
  document.querySelectorAll('#colTabs button').forEach(b => b.classList.toggle('on', b.dataset.tab === colTab));
  const list = colTab === 'w' ? COLW : COLE, box = $('colGrid'); box.innerHTML = '';
  let seen = 0;
  list.forEach(id => {
    const ok = colSeen(colTab, id); if (ok) seen++;
    const d = document.createElement('button'); d.className = 'ccell' + (ok ? '' : ' lock') + (colTab === 'e' && EN[id].boss ? ' boss' : '') + (id.startsWith('evo_') ? ' evo' : '') + (colSel === id ? ' sel' : '');
    d.appendChild(iconCanvas(colIcon(colTab, id), U * 11));
    if (colNew(colTab, id)) { const n = document.createElement('span'); n.className = 'nw'; n.textContent = 'NEW'; d.appendChild(n); }
    if (ok && colTab === 'e') { const n = document.createElement('span'); n.className = 'cn'; n.textContent = colSV().e[id] > 9999 ? '9999+' : colSV().e[id]; d.appendChild(n); }
    d.onclick = () => {
      colSel = id; sfx('move', 0.5, 0);
      if (colNew(colTab, id)) { colSV().c[colTab + ':' + id] = 1; const r = colRew(colTab, id); SV.coins += r; persist(); sfx('coins', 0.8, 0); refreshTitle(); }
      buildCol();
    };
    box.appendChild(d);
  });
  $('colCount').textContent = T('colCnt', seen, list.length);
  const any = list.some(id => colNew(colTab, id)); $('colAll').style.display = any ? '' : 'none';
  $('colAll').onclick = () => { let s = 0; list.forEach(id => { if (colNew(colTab, id)) { colSV().c[colTab + ':' + id] = 1; s += colRew(colTab, id); } }); if (s) { SV.coins += s; persist(); sfx('coins', 1, 0); refreshTitle(); } buildCol(); };
  const inf = $('colInfo'); inf.innerHTML = '';
  if (colSel) {
    const ok = colSeen(colTab, colSel), b = document.createElement('b'), sp = document.createElement('span');
    if (!ok) { b.textContent = '???'; sp.textContent = T('colLock'); }
    else if (colTab === 'w') { const ev = colSel.startsWith('evo_'), n = nm(WP[ev ? colSel.slice(4) : colSel]); b.textContent = ev ? n[3] : n[0]; sp.textContent = ev ? (n[4] || '') : n[1]; }
    else { b.textContent = enName(colSel); sp.textContent = (EN[colSel].boss ? T('colBoss') + str('gap') : '') + T('colKills', colSV().e[colSel]); }
    inf.append(b, sp);
  } else inf.textContent = T('colHint');
}
document.querySelectorAll('#colTabs button').forEach(b => b.onclick = () => { sfx('move', 0.5, 0); buildCol(b.dataset.tab); });
function rankOf() {
  const sc = G.t / 5.9 + G.kills / 40 + (G.won ? 40 : 0);
  return sc >= 150 ? ['S', '#facb3e'] : sc >= 115 ? ['A', '#9cdb43'] : sc >= 80 ? ['B', '#72d6ce'] : sc >= 45 ? ['C', '#c6b7be'] : ['D', '#aa8d7a'];
}

// ------------------------------------------------------------- enemy attacks & run events
const ESC = ['#da4e38', '#9b5ba5'];
// enemy projectile kinds: 0 = demon fire orb; the rest are real items from the tileset
const EK = [null, null,
  { spr: 'skull', align: 1, home: 0.9 },                 // 2 necromancer: drifting skull that bends toward you
  { spr: 'flask_green', spin: 9, lob: 1, pool: 1 },      // 3 orc shaman: poison flask, leaves a puddle where it lands
  { spr: 'weapon_axe', spin: 15 },              // 4 orc warchief
  { spr: 'k_plank_01', spin: 9 },                 // 5 ogre
  { spr: 'sh_pot', spin: 11 },         // 6 rotting giant: bone clubs
  { spr: 'flask_big_yellow', spin: 7, lob: 1 },          // 7 elder shaman
  { spr: 'flask_big_blue', spin: 6, lob: 1, chill: 1 },  // 8 lich: frost flask, slows on hit
  { spr: 'bomb_f0', spin: 8 },                           // 9 (unused)
  { spr: 'sh_bamboo', spin: 8, lob: 1 },              // 10 gnoll shaman
  { spr: 'k_fish_01', spin: 12 },                      // 11 troll
  { spr: 'k_cookie_01', spin: 7, lob: 1, pool: 1 },      // 12 mushroom king: spore puddles
  { spr: 'sh_pwide', spin: 6, lob: 1 },          // 13 old archmage
  { spr: 'k_wood_01', spin: 6, lob: 1, pool: 1 }];  // 14 withered treant: sap
const BKIND = { ogre: 5, big_zombie: 6, big_demon: 0, warchief: 4, shaman: 13, lich: 14, troll: 11, mushking: 12 };
function eShot(x, y, a, spd, dmg, c, life) { if (G.eshots.length > 280) return; G.eshots.push({ x, y, vx: Math.cos(a) * spd, vy: Math.sin(a) * spd, dmg, c: c || 0, t: 0, life: life || 6 }); }
function bossAct(e, ux, uy) {
  const k = e.patk || 'dash';
  if (k === 'ring') { const n = 18, a0 = rnd(0, TAU); for (let i = 0; i < n; i++) eShot(e.x, e.y - 12, a0 + i / n * TAU, 78, e.dmg * 0.5, BKIND[e.type] || 0); sfx('boom', 0.6, 0.1); G.shake = Math.max(G.shake, 0.2); }
  else if (k === 'spray') { e.burst = 3; e.burstT = 0; }
  else { e.dash = 0.65; e.dx = ux; e.dy = uy; sfx('impact', 0.7, 0); }
}
function bossSlam(e, tp) {
  G.warns.push({ x: tp.x, y: tp.y, r: 26, t: -0.95, dmg: e.dmg * 0.9 });
  for (let i = 0; i < 4; i++) { const a = rnd(0, TAU), rr = rnd(40, 90); G.warns.push({ x: clamp(tp.x + Math.cos(a) * rr, 10, AW - 10), y: clamp(tp.y + Math.sin(a) * rr * 0.8, 16, AH - 6), r: 24, t: -0.95 - i * 0.12, dmg: e.dmg * 0.9 }); }
  sfx('portal', 0.5, 0.2);
}
const EVENTS = ['goblin', 'meteor', 'totem', 'gold', 'blood', 'bounty'];
function startEvent() {
  let k = pick(EVENTS); if (k === G.evKind) k = pick(EVENTS);
  G.evKind = k; G.evSeq = (G.evSeq || 0) + 1; banner(T('ev.' + k)); sfx('fanfare', 0.6, 0);
  const al = alivePL(), A = (al.length ? pick(al) : G.players[0]).p;
  if (k === 'goblin') { const [x, y] = spawnPos(10); const g = spawnEnemy('tgoblin', x, y); g.life = 16; }
  else if (k === 'meteor') { G.meteorT = 10; G.meteorAcc = 0; }
  else if (k === 'totem') { const a = rnd(0, TAU); G.totem = { x: clamp(A.x + Math.cos(a) * 90, 30, AW - 30), y: clamp(A.y + Math.sin(a) * 70, 40, AH - 20), r: 34, prog: 0, t: 0, life: 30 }; }
  else if (k === 'gold') { for (let i = 0; i < 30; i++) { const a = rnd(0, TAU), rr = rnd(30, 130); dropCoin(clamp(A.x + Math.cos(a) * rr, 10, AW - 10), clamp(A.y + Math.sin(a) * rr * 0.8, 16, AH - 6), 4); } }
  else if (k === 'blood') { G.bloodT = 20; }
  else if (k === 'bounty') { const WV = STG().waves, wv = WV[Math.min(WV.length - 1, Math.floor(G.t / 45))], [x, y] = spawnPos(20); const e = spawnEnemy(pick(wv), x, y, { elite: true }); e.hp = e.maxhp = e.maxhp * 0.7; e.bounty = 30; e.spd *= 1.15; }
}
function updateGimmicks(dt, LP) {
  const st = G.stage, al = alivePL();
  if (!al.length || G.won) return;
  if (st === 'crypt') { // the Pursuer: an unkillable wraith that drifts after the nearest hero
    if (!G.wraith && G.t >= 50) { const [x, y] = spawnPos(30); G.wraith = { x, y, t: 0 }; banner(T('gmWraith')); sfx('portal', 0.9, 0); }
    const W = G.wraith;
    if (W) { W.t += dt; let tp = al[0], bd = 1e12; for (const pl of al) { const d = dist2(pl.p.x, pl.p.y, W.x, W.y); if (d < bd) { bd = d; tp = pl; } }
      const sp = Math.min(46, 30 + G.t / 20), dx = tp.p.x - W.x, dy = tp.p.y - 6 - W.y, d = Math.hypot(dx, dy) || 1;
      W.x += dx / d * sp * dt; W.y += dy / d * sp * dt; W.face = dx >= 0 ? 1 : -1;
      if ((W.trT = (W.trT || 0) - dt) <= 0) { W.trT = 0.09; G.parts.push({ x: W.x + rnd(-5, 5), y: W.y + rnd(-14, -2), vx: rnd(-6, 6), vy: rnd(-14, -4), g: 0, c: pick(['#cae6f5', '#72d6ce', '#fdf7ed']), t: 0, life: rnd(0.4, 0.8), sz: 1 }); }
      for (const pl of al) if (dist2(pl.p.x, pl.p.y - 6, W.x, W.y) < 10 * 10 && pl.p.inv <= 0) { use(pl); if (!G.wraithHit) { G.wraithHit = 1; banner(T('gmWraithHit')); } hurtPlayer(pl.p.hp + 999); use(LP); }
    }
  } else if (st === 'sewers') { // backflow: a sludge current sweeps the middle channel sideways
    if (G.flowAt == null) G.flowAt = 60;
    if (!G.flow && G.t >= G.flowAt) { G.flow = { warn: 2, t: 9, dir: Math.random() < 0.5 ? -1 : 1 }; banner(T('gmFlow')); sfx('portal', 0.6, 0.2); }
    const F = G.flow;
    if (F) { const y0 = 13 * TS, y1 = 33 * TS;
      if (F.warn > 0) F.warn -= dt; else { F.t -= dt; const push = 52 * F.dir * dt;
        for (const pl of al) if (pl.p.y > y0 && pl.p.y < y1) pl.p.x = clamp(pl.p.x + push, 8, AW - 8);
        for (const e of G.enemies) if (!e.static && !e.boss && e.y > y0 && e.y < y1) e.x = clamp(e.x + push * 1.2, 6, AW - 6);
        if (F.t <= 0) { G.flow = null; G.flowAt = G.t + rnd(60, 80); } }
      const cxv = LP.p.x - VW / 2;
      for (let k = 0; k < (F.warn > 0 ? 1 : 4); k++) { const y = rnd(Math.max(y0, LP.p.y - VH / 2), Math.min(y1, LP.p.y + VH / 2)); G.parts.push({ x: F.dir > 0 ? cxv - 4 : cxv + VW + 4, y, vx: F.dir * rnd(140, 220), vy: 0, g: 0, c: pick(['#9cdb43', '#3d734f', '#775c55']), t: 0, life: VW / 150, sz: F.warn > 0 ? 1 : 2 }); }
    }
  } else if (st === 'camp') { // war drums: the horde surges, but pays more while it lasts
    if (G.drumAt == null) G.drumAt = 55;
    if (G.drumT > 0) { G.drumT -= dt; if ((G.drumBeat = (G.drumBeat || 0) - dt) <= 0) { G.drumBeat = 0.5; sfx('thunk', 0.8, 0.05); G.shake = Math.max(G.shake, 0.08); } }
    else if (G.t >= G.drumAt) { G.drumT = 9; G.drumAt = G.t + rnd(58, 75); banner(T('gmDrums')); }
  } else if (st === 'hell') { // eruptions: a pit cluster near you rumbles, then spits fire
    if (G.eruptAt == null) G.eruptAt = 40;
    if (G.t >= G.eruptAt && pitGroups.length) { G.eruptAt = G.t + rnd(16, 24);
      const tp = pick(al).p, near = pitGroups.filter(g => g.some(([x, y]) => dist2(x * TS + 8, y * TS + 8, tp.x, tp.y) < 260 * 260));
      const grp = near.length ? pick(near) : null;
      if (grp) { banner(T('gmErupt')); sfx('portal', 0.5, 0.3); for (const [x, y] of grp) G.warns.push({ x: x * TS + 8, y: y * TS + 10, r: 22, t: -1.3 - Math.random() * 0.3, dmg: 16 * (1 + G.t / 340), meteor: true }); }
    }
  }
}
function updateHazards(dt, LP) {
  updateGimmicks(dt, LP);
  if (G.evT == null) G.evT = rnd(40, 60);
  if (!G.won && G.t >= G.evT) { G.evT = G.t + rnd(48, 72); if (!G.bossList.some(b => b.hp > 0)) startEvent(); }
  if (G.bloodT > 0) G.bloodT -= dt;
  if (G.meteorT > 0) { G.meteorT -= dt; G.meteorAcc += dt; while (G.meteorAcc > 0.42) { G.meteorAcc -= 0.42; const al = alivePL(), A = (al.length ? pick(al) : G.players[0]).p; G.warns.push({ x: clamp(A.x + rnd(-120, 120), 10, AW - 10), y: clamp(A.y + rnd(-90, 90), 16, AH - 6), r: 20, t: -0.9, dmg: 14 * (1 + G.t / 340), meteor: true }); } }
  const T0 = G.totem;
  if (T0) { T0.t += dt; if (G.players.some(q => !q.down && dist2(q.p.x, q.p.y, T0.x, T0.y) < T0.r * T0.r)) T0.prog += dt;
    if (T0.prog >= 6) { dropChest(T0.x, T0.y, false); G.pickups.push({ k: 'pmagnet', x: T0.x + 14, y: T0.y, t: 0 }); banner(T('totemDone')); sfx('fanfare', 0.9, 0); burst(T0.x, T0.y - 8, 40, ['#9b5ba5', '#fdf7ed', '#facb3e'], 140, 0.6, 0); G.totem = null; }
    else if (T0.t > T0.life) G.totem = null; }
  for (let i = G.eshots.length - 1; i >= 0; i--) {
    const q = G.eshots[i], K = EK[q.c]; q.t += dt;
    if (K && K.home && q.t < 2.6) { let tp = null, bd = 1e12; for (const pl of G.players) if (!pl.down) { const dd = dist2(pl.p.x, pl.p.y - 8, q.x, q.y); if (dd < bd) { bd = dd; tp = pl; } }
      if (tp) { const want = Math.atan2(tp.p.y - 8 - q.y, tp.p.x - q.x), cur = Math.atan2(q.vy, q.vx), sp = Math.hypot(q.vx, q.vy); let da = ((want - cur + Math.PI * 3) % TAU) - Math.PI; da = clamp(da, -K.home * dt, K.home * dt); q.vx = Math.cos(cur + da) * sp; q.vy = Math.sin(cur + da) * sp; } }
    q.x += q.vx * dt; q.y += q.vy * dt;
    if (K && K.pool && q.t > q.life - 0.01) { G.hazards.push({ x: q.x, y: q.y + 6, r: 15, t: 0, life: 3.2, tick: 0.3, dmg: q.dmg * 0.35 }); burst(q.x, q.y, 10, ['#9cdb43', '#4ba747', '#fdf7ed'], 60, 0.35, 40); sfx('thunk', 0.4, 0.2, 0.05); }
    let hit = false; for (const pl of G.players) if (!pl.down && dist2(pl.p.x, pl.p.y - 8, q.x, q.y) < 64) { use(pl); hurtPlayer(q.dmg); if (K && K.chill) pl.chillT = 2; hit = true; break; }
    if (hit || q.t > q.life || q.x < -20 || q.x > AW + 20 || q.y < -20 || q.y > AH + 20) G.eshots.splice(i, 1);
  }
  for (let i = G.warns.length - 1; i >= 0; i--) {
    const w = G.warns[i]; w.t += dt;
    if (w.t >= 0 && !w.done) { w.done = true;
      for (const pl of G.players) if (!pl.down && dist2(pl.p.x, pl.p.y - 4, w.x, w.y) < w.r * w.r) { use(pl); hurtPlayer(w.dmg); }
      use(LP); if (w.meteor) queryR(w.x, w.y, w.r + 10, e => { if (!e.static && dist2(w.x, w.y, e.x, e.y) < w.r * w.r) damage(e, 60 * (1 + G.t / 245), null, e.x - w.x, e.y - w.y, 1.2); });
      burst(w.x, w.y - 2, 18, w.meteor ? ['#fdf7ed', '#facb3e', '#ee8e2e', '#da4e38'] : ['#775c55', '#aa8d7a', '#483b3a'], w.r * 3, 0.45, 60); G.shake = Math.max(G.shake, 0.15); sfx(w.meteor ? 'boom' : 'impact', 0.45, 0.15, 0.06); }
    if (w.t > 0.2) G.warns.splice(i, 1);
  }
  for (let i = G.hazards.length - 1; i >= 0; i--) {
    const h = G.hazards[i]; h.t += dt; h.tick -= dt;
    if (h.tick <= 0) { h.tick = 0.5; for (const pl of G.players) if (!pl.down && dist2(pl.p.x, pl.p.y, h.x, h.y) < h.r * h.r) { use(pl); hurtPlayer(h.dmg); } }
    if (h.t > h.life) G.hazards.splice(i, 1);
  }
  use(LP);
}
// small map of the whole arena in the top-right corner (M toggles it)
function drawMinimap(cx, cy) {
  const mw = VW < 300 ? 52 : 70, mh = Math.round(mw * AH / AW), X0 = VW - mw - 4, Y0 = 24, sx = mw / AW, sy = mh / AH;
  vctx.globalAlpha = 0.8; vctx.fillStyle = '#111'; vctx.fillRect(X0 - 1, Y0 - 1, mw + 2, mh + 2); vctx.fillStyle = '#1c1618'; vctx.fillRect(X0, Y0, mw, mh); vctx.globalAlpha = 1;
  const dot = (x, y, c, sz) => { vctx.fillStyle = c; vctx.fillRect(Math.round(X0 + x * sx - (sz >> 1)), Math.round(Y0 + y * sy - (sz >> 1)), sz, sz); };
  for (const sh of G.shrines) if (!sh.used) dot(sh.x, sh.y, '#9b5ba5', 2);
  if (G.totem) dot(G.totem.x, G.totem.y, (performance.now() / 200 | 0) % 2 ? '#c6b7be' : '#9b5ba5', 3);
  let n = 0;
  for (const e of G.enemies) { if (e.static) continue; if (e.boss || e.elite || e.type === 'tgoblin') continue; if (n++ > 220) break; dot(e.x, e.y, '#c0453a', 1); }
  for (const k of G.pickups) if (k.k === 'chest' || k.k === 'pmagnet' || k.k === 'heart') dot(k.x, k.y, k.k === 'heart' ? '#da4e38' : '#facb3e', 2);
  for (const e of G.enemies) { if (e.elite) dot(e.x, e.y, '#ee8e2e', 2); else if (e.type === 'tgoblin') dot(e.x, e.y, '#facb3e', 3); else if (e.boss) dot(e.x, e.y, (performance.now() / 150 | 0) % 2 ? '#da4e38' : '#fdf7ed', 4); }
  vctx.fillStyle = 'rgba(253,247,237,.35)'; const vx = Math.round(X0 + cx * sx), vy = Math.round(Y0 + cy * sy), vw = Math.round(VW * sx), vh = Math.round(VH * sy);
  vctx.fillRect(vx, vy, vw, 1); vctx.fillRect(vx, vy + vh, vw, 1); vctx.fillRect(vx, vy, 1, vh); vctx.fillRect(vx + vw, vy, 1, vh + 1);
  for (const pl of G.players) if (!pl.local) dot(pl.p.x, pl.p.y, pl.down ? '#da4e38' : '#9cdb43', 3);
  const me = LPL(); dot(me.p.x, me.p.y, '#111', 4); dot(me.p.x, me.p.y, '#fdf7ed', 2);
}
function drawMagnet(X, Y) {
  const x = Math.round(X) - 4, y = Math.round(Y) - 9;
  vctx.fillStyle = '#da4e38'; vctx.fillRect(x, y, 2, 6); vctx.fillRect(x + 6, y, 2, 6); vctx.fillRect(x + 1, y + 6, 6, 2);
  vctx.fillStyle = '#c6b7be'; vctx.fillRect(x, y - 2, 2, 2); vctx.fillRect(x + 6, y - 2, 2, 2);
  vctx.fillStyle = '#fdf7ed'; vctx.fillRect(x + 1, y + 1, 1, 2);
}

// ------------------------------------------------------------- weapons
function fireWeapons(dt) {
  const p = G.p;
  for (const w of G.weapons) {
    const s = wStats(w);
    const n = (s.n || 1) + ST.amount;
    if (w.id === 'hammers') { updateHammers(w, s, n, dt / tempo()); continue; }
    w.t -= dt;
    // queued shots (knives fire one after another)
    if (w.q > 0) { w.qt -= dt; if (w.qt <= 0) { w.q--; w.qt = 0.07; throwKnife(w, s, w.q2); } }
    if (w.t > 0) continue;
    w.t = s.cd * ST.cd * tempo() * (G.hero === 'elf' && curPL.tr.moveT >= 1.5 ? 0.78 : 1);
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
      case 'staff': {
        for (let i = 0; i < n; i++) { const a = rnd(0, TAU); G.shots.push({ w, kind: 'orb', x: p.x, y: p.y - 12, vx: Math.cos(a) * 90, vy: Math.sin(a) * 90, life: 2.4, t: -i * 0.08, dmg: s.dmg, pierce: 1, r: 4, hit: new Set(), boom: w.evo ? 22 * ST.area : 0, evo: w.evo, tr: 0 }); }
        sfx('shoot', 0.3, 0.2); break;
      }
      case 'katana': {
        const tg = nearest(p.x, p.y - 8, 130);
        const base = tg ? Math.atan2(tg.y - tg.h / 2 - (p.y - 10), tg.x - p.x) : Math.hypot(p.dirx, p.diry) > 0.1 ? Math.atan2(p.diry, p.dirx) : (p.face > 0 ? 0 : Math.PI);
        const nd = w.evo ? 4 : 1;
        for (let i = 0; i < nd; i++) G.swings.push({ w, kind: 'thrust', ang: base + i * Math.PI / 2, t: -(i % 2) * 0.1, dur: 0.18, len: 86 * s.area * ST.area, dmg: s.dmg, hit: new Set(), spr: w.evo ? 'weapon_anime_sword' : 'weapon_katana', streak: true });
        sfx('sword', 0.6, 0.2); break;
      }
      case 'cleaver': {
        const used = new Set();
        for (let i = 0; i < n; i++) {
          const tg = nearest(p.x, p.y, 200, used); if (tg) used.add(tg);
          const a = tg ? Math.atan2(tg.y - tg.h / 2 - (p.y - 10), tg.x - p.x) : (p.face > 0 ? 0 : Math.PI) + rnd(-0.5, 0.5) + i * 0.7;
          G.shots.push({ w, kind: 'boom', spr: w.evo ? 'weapon_double_axe' : 'weapon_cleaver', x: p.x, y: p.y - 10, vx: Math.cos(a) * 300, vy: Math.sin(a) * 300, rot: a, vr: 16, life: 3, t: -i * 0.12, dmg: s.dmg, pierce: 999, r: 8 * s.area * ST.area, hit: new Set(), back: false });
        }
        sfx('thunk', 0.45, 0.2); break;
      }
      case 'oath': {
        const tg = nearest(p.x, p.y - 8, 140);
        const base = tg ? Math.atan2(tg.y - tg.h / 2 - (p.y - 8), tg.x - p.x) : (p.face > 0 ? 0 : Math.PI);
        G.swings.push({ w, ang: base, t: 0, dur: w.evo ? 0.3 : 0.2, arc: w.evo ? TAU : 2.4, r: 28 * s.area * ST.area, dmg: s.dmg, hit: new Set(), spr: 'weapon_golden_sword' });
        const nw = w.evo ? 6 : s.n + ST.amount;
        for (let i = 0; i < nw; i++) { const a = w.evo ? base + i / nw * TAU : base + (i - (nw - 1) / 2) * 0.28; G.shots.push({ w, kind: 'wave', x: p.x, y: p.y - 10, vx: Math.cos(a) * 230, vy: Math.sin(a) * 230, rot: a, life: 0.55, t: -0.06, dmg: s.dmg * 0.7, pierce: 999, r: 9 * s.area * ST.area, hit: new Set() }); }
        sfx('sword', 0.6, 0.1); break;
      }
      case 'moonbow': {
        const used = new Set();
        for (let i = 0; i < n; i++) {
          const tgt = nearest(p.x, p.y, 240, used); if (tgt) used.add(tgt);
          const a = tgt ? Math.atan2(tgt.y - tgt.h / 2 - (p.y - 10), tgt.x - p.x) : (p.face > 0 ? 0 : Math.PI) + rnd(-0.3, 0.3);
          G.shots.push({ w, kind: 'arrow', spr: 'weapon_arrow', x: p.x, y: p.y - 10, vx: Math.cos(a) * 320, vy: Math.sin(a) * 320, rot: a, life: 1.1, t: -i * 0.05, dmg: s.dmg, pierce: 1, r: 5, hit: new Set(), split: s.split, evo: w.evo, gen: 0, moon: true });
        }
        sfx('shoot', 0.35, 0.1); break;
      }
      case 'quake': {
        const tg = nearest(p.x, p.y, 200);
        const base = tg ? Math.atan2(tg.y - p.y, tg.x - p.x) : (p.face > 0 ? 0 : Math.PI);
        const lines = w.evo ? 4 : s.n;
        for (let l = 0; l < lines; l++) {
          const a = base + (w.evo ? l * Math.PI / 2 : (l - (lines - 1) / 2) * 0.5);
          for (let i = 1; i <= s.len; i++) G.blasts.push({ x: clamp(p.x + Math.cos(a) * i * 16, 8, AW - 8), y: clamp(p.y + Math.sin(a) * i * 14, 12, AH - 4), r: 12 * s.area * ST.area, t: -i * 0.06, life: 0.3, dmg: s.dmg, w, pending: true, style: 'rock', stun: w.evo ? 0.7 : 0 });
        }
        sfx('impact', 0.5, 0.15); break;
      }
      case 'comet': {
        for (let i = 0; i < n; i++) {
          const cands = []; queryR(p.x, p.y, 170, e => { if (!e.static) cands.push(e); });
          const tg = cands.length ? pick(cands) : null;
          const x = tg ? tg.x : p.x + rnd(-90, 90), y = tg ? tg.y : p.y + rnd(-70, 70);
          G.blasts.push({ x: clamp(x, 8, AW - 8), y: clamp(y, 12, AH - 4), r: 30 * s.area * ST.area, t: -0.6 - i * 0.15, life: 0.4, dmg: s.dmg, w, pending: true, marker: 'comet', zone: w.evo ? s.dmg * 0.3 : 0 });
        }
        break;
      }
      case 'fang': {
        const nd = w.evo ? 3 : s.dirs;
        const tg = nearest(p.x, p.y - 8, 70 * s.area * ST.area);
        const base = tg ? Math.atan2(tg.y - tg.h / 2 - (p.y - 10), tg.x - p.x) : Math.hypot(p.dirx, p.diry) > 0.1 ? Math.atan2(p.diry, p.dirx) : (p.face > 0 ? 0 : Math.PI);
        for (let i = 0; i < nd; i++) G.swings.push({ w, kind: 'thrust', ang: base + (nd === 3 ? (i - 1) * 0.5 : i * Math.PI), t: -i * 0.05, dur: 0.2, len: 60 * s.area * ST.area, dmg: s.dmg, hit: new Set(), spr: 'weapon_machete', poison: s.poison, evo: w.evo });
        sfx('knife', 0.5, 0.15); break;
      }
      case 'twin': {
        const used = new Set();
        for (let i = 0; i < n; i++) {
          const tg = nearest(p.x, p.y, 200, used); if (tg) used.add(tg);
          const a = tg ? Math.atan2(tg.y - tg.h / 2 - (p.y - 10), tg.x - p.x) : (p.face > 0 ? 0 : Math.PI) + (i - 0.5) * 0.6;
          G.shots.push({ w, kind: 'knife', spr: 'weapon_duel_sword', x: p.x, y: p.y - 10, vx: Math.cos(a) * 300, vy: Math.sin(a) * 300, rot: a, life: 0.9, t: -i * 0.06, dmg: s.dmg, pierce: 1, r: 5, hit: new Set(), bounce: s.bounce });
        }
        sfx('knife', 0.4, 0.15); break;
      }
      case 'skyforge': {
        for (let i = 0; i < n; i++) {
          const cands = []; queryR(p.x, p.y, 150, e => { if (!e.static) cands.push(e); });
          const tg = cands.length ? pick(cands) : null;
          const x = tg ? tg.x : p.x + rnd(-70, 70), y = tg ? tg.y : p.y + rnd(-60, 60);
          G.blasts.push({ x: clamp(x, 8, AW - 8), y: clamp(y, 12, AH - 4), r: 22 * s.area * ST.area, t: -0.45 - i * 0.12, life: 0.35, dmg: s.dmg, w, pending: true, marker: 'forge', style: 'rock', stun: 0.5, zone: w.evo ? s.dmg * 0.25 : 0 });
        }
        break;
      }
      case 'gale': {
        for (let i = 0; i < n; i++) {
          const tg = nearest(p.x, p.y, 200);
          const a = tg ? Math.atan2(tg.y - p.y, tg.x - p.x) + (i - (n - 1) / 2) * 0.7 : rnd(0, TAU);
          G.shots.push({ w, kind: 'tornado', x: p.x, y: p.y - 4, vx: Math.cos(a) * 45, vy: Math.sin(a) * 45, life: s.life, t: 0, dmg: s.dmg, pierce: 999, r: 15 * s.area * ST.area, hits: new Map(), evo: w.evo, ang: i * 2.1, spin: 0 });
        }
        sfx('dash', 0.5, 0.2); break;
      }
      case 'frost': {
        const R = 50 * s.area * ST.area;
        queryR(p.x, p.y - 6, R + 16, e => { if (e.static || dist2(p.x, p.y - 6, e.x, e.y) > (R + e.r) * (R + e.r)) return; damage(e, s.dmg, w, e.x - p.x, e.y - p.y, 0.4); if (e.hp > 0) { e.slowT = 1.25; e.slow = s.slow; if (w.evo && !e.boss && Math.random() < 0.25) e.stunT = 0.8; } });
        G.blasts.push({ x: p.x, y: p.y - 4, r: R, t: 0, life: 0.35, ring: true, ice: true });
        break;
      }
      case 'shade': {
        const cands = []; queryR(p.x, p.y, 160, e => { if (!e.static) cands.push(e); });
        for (let i = 0; i < n && cands.length; i++) {
          const e = cands.splice((Math.random() * cands.length) | 0, 1)[0];
          G.slashes.push({ x: e.x, y: e.y - e.h * e.sc / 2, t: 0, life: 0.22, a: rnd(0, Math.PI) });
          damage(e, s.dmg, w, 0, 0, 0.3);
          if (w.evo) queryR(e.x, e.y, 30, o => { if (o !== e && !o.static && dist2(e.x, e.y, o.x, o.y) < 24 * 24) damage(o, s.dmg * 0.5, w, o.x - e.x, o.y - e.y, 0.6); });
        }
        if (cands.length || n) sfx('sword', 0.45, 0.3);
        break;
      }
      case 'mace': {
        const R = 46 * s.area * ST.area;
        queryR(p.x, p.y - 6, R + 16, e => { if (dist2(p.x, p.y - 6, e.x, e.y) < (R + e.r) * (R + e.r)) { damage(e, s.dmg, w, e.x - p.x, e.y - p.y, 2.4); if (w.evo && !e.boss && e.hp > 0) e.stunT = 1.1; } });
        G.blasts.push({ x: p.x, y: p.y - 4, r: R, t: 0, life: 0.3, ring: true });
        G.swings.push({ w, kind: 'slam', t: 0, dur: 0.22, spr: w.evo ? 'weapon_baton_with_spikes' : 'weapon_mace', hit: new Set() });
        G.shake = Math.max(G.shake, 0.18); sfx('impact', 0.6, 0.15);
        burst(p.x, p.y - 2, 14, ['#775c55', '#483b3a', '#aa8d7a'], 110, 0.35, 0); break;
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
  for (let i = G.swings.length - 1; i >= 0; i--) {
    const s = G.swings[i]; s.t += dt;
    use((s.w && s.w.pl) || LPL()); const p = G.p;
    if (s.t < 0) continue;
    const k = clamp(s.t / s.dur, 0, 1);
    if (s.kind === 'slam') { if (s.t >= s.dur) G.swings.splice(i, 1); continue; }
    if (s.kind === 'thrust') {
      const ext = k < 0.4 ? k / 0.4 : 1 - (k - 0.4) / 0.6;
      const L = s.len * ext, cx = Math.cos(s.ang), cy = Math.sin(s.ang), ox = p.x, oy = p.y - 10;
      if (k < 0.6) queryR(ox + cx * L / 2, oy + cy * L / 2, L / 2 + 10, e => {
        if (s.hit.has(e)) return;
        const ex = e.x - ox, ey = e.y - e.h * e.sc / 2 - oy, along = ex * cx + ey * cy, perp = Math.abs(ex * -cy + ey * cx);
        if (along > -4 && along < L + 4 && perp < e.r + 5) { s.hit.add(e); damage(e, s.dmg, s.w, cx, cy, 1.4); if (s.poison && e.hp > 0) e.poison = { dps: s.poison * ST.might, t: 3, pl: curPL, evo: s.evo, acc: e.poison ? e.poison.acc : 0 }; }
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
    use((s.w && s.w.pl) || LPL());
    if (s.kind === 'tornado') {
      if (s.evo) { const o = G.p; s.ang += dt * 2.2; const tx = o.x + Math.cos(s.ang) * 46, ty = o.y - 4 + Math.sin(s.ang) * 36; s.vx += (tx - s.x) * 6 * dt; s.vy += (ty - s.y) * 6 * dt; s.vx *= Math.pow(0.2, dt); s.vy *= Math.pow(0.2, dt); }
      s.x = clamp(s.x + s.vx * dt, 8, AW - 8); s.y = clamp(s.y + s.vy * dt, 12, AH - 4); s.spin += dt * 14;
      queryR(s.x, s.y, s.r * 1.9 + 12, e => {
        if (e.static) return; const dx = s.x - e.x, dy = s.y - e.y, d = Math.hypot(dx, dy) || 1;
        if (d < s.r * 1.9 && !e.boss) { e.kbx += dx / d * 260 * dt; e.kby += dy / d * 260 * dt; }
        if (d < s.r + e.r) { const last = s.hits.get(e) || -9; if (G.t - last >= 0.32) { s.hits.set(e, G.t); damage(e, s.dmg, s.w, 0, 0, 0); } }
      });
      if (s.t > s.life) G.shots.splice(i, 1);
      continue;
    }
    if (s.kind === 'bomb') {
      if (s.t < s.fly) { const k = s.t / s.fly; s.x = s.sx + (s.tx - s.sx) * k; s.y = s.sy + (s.ty - s.sy) * k; s.z = Math.sin(k * Math.PI) * 34; }
      else { s.x = s.tx; s.y = s.ty; s.z = 0; }
      if (s.t >= s.fly + s.fuse) { explode(s.x, s.y, s.r, s.dmg, s.w); if (s.evo) for (let j = 0; j < 3; j++) { const a = rnd(0, TAU); G.blasts.push({ x: s.x + Math.cos(a) * s.r, y: s.y + Math.sin(a) * s.r * 0.7, r: s.r * 0.7, t: -0.15 - j * 0.08, life: 0.35, dmg: s.dmg * 0.6, w: s.w, pending: true }); } G.shots.splice(i, 1); }
      continue;
    }
    if (s.kind === 'orb') {
      if (!s.tg || s.tg.hp <= 0) s.tg = nearest(s.x, s.y, 220);
      if (s.tg) { const dx = s.tg.x - s.x, dy = s.tg.y - s.tg.h * s.tg.sc / 2 - s.y, d = Math.hypot(dx, dy) || 1; s.vx += dx / d * 900 * dt; s.vy += dy / d * 900 * dt; }
      const v = Math.hypot(s.vx, s.vy) || 1, mv = 190; if (v > mv) { s.vx *= mv / v; s.vy *= mv / v; }
      s.tr += dt; if (s.tr > 0.03) { s.tr = 0; G.parts.push({ x: s.x, y: s.y, vx: 0, vy: 0, c: s.evo ? '#ee8e2e' : '#72d6ce', t: 0, life: 0.25, sz: 1 }); }
    } else if (s.kind === 'boom') {
      if (!s.back) { const k = Math.pow(0.12, dt); s.vx *= k; s.vy *= k; if (s.t > 0.5) { s.back = true; s.hit = new Set(); } }
      else { const dx = G.p.x - s.x, dy = G.p.y - 10 - s.y, d = Math.hypot(dx, dy) || 1; s.vx = dx / d * 270; s.vy = dy / d * 270; if (d < 10) { G.shots.splice(i, 1); continue; } }
    }
    if (s.g) s.vy += s.g * dt;
    s.x += s.vx * dt; s.y += s.vy * dt;
    if (s.vr) s.rot += s.vr * dt;
    queryR(s.x, s.y, s.r + 14, e => {
      if (s.pierce <= 0 || s.hit.has(e)) return;
      if (dist2(s.x, s.y, e.x, e.y - e.h * e.sc / 2) > (e.r + s.r) * (e.r + s.r)) return;
      s.hit.add(e); s.pierce--; damage(e, s.dmg, s.w, s.vx, s.vy, s.kind === 'axe' ? 0.6 : 1);
      if (s.split > 0) {
        const a0 = Math.atan2(s.vy, s.vx), k = s.split;
        for (let j = 0; j < k; j++) { const a = a0 + (j - (k - 1) / 2) * 0.55 + (k % 2 ? 0 : 0); G.shots.push({ w: s.w, kind: 'arrow', spr: 'weapon_arrow', x: s.x, y: s.y, vx: Math.cos(a) * 280, vy: Math.sin(a) * 280, rot: a, life: 0.45, t: 0, dmg: s.dmg * 0.6, pierce: 1, r: 4, hit: new Set([e]), split: s.evo && s.gen < 1 ? 2 : 0, evo: s.evo, gen: s.gen + 1, moon: true }); }
        s.split = 0;
      }
      if (s.bounce > 0) {
        const t2 = nearest(s.x, s.y, 130, s.hit);
        if (t2) { const a = Math.atan2(t2.y - t2.h / 2 - s.y, t2.x - s.x); s.vx = Math.cos(a) * 300; s.vy = Math.sin(a) * 300; s.rot = a; s.bounce--; s.pierce = 1; s.life = s.t + 0.6; }
      }
    });
    if (s.pierce <= 0 || s.t > s.life) { if (s.boom && s.pierce <= 0) explode(s.x, s.y, s.boom, s.dmg * 0.7, s.w); G.shots.splice(i, 1); }
  }
}
function explode(x, y, r, dmg, w, o) {
  o = o || {};
  if (w && w.pl) use(w.pl);
  G.blasts.push({ x, y, r, t: 0, life: 0.35, rock: o.style === 'rock' });
  queryR(x, y, r + 16, e => { if (dist2(x, y, e.x, e.y) < (r + e.r) * (r + e.r)) { damage(e, dmg, w, e.x - x, e.y - y, o.style === 'rock' ? 0.8 : 1.8); if (o.stun && e.hp > 0 && !e.boss && !e.static) e.stunT = o.stun; } });
  if (o.zone) G.zones.push({ x, y, r: r * 0.85, t: 0, life: 3, dmg: o.zone, w, tick: 0 });
  if (o.style === 'rock') {
    G.shake = Math.max(G.shake, 0.1); sfx('thunk', 0.35, 0.2, 0.05);
    burst(x, y - 2, Math.round(6 + r * 0.4), ['#775c55', '#aa8d7a', '#483b3a', '#c6b7be'], r * 2.4, 0.4, 160);
    return;
  }
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
function canEvolve(w) { return !w.evo && w.lvl >= 5 && (G.passives[pairOf(w.id)] || 0) > 0; }
const nChoices = () => 3 + (G.base.insight || 0) + (G.hero === 'ysolde' ? 1 : 0);
function choicePool() {
  const out = [];
  for (const w of G.weapons) if (canEvolve(w)) out.push({ kind: 'evo', id: w.id, wt: 0 });
  const needPair = new Set(G.weapons.filter(w => !w.evo && w.lvl >= 4).map(w => pairOf(w.id)));
  for (const w of G.weapons) if (!w.evo && w.lvl < 5) out.push({ kind: 'w', id: w.id, wt: 3 });
  if (G.weapons.length < 6) for (const id in (HKIT[G.hero] || WP)) if (!weapon(id) && !WP[id].sig) out.push({ kind: 'w', id, wt: 1.6 });
  const owned = Object.keys(G.passives);
  for (const id of owned) if (G.passives[id] < PS[id].max) out.push({ kind: 'p', id, wt: 2.2 });
  if (owned.length < 6) for (const id in PS) if (!G.passives[id]) out.push({ kind: 'p', id, wt: needPair.has(id) ? 5 : 1.3 });
  return out;
}
function rollChoices(n) {
  const all = choicePool(), res = all.filter(c => c.kind === 'evo').slice(0, Math.max(1, n - 1)), pool = all.filter(c => c.kind !== 'evo');
  while (res.length < n && pool.length) {
    const tot = pool.reduce((a, b) => a + b.wt, 0); let r = Math.random() * tot, idx = 0;
    for (; idx < pool.length; idx++) { r -= pool[idx].wt; if (r <= 0) break; }
    res.push(pool.splice(Math.min(idx, pool.length - 1), 1)[0]);
  }
  if (!res.length) { res.push({ kind: 'heal' }); res.push({ kind: 'gold' }); }
  for (const c of res) c.rar = G.shrineOpen ? 0 : rollRarity(c);
  return res;
}
function applyChoice(c) {
  if (c.kind === 'evo') { const w = weapon(c.id); if (w && canEvolve(w)) { w.evo = true; SV.stats.evos++; banner(`${nm(WP[c.id])[3]} ${L().evolved}`); sfx('fanfare', 1, 0); G.shake = 0.3; burst(G.p.x, G.p.y - 10, 50, ['#da4e38', '#facb3e', '#fdf7ed'], 160, 0.7, 0); } }
  else if (c.kind === 'w') { const w = weapon(c.id); if (w) w.lvl++; else addWeapon(c.id); }
  else if (c.kind === 'p') { G.passives[c.id] = (G.passives[c.id] || 0) + 1; if (c.id === 'vitality') G.p.hp += 20; }
  else if (c.kind === 'heal') G.p.hp = Math.min(ST.maxhp, G.p.hp + 30);
  else if (c.kind === 'gold') G.gold += 25;
  else if (c.kind === 'b') { BLESS[c.id].f(G.bl); if (BLESS[c.id].heal) { refreshStats(); G.p.hp = ST.maxhp; } }
  refreshStats(); G.p.hp = Math.min(G.p.hp, ST.maxhp); buildInv();
}
function choiceInfo(c) {
  const Lx = L();
  if (c.kind === 'heal') return { icon: 'k_potion_03', t: Lx.heal, d: Lx.healD, tag: '' };
  if (c.kind === 'gold') return { icon: 'crate', t: Lx.goldBag, d: Lx.goldBagD, tag: '' };
  if (c.kind === 'b') { const b = BLESS[c.id]; return { icon: b.icon, t: T('bl.' + c.id), d: statText(b.desc) + (b.extra ? str('gap') + T(b.extra) : ''), tag: '' }; }
  if (c.kind === 'evo') { const d = nm(WP[c.id]); return { icon: WP[c.id].evoIcon, t: d[3], d: d[4], tag: Lx.evoTag, cls: 'evo' }; }
  if (c.kind === 'w') {
    const d = nm(WP[c.id]), w = weapon(c.id);
    if (!w) { const pr = nm(PS[pairOf(c.id)])[0]; return { icon: WP[c.id].icon, t: d[0], d: d[1] + ' (' + Lx.pairsW(pr) + ')', tag: Lx.isNew, cls: 'new' }; }
    return { icon: WP[c.id].icon, t: d[0], d: d[2][w.lvl - 1] + (w.lvl === 4 && !G.passives[pairOf(c.id)] ? ' (' + Lx.pairsW(nm(PS[pairOf(c.id)])[0]) + ')' : ''), tag: Lx.lv(w.lvl + 1) };
  }
  const d = nm(PS[c.id]), lv = G.passives[c.id] || 0;
  const pairW = Object.keys(HKIT[G.hero] || {}).find(k => pairOf(k) === c.id && (weapon(k) || WP[k].sig)) || Object.keys(HKIT[G.hero] || {}).find(k => pairOf(k) === c.id);
  return { icon: PS[c.id].icon, t: d[0], d: d[1] + (pairW ? ' (' + Lx.pairsP(nm(WP[pairW])[0]) + ')' : ''), tag: lv ? Lx.lv(lv + 1) : Lx.isNew, cls: lv ? '' : 'new' };
}
let curChoices = [];
function openShrine() {
  state.mode = 'level'; gpStop(); G.shrineOpen = true; SV.stats.shrines++;
  sfx('fanfare', 0.7, 0);
  burst(G.p.x, G.p.y - 10, 40, ['#facb3e', '#fdf7ed', '#ee8e2e'], 140, 0.6, 0);
  $('lvTitle').textContent = T('shrine');
  showChoices(shuffle(Object.keys(BLESS)).slice(0, 3).map(id => ({ kind: 'b', id })));
  showScreen('sLevel');
}
function openLevel() {
  $('lvTitle').textContent = T('levelUp');
  state.mode = 'level'; gpStop();
  sfx('levelup', 0.9, 0); ring(G.p.x, G.p.y - 8, 4, 60, 0.45, '#72d6ce', 1);
  // level-up shockwave pushes enemies back
  queryR(G.p.x, G.p.y, 70, e => { const dx = e.x - G.p.x, dy = e.y - G.p.y, d = Math.hypot(dx, dy) || 1; e.kbx += dx / d * 160 * (e.boss ? 0.1 : 1); e.kby += dy / d * 160 * (e.boss ? 0.1 : 1); });
  burst(G.p.x, G.p.y - 10, 40, ['#72d6ce', '#cae6f5', '#fdf7ed', '#49a790'], 140, 0.6, 0);
  showChoices(rollChoices(nChoices()));
  showScreen('sLevel');
  if (typeof NET !== 'undefined' && NET.role === 'host') NET.levelUp();
}
function showChoices(list) {
  curChoices = list;
  const box = $('choices'); box.innerHTML = '';
  list.forEach((c, i) => {
    const inf = choiceInfo(c);
    const b = document.createElement('button'); b.className = 'choice' + (c.rar ? ' r' + c.rar : '');
    b.innerHTML = `<div class="ic"></div><div class="t"><span></span><em class="${inf.cls || ''}"></em></div><div class="d"></div>`;
    b.querySelector('.ic').appendChild(iconCanvas(inf.icon, U * 16));
    b.querySelector('.t span').textContent = `${i + 1}. ${inf.t}`; b.querySelector('.t em').textContent = inf.tag; b.querySelector('.d').textContent = inf.d;
    if (c.rar && c.kind !== 'evo') { const rb = document.createElement('div'); rb.className = 'rar'; rb.textContent = T('rar' + c.rar) + ' · ' + T('rarD' + c.rar); b.appendChild(rb); }
    b.style.animationDelay = (i * 0.07) + 's';
    b.onmouseenter = () => sfx('move', 0.4, 0);
    b.onclick = () => {
      if (state.mode !== 'level') return;
      if (G.guest) { sfx('select', 0.7, 0); NET.pick(i); return; }
      sfx('select', 0.7, 0); applyChoice(c); applyRarity(c); if (c.rar >= 2) sfx('fanfare', 0.8, 0, 0.05, c.rar === 3 ? 1.15 : 1);
      if (G.shrineOpen) { G.shrineOpen = false; $('lvTitle').textContent = T('levelUp'); } else G.pendingLv--;
      if (G.pendingLv > 0) { showChoices(rollChoices(nChoices())); sfx('levelup', 0.7, 0); if (NET.role === 'host' && G.mode === 'party') NET.levelUp(); }
      else if (NET.role === 'host' && G.mode === 'party' && NET.waiting.size) NET.hostWait();
      else { showScreen(null); state.mode = 'play'; gpStart(); }
    };
    box.appendChild(b);
  });
  $('lvWait').textContent = '';
  const topR = Math.max(0, ...list.map(c => c.kind === 'evo' ? 0 : (c.rar || 0)));
  if (topR === 3) { sfx('fanfare', 0.9, 0, 0.05, 1.2); } else if (topR === 2) sfx('chest', 0.6, 0, 0.05, 1.2);
  const rb = $('bReroll'); if (G.guest) { rb.style.display = 'none'; return; } rb.textContent = curPL.rerolls > 0 ? L().reroll(curPL.rerolls) : L().adReroll; rb.style.display = !G.shrineOpen && (curPL.rerolls > 0 || (!NOREW() && (curPL.adRerolls || 0) < 3)) ? '' : 'none';
}
$('bReroll').onclick = () => {
  if (state.mode !== 'level' || G.shrineOpen) return;
  if (curPL.rerolls > 0) { curPL.rerolls--; sfx('move', 0.6, 0); showChoices(rollChoices(nChoices())); return; }
  if (NOREW() || (curPL.adRerolls || 0) >= 3) return;
  ADS.show('rewarded', () => { curPL.adRerolls = (curPL.adRerolls || 0) + 1; sfx('move', 0.6, 0); showChoices(rollChoices(nChoices())); }, () => { $('bReroll').textContent = L().adFail; });
};

function remoteChest(pl) {
  use(pl); SV.stats.chests++;
  const evo = G.weapons.find(canEvolve); let msg = '';
  if (evo) { evo.evo = true; refreshStats(); msg = `${nm(WP[evo.id])[3]} ${L().evolved}`; }
  else { const pool = choicePool().filter(c => c.kind === 'w' ? weapon(c.id) : G.passives[c.id]); const c = pool.length ? pick(pool) : null; if (c) { applyChoice(c); msg = choiceInfo(c).t + ' ' + choiceInfo(c).tag; } }
  G.gold += Math.round(irnd(10, 40) * SGOLD() * ST.greed);
  if (typeof NET !== 'undefined') NET.toPlayer(pl, { t: 'msg', k: 'chest', text: msg, evo: evo ? evo.id : null });
  use(LPL());
}
function remoteShrine(pl) {
  use(pl); const id = pick(Object.keys(BLESS)); applyChoice({ kind: 'b', id });
  if (typeof NET !== 'undefined') NET.toPlayer(pl, { t: 'msg', k: 'shrine', id });
  use(LPL());
}
// chest
let chestAnim = null;
function openChest() {
  state.mode = 'chest'; gpStop(); showScreen('sChest'); sfx('chest', 0.9, 0); SV.stats.chests++;
  const evo = G.weapons.find(canEvolve);
  const rewards = [];
  if (evo) rewards.push({ kind: 'evo', id: evo.id });
  else {
    const r = Math.random(), n = r < 0.06 ? 5 : r < 0.26 ? 3 : 1;
    for (let i = 0; i < n; i++) {
      const pool = choicePool().filter(c => (c.kind === 'w' ? weapon(c.id) : G.passives[c.id]) && !rewards.some(q => q.kind === c.kind && q.id === c.id));
      const c = pool.length ? pick(pool) : { kind: 'gold' };
      rewards.push(c); if (c.kind !== 'gold') applyChoice(c); else G.gold += 25;
    }
  }
  if (evo) { evo.evo = true; SV.stats.evos++; refreshStats(); buildInv(); }
  const goldBonus = Math.round(irnd(10, 40) * SGOLD()); G.gold += Math.round(goldBonus * ST.greed);
  $('chestOut').innerHTML = ''; $('bTake').disabled = true;
  const reel = $('reel'); reel.innerHTML = '';
  const allIcons = [...Object.values(WP).map(w => w.icon), ...Object.values(PS).map(p => p.icon)];
  const slots = rewards.map(() => { const s = document.createElement('div'); s.className = 'slot'; reel.appendChild(s); return s; });
  const jack = rewards.length >= 5 ? 2 : rewards.length >= 3 ? 1 : 0;
  if (jack === 2) { G.gold += Math.round(goldBonus * 3 * ST.greed); }
  chestAnim = { t: 0, rewards, slots, allIcons, shown: 0, goldBonus: jack === 2 ? goldBonus * 4 : goldBonus, tick: 0, jack };
  $('chestJack').textContent = ''; $('chestJack').className = ''; if ($('bChestAd')) $('bChestAd').style.display = 'none'; $('sChest').classList.remove('jack1', 'jack2');
}
function chestAdBtn(A) {
  const b = $('bChestAd'); if (!b) return;
  const can = !NOREW() && !A.adUsed && !A.rewards.some(r => r.kind === 'evo') && G.mode !== 'party';
  b.style.display = can ? '' : 'none'; if (!can) return; b.disabled = false; b.textContent = T('adMore');
  b.onclick = () => { b.disabled = true; ADS.show('rewarded', () => {
    A.adUsed = true; b.style.display = 'none';
    const pool = choicePool().filter(c => (c.kind === 'w' ? weapon(c.id) : G.passives[c.id]) && !A.rewards.some(q => q.kind === c.kind && q.id === c.id));
    const c = pool.length ? pick(pool) : { kind: 'gold' }; A.rewards.push(c); if (c.kind !== 'gold') applyChoice(c); else G.gold += 25;
    const s = document.createElement('div'); s.className = 'slot pop'; s.appendChild(iconCanvas(iconForReward(c), U * 15));
    const lv = document.createElement('b'), cap = document.createElement('i'); lv.className = 'lv'; cap.className = 'cap';
    if (c.kind === 'gold') cap.textContent = '+25'; else { cap.textContent = c.kind === 'w' ? nm(WP[c.id])[0] : nm(PS[c.id])[0]; lv.textContent = c.kind === 'w' ? weapon(c.id).lvl : G.passives[c.id]; }
    s.append(lv, cap); $('reel').appendChild(s); sfx('pick', 0.8, 0, 0.04, 1.3);
  }, () => { b.textContent = L().adFail; }); };
}
function iconForReward(c) { if (c.kind === 'evo') return WP[c.id].evoIcon; if (c.kind === 'w') return WP[c.id].icon; if (c.kind === 'p') return PS[c.id].icon; return 'coin_anim_f0'; }
function updateChestUI(dt) {
  const A = chestAnim; if (!A) return;
  A.t += dt;
  // chest canvas
  const c = $('chestCv'), x = c.getContext('2d'); x.imageSmoothingEnabled = false; x.clearRect(0, 0, c.width, c.height);
  const fr = A.t < 0.25 ? 0 : A.t < 0.45 ? 1 : 2, f = AT['chest_full_open_anim_f' + fr];
  if (A.jack && A.t > 0.45 && !A.rays) { A.rays = true; $('sChest').classList.add('rays'); }
  x.drawImage(sheet, f[0], f[1], 16, 16, 32, 22, 32, 32);
  if (A.t > 0.45) { for (let i = 0; i < 10; i++) { const a = A.t * 2 + i * 0.63, r = 18 + Math.sin(A.t * 6 + i) * 4; x.fillStyle = i % 2 ? '#facb3e' : '#fdf7ed'; x.fillRect(Math.round(48 + Math.cos(a) * r), Math.round(30 + Math.sin(a) * r * 0.6), 1, 1); } }
  // reels spin then stop one by one
  const stopAt = i => 1.0 + i * 0.45;
  A.slots.forEach((s, i) => {
    if (A.t < stopAt(i)) {
      A.tick -= dt;
      if (A.t > 0.4 && (s.dataset.k || 0) < A.t * 14) { s.dataset.k = Math.ceil(A.t * 14); s.innerHTML = ''; s.appendChild(iconCanvas(pick(A.allIcons), U * 15)); if (i === 0) sfx('move', 0.25, 0.3, 0.06); }
    } else if (!s.dataset.done) {
      s.dataset.done = 1; s.innerHTML = ''; s.appendChild(iconCanvas(iconForReward(A.rewards[i]), U * 15)); sfx('pick', 0.7, 0, 0.04, 1 + i * 0.08);
      const out = $('chestOut'), r = A.rewards[i], cap = document.createElement('i'), lv = document.createElement('b');
      cap.className = 'cap'; lv.className = 'lv';
      if (r.kind === 'evo') { s.classList.add('evo'); cap.textContent = nm(WP[r.id])[3]; const line = document.createElement('div'); line.className = 'evo'; line.textContent = `${nm(WP[r.id])[3]} ${L().evolved}`; out.appendChild(line); sfx('fanfare', 1, 0); G.shake = 0.3; }
      else if (r.kind === 'gold') cap.textContent = '+25';
      else { cap.textContent = r.kind === 'w' ? nm(WP[r.id])[0] : nm(PS[r.id])[0]; lv.textContent = r.kind === 'w' ? weapon(r.id).lvl : G.passives[r.id]; if ((r.kind === 'w' ? weapon(r.id).lvl : G.passives[r.id]) >= (r.kind === 'w' ? 5 : PS[r.id].max)) s.classList.add('max'); }
      s.append(lv, cap); s.classList.add('pop');
      if (i === A.slots.length - 1) {
        const g = document.createElement('div'); g.className = 'cg'; g.appendChild(iconCanvas('coin_anim_f0', U * 6)); const gb = document.createElement('b'); gb.textContent = '+' + Math.round(A.goldBonus * ST.greed); g.appendChild(gb); out.appendChild(g);
        sfx('coins', 0.8, 0); $('bTake').disabled = false; $('bTake').focus();
        chestAdBtn(A);
        if (A.jack) { const j = $('chestJack'); j.textContent = A.jack === 2 ? 'JACKPOT' : 'GREAT'; j.className = 'show j' + A.jack; $('sChest').classList.add('jack' + A.jack); sfx('fanfare', 1, 0, 0.05, A.jack === 2 ? 1.2 : 1); G.shake = 0.4; }
      }
    }
  });
}
$('bTake').onclick = () => { if (state.mode !== 'chest') return; $('sChest').classList.remove('rays', 'jack1', 'jack2'); sfx('select', 0.6, 0); chestAnim = null; showScreen(null); state.mode = 'play'; if (G.pendingLv > 0) openLevel(); else gpStart(); };

// ------------------------------------------------------------- update
function localInput() {
  let mx = (keys['d'] || keys['arrowright'] ? 1 : 0) - (keys['a'] || keys['arrowleft'] ? 1 : 0);
  let my = (keys['s'] || keys['arrowdown'] ? 1 : 0) - (keys['w'] || keys['arrowup'] ? 1 : 0);
  if (stick.on && Math.hypot(stick.x, stick.y) > 0.15) { mx = stick.x; my = stick.y; }
  return [mx, my];
}
// moves a player owned by this machine (also used by party guests for their own hero)
function movePlayer(pl, dt, mx, my) {
  const p = pl.p, ml = Math.hypot(mx, my);
  p.moving = ml > 0.1;
  if (p.moving) { mx /= Math.max(1, ml); my /= Math.max(1, ml); p.dirx = mx; p.diry = my; if (Math.abs(mx) > 0.15) p.face = mx > 0 ? 1 : -1; }
  if (p.dashCd > 0) p.dashCd -= dt;
  if (p.dashT > 0) { p.dashT -= dt; mx = p.ddx * 4.4; my = p.ddy * 4.4; G.ghosts.push({ x: p.x, y: p.y, t: 0, f: p.face, pl }); }
  if (pl.chillT > 0) pl.chillT -= dt;
  const pspd = pl.ST.spd * (G.hasteT > 0 ? 1.3 : 1) * (pl.chillT > 0 ? 0.65 : 1);
  p.x = clamp(p.x + mx * pspd * dt, 8, AW - 8); p.y = clamp(p.y + my * pspd * dt, 14, AH - 2);
  for (const o of props) if (o.solid) { const dx = p.x - o.x, dy = p.y - o.y, d = Math.hypot(dx, dy); if (d < o.r + 5 && d > 0) { p.x = o.x + dx / d * (o.r + 5); p.y = o.y + dy / d * (o.r + 5); } }
  p.anim += dt * (p.moving ? 9 : 5);
}
function tickPlayer(pl, dt) {
  const p = pl.p, tr = pl.tr;
  if (p.inv > 0) p.inv -= dt; if (p.hurtT > 0) p.hurtT -= dt;
  if (pl.down) return;
  p.hp = Math.min(ST.maxhp, p.hp + ST.regen * dt);
  if (pl.hero === 'knight' && !tr.shield) { tr.shT += dt; if (tr.shT >= 10) { tr.shield = true; sfx('pick', 0.4, 0.1); } }
  tr.moveT = p.moving ? tr.moveT + dt : 0;
  if (tr.ripT > 0) tr.ripT -= dt;
  tr.healT += dt; if (tr.healT >= 1) { tr.healT = 0; tr.healAcc = 0; }
  if (tr.dashHit && p.dashT > 0) queryR(p.x, p.y - 6, 20, e => { if (e.static || tr.dashHit.has(e) || dist2(p.x, p.y - 6, e.x, e.y) > (e.r + 9) * (e.r + 9)) return; tr.dashHit.add(e); damage(e, 22 * (1 + 0.05 * G.lvl), null, e.x - p.x, e.y - p.y, 1.2); });
}
function update(dt) {
  const LP = LPL();
  if (G.hitstop > 0) { G.hitstop -= dt; dt *= 0.1; }
  if (G.slowT > 0) { G.slowT -= dt; dt *= 0.35; }
  G.frameKills = 0;
  for (let i = G.words.length - 1; i >= 0; i--) { G.words[i].t += dt; if (G.words[i].t > 1.1) G.words.splice(i, 1); }
  if (G.coinT > 0) G.coinT -= dt; else G.coinChain = 0;
  { const mh = ST.maxhp, q = G.p; if (q.hp > 0 && q.hp < mh * 0.25) { G.beatT -= dt; if (G.beatT <= 0) { G.beatT = 0.85; sfx('thunk', 0.35, 0, 0.3, 0.55); } } }
  G.t += dt;
  // players
  for (const pl of G.players) {
    use(pl);
    if (pl.local && !pl.down) { const [mx, my] = localInput(); movePlayer(pl, dt, mx, my); }
    else if (pl.input) { // remote hero: the guest moves it, we trust its position
      const q = pl.input, p = pl.p;
      p.x = clamp(q.x, 8, AW - 8); p.y = clamp(q.y, 14, AH - 2); p.face = q.f; p.moving = !!q.m; p.dirx = q.dx; p.diry = q.dy; p.anim += dt * (p.moving ? 9 : 5);
      if (q.dash && !pl.dashSeen) { onDash(pl); p.inv = Math.max(p.inv, 0.34); p.dashT = 0.18; }
      pl.dashSeen = !!q.dash; if (p.dashT > 0) { p.dashT -= dt; G.ghosts.push({ x: p.x, y: p.y, t: 0, f: p.face, pl }); }
    }
    tickPlayer(pl, dt);
  }
  // downed heroes get back up when a teammate stands next to them
  if (G.players.length > 1) for (const pl of G.players) if (pl.down) {
    const near = G.players.some(o => o !== pl && !o.down && dist2(o.p.x, o.p.y, pl.p.x, pl.p.y) < 22 * 22);
    pl.reviveT = near ? pl.reviveT + dt : Math.max(0, pl.reviveT - dt);
    if (pl.reviveT >= 2.5) { use(pl); pl.down = false; pl.p.hp = Math.round(ST.maxhp * 0.4); pl.p.inv = 2; pl.reviveT = 0; sfx('heal', 0.9, 0); burst(pl.p.x, pl.p.y - 8, 26, ['#4ba747', '#fdf7ed', '#cae6f5'], 100, 0.6, 0); }
  }
  use(LP); const p = G.p;
  for (let i = G.ghosts.length - 1; i >= 0; i--) { G.ghosts[i].t += dt; if (G.ghosts[i].t > 0.25) G.ghosts.splice(i, 1); }
  if (G.redT > 0) G.redT -= dt; if (G.flashT > 0) G.flashT -= dt;
  G.fzIdle += dt; if (G.fzIdle > 2.5) G.fz = Math.max(0, G.fz - 0.1 * dt);
  if (G.frenzyT > 0) G.frenzyT -= dt; else if (G.fz >= 1) { G.fz = 0; G.frenzyT = 8; banner(T('frenzy')); sfx('fanfare', 0.8, 0); }
  if (G.freezeT > 0) G.freezeT -= dt; if (G.hasteT > 0) G.hasteT -= dt;
  for (let i = G.risers.length - 1; i >= 0; i--) {
    const r = G.risers[i]; r.t -= dt;
    if (r.t <= 0) { G.risers.splice(i, 1); if (G.enemies.length < 300) { const e = spawnEnemy(r.type, r.x, r.y); e.risen = true; e.hp = e.maxhp = e.maxhp * 0.6; e.flash = 0.2; burst(r.x, r.y - 6, 10, ['#fdf7ed', '#cae6f5', '#aa8d7a'], 60, 0.4, 0); } }
  }

  if (!G.won) spawner(dt);
  buildGrid();
  for (const pl of G.players) if (!pl.down) { use(pl); fireWeapons(dt); }
  updateSwings(dt);
  updateShots(dt);
  for (let i = G.zones.length - 1; i >= 0; i--) {
    const z = G.zones[i]; z.t += dt; z.tick -= dt;
    if (z.tick <= 0) { z.tick = 0.4; if (z.w && z.w.pl) use(z.w.pl); queryR(z.x, z.y, z.r + 12, e => { if (!e.static && dist2(z.x, z.y, e.x, e.y) < (z.r + e.r) * (z.r + e.r)) damage(e, z.dmg, z.w, 0, 0, 0); }); }
    if (Math.random() < dt * 30) G.parts.push({ x: z.x + rnd(-z.r, z.r) * 0.8, y: z.y + rnd(-z.r, z.r) * 0.55, vx: 0, vy: rnd(-30, -10), c: pick(['#facb3e', '#ee8e2e', '#da4e38']), t: 0, life: 0.4, sz: 1 });
    if (z.t > z.life) G.zones.splice(i, 1);
  }
  for (let i = G.zaps.length - 1; i >= 0; i--) { G.zaps[i].t += dt; if (G.zaps[i].t > 0.18) G.zaps.splice(i, 1); }
  for (let i = G.slashes.length - 1; i >= 0; i--) { G.slashes[i].t += dt; if (G.slashes[i].t > G.slashes[i].life) G.slashes.splice(i, 1); }
  use(LP);

  // enemies
  const farR = Math.hypot(VW, VH) * 0.9;
  for (let i = G.enemies.length - 1; i >= 0; i--) {
    const e = G.enemies[i];
    if (e.hp <= 0) { G.enemies.splice(i, 1); continue; }
    if (e.static) {
      if (e.flash > 0) e.flash -= dt;
      for (const pl of G.players) { if (!pl.local) continue; const q = pl.p, ox = q.x - e.x, oy = q.y - e.y, od = Math.hypot(ox, oy); if (od < e.r + 5 && od > 0) { q.x = e.x + ox / od * (e.r + 5); q.y = e.y + oy / od * (e.r + 5); } }
      continue;
    }
    if (e.poison) {
      const po = e.poison; po.t -= dt; po.acc += po.dps * dt;
      if (po.acc >= 1) { const a = po.acc | 0; po.acc -= a; e.hp -= a; e.flash = Math.max(e.flash, 0.04); if (po.pl && po.pl.weapons) { const fw = po.pl.weapons.find(x => x.id === 'fang'); if (fw) fw.dmg += a; } if (Math.random() < 0.15 && SV.settings.nums) G.nums.push({ x: e.x, y: e.y - e.h * e.sc - 2, v: a, t: 0, poison: true });
        if (e.hp <= 0) { use(po.pl || LP); if (po.evo) queryR(e.x, e.y, 40, o => { if (o !== e && !o.static && !o.poison) o.poison = { dps: po.dps * 0.7, t: 2.5, pl: po.pl, evo: false, acc: 0 }; }); kill(e); use(LP); continue; } }
      if (po.t <= 0) e.poison = null;
    }
    if (e.flash > 0) e.flash -= dt;
    if (e.stunT > 0) { e.stunT -= dt; e.kbx *= Math.pow(0.0005, dt); e.kby *= Math.pow(0.0005, dt); continue; }
    if (G.freezeT > 0 && !e.boss) continue;
    e.anim += dt * 8;
    if (G.players.length > 1) { e.tgtT = (e.tgtT || 0) - dt; if (e.tgtT <= 0 || !e.tgt || e.tgt.down) { e.tgtT = 0.5; let bd = 1e12; for (const q of G.players) { if (q.down) continue; const dd = dist2(q.p.x, q.p.y, e.x, e.y); if (dd < bd) { bd = dd; e.tgt = q; } } } }
    const TP = (G.players.length > 1 && e.tgt) ? e.tgt : LP, tp = TP.p;
    let dx = tp.x - e.x, dy = tp.y - e.y; const d = Math.hypot(dx, dy) || 1;
    let sp = e.spd;
    if (e.slowT > 0) { e.slowT -= dt; sp *= 1 - (e.slow || 0); }
    if (G.bloodT > 0) sp *= 1.25;
    const BH = EN[e.type];
    if (BH.shoot && !e.boss) { if (e.shT == null) e.shT = rnd(1.5, 3.5); e.shT -= dt; if (e.shT <= 0 && d < 165 && !((G.castCd || 0) > G.t)) { G.castCd = G.t + 0.45; e.shT = rnd(4.0, 5.6); if (e.type === 'gshaman') eShot(e.x, e.y - e.h * e.sc / 2, Math.atan2(dy, dx), 76, e.dmg * 0.5, 10, clamp(d / 76, 0.6, 2.2)); else if (e.type === 'orc_shaman') eShot(e.x, e.y - e.h * e.sc / 2, Math.atan2(dy, dx), 80, e.dmg * 0.5, 3, clamp(d / 80, 0.6, 2.2)); else eShot(e.x, e.y - e.h * e.sc / 2, Math.atan2(dy, dx), 60, e.dmg * 0.6, 2, 5); e.flash = 0.12; } if (e.shT > 2.9) sp *= 0.25; }
    if (BH.leap && !e.boss) { if (e.lpT == null) e.lpT = rnd(2, 4); e.lpT -= dt; if (e.lp > 0) { e.lp -= dt; sp *= 3.3; } else if (e.lpT <= 0 && d < 130) { e.lpT = rnd(3, 5); e.lp = 0.32; } else if (e.lpT < 0.35) { sp *= 0.1; e.flash = Math.max(e.flash, ((e.lpT * 20) | 0) % 2 ? 0.04 : 0); } }
    if (BH.flee) { e.life = (e.life || 16) - dt; if (e.life <= 0) { e.hp = 0; continue; } }
    if (e.bounty) { e.bounty -= dt; if (e.bounty <= 0) { e.bounty = 0; e.elite = false; e.gone = true; e.hp = 0; banner(T('bountyLost')); continue; } }
    if (e.spinT > 0) { e.spinT -= dt; sp *= 0.25; e.spAcc = (e.spAcc || 0) + dt; while (e.spAcc > 0.09) { e.spAcc -= 0.09; e.spinA += 0.42; for (let k2 = 0; k2 < 2; k2++) eShot(e.x, e.y - 12, e.spinA + k2 * Math.PI, 82, e.dmg * 0.4, BKIND[e.type] || 0); } }
    if (e.burst > 0) { e.burstT = (e.burstT || 0) - dt; if (e.burstT <= 0) { e.burstT = 0.3; e.burst--; const a0 = Math.atan2(dy, dx); for (let k2 = -2; k2 <= 2; k2++) eShot(e.x, e.y - 12, a0 + k2 * 0.22, 118, e.dmg * 0.45, BKIND[e.type] || 0); sfx('shoot', 0.4, 0.2); } sp *= 0.3; }
    if (e.swarm) { e.swarm.t -= dt; if (e.swarm.t <= 0) e.swarm = null; }
    if (e.boss) {
      e.dashT -= dt; e.summonT -= dt;
      if (e.dash > 0) { e.dash -= dt; sp *= 3.4; }
      else if (e.tele > 0) { e.tele -= dt; sp = 0; e.flash = Math.max(e.flash, (e.tele * 10 | 0) % 2 ? 0.05 : 0); if (e.tele <= 0) bossAct(e, dx / d, dy / d); }
      else if (e.dashT <= 0) {
        const pats = EN[e.type].pats || ['dash']; let k2 = pick(pats); if (pats.length > 1 && k2 === e.lastPat) k2 = pick(pats); e.lastPat = k2; e.dashT = rnd(3, 4.6);
        if (k2 === 'slam') bossSlam(e, tp); else if (k2 === 'spiral') { e.spinT = 2.2; e.spinA = rnd(0, TAU); } else { e.tele = 0.55; e.patk = k2; }
      }
      const st = EN[e.type].summon; if (e.summonT <= 0 && st) { e.summonT = 7; for (let k = 0; k < 6; k++) spawnEnemy(st, e.x + rnd(-20, 20), e.y + rnd(-14, 14)); }
      if (e.dash > 0) { dx = e.dx; dy = e.dy; }
    }
    let nx = e.dash > 0 ? dx : dx / d, ny = e.dash > 0 ? dy : dy / d;
    if (BH.zig && !(e.dash > 0)) { e.zg = (e.zg || rnd(0, 6)) + dt * 5; const za = Math.sin(e.zg) * 0.75, zc = Math.cos(za), zs = Math.sin(za), zx = nx * zc - ny * zs; ny = nx * zs + ny * zc; nx = zx; }
    if (BH.flee) { nx = -nx; ny = -ny; }
    if (G.drumT > 0 && !e.boss) sp *= 1.4;
    if (e.charge) { e.charge.t -= dt; nx = e.charge.vx; ny = (dy / d) * 0.25; sp *= 2.4; if (e.charge.t <= 0) e.charge = null; }
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
    if (d < e.r + 6 && !TP.down && e.dmg > 0) { use(TP); hurtPlayer(e.dmg); use(LP); }
    // recycle stragglers
    if (!e.boss && !e.elite && !e.charge && e.type !== 'mimic' && d > farR) { const [x, y] = spawnPos(); e.x = x; e.y = y; }
  }

  // spike traps
  for (const sk of spikes) {
    if (spikeFrame(sk, G.t) !== 3) continue;
    for (const pl of G.players) if (!pl.down && Math.abs(pl.p.x - sk.x) < 7 && Math.abs(pl.p.y - 3 - sk.y) < 7) { use(pl); hurtPlayer(8 * SHP()); use(LP); }
    queryR(sk.x, sk.y, 12, e => { if (e.static || e.boss || Math.abs(e.x - sk.x) > 8 || Math.abs(e.y - 3 - sk.y) > 8) return; if ((e.spikeT || 0) > G.t) return; e.spikeT = G.t + 0.5; damage(e, 30, null, 0, -1, 0.3); });
  }
  if (G.rushT > 0) G.rushT -= dt;
  updateHazards(dt, LP);
  // pickups
  const multi = G.players.length > 1;
  for (let i = G.pickups.length - 1; i >= 0 && !G.over; i--) {
    const k = G.pickups[i]; k.t += dt;
    let PL = LP;
    if (multi) { let bd = 1e12; for (const q of G.players) { if (q.down) continue; const dd = dist2(q.p.x, q.p.y, k.x, k.y); if (dd < bd) { bd = dd; PL = q; } } }
    use(PL); const p = G.p, mag = ST.magnet;
    const dx = p.x - k.x, dy = (p.y - 6) - k.y, d = Math.hypot(dx, dy);
    if (k.k === 'coin') {
      if (!k.pull && (k.vx || k.vy)) { k.x += k.vx * dt; k.y += k.vy * dt; const f = Math.max(0, 1 - 7 * dt); k.vx *= f; k.vy *= f; if (Math.abs(k.vx) + Math.abs(k.vy) < 2) k.vx = k.vy = 0; }
      if (!k.pull && d < mag) { k.pull = true; k.vx = -dx / d * 60; k.vy = -dy / d * 60; }
      if (k.pull) { k.ps = Math.min(420, (k.ps || 60) + 900 * dt); const tx = dx / d * k.ps, ty = dy / d * k.ps, f = Math.min(1, 12 * dt); k.vx += (tx - k.vx) * f; k.vy += (ty - k.vy) * f;
        const step = Math.hypot(k.vx, k.vy) * dt; if (step >= d) { k.x = p.x; k.y = p.y - 6; } else { k.x += k.vx * dt; k.y += k.vy * dt; } }
      if (d < 7 || (k.pull && Math.hypot(p.x - k.x, p.y - 6 - k.y) < 7)) { G.pickups.splice(i, 1); G.gold += k.v * COINV * ST.greed * SGOLD(); gainXP(k.v);
        if (PL.local) { if (k.lucky) { sfx('coins', 1, 0); G.nums.push({ x: p.x, y: p.y - 30, v: '+' + Math.round(k.v * COINV * ST.greed * SGOLD()), t: 0, crit: true }); sparks(p.x, p.y - 8, 8, ['#facb3e'], 90); }
          G.coinChain = Math.min(G.coinChain + 1, 30); G.coinT = 0.4; sfx('coin', 0.28, 0, 0.035, 1 + G.coinChain * 0.035); }
        if (PL.hero === 'hild' && ++PL.tr.gems >= 30) { PL.tr.gems = 0; p.hp = Math.min(ST.maxhp, p.hp + 4); G.nums.push({ x: p.x, y: p.y - 30, v: '+4', t: 0, heal: true }); } }
    } else if (d < (k.k === 'mimic' ? 26 : 12)) {
      G.pickups.splice(i, 1);
      if (k.k === 'heart') { const hv = PL.hero === 'hild' ? 45 : 30; p.hp = Math.min(ST.maxhp, p.hp + hv); sfx('heal', 0.8, 0); G.nums.push({ x: p.x, y: p.y - 30, v: '+' + hv, t: 0, heal: true }); }
      else if (k.k === 'keg') nuke(false);
      else if (k.k === 'chest') { if (PL.local) openChest(); else remoteChest(PL); }
      else if (k.k === 'pfreeze') { G.freezeT = 4; G.flashT = 0.1; banner(T('frozen')); sfx('pick', 0.9, 0); }
      else if (k.k === 'phaste') { G.hasteT = 8; banner(T('hasted')); sfx('pick', 0.9, 0); }
      else if (k.k === 'pmagnet') { for (const c of G.pickups) if (c.k === 'coin' && !c.pull) { c.pull = true; c.vx = 0; c.vy = 0; } banner(T('vacuum')); sfx('coins', 0.9, 0); }
      else if (k.k === 'mimic') { const m = spawnEnemy('mimic', k.x, k.y); m.flash = 0.2; sfx('impact', 1, 0); G.shake = 0.4; banner(L().mimic); }
    }
  }
  use(LP);
  for (const sh of G.shrines) if (!sh.used && state.mode === 'play' && !G.over) {
    const who = G.players.find(q => !q.down && dist2(q.p.x, q.p.y, sh.x, sh.y) < 15 * 15); if (!who) continue;
    sh.used = true; if (who.local) openShrine(); else remoteShrine(who); break;
  }
  // fx
  for (let i = G.parts.length - 1; i >= 0; i--) { const q = G.parts[i]; q.t += dt; q.vy += (q.g || 0) * dt; q.x += q.vx * dt; q.y += q.vy * dt; q.vx *= 0.96; if (q.t > q.life) G.parts.splice(i, 1); }
  for (let i = G.nums.length - 1; i >= 0; i--) { const n = G.nums[i]; n.t += dt; if (n.t > 0.7) G.nums.splice(i, 1); }
  for (let i = G.blasts.length - 1; i >= 0; i--) {
    const b = G.blasts[i]; b.t += dt;
    if (b.pending && b.t >= 0) { b.pending = false; explode(b.x, b.y, b.r, b.dmg, b.w, b); G.blasts.splice(i, 1); continue; }
    if (b.t > b.life) G.blasts.splice(i, 1);
  }
  if (G.shake > 0) G.shake -= dt;

  // camera
  use(LP);
  const tx = G.p.x - VW / 2, ty = G.p.y - 12 - VH / 2;
  G.cam.x += (tx - G.cam.x) * Math.min(1, dt * 10); G.cam.y += (ty - G.cam.y) * Math.min(1, dt * 10);
  G.cam.x = clamp(G.cam.x, -40, Math.max(-40, AW + 40 - VW)); G.cam.y = clamp(G.cam.y, -56, Math.max(-56, AH + 48 - VH));
  if (VW > AW + 80) G.cam.x = (AW - VW) / 2; if (VH > AH + 104) G.cam.y = (AH - VH) / 2;

  // music by phase
  if (!G.won) playMusic(G.t < 195 ? 'level1' : G.t < 390 ? 'level2' : 'level3');
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
  for (const o of props) if (o.decal && o.name && inView(o.x, o.y)) spr(o.name, o.x - cx, o.y - cy, { alpha: o.pit || o.name === 'wall_goo_base' ? 1 : 0.55 });
  const tnow = performance.now() / 1000;
  if (!attract && G.splats.length) { for (const sp of G.splats) { if (!inView(sp.x, sp.y)) continue; const age = tnow - sp.t0, al = age < 40 ? 0.62 : Math.max(0, 0.62 - (age - 40) / 20); if (al <= 0) continue; vctx.globalAlpha = al; vctx.fillStyle = sp.c; const X = Math.round(sp.x - cx), Y = Math.round(sp.y - cy); for (const q of sp.pts) vctx.fillRect(X + q[0], Y + q[1], q[2], q[2]); } vctx.globalAlpha = 1; }
  for (const k of (attract ? [] : G.pickups)) {
    if (!inView(k.x, k.y)) continue;
    const X = k.x - cx, Y = k.y - cy;
    if (k.k === 'coin') {
      const fr = 'coin_anim_f' + (((tnow * 8 + k.t * 4) | 0) % 4);
      if (k.lucky) { const bob = Math.round(Math.abs(Math.sin(tnow * 4 + k.x)) * 3); spr(fr, X, Y - bob, { scale: 2 }); }
      else { spr(fr, X, Y); if (k.v >= 3) spr(fr, X + 2, Y - 2); if (k.v >= 8) spr(fr, X - 2, Y - 3); }
    } else if (k.k === 'heart') spr('ui_heart_full', X, Y - Math.round(Math.abs(Math.sin(tnow * 3)) * 2));
    else if (k.k === 'keg') spr('bomb_f' + ((tnow * 6 | 0) % 3), X, Y);
    else if (k.k === 'pmagnet') { const bob = Math.round(Math.abs(Math.sin(tnow * 3 + k.x)) * 2); if ((tnow * 3 | 0) % 2) pixelRing(X, Y - 6 - bob, 7, '#facb3e', 1); drawMagnet(X, Y - bob); }
    else if (POT[k.k]) spr(POT[k.k], X, Y - Math.round(Math.abs(Math.sin(tnow * 3 + k.x)) * 2));
    else if (k.k === 'chest' || k.k === 'mimic') { shadow(X, Y, 14); spr('chest_full_open_anim_f0', X, Y - Math.round(Math.abs(Math.sin(tnow * 4)) * 2)); if ((tnow * 4 | 0) % 2) vctx.fillStyle = '#facb3e', vctx.fillRect(X + 6, Y - 18, 1, 1); }
  }
  if (!attract) for (const r of G.risers) if (inView(r.x, r.y)) spr('hole', r.x - cx, r.y - cy, { alpha: ((tnow * 10 | 0) % 2) ? 0.9 : 0.45 });
  // depth-sorted actors
  const list = [];
  for (const o of props) if (!o.decal && inView(o.x, o.y, o.wall ? 60 + o.w * 8 : 60)) list.push({ y: o.y, d: o.wall ? () => drawWallBlock(o, cx, cy) : () => spr(o.name, o.x - cx, o.y - cy) });
  if (attract) for (const o of crateSpots) if (inView(o.x, o.y, 60)) list.push({ y: o.y, d: () => spr('crate', o.x - cx, o.y - cy) });
  const src = attract ? ATTRACT.mobs : G.enemies;
  for (const e of src) if (inView(e.x, e.y)) list.push({ y: e.y, d: () => drawEnemy(e, cx, cy) });
  if (!attract) {
    for (const sh of G.shrines) if (inView(sh.x, sh.y, 40)) list.push({ y: sh.y, d: () => { const f = frames('angel', 'idle'); shadow(sh.x - cx, sh.y - cy, 12); spr(f[(tnow * 6 | 0) % f.length], sh.x - cx, sh.y - cy - 5 - Math.round(Math.sin(tnow * 2 + sh.x) * 2), { alpha: sh.used ? 0.28 : 1 }); } });
    for (const pl of G.players) list.push({ y: pl.p.y, d: () => drawPlayer(cx, cy, pl) });
    for (const s of G.shots) if (s.kind === 'bomb' && s.t >= 0) list.push({ y: s.y, d: () => { shadow(s.x - cx, s.y - cy, 8); spr('bomb_f' + (s.t < s.fly ? 0 : ((s.t * 12 | 0) % 2) + 1), s.x - cx, s.y - cy - (s.z || 0)); } });
  } else list.push({ y: ATTRACT.hero.y, d: () => { shadow(ATTRACT.hero.x - cx, ATTRACT.hero.y - cy, 10); const f = frames(HEROES[SV.hero].spr, 'idle'); spr(f[(tnow * 5 | 0) % f.length], ATTRACT.hero.x - cx, ATTRACT.hero.y - cy); } });
  list.sort((a, b) => a.y - b.y).forEach(o => o.d());
  const tint = !attract && STG().tint;
  if (tint) { vctx.globalCompositeOperation = 'multiply'; vctx.fillStyle = tint; vctx.fillRect(0, 0, VW, VH); vctx.globalCompositeOperation = 'source-over'; }
  if (!attract && G.bloodT > 0) { vctx.globalCompositeOperation = 'multiply'; vctx.fillStyle = '#ffb0a8'; vctx.fillRect(0, 0, VW, VH); vctx.globalCompositeOperation = 'source-over'; }
  if (!attract) { for (const h of G.hazards) { vctx.globalAlpha = 0.5 * clamp(1 - h.t / h.life + 0.3, 0, 1); vctx.fillStyle = '#9cdb43'; for (let k = 0; k < 14; k++) { const a = k * 2.4 + h.t * 0.7; vctx.fillRect(Math.round(h.x - cx + Math.cos(a) * h.r * 0.75 * ((k % 3) / 3 + 0.4)), Math.round(h.y - cy + Math.sin(a) * h.r * 0.45 * ((k % 3) / 3 + 0.4)), 2, 1); } vctx.globalAlpha = 1; }
    const TT = G.totem; if (TT) { const k = TT.prog / 6; pixelRing(TT.x - cx, TT.y - cy, TT.r, (tnow * 4 | 0) % 2 ? '#9b5ba5' : '#c6b7be', 1); spr('skull', TT.x - cx, TT.y - cy); vctx.fillStyle = '#222'; vctx.fillRect(Math.round(TT.x - cx - 13), Math.round(TT.y - cy + 6), 26, 3); vctx.fillStyle = '#9b5ba5'; vctx.fillRect(Math.round(TT.x - cx - 12), Math.round(TT.y - cy + 7), Math.round(24 * k), 1); } }
  // bottom wall (foreground)
  if (cy + VH > AH - 8) for (let x = Math.max(0, tx0 - 1); x <= Math.min(COLS - 1, tx1 + 1); x++) { tileSpr('wall_top_mid', x, ROWS, cx, cy); tileSpr('wall_mid', x, ROWS + 1, cx, cy); }
  if (!attract) {
    // projectiles
    for (const s of G.shots) {
      if (s.t < 0 || s.kind === 'bomb') continue;
      if (s.kind === 'orb') { const X = Math.round(s.x - cx), Y = Math.round(s.y - cy); vctx.fillStyle = s.evo ? '#da4e38' : '#49a790'; vctx.fillRect(X - 2, Y - 1, 4, 2); vctx.fillRect(X - 1, Y - 2, 2, 4); vctx.fillStyle = s.evo ? '#facb3e' : '#cae6f5'; vctx.fillRect(X - 1, Y - 1, 2, 2); continue; }
      if (s.kind === 'wave') { const X = s.x - cx, Y = s.y - cy, nx = -Math.sin(s.rot), ny = Math.cos(s.rot), fx = Math.cos(s.rot), fy = Math.sin(s.rot), R = s.r;
        vctx.globalAlpha = clamp(1.2 - s.t / s.life, 0, 1);
        for (let k = -R; k <= R; k++) { const bend = (1 - (k * k) / (R * R)) * 4; vctx.fillStyle = Math.abs(k) < R * 0.5 ? '#fdf7ed' : '#facb3e'; vctx.fillRect(Math.round(X + nx * k + fx * bend), Math.round(Y + ny * k + fy * bend), 1, 2); }
        vctx.globalAlpha = 1; continue; }
      if (s.kind === 'tornado') { const X = s.x - cx, Y = s.y - cy;
        for (let k = 0; k < 18; k++) { const h = k / 18, a = s.spin + k * 0.9, rr = s.r * (0.35 + h * 0.75); vctx.fillStyle = k % 3 ? '#cae6f5' : '#fdf7ed'; vctx.globalAlpha = 0.85 - h * 0.4; vctx.fillRect(Math.round(X + Math.cos(a) * rr), Math.round(Y - h * 26 + Math.sin(a) * rr * 0.3), 2, 1); }
        vctx.globalAlpha = 1; continue; }
      if (s.kind === 'axe') sprRot(s.spr, s.x - cx, s.y - cy, s.rot, -AT[s.spr][3] / 2);
      else sprRot(s.spr, s.x - cx, s.y - cy, s.rot, -AT[s.spr][3] / 2);
    }
    // swings & hammers
    drawWeaponsFx(cx, cy);
    if (G.wraith) { const W = G.wraith, f = frames('necromancer', 'run'), t = performance.now() / 1000, bob = Math.sin(t * 2.2) * 2;
      const nmw = f[(t * 6 | 0) % f.length], al = 0.5 + 0.12 * Math.sin(t * 7); spr(nmw, W.x - cx, W.y - cy + 6 + bob, { alpha: al, flip: W.face < 0 }); spr(nmw, W.x - cx, W.y - cy + 6 + bob, { ice: true, alpha: al * 0.45, flip: W.face < 0 }); }
    // blasts
    for (const b of G.blasts) {
      if (b.t < 0) continue;
      if (b.ring) pixelRing(b.x - cx, b.y - cy, b.r * Math.min(1, b.t / b.life + 0.3), b.ice ? (b.t < b.life * 0.5 ? '#fdf7ed' : '#72d6ce') : (b.t < b.life * 0.5 ? '#fdf7ed' : '#aa8d7a'), 1);
    }
    for (const b of G.blasts) if (b.t < 0 && b.marker) { // incoming comet / hammer
      const k = clamp(1 + b.t / 0.6, 0, 1), X = b.x - cx, Y = b.y - cy;
      pixelRing(X, Y, b.r * (1.15 - k * 0.15), (performance.now() / 90 | 0) % 2 ? '#da4e38' : '#facb3e', 1);
      if (b.marker === 'forge') sprRot('k_ingot_01', X, Y - (1 - k) * 90, -Math.PI / 2, -AT.k_ingot_01[3] / 2);
      else { const Z = (1 - k) * 110; for (let j = 0; j < 6; j++) { vctx.fillStyle = j < 2 ? '#fdf7ed' : j < 4 ? '#facb3e' : '#da4e38'; vctx.fillRect(Math.round(X + Z * 0.5 - j * 2), Math.round(Y - Z - j * 3), 4 - (j >> 1), 4 - (j >> 1)); } }
    }
    for (const z of G.zones) { vctx.globalAlpha = 0.25 * clamp(1 - z.t / z.life + 0.3, 0, 1); vctx.fillStyle = '#ee8e2e'; for (let k = 0; k < 10; k++) { const a = k / 10 * TAU + z.t; vctx.fillRect(Math.round(z.x - cx + Math.cos(a) * z.r * 0.8), Math.round(z.y - cy + Math.sin(a) * z.r * 0.5), 2, 1); } vctx.globalAlpha = 1; }
    for (const zp of G.zaps) { vctx.fillStyle = zp.t < 0.08 ? '#fdf7ed' : '#72d6ce'; const n = 8; let px = zp.x1, py = zp.y1; for (let k = 1; k <= n; k++) { const x2 = zp.x1 + (zp.x2 - zp.x1) * k / n + (k < n ? rnd(-3, 3) : 0), y2 = zp.y1 + (zp.y2 - zp.y1) * k / n + (k < n ? rnd(-3, 3) : 0); const st = Math.max(Math.abs(x2 - px), Math.abs(y2 - py)) | 0; for (let q = 0; q <= st; q++) vctx.fillRect(Math.round(px + (x2 - px) * q / (st || 1) - cx), Math.round(py + (y2 - py) * q / (st || 1) - cy), 1, 1); px = x2; py = y2; } }
    for (const sl of G.slashes) { const k = sl.t / sl.life, X = sl.x - cx, Y = sl.y - cy, R = sl.small ? 5 : 11, a = sl.a || 0.7; vctx.globalAlpha = 1 - k; vctx.fillStyle = k < 0.4 ? '#fdf7ed' : '#9b5ba5';
      for (const da of [a, a + Math.PI / 2 + 0.3]) for (let q = -R; q <= R; q++) vctx.fillRect(Math.round(X + Math.cos(da) * q), Math.round(Y + Math.sin(da) * q), 1, 1); vctx.globalAlpha = 1; }
    for (const q of G.parts) { vctx.globalAlpha = clamp(1 - q.t / q.life + 0.3, 0, 1); vctx.fillStyle = q.c; vctx.fillRect(Math.round(q.x - cx), Math.round(q.y - cy), q.sz, q.sz); }
    vctx.globalAlpha = 1;
    for (let i = G.rings.length - 1; i >= 0; i--) { const r = G.rings[i], k = (tnow - r.t0) / r.life; if (k >= 1 || k < 0) { G.rings.splice(i, 1); continue; } const e2 = 1 - Math.pow(1 - k, 3); vctx.globalAlpha = 1 - k; pixelRing(r.x - cx, r.y - cy, r.r0 + (r.r1 - r.r0) * e2, r.c, r.th); }
    vctx.globalAlpha = 1;
    { const A = G.amb, col = ({ keep: '#ee8e2e', sewers: '#9cdb43', camp: '#facb3e', crypt: '#72d6ce', hell: '#da4e38' })[G.stage] || '#ee8e2e'; while (A.length < 14) A.push({ x: cx + rnd(0, VW), y: cy + rnd(0, VH + 20), vy: -rnd(4, 14), vx: rnd(-4, 4), ph: rnd(0, TAU), z: Math.random() < 0.3 ? 2 : 1 });
      for (let i = A.length - 1; i >= 0; i--) { const a = A[i]; a.y += a.vy / 60; a.x += (a.vx + Math.sin(tnow + a.ph) * 3) / 60; if (a.y < cy - 10 || a.x < cx - 20 || a.x > cx + VW + 20 || a.y > cy + VH + 30) { A.splice(i, 1); continue; } vctx.globalAlpha = 0.14 + 0.1 * Math.sin(tnow * 2 + a.ph); vctx.fillStyle = col; vctx.fillRect(Math.round(a.x - cx), Math.round(a.y - cy), a.z, a.z); }
      vctx.globalAlpha = 1; }
  }
  // light
  drawLight(cx, cy, attract);
  if (!attract) {
    // enemy shots and slam warnings stay readable in the dark
    for (const w of G.warns) { if (w.t >= 0) continue; const k = clamp(1 + w.t / 0.95, 0, 1), X = w.x - cx, Y = w.y - cy; pixelRing(X, Y, w.r, (tnow * 10 | 0) % 2 ? '#da4e38' : '#ee8e2e', 1); pixelRing(X, Y, Math.max(1, w.r * k), '#da4e38', 1); }
    const tq = performance.now() / 1000;
    for (const q of G.eshots) { const K = EK[q.c]; if (!K) continue; const X = q.x - cx, Y = q.y - cy; if (X < -12 || Y < -12 || X > VW + 12 || Y > VH + 12) continue;
      const lift = K.lob ? Math.sin(Math.min(1, q.t / (q.life || 1)) * Math.PI) * 10 : 0, f = AT[K.spr], ang = K.align && q.vx != null && (q.vx || q.vy) ? Math.atan2(q.vy, q.vx) : (tq + q.x * 0.01) * (K.spin || 6);
      if (lift) shadow(X, Y + 6, 6);
      sprRot(K.spr, X, Y - lift, ang, -f[3] / 2); }
    for (const q of G.eshots) { if (EK[q.c]) continue; const X = Math.round(q.x - cx), Y = Math.round(q.y - cy); if (X < -4 || Y < -4 || X > VW + 4 || Y > VH + 4) continue; vctx.fillStyle = '#111'; vctx.fillRect(X - 2, Y - 2, 5, 5); vctx.fillStyle = ESC[q.c] || ESC[0]; vctx.fillRect(X - 1, Y - 2, 3, 5); vctx.fillRect(X - 2, Y - 1, 5, 3); vctx.fillStyle = '#fdf7ed'; vctx.fillRect(X, Y - 1, 1, 1); }
    for (const w of G.words) { const k = w.t / 1.1, X = Math.round(w.x - cx), Y = Math.round(w.y - cy - k * 18); vctx.font = (w.big ? '16px' : '12px') + ' Galmuri11'; vctx.textAlign = 'center'; vctx.globalAlpha = k > 0.75 ? (1 - k) * 4 : 1; const sc = k < 0.12 ? 1 + (0.12 - k) * 6 : 1; vctx.save(); vctx.translate(X, Y); vctx.scale(sc, sc); vctx.fillStyle = '#111'; vctx.fillText(w.w, 1, 1); vctx.fillStyle = w.big ? '#facb3e' : pick(['#fdf7ed', '#facb3e', '#9cdb43']); vctx.fillText(w.w, 0, 0); vctx.restore(); vctx.globalAlpha = 1; }
    { const q = G.p, mh = ST.maxhp; if (q.hp > 0 && q.hp < mh * 0.25) { const a = 0.25 + 0.2 * Math.sin(tnow * 7.4); const g = vctx.createRadialGradient(VW / 2, VH / 2, Math.min(VW, VH) * 0.3, VW / 2, VH / 2, Math.max(VW, VH) * 0.7); g.addColorStop(0, 'rgba(98,35,47,0)'); g.addColorStop(1, `rgba(170,30,40,${a})`); vctx.fillStyle = g; vctx.fillRect(0, 0, VW, VH); } }
    // damage numbers above the dark
    vctx.font = '8px Galmuri7'; vctx.textAlign = 'center'; vctx.textBaseline = 'alphabetic';
    for (const n of G.nums) {
      const X = Math.round(n.x - cx), Y = Math.round(n.y - cy - n.t * 22 + (n.t > 0.5 ? (n.t - 0.5) * 10 : 0));
      const big = typeof n.v === 'number' && !n.heal && !n.poison && (n.crit || n.v >= 150);
      const s = String(n.v);
      if (big) { const pop = n.t < 0.08 ? 1.5 - n.t * 6.25 : 1; vctx.save(); vctx.translate(X, Y); vctx.scale(pop, pop); vctx.font = '10px Galmuri9'; vctx.fillStyle = '#111'; vctx.fillText(s, 1, 1);
        vctx.fillStyle = n.v >= 400 ? '#da4e38' : n.v >= 150 ? '#ee8e2e' : '#facb3e'; vctx.fillText(s, 0, 0); vctx.restore(); vctx.font = '8px Galmuri7'; continue; }
      vctx.fillStyle = '#222'; vctx.fillText(s, X + 1, Y + 1);
      vctx.fillStyle = n.heal ? '#4ba747' : n.poison ? '#9cdb43' : n.crit || n.gold ? '#facb3e' : '#fdf7ed'; vctx.fillText(s, X, Y);
    }
    if (SV.settings.mini !== false) drawMinimap(cx, cy);
    // player hp bar
    for (const pl of G.players) { if (pl.down) continue;
      const q = pl.p, bw = pl.local ? 16 : 12, X = Math.round(q.x - cx - bw / 2), Y = Math.round(q.y - cy + 3), mh = (G.guest && pl.mh) || (pl.ST || ST).maxhp;
      vctx.fillStyle = '#222'; vctx.fillRect(X - 1, Y - 1, bw + 2, 4);
      vctx.fillStyle = '#62232f'; vctx.fillRect(X, Y, bw, 2);
      vctx.fillStyle = pl.local ? '#da4e38' : '#4ba747'; vctx.fillRect(X, Y, Math.round(bw * clamp(q.hp / mh, 0, 1)), 2);
      if (pl.local && q.dashCd > 0) { vctx.fillStyle = '#222'; vctx.fillRect(X - 1, Y + 3, bw + 2, 3); vctx.fillStyle = '#72d6ce'; vctx.fillRect(X, Y + 4, Math.round(bw * clamp(1 - q.dashCd / (pl.ST || ST).dashCd, 0, 1)), 1); }
      if (!pl.local && pl.name) { vctx.font = '8px Galmuri7'; vctx.textAlign = 'center'; vctx.fillStyle = '#222'; vctx.fillText(pl.name, Math.round(q.x - cx) + 1, Math.round(q.y - cy - 25) + 1); vctx.fillStyle = '#9cdb43'; vctx.fillText(pl.name, Math.round(q.x - cx), Math.round(q.y - cy - 25)); }
    }
    const p = G.p;
    // off-screen chest pointer
    for (const k of G.pickups) if ((k.k === 'chest' || k.k === 'mimic') && !(k.x > cx && k.x < cx + VW && k.y > cy && k.y < cy + VH)) {
      const a = Math.atan2(k.y - p.y, k.x - p.x); const ex = clamp(k.x - cx, 10, VW - 10), ey = clamp(k.y - cy, 22, VH - 10);
      sprRot('weapon_arrow', ex, ey, a, -10);
    }
    for (const q of G.players) if (!q.local && !(q.p.x > cx && q.p.x < cx + VW && q.p.y > cy && q.p.y < cy + VH)) {
      const a = Math.atan2(q.p.y - p.y, q.p.x - p.x), ex = clamp(q.p.x - cx, 8, VW - 8), ey = clamp(q.p.y - cy, 22, VH - 8);
      vctx.fillStyle = q.down ? '#da4e38' : '#9cdb43'; vctx.fillRect(Math.round(ex) - 2, Math.round(ey) - 2, 4, 4); vctx.fillStyle = '#111'; vctx.fillRect(Math.round(ex + Math.cos(a) * 4), Math.round(ey + Math.sin(a) * 4), 2, 2);
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
  if (e.elite || e.boss && e.tele > 0 || (G && G.drumT > 0 && !e.static && ((performance.now() / 120) | 0) % 2)) {
    const s = e.sc;
    for (const [ox, oy] of [[-1, 0], [1, 0], [0, -1], [0, 1]]) spr(name, X + ox, Y + oy, { red: true, flip, scale: s });
  }
  if (e.flash > 0 && !e.static && !e.boss) { const f = Math.min(1, e.flash / 0.12); vctx.save(); vctx.translate(Math.round(X), Math.round(Y)); vctx.scale(1 + 0.28 * f, 1 - 0.22 * f); spr(name, 0, 0, { flip, scale: e.sc, flash: true }); vctx.restore(); }
  else spr(name, X, Y, { flip, scale: e.sc, flash: e.flash > 0 });
  if (e.hitCd && G && state.mode !== 'title' && !e.boss && (G.freezeT > 0 || e.stunT > 0)) spr(name, X, Y, { flip, scale: e.sc, ice: true, alpha: 0.5 });
  if (e.bounty > 0) { const t = performance.now() / 1000, hy = Math.round(Y - e.h * e.sc - 10 - Math.abs(Math.sin(t * 3)) * 2); const bw = 18, bx = Math.round(X - bw / 2); vctx.fillStyle = '#222'; vctx.fillRect(bx - 1, hy + 4, bw + 2, 3); vctx.fillStyle = '#facb3e'; vctx.fillRect(bx, hy + 5, Math.round(bw * e.bounty / 30), 1); spr('coin_anim_f' + ((t * 8 | 0) % 4), X, hy - 1, { scale: 1.5 }); }
  if (e.type === 'tgoblin') { const t = performance.now() / 1000; if ((t * 6 | 0) % 2) spr(name, X, Y, { flip, scale: e.sc, flash: true, alpha: 0.6 }); vctx.fillStyle = '#facb3e'; vctx.fillRect(Math.round(X) - 1, Math.round(Y - e.h - 5 - Math.abs(Math.sin(t * 4)) * 2), 3, 3); }
  if ((e.elite || e.boss) && e.hp < e.maxhp && !e.boss) {
    const bw = 20, bx = Math.round(X - bw / 2), by = Math.round(Y - e.h * e.sc - 5);
    vctx.fillStyle = '#222'; vctx.fillRect(bx - 1, by - 1, bw + 2, 3); vctx.fillStyle = '#da4e38'; vctx.fillRect(bx, by, Math.round(bw * e.hp / e.maxhp), 1);
  }
}
function drawPlayer(cx, cy, pl) {
  pl = pl || curPL; const p = pl.p, H = HEROES[pl.hero];
  if (pl.down) { const X = p.x - cx, Y = p.y - cy; shadow(X, Y, 12); spr(frames(H.spr, 'idle')[0], X, Y, { flip: p.face < 0, alpha: 0.45 });
    if (pl.reviveT > 0) { vctx.fillStyle = '#222'; vctx.fillRect(Math.round(X - 9), Math.round(Y - 30), 18, 3); vctx.fillStyle = '#4ba747'; vctx.fillRect(Math.round(X - 8), Math.round(Y - 29), Math.round(16 * Math.min(1, pl.reviveT / 2.5)), 1); }
    return; }
  const f = p.hurtT > 0 ? [`${H.spr}_hit_anim_f0`] : frames(H.spr, p.moving ? 'run' : 'idle');
  const name = f[(p.anim | 0) % f.length];
  const X = p.x - cx, Y = p.y - cy;
  for (const g of G.ghosts) if (!g.pl || g.pl === pl) spr(name, g.x - cx, g.y - cy, { flip: g.f < 0, flash: true, alpha: 0.4 * (1 - g.t / 0.25) });
  shadow(X, Y, 12);
  if (pl.tr && pl.tr.shield) { const t = performance.now() / 1000; pixelRing(X, Y - 8, 11 + Math.sin(t * 6), '#cae6f5', 1); }
  if (p.inv > 0 && p.dashT <= 0 && ((p.inv * 20) | 0) % 2) return;
  spr(name, X, Y, { flip: p.face < 0, flash: p.hurtT > 0.15 });
}
function drawWeaponsFx(cx, cy) {
  for (const s of G.swings) {
    if (s.t < 0) continue;
    const p = s.o || (s.w && s.w.pl ? s.w.pl.p : G.p);
    const ox = p.x - cx, oy = p.y - 10 - cy;
    if (s.kind === 'slam') { const k = clamp(s.t / s.dur, 0, 1); sprRot(s.spr, ox, oy + 2, -Math.PI / 2 + p.face * k * 2.3, 5); continue; }
    if (s.kind === 'thrust') {
      const L = s.len * (s.ext || 0), h = AT[s.spr][3];
      if (s.streak) { const cxs = Math.cos(s.ang), sys = Math.sin(s.ang); vctx.fillStyle = '#fdf7ed'; for (let d = 8; d < L - 4; d += 2) { vctx.globalAlpha = 0.25 + 0.6 * d / Math.max(1, L); vctx.fillRect(Math.round(ox + cxs * d), Math.round(oy + sys * d), 1, 1); } vctx.globalAlpha = 1; }
      sprRot(s.spr, ox, oy, s.ang, L - h + 4);
    } else {
      const h = AT[s.spr][3];
      for (let k = 2; k >= 0; k--) {
        const a = s.cur - k * 0.28 * (s.arc > 6 ? 1 : 1);
        sprRot(s.spr, ox, oy + 2, a, Math.max(0, s.r - h - 2), { alpha: k ? 0.35 / k : 1, flash: k > 0 });
      }
    }
  }
  if (G.guest) { for (const o of G.orbsNet || []) sprRot(o[3] ? 'weapon_big_hammer' : 'weapon_hammer', o[0] - cx, o[1] - cy, o[2] + Math.PI / 2, -AT[o[3] ? 'weapon_big_hammer' : 'weapon_hammer'][3] / 2); }
  else for (const pl of G.players) for (const w of pl.weapons) if (w.orbs) for (const o of w.orbs) sprRot(w.evo ? 'weapon_big_hammer' : 'weapon_hammer', o.x - cx, o.y - cy, o.a + Math.PI / 2, -AT['weapon_hammer'][3] / 2);
}
function drawLight(cx, cy, attract) {
  if (!LIGHT.canvas || LIGHT.canvas.width !== VW || LIGHT.canvas.height !== VH) { LIGHT.canvas = document.createElement('canvas'); LIGHT.canvas.width = VW; LIGHT.canvas.height = VH; LIGHT.ctx = LIGHT.canvas.getContext('2d'); }
  const lc = LIGHT.ctx;
  lc.globalCompositeOperation = 'source-over'; lc.clearRect(0, 0, VW, VH);
  lc.fillStyle = 'rgba(14,8,18,0.62)'; lc.fillRect(0, 0, VW, VH);
  lc.globalCompositeOperation = 'destination-out';
  const R = Math.round(Math.max(VW, VH) * 0.42 * (attract ? 1 : (STG().light || 1) * (MOD('dark') ? 0.7 : 1))) & ~1;
  const ls = lightSprite(R);
  const px = attract ? ATTRACT.hero.x : G.p.x, py = attract ? ATTRACT.hero.y : G.p.y;
  lc.drawImage(ls, Math.round(px - cx - R), Math.round(py - 10 - cy - R));
  if (!attract && G.players.length > 1) { const mid = lightSprite(Math.round(R * 0.6) & ~1); for (const pl of G.players) if (!pl.local) lc.drawImage(mid, Math.round(pl.p.x - cx - (Math.round(R * 0.6) & ~1)), Math.round(pl.p.y - 10 - cy - (Math.round(R * 0.6) & ~1))); }
  const small = lightSprite(40);
  if (cy < 30) for (const f of wallDeco.fountains) lc.drawImage(small, Math.round(f.x * TS + 8 - cx - 40), Math.round(-4 - cy - 40));
  if (!attract) {
    for (const b of G.blasts) if (b.t >= 0) lc.drawImage(small, Math.round(b.x - cx - 40), Math.round(b.y - cy - 40));
    for (const k of G.pickups) if (k.k === 'chest' || k.k === 'mimic') lc.drawImage(small, Math.round(k.x - cx - 40), Math.round(k.y - 8 - cy - 40));
    for (const sh of G.shrines) if (!sh.used) lc.drawImage(small, Math.round(sh.x - cx - 40), Math.round(sh.y - 14 - cy - 40));
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
  const pi = $('pauseInv'); pi.innerHTML = '';
  G.weapons.forEach(w => { const s = document.createElement('div'); s.className = 'slot'; s.appendChild(iconCanvas(w.evo ? WP[w.id].evoIcon : WP[w.id].icon, U * 12)); const b = document.createElement('b'); b.textContent = w.evo ? '★' : w.lvl; s.appendChild(b); pi.appendChild(s); });
  Object.keys(G.passives).forEach(k => { const s = document.createElement('div'); s.className = 'slot'; s.appendChild(iconCanvas(PS[k].icon, U * 12)); const b = document.createElement('b'); b.textContent = G.passives[k]; s.appendChild(b); pi.appendChild(s); });
}
let hudLast = {};
function hud() {
  const set = (id, v) => { if (hudLast[id] !== v) { hudLast[id] = v; $(id).textContent = v; } };
  set('timer', fmt(G.t)); set('kills', G.kills); set('gold', Math.floor(G.gold) + (boostLeft() > 0 ? ' ×1.5' : '')); set('lvl', 'LV ' + G.lvl);
  $('xpfill').style.width = ((G.guest ? G.xpFrac || 0 : G.xp / xpNeed(G.lvl)) * 100).toFixed(1) + '%';
  const fzv = Math.round((G.frenzyT > 0 ? G.frenzyT / 8 : G.fz) * 100), fzo = G.frenzyT > 0;
  if (hudLast.fz !== fzv) { hudLast.fz = fzv; $('fzfill').style.width = fzv + '%'; }
  if (hudLast.fzo !== fzo) { hudLast.fzo = fzo; $('fzfill').classList.toggle('on', fzo); }
  if (G.players.length > 1) {
    const sig = G.players.map(q => q.name + (q.down ? 'x' : Math.round(q.p.hp / ((q.ST && q.ST.maxhp) || q.mh || 100) * 10))).join();
    if (hudLast.party !== sig) { hudLast.party = sig; const box = $('party'); box.innerHTML = '';
      for (const q of G.players) { if (q.local) continue; const r = document.createElement('div'); r.className = 'pm' + (q.down ? ' down' : ''); const n = document.createElement('span'); n.textContent = q.name || '?'; const b = document.createElement('i'); b.style.width = (q.down ? 0 : clamp(q.p.hp / ((q.ST && q.ST.maxhp) || q.mh || 100), 0, 1) * 100) + '%'; const bb = document.createElement('b'); bb.appendChild(b); r.append(n, bb); box.appendChild(r); } }
  } else if (hudLast.party) { hudLast.party = ''; $('party').innerHTML = ''; }
  const dcd = G.p.dashCd > 0; if (hudLast.dcd !== dcd) { hudLast.dcd = dcd; $('dashBtn').classList.toggle('cd', dcd); }
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
  for (const k of G.pickups) if (k.k === 'coin') { G.gold += k.v * COINV * ST.greed * SGOLD(); k.pull = true; }
  sfx('coins', 1, 0);
  state.mode = 'dying'; G.dieT = 3.2;
}
function finalBossName(st) { const f = STAGES[st].bosses.find(b => b.final); return [].concat(f.type).map(t => nm(EN[t])).filter((v, i, a) => a.indexOf(v) === i).join(' · '); }
function finishRun() {
  try { if (window.GStats) GStats.end({ lv: G.lvl, win: !!G.won }); } catch (e) {}
  const earned = Math.floor(G.gold * (G.players.length > 1 ? 0.7 : 1));
  if (NET.role === 'host' && G.mode === 'party') NET.sendEnd();
  let dailyMsg = '';
  if (G.daily) {
    const sc = dailyScore(), dl = SV.daily; dl.runs++;
    if (sc > dl.best) { dl.best = sc; dailyMsg = T('dailyNew', sc); } else dailyMsg = T('dailyScore', sc, dl.best);
    if (!dl.paid && G.t >= 240) { dl.paid = true; SV.coins += 200; dailyMsg += str('gap') + T('dailyPaid', 200); }
  }
  SV.coins += earned; SV.runs++;
  const acc = accGain(G.kills + Math.floor(G.t) + (G.won ? 500 : 0));
  const rec = [];
  if (G.t > SV.best.time && !G.daily) { SV.best.time = G.t; rec.push(L().survived); }
  if (G.kills > SV.best.kills) { SV.best.kills = G.kills; rec.push(L().killed); }
  if (G.lvl > SV.best.level) SV.best.level = G.lvl;
  if (G.won) SV.wins++;
  SV.maps = SV.maps || {};
  const nextId = Object.keys(STAGES).find(k => STAGES[k].need === G.stage);
  const wasOpen = nextId ? stageOpen(nextId) : true;
  const mr = mapRec(G.stage);
  if (!G.daily) SV.maps[G.stage] = { best: Math.max(mr.best, G.t), cleared: mr.cleared || G.won, tor: G.won ? Math.max(mr.tor || 0, Math.min(5, G.tor + 1)) : (mr.tor || 0) };
  if (G.won && G.tor > 0) SV.stats.torMax = Math.max(SV.stats.torMax || 0, G.tor);
  persist();
  { const C = colSV(); for (const w of G.weapons) { C.w[w.id] = 1; if (w.evo) C.w['evo_' + w.id] = 1; } }
  const s0 = G.st0 || SV.stats, mf = mTrack({ kills: G.kills, runs: 1, time: Math.floor(G.t / 60), chests: SV.stats.chests - (s0.chests || 0), bosses: SV.stats.bosses - (s0.bosses || 0), lvl: G.lvl, gold: earned, daily: G.daily ? 1 : 0, evos: SV.stats.evos - (s0.evos || 0) }); persist();
  const qd = checkQuests(), qe = $('eQuests'); qe.innerHTML = '';
  mf.forEach(m => { const d = document.createElement('div'); d.textContent = T('mDoneL', mText(m)); qe.appendChild(d); });
  qd.slice(0, 4).forEach(q => { const d = document.createElement('div'); d.textContent = T('questDone', qText(q)) + '  ◆' + qDia(q); qe.appendChild(d); });
  if (qd.length > 4) { const d = document.createElement('div'); d.textContent = '+' + (qd.length - 4) + ' · ◆' + qd.slice(4).reduce((a, q) => a + qDia(q), 0); qe.appendChild(d); }
  if (qd.length) sfx('coins', 0.8, 0);
  $('endTitle').textContent = G.won ? L().win : L().dead; $('endTitle').className = G.won ? 'gold' : '';
  $('eTime').textContent = fmt(G.t); $('eLvl').textContent = G.lvl; $('eKills').textContent = G.kills; $('eGold').textContent = '+' + earned;
  gpStop(); if (G.won) ADS.ev('win');
  const bd = $('bDouble');
  if (NOREW() || !(earned > 0)) { bd.style.display = 'none'; bd.disabled = true; } else { bd.style.display = ''; bd.disabled = false; bd.textContent = T('adDouble', earned); }
  bd.onclick = () => {
    if (bd.disabled) return; bd.disabled = true;
    ADS.show('rewarded', () => { SV.coins += earned; persist(); $('eGold').textContent = '+' + earned * 2; bd.style.display = 'none'; sfx('coins', 1, 0); refreshTitle(); }, () => { bd.textContent = L().adFail; });
  };
  $('eRec').textContent = (rec.length ? `${L().newRecord} — ${rec.join(', ')}` : '') + (dailyMsg ? (rec.length ? '  ·  ' : '') + dailyMsg : '');
  const [rk, rc] = rankOf(), ge = $('grade'); ge.textContent = rk; ge.style.color = rc; ge.classList.remove('show'); setTimeout(() => { ge.classList.add('show'); sfx(rk === 'S' ? 'fanfare' : 'impact', 0.9, 0); }, 700);
  const ae = $('eAcc'); ae.textContent = acc.ups ? T('accUp', acc.lvl, acc.coins) : ''; ae.className = acc.ups ? 'hint new' : 'hint';
  if (acc.ups) setTimeout(() => sfx('fanfare', 1, 0, 0.05, 1.1), 1300);
  countUp($('eGold'), earned, '+'); countUp($('eKills'), G.kills, '');
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
  if (ADS.kind === 'pg') setTimeout(() => { if (state.mode === 'end') ADS.show('midgame', () => {}, () => {}); }, 900); // natural break: the run just ended
  if (!G.won) playMusic('title');
}

function countUp(el, to, pre) { const t0 = performance.now(), dur = 900; let last = -1; const st = () => { const k = Math.min(1, (performance.now() - t0) / dur), v = Math.round(to * (1 - Math.pow(1 - k, 3))); if (v !== last) { last = v; el.textContent = pre + v.toLocaleString(); if (k < 1 && (v % 7 === 0)) sfx('coin', 0.15, 0, 0.03, 0.8 + k); } if (k < 1) requestAnimationFrame(st); }; st(); }

// ------------------------------------------------------------- accounts (own site / app only)
const ACC = (() => {
  const CFG = window.DM_FB, on = !!(CFG && CFG.apiKey) && !window.DM_PORTAL;
  const V = '10.12.2', base = 'https://www.gstatic.com/firebasejs/' + V + '/';
  let auth = null, user = null, loading = null, pushT = 0, busy = false, lastSync = 0;
  const loadJs = src => new Promise((ok, no) => { const sc = document.createElement('script'); sc.src = src; sc.onload = ok; sc.onerror = no; document.head.appendChild(sc); });
  function init() {
    if (!on) return Promise.reject(new Error('off'));
    if (loading) return loading;
    loading = loadJs(base + 'firebase-app-compat.js').then(() => loadJs(base + 'firebase-auth-compat.js')).then(() => {
      const app = firebase.initializeApp(CFG); auth = firebase.auth(app);
      auth.onAuthStateChanged(u => { const was = user; user = u; if (u) { try { localStorage.setItem('dm.acc', '1'); } catch (e) {} } else { try { localStorage.removeItem('dm.acc'); } catch (e) {} } if (u && (!was || was.uid !== u.uid)) pull(); ui(); });
      try { auth.getRedirectResult().catch(e => msg(errText(e))); } catch (e) {}
    });
    loading.catch(() => { loading = null; msg(T('accNet')); });
    return loading;
  }
  const docUrl = () => `https://firestore.googleapis.com/v1/projects/${CFG.projectId}/databases/(default)/documents/saves/${user.uid}`;
  const prog = o => ((o.acc && o.acc.lvl) || 1) * 1e6 + (o.runs || 0) * 1e3 + Math.min(999, Math.floor((o.coins || 0) / 100));
  async function pull() {
    if (!user) return; busy = true; ui();
    try {
      const tok = await user.getIdToken();
      const r = await fetch(docUrl(), { headers: { Authorization: 'Bearer ' + tok } });
      if (r.status === 404) { await upload(); msg(T('accSaved')); }
      else if (r.ok) {
        const j = await r.json(), raw = j.fields && j.fields.d && j.fields.d.stringValue;
        const cloud = raw ? parseSave(raw) : null;
        if (cloud && prog(cloud) > prog(SV)) { cloud.settings = SV.settings; SV = cloud; try { localStorage.setItem(SAVE_KEY, JSON.stringify(SV)); } catch (e) {} applyLang(); msg(T('accLoaded')); sfx('coins', 0.8, 0); }
        else { await upload(); msg(T('accSaved')); }
      } else msg(T('accNet'));
    } catch (e) { msg(T('accNet')); }
    busy = false; ui();
  }
  async function upload() {
    if (!user) return;
    const tok = await user.getIdToken(), str = JSON.stringify(SV);
    const body = { fields: { d: { stringValue: str }, p: { integerValue: String(prog(SV)) }, ts: { integerValue: String(Date.now()) } } };
    const r = await fetch(docUrl(), { method: 'PATCH', headers: { Authorization: 'Bearer ' + tok, 'Content-Type': 'application/json' }, body: JSON.stringify(body) });
    if (!r.ok) throw new Error('save ' + r.status); lastSync = Date.now();
  }
  function push() { if (!user) return; clearTimeout(pushT); pushT = setTimeout(() => upload().catch(() => {}), 4000); }
  const idMail = id => id.includes('@') ? id.trim() : id.trim().toLowerCase() + '@id.slayground.app';
  function errText(e) {
    const c = (e && e.code) || '';
    if (/wrong-password|invalid-credential|invalid-login|user-not-found/.test(c)) return T('accBad');
    if (/email-already-in-use/.test(c)) return T('accTaken');
    if (/weak-password/.test(c)) return T('accWeak');
    if (/popup-closed|cancelled-popup/.test(c)) return '';
    if (/network/.test(c)) return T('accNet');
    return T('accFail') + (c ? ' (' + c.replace('auth/', '') + ')' : '');
  }
  function msg(t) { const m = $('accMsg'); if (m) m.textContent = t || ''; }
  function ui() {
    const b = $('bAccount'); if (b) { b.style.display = 'none'; b.textContent = user ? '● ' + T('accT') : T('accT'); b.classList.toggle('in', !!user); }
    if (!$('accIn')) return;
    $('accIn').style.display = user ? '' : 'none'; $('accOut').style.display = user ? 'none' : '';
    $('accState').textContent = user ? '' : T('accWhy');
    $('aSync').disabled = busy;
    const nmv = uname(); $('profName').textContent = nmv || T('guest');
    if (user) {
      $('pcName').textContent = nmv; const A = SV.acc || { lvl: 1 }; $('pcLv').textContent = 'Lv ' + A.lvl + ' · ' + T('coinsN', SV.coins);
      $('pcSync').textContent = busy ? '…' : lastSync ? T('accLast', new Date(lastSync).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })) : '';
      heroPic($('pcPic'), U * 18);
    }
  }
  const uname = () => user ? (user.displayName || (user.email || '').replace('@id.slayground.app', '') || 'Player') : '';
  let mode = 'in';
  function setMode(m) {
    mode = m; document.querySelectorAll('#aTabs button').forEach(b => b.classList.toggle('on', b.dataset.m === m));
    $('aPw2').style.display = m === 'up' ? '' : 'none'; $('aGo').textContent = T(m === 'up' ? 'accSign' : 'accLogin');
    $('aPw').autocomplete = m === 'up' ? 'new-password' : 'current-password'; msg('');
  }
  function valid(id, pw) {
    if (!id || (!id.includes('@') && !/^[a-zA-Z0-9_]{3,16}$/.test(id))) { msg(T('accIdRule')); return false; }
    if (!pw || pw.length < 6) { msg(T('accWeak')); return false; }
    return true;
  }
  function bind() {
    if (!on || !$('sAccount')) { ui(); return; }
    $('bAccount').onclick = () => { audioUnlock(); go('sAccount'); msg(''); ui(); init().then(ui, () => {}); };
    $('aGoogle').onclick = () => init().then(() => {
      const pv = new firebase.auth.GoogleAuthProvider(); msg('…');
      auth.signInWithPopup(pv).then(() => msg(''), e => { if (/popup-blocked|operation-not-supported/.test(e.code || '')) auth.signInWithRedirect(pv); else msg(errText(e)); });
    });
    $('aLogin').onclick = () => { const id = $('aId').value, pw = $('aPw').value; if (!valid(id, pw)) return; msg('…'); init().then(() => auth.signInWithEmailAndPassword(idMail(id), pw)).then(() => { msg(''); $('aPw').value = ''; }, e => msg(errText(e))); };
    document.querySelectorAll('#aTabs button').forEach(b => b.onclick = () => { sfx('move', 0.5, 0); setMode(b.dataset.m); });
    $('aGo').onclick = () => { if (mode === 'up') { if ($('aPw2').value !== $('aPw').value) { msg(T('accPwMatch')); return; } $('aSign').click(); } else $('aLogin').click(); };
    $('aSign').onclick = () => { const id = $('aId').value, pw = $('aPw').value; if (!valid(id, pw)) return; msg('…'); init().then(() => auth.createUserWithEmailAndPassword(idMail(id), pw)).then(() => { msg(''); $('aPw').value = ''; $('aPw2').value = ''; setMode('in'); sfx('fanfare', 0.8, 0); }, e => msg(errText(e))); };
    $('aOut').onclick = () => { if (auth) auth.signOut(); msg(''); };
    $('aSync').onclick = () => pull();
    for (const el of [$('aId'), $('aPw'), $('aPw2')]) el.addEventListener('keydown', e => { e.stopPropagation(); if (e.key === 'Enter') $('aGo').click(); });
    ui();
    try { if (localStorage.getItem('dm.acc')) init().catch(() => {}); } catch (e) {}
    // remember that this device used an account, so the SDK is loaded on the next visit to restore the session
  }
  return { on, bind, push, ui, get user() { return user; }, mark() { try { localStorage.setItem('dm.acc', '1'); } catch (e) {} } };
})();

// ------------------------------------------------------------- daily challenge
const DMODS = ['horde', 'glass', 'swift', 'rich', 'dark', 'elite', 'brute'];
function dailyInfo() {
  const d = new Date(), key = d.getUTCFullYear() * 10000 + (d.getUTCMonth() + 1) * 100 + d.getUTCDate();
  let x = key * 2654435761 >>> 0; const rnd2 = () => { x ^= x << 13; x >>>= 0; x ^= x >>> 17; x ^= x << 5; x >>>= 0; return x / 4294967296; };
  const stages = Object.keys(STAGES), stage = stages[(rnd2() * stages.length) | 0];
  const pool = DMODS.slice(), mods = [];
  while (mods.length < 2) mods.push(pool.splice((rnd2() * pool.length) | 0, 1)[0]);
  if (!SV.daily || SV.daily.d !== key) SV.daily = { d: key, best: 0, paid: false, runs: 0 };
  return { key, seed: key, stage, mods };
}
const dailyScore = () => Math.floor(G.t) + G.kills + (G.won ? 1000 : 0);

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
  document.querySelectorAll('[data-ph]').forEach(el => { el.placeholder = T(el.dataset.ph); });
  refreshTitle();
}
function refreshTitle() {
  const A = SV.acc || { lvl: 1, xp: 0 }; $('accLv').textContent = 'Lv ' + A.lvl; $('accFill').style.width = (A.xp / accNeed(A.lvl) * 100).toFixed(1) + '%';
  $('bankTitle').textContent = SV.coins ? T('coinsN', SV.coins) : ''; ACC.ui();
  $('recTitle').textContent = SV.best.time ? L().best(fmt(SV.best.time)) : '';
  document.querySelectorAll('.bank').forEach(b => b.textContent = SV.coins);
  if (SV.dia == null) { SV.dia = 60; persist(); }
  document.querySelectorAll('.diaN').forEach(b => b.textContent = SV.dia || 0); $('bGacha').classList.toggle('has', (SV.dia || 0) >= DRAW1);
  heroPic($('profPic'), U * 13);
  $('profChip').classList.toggle('off', !ACC.on);
  const att = attState().pending, mc = mClaimable();
  $('bAttend').classList.toggle('has', att); $('bCol').classList.toggle('has', colClaimable()); $('bMissions').classList.toggle('has', mc); $('bQuests').classList.toggle('has', mc);
}
function toTitle() {
  state.mode = 'title'; state.paused = false; $('hud').classList.remove('show'); screenStack = [];
  showScreen('sTitle'); refreshTitle(); playMusic('title'); genWorld(); initAttract();
  if (SV.runs > 0 && attState().pending) setTimeout(() => { if (curScreen === 'sTitle' && attState().pending) openAttend(); }, 700);
}
function openAttend() { buildAttend(); go('sAttend'); }
function buildAttend(popIdx) {
  const s = attState(), claimedToday = !s.pending, n = s.n, wk = Math.floor((n - 1) / 7), idx = (n - 1) % 7;
  const box = $('attGrid'); box.innerHTML = '';
  for (let i = 0; i < 7; i++) {
    const day = wk * 7 + i + 1, got = i < idx || (i === idx && claimedToday);
    const d = document.createElement('div'); d.className = 'aday' + (i === 6 ? ' d7' : '') + (i === idx ? ' today' : '') + (got ? ' got' : '') + (i === popIdx ? ' pop' : '');
    const dn = document.createElement('span'); dn.className = 'dn'; dn.textContent = T('attDay', day);
    const ic = document.createElement('span'); ic.className = 'ico'; if (i === 6) ic.appendChild(iconCanvas('chest_full_open_anim_f0', U * 9)); else { ic.className = 'gem big'; ic.textContent = '◆'; }
    const am = document.createElement('span'); am.className = 'am'; am.textContent = attReward(day);
    const st = document.createElement('span'); st.className = 'stamp'; st.textContent = T('attGot');
    d.append(dn, ic, am, st); box.appendChild(d);
  }
  $('attSub').textContent = T('attSub', claimedToday ? n : Math.max(0, n - 1));
  $('attNote').textContent = claimedToday ? T('attTmr') : (wk ? T('attWk2') : T('attWk'));
  const b = $('attBtn'); b.textContent = claimedToday ? T('attOk') : T('attClaim');
  b.onclick = () => {
    if (!attState().pending) { back(); return; }
    const r = attClaim(); buildAttend(idx); sfx('coins', 0.9, 0); if (idx === 6) setTimeout(() => sfx('fanfare', 0.8, 0), 250);
    refreshTitle(); flyCoins(r);
  };
}
function flyCoins(r) { const el = document.querySelector('#sAttend .attNote'); if (el) el.textContent = '◆ +' + r; }
$('bAttend').onclick = () => { audioUnlock(); openAttend(); };
$('bGacha').onclick = () => { audioUnlock(); $('gOut').innerHTML = ''; $('gMsg').textContent = ''; buildGacha(); go('sGacha'); };
$('gOne').onclick = () => doDraw(1); $('gTen').onclick = () => doDraw(10);
$('bCol').onclick = () => { audioUnlock(); buildCol('w'); go('sCol'); };
$('bMissions').onclick = () => { audioUnlock(); buildQuests('d'); go('sQuests'); };
$('profChip').onclick = () => { if (ACC.on) $('bAccount').onclick(); };
$('bStart').onclick = () => { audioUnlock(); buildModes(); go('sMode'); };
function buildModes() {
  const d = dailyInfo();
  $('dailyInfo').textContent = nm(STAGES[d.stage])[0] + ' · ' + d.mods.map(m => T('mod.' + m)).join(' · ');
  $('dailyBest').textContent = SV.daily.best ? T('dailyBest', SV.daily.best) : (SV.daily.paid ? '' : T('dailyReward', 200));
  $('mParty').style.display = NET.avail() ? '' : 'none';
}
$('mSolo').onclick = () => { FLOW = 'solo'; buildHeroes(); go('sHero'); };
$('mDaily').onclick = () => { FLOW = 'daily'; buildHeroes(); go('sHero'); };
$('mParty').onclick = () => { FLOW = 'party'; NET.openLobby(); go('sParty'); };
$('bArmory').onclick = () => { audioUnlock(); buildShop(); go('sArmory'); };
$('bQuests').onclick = () => { audioUnlock(); buildQuests('d'); go('sQuests'); };
let qTab = 'd';
document.querySelectorAll('#qTabs button').forEach(b => b.onclick = () => { sfx('move', 0.5, 0); buildQuests(b.dataset.tab); });
function hhmm() { const d = new Date(), m = 1440 - d.getHours() * 60 - d.getMinutes(); return (m / 60 | 0) + ':' + String(m % 60).padStart(2, '0'); }
function buildMissions() {
  const M = missions(), box = $('mlist'); box.innerHTML = '';
  const row = (cls, txt, sub, frac, rew, state, onClaim, icon) => {
    const d = document.createElement('div'); d.className = 'quest ' + cls;
    const t = document.createElement('div'); t.className = 'mt';
    const a = document.createElement('div'); a.textContent = txt; t.appendChild(a);
    if (frac != null) { const bar = document.createElement('i'); bar.className = 'bar'; const f = document.createElement('i'); f.style.width = (frac * 100).toFixed(0) + '%'; bar.appendChild(f); t.appendChild(bar); }
    const p = document.createElement('div'); p.className = 'p'; p.textContent = sub;
    const r = document.createElement('div'); r.className = 'r'; if (icon) r.appendChild(iconCanvas(icon, U * 5)); else { const g = document.createElement('i'); g.className = 'gem'; g.textContent = '◆'; r.appendChild(g); } r.append(String(rew));
    const act = document.createElement(state === 'claim' ? 'button' : 'span');
    if (state === 'claim') { act.className = 'btn small big'; act.textContent = T('attClaim'); act.onclick = onClaim; } else { act.className = 'got'; act.textContent = state === 'got' ? T('claimed') : ''; }
    d.append(t, p, r, act); box.appendChild(d);
  };
  M.l.forEach(m => {
    const st = m.c ? 'got' : mDone(m) ? 'claim' : 'none';
    row((mDone(m) ? 'ok' : '') + (m.c ? ' claimedrow' : ''), mText(m), T('progress', Math.min(m.p, m.n), m.n), Math.min(1, m.p / m.n), m.r, st, () => { m.c = 1; SV.dia = (SV.dia || 0) + m.r; persist(); sfx('coins', 0.9, 0); buildMissions(); refreshTitle(); });
  });
  const all = M.l.every(m => m.c), cnt = M.l.filter(m => m.c).length;
  row('bonus' + (M.b ? ' claimedrow' : ''), T('mBonus'), T('progress', cnt, 3), cnt / 3, MBONUS, M.b ? 'got' : all ? 'claim' : 'none', () => { M.b = 1; SV.dia = (SV.dia || 0) + MBONUS; persist(); sfx('fanfare', 0.8, 0); buildMissions(); refreshTitle(); });
  $('mReset').textContent = T('mReset', hhmm());
}
function buildQuests(tab) {
  if (tab) qTab = tab;
  document.querySelectorAll('#qTabs button').forEach(b => b.classList.toggle('on', b.dataset.tab === qTab));
  $('mWrap').style.display = qTab === 'd' ? '' : 'none'; $('qlist').style.display = qTab === 'a' ? '' : 'none';
  buildMissions();
  checkQuests();
  const box = $('qlist'); box.innerHTML = '';
  QUESTS.slice().sort((a, b) => (SV.q[a.id] ? 1 : 0) - (SV.q[b.id] ? 1 : 0)).forEach(q => {
    const done = !!SV.q[q.id], pr = Math.min(qProg(q), qGoal(q));
    const d = document.createElement('div'); d.className = 'quest' + (done ? ' done' : '');
    const t = document.createElement('div'); t.className = 't'; t.textContent = qText(q);
    const pg = document.createElement('div'); pg.className = 'p'; pg.textContent = done ? T('claimed') : T('progress', pr, qGoal(q));
    const r = document.createElement('div'); r.className = 'r'; const gq = document.createElement('i'); gq.className = 'gem'; gq.textContent = '◆'; r.appendChild(gq); r.append(String(qDia(q)));
    d.append(t, pg, r); box.appendChild(d);
  });
  refreshTitle();
}
function buildLangs() {
  const box = $('langs'); box.innerHTML = '';
  Object.keys(I18).forEach(k => {
    const b = document.createElement('button'); b.className = 'btn small' + (SV.settings.lang === k ? ' on' : ''); b.textContent = I18[k]._name;
    b.onclick = () => { SV.settings.lang = k; persist(); applyLang(); syncSettings(); sfx('select', 0.5, 0); back(); };
    box.appendChild(b);
  });
}
$('oLangBtn').onclick = () => { buildLangs(); screenStack.push(curScreen); showScreen('sLang'); sfx('select', 0.5, 0); };
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
    if (!owned) { const p = document.createElement('div'); p.className = 'price'; p.appendChild(iconCanvas('coin_anim_f0', U * 5)); p.append(String(heroCost(h))); b.appendChild(p); }
    b.onclick = () => {
      if (!SV.heroes[id]) {
        if (SV.coins >= heroCost(h)) { SV.coins -= heroCost(h); SV.heroes[id] = true; SV.hero = id; persist(); checkQuests(); sfx('fanfare', 0.8, 0); buildHeroes(); refreshTitle(); }
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
  t.children[0].textContent = nm(h)[0]; t.children[1].textContent = nm(h)[1];
  const wn = nm(WP[h.weapon]), tn = str('tr.' + id);
  t.children[2].innerHTML = '<b></b> <span></span><br><b class="tr"></b> <span></span>';
  t.children[2].children[0].textContent = wn[0] + ' —'; t.children[2].children[1].textContent = wn[1];
  t.children[2].children[3].textContent = (tn[0] || '') + ' —'; t.children[2].children[4].textContent = tn[1] || '';
  const kit = document.createElement('div'); kit.className = 'kit';
  const kl = document.createElement('span'); kl.textContent = T('kitL') + ':'; kit.appendChild(kl);
  for (const wid in HKIT[id]) { const c = document.createElement('span'); c.className = 'kw'; c.appendChild(iconCanvas(WP[wid].icon, U * 7)); c.appendChild(document.createTextNode('+')); c.appendChild(iconCanvas(PS[HKIT[id][wid]].icon, U * 7)); c.title = nm(WP[wid])[0] + ' + ' + nm(PS[HKIT[id][wid]])[0]; kit.appendChild(c); }
  const pw = Math.round((tierMul(id) - 1) * 100); if (pw) { const pe = document.createElement('b'); pe.className = 'pow'; pe.textContent = T('heroPow', pw); kit.appendChild(pe); }
  t.appendChild(kit);
  if (!SV.heroes[id]) { const lk = document.createElement('div'); lk.className = 'lock'; lk.textContent = SV.coins >= heroCost(h) ? T('lockedCan', heroCost(h)) : T('lockedNeed', heroCost(h), SV.coins); t.appendChild(lk); }
  el.appendChild(t);
}
$('bGo').onclick = () => {
  if (!SV.heroes[SV.hero]) SV.hero = 'knight';
  if (FLOW === 'daily') { startRun(dailyOpts()); return; }
  if (FLOW === 'party') { NET.heroChanged(); screenStack.pop(); showScreen('sParty'); NET.drawLobby(); return; }
  buildStages(); go('sStage');
};
function buildStages() {
  const box = $('stages'); box.innerHTML = '';
  if (!stageOpen(SV.stage)) SV.stage = 'keep';
  Object.keys(STAGES).forEach(id => {
    const st = STAGES[id], open = stageOpen(id), rec = mapRec(id);
    const b = document.createElement('button'); b.className = 'stage' + (SV.stage === id ? ' sel' : '') + (open ? '' : ' locked');
    const ic = document.createElement('div'); ic.className = 'sic'; ic.appendChild(iconCanvas(st.icon, U * 20)); b.appendChild(ic);
    const tx = document.createElement('div'); tx.className = 'stx';
    const t = document.createElement('div'); t.className = 't'; t.textContent = nm(st)[0];
    const d = document.createElement('div'); d.className = 'd'; d.textContent = open ? nm(st)[1] : L().lockedBy(nm(STAGES[st.need])[0]);
    const tl = SV.stage === id ? curTor(id) : 0;
    const m = document.createElement('div'); m.className = 'm'; m.textContent = L().stageMods(num(st.hp * (1 + 0.25 * tl)), num(st.gold * (1 + 0.2 * tl)));
    const r = document.createElement('div'); r.className = 'r'; r.textContent = rec.best ? `${L().best(fmt(rec.best))}${rec.cleared ? ' · ' + L().clearedMark : ''}` : L().noRecord;
    tx.append(t, d, m, r);
    if (SV.stage === id && open && (rec.tor || 0) > 0) {
      const tr = document.createElement('div'); tr.className = 'tor';
      const mk = (txt, dl) => { const x = document.createElement('span'); x.className = 'tbtn'; x.textContent = txt; x.onclick = ev => { ev.stopPropagation(); SV.tor[id] = clamp(tl + dl, 0, Math.min(5, rec.tor)); persist(); sfx('move', 0.5, 0); buildStages(); }; return x; };
      const lab = document.createElement('span'); lab.className = 'tlab'; lab.textContent = T('torment', tl);
      tr.append(mk('-', -1), lab, mk('+', 1)); tx.appendChild(tr);
      const td = document.createElement('div'); td.className = 'tord'; td.textContent = T('tormentD'); tx.appendChild(td);
    }
    b.appendChild(tx);
    b.onclick = () => { if (!open) { sfx('deny', 0.6, 0); return; } SV.stage = id; persist(); sfx('select', 0.5, 0); buildStages(); };
    box.appendChild(b);
  });
}
$('bGo2').onclick = () => {
  if (!stageOpen(SV.stage)) SV.stage = 'keep';
  if (FLOW === 'party') { NET.stageChanged(); screenStack.pop(); showScreen('sParty'); NET.drawLobby(); return; }
  startRun({});
};

// armory
const ADC_MAX = 3, BOOST_MIN = 20;
function adCoinsLeft() { const d = new Date().toDateString(); if (!SV.adc || SV.adc.d !== d) SV.adc = { d, n: 0 }; return ADC_MAX - SV.adc.n; }
function buildAdCoins() {
  const b = $('bAdCoins'); if (!b) return; const left = adCoinsLeft(), bl = boostLeft();
  if (NOREW() || (left <= 0 && bl <= 0)) { b.style.display = 'none'; return; }
  b.style.display = ''; b.disabled = left <= 0 || bl > 90 * 60;
  b.textContent = (bl > 0 ? T('boostOn', Math.ceil(bl / 60)) + ' · ' : '') + (left > 0 ? T('adBoost', BOOST_MIN, left, ADC_MAX) : '');
  b.onclick = () => { if (b.disabled) return; b.disabled = true; ADS.show('rewarded', () => { SV.adc.n++; SV.boost = Math.max(Date.now(), SV.boost || 0) + BOOST_MIN * 60000; persist(); sfx('coins', 1, 0); buildAdCoins(); }, () => { b.textContent = L().adFail; setTimeout(buildAdCoins, 1500); }); };
}
function buildShop() {
  buildAdCoins();
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
  for (const k in SV.shop) { const lv = SV.shop[k] || 0, bs = SHOP[k] ? SHOP[k].base : k === 'magnet' ? 90 : 0; for (let i = 0; i < lv; i++) back += Math.round(bs * (1 + i * 0.9) / 5) * 5; }
  SV.coins += back; SV.shop = {}; persist(); sfx('coins', 0.8, 0); buildShop();
};

// settings
function syncSettings() {
  $('oMusic').value = SV.settings.music; $('oSfx').value = SV.settings.sfx;
  const seg = (id, v) => document.querySelectorAll(`#${id} button`).forEach(b => b.classList.toggle('on', String(b.dataset.v) === String(v)));
  $('oLangBtn').textContent = I18[SV.settings.lang]._name; seg('oShake', SV.settings.shake); seg('oNums', SV.settings.nums);
}
$('oMusic').oninput = e => { SV.settings.music = +e.target.value; setVolumes(); persist(); };
$('oSfx').oninput = e => { SV.settings.sfx = +e.target.value; setVolumes(); persist(); };
$('oSfx').onchange = () => sfx('coin', 0.8, 0);
document.querySelectorAll('#oShake button').forEach(b => b.onclick = () => { SV.settings.shake = +b.dataset.v; persist(); syncSettings(); sfx('select', 0.5, 0); });
document.querySelectorAll('#oNums button').forEach(b => b.onclick = () => { SV.settings.nums = +b.dataset.v; persist(); syncSettings(); sfx('select', 0.5, 0); });

// pause
function pauseGame() { if (state.mode !== 'play') return; if (G && G.guest) { buildInv(); showScreen('sPause'); screenStack = []; return; } state.paused = true; gpStop(); buildInv(); showScreen('sPause'); screenStack = []; sfx('pausein', 0.7, 0); if (AU.music) AU.music.volume *= 0.35; }
function resume() { if (G && G.guest) { showScreen(null); return; } state.paused = false; gpStart(); showScreen(null); sfx('pauseout', 0.7, 0); setVolumes(); }
$('pauseBtn').onclick = () => pauseGame();
$('bResume').onclick = resume;
$('bPSettings').onclick = () => { syncSettings(); screenStack = ['sPause']; showScreen('sSettings'); };
$('bGiveUp').onclick = () => { if (G && G.guest) { NET.leave(); toTitle(); return; } state.paused = false; showScreen(null); setVolumes(); if (G.mode === 'party') { for (const q of G.players) q.down = true; } die(); };
function dailyOpts() { const d = dailyInfo(); return { daily: d, seed: d.seed, stage: d.stage, tor: 0 }; }
$('bAgain').onclick = () => {
  if (G && G.mode === 'party') { NET.backToLobby(); return; }
  const go = () => startRun(G && G.daily ? dailyOpts() : {}); ADS.show('midgame', go, go);
};
$('bEndTitle').onclick = () => { if (G && G.mode === 'party') NET.leave(); ADS.show('midgame', toTitle, toTitle); };
$('bEndArmory').onclick = () => { toTitle(); buildShop(); go('sArmory'); };

let FLOW = 'solo', LASTOPTS = null;
function startRun(opts) {
  audioUnlock(); sfx('portal', 0.8, 0);
  opts = opts && opts.roster || opts && opts.daily ? opts : (FLOW === 'daily' ? dailyOpts() : {});
  LASTOPTS = opts;
  newRun(SV.hero, opts); G.st0 = Object.assign({}, SV.stats); refreshStats(); try { if (window.GStats) GStats.start(); } catch (e) {}
  state.mode = 'play'; state.paused = false; screenStack = [];
  showScreen(null); $('hud').classList.add('show'); fillIcons($('hud')); invSig = ''; buildInv(); hudLast = {}; hud();
  playMusic('level1');
  banner(G.daily ? T('modeDaily') + ' — ' + nm(STAGES[G.stage])[0] : nm(STAGES[G.stage])[0]);
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

// ------------------------------------------------------------- online party (our own site only)
const ENK = Object.keys(EN), ENI = Object.fromEntries(ENK.map((k, i) => [k, i]));
const SPK = Object.keys(AT), SPI = Object.fromEntries(SPK.map((k, i) => [k, i]));
const PKK = ['coin', 'heart', 'keg', 'chest', 'mimic', 'pfreeze', 'phaste', 'pmagnet'], PKI = Object.fromEntries(PKK.map((k, i) => [k, i]));
const SKK = ['knife', 'axe', 'arrow', 'bomb', 'orb', 'boom', 'wave', 'tornado'], SKI = Object.fromEntries(SKK.map((k, i) => [k, i]));
const NET = {
  role: null, code: '', kind: '', peer: null, bc: null, conns: [], conn: null, myId: '', you: 0, lobby: [], stage: 'keep',
  waiting: new Set(), emap: new Map(), nid: 0, snapT: 0, sendT: 0, dashT: 0, lastT: 0, picked: false, invSig: {}, hostDoneLv: false,
  avail() { return !PORTAL; },
  name() { if (!SV.pname) SV.pname = 'P' + ((Math.random() * 900 + 100) | 0); return SV.pname.slice(0, 12); },
  msg(t) { const el = $('pMsg'); if (el) el.textContent = t || ''; },
  async lib() {
    if (/nettest/.test(location.search)) return 'bc';
    if (!window.Peer) await new Promise((ok, no) => { const sc = document.createElement('script'); sc.src = 'https://unpkg.com/peerjs@1.5.4/dist/peerjs.min.js'; sc.onload = ok; sc.onerror = no; document.head.appendChild(sc); });
    return 'peer';
  },
  openLobby() { $('pName').value = NET.name(); NET.drawLobby(); },
  newCode() { const A = 'ABCDEFGHJKMNPQRSTUVWXYZ23456789'; let c = ''; for (let i = 0; i < 5; i++) c += A[(Math.random() * A.length) | 0]; return c; },
  async create() {
    NET.leave(true); NET.msg(T('pConnecting'));
    try { NET.kind = await NET.lib(); } catch (e) { NET.msg(T('pFail')); return; }
    NET.role = 'host'; NET.code = NET.newCode(); NET.conns = []; NET.stage = SV.stage || 'keep';
    const ready = () => { NET.msg(''); NET.drawLobby(); };
    if (NET.kind === 'bc') { NET.bc = new BroadcastChannel('dmnet-' + NET.code); NET.bc.onmessage = ev => { const m = ev.data; if (m.to !== 'host') return; let c = NET.conns.find(x => x.id === m.from); if (!c) { c = NET.wrapBC(m.from); NET.onConn(c); } c.recv(m.d); }; ready(); return; }
    NET.peer = new window.Peer('dmw-' + NET.code, { debug: 0 });
    NET.peer.on('open', ready);
    NET.peer.on('connection', pc => { pc.on('open', () => { const c = { id: pc.peer, send: d => { try { pc.open && pc.send(d); } catch (e) {} }, recv: null, close: () => pc.close() }; pc.on('data', d => c.recv && c.recv(d)); pc.on('close', () => NET.onClose(c)); NET.onConn(c); }); });
    NET.peer.on('error', e => { if (e && e.type === 'unavailable-id') { NET.create(); return; } NET.msg(T('pFail')); });
  },
  wrapBC(id) { return { id, send: d => NET.bc && NET.bc.postMessage({ to: id, from: 'host', d }), recv: null, close: () => {} }; },
  onConn(c) {
    if (NET.conns.length >= 3 || (G && G.mode === 'party' && state.mode !== 'end' && NET.started)) { c.send({ t: 'full' }); return; }
    c.info = null; NET.conns.push(c);
    c.recv = d => NET.hostMsg(c, d);
  },
  onClose(c) {
    NET.conns = NET.conns.filter(x => x !== c);
    if (G && G.mode === 'party' && c.pl) { c.pl.down = true; c.pl.left = true; c.pl.input = null; NET.waiting.delete(c.pl.id); if (!NET.waiting.size && NET.hostDoneLv) NET.resume(); }
    NET.lobbySync();
  },
  async join() {
    const code = $('pCode').value.trim().toUpperCase(); if (code.length < 4) { NET.msg(T('pBadCode')); return; }
    NET.leave(true); NET.msg(T('pConnecting'));
    try { NET.kind = await NET.lib(); } catch (e) { NET.msg(T('pFail')); return; }
    NET.role = 'guest'; NET.code = code;
    const hello = () => NET.send({ t: 'hello', name: NET.name(), hero: SV.hero, shop: SV.shop });
    if (NET.kind === 'bc') {
      NET.myId = 'g' + Math.random().toString(36).slice(2, 8); NET.bc = new BroadcastChannel('dmnet-' + code);
      NET.bc.onmessage = ev => { const m = ev.data; if (m.to === NET.myId) NET.guestMsg(m.d); };
      NET.conn = { send: d => NET.bc.postMessage({ to: 'host', from: NET.myId, d }) }; hello(); NET.lastT = performance.now(); return;
    }
    NET.peer = new window.Peer(undefined, { debug: 0 });
    NET.peer.on('open', () => {
      const pc = NET.peer.connect('dmw-' + code, { reliable: true, serialization: 'json' });
      const to = setTimeout(() => { if (!pc.open) NET.msg(T('pNotFound')); }, 9000);
      pc.on('open', () => { clearTimeout(to); NET.conn = { send: d => { try { pc.open && pc.send(d); } catch (e) {} } }; hello(); NET.lastT = performance.now(); });
      pc.on('data', d => NET.guestMsg(d));
      pc.on('close', () => NET.hostGone());
    });
    NET.peer.on('error', e => NET.msg(e && e.type === 'peer-unavailable' ? T('pNotFound') : T('pFail')));
  },
  send(d) { if (NET.conn) NET.conn.send(d); },
  toAll(d) { for (const c of NET.conns) c.send(d); },
  toPlayer(pl, d) { const c = NET.conns.find(x => x.pl === pl); if (c) c.send(d); },
  leave(silent) {
    if (NET.role === 'host') NET.toAll({ t: 'bye' });
    try { NET.peer && NET.peer.destroy(); } catch (e) {} try { NET.bc && NET.bc.close(); } catch (e) {}
    NET.peer = null; NET.bc = null; NET.conns = []; NET.conn = null; NET.role = null; NET.code = ''; NET.lobby = []; NET.started = false;
    if (!silent) NET.drawLobby();
  },
  hostGone() { if (NET.role !== 'guest') return; NET.leave(true); if (G && G.guest && state.mode !== 'end') { toTitle(); } NET.msg(T('pHostLeft')); banner(T('pHostLeft')); },
  heroChanged() { if (NET.role === 'guest') NET.send({ t: 'hero', hero: SV.hero }); else if (NET.role === 'host') NET.lobbySync(); },
  stageChanged() { if (NET.role === 'host') { NET.stage = SV.stage; NET.lobbySync(); } },
  roster() { return [{ name: NET.name(), hero: SV.hero }].concat(NET.conns.filter(c => c.info).map(c => ({ name: c.info.name, hero: c.info.hero }))); },
  lobbySync() { if (NET.role !== 'host') return; const m = { t: 'lobby', list: NET.roster(), stage: NET.stage, code: NET.code }; NET.lobby = m.list; NET.toAll(m); NET.drawLobby(); },
  drawLobby() {
    const inRoom = !!NET.role; $('pOut').style.display = inRoom ? 'none' : ''; $('pIn').style.display = inRoom ? '' : 'none';
    if (!inRoom) return;
    $('pRoom').textContent = NET.code; $('pStage').textContent = nm(STAGES[NET.stage || 'keep'])[0];
    const box = $('pList'); box.innerHTML = '';
    (NET.lobby.length ? NET.lobby : [{ name: NET.name(), hero: SV.hero }]).forEach((r, i) => { const d = document.createElement('div'); d.className = 'pl'; d.appendChild(iconCanvas(frames(HEROES[r.hero].spr, 'idle')[0], U * 12)); const n = document.createElement('span'); n.textContent = (i === 0 ? '★ ' : '') + r.name + ' — ' + hn(r.hero); d.appendChild(n); box.appendChild(d); });
    $('pStart').style.display = NET.role === 'host' ? '' : 'none'; $('pStageBtn').style.display = NET.role === 'host' ? '' : 'none';
    $('pWait').textContent = NET.role === 'guest' ? T('pWaitHost') : (NET.conns.length ? '' : T('pShare'));
  },
  hostMsg(c, d) {
    if (d.t === 'hello') { c.info = { name: String(d.name || '?').slice(0, 12), hero: HEROES[d.hero] ? d.hero : 'knight', shop: d.shop || {} }; NET.lobbySync(); }
    else if (d.t === 'hero' && c.info) { c.info.hero = HEROES[d.hero] ? d.hero : 'knight'; NET.lobbySync(); }
    else if (d.t === 'in' && c.pl) c.pl.input = d;
    else if (d.t === 'pick' && c.pl) NET.gotPick(c.pl, d.i);
    else if (d.t === 'bye') NET.onClose(c);
  },
  start() {
    if (NET.role !== 'host') return;
    const cs = NET.conns.filter(x => x.info), seed = (Math.random() * 1e9) | 0, stage = NET.stage || SV.stage || 'keep';
    const roster = [{ hero: SV.hero, shop: SV.shop, local: true, name: NET.name() }].concat(cs.map(x => ({ hero: x.info.hero, shop: x.info.shop, local: false, name: x.info.name })));
    NET.started = true; NET.waiting.clear(); NET.invSig = {}; NET.hostDoneLv = false;
    cs.forEach((x, i) => x.send({ t: 'start', seed, stage, roster: roster.map(r => ({ hero: r.hero, shop: r.shop, name: r.name })), you: i + 1 }));
    startRun({ mode: 'party', roster, seed, stage, tor: 0 });
    cs.forEach((x, i) => { x.pl = G.players[i + 1]; x.pl.lvq = 0; });
  },
  backToLobby() { if (NET.role === 'host') { NET.started = false; NET.lobbySync(); NET.toAll({ t: 'lobby', list: NET.roster(), stage: NET.stage, code: NET.code, back: 1 }); } showScreen('sParty'); state.mode = 'title'; NET.drawLobby(); },
  // ---- host side of a running game
  hostTick(dt) {
    NET.snapT -= dt; if (NET.snapT > 0 || !NET.conns.length) return; NET.snapT = 1 / 15;
    const sn = NET.snap(); for (const c of NET.conns) if (c.pl) c.send(sn);
    for (const c of NET.conns) if (c.pl) { const pl = c.pl, sig = pl.weapons.map(w => w.id + w.lvl + (w.evo ? 'E' : '')).join() + JSON.stringify(pl.passives) + JSON.stringify(pl.bl); if (NET.invSig[pl.id] !== sig) { NET.invSig[pl.id] = sig; c.send({ t: 'inv', w: pl.weapons.map(w => [w.id, w.lvl, w.evo ? 1 : 0]), p: pl.passives, bl: pl.bl }); } }
  },
  snap() {
    const r = Math.round, f2 = v => Math.round((v || 0) * 100) / 100;
    const P = G.players.map(pl => [r(pl.p.x), r(pl.p.y), pl.p.face, pl.p.moving ? 1 : 0, r(pl.p.hp), r((pl.ST || ST).maxhp), pl.down ? 1 : 0, f2(pl.reviveT), pl.tr.shield ? 1 : 0, pl.p.hurtT > 0.15 ? 1 : 0]);
    const E = []; for (const e of G.enemies) if (e.hp > 0) { if (!e.nid) e.nid = ++NET.nid; E.push([e.nid, ENI[e.type], r(e.x), r(e.y), e.face, e.flash > 0 ? 1 : 0, (e.elite ? 1 : 0) | (e.boss ? 2 : 0) | (e.static ? 4 : 0) | (e.stunT > 0 ? 8 : 0)]); }
    const K = G.pickups.map(k => [PKI[k.k], r(k.x), r(k.y), k.v || 0]);
    const S = []; for (const q of G.shots) if (q.t >= 0) S.push([SKI[q.kind], q.spr ? SPI[q.spr] : -1, r(q.x), r(q.y), f2(q.rot), r(q.z || 0), q.evo ? 1 : 0, r(q.r || 0), f2(q.spin), f2(q.life), f2(q.t)]);
    const W = []; for (const q of G.swings) if (q.t >= 0) W.push([G.players.indexOf(q.w && q.w.pl), q.kind === 'thrust' ? 1 : q.kind === 'slam' ? 2 : 0, SPI[q.spr], f2(q.ang), f2(q.cur), f2(q.ext), r(q.len || 0), r(q.r || 0), f2(q.arc), f2(q.t), f2(q.dur), q.streak ? 1 : 0]);
    const B = G.blasts.map(b => [r(b.x), r(b.y), r(b.r), f2(b.t), f2(b.life), (b.ring ? 1 : 0) | (b.ice ? 2 : 0) | (b.marker === 'comet' ? 4 : 0) | (b.marker === 'forge' ? 8 : 0) | (b.pending ? 16 : 0)]);
    const Z = G.zones.map(z => [r(z.x), r(z.y), r(z.r), f2(z.t), z.life]);
    const O = []; for (const pl of G.players) for (const w of pl.weapons) if (w.orbs) for (const o of w.orbs) O.push([r(o.x), r(o.y), f2(o.a), w.evo ? 1 : 0]);
    const N = []; for (const n of G.nums) if (!n.s && N.length < 30) { n.s = 1; N.push([r(n.x), r(n.y), n.v, (n.crit ? 1 : 0) | (n.heal ? 2 : 0) | (n.poison ? 4 : 0)]); }
    const Q = []; for (const z of G.zaps) if (!z.s) { z.s = 1; Q.push([0, r(z.x1), r(z.y1), r(z.x2), r(z.y2)]); } for (const z of G.slashes) if (!z.s) { z.s = 1; Q.push([1, r(z.x), r(z.y), f2(z.a), z.small ? 1 : 0]); }
    const X = G.eshots.map(q => [r(q.x), r(q.y), q.c, r(q.vx), r(q.vy)]), A = G.warns.filter(w => w.t < 0).map(w => [r(w.x), r(w.y), r(w.r), f2(w.t)]), Hz = G.hazards.map(h => [r(h.x), r(h.y), r(h.r), f2(h.t), h.life]);
    const bl = G.bossList.filter(b => b.hp > 0);
    return { X, A, Hz, tm: G.totem ? [r(G.totem.x), r(G.totem.y), G.totem.r, f2(G.totem.prog)] : null, bt: G.bloodT > 0 ? 1 : 0, wr: G.wraith ? [r(G.wraith.x), r(G.wraith.y), G.wraith.face || 1] : null, dr: G.drumT > 0 ? 1 : 0, ev: (G.evSeq || 0) + ':' + (G.evKind || ''), t: 's', T: f2(G.t), k: G.kills, g: r(G.gold), l: G.lvl, x: f2(G.xp / xpNeed(G.lvl)), fz: f2(G.frenzyT > 0 ? G.frenzyT / 8 : G.fz), fo: G.frenzyT > 0 ? 1 : 0, fr: G.freezeT > 0 ? 1 : 0, m: state.mode === 'play' && !state.paused ? 0 : 1, P, E, K, S, W, B, Z, O, N, Q, sh: G.shrines.map(q => q.used ? 1 : 0), bo: bl.length ? [bl.map(b => ENI[b.type]), Math.round(bl.reduce((a, b) => a + b.hp, 0) / bl.reduce((a, b) => a + b.maxhp, 0) * 1000) / 1000] : null };
  },
  levelUp() { for (const c of NET.conns) if (c.pl && !c.pl.left) { c.pl.lvq = (c.pl.lvq || 0) + 1; NET.waiting.add(c.pl.id); if (!c.pl.choices) NET.sendLevel(c.pl, c); } },
  sendLevel(pl, c) {
    if (!(pl.lvq > 0)) return; pl.lvq--; use(pl); pl.choices = rollChoices(nChoices()); use(LPL());
    (c || NET.conns.find(x => x.pl === pl)).send({ t: 'lv', c: pl.choices.map(q => [q.kind, q.id || '', q.rar || 0]) });
  },
  gotPick(pl, i) {
    if (!pl.choices) return; const ch = pl.choices[i] || pl.choices[0]; pl.choices = null;
    use(pl); applyChoice(ch); applyRarity(ch); use(LPL());
    if (pl.lvq > 0) NET.sendLevel(pl); else NET.waiting.delete(pl.id);
    if (!NET.waiting.size && NET.hostDoneLv) NET.resume();
  },
  hostWait() { NET.hostDoneLv = true; $('choices').innerHTML = ''; $('bReroll').style.display = 'none'; $('lvWait').textContent = T('pWaitOthers'); },
  resume() { NET.hostDoneLv = false; if (state.mode !== 'level') return; showScreen(null); state.mode = 'play'; gpStart(); },
  sendEnd() {
    for (const c of NET.conns) if (c.pl) c.send({ t: 'end', won: G.won ? 1 : 0, T: G.t, k: G.kills, l: G.lvl, g: G.gold, w: c.pl.weapons.map(w => [w.id, w.lvl, w.evo ? 1 : 0, Math.round(w.dmg)]) });
  },
  // ---- guest side
  guestMsg(d) {
    NET.lastT = performance.now();
    if (d.t === 'lobby') { NET.msg(''); NET.lobby = d.list; NET.stage = d.stage; if (d.back && G && G.guest) { G.guest = false; state.mode = 'title'; showScreen('sParty'); } NET.drawLobby(); }
    else if (d.t === 'full') { NET.msg(T('pFull')); NET.leave(true); NET.drawLobby(); }
    else if (d.t === 'bye') NET.hostGone();
    else if (d.t === 'start') {
      NET.you = d.you; NET.emap.clear(); NET.picked = false;
      const roster = d.roster.map((r, i) => ({ hero: r.hero, shop: r.shop || {}, name: r.name, local: i === d.you }));
      roster[d.you].shop = SV.shop;
      startRun({ mode: 'party', roster, seed: d.seed, stage: d.stage, tor: 0, guest: true });
    }
    else if (!G || !G.guest) return;
    else if (d.t === 's') NET.applySnap(d);
    else if (d.t === 'inv') { const pl = LPL(); use(pl); pl.weapons.length = 0; for (const a of d.w) pl.weapons.push({ id: a[0], pl, lvl: a[1], evo: !!a[2], t: 0, dmg: 0, q: 0, qt: 0, hits: new Map(), spin: 0 }); for (const k in pl.passives) delete pl.passives[k]; Object.assign(pl.passives, d.p); Object.assign(pl.bl, d.bl); refreshStats(); buildInv(); }
    else if (d.t === 'lv') { NET.picked = false; G.netChoices = d.c.map(a => ({ kind: a[0], id: a[1] || undefined, rar: a[2] || 0 })); state.mode = 'level'; $('lvTitle').textContent = T('levelUp'); showChoices(G.netChoices); showScreen('sLevel'); sfx('levelup', 0.9, 0); }
    else if (d.t === 'msg') { if (d.k === 'shrine') banner(T('bl.' + d.id)[0] || T('shrine')); else if (d.text) banner(d.text); sfx(d.evo ? 'fanfare' : 'chest', 0.8, 0); }
    else if (d.t === 'end') {
      G.won = !!d.won; G.t = d.T; G.kills = d.k; G.lvl = d.l; G.gold = d.g; G.over = true;
      const pl = LPL(); use(pl); for (const w of pl.weapons) { const a = d.w.find(x => x[0] === w.id); if (a) w.dmg = a[3]; }
      finishRun();
    }
  },
  pick(i) { NET.send({ t: 'pick', i }); NET.picked = true; $('choices').innerHTML = ''; $('lvWait').textContent = T('pWaitOthers'); },
  applySnap(m) {
    const LP = LPL();
    G.t = m.T; G.kills = m.k; G.gold = m.g; if (m.l > G.lvl) { burst(LP.p.x, LP.p.y - 10, 30, ['#72d6ce', '#cae6f5', '#fdf7ed'], 120, 0.5, 0); } G.lvl = m.l; G.xpFrac = m.x; G.fz = m.fz;
    if (m.fo && !(G.frenzyT > 0)) { banner(T('frenzy')); sfx('fanfare', 0.7, 0); } G.frenzyT = m.fo ? Math.max(0.01, m.fz * 8) : 0; G.freezeT = m.fr ? 1 : 0;
    m.P.forEach((a, i) => { const pl = G.players[i]; if (!pl) return; const q = pl.p;
      if (!pl.local) { q.tx = a[0]; q.ty = a[1]; q.face = a[2]; q.moving = !!a[3]; if (q.x === undefined || Math.abs(q.x - a[0]) > 200) { q.x = a[0]; q.y = a[1]; } }
      else if (a[4] < q.hp - 0.5) { G.redT = 0.25; q.hurtT = 0.25; G.shake = Math.max(G.shake, 0.2); sfx('hurt', 0.6, 0.05); }
      q.hp = a[4]; pl.mh = a[5]; pl.down = !!a[6]; pl.reviveT = a[7]; pl.tr.shield = !!a[8]; if (!pl.local) q.hurtT = a[9] ? 0.2 : 0;
    });
    const seen = new Set();
    for (const a of m.E) {
      let e = NET.emap.get(a[0]);
      if (!e) { const type = ENK[a[1]], dd = EN[type], runF = frames(dd.spr || type, 'run'), f0 = AT[runF[0]], el = !!(a[6] & 1), bo = !!(a[6] & 2), sc = el ? 2 : (dd.bsc || 1);
        e = { type, run: runF, idle: frames(dd.spr || type, 'idle'), h: f0 ? f0[3] : 16, sc, r: bo ? 13 : (f0 && f0[3] > 18 ? 7 : 6) * sc, x: a[2], y: a[3], anim: Math.random() * 4, hp: 1, maxhp: 1, kbx: 0, kby: 0, hitCd: {} }; NET.emap.set(a[0], e); }
      e.tx = a[2]; e.ty = a[3]; e.face = a[4]; e.flash = a[5] ? 0.08 : 0; e.elite = !!(a[6] & 1); e.boss = !!(a[6] & 2); e.static = !!(a[6] & 4); e.stunT = a[6] & 8 ? 1 : 0; seen.add(a[0]);
    }
    let bursts = 0;
    for (const [id, e] of NET.emap) if (!seen.has(id)) { NET.emap.delete(id); if (bursts++ < 14 && Math.abs(e.x - LP.p.x) < VW && Math.abs(e.y - LP.p.y) < VH) { const pts = samples(e.static ? 'crate' : e.run[0]); for (let i = 0; i < 8 && pts.length; i++) { const pt = pick(pts), an = rnd(0, TAU), sp = rnd(20, 70); G.parts.push({ x: e.x + pt[0] * e.sc, y: e.y + pt[1] * e.sc, vx: Math.cos(an) * sp, vy: Math.sin(an) * sp - 30, g: 160, c: pt[2], t: 0, life: rnd(0.35, 0.7), sz: e.sc }); } } }
    G.enemies = [...NET.emap.values()];
    G.pickups = m.K.map(a => ({ k: PKK[a[0]], x: a[1], y: a[2], v: a[3], t: (a[1] * 0.37 + a[2] * 0.11) % 1 }));
    G.shots = m.S.map(a => ({ kind: SKK[a[0]], spr: a[1] >= 0 ? SPK[a[1]] : null, x: a[2], y: a[3], rot: a[4], z: a[5], evo: !!a[6], r: a[7], spin: a[8], life: a[9], t: a[10], fly: 0.45 }));
    G.swings = m.W.map(a => ({ o: G.players[a[0]] ? G.players[a[0]].p : LP.p, kind: a[1] === 1 ? 'thrust' : a[1] === 2 ? 'slam' : 'arc', spr: SPK[a[2]], ang: a[3], cur: a[4], ext: a[5], len: a[6], r: a[7], arc: a[8], t: a[9], dur: a[10], streak: !!a[11] }));
    G.blasts = m.B.map(a => ({ x: a[0], y: a[1], r: a[2], t: a[3], life: a[4], ring: !!(a[5] & 1), ice: !!(a[5] & 2), marker: a[5] & 4 ? 'comet' : a[5] & 8 ? 'forge' : null, pending: !!(a[5] & 16) }));
    G.zones = m.Z.map(a => ({ x: a[0], y: a[1], r: a[2], t: a[3], life: a[4] }));
    G.orbsNet = m.O;
    G.eshots = (m.X || []).map(a => ({ x: a[0], y: a[1], c: a[2], vx: a[3] || 0, vy: a[4] || 0, t: 0.5, life: 1 })); G.warns = (m.A || []).map(a => ({ x: a[0], y: a[1], r: a[2], t: a[3] })); G.hazards = (m.Hz || []).map(a => ({ x: a[0], y: a[1], r: a[2], t: a[3], life: a[4] }));
    G.totem = m.tm ? { x: m.tm[0], y: m.tm[1], r: m.tm[2], prog: m.tm[3] } : null; G.bloodT = m.bt ? 1 : 0; G.wraith = m.wr ? { x: m.wr[0], y: m.wr[1], face: m.wr[2] } : null; G.drumT = m.dr ? 1 : 0;
    if (m.ev && m.ev !== G.evSeen) { const k = m.ev.split(':')[1]; if (G.evSeen && k) { banner(T('ev.' + k)); sfx('fanfare', 0.6, 0); } G.evSeen = m.ev; }
    for (const a of m.N) G.nums.push({ x: a[0], y: a[1], v: a[2], t: 0, crit: !!(a[3] & 1), heal: !!(a[3] & 2), poison: !!(a[3] & 4) });
    for (const a of m.Q) { if (a[0] === 0) G.zaps.push({ x1: a[1], y1: a[2], x2: a[3], y2: a[4], t: 0 }); else G.slashes.push({ x: a[1], y: a[2], a: a[3], small: !!a[4], t: 0, life: a[4] ? 0.18 : 0.22 }); }
    m.sh.forEach((u, i) => { if (G.shrines[i]) G.shrines[i].used = !!u; });
    const hadBoss = G.bossList.length; G.bossList = m.bo ? m.bo[0].map(ti => ({ type: ENK[ti], hp: m.bo[1], maxhp: 1 })) : [];
    if (G.bossList.length > hadBoss) { banner(L().bossIn); sfx('portal', 0.9, 0); }
    if (m.m === 0 && state.mode === 'level' && NET.picked) { showScreen(null); state.mode = 'play'; }
    $('netWait').classList.toggle('show', m.m === 1 && state.mode === 'play');
  }
};
function guestUpdate(dt) {
  const LP = LPL(); use(LP); const p = LP.p;
  if (state.mode === 'play' && !LP.down) { const [mx, my] = localInput(); movePlayer(LP, dt, mx, my); }
  if (p.inv > 0) p.inv -= dt; if (p.hurtT > 0) p.hurtT -= dt;
  const k = Math.min(1, dt * 12);
  for (const pl of G.players) if (!pl.local && pl.p.tx != null) { pl.p.x += (pl.p.tx - pl.p.x) * k; pl.p.y += (pl.p.ty - pl.p.y) * k; pl.p.anim += dt * (pl.p.moving ? 9 : 5); }
  for (const e of G.enemies) { e.x += (e.tx - e.x) * k; e.y += (e.ty - e.y) * k; e.anim += dt * 8; }
  for (const b of G.blasts) b.t += dt;
  for (const q of G.shots) { q.t += dt; if (q.kind === 'tornado') q.spin += dt * 14; }
  for (let i = G.ghosts.length - 1; i >= 0; i--) { G.ghosts[i].t += dt; if (G.ghosts[i].t > 0.25) G.ghosts.splice(i, 1); }
  for (let i = G.parts.length - 1; i >= 0; i--) { const q = G.parts[i]; q.t += dt; q.vy += (q.g || 0) * dt; q.x += q.vx * dt; q.y += q.vy * dt; q.vx *= 0.96; if (q.t > q.life) G.parts.splice(i, 1); }
  for (let i = G.nums.length - 1; i >= 0; i--) { const n = G.nums[i]; n.t += dt; if (n.t > 0.7) G.nums.splice(i, 1); }
  for (let i = G.zaps.length - 1; i >= 0; i--) { G.zaps[i].t += dt; if (G.zaps[i].t > 0.18) G.zaps.splice(i, 1); }
  for (let i = G.slashes.length - 1; i >= 0; i--) { G.slashes[i].t += dt; if (G.slashes[i].t > G.slashes[i].life) G.slashes.splice(i, 1); }
  if (G.redT > 0) G.redT -= dt; if (G.shake > 0) G.shake -= dt; if (G.flashT > 0) G.flashT -= dt;
  const tx = p.x - VW / 2, ty = p.y - 12 - VH / 2;
  G.cam.x += (tx - G.cam.x) * Math.min(1, dt * 10); G.cam.y += (ty - G.cam.y) * Math.min(1, dt * 10);
  G.cam.x = clamp(G.cam.x, -40, Math.max(-40, AW + 40 - VW)); G.cam.y = clamp(G.cam.y, -56, Math.max(-56, AH + 48 - VH));
  if (VW > AW + 80) G.cam.x = (AW - VW) / 2; if (VH > AH + 104) G.cam.y = (AH - VH) / 2;
  if (NET.dashT > 0) NET.dashT -= dt; if (NET.dash) { NET.dash = false; NET.dashT = 0.3; }
  NET.sendT -= dt;
  if (NET.sendT <= 0) { NET.sendT = 0.05; NET.send({ t: 'in', x: Math.round(p.x), y: Math.round(p.y), f: p.face, m: p.moving ? 1 : 0, dx: Math.round(p.dirx * 100) / 100, dy: Math.round(p.diry * 100) / 100, dash: NET.dashT > 0 ? 1 : 0 }); }
  if (performance.now() - NET.lastT > 8000) NET.hostGone();
  playMusic(G.t < 195 ? 'level1' : G.t < 390 ? 'level2' : 'level3');
  hud();
}
$('pCreate').onclick = () => { SV.pname = ($('pName').value || '').trim().slice(0, 12) || NET.name(); persist(); NET.create(); };
$('pJoin').onclick = () => { SV.pname = ($('pName').value || '').trim().slice(0, 12) || NET.name(); persist(); NET.join(); };
$('pHero').onclick = () => { buildHeroes(); go('sHero'); };
$('pStageBtn').onclick = () => { buildStages(); go('sStage'); };
$('pStart').onclick = () => NET.start();
$('pLeave').onclick = () => { NET.leave(); };
$('pBack').onclick = () => { NET.leave(true); back(); };
$('pCopy').onclick = () => { try { navigator.clipboard.writeText(NET.code); NET.msg(T('pCopied')); } catch (e) {} };

// ------------------------------------------------------------- main loop
let last = performance.now();
function frame(now) {
  const dt = Math.min(1 / 30, (now - last) / 1000); last = now;
  if (state.mode === 'title' || ['sHero', 'sArmory', 'sSettings', 'sCredits', 'sQuests', 'sLang', 'sStage', 'sMode', 'sParty'].includes(curScreen) && state.mode !== 'play' && state.mode !== 'level') {
    if (V && sheet.complete) { updateAttract(dt); render(ATTRACT.cam); }
    heroAnims.forEach(h => { const x = h.c.getContext('2d'); x.clearRect(0, 0, h.c.width, h.c.height); const f = AT[h.fr[((now / 110) | 0) % h.fr.length]]; x.drawImage(sheet, f[0], f[1], f[2], f[3], 0, 0, f[2], f[3]); });
  } else if (G && (state.mode === 'play' || state.mode === 'level' || state.mode === 'chest' || state.mode === 'dying' || state.mode === 'end' || state.mode === 'offer')) {
    if (G.guest) { if (state.mode === 'play' || state.mode === 'level') guestUpdate(dt); }
    else if (state.mode === 'play' && !state.paused) update(dt);
    if (NET.role === 'host' && G.mode === 'party') NET.hostTick(dt);
    else if (state.mode === 'dying') {
      G.dieT -= dt;
      const p = G.p; for (let i = G.parts.length - 1; i >= 0; i--) { const q = G.parts[i]; q.t += dt; q.vy += (q.g || 0) * dt; q.x += q.vx * dt; q.y += q.vy * dt; if (q.t > q.life) G.parts.splice(i, 1); }
      for (let i = G.nums.length - 1; i >= 0; i--) { G.nums[i].t += dt; if (G.nums[i].t > 0.7) G.nums.splice(i, 1); }
      if (G.won) { G.t += 0; for (const e of G.enemies) e.anim += dt * 4; G.enemies = G.enemies.filter(e => e.hp > 0); } else { void p; }
      if (G.dieT <= 0 && !G.guest) finishRun();
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
  resize(); ACC.bind();
  ADS.init().then(() => { ADS.ev('load1'); loadCloudSave(); step(); });
  const fill = $('loadFill');
  let done = 0; const need = 3;
  const step = () => { done++; fill.style.width = (done / need * 100) + '%'; if (done >= need) setTimeout(() => { applyLang(); toTitle(); ADS.ev('load0'); }, 150); };
  sheet.onload = () => { buildSheets(); step(); };
  sheet.src = 'assets/tiles.png';
  Promise.all(['Galmuri11', 'Galmuri7', 'Galmuri9'].map(f => document.fonts.load(`12px ${f}`))).then(step, step);
  requestAnimationFrame(frame);
}
boot();
})();

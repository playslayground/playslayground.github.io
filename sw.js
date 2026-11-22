// Dungeon Mower offline cache
const V = 'dm-v2';
const CORE = ["play/", "play/assets/CREDITS.txt", "play/assets/atlas.js", "play/assets/audio/bigboom.mp3", "play/assets/audio/boom.mp3", "play/assets/audio/chest.mp3", "play/assets/audio/coin.mp3", "play/assets/audio/coins.mp3", "play/assets/audio/dead.mp3", "play/assets/audio/deny.mp3", "play/assets/audio/ending.mp3", "play/assets/audio/fanfare.mp3", "play/assets/audio/heal.mp3", "play/assets/audio/hit.mp3", "play/assets/audio/hurt.mp3", "play/assets/audio/impact.mp3", "play/assets/audio/knife.mp3", "play/assets/audio/level1.mp3", "play/assets/audio/level2.mp3", "play/assets/audio/level3.mp3", "play/assets/audio/levelup.mp3", "play/assets/audio/move.mp3", "play/assets/audio/pausein.mp3", "play/assets/audio/pauseout.mp3", "play/assets/audio/pick.mp3", "play/assets/audio/portal.mp3", "play/assets/audio/select.mp3", "play/assets/audio/shoot.mp3", "play/assets/audio/sword.mp3", "play/assets/audio/thunk.mp3", "play/assets/audio/title.mp3", "play/assets/fonts/Galmuri11-Bold.woff2", "play/assets/fonts/Galmuri11.woff2", "play/assets/fonts/Galmuri7.woff2", "play/assets/fonts/Galmuri9.woff2", "play/assets/fonts/OFL.txt", "play/assets/icon.png", "play/assets/tiles.png", "play/game.js", "play/i18n.js", "play/style.css"];
self.addEventListener('install', e => { e.waitUntil(caches.open(V).then(c => c.addAll(CORE)).then(() => self.skipWaiting())); });
self.addEventListener('activate', e => { e.waitUntil(caches.keys().then(ks => Promise.all(ks.filter(k => k !== V).map(k => caches.delete(k)))).then(() => self.clients.claim())); });
self.addEventListener('fetch', e => {
  const r = e.request; if (r.method !== 'GET') return;
  const u = new URL(r.url); if (u.origin !== location.origin) return;
  if (r.headers.has('range')) return; // let the browser stream video itself
  if (r.mode === 'navigate') { // pages: fresh when online, cached copy when not
    e.respondWith(fetch(r).then(res => { const cp = res.clone(); caches.open(V).then(c => c.put(r, cp)); return res; }).catch(() => caches.match(r, { ignoreSearch: true }).then(m => m || caches.match('play/'))));
    return;
  }
  e.respondWith(caches.match(r).then(m => m || fetch(r).then(res => { if (res.ok && res.status === 200) { const cp = res.clone(); caches.open(V).then(c => c.put(r, cp)); } return res; })));
});

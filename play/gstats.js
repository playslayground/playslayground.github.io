/* 게임 쪽 계측·원격 수치 (모든 게임 공통, 외부 라이브러리 없음)
쓰는 법:
<script>window.GSTATS={g:'trinket-trio', p:'pg', url:'https://roa-games.<계정>.workers.dev'}</script>
<script src="js/gstats.js"></script>
게임 코드에서:
await GStats.ready; // 원격 수치 받기(최대 1.5초, 실패하면 기본값)
const COINV = GStats.cfg('COINV', 0.3);
GStats.start(); GStats.end({lv: 12, win: false});
GStats.ad('int') / GStats.ad('rew') / GStats.ad('rew_ok')
개인정보 없음: 무작위 익명 번호만 쓴다. */
(function () {
var O = window.GSTATS || {}, base = (O.url || '').replace(/\/$/, '');
var u; try { u = localStorage.getItem('gs_u'); if (!u) { u = Math.random().toString(36).slice(2, 12) + Date.now().toString(36).slice(-4); localStorage.setItem('gs_u', u); } } catch (e) { u = 'x' + Math.random().toString(36).slice(2, 12); }
var cfg = {}, t0 = 0;
function send(t, extra) {
if (!base || !O.g) return;
var b = { g: O.g, p: O.p || window.DM_PORTAL || window.TT_PORTAL || (/crazygames/.test(location.hostname) ? 'cg' : 'site'), u: u, t: t };
if (extra) for (var k in extra) b[k] = extra[k];
var s = JSON.stringify(b);
try {
if (navigator.sendBeacon && navigator.sendBeacon(base + '/e', new Blob([s], { type: 'text/plain' }))) return;
} catch (e) {}
try { fetch(base + '/e', { method: 'POST', body: s, keepalive: true, mode: 'cors' }).catch(function () {}); } catch (e) {}
}
var ready = new Promise(function (res) {
if (!base || !O.g) return res(cfg);
var done = false, tm = setTimeout(function () { if (!done) { done = true; res(cfg); } }, 1500);
fetch(base + '/cfg?g=' + encodeURIComponent(O.g), { mode: 'cors' }).then(function (r) { return r.json(); })
.then(function (j) { if (!done) { cfg = j || {}; done = true; clearTimeout(tm); try { localStorage.setItem('gs_cfg', JSON.stringify(cfg)); } catch (e) {} res(cfg); } })
.catch(function () { if (!done) { try { cfg = JSON.parse(localStorage.getItem('gs_cfg') || '{}'); } catch (e) {} done = true; clearTimeout(tm); res(cfg); } });
});
/* 접속자 수: 화면이 보일 때만 1분마다 신호 */
setInterval(function () { if (document.visibilityState === 'visible') send('hb'); }, 60000);
send('open');
window.addEventListener('pagehide', function () { if (t0) { send('end', { d: Math.round((Date.now() - t0) / 1000), quit: 1 }); t0 = 0; } });
window.GStats = {
ready: ready,
cfg: function (k, d) { var v = cfg[k]; return (typeof v === 'number' && isFinite(v)) ? v : d; },
start: function () { t0 = Date.now(); send('start'); },
end: function (o) { var d = t0 ? Math.round((Date.now() - t0) / 1000) : 0; t0 = 0; o = o || {}; send('end', { d: d, lv: o.lv, win: o.win ? 1 : 0 }); },
ad: function (kind) { send('ad_' + kind); }
};
})();

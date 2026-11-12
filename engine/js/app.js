/* Modes: present (default) · gallery · edit · flat / expand / handout (static, for lint and PDF). */
const DATA = JSON.parse(document.getElementById('lectern-data').textContent);
LX.D = DATA.deck; LX.F = DATA.facts; LX.STY = DATA.styles; LX.IMG = DATA.images;
Object.values(LX.IMG).forEach((im, k) => { im.v = '--img' + k; document.documentElement.style.setProperty(im.v, `url(${im.uri})`); });
const ORDER = DATA.order, $ = (s, r = document) => r.querySelector(s), $$ = (s, r = document) => [...r.querySelectorAll(s)];
const stage = $('#stage'), ui = $('#ui');
const hp = location.hash.slice(1).split('&'), hq = Object.fromEntries(hp.filter(x => x.includes('=')).map(x => x.split('=')));
const ST = {style: LX.STY[hq.style] ? hq.style : (LX.STY[LX.D.meta.style] ? LX.D.meta.style : ORDER[0]), i: 0, at: 0, mode: '', from: ''};
const pageRule = css => { let s = $('style[data-rt]'); if (!s) { s = document.createElement('style'); s.dataset.rt = 1; document.head.appendChild(s); } s.textContent = css; };
const toast = t => { const d = document.createElement('div'); d.className = 'lx-toast'; d.textContent = t; document.body.appendChild(d); setTimeout(() => d.remove(), 2600); };
function staticMode(mode) {
  document.body.className = 'static ' + mode; ui.innerHTML = ''; stage.innerHTML = deckHTML(ST.style);
  const S = $$('.slide', stage);
  if (mode === 'handout') { pageRule('@page{size:A4;margin:0}');
    S.forEach(s => { applyStep(s, +s.dataset.steps); const pg = document.createElement('div'); pg.className = 'hpage'; s.before(pg);
      const box = document.createElement('div'); box.className = 'hslide'; box.appendChild(s); pg.appendChild(box);
      const p = document.createElement('p'); p.className = 'hsay'; p.textContent = s.dataset.say || ''; pg.appendChild(p); }); return; }
  pageRule('@page{size:1920px 1080px;margin:0}');
  S.forEach(s => { const n = +s.dataset.steps;
    if (mode === 'expand') for (let k = 0; k < n; k++) { const c = s.cloneNode(true); applyStep(c, k); s.before(c); }
    applyStep(s, n); });
}
function present(i = ST.i, at = 0) {
  ST.mode = 'present'; ST.i = i; ST.at = at; document.body.className = 'present'; ui.innerHTML = '<div id="lx-notes"></div><div id="lx-src"></div>';
  stage.innerHTML = deckHTML(ST.style); showSlide();
}
function showSlide() {
  const S = $$('.slide', stage); ST.i = Math.max(0, Math.min(ST.i, S.length - 1));
  S.forEach((s, k) => s.classList.toggle('cur', k === ST.i)); applyStep(S[ST.i], ST.at);
  document.body.style.setProperty('--fit', Math.min(innerWidth / 1920, innerHeight / 1080));
  const nb = $('#lx-notes'); if (nb) nb.textContent = S[ST.i].dataset.say || '';
  // "where does that number come from?": every number visible right now, with how it was computed
  const sb = $('#lx-src'); if (sb) { const ids = [...new Set($$('[data-fact]', S[ST.i]).filter(e => !e.closest('.off')).map(e => e.dataset.fact))];
    sb.innerHTML = ids.length ? ids.map(k => `<div><b>${esc(LX.F[k].text)}</b><span>${esc(LX.F[k].how)}</span></div>`).join('') : '<div><span>No numbers on this slide.</span></div>'; }
}
function next() { const S = $$('.slide', stage); if (ST.at < +S[ST.i].dataset.steps) ST.at++; else if (ST.i < S.length - 1) { ST.i++; ST.at = 0; } showSlide(); }
function prev() { const S = $$('.slide', stage); if (ST.at > 0) ST.at--; else if (ST.i > 0) { ST.i--; ST.at = +S[ST.i].dataset.steps; } showSlide(); }
function gallery() {
  ST.mode = 'gallery'; document.body.className = 'gallery'; stage.innerHTML = '';
  const n = LX.D.slides.length, name = i => LX.D.slides[i].id, sl = {};
  ORDER.forEach(s => { const st = {...LX.STY[s]}; st.slots = {...SLOTS, ...(st.slots || {})}; sl[s] = LX.D.slides.map((x, i) => slide(x, i, n, st)); });
  const tok = Object.entries(LX.D.meta.tokens || {}).map(([k, v]) => `${k}:${v}`).join(';');
  const frame = (s, i) => `<button class="frame s-${s}" style="${esc(tok)}" data-s="${s}" data-i="${i}" aria-label="${esc(LX.STY[s].cn)} ${i + 1}">${sl[s][i]}</button>`;
  ui.innerHTML = `<div class="g-wrap"><h1>${esc(LX.D.meta.short || 'Lectern')}</h1>
<p class="g-intro">每次展示一种风格的全部 ${n} 页。点页面开始放映，逐步呈现内容。按左右方向键切换风格；放映时按 G 返回这里。</p>
<nav class="g-nav" aria-label="切换风格"><button type="button" class="g-prev" aria-label="上一种风格">← 上一种</button><label class="g-select-label" for="g-style">风格 <select id="g-style">${ORDER.map(s => `<option value="${s}">${esc(LX.STY[s].cn)}</option>`).join('')}</select></label><span class="g-count" aria-live="polite"></span><button type="button" class="g-next" aria-label="下一种风格">下一种 →</button><button type="button" class="g-edit">编辑这份幻灯片</button></nav>
<p class="g-lede"></p><div class="g-sheet"></div></div>` +
    ORDER.map(s => `<div class="s-${s}">${patternSheet(s)}</div>`).join('');
  let index = Math.max(0, ORDER.indexOf(ST.style));
  const fit = f => f.style.setProperty('--s', f.clientWidth / 1920), ro = new ResizeObserver(es => es.forEach(e => fit(e.target)));
  function draw() {
    const view = ORDER[index]; ST.style = view; ro.disconnect();
    $('#g-style').value = view; $('.g-count').textContent = `${index + 1} / ${ORDER.length}`;
    $('.g-lede').innerHTML = `<b>${esc(LX.STY[view].cn)} · ${esc(LX.STY[view].en)}</b>　${esc(LX.STY[view].line)}`;
    $('.g-sheet').innerHTML = LX.D.slides.map((_, i) => `<figure>${frame(view, i)}<figcaption>${i + 1} / ${n} · ${esc(name(i))}</figcaption></figure>`).join('');
    $$('.g-sheet .frame').forEach(f => { applyStep($('.slide', f), 99); ro.observe(f); fit(f); f.onclick = e => { e.stopPropagation(); ST.from = 'gallery'; present(+f.dataset.i, 0); }; });
  }
  function shift(d) { index = (index + d + ORDER.length) % ORDER.length; draw(); }
  $('.g-prev').onclick = () => shift(-1);
  $('.g-next').onclick = () => shift(1);
  $('#g-style').onchange = e => { index = ORDER.indexOf(e.target.value); draw(); };
  $('.g-edit').onclick = () => { ST.from = 'gallery'; edit(); };
  ST.galleryShift = shift;
  draw();
}
addEventListener('resize', () => { if (ST.mode === 'present') showSlide(); });
addEventListener('click', e => { if (ST.mode === 'present' && !e.target.closest('#ui')) next(); });
addEventListener('keydown', e => {
  if (ST.mode === 'gallery' && !e.metaKey && !e.ctrlKey && !e.altKey && !e.target.closest('input, select, textarea, [contenteditable]')) {
    if (e.key === 'ArrowRight' || e.key === 'ArrowLeft') { e.preventDefault(); ST.galleryShift(e.key === 'ArrowRight' ? 1 : -1); }
    return;
  }
  if (ST.mode !== 'present' || e.metaKey || e.ctrlKey) return;
  if (['ArrowRight', ' ', 'PageDown', 'Enter'].includes(e.key)) { e.preventDefault(); next(); }
  else if (['ArrowLeft', 'PageUp', 'Backspace'].includes(e.key)) prev();
  else if (e.key === 'f') document.documentElement.requestFullscreen?.().catch(() => {});
  else if (e.key === 'n') document.body.classList.toggle('notes');
  else if (e.key === 'd') { document.body.classList.toggle('sources'); showSlide(); }
  else if (e.key === 's') { ST.style = ORDER[(ORDER.indexOf(ST.style) + 1) % ORDER.length]; present(ST.i, ST.at); toast(LX.STY[ST.style].cn + ' · ' + LX.STY[ST.style].en); }
  else if (e.key === 'e') edit();
  else if (e.key === 'g' || (e.key === 'Escape' && ST.from === 'gallery')) gallery();
});

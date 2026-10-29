'use strict';
/* Plus Calculator — a Digits-style tape calculator. Pure JS, runs inside an Android WebView. */

const $ = s => document.querySelector(s);
const $$ = s => Array.from(document.querySelectorAll(s));
const A = window.Android || null;

/* ---------- icons (line style) ---------- */
const sv = (p, w = 1.6) => `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="${w}" stroke-linecap="round" stroke-linejoin="round">${p}</svg>`;
const IC = {
  delrow: sv('<path d="M8 3h8l5 9-5 9H8l-5-9z"/><path d="M9.5 9.5l5 5M14.5 9.5l-5 5"/>'),
  back: sv('<path d="M8 6h12v12H8l-5-6z"/><path d="M11 9.5l5 5M16 9.5l-5 5"/>'),
  clearall: sv('<circle cx="12" cy="12" r="9"/><path d="M8.5 8.5l7 7M15.5 8.5l-7 7"/>'),
  clear: sv('<path d="M17.5 7.2A7.5 7.5 0 1 0 17.5 16.8"/><path d="M15.4 9.1A4.6 4.6 0 1 0 15.4 14.9"/>', 1.4),
  mem: sv('<path d="M4 19V5l8 9 8-9v14"/><path d="M6.5 19V10.5l5.5 6.2 5.5-6.2V19"/>', 1.3),
  neg: sv('<path d="M12 4v8M8 8h8M7 18h10"/>'),
  tapes: sv('<rect x="5" y="3" width="14" height="18" rx="1"/><path d="M8 7h8M8 10h8M8 13h8M8 16h5"/>'),
  pct: sv('<path d="M18 5L6 19"/><circle cx="7.5" cy="7.5" r="2.5"/><circle cx="16.5" cy="16.5" r="2.5"/>'),
  '÷': sv('<path d="M5 12h14"/><circle cx="12" cy="6.5" r="1.2" fill="currentColor"/><circle cx="12" cy="17.5" r="1.2" fill="currentColor"/>', 2.2),
  '×': sv('<path d="M6.5 6.5l11 11M17.5 6.5l-11 11"/>', 2.2),
  '−': sv('<path d="M5 12h14"/>', 2.2),
  '=': sv('<path d="M5 9h14M5 15h14"/>', 2.2),
  '+': sv('<path d="M12 3.5v17M3.5 12h17"/>', 2.6),
  share: sv('<path d="M12 3v12M8 7l4-4 4 4"/><path d="M7 10H5v11h14V10h-2"/>'),
  settings: sv('<circle cx="12" cy="12" r="3"/><path d="M12 2.5v2.2M12 19.3v2.2M2.5 12h2.2M19.3 12h2.2M5.3 5.3l1.6 1.6M17.1 17.1l1.6 1.6M5.3 18.7l1.6-1.6M17.1 6.9l1.6-1.6"/><circle cx="12" cy="12" r="6.2"/>'),
  themes: sv('<path d="M12 3a9 9 0 1 0 0 18c1.2 0 1.6-1 1.1-1.9-.6-1-.1-2.1 1.1-2.1H17a4 4 0 0 0 4-4c0-5.5-4-10-9-10z"/><circle cx="7.5" cy="11" r="1.2"/><circle cx="10" cy="7" r="1.2"/><circle cx="15" cy="7.5" r="1.2"/>'),
  tips: sv('<path d="M9 18h6M10 21h4"/><path d="M12 3a6 6 0 0 0-3.6 10.8c.6.5 1 1.2 1 2V16h5.2v-.2c0-.8.4-1.5 1-2A6 6 0 0 0 12 3z"/>'),
  help: sv('<circle cx="12" cy="12" r="9"/><path d="M12 11v6"/><circle cx="12" cy="7.6" r=".9" fill="currentColor"/>'),
  pDelete: sv('<path d="M8 3h8l5 9-5 9H8l-5-9z"/><path d="M9.5 9.5l5 5M14.5 9.5l-5 5"/>', 1.3),
  pEdit: sv('<path d="M16.5 3.5l4 4L8 20H4v-4z"/><path d="M14 6l4 4"/>', 1.3),
  pInsert: sv('<rect x="3" y="3" width="18" height="7" rx="1"/><path d="M3 14h10l3 3.5-3 3.5H3z"/>', 1.3),
  pCopy: sv('<rect x="8" y="8" width="13" height="13" rx="1.5"/><path d="M16 8V4.5A1.5 1.5 0 0 0 14.5 3h-10A1.5 1.5 0 0 0 3 4.5v10A1.5 1.5 0 0 0 4.5 16H8"/>', 1.3),
  pComment: sv('<path d="M4 4h16v12h-9l-5 4v-4H4z"/>', 1.3),
  pFlag: sv('<path d="M5 21V3h13l-3 5 3 5H5"/>', 1.3),
};

/* ---------- state ---------- */
const OPS = { '+': 1, '−': 1, '×': 1, '÷': 1, '^': 1, 'r': 1 };
const OPSYM = { '+': '+', '−': '−', '×': '×', '÷': '÷', '^': 'xʸ', 'r': 'ʸ√', '=': '=', 'C': 'C' };
const uid = () => Math.random().toString(36).slice(2, 10);

let S = load();
function defaults() {
  const t = newTape('Home');
  return {
    v: 1, tapes: [t], cur: t.id, memory: [],
    set: { theme: 'night', fmt: 'std', group: 'intl', sound: true, haptic: true, plusPct: 200, plusShape: 'tall', keyStyle: 'flat', borders: 'none', borderW: 1, gstRate: 18, gstMode: false, gstKeys: A ? 'col' : 'row', toolbar: true, autoScroll: true, deg: true, tipsSeen: false },
  };
}
function newTape(name) { return { id: uid(), name, start: 0, rows: [], created: Date.now(), updated: Date.now() }; }
function load() {
  try { const s = JSON.parse(localStorage.getItem('tapecalc')); if (s && s.tapes && s.tapes.length) {
    // older builds stored the plus size as a preset name
    if (s.set && s.set.plus && s.set.plusPct == null) s.set.plusPct = { normal: 100, big: 180, huge: 250 }[s.set.plus] || 180;
    s.set = Object.assign(defaults().set, s.set); return s;
  } } catch (e) {}
  return defaults();
}
let saveT = 0;
function save() { clearTimeout(saveT); saveT = setTimeout(() => { try { localStorage.setItem('tapecalc', JSON.stringify(S)); } catch (e) {} }, 120); }
const T = () => S.tapes.find(t => t.id === S.cur) || S.tapes[0];

// entry / mode state (not persisted)
let E = { s: '', pct: false, label: '' };
let pendingOp = '+';
let mode = null;          // null | {type:'edit', i} | {type:'insert', i}
let sciPage = 0;
let selRow = -1;

/* ---------- math ---------- */
const round2 = n => Math.round(n * 100) / 100;
const clean = n => (isFinite(n) ? parseFloat(n.toPrecision(14)) : n);
function apply(a, op, b) {
  switch (op) {
    case '+': return a + b;
    case '−': return a - b;
    case '×': return a * b;
    case '÷': return b === 0 ? NaN : a / b;
    case '^': return Math.pow(a, b);
    case 'r': return b === 0 ? NaN : (a < 0 && Math.abs(b % 2) === 1 ? -Math.pow(-a, 1 / b) : Math.pow(a, 1 / b));
  }
  return a;
}
// recompute running totals; pct rows derive their value from the running total before them
function compute(t = T()) {
  let run = Number(t.start) || 0;
  for (const r of t.rows) {
    if (r.kind === 'total') { r.v = clean(run); r.res = r.v; continue; }
    if (r.kind === 'clear') { run = 0; r.v = 0; r.res = 0; continue; } // C row: start a fresh calculation
    if (r.pct != null) r.v = clean(run * r.pct / 100);
    // GST rows follow the running total above them: add = tax on it, rem = tax contained in it
    if (r.gst) r.v = round2(r.gst.mode === 'add' ? run * r.gst.rate / 100 : run - run / (1 + r.gst.rate / 100));
    run = clean(apply(run, r.op, r.v));
    r.res = run;
  }
  return run;
}
const total = () => compute();

/* ---------- formatting ---------- */
function fmt(n, mode = S.set.fmt) {
  if (n === undefined || n === null) return '';
  if (!isFinite(n)) return 'Error';
  if (Math.abs(n) >= 1e15 || (n !== 0 && Math.abs(n) < 1e-9 && mode === 'flt')) return n.toExponential(6).replace('e+', 'e');
  const loc = S.set.group === 'indian' ? 'en-IN' : S.set.group === 'none' ? 'en-US' : 'en-US';
  const o = mode === 'std' ? { minimumFractionDigits: 2, maximumFractionDigits: 2 }
    : mode === 'whole' ? { maximumFractionDigits: 0 }
    : { maximumFractionDigits: 10 };
  o.useGrouping = S.set.group !== 'none';
  return n.toLocaleString(loc, o).replace(/^-/, '-');
}
function fmtEntry(s) {
  if (!s) return '0';
  const neg = s.startsWith('-'); let b = neg ? s.slice(1) : s;
  let [i, d] = b.split('.');
  const loc = S.set.group === 'indian' ? 'en-IN' : 'en-US';
  let iF = i === '' ? '0' : (S.set.group === 'none' ? i : Number(i).toLocaleString(loc));
  if (i.length > 15) iF = i;
  return (neg ? '-' : '') + iF + (b.includes('.') ? '.' + (d || '') : '');
}
const FMTNAME = { std: 'Standard', flt: 'Float', whole: 'Whole' };

/* ---------- feedback ---------- */
function tick() {
  if (A) { try { if (S.set.sound) A.click(); if (S.set.haptic) A.haptic(); } catch (e) {} }
  else if (S.set.haptic && navigator.vibrate) navigator.vibrate(8);
}
function toast(msg) {
  const el = $('#toast'); el.textContent = msg; el.classList.remove('hidden');
  clearTimeout(toast.t); toast.t = setTimeout(() => el.classList.add('hidden'), 1600);
}
function copyText(s) {
  if (A) A.copy(s);
  else if (navigator.clipboard && window.isSecureContext) navigator.clipboard.writeText(s).catch(() => legacyCopy(s));
  else legacyCopy(s);
  toast('Copied');
}
function legacyCopy(s) {
  const ta = document.createElement('textarea'); ta.value = s; ta.style.cssText = 'position:fixed;opacity:0';
  document.body.appendChild(ta); ta.select(); try { document.execCommand('copy'); } catch (e) {} ta.remove();
}

/* ---------- rendering ---------- */
function renderTape() {
  const t = T(); compute(t);
  const rows = [];
  rows.push(rowHTML({ kind: 'start', v: Number(t.start) || 0, c: t.startC || '' }, 0));
  t.rows.forEach((r, i) => rows.push(rowHTML(r, i + 1)));
  // live preview of the number being typed (not committed yet)
  if (E.s && !mode) rows.push(`<div class="row pending"><span class="ix"></span><span class="lbl">${esc(E.label)}</span><span class="opc">${OPSYM[pendingOp]}</span><span class="val">${fmtEntry(E.s)}${E.pct ? '%' : ''}</span></div>`);
  $('#tape').innerHTML = rows.join('');
  if (S.set.autoScroll && !mode) { const w = $('#tapeWrap'); w.scrollTop = w.scrollHeight; }
}
function rowHTML(r, i) {
  const isTot = r.kind === 'total', isClr = r.kind === 'clear';
  const cls = ['row'];
  if (isTot) cls.push('total');
  if (isClr) cls.push('clr');
  if (r.v < 0) cls.push('neg');
  if (r.flag) cls.push('flag');
  if (selRow === i || (mode && mode.i === i && mode.type === 'edit')) cls.push('sel');
  // first number after a C line starts the new calculation, so it shows no operator (like row 0)
  const prev = i > 1 ? T().rows[i - 2] : null;
  const op = r.kind === 'start' ? '' : isTot ? '=' : isClr ? 'C' : (prev && prev.kind === 'clear' && r.op === '+') ? '' : OPSYM[r.op];
  const pct = r.pct != null ? `<small>${fmt(r.pct, 'std')}%</small>` : r.gst ? `<small>GST ${r.gst.rate}%${r.gst.mode === 'rem' ? ' incl.' : ''}</small>` : '';
  return `<div class="${cls.join(' ')}" data-i="${i}"><span class="ix">${i}</span><span class="lbl">${esc(r.c || '')}</span><span class="opc${isTot ? ' eq' : ''}">${op}</span><span class="val">${fmt(r.v)}${pct}</span></div>`;
}
const esc = s => String(s).replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));

function renderDisplay() {
  const t = T();
  const tot = total();
  $('#dispName').textContent = `"${t.name}" Total [${OPSYM[pendingOp]}${mode ? '' : '='}]`;
  $('#dispMode').textContent = mode ? (mode.type === 'edit' ? `· Editing row ${mode.i}` : `· Inserting after row ${mode.i - 1}`) : '';
  $('#dispFmt').textContent = FMTNAME[S.set.fmt] + (S.set.deg ? '' : ' · rad');
  $('#dispTotal').textContent = fmt(tot);
  let eHTML = fmtEntry(E.s);
  if (E.pct && E.s) eHTML = `${fmt(clean(runBefore() * parseFloat(E.s) / 100))}<small>${fmtEntry(E.s)}%</small>`;
  $('#dispEntry').innerHTML = eHTML;
  $('#dispOp').textContent = E.s || mode ? OPSYM[mode && mode.type === 'edit' ? (T().rows[mode.i - 1] || {}).op || pendingOp : pendingOp] || '' : '';
  $('#display').classList.toggle('edit', !!mode);
  renderGst();
  fitText($('#dispTotal'), $('#display').clientWidth - 70);
  fitText($('#dispEntryRow'), $('#display').clientWidth - 24);
  $$('.k.op').forEach(b => b.classList.toggle('pend', b.dataset.k === pendingOp && !E.s && T().rows.length > 0 && !mode && pendingOp !== '+'));
}
function fitText(el, maxW) {
  el.style.transform = ''; el.classList.add('fit');
  const w = el.scrollWidth;
  if (w > maxW) el.style.transform = `scale(${maxW / w})`;
}
// running total right before the row being typed (used by %)
function runBefore() {
  const t = T(); compute(t);
  if (mode && mode.type === 'edit') { const r = t.rows[mode.i - 2]; return r ? r.res : (Number(t.start) || 0); }
  if (mode && mode.type === 'insert') { const r = t.rows[mode.i - 2]; return r ? r.res : (Number(t.start) || 0); }
  return total();
}
function render() { renderTape(); renderDisplay(); save(); }

/* ---------- keypad logic ---------- */
function commitRow(op) {
  const t = T();
  const v = parseFloat(E.s);
  if (E.s === '' || E.s === '-' || isNaN(v)) return false;
  const row = { id: uid(), kind: 'num', op, v, c: E.label || '' };
  if (E.pct) { row.pct = v; row.v = clean(runBefore() * v / 100); }
  if (mode && mode.type === 'insert') { t.rows.splice(mode.i - 1, 0, row); mode.i++; }
  else t.rows.push(row);
  t.updated = Date.now();
  E = { s: '', pct: false, label: '' };
  return true;
}
function press(k) {
  const t = T();
  if (/^[0-9]$/.test(k)) {
    if (E.s.replace(/[-.]/g, '').length >= 15) return;
    if (E.s === '0') E.s = k; else if (E.s === '-0') E.s = '-' + k; else E.s += k;
    E.label = E.label && E.label.startsWith('=') ? '' : E.label;
  } else if (k === '.') {
    if (!E.s.includes('.')) E.s = (E.s === '' || E.s === '-' ? E.s + '0' : E.s) + '.';
  } else if (k === 'back') {
    if (E.pct) E.pct = false;
    else if (E.s) { E.s = E.s.slice(0, -1); if (E.s === '-') E.s = ''; }
    if (!E.s) E.label = '';
  } else if (k === 'clear') {
    // C ends the current calculation: writes a C line, total goes back to 0, history stays on the tape.
    // While editing / inserting it only cancels that.
    E = { s: '', pct: false, label: '' }; pendingOp = '+';
    if (mode) mode = null;
    else if (t.rows.length || Number(t.start)) { t.rows.push({ id: uid(), kind: 'clear', op: 'C', v: 0, c: '' }); t.updated = Date.now(); }
  } else if (k === 'clearall') {
    if (!t.rows.length && !E.s) return;
    confirmSheet('Clear the tape?', `All ${t.rows.length} rows of "${t.name}" will be removed.`, 'Clear Tape', () => {
      t.rows = []; t.start = 0; t.startC = ''; E = { s: '', pct: false, label: '' }; pendingOp = '+'; mode = null; render();
    });
    return;
  } else if (k === 'delrow') {
    if (mode && mode.type === 'edit') { t.rows.splice(mode.i - 1, 1); mode = null; }
    else if (E.s) E = { s: '', pct: false, label: '' };
    else if (t.rows.length) { t.rows.pop(); toast('Row deleted'); }
  } else if (k === 'neg') {
    if (E.s) E.s = E.s.startsWith('-') ? E.s.slice(1) : '-' + E.s;
    else { const tot = total(); if (tot) { E.s = String(-tot); E.label = ''; } }
  } else if (k === 'pct') {
    if (E.s) E.pct = !E.pct;
  } else if (OPS[k]) {
    opKey(k);
  } else if (k === '=') {
    eqKey();
  } else if (k === 'mem') { memorySheet(); return; }
  else if (k === 'tapes') { tapesSheet(); return; }
  else if (gstKey(k)) { /* handled */ }
  else if (sciKey(k)) { /* handled */ }
  render();
}
function opKey(k) {
  const t = T();
  document.getElementById('dispTotal').classList.remove('bold-total');
  if (mode && mode.type === 'edit') {
    const r = t.rows[mode.i - 1];
    if (r.kind === 'total') { mode = null; return; }
    if (E.s) { const v = parseFloat(E.s); if (!isNaN(v)) { delete r.gst; if (E.pct) { r.pct = v; } else { delete r.pct; r.v = v; } } }
    r.op = k; if (E.label) r.c = r.c || E.label;
    E = { s: '', pct: false, label: '' }; mode = null; return;
  }
  if (E.s) { commitRow(pendingOp); pendingOp = k; }
  else pendingOp = k;
}
function eqKey() {
  const t = T();
  document.getElementById('dispTotal').classList.add('bold-total');
  if (mode && mode.type === 'edit') {
    const r = t.rows[mode.i - 1];
    if (E.s && r && r.kind !== 'total') { const v = parseFloat(E.s); if (!isNaN(v)) { delete r.gst; if (E.pct) r.pct = v; else { delete r.pct; r.v = v; } } }
    if (mode.i === 0 && E.s) t.start = parseFloat(E.s) || 0;
    E = { s: '', pct: false, label: '' }; mode = null; return;
  }
  if (E.s) commitRow(pendingOp);
  const last = mode && mode.type === 'insert' ? t.rows[mode.i - 2] : t.rows[t.rows.length - 1];
  if (last && last.kind !== 'total' && last.kind !== 'clear') {
    const tr = { id: uid(), kind: 'total', op: '=', v: 0, c: '' };
    if (mode && mode.type === 'insert') t.rows.splice(mode.i - 1, 0, tr); else t.rows.push(tr);
  }
  mode = null; pendingOp = '+';
}

/* GST keys. With a typed number they convert the entry (then tap an operator to put it on the tape).
   With nothing typed they work on the running total: +GST / −GST add a live tax row to the tape. */
const GST_SLABS = [3, 5, 12, 18, 28];
function gstKey(k) {
  if (!k.startsWith('gst')) return false;
  const r = S.set.gstRate, t = T();
  if (k === 'gstmode') { S.set.gstMode = !S.set.gstMode; applySettings(); toast(S.set.gstMode ? 'GST mode on' : 'GST mode off'); return true; }
  if (!S.set.gstMode && S.set.gstKeys === 'row') { toast('Turn on the GST switch first'); return true; }
  if (k === 'gstslab') { S.set.gstRate = GST_SLABS[(GST_SLABS.indexOf(r) + 1) % GST_SLABS.length]; toast(`GST slab ${S.set.gstRate}%`); return true; }
  const typed = E.s && !isNaN(parseFloat(E.s));
  const x = typed ? entryValue() : total();
  if (!typed && !mode) {
    if (k === 'gstamt') { E = { s: String(round2(x * r / 100)), pct: false, label: `${r}% GST on ${fmt(x)}` }; return true; }
    if (!t.rows.length && !Number(t.start)) { toast('Type an amount first'); return true; }
    const add = k === 'gstadd';
    t.rows.push({ id: uid(), kind: 'num', op: add ? '+' : '−', v: 0, c: add ? `+ GST ${r}%` : `Less GST ${r}% (incl.)`, gst: { rate: r, mode: add ? 'add' : 'rem' } });
    t.updated = Date.now(); pendingOp = '+';
    return true;
  }
  const y = k === 'gstadd' ? x * (1 + r / 100) : k === 'gstrem' ? x / (1 + r / 100) : x * r / 100;
  const lbl = k === 'gstadd' ? `${fmt(x)} + ${r}% GST` : k === 'gstrem' ? `${fmt(x)} excl. ${r}% GST` : `${r}% GST on ${fmt(x)}`;
  E = { s: String(round2(y)), pct: false, label: lbl };
  return true;
}
function entryValue() { const v = parseFloat(E.s); return E.pct ? clean(runBefore() * v / 100) : v; }
function renderGst() {
  $$('.slabV').forEach(el => { el.textContent = S.set.gstRate + '%'; });
  const tape = $('#tape');
  if (!S.set.gstMode) { tape.style.paddingTop = ''; return; }
  const r = S.set.gstRate, typed = E.s && !isNaN(parseFloat(E.s));
  const x = typed ? entryValue() : total();
  const inc = round2(x * (1 + r / 100)), tax = round2(x * r / 100);
  const exc = round2(x / (1 + r / 100)), taxIn = round2(x - exc), half = fmt(r / 2, 'flt');
  $('#gstPanel').innerHTML = `<div class="h">GST <b>${r}%</b> on ${typed ? 'entry' : 'total'} <b>${fmt(x)}</b></div>
    <div class="l" data-g="${inc}" data-n="+GST"><span>+GST</span><b class="v">${fmt(inc)}</b><i>tax ${fmt(tax)}</i></div>
    <div class="l" data-g="${exc}" data-n="−GST"><span>−GST</span><b class="v">${fmt(exc)}</b><i>tax ${fmt(taxIn)}</i></div>
    <div class="cs l" data-g="${round2(tax / 2)}" data-n="CGST"><div><span>CGST ${half}%</span> ${fmt(round2(tax / 2))}</div><div><span>SGST ${half}%</span> ${fmt(round2(tax / 2))}</div></div>`;
  // keep tape rows from hiding under the card
  tape.style.paddingTop = ($('#gstPanel').offsetHeight + 14) + 'px';
}

/* scientific keys: unary functions act on the entry, or on the total when the entry is empty */
function sciKey(k) {
  const unary = {
    sin: x => Math.sin(S.set.deg ? x * Math.PI / 180 : x), cos: x => Math.cos(S.set.deg ? x * Math.PI / 180 : x),
    tan: x => Math.tan(S.set.deg ? x * Math.PI / 180 : x), sq: x => x * x, cube: x => x * x * x, inv: x => 1 / x,
    sqrt: Math.sqrt, cbrt: Math.cbrt, ln: Math.log, log: Math.log10,
    fact: x => { if (x < 0 || x > 170 || x % 1) return NaN; let r = 1; for (let i = 2; i <= x; i++) r *= i; return r; },
  };
  const names = { sin: 'sin', cos: 'cos', tan: 'tan', sq: 'sqr', cube: 'cube', inv: '1/', sqrt: '√', cbrt: '∛', ln: 'ln', log: 'log', fact: 'fact' };
  if (unary[k]) {
    const x = E.s ? parseFloat(E.s) : total();
    const y = clean(unary[k](x));
    E = { s: isFinite(y) ? String(y) : '', pct: false, label: `${names[k]}(${fmt(x)}` };
    return true;
  }
  return false;
}

/* ---------- UI helpers (stubs for completeness) ---------- */
function confirmSheet(title, msg, btn, cb) { if (confirm(title + '\n' + msg)) cb(); }
function promptSheet(title, def, btn, cb) { const v = prompt(title, def); if (v) cb(v); }
function openSheet(html, cb) { const s = $('#sheet'); s.innerHTML = html; $('#sheetBack').classList.remove('hidden'); if (cb) cb(); }
function closeSheet() { $('#sheetBack').classList.add('hidden'); }
function on(sel, fn) { $$(sel).forEach(el => el.onclick = e => fn(el, e)); }
function applySettings() { document.body.dataset.theme = S.set.theme || 'night'; }
function bindKeys() { /* wire buttons to press() */ }
function bindTape() { /* tape interactions */ }
function tapesSheet() { toast('Tapes'); }
function memorySheet() { toast('Memory'); }
function themesSheet() { toast('Themes'); }
function settingsSheet() { toast('Settings'); }
function tipsSheet() { toast('Tips'); }
function helpSheet() { toast('Help'); }
function shareSheet() { toast('Share'); }

// Boot
applySettings();
render();

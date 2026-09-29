/* Iconos SVG y componentes de interfaz reutilizables. Todo texto del usuario pasa por esc(). */
'use strict';

(function () {
  const S = window.STORE;
  const D = S.dates;

  const P = {
    home: '<path d="M3.5 10.5 12 3.8l8.5 6.7V19a1.5 1.5 0 0 1-1.5 1.5h-4.2v-6h-5.6v6H5A1.5 1.5 0 0 1 3.5 19z"/>',
    pin: '<path d="M12 21s-6.8-6-6.8-11.3a6.8 6.8 0 0 1 13.6 0C18.8 15 12 21 12 21z"/><circle cx="12" cy="9.6" r="2.4"/>',
    users: '<circle cx="9" cy="8" r="3.4"/><path d="M2.8 20c.5-3.4 3-5.4 6.2-5.4s5.7 2 6.2 5.4"/><circle cx="17.3" cy="9" r="2.5"/><path d="M16.6 14.7c2.5.3 4.2 2 4.6 5.3"/>',
    chart: '<path d="M3.5 20.5h17"/><path d="M7 16.5v-5"/><path d="M12 16.5V6"/><path d="M17 16.5v-8"/>',
    target: '<circle cx="12" cy="12" r="8.6"/><circle cx="12" cy="12" r="4.8"/><circle cx="12" cy="12" r="1.3" fill="currentColor"/>',
    plus: '<path d="M12 5v14M5 12h14"/>',
    minus: '<path d="M5.5 12h13"/>',
    check: '<path d="m5 12.5 4.4 4.4L19 7.3"/>',
    x: '<path d="M6.5 6.5l11 11M17.5 6.5l-11 11"/>',
    chev: '<path d="m9.5 5.5 6.5 6.5-6.5 6.5"/>',
    chevDown: '<path d="m6 9.5 6 6 6-6"/>',
    undo: '<path d="M9 14 4.5 9.5 9 5"/><path d="M4.5 9.5H15a5 5 0 0 1 0 10h-3.5"/>',
    phone: '<path d="M6.6 3.5h2.6l1.6 4.2-2 1.3a11.4 11.4 0 0 0 6.2 6.2l1.3-2 4.2 1.6v2.6a1.9 1.9 0 0 1-2 1.9A16 16 0 0 1 4.7 5.5a1.9 1.9 0 0 1 1.9-2z"/>',
    chat: '<path d="M4.3 19.7 5.5 16A8 8 0 1 1 8.4 18.8z"/>',
    cal: '<rect x="3.8" y="5" width="16.4" height="15.2" rx="2.6"/><path d="M3.8 9.8h16.4M8.3 3v3.6M15.7 3v3.6"/>',
    contact: '<circle cx="10" cy="8.2" r="3.4"/><path d="M3.6 20c.5-3.4 3-5.4 6.4-5.4 1.3 0 2.5.3 3.5.8"/><path d="M18 13.8v6.4M14.8 17h6.4"/>',
    camera: '<path d="M4.5 7.8h2.8l1.8-2.6h5.8l1.8 2.6h2.8c.6 0 1 .4 1 1v10c0 .6-.4 1-1 1h-15c-.6 0-1-.4-1-1v-10c0-.6.4-1 1-1z"/><circle cx="12" cy="13.5" r="3.4"/>',
    nav: '<path d="M20.5 3.5 3.5 10.8l7.2 2.5 2.5 7.2z"/>',
    share: '<path d="M12 3.5v11"/><path d="m8 7.3 4-3.8 4 3.8"/><path d="M7.5 10.5H6a1.5 1.5 0 0 0-1.5 1.5v7A1.5 1.5 0 0 0 6 20.5h12a1.5 1.5 0 0 0 1.5-1.5v-7a1.5 1.5 0 0 0-1.5-1.5h-1.5"/>',
    trash: '<path d="M4.5 7h15M9.5 7V4.5h5V7M6.5 7l.9 12.2c.1.8.7 1.3 1.5 1.3h6.2c.8 0 1.4-.5 1.5-1.3L17.5 7"/>',
    edit: '<path d="M4.5 19.5h4L19 9l-4-4L4.5 15.5z"/><path d="m13.5 6.5 4 4"/>',
    search: '<circle cx="10.8" cy="10.8" r="6.3"/><path d="m20 20-4.5-4.5"/>',
    flame: '<path d="M12 21c-3.9 0-6.8-2.6-6.8-6.3 0-3 2-5 3.4-6.4.3 1.9 1.2 2.9 2.4 3.4C11 8.2 12 5.2 14.3 3c.5 3 4.5 5.4 4.5 10.9 0 4.2-3 7.1-6.8 7.1z"/>',
    store: '<path d="M4 9.3 5.4 4.5h13.2L20 9.3"/><path d="M4 9.3a2.7 2.7 0 0 0 5.3 0 2.7 2.7 0 0 0 5.4 0 2.7 2.7 0 0 0 5.3 0"/><path d="M5.3 12.3v7.2h13.4v-7.2"/><path d="M10 19.5v-4.3h4v4.3"/>',
    tap: '<rect x="7" y="2.8" width="10" height="18.4" rx="2.4"/><path d="M11 17.8h2"/><path d="M3.5 8.5a6 6 0 0 1 0 7M20.5 8.5a6 6 0 0 1 0 7"/>',
    cash: '<rect x="2.8" y="6.2" width="18.4" height="11.6" rx="2"/><circle cx="12" cy="12" r="2.6"/><path d="M6.3 9.5v5M17.7 9.5v5"/>',
    noCircle: '<circle cx="12" cy="12" r="8.6"/><path d="m6 6 12 12"/>',
    again: '<path d="M19.6 11a7.6 7.6 0 1 0-2.2 5.4"/><path d="M19.8 4.8V11h-6.2"/>',
    sliders: '<path d="M4 7h9.5M17.5 7H20M4 17h2.5M10.5 17H20"/><circle cx="15.5" cy="7" r="2"/><circle cx="8.5" cy="17" r="2"/>',
    bulb: '<path d="M9.5 17.5h5M10.3 20.5h3.4"/><path d="M12 3.5a5.8 5.8 0 0 0-3.4 10.5c.6.5 1 1.2 1 2h4.8c0-.8.4-1.5 1-2A5.8 5.8 0 0 0 12 3.5z"/>',
    flask: '<path d="M9 3.5h6M10 3.5v6L5.2 18.2a1.9 1.9 0 0 0 1.7 2.8h10.2a1.9 1.9 0 0 0 1.7-2.8L14 9.5v-6"/><path d="M7.5 15h9"/>',
    image: '<rect x="3.5" y="4.5" width="17" height="15" rx="2.2"/><circle cx="8.8" cy="9.6" r="1.7"/><path d="m20.5 15.5-4.8-4.8-9.2 9.2"/>',
    download: '<path d="M12 3.5v11.5M7.5 10.5 12 15l4.5-4.5M4.5 20.5h15"/>',
    upload: '<path d="M12 20.5V9M7.5 13.5 12 9l4.5 4.5M4.5 3.5h15"/>',
    clock: '<circle cx="12" cy="12" r="8.6"/><path d="M12 7.3V12l3 2"/>',
    list: '<path d="M9 6.5h11M9 12h11M9 17.5h11"/><circle cx="4.8" cy="6.5" r=".9" fill="currentColor"/><circle cx="4.8" cy="12" r=".9" fill="currentColor"/><circle cx="4.8" cy="17.5" r=".9" fill="currentColor"/>',
    doc: '<path d="M6.5 3.5h7l4 4v13h-11z"/><path d="M13.5 3.5v4h4M9 12.5h6M9 16h6"/>',
    person: '<circle cx="12" cy="8" r="3.8"/><path d="M4.8 20.5c.6-3.8 3.4-6 7.2-6s6.6 2.2 7.2 6"/>',
    star: '<path d="m12 3.8 2.5 5.1 5.6.8-4 3.9 1 5.6-5.1-2.7-5.1 2.7 1-5.6-4-3.9 5.6-.8z"/>',
    copy: '<rect x="8.5" y="8.5" width="11" height="11" rx="2"/><path d="M15.5 8.5V6a1.5 1.5 0 0 0-1.5-1.5H6A1.5 1.5 0 0 0 4.5 6v8A1.5 1.5 0 0 0 6 15.5h2.5"/>',
    warn: '<path d="M12 4.2 2.8 19.5h18.4z"/><path d="M12 10v4.2"/><circle cx="12" cy="17" r=".9" fill="currentColor"/>',
    info: '<circle cx="12" cy="12" r="8.6"/><path d="M12 11v5.5"/><circle cx="12" cy="7.8" r=".9" fill="currentColor"/>'
  };

  const U = {};

  U.icon = function (name, size, sw) {
    return '<svg class="ic" width="' + (size || 24) + '" height="' + (size || 24) + '" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="' + (sw || 1.9) + '" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">' + (P[name] || '') + '</svg>';
  };

  U.esc = function (v) {
    return String(v == null ? '' : v)
      .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;').replace(/'/g, '&#39;');
  };
  const esc = U.esc;

  U.money = function (n) {
    n = Number(n) || 0;
    return '$' + (Math.round(n * 100) % 100 === 0 ? String(Math.round(n)) : n.toFixed(2));
  };
  U.pct = function (a, b) { return b > 0 ? Math.round(a / b * 100) + '%' : '—'; };

  U.fmtDate = function (s, opts) {
    if (!s || !D.validYmd(s)) return '';
    try { return D.parseYmd(s).toLocaleDateString('es-EC', opts || { weekday: 'short', day: 'numeric', month: 'short' }); } catch (e) { return s; }
  };

  // "hoy", "mañana", "ayer", "en 3 días", "hace 2 días" o la fecha.
  U.relDate = function (s) {
    if (!s || !D.validYmd(s)) return '';
    const n = D.daysBetween(D.ymd(), s);
    if (n === 0) return 'hoy';
    if (n === 1) return 'mañana';
    if (n === -1) return 'ayer';
    if (n > 1 && n < 7) return 'en ' + n + ' días';
    if (n < -1 && n > -7) return 'hace ' + (-n) + ' días';
    return U.fmtDate(s);
  };

  U.greeting = function () {
    const h = new Date().getHours();
    return h < 12 ? 'Buenos días' : h < 19 ? 'Buenas tardes' : 'Buenas noches';
  };

  U.initials = function (name) {
    const w = String(name || '?').trim().split(/\s+/).filter(Boolean);
    return ((w[0] || '?')[0] + (w[1] ? w[1][0] : '')).toUpperCase();
  };

  const AV_COLORS = ['#ff9500', '#af52de', '#34c759', '#007aff', '#5856d6', '#8e8e93'];
  U.avatar = function (p, lg, photoUrl) {
    const C = window.CONTENT;
    const i = Math.max(0, C.RUBROS.indexOf(p.rubro));
    const color = p.rubro ? AV_COLORS[i % AV_COLORS.length] : '#8e8e93';
    if (photoUrl) return '<div class="av' + (lg ? ' lg' : '') + '" style="background-image:url(\'' + esc(photoUrl) + '\')"></div>';
    return '<div class="av' + (lg ? ' lg' : '') + '" style="background:' + color + '">' + esc(U.initials(p.name)) + '</div>';
  };

  U.pill = function (stage) {
    const C = window.CONTENT;
    const i = C.STAGES.indexOf(stage);
    return '<span class="pill s' + (i < 0 ? 0 : i) + '">' + esc(stage) + '</span>';
  };

  U.nav = function (title, left, right) {
    return '<div class="nav"><div class="nav-in"><div class="nav-left">' + (left || '') + '</div><div class="nav-title">' + esc(title) + '</div><div class="nav-right">' + (right || '') + '</div></div></div>';
  };

  U.head = function (title, sub) {
    return '<div class="head"><h1 class="large-title">' + esc(title) + '</h1>' + (sub ? '<div class="subtitle">' + esc(sub) + '</div>' : '') + '</div>';
  };

  U.navBtn = function (act, inner, label, extra) {
    return '<button class="nav-btn" data-act="' + act + '"' + (extra || '') + ' aria-label="' + esc(label || '') + '">' + inner + '</button>';
  };

  U.group = function (header, inner, footer, cls) {
    return '<section class="group' + (cls ? ' ' + cls : '') + '">' +
      (header ? '<div class="group-h">' + header + '</div>' : '') +
      '<div class="list">' + inner + '</div>' +
      (footer ? '<div class="group-f">' + footer + '</div>' : '') + '</section>';
  };

  // Celda de lista. o: {tag, act, data:{}, icon, iconBg, title, sub, subWarn, trail, chev, cls, href, attrs}
  U.cell = function (o) {
    const tag = o.href ? 'a' : (o.tag || (o.act ? 'button' : 'div'));
    let attrs = '';
    if (o.act) attrs += ' data-act="' + o.act + '"';
    if (o.data) Object.keys(o.data).forEach(k => { attrs += ' data-' + k + '="' + esc(o.data[k]) + '"'; });
    if (o.href) attrs += ' href="' + esc(o.href) + '" target="_blank" rel="noopener"';
    if (o.attrs) attrs += ' ' + o.attrs;
    let cls = 'cell' + (o.icon ? ' inset-icon' : '') + (o.av ? ' inset-av' : '') + (o.cls ? ' ' + o.cls : '');
    let h = '<' + tag + ' class="' + cls + '"' + attrs + (tag === 'button' ? ' type="button"' : '') + '>';
    if (o.icon) h += '<span class="ico ' + (o.iconBg || 'bg-blue') + '">' + U.icon(o.icon, 19, 2) + '</span>';
    if (o.av) h += o.av;
    if (o.lead) h += o.lead;
    h += '<span class="main"><span class="t' + (o.titleCls ? ' ' + o.titleCls : '') + '" style="display:block">' + (o.titleHtml || esc(o.title || '')) + '</span>';
    if (o.sub || o.subHtml) h += '<span class="s' + (o.subWarn ? ' warn' : '') + '" style="display:block">' + (o.subHtml || esc(o.sub)) + '</span>';
    h += '</span>';
    if (o.trail || o.trailHtml || o.chev) {
      h += '<span class="trail">' + (o.trailHtml || esc(o.trail || '')) + (o.chev ? '<span class="chev">' + U.icon('chev', 18, 2.2) + '</span>' : '') + '</span>';
    }
    return h + '</' + tag + '>';
  };

  U.seg = function (name, options, current) {
    return '<div class="seg-wrap"><div class="seg" role="tablist">' + options.map(o =>
      '<button role="tab" data-act="seg" data-seg="' + name + '" data-v="' + o[0] + '" class="' + (o[0] === current ? 'on' : '') + '" aria-selected="' + (o[0] === current) + '">' + esc(o[1]) + '</button>'
    ).join('') + '</div></div>';
  };

  U.ring = function (value, max) {
    const r = 50, c = 2 * Math.PI * r;
    const p = max > 0 ? Math.min(1, value / max) : 0;
    return '<div class="ring' + (max > 0 && value >= max ? ' done' : '') + '"><svg viewBox="0 0 116 116"><circle class="trk" cx="58" cy="58" r="' + r + '" fill="none" stroke-width="11"/>' +
      '<circle class="val" cx="58" cy="58" r="' + r + '" fill="none" stroke-width="11" stroke-linecap="round" stroke-dasharray="' + c.toFixed(1) + '" stroke-dashoffset="' + (c * (1 - p)).toFixed(1) + '"/></svg>' +
      '<div class="ctr"><div class="big">' + value + '</div><div class="of">de ' + max + ' visitas</div></div></div>';
  };

  U.stepper = function (act, data, value) {
    let attrs = '';
    Object.keys(data || {}).forEach(k => { attrs += ' data-' + k + '="' + esc(data[k]) + '"'; });
    return '<span class="stepper"><button type="button" data-act="' + act + '" data-d="-1"' + attrs + ' aria-label="Restar">' + U.icon('minus', 18, 2.2) + '</button>' +
      '<span class="stepper-val">' + esc(value) + '</span>' +
      '<button type="button" data-act="' + act + '" data-d="1"' + attrs + ' aria-label="Sumar">' + U.icon('plus', 18, 2.2) + '</button></span>';
  };

  U.empty = function (icon, title, text, btnHtml) {
    return '<div class="empty">' + U.icon(icon, 46, 1.5) + '<div class="et">' + esc(title) + '</div><p>' + esc(text) + '</p>' + (btnHtml || '') + '</div>';
  };

  U.law = function (t) { return '<span class="law">' + esc(t) + '</span>'; };

  U.waLink = function (p) {
    const n = S.waNumber(p.phone);
    if (!n) return '';
    const seller = S.state.config.sellerName;
    const hi = 'Hola' + (p.contact ? ' ' + p.contact : '') + ', ';
    const msg = seller
      ? hi + 'soy ' + seller + ', de Clyclick. Le escribo por el hablador con QR y NFC que le mostré.'
      : hi + 'le escribo de Clyclick por el hablador con QR y NFC que le mostré.';
    return 'https://wa.me/' + n + '?text=' + encodeURIComponent(msg);
  };

  U.tel = function (p) { return String(p.phone || '').replace(/[^\d+]/g, ''); };

  U.tipIndex = function (offset) {
    const now = new Date();
    const doy = Math.floor((now - new Date(now.getFullYear(), 0, 0)) / 86400000);
    const n = window.CONTENT.TIPS.length;
    return ((doy + (offset || 0)) % n + n) % n;
  };

  window.U = U;
})();

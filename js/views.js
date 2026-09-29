/* Vistas: cada función devuelve HTML. Todo texto del usuario pasa por esc(). */
'use strict';

(function () {
  const C = window.CONTENT;
  const S = window.STORE;
  const D = S.dates;

  // ---------- Utilidades ----------
  const U = {};
  U.esc = function (v) {
    return String(v == null ? '' : v)
      .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;').replace(/'/g, '&#39;');
  };
  U.money = function (n) {
    n = Number(n) || 0;
    return '$' + (Math.round(n * 100) % 100 === 0 ? String(Math.round(n)) : n.toFixed(2));
  };
  U.pct = function (a, b) { return b > 0 ? Math.round(a / b * 100) + '%' : '—'; };
  U.fmtDate = function (s) {
    if (!s) return '';
    try {
      return D.parseYmd(s).toLocaleDateString('es-EC', { weekday: 'short', day: 'numeric', month: 'short' });
    } catch (e) { return s; }
  };
  U.tipIndex = function (offset) {
    const now = new Date();
    const doy = Math.floor((now - new Date(now.getFullYear(), 0, 0)) / 86400000);
    const n = C.TIPS.length;
    return ((doy + (offset || 0)) % n + n) % n;
  };
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
  const esc = U.esc, money = U.money, pct = U.pct;

  function law(t) { return '<span class="law">' + esc(t) + '</span>'; }

  function prospectCard(p) {
    const t = D.ymd();
    const idx = C.STAGES.indexOf(p.stage);
    const open = p.stage !== 'Ganado' && p.stage !== 'Perdido';
    const overdue = open && p.nextDate && p.nextDate < t;
    const wa = U.waLink(p);
    const tel = String(p.phone || '').replace(/[^\d+]/g, '');
    let h = '<div class="pcard">';
    h += '<div class="row between"><b>' + esc(p.name || '(sin nombre)') + '</b><span class="badge st-' + (idx < 0 ? 0 : idx) + '">' + esc(p.stage) + '</span></div>';
    const sub = [p.rubro, p.contact, p.zone].filter(Boolean).map(esc).join(' · ');
    if (sub) h += '<div class="mut">' + sub + '</div>';
    if (open && p.nextDate) {
      h += '<div class="' + (overdue ? 'over' : '') + '">➡ ' + esc(p.nextAction || 'Seguimiento') + ' · ' + esc(U.fmtDate(p.nextDate)) + (overdue ? ' (atrasado)' : '') + '</div>';
    }
    if (p.stage === 'Ganado' && (p.units || p.amount)) {
      h += '<div class="mut">Compró: ' + (Number(p.units) || 0) + ' u · ' + money(p.amount) + '</div>';
    }
    if (p.software === 'Sí' || p.software === 'Tal vez') {
      h += '<div class="mt"><span class="badge soft">Software: ' + esc(p.software) + (p.softWhich ? ' · ' + esc(p.softWhich) : '') + '</span></div>';
    }
    h += '<div class="row mt">';
    if (wa) h += '<a class="btn sm ok" href="' + esc(wa) + '" target="_blank" rel="noopener">WhatsApp</a>';
    if (tel) h += '<a class="btn sm sec" href="tel:' + esc(tel) + '">Llamar</a>';
    h += '<button class="btn sm ghost" data-act="p-edit" data-id="' + esc(p.id) + '">Editar</button>';
    h += '</div></div>';
    return h;
  }

  function heatmap() {
    const t = D.ymd();
    const goal = Number(S.state.config.dailyVisitGoal) || 0;
    const start = D.addDays(t, -27);
    let h = '<div class="heat">';
    for (let i = 0; i < 28; i++) {
      const d = D.addDays(start, i);
      const s = S.dayStats(d);
      let cls = '';
      if (!S.isWorkDay(d) && s.visits === 0) cls = 'hoff';
      else if (goal > 0 && s.visits >= goal) cls = 'h3';
      else if (goal > 0 && s.visits >= goal / 2) cls = 'h2';
      else if (s.visits > 0) cls = 'h1';
      if (d === t) cls += ' htoday';
      h += '<div class="' + cls + '" title="' + esc(d + ': ' + s.visits + ' visitas') + '">' + D.parseYmd(d).getDate() + '</div>';
    }
    return h + '</div>';
  }

  // ---------- HOY ----------
  function hoy(tipOffset) {
    const t = D.ymd();
    const day = S.getDay(t);
    const st = S.dayStats(t);
    const cfg = S.state.config;
    const goal = Number(cfg.dailyVisitGoal) || 0;
    const p = goal ? Math.min(100, Math.round(st.visits / goal * 100)) : 0;
    const tip = C.TIPS[U.tipIndex(tipOffset)];
    let h = '';

    h += '<div class="card">' + law(tip[0]) + '<p>' + esc(tip[1]) + '</p><button class="btn sm ghost" data-act="tip-next">Otra ley →</button></div>';

    if (day.rest) {
      h += '<div class="card"><h2>Hoy es día de descanso</h2><p class="mut">Ley 9 · Descansar también es parte del plan. Mañana vuelves con energía.</p><button class="btn sm sec" data-act="unrest">Cambié de idea, hoy salgo</button></div>';
    } else if (!day.committed) {
      h += '<div class="card hl">' + law('Ley 6 · Pregunta, no digas') + '<h2>¿Vas a entrar a ' + goal + ' negocios hoy?</h2><p class="mut">Responder "sí" a una pregunta te compromete más que escribir una meta.</p><div class="grid2"><button class="btn ok big" data-act="commit">Sí, voy a hacerlo</button><button class="btn sec big" data-act="rest">Hoy descanso</button></div></div>';
    }

    let grad = 'Cada visita cuenta. Empieza por la primera.';
    if (st.visits > 0 && p < 50) grad = 'Ya arrancaste. Lo difícil era la primera.';
    else if (p >= 50 && p < 80) grad = 'Vas a más de la mitad. Sigue igual.';
    else if (p >= 80 && p < 100) grad = '¡Ya casi! Faltan ' + (goal - st.visits) + '. Este es el tramo que construye tu historia personal (Ley 7).';
    else if (p >= 100) grad = '✅ Meta cumplida. Todo lo que hagas desde aquí es extra.';
    h += '<div class="card"><div class="row between"><h2>Visitas: ' + st.visits + ' / ' + goal + '</h2>' + law('Ley 31 · Progreso') + '</div><div class="bar"><i style="width:' + p + '%"></i></div><p class="mut">' + esc(grad) + '</p></div>';

    h += '<div class="card"><h2>En la calle</h2><p class="mut">Entras → <b>Visita</b> · lo prueba → <b>Demo</b> · resultado → <b>Venta</b>, <b>No</b> o <b>Volver</b>.</p>';
    h += '<div class="grid2">';
    h += '<div class="counter"><div class="lbl">Visitas</div><div class="n">' + st.visits + '</div><div class="row"><button class="btn sec sm" data-act="dec" data-k="visits">−1</button><button class="btn" data-act="inc" data-k="visits">+1 Visita</button></div></div>';
    h += '<div class="counter"><div class="lbl">Demos (lo probó)</div><div class="n">' + st.demos + '</div><div class="row"><button class="btn sec sm" data-act="dec" data-k="demos">−1</button><button class="btn" data-act="inc" data-k="demos">+1 Demo</button></div></div>';
    h += '</div>';
    h += '<div class="grid3 mt"><button class="btn ok big" data-act="sale">💰 Venta</button><button class="btn bad big" data-act="no">✋ No</button><button class="btn sec big" data-act="later">🔁 Volver</button></div>';
    h += '<div class="grid3 mt"><div class="stat"><b>' + st.sales + '</b><span>ventas</span></div><div class="stat"><b>' + st.units + '</b><span>habladores</span></div><div class="stat"><b>' + money(st.revenue) + '</b><span>ingreso</span></div></div>';
    h += '<div class="grid3 mt"><div class="stat"><b>' + pct(st.demos, st.visits) + '</b><span>visita → demo</span></div><div class="stat"><b>' + pct(st.sales, st.visits) + '</b><span>visita → venta</span></div><div class="stat"><b>' + st.rej + '</b><span>"no" anotados</span></div></div>';
    const undo = [];
    if (st.sales) undo.push('<button class="btn sm ghost" data-act="undo-sale">Deshacer última venta</button>');
    if (st.rej) undo.push('<button class="btn sm ghost" data-act="undo-no">Deshacer último "no"</button>');
    if (undo.length) h += '<div class="row mt">' + undo.join('') + '</div>';
    h += '<div class="grid2 mt"><div><label for="hours">Horas en la calle</label><input id="hours" type="number" min="0" step="0.5" inputmode="decimal" data-bind="days.' + t + '.hours" data-type="num" value="' + (day.hours || '') + '" placeholder="Ej. 5"></div>';
    h += '<div class="stat" style="align-self:end"><b>' + (st.hours > 0 ? money(st.revenue / st.hours) : '—') + '</b><span>por hora</span></div></div>';
    h += '</div>';

    // Seguimientos que tocan hoy (Ley 20: una pequeña falla ahora = gran falla después)
    const due = S.state.prospects
      .filter(x => x.nextDate && x.nextDate <= t && x.stage !== 'Ganado' && x.stage !== 'Perdido')
      .sort((a, b) => (a.nextDate < b.nextDate ? -1 : 1));
    h += '<div class="card"><div class="row between"><h2>Seguimientos de hoy</h2>' + law('Ley 20') + '</div>';
    if (!due.length) h += '<p class="mut">No tienes seguimientos pendientes. Cada "Volver" que registres aparecerá aquí el día que toque.</p>';
    else h += due.map(prospectCard).join('');
    h += '</div>';

    // Revisión semanal pendiente
    const lastRev = S.state.reviews.length ? S.state.reviews[S.state.reviews.length - 1].date : null;
    const first = S.earliestDay();
    if (first && D.daysBetween(first, t) >= 6 && (!lastRev || D.daysBetween(lastRev, t) >= 7)) {
      h += '<div class="card warn"><h2>Toca tu revisión semanal</h2><p class="mut">Ley 20 · Corrige el rumbo un grado antes de que sea una milla.</p><button class="btn" data-act="tab" data-tab="semana">Hacer revisión (10 min)</button></div>';
    }

    // Cierre del día
    const qs = cfg.questions;
    const yes = qs.filter(q => day.answers[q] === true).length;
    h += '<div class="card"><div class="row between"><h2>Cierre del día</h2><span class="badge">' + yes + ' / ' + qs.length + '</span></div><p class="mut">Ley 6 · Solo sí o no. Sin explicaciones.</p>';
    h += qs.map((q, i) => {
      const a = day.answers[q];
      return '<div class="qrow"><div>' + esc(q) + '</div><div class="yn"><button class="chip yes' + (a === true ? ' on' : '') + '" data-act="ans" data-i="' + i + '" data-v="1">Sí</button><button class="chip no' + (a === false ? ' on' : '') + '" data-act="ans" data-i="' + i + '" data-v="0">No</button></div></div>';
    }).join('');
    h += '<label for="note">¿Qué aprendí hoy en la calle?</label><textarea id="note" data-bind="days.' + t + '.note" placeholder="Una frase que funcionó, una objeción nueva, un rubro que compra…">' + esc(day.note) + '</textarea>';
    h += '</div>';

    // Racha y mapa
    h += '<div class="card"><div class="row between"><h2>Racha: ' + S.streak() + ' día(s) 🔥</h2>' + law('Ley 7 · Historia personal') + '</div><p class="mut">Días de trabajo seguidos cumpliendo tu meta de visitas. Últimos 28 días:</p>' + heatmap() + '</div>';

    const lb = cfg.lastBackup;
    if (first && (!lb || D.daysBetween(lb, t) >= 7)) {
      h += '<p class="mut small" style="text-align:center">💾 Haz tu respaldo semanal en Meta › Respaldo' + (lb ? ' (último: ' + esc(U.fmtDate(lb)) + ')' : '') + '.</p>';
    }
    return h;
  }

  // ---------- CALLE ----------
  function calle() {
    const t = D.ymd();
    const day = S.getDay(t);
    let h = '';
    h += '<div class="card"><div class="row between"><h2>Antes de salir</h2>' + law('Ley 9 · Ley 17') + '</div>';
    h += C.PREP.map((x, i) => '<div class="check' + (day.prep[i] ? ' on' : '') + '" data-act="prep" data-i="' + i + '"><div class="box">' + (day.prep[i] ? '✓' : '') + '</div><span>' + esc(x) + '</span></div>').join('');
    h += '</div>';

    h += '<div class="card"><h2>Guion de visita</h2><p class="mut">Siete pasos. Apréndete la entrada y el cierre de memoria.</p>';
    h += C.STEPS.map((s, i) => {
      let b = '<details' + (i === 0 ? ' open' : '') + '><summary>' + esc(s.title) + '</summary>' + law(s.law);
      if (s.dont) b += '<div class="nosay"><div class="tag">No digas</div>' + esc(s.dont) + '</div>';
      b += '<div class="say"><div class="tag">Di</div>' + s.say + '</div>'; // texto fijo de CONTENT (contiene <br>)
      if (s.note) b += '<p class="mut">' + esc(s.note) + '</p>';
      return b + '</details>';
    }).join('');
    h += '</div>';

    h += '<div class="card"><div class="row between"><h2>Objeciones</h2>' + law('Ley 3 · Nunca discutas') + '</div><p class="mut">Fórmula: <b>acuerdo</b> → <b>reencuadre</b> → <b>pregunta de sí o no</b>. Nunca empieces con "no, pero…".</p>';
    h += C.OBJECTIONS.map(o =>
      '<details><summary>"' + esc(o.obj) + '"</summary>' +
      '<div class="say"><div class="tag">1 · Acuerdo</div>' + esc(o.agree) + '</div>' +
      '<div class="say"><div class="tag">2 · Reencuadre</div>' + esc(o.reframe) + '</div>' +
      '<div class="say"><div class="tag">3 · Cierre sí/no</div>' + esc(o.close) + '</div></details>'
    ).join('');
    h += '</div>';

    h += '<div class="card" id="paquetes"><div class="row between"><h2>Paquetes</h2>' + law('Ley 16 · Ricitos de Oro') + '</div><p class="mut">Muéstrale esta pantalla al cliente. Se editan en Meta › Configuración.</p>';
    h += packagesHtml();
    h += '</div>';
    return h;
  }

  function packagesHtml() {
    const cfg = S.state.config;
    const unit = Number(cfg.unitPrice) || 0;
    const cost = Number(cfg.unitCost) || 0;
    return cfg.packages.map((p, i) => {
      const units = Number(p.units) || 0;
      const price = Number(p.price) || 0;
      const per = units ? price / units : 0;
      const save = unit * units - price;
      let x = '<div class="pkg' + (i === 1 ? ' rec' : '') + '">';
      if (i === 1) x += '<div class="badge st-1">Recomendado</div>';
      x += '<div class="name">' + esc(p.name) + '</div><div class="price">' + money(price) + '</div>';
      x += '<div>' + units + ' hablador' + (units === 1 ? '' : 'es') + (units > 1 ? ' · ' + money(per) + ' c/u' : '') + '</div>';
      if (save > 0.009) x += '<div class="up">Ahorra ' + money(save) + '</div>';
      if (p.desc) x += '<div class="mut">' + esc(p.desc) + '</div>';
      if (cost > 0 && per > 0 && per <= cost) x += '<div class="down small">⚠ Precio por unidad menor o igual a tu costo</div>';
      return x + '</div>';
    }).join('');
  }

  // ---------- PROSPECTOS ----------
  function prospectos() {
    const ps = S.state.prospects;
    const f = S.state.ui.pfilter || 'Todos';
    const soft = ps.filter(p => p.software === 'Sí' || p.software === 'Tal vez').length;
    let h = '<div class="card"><div class="row between"><h2>Clientes y prospectos</h2><button class="btn sm" data-act="p-new">+ Nuevo</button></div>';
    h += '<input id="p-search" type="search" placeholder="Buscar por nombre, contacto o zona" autocomplete="off">';
    h += '<div class="chips mt">';
    ['Todos'].concat(C.STAGES).forEach(s => {
      const n = s === 'Todos' ? ps.length : ps.filter(p => p.stage === s).length;
      h += '<button class="chip' + (f === s ? ' on' : '') + '" data-act="pfilter" data-s="' + esc(s) + '">' + esc(s) + ' (' + n + ')</button>';
    });
    h += '</div>';
    h += '<p class="mut mt">' + law('Ley 26 · El contexto vale') + ' <b>' + soft + '</b> con interés en tu software. El hablador abre la puerta; el software es la venta grande.</p>';
    h += '</div><div id="p-list">' + prospectList('') + '</div>';
    return h;
  }

  function prospectList(q) {
    const f = S.state.ui.pfilter || 'Todos';
    q = String(q || '').toLowerCase().trim();
    let ps = S.state.prospects.slice();
    if (f !== 'Todos') ps = ps.filter(p => p.stage === f);
    if (q) ps = ps.filter(p => [p.name, p.contact, p.zone, p.rubro, p.notes].join(' ').toLowerCase().indexOf(q) !== -1);
    ps.sort((a, b) => {
      const ao = a.stage !== 'Ganado' && a.stage !== 'Perdido' && a.nextDate ? a.nextDate : '9999';
      const bo = b.stage !== 'Ganado' && b.stage !== 'Perdido' && b.nextDate ? b.nextDate : '9999';
      if (ao !== bo) return ao < bo ? -1 : 1;
      return (b.updated || 0) - (a.updated || 0);
    });
    if (!ps.length) return '<div class="card empty">Aún no hay registros aquí. Toca "+ Nuevo" o usa 🔁 Volver desde Hoy.</div>';
    return ps.map(prospectCard).join('');
  }

  // ---------- PRUEBAS (experimentos) ----------
  function pruebas() {
    const ex = S.state.experiments;
    const run = ex.filter(e => e.status === 'Corriendo').length;
    const okN = ex.filter(e => e.status === 'Funcionó').length;
    const bad = ex.filter(e => e.status === 'No funcionó').length;
    let h = '<div class="card">' + law('Ley 21 · Equivócate más que la competencia') + '<h2>Experimentos</h2>';
    h += '<p class="mut">Cambia <b>una sola cosa</b> por semana y mide. Casi todo lo que venderás es una "puerta de dos vías" (Bezos): si falla, vuelves atrás sin daño. Decide rápido.</p>';
    h += '<div class="grid3 mt"><div class="stat"><b>' + run + '</b><span>corriendo</span></div><div class="stat"><b>' + okN + '</b><span>funcionaron</span></div><div class="stat"><b>' + bad + '</b><span>aprendizajes</span></div></div>';
    h += '<button class="btn block mt" data-act="exp-new">+ Nuevo experimento</button></div>';

    h += '<div class="card"><h2>Ideas para probar</h2><p class="mut">Toca una para agregarla.</p><div class="chips">';
    h += C.EXP_IDEAS.map((e, i) => '<button class="chip" data-act="exp-idea" data-i="' + i + '">+ ' + esc(e.title) + '</button>').join('');
    h += '</div></div>';

    if (!ex.length) h += '<div class="card empty">Sin experimentos todavía. Empieza con "Entrada con acción vs. presentación".</div>';
    ex.slice().reverse().forEach(e => {
      const cls = e.status === 'Funcionó' ? 'st-4' : e.status === 'No funcionó' ? 'st-5' : 'st-3';
      h += '<div class="pcard"><div class="row between"><b>' + esc(e.title) + '</b><span class="badge ' + cls + '">' + esc(e.status) + '</span></div>';
      if (e.hypothesis) h += '<div class="mut">' + esc(e.hypothesis) + '</div>';
      if (e.metric) h += '<div class="small">Métrica: ' + esc(e.metric) + (e.start ? ' · desde ' + esc(U.fmtDate(e.start)) : '') + '</div>';
      if (e.result) h += '<div class="say"><div class="tag">Aprendizaje</div>' + esc(e.result) + '</div>';
      h += '<div class="row mt"><button class="btn sm ghost" data-act="exp-edit" data-id="' + esc(e.id) + '">Editar / cerrar</button></div></div>';
    });
    return h;
  }

  // ---------- SEMANA ----------
  function semana() {
    const t = D.ymd();
    const a = S.rangeStats(D.addDays(t, -6), t);
    const b = S.rangeStats(D.addDays(t, -13), D.addDays(t, -7));
    function cmp(x, y, fmt) {
      fmt = fmt || String;
      let cls = '';
      if (x > y) cls = 'up'; else if (x < y) cls = 'down';
      return '<td class="' + cls + '">' + fmt(x) + '</td><td class="mut">' + fmt(y) + '</td>';
    }
    const rate = (n, d) => (d > 0 ? n / d : 0);
    const pf = v => Math.round(v * 100) + '%';
    let h = '<div class="card">' + law('Ley 23 · No seas avestruz') + '<h2>Tus números: últimos 7 días</h2>';
    h += '<table><tr><th></th><th>Esta semana</th><th>Anterior</th></tr>';
    h += '<tr><td>Visitas</td>' + cmp(a.visits, b.visits) + '</tr>';
    h += '<tr><td>Demos</td>' + cmp(a.demos, b.demos) + '</tr>';
    h += '<tr><td>Ventas</td>' + cmp(a.sales, b.sales) + '</tr>';
    h += '<tr><td>Habladores</td>' + cmp(a.units, b.units) + '</tr>';
    h += '<tr><td>Ingreso</td>' + cmp(a.revenue, b.revenue, money) + '</tr>';
    h += '<tr><td>Visita → demo</td>' + cmp(rate(a.demos, a.visits), rate(b.demos, b.visits), pf) + '</tr>';
    h += '<tr><td>Visita → venta</td>' + cmp(rate(a.sales, a.visits), rate(b.sales, b.visits), pf) + '</tr>';
    h += '<tr><td>Días con meta cumplida</td><td>' + a.met + ' / ' + a.workDays + '</td><td class="mut">' + b.met + ' / ' + b.workDays + '</td></tr>';
    h += '</table>';
    const reasons = Object.keys(a.reasons).sort((x, y) => a.reasons[y] - a.reasons[x]);
    h += '<h3>Por qué te dijeron "no" (Ley 21)</h3>';
    if (!reasons.length) h += '<p class="mut">Sin "no" anotados esta semana.</p>';
    else {
      h += reasons.map(r => '<div class="row between"><span>' + esc(r) + '</span><b>' + a.reasons[r] + '</b></div>').join('');
      h += '<p class="mut small">La razón #1 es tu próximo experimento o tu próxima objeción a trabajar.</p>';
    }
    const won = S.state.prospects.filter(p => p.stage === 'Ganado');
    if (won.length) {
      const byR = {};
      won.forEach(p => { const k = p.rubro || 'Sin rubro'; byR[k] = (byR[k] || 0) + 1; });
      h += '<h3>Clientes ganados por rubro (total)</h3>' + Object.keys(byR).sort((x, y) => byR[y] - byR[x]).map(k => '<div class="row between"><span>' + esc(k) + '</span><b>' + byR[k] + '</b></div>').join('');
    }
    h += '</div>';

    h += '<div class="card hl">' + law('Ley 20 · Revisión semanal') + '<h2>Revisión de la semana</h2><p class="mut">10 minutos, con honestidad. Nadie más lo lee.</p>';
    C.REVIEW_FIELDS.forEach(f => {
      h += '<label for="rv-' + f[0] + '">' + esc(f[1]) + '</label><textarea id="rv-' + f[0] + '"></textarea>';
    });
    h += '<button class="btn ok block mt" data-act="review-save">Guardar revisión</button></div>';

    if (S.state.reviews.length) {
      h += '<div class="card"><h2>Revisiones anteriores</h2>';
      S.state.reviews.slice().reverse().forEach(r => {
        h += '<details><summary>' + esc(U.fmtDate(r.date)) + (r.stats ? ' · ' + r.stats.visits + ' visitas · ' + r.stats.sales + ' ventas' : '') + '</summary>';
        C.REVIEW_FIELDS.forEach(f => { if (r[f[0]]) h += '<p><b>' + esc(f[1]) + '</b><br>' + esc(r[f[0]]) + '</p>'; });
        h += '<button class="btn sm ghost" data-act="review-del" data-id="' + esc(r.id) + '">Eliminar</button></details>';
      });
      h += '</div>';
    }
    return h;
  }

  // ---------- META ----------
  function field(labelTxt, path, opts) {
    opts = opts || {};
    const v = S.getPath(path);
    const id = 'f-' + path.replace(/\./g, '-');
    const val = v == null ? '' : v;
    if (opts.area) {
      return '<label for="' + id + '">' + esc(labelTxt) + '</label><textarea id="' + id + '" data-bind="' + path + '"' + (opts.after ? ' data-after="' + opts.after + '"' : '') + ' placeholder="' + esc(opts.ph || '') + '">' + esc(val) + '</textarea>';
    }
    const type = opts.type || 'text';
    return '<label for="' + id + '">' + esc(labelTxt) + '</label><input id="' + id + '" type="' + type + '"' +
      (type === 'number' ? ' inputmode="decimal" step="any" min="0" data-type="num"' : '') +
      ' data-bind="' + path + '"' + (opts.after ? ' data-after="' + opts.after + '"' : '') +
      ' value="' + esc(val) + '" placeholder="' + esc(opts.ph || '') + '">';
  }

  function slider(labelTxt, path) {
    const v = Number(S.getPath(path)) || 1;
    return '<label>' + esc(labelTxt) + ': <b id="lv-' + path.replace(/\./g, '-') + '">' + v + '</b></label><input type="range" min="1" max="10" step="1" data-bind="' + path + '" data-type="num" data-after="meta" value="' + v + '">';
  }

  function metaGoalBox() {
    const g = S.state.goal;
    const t = D.ymd();
    const target = Number(g.target) || 0;
    const start = g.start || t;
    const sold = S.unitsSince(start);
    const p = target ? Math.min(100, Math.round(sold / target * 100)) : 0;
    let h = '<div class="bar"><i style="width:' + p + '%"></i></div>';
    h += '<p><b>' + sold + '</b> de <b>' + target + '</b> habladores vendidos desde ' + esc(U.fmtDate(start)) + '.</p>';
    if (g.deadline && target) {
      const left = D.daysBetween(t, g.deadline);
      const wd = left >= 0 ? S.workDaysBetween(t, g.deadline) : 0;
      const rem = Math.max(0, target - sold);
      if (rem === 0) h += '<p class="up">✅ Meta alcanzada. Sube el listón.</p>';
      else if (wd > 0) h += '<p class="mut">Quedan ' + left + ' días (' + wd + ' de trabajo). Necesitas <b>' + (Math.ceil(rem / wd * 10) / 10) + ' habladores por día de trabajo</b>.</p>';
      else h += '<p class="down">La fecha límite ya pasó. Haz la revisión y define una nueva meta.</p>';
    }
    return h;
  }

  function metaEqBox() {
    const g = S.state.goal;
    const v = Number(g.v) || 0, r = Number(g.r) || 0, c = Number(g.c) || 0;
    const d = v + r - c;
    let msg = '<span class="up">Disciplina sostenible. Protégela.</span>';
    if (d < 6) msg = '<span class="down">En riesgo: sube la recompensa del proceso o baja su costo hoy mismo.</span>';
    else if (d < 12) msg = '<span style="color:var(--warn);font-weight:700">Frágil: mejora al menos uno de los tres factores.</span>';
    return '<div class="eq">' + v + ' + ' + r + ' − ' + c + ' = ' + d + '</div><p style="text-align:center">' + msg + '</p>';
  }

  function metaCalcBox() {
    const cfg = S.state.config;
    const tot = S.totals();
    const price = Number(cfg.unitPrice) || 0;
    const cost = Number(cfg.unitCost) || 0;
    const margin = price - cost;
    const goal = Number(cfg.monthlyGoal) || 0;
    const mdays = Number(cfg.monthDays) || 0;
    let h = '';
    if (!cost) h += '<p class="down small">⚠ Pon tu costo real por hablador (acrílico + vinil + NFC + impresión). Sin eso no sabes cuánto ganas.</p>';
    h += '<p>Ganancia por hablador: <b>' + money(margin) + '</b>' + (price ? ' (' + Math.round(margin / price * 100) + '% del precio)' : '') + '</p>';
    if (margin <= 0) { h += '<p class="down">Con este precio y costo no ganas dinero. Revisa precio o costo.</p>'; return h; }
    if (!goal) { h += '<p class="mut">Pon tu meta de ganancia mensual para calcular cuánto necesitas vender.</p>'; }
    else {
      const upm = Math.ceil(goal / margin);
      const upd = mdays ? upm / mdays : 0;
      h += '<p>Para ganar <b>' + money(goal) + '</b> al mes necesitas <b>' + upm + ' habladores/mes</b> ≈ <b>' + (Math.ceil(upd * 10) / 10) + ' por día</b> (' + mdays + ' días).</p>';
      if (tot.visits >= 20 && tot.sales > 0) {
        const spv = tot.sales / tot.visits;
        const ups = tot.units / tot.sales;
        const vpd = upd / ups / spv;
        h += '<p>Con tus datos reales (' + tot.visits + ' visitas, ' + Math.round(spv * 100) + '% cierre, ' + (Math.round(ups * 10) / 10) + ' habladores por venta) necesitas <b>' + Math.ceil(vpd) + ' visitas por día</b>. Tu meta actual es ' + (Number(cfg.dailyVisitGoal) || 0) + '.</p>';
        if (Math.ceil(vpd) > (Number(cfg.dailyVisitGoal) || 0)) h += '<p class="down small">Tu meta de visitas no alcanza para tu meta de dinero. Sube visitas, mejora el cierre (Calle) o vende paquetes más grandes.</p>';
      } else {
        h += '<p class="mut small">Cuando tengas 20+ visitas y alguna venta, aquí verás cuántas visitas diarias necesitas según TU tasa real. No hay forma de saberlo sin salir a la calle.</p>';
      }
      h += '<p class="mut small">Ojo: con un producto de ' + money(price) + ' necesitas volumen. Por eso el hablador debe servir para abrir la puerta a tu software.</p>';
    }
    h += '<p class="mut small">Total histórico: ' + tot.visits + ' visitas · ' + tot.sales + ' ventas · ' + tot.units + ' habladores · ' + money(tot.revenue) + '</p>';
    return h;
  }

  function meta() {
    const cfg = S.state.config;
    let h = '';
    h += '<div class="card">' + law('Ley 22 · Plan A') + '<h2>Meta a 90 días</h2>';
    h += field('Mi meta (en una frase)', 'goal.text', { ph: 'Ej. Vender 100 habladores y conseguir 5 clientes de software' });
    h += '<div class="grid2"><div>' + field('Habladores a vender', 'goal.target', { type: 'number', after: 'meta' }) + '</div><div>' + field('Fecha límite', 'goal.deadline', { type: 'date', after: 'meta' }) + '</div></div>';
    h += '<div id="meta-goal" class="mt">' + metaGoalBox() + '</div>';
    h += field('¿Por qué me importa DE VERDAD? (Ley 27)', 'goal.why', { area: true, ph: 'No "por dinero". ¿Qué cambia en tu vida si lo logras?' });
    h += '</div>';

    h += '<div class="card">' + law('Ley 27 · Ecuación de la disciplina') + '<h2>Disciplina = Valor + Recompensa − Costo</h2>';
    h += slider('Valor de la meta para mí', 'goal.v');
    h += slider('Qué tanto disfruto el proceso', 'goal.r');
    h += slider('Qué tan pesado / costoso se siente', 'goal.c');
    h += '<div id="meta-eq">' + metaEqBox() + '</div>';
    h += field('¿Cómo subo la recompensa?', 'goal.rHow', { area: true, ph: 'Racha en la app, grupo de WhatsApp con otros emprendedores, un premio al cumplir la semana…' });
    h += field('¿Cómo bajo el costo?', 'goal.cHow', { area: true, ph: 'Dejar demos y ruta listos la noche anterior, zonas con negocios juntos, guion aprendido…' });
    h += '</div>';

    h += '<div class="card">' + law('Ley 8 · Un hábito a la vez') + '<h2>Hábito en construcción</h2><p class="mut">Solo uno. No luches contra el malo: reemplázalo.</p>';
    h += field('Hábito', 'goal.habit', { ph: 'Ej. Salir a la calle a las 9:00' });
    h += field('Señal: ¿cuándo o dónde aparece el mal hábito?', 'goal.cue', { ph: 'Ej. Al desayunar abro redes y se me va la mañana' });
    h += field('Rutina nueva en su lugar', 'goal.routine', { ph: 'Ej. Desayuno, reviso Seguimientos de hoy y salgo' });
    h += field('Recompensa', 'goal.reward', { ph: 'Ej. Café en la primera venta del día' });
    h += '</div>';

    h += '<div class="card">' + law('Ley 23 · Los números no mienten') + '<h2>Números del negocio</h2>';
    h += '<div class="grid2"><div>' + field('Precio por hablador $', 'config.unitPrice', { type: 'number', after: 'meta' }) + '</div><div>' + field('Costo real por hablador $', 'config.unitCost', { type: 'number', after: 'meta' }) + '</div></div>';
    h += '<div class="grid2"><div>' + field('Meta de ganancia mensual $', 'config.monthlyGoal', { type: 'number', after: 'meta' }) + '</div><div>' + field('Días de trabajo al mes', 'config.monthDays', { type: 'number', after: 'meta' }) + '</div></div>';
    h += '<div id="meta-calc" class="mt">' + metaCalcBox() + '</div></div>';

    h += '<div class="card">' + law('Ley 25 · Pre-mortem') + '<h2>Imagina que en 90 días fracasó</h2>';
    h += field('¿Qué pasó? Escribe todas las razones', 'goal.premortem', { area: true, ph: 'Visité pocos negocios · El precio no dejaba margen · No hice seguimiento · Me enfoqué en diseñar y no en vender…' });
    h += field('Mi plan para que no pase', 'goal.contingency', { area: true });
    h += '</div>';

    h += '<div class="card"><h2>Configuración</h2>';
    h += field('Tu nombre (para mensajes de WhatsApp)', 'config.sellerName');
    h += field('Meta de visitas por día', 'config.dailyVisitGoal', { type: 'number' });
    h += '<label>Días de trabajo (para rachas)</label><div class="chips">';
    [1, 2, 3, 4, 5, 6, 0].forEach(d => {
      h += '<button class="chip' + (cfg.workDays.indexOf(d) !== -1 ? ' on' : '') + '" data-act="dow" data-d="' + d + '">' + C.DOW[d] + '</button>';
    });
    h += '</div>';
    h += '<h3>Paquetes (Ley 16)</h3><p class="mut small">Sugerencia inicial. Ajústalos a tu costo real. El del medio es el recomendado.</p>';
    cfg.packages.forEach((p, i) => {
      h += '<div class="pcard"><div class="grid3"><div>' + field('Nombre', 'config.packages.' + i + '.name') + '</div><div>' + field('Unidades', 'config.packages.' + i + '.units', { type: 'number' }) + '</div><div>' + field('Precio $', 'config.packages.' + i + '.price', { type: 'number' }) + '</div></div>' + field('Descripción', 'config.packages.' + i + '.desc') + '</div>';
    });
    h += '<label for="cfg-questions">Preguntas del cierre del día (una por línea)</label><textarea id="cfg-questions" style="min-height:160px">' + esc(cfg.questions.join('\n')) + '</textarea>';
    h += '</div>';

    h += '<div class="card"><h2>💾 Respaldo</h2><p class="mut">Tus datos viven solo en este celular. Descarga un respaldo cada semana. En iPhone, agrega la app a la pantalla de inicio para que Safari no borre los datos.</p>';
    h += '<p class="small">Último respaldo: <b>' + (cfg.lastBackup ? esc(U.fmtDate(cfg.lastBackup)) : 'nunca') + '</b></p>';
    h += '<div class="grid2"><button class="btn" data-act="export">Descargar respaldo</button><button class="btn sec" data-act="copy">Copiar respaldo</button></div>';
    h += '<label for="imp">Restaurar desde archivo</label><input id="imp" type="file" accept=".json,application/json">';
    h += '<button class="btn bad block mt" data-act="reset">Borrar todos los datos</button></div>';
    return h;
  }

  window.U = U;
  window.VIEWS = {
    hoy, calle, prospectos, prospectList, pruebas, semana, meta,
    metaGoalBox, metaEqBox, metaCalcBox, packagesHtml
  };
})();

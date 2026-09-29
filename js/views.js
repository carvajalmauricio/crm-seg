/* Pantallas principales. Cada función devuelve HTML. */
'use strict';

(function () {
  const C = window.CONTENT;
  const S = window.STORE;
  const N = window.NATIVE;
  const U = window.U;
  const D = S.dates;
  const esc = U.esc, money = U.money, pct = U.pct, icon = U.icon;

  function todayLong() {
    const s = new Date().toLocaleDateString('es-EC', { weekday: 'long', day: 'numeric', month: 'long' });
    return s.charAt(0).toUpperCase() + s.slice(1);
  }

  function prospectSub(p) {
    const open = p.stage !== 'Ganado' && p.stage !== 'Perdido';
    const t = D.ymd();
    if (open && p.nextDate) {
      const overdue = p.nextDate < t;
      return { text: (p.nextAction || 'Seguimiento') + ' · ' + U.relDate(p.nextDate) + (p.nextTime ? ' ' + p.nextTime : ''), warn: overdue };
    }
    if (p.stage === 'Ganado' && (p.units || p.amount)) return { text: 'Compró ' + (Number(p.units) || 0) + ' u · ' + money(p.amount), warn: false };
    return { text: [p.rubro, p.zone].filter(Boolean).join(' · '), warn: false };
  }

  function whenText(p) {
    const open = p.stage !== 'Ganado' && p.stage !== 'Perdido';
    if (open && p.nextDate) return { text: U.relDate(p.nextDate) + (p.nextTime ? ' ' + p.nextTime : ''), warn: p.nextDate < D.ymd() };
    return { text: '', warn: false };
  }

  function detailText(p) {
    const open = p.stage !== 'Ganado' && p.stage !== 'Perdido';
    if (open && p.nextDate) return p.nextAction || 'Seguimiento';
    if (p.stage === 'Ganado' && (p.units || p.amount)) return 'Compró ' + (Number(p.units) || 0) + ' u · ' + money(p.amount);
    return [p.rubro, p.zone].filter(Boolean).join(' · ');
  }

  // o: { dist, trail, noPill }
  function prospectRow(p, o) {
    o = o || {};
    const w = whenText(p);
    const right = o.dist || w.text;
    return '<div class="cell tap inset-av prow" data-act="p-open" data-id="' + esc(p.id) + '">' + U.avatar(p) +
      '<span class="main"><span class="row-top"><span class="t ellip">' + esc(p.name || '(sin nombre)') + '</span>' +
      (right ? '<span class="when' + (w.warn && !o.dist ? ' warn' : '') + '">' + esc(right) + '</span>' : '') + '</span>' +
      '<span class="s ellip">' + (o.noPill ? '' : U.pill(p.stage)) + esc(detailText(p)) + '</span></span>' +
      (o.trail || '') + '<span class="chev">' + icon('chev', 18, 2.2) + '</span></div>';
  }

  // ---------- HOY ----------
  function heatmap() {
    const t = D.ymd();
    const goal = Number(S.state.config.dailyVisitGoal) || 0;
    let start = D.addDays(t, -27);
    const back = (D.dow(start) + 6) % 7; // alinear a lunes
    start = D.addDays(start, -back);
    let h = '<div class="heat">' + ['L', 'M', 'X', 'J', 'V', 'S', 'D'].map(x => '<div class="dh">' + x + '</div>').join('');
    for (let d = start; d <= t; d = D.addDays(d, 1)) {
      const s = S.dayStats(d);
      let cls = 'd';
      if (!S.isWorkDay(d) && s.visits === 0) cls += ' off';
      else if (goal > 0 && s.visits >= goal) cls += ' h3';
      else if (goal > 0 && s.visits >= goal / 2) cls += ' h2';
      else if (s.visits > 0) cls += ' h1';
      if (d === t) cls += ' today';
      h += '<div class="' + cls + '" title="' + esc(d + ': ' + s.visits + ' visitas') + '">' + D.parseYmd(d).getDate() + '</div>';
    }
    return h + '</div>';
  }

  function hoy(tipOffset) {
    const t = D.ymd();
    const day = S.getDay(t);
    const st = S.dayStats(t);
    const cfg = S.state.config;
    const goal = Number(cfg.dailyVisitGoal) || 0;
    const streak = S.streak();
    let h = U.nav('Hoy', '', U.navBtn('day-edit', 'Corregir', 'Corregir registros del día'));
    h += U.head('Hoy', todayLong() + (streak ? ' · racha de ' + streak + ' día' + (streak === 1 ? '' : 's') : ''));

    if (day.rest) {
      h += '<div class="card"><h3>Día de descanso</h3><p class="muted">Ley 9 · Descansar también es parte del plan. Mañana vuelves con energía.</p><button class="btn tinted mt12" data-act="unrest">Hoy sí salgo</button></div>';
    } else if (!day.committed) {
      h += '<div class="card hero">' + U.law('Ley 6 · Pregunta, no digas') +
        '<h3 style="margin-top:10px;font-size:24px">¿Vas a entrar a ' + goal + ' negocios hoy?</h3>' +
        '<p class="muted" style="margin:6px 0 14px">Decir "sí" a una pregunta te compromete más que escribir una meta.</p>' +
        '<div class="btns two"><button class="btn white" data-act="commit">Sí, lo haré</button><button class="btn glass" data-act="rest">Hoy descanso</button></div></div>';
    }

    const p = goal ? st.visits / goal : 0;
    let msg = 'Cada visita cuenta. Empieza por la primera.';
    if (st.visits > 0 && p < .5) msg = 'Ya arrancaste. Lo difícil era la primera.';
    else if (p >= .5 && p < .8) msg = 'Vas a más de la mitad. Sigue igual.';
    else if (p >= .8 && p < 1) msg = '¡Ya casi! Faltan ' + (goal - st.visits) + '. Este tramo construye tu historia personal (Ley 7).';
    else if (p >= 1) msg = 'Meta cumplida. Todo lo que hagas desde aquí es extra.';
    h += '<div class="card"><div class="ring-row">' + U.ring(st.visits, goal) +
      '<div class="kpis"><div class="kpi"><div class="v">' + st.demos + '</div><div class="k">demos (lo probaron)</div></div>' +
      '<div class="kpi"><div class="v">' + st.sales + ' <span style="font-size:15px;font-weight:500;color:var(--label2)">· ' + st.units + ' u</span></div><div class="k">ventas</div></div>' +
      '<div class="kpi"><div class="v">' + money(st.revenue) + '</div><div class="k">ingreso de hoy</div></div></div></div>' +
      '<div class="strip"><div><div class="v">' + pct(st.demos, st.visits) + '</div><div class="k">visita → demo</div></div>' +
      '<div><div class="v">' + pct(st.sales, st.visits) + '</div><div class="k">visita → venta</div></div>' +
      '<div><div class="v">' + (st.hours > 0 ? money(st.revenue / st.hours) : '—') + '</div><div class="k">por hora</div></div></div>' +
      '<div class="msg">' + esc(msg) + '</div></div>';

    h += U.group('', U.cell({ icon: 'clock', iconBg: 'bg-gray', title: 'Horas en la calle', trailHtml: U.stepper('hours-step', {}, st.hours || 0) }),
      'Para saber cuánto ganas por hora.');

    // Seguimientos (Ley 20)
    const due = S.dueProspects(t);
    let rows = '';
    if (!due.length) {
      rows = U.cell({ icon: 'check', iconBg: 'bg-green', title: 'Sin pendientes', sub: 'Cada «Volver» aparece aquí el día que toca.' });
    } else {
      rows = due.map(x => {
        const wa = U.waLink(x);
        const trail = wa ? '<a class="wa-btn" data-act="link" href="' + esc(wa) + '" target="_blank" rel="noopener" aria-label="WhatsApp">' + icon('chat', 19, 2) + '</a>' : '';
        return prospectRow(x, { trail: trail, noPill: true });
      }).join('');
    }
    h += U.group('<span>Seguimientos de hoy' + (due.length ? ' (' + due.length + ')' : '') + '</span>' + U.law('Ley 20'), rows);

    const tip = C.TIPS[U.tipIndex(tipOffset)];
    h += '<div class="card">' + U.law(tip[0]) + '<p class="tip-body">' + esc(tip[1]) + '</p><button class="btn plain" style="width:auto;padding:0;height:36px" data-act="tip-next">Otra ley</button></div>';

    const lastRev = S.state.reviews.length ? S.state.reviews[S.state.reviews.length - 1].date : null;
    const first = S.earliestDay();
    if (first && D.daysBetween(first, t) >= 6 && (!lastRev || D.daysBetween(lastRev, t) >= 7)) {
      h += '<div class="card warn"><h3>Toca tu revisión semanal</h3><p class="muted">Ley 20 · Corrige el rumbo un grado antes de que sea una milla.</p><button class="btn mt12" data-act="goto" data-tab="progreso" data-seg="progSeg" data-v="semana">Hacer revisión (10 min)</button></div>';
    }

    const qs = cfg.questions;
    const yes = qs.filter(q => day.answers[q] === true).length;
    const qrows = qs.map((q, i) => {
      const a = day.answers[q];
      return U.cell({
        title: q,
        trailHtml: '<span class="yn"><button type="button" class="y' + (a === true ? ' on' : '') + '" data-act="ans" data-i="' + i + '" data-v="1">Sí</button><button type="button" class="n' + (a === false ? ' on' : '') + '" data-act="ans" data-i="' + i + '" data-v="0">No</button></span>'
      });
    }).join('') +
      '<label class="field"><span class="lbl">¿Qué aprendí hoy en la calle?</span><textarea id="note" data-bind="days.' + t + '.note" rows="2" placeholder="Una frase que funcionó, una objeción nueva, un rubro que compra…">' + esc(day.note) + '</textarea></label>';
    h += U.group('<span>Cierre del día · ' + yes + '/' + qs.length + '</span>' + U.law('Ley 6'), qrows, 'Solo sí o no. Sin explicaciones.');

    h += U.group('<span>Racha · ' + streak + ' día' + (streak === 1 ? '' : 's') + '</span>' + U.law('Ley 7'), heatmap(),
      'Verde: meta de visitas cumplida. Punteado: día libre.');

    const lb = cfg.lastBackup;
    if (first && (!lb || D.daysBetween(lb, t) >= 7)) {
      h += U.group('', U.cell({ act: 'goto', data: { tab: 'meta', seg: 'metaSeg', v: 'ajustes' }, icon: 'download', iconBg: 'bg-orange', title: 'Haz tu respaldo semanal', sub: lb ? 'Último: ' + U.fmtDate(lb) : 'Aún no tienes respaldo', chev: true }));
    }
    return '<div class="screen">' + h + '</div>';
  }

  // ---------- CALLE ----------
  function calle() {
    const seg = S.state.ui.calleSeg || 'guion';
    let h = U.nav('Calle');
    h += U.head('Calle', 'Tu guion para cada negocio');
    h += U.seg('calleSeg', [['guion', 'Guion'], ['objeciones', 'Objeciones'], ['paquetes', 'Paquetes'], ['lista', 'Checklist']], seg);

    if (seg === 'guion') {
      h += '<div class="carousel" id="carousel">' + C.STEPS.map((s, i) => {
        let b = '<article class="slide"><div class="num">Paso ' + (i + 1) + ' de ' + C.STEPS.length + '</div><h3>' + esc(s.title.replace(/^\d+\.\s*/, '')) + '</h3><div>' + U.law(s.law) + '</div>';
        if (s.dont) b += '<div class="nosay"><span class="tag">No digas</span>' + esc(s.dont) + '</div>';
        b += '<div class="say"><span class="tag">Di</span>' + s.say + '</div>'; // texto fijo de CONTENT (contiene <br>)
        if (s.note) b += '<div class="note">' + esc(s.note) + '</div>';
        return b + '</article>';
      }).join('') + '</div>';
      h += '<div class="dots" id="dots">' + C.STEPS.map((s, i) => '<i class="' + (i === 0 ? 'on' : '') + '"></i>').join('') + '</div>';
      h += '<div class="center-note">Desliza para ver el siguiente paso. Apréndete de memoria la entrada y el cierre.</div>';
    } else if (seg === 'objeciones') {
      h += U.group('<span>Toca una objeción</span>' + U.law('Ley 3 · Nunca discutas'),
        C.OBJECTIONS.map((o, i) => U.cell({ act: 'obj-open', data: { i: i }, title: '«' + o.obj + '»', chev: true })).join(''),
        'Fórmula: acuerdo → reencuadre → pregunta de sí o no. Nunca empieces con "no, pero…".');
    } else if (seg === 'paquetes') {
      h += '<div class="pad" style="margin-bottom:16px">' + U.law('Ley 16 · Ricitos de Oro') + ' <span class="muted">Muéstrale esta pantalla al cliente.</span></div>';
      h += packagesHtml();
      h += '<div class="pad btns"><button class="btn" data-act="quote-open">' + icon('share', 20, 2) + ' Enviar cotización</button></div>';
      h += '<div class="center-note mt12">Los paquetes se editan en Meta › Ajustes.</div>';
    } else {
      const day = S.getDay(D.ymd());
      h += U.group('<span>Antes de salir</span>' + U.law('Ley 9 · Ley 17'), C.PREP.map((x, i) => {
        const on = !!day.prep[i];
        return U.cell({ act: 'prep', data: { i: i }, cls: on ? 'done' : '', lead: '<span class="chk' + (on ? ' on' : '') + '">' + (on ? icon('check', 15, 3) : '') + '</span>', title: x });
      }).join(''), 'Se reinicia cada día.');
    }
    return '<div class="screen">' + h + '</div>';
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
      let x = '<div class="pkg' + (i === 1 ? ' rec' : '') + '">' + (i === 1 ? '<span class="flag">RECOMENDADO</span>' : '');
      x += '<div class="info"><div class="name">' + esc(p.name) + '</div><div class="u">' + units + ' hablador' + (units === 1 ? '' : 'es') + (units > 1 ? ' · ' + money(per) + ' c/u' : '') + '</div>';
      if (save > 0.009) x += '<div class="sv">Ahorra ' + money(save) + '</div>';
      if (p.desc) x += '<div class="ds">' + esc(p.desc) + '</div>';
      if (cost > 0 && per > 0 && per <= cost) x += '<div class="warn">Precio por unidad menor o igual a tu costo</div>';
      x += '</div><div class="price">' + money(price) + '</div></div>';
      return x;
    }).join('');
  }

  // ---------- CLIENTES ----------
  function clientes(query) {
    const ps = S.state.prospects;
    const f = S.state.ui.pfilter || 'Todos';
    const sort = S.state.ui.psort || 'proximos';
    const soft = ps.filter(p => p.software === 'Sí' || p.software === 'Tal vez').length;
    let h = U.nav('Clientes', '', U.navBtn('p-new', icon('plus', 26, 2.2), 'Nuevo cliente'));
    h += U.head('Clientes', ps.length + ' registro' + (ps.length === 1 ? '' : 's') + ' · ' + soft + ' con interés en software');
    h += '<div class="search">' + icon('search', 18, 2.2) + '<input id="p-search" type="search" placeholder="Buscar" autocomplete="off" autocorrect="off" value="' + esc(query || '') + '"></div>';
    h += '<div class="hscroll">' + ['Todos'].concat(C.STAGES).map(s => {
      const n = s === 'Todos' ? ps.length : ps.filter(p => p.stage === s).length;
      return '<button class="chip' + (f === s ? ' on' : '') + '" data-act="pfilter" data-s="' + esc(s) + '">' + esc(s) + ' <span class="n">' + n + '</span></button>';
    }).join('') + '</div>';
    h += U.seg('psort', [['proximos', 'Próximos'], ['cerca', 'Cerca de mí'], ['recientes', 'Recientes']], sort);
    h += '<div id="p-list">' + clientList(query) + '</div>';
    return '<div class="screen">' + h + '</div>';
  }

  function clientList(query) {
    const f = S.state.ui.pfilter || 'Todos';
    const sort = S.state.ui.psort || 'proximos';
    const q = String(query || '').toLowerCase().trim();
    let ps = S.state.prospects.slice();
    if (f !== 'Todos') ps = ps.filter(p => p.stage === f);
    if (q) ps = ps.filter(p => [p.name, p.contact, p.zone, p.rubro, p.notes, p.phone].join(' ').toLowerCase().indexOf(q) !== -1);
    if (!S.state.prospects.length) {
      return U.empty('users', 'Aún no tienes clientes', 'Registra negocios con el botón Volver en Hoy o con el botón +.', '<button class="btn sm" data-act="p-new">Agregar cliente</button>');
    }
    if (!ps.length) return U.empty('search', 'Sin resultados', 'Prueba con otra búsqueda o filtro.');

    const pos = N.lastPos;
    let note = '';
    if (sort === 'cerca') {
      if (!pos) note = '<div class="center-note">Buscando tu ubicación…</div>';
      ps.forEach(p => { p._d = pos ? N.distance(pos, p) : Infinity; });
      ps.sort((a, b) => a._d - b._d);
    } else if (sort === 'recientes') {
      ps.sort((a, b) => (b.updated || 0) - (a.updated || 0));
    } else {
      const key = p => (p.stage !== 'Ganado' && p.stage !== 'Perdido' && p.nextDate ? p.nextDate + (p.nextTime || '') : '9999');
      ps.sort((a, b) => {
        const ka = key(a), kb = key(b);
        if (ka !== kb) return ka < kb ? -1 : 1;
        return (b.updated || 0) - (a.updated || 0);
      });
    }
    const rows = ps.map(p => {
      const dist = sort === 'cerca' && isFinite(p._d) ? N.fmtDist(p._d) : '';
      delete p._d;
      return prospectRow(p, { dist: dist });
    }).join('');
    const footer = sort === 'cerca' ? 'Solo aparecen cerca los clientes guardados con ubicación.' : '';
    return note + U.group('', rows, footer);
  }

  // ---------- PROGRESO ----------
  function delta(a, b, fmt) {
    fmt = fmt || String;
    if (a > b) return '<div class="d up">▲ ' + fmt(a - b) + ' vs. semana anterior</div>';
    if (a < b) return '<div class="d down">▼ ' + fmt(b - a) + ' vs. semana anterior</div>';
    return '<div class="d flat">Igual que la semana anterior</div>';
  }

  function hbars(items, max, color) {
    return items.map(it => '<div class="hbar"><span class="l ellip">' + esc(it[0]) + '</span><span class="tr"><i style="width:' + (max > 0 ? Math.round(it[1] / max * 100) : 0) + '%;' + (color ? 'background:' + color : '') + '"></i></span><span class="n">' + esc(it[2] != null ? it[2] : it[1]) + '</span></div>').join('');
  }

  function progreso() {
    const seg = S.state.ui.progSeg || 'semana';
    let h = U.nav('Progreso');
    h += U.head('Progreso', seg === 'semana' ? 'Últimos 7 días' : 'Experimentos');
    h += U.seg('progSeg', [['semana', 'Semana'], ['pruebas', 'Pruebas']], seg);
    h += seg === 'semana' ? semana() : pruebas();
    return '<div class="screen">' + h + '</div>';
  }

  function semana() {
    const t = D.ymd();
    const a = S.rangeStats(D.addDays(t, -6), t);
    const b = S.rangeStats(D.addDays(t, -13), D.addDays(t, -7));
    const ra = a.visits ? a.sales / a.visits : 0;
    const rb = b.visits ? b.sales / b.visits : 0;
    let h = '<div class="kpi-grid">' +
      '<div class="kpi-card"><div class="k">Visitas</div><div class="v">' + a.visits + '</div>' + delta(a.visits, b.visits) + '</div>' +
      '<div class="kpi-card"><div class="k">Ventas</div><div class="v">' + a.sales + '</div>' + delta(a.sales, b.sales) + '</div>' +
      '<div class="kpi-card"><div class="k">Ingreso</div><div class="v">' + money(a.revenue) + '</div>' + delta(a.revenue, b.revenue, money) + '</div>' +
      '<div class="kpi-card"><div class="k">Cierre</div><div class="v">' + Math.round(ra * 100) + '%</div>' + delta(Math.round(ra * 100), Math.round(rb * 100), v => v + ' pts') + '</div>' +
      '</div>';

    h += U.group('<span>Embudo de la semana</span>' + U.law('Ley 23'),
      hbars([['Visitas', a.visits], ['Demos', a.demos, a.demos + ' · ' + pct(a.demos, a.visits)], ['Ventas', a.sales, a.sales + ' · ' + pct(a.sales, a.visits)]], a.visits) +
      U.cell({ title: 'Días con meta cumplida', trail: a.met + ' de ' + a.workDays }) +
      U.cell({ title: 'Habladores vendidos', trail: String(a.units) }),
      'Si te da miedo mirar estos números, es cuando más debes mirarlos (no seas avestruz).');

    const reasons = Object.keys(a.reasons).sort((x, y) => a.reasons[y] - a.reasons[x]);
    const maxR = reasons.length ? a.reasons[reasons[0]] : 0;
    h += U.group('<span>Por qué te dijeron que no</span>' + U.law('Ley 21'),
      reasons.length ? hbars(reasons.map(r => [r, a.reasons[r]]), maxR, 'var(--red)') : U.cell({ title: 'Sin "no" anotados esta semana', cls: '' }),
      reasons.length ? 'La razón #1 es tu próximo experimento o la objeción a practicar.' : '');

    const won = S.state.prospects.filter(p => p.stage === 'Ganado');
    if (won.length) {
      const byR = {};
      won.forEach(p => { const k = p.rubro || 'Sin rubro'; byR[k] = (byR[k] || 0) + 1; });
      const keys = Object.keys(byR).sort((x, y) => byR[y] - byR[x]);
      h += U.group('Clientes ganados por rubro', hbars(keys.map(k => [k, byR[k]]), byR[keys[0]], 'var(--green)'), 'Total histórico. Concéntrate en el rubro que más compra.');
    }

    h += U.group('<span>Revisión de la semana</span>' + U.law('Ley 20'),
      C.REVIEW_FIELDS.map(f => '<label class="field"><span class="lbl">' + esc(f[1]) + '</span><textarea id="rv-' + f[0] + '" rows="2"></textarea></label>').join(''),
      '10 minutos, con honestidad. Nadie más lo lee.');
    h += '<div class="pad btns" style="margin-bottom:26px"><button class="btn green" data-act="review-save">Guardar revisión</button><button class="btn tinted" data-act="review-share">' + icon('share', 20, 2) + ' Compartir resumen</button></div>';

    if (S.state.reviews.length) {
      h += U.group('Revisiones anteriores', S.state.reviews.slice().reverse().map(r =>
        U.cell({ act: 'review-open', data: { id: r.id }, icon: 'doc', iconBg: 'bg-indigo', title: U.fmtDate(r.date, { weekday: 'long', day: 'numeric', month: 'long' }), sub: r.stats ? r.stats.visits + ' visitas · ' + r.stats.sales + ' ventas · ' + money(r.stats.revenue) : '', chev: true })
      ).join(''));
    }
    return h;
  }

  function pruebas() {
    const ex = S.state.experiments;
    const run = ex.filter(e => e.status === 'Corriendo').length;
    const okN = ex.filter(e => e.status === 'Funcionó').length;
    const bad = ex.filter(e => e.status === 'No funcionó').length;
    let h = '<div class="card">' + U.law('Ley 21 · Equivócate más que la competencia') +
      '<p class="tip-body">Cambia <b>una sola cosa</b> por semana y mide. Casi todo es una puerta de dos vías: si falla, vuelves atrás sin daño. Decide rápido.</p>' +
      '<div class="strip"><div><div class="v">' + run + '</div><div class="k">corriendo</div></div><div><div class="v">' + okN + '</div><div class="k">funcionaron</div></div><div><div class="v">' + bad + '</div><div class="k">aprendizajes</div></div></div></div>';
    h += '<div class="pad" style="margin-bottom:26px"><button class="btn" data-act="exp-new">' + icon('plus', 20, 2.2) + ' Nuevo experimento</button></div>';

    if (ex.length) {
      h += U.group('Tus experimentos', ex.slice().reverse().map(e => {
        const cls = e.status === 'Funcionó' ? 's4' : e.status === 'No funcionó' ? 's5' : 's3';
        return U.cell({ act: 'exp-open', data: { id: e.id }, icon: 'flask', iconBg: 'bg-purple', title: e.title, titleCls: 'ellip', sub: e.metric ? 'Métrica: ' + e.metric : '', trailHtml: '<span class="pill ' + cls + '">' + esc(e.status) + '</span>', chev: true });
      }).join(''));
    }
    h += U.group('Ideas para probar', C.EXP_IDEAS.map((e, i) => U.cell({ act: 'exp-idea', data: { i: i }, icon: 'bulb', iconBg: 'bg-yellow', title: e.title, sub: e.metric, chev: true })).join(''), 'Toca una para empezarla.');
    return h;
  }

  // ---------- META ----------
  function field(label, path, opts) {
    opts = opts || {};
    const v = S.getPath(path);
    const val = v == null ? '' : v;
    const after = opts.after ? ' data-after="' + opts.after + '"' : '';
    if (opts.area) {
      return '<label class="field"><span class="lbl">' + esc(label) + '</span><textarea data-bind="' + path + '"' + after + ' rows="2" placeholder="' + esc(opts.ph || '') + '">' + esc(val) + '</textarea></label>';
    }
    const type = opts.type || 'text';
    const num = type === 'number';
    return '<label class="field"><span class="lbl">' + esc(label) + '</span><input type="' + type + '"' +
      (num ? ' inputmode="decimal" step="any" min="0" data-type="num"' : '') +
      (opts.id ? ' id="' + opts.id + '"' : '') +
      (opts.inputmode ? ' inputmode="' + opts.inputmode + '"' : '') +
      ' data-bind="' + path + '"' + after + ' value="' + esc(val) + '" placeholder="' + esc(opts.ph || '') + '"></label>';
  }

  function metaHero() {
    const g = S.state.goal;
    const t = D.ymd();
    const target = Number(g.target) || 0;
    const start = g.start || t;
    const sold = S.unitsSince(start);
    const p = target ? Math.min(100, Math.round(sold / target * 100)) : 0;
    let h = U.law('Ley 22 · Plan A') + '<h3 style="margin:10px 0 4px;font-size:22px">' + esc(g.text || 'Define tu meta a 90 días') + '</h3>';
    h += '<div class="bar mt12"><i style="width:' + p + '%"></i></div>';
    h += '<p class="muted" style="margin:8px 0 0"><b style="color:#fff">' + sold + ' de ' + target + '</b> habladores vendidos desde ' + esc(U.fmtDate(start)) + '.</p>';
    if (g.deadline && target && D.validYmd(g.deadline)) {
      const left = D.daysBetween(t, g.deadline);
      const wd = left >= 0 ? S.workDaysBetween(t, g.deadline) : 0;
      const rem = Math.max(0, target - sold);
      if (rem === 0) h += '<p class="muted" style="margin:4px 0 0">Meta alcanzada. Sube el listón.</p>';
      else if (wd > 0) h += '<p class="muted" style="margin:4px 0 0">Quedan ' + left + ' días (' + wd + ' de trabajo): <b style="color:#fff">' + (Math.ceil(rem / wd * 10) / 10) + ' habladores por día</b>.</p>';
      else h += '<p class="muted" style="margin:4px 0 0">La fecha límite ya pasó. Define una nueva meta.</p>';
    }
    return h;
  }

  function metaEq() {
    const g = S.state.goal;
    const v = Number(g.v) || 0, r = Number(g.r) || 0, c = Number(g.c) || 0;
    const d = v + r - c;
    let msg = '<span class="up">Disciplina sostenible. Protégela.</span>';
    if (d < 6) msg = '<span class="down">En riesgo: sube la recompensa o baja el costo hoy mismo.</span>';
    else if (d < 12) msg = '<span style="color:var(--orange)">Frágil: mejora al menos uno de los tres.</span>';
    return '<div class="eq">' + v + ' + ' + r + ' − ' + c + ' = ' + d + '</div><div class="eq-msg">' + msg + '</div>';
  }

  function metaCalc() {
    const cfg = S.state.config;
    const tot = S.totals();
    const price = Number(cfg.unitPrice) || 0;
    const cost = Number(cfg.unitCost) || 0;
    const margin = price - cost;
    const goal = Number(cfg.monthlyGoal) || 0;
    const mdays = Number(cfg.monthDays) || 0;
    const lines = [];
    if (!cost) lines.push('<span class="down">Pon tu costo real por hablador (acrílico + vinil + NFC + impresión). Sin eso no sabes cuánto ganas.</span>');
    lines.push('Ganancia por hablador: <b>' + money(margin) + '</b>' + (price ? ' (' + Math.round(margin / price * 100) + '% del precio)' : ''));
    if (margin <= 0) lines.push('<span class="down">Con este precio y costo no ganas dinero.</span>');
    else if (!goal) lines.push('Pon tu meta de ganancia mensual para calcular cuánto vender.');
    else {
      const upm = Math.ceil(goal / margin);
      const upd = mdays ? upm / mdays : 0;
      lines.push('Para ganar <b>' + money(goal) + '</b> al mes: <b>' + upm + ' habladores/mes</b> ≈ <b>' + (Math.ceil(upd * 10) / 10) + ' por día</b>.');
      if (tot.visits >= 20 && tot.sales > 0) {
        const spv = tot.sales / tot.visits;
        const ups = tot.units / tot.sales;
        const vpd = Math.ceil(upd / ups / spv);
        lines.push('Con tus datos reales (' + Math.round(spv * 100) + '% de cierre, ' + (Math.round(ups * 10) / 10) + ' u por venta) necesitas <b>' + vpd + ' visitas por día</b>. Tu meta es ' + (Number(cfg.dailyVisitGoal) || 0) + '.');
        if (vpd > (Number(cfg.dailyVisitGoal) || 0)) lines.push('<span class="down">Tu meta de visitas no alcanza: sube visitas, mejora el cierre o vende paquetes más grandes.</span>');
      } else {
        lines.push('<span style="color:var(--label2)">Con 20+ visitas y alguna venta verás cuántas visitas diarias necesitas según tu tasa real.</span>');
      }
    }
    lines.push('<span style="color:var(--label2)">Total: ' + tot.visits + ' visitas · ' + tot.sales + ' ventas · ' + tot.units + ' u · ' + money(tot.revenue) + '</span>');
    return lines.map(l => '<div style="padding:4px 0;font-size:15px;line-height:1.4">' + l + '</div>').join('');
  }

  function slider(label, path) {
    const v = Number(S.getPath(path)) || 1;
    return '<label class="slider-cell"><span class="top"><span>' + esc(label) + '</span><b id="lv-' + path.replace(/\./g, '-') + '">' + v + '</b></span><input type="range" min="1" max="10" step="1" data-bind="' + path + '" data-type="num" data-after="meta" value="' + v + '"></label>';
  }

  function meta() {
    const seg = S.state.ui.metaSeg || 'meta';
    let h = U.nav(seg === 'meta' ? 'Meta' : 'Ajustes');
    h += U.head(seg === 'meta' ? 'Meta' : 'Ajustes', seg === 'meta' ? 'Tu plan A y tus números' : 'Perfil, paquetes y respaldo');
    h += U.seg('metaSeg', [['meta', 'Meta'], ['ajustes', 'Ajustes']], seg);
    h += seg === 'meta' ? metaPlan() : ajustes();
    return '<div class="screen">' + h + '</div>';
  }

  function metaPlan() {
    let h = '<div class="card hero" id="meta-hero">' + metaHero() + '</div>';
    h += U.group('Meta a 90 días',
      field('Mi meta en una frase', 'goal.text', { ph: 'Ej. Vender 100 habladores y 5 softwares', after: 'meta' }) +
      '<div class="field"><div class="row2"><label><span class="lbl">Habladores a vender</span><input type="number" inputmode="numeric" min="0" data-type="num" data-bind="goal.target" data-after="meta" value="' + esc(S.state.goal.target) + '"></label>' +
      '<label><span class="lbl">Fecha límite</span><input type="date" data-bind="goal.deadline" data-after="meta" value="' + esc(S.state.goal.deadline) + '"></label></div></div>' +
      field('¿Por qué me importa DE VERDAD?', 'goal.why', { area: true, ph: 'No "por dinero". ¿Qué cambia en tu vida si lo logras?' }),
      'Ley 27 · Cuanto más claro el porqué, más fácil la disciplina.');

    h += U.group('<span>Ecuación de la disciplina</span>' + U.law('Ley 27'),
      slider('Valor de la meta para mí', 'goal.v') + slider('Qué tanto disfruto el proceso', 'goal.r') + slider('Qué tan pesado se siente', 'goal.c') +
      '<div class="cell" style="display:block" id="meta-eq">' + metaEq() + '</div>' +
      field('¿Cómo subo la recompensa?', 'goal.rHow', { area: true, ph: 'Racha en la app, grupo de WhatsApp con otros emprendedores, un premio al cumplir la semana…' }) +
      field('¿Cómo bajo el costo?', 'goal.cHow', { area: true, ph: 'Dejar demos y ruta listos la noche anterior, zonas con negocios juntos…' }),
      'Disciplina = valor de la meta + recompensa del proceso − costo del proceso.');

    h += U.group('<span>Hábito en construcción</span>' + U.law('Ley 8'),
      field('Hábito (solo uno)', 'goal.habit', { ph: 'Ej. Salir a la calle a las 9:00' }) +
      field('Señal del mal hábito', 'goal.cue', { ph: 'Ej. Al desayunar abro redes y se me va la mañana' }) +
      field('Rutina nueva en su lugar', 'goal.routine', { ph: 'Ej. Reviso Seguimientos de hoy y salgo' }) +
      field('Recompensa', 'goal.reward', { ph: 'Ej. Café en la primera venta del día' }),
      'No luches contra el mal hábito: reemplázalo.');

    h += U.group('<span>Números del negocio</span>' + U.law('Ley 23'),
      '<div class="field"><div class="row2"><label><span class="lbl">Precio por hablador $</span><input type="number" inputmode="decimal" step="any" min="0" data-type="num" data-bind="config.unitPrice" data-after="meta" value="' + esc(S.state.config.unitPrice) + '"></label>' +
      '<label><span class="lbl">Costo real por hablador $</span><input id="f-cost" type="number" inputmode="decimal" step="any" min="0" data-type="num" data-bind="config.unitCost" data-after="meta" value="' + esc(S.state.config.unitCost) + '"></label></div></div>' +
      '<div class="field"><div class="row2"><label><span class="lbl">Meta de ganancia mensual $</span><input id="f-goal" type="number" inputmode="decimal" step="any" min="0" data-type="num" data-bind="config.monthlyGoal" data-after="meta" value="' + esc(S.state.config.monthlyGoal) + '"></label>' +
      '<label><span class="lbl">Días de trabajo al mes</span><input type="number" inputmode="numeric" min="0" data-type="num" data-bind="config.monthDays" data-after="meta" value="' + esc(S.state.config.monthDays) + '"></label></div></div>' +
      '<div class="cell" style="display:block" id="meta-calc">' + metaCalc() + '</div>',
      'Con un producto de ' + money(S.state.config.unitPrice) + ' necesitas volumen: úsalo para abrir la puerta a tu software.');

    h += U.group('<span>Imagina que en 90 días fracasó</span>' + U.law('Ley 25'),
      field('¿Qué pasó? Escribe todas las razones', 'goal.premortem', { area: true, ph: 'Visité pocos negocios · El precio no dejaba margen · No hice seguimiento…' }) +
      field('Mi plan para que no pase', 'goal.contingency', { area: true }));
    return h;
  }

  function ajustes() {
    const cfg = S.state.config;
    let h = U.group('Perfil',
      field('Tu nombre', 'config.sellerName', { ph: 'Aparece en WhatsApp y cotizaciones' }) +
      field('Tu WhatsApp', 'config.sellerPhone', { type: 'tel', inputmode: 'tel', ph: '09XXXXXXXX' }),
      'Se usa en los mensajes y en la imagen de cotización.');

    h += U.group('Calle',
      U.cell({ icon: 'store', iconBg: 'bg-blue', title: 'Visitas por día', trailHtml: U.stepper('goal-step', {}, cfg.dailyVisitGoal) }) +
      '<div class="cell" style="display:block"><div class="t" style="margin-bottom:8px">Días de trabajo</div><div class="day-chips">' +
      [1, 2, 3, 4, 5, 6, 0].map(d => '<button class="chip' + (cfg.workDays.indexOf(d) !== -1 ? ' on' : '') + '" data-act="dow" data-d="' + d + '" aria-label="' + ['Domingo', 'Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado'][d] + '">' + C.DOW[d] + '</button>').join('') +
      '</div></div>',
      'Las rachas solo cuentan tus días de trabajo.');

    h += U.group('<span>Paquetes</span>' + U.law('Ley 16'),
      cfg.packages.map((p, i) => U.cell({ act: 'pkg-open', data: { i: i }, icon: 'cash', iconBg: i === 1 ? 'bg-blue' : 'bg-gray', title: p.name + (i === 1 ? ' · recomendado' : ''), trail: (Number(p.units) || 0) + ' u · ' + money(p.price), chev: true })).join(''),
      'Sugerencia inicial: ajústalos a tu costo real. El del medio es el recomendado.');

    h += U.group('Cierre del día',
      U.cell({ act: 'q-edit', icon: 'list', iconBg: 'bg-green', title: 'Preguntas de sí o no', trail: String(cfg.questions.length), chev: true }));

    h += U.group('Calendario',
      U.cell({ icon: 'cal', iconBg: 'bg-red', title: 'Recordatorio al agendar', sub: 'Activa por defecto el recordatorio en el Calendario', trailHtml: '<label class="switch"><input type="checkbox" id="cfg-cal"' + (cfg.calDefault ? ' checked' : '') + ' aria-label="Recordatorio por defecto"><span></span></label>' }));

    h += U.group('Datos y respaldo',
      U.cell({ act: 'backup-share', icon: 'share', iconBg: 'bg-blue', title: 'Guardar respaldo', sub: 'En Archivos (iCloud Drive) o por WhatsApp', chev: true }) +
      U.cell({ act: 'backup-download', icon: 'download', iconBg: 'bg-teal', title: 'Descargar respaldo', chev: true }) +
      U.cell({ act: 'backup-copy', icon: 'copy', iconBg: 'bg-gray', title: 'Copiar respaldo como texto', chev: true }) +
      '<label class="cell tap inset-icon" for="imp"><span class="ico bg-orange">' + icon('upload', 19, 2) + '</span><span class="main"><span class="t" style="display:block">Restaurar desde archivo</span></span><span class="trail"><span class="chev">' + icon('chev', 18, 2.2) + '</span></span></label>' +
      '<input id="imp" class="sr" type="file" accept=".json,application/json,text/plain">' +
      U.cell({ act: 'reset', cls: 'danger', title: 'Borrar todos los datos' }),
      'Último respaldo: ' + (cfg.lastBackup ? esc(U.fmtDate(cfg.lastBackup)) : 'nunca') + '. Tus datos viven solo en este iPhone. Las fotos no van en el respaldo: guárdalas en tu carrete desde la ficha del cliente.');

    h += U.group('', U.cell({ icon: 'target', iconBg: 'bg-indigo', title: 'Sistema CEO · Clyclick', sub: 'Basado en «El Diario de un CEO»', trail: 'v2.0' }));
    return h;
  }

  window.VIEWS = {
    hoy, calle, clientes, clientList, progreso, meta,
    metaHero, metaEq, metaCalc, packagesHtml, prospectSub
  };
})();

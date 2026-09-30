/* Estado, persistencia (localStorage), migraciones y cálculos. Sin dependencias. */
'use strict';

(function () {
  const C = window.CONTENT;
  const KEY = 'clyclick_ceo_v1';
  const TABS = ['hoy', 'calle', 'clientes', 'progreso', 'meta'];

  // ---------- Fechas (hora local; nunca toISOString para evitar el desfase UTC) ----------
  function ymd(d) {
    d = d || new Date();
    const m = String(d.getMonth() + 1).padStart(2, '0');
    const da = String(d.getDate()).padStart(2, '0');
    return d.getFullYear() + '-' + m + '-' + da;
  }
  function parseYmd(s) {
    const p = String(s).split('-').map(Number);
    return new Date(p[0], p[1] - 1, p[2]);
  }
  function addDays(s, n) {
    const d = parseYmd(s);
    d.setDate(d.getDate() + n);
    return ymd(d);
  }
  function daysBetween(a, b) {
    return Math.round((parseYmd(b) - parseYmd(a)) / 86400000);
  }
  function dow(s) { return parseYmd(s).getDay(); }
  function validYmd(s) { return /^\d{4}-\d{2}-\d{2}$/.test(String(s || '')); }

  // ---------- Estado ----------
  function defaultState() {
    const t = ymd();
    return {
      version: 3,
      config: {
        onboarded: false,
        sellerName: '',
        sellerPhone: '',
        sellerCity: '',
        dailyVisitGoal: 15,
        workDays: [1, 2, 3, 4, 5, 6],
        unitPrice: 15,
        unitCost: 0,
        monthlyGoal: 0,
        monthDays: 24,
        packages: JSON.parse(JSON.stringify(C.DEFAULT_PACKAGES)),
        questions: C.QUESTIONS.slice(),
        lastBackup: '',
        calDefault: false
      },
      days: {},
      prospects: [],
      experiments: [],
      reviews: [],
      goal: {
        text: '', target: 100, start: t, deadline: addDays(t, 90), why: '',
        v: 7, r: 5, c: 5, rHow: '', cHow: '',
        premortem: '', contingency: '',
        habit: '', cue: '', routine: '', reward: ''
      },
      ui: {
        tab: 'hoy', pfilter: 'Todos', psort: 'proximos',
        calleSeg: 'guion', progSeg: 'semana', metaSeg: 'meta'
      }
    };
  }

  function normalize(s) {
    const d = defaultState();
    if (!s || typeof s !== 'object') return d;
    const out = Object.assign({}, d, s);
    out.config = Object.assign({}, d.config, s.config || {});
    out.goal = Object.assign({}, d.goal, s.goal || {});
    out.ui = Object.assign({}, d.ui, s.ui || {});
    out.days = (s.days && typeof s.days === 'object') ? s.days : {};
    out.prospects = Array.isArray(s.prospects) ? s.prospects.filter(p => p && typeof p === 'object') : [];
    out.experiments = Array.isArray(s.experiments) ? s.experiments.filter(Boolean) : [];
    out.reviews = Array.isArray(s.reviews) ? s.reviews.filter(Boolean) : [];

    const cfg = out.config;
    if (!Array.isArray(cfg.packages) || cfg.packages.length !== 3) cfg.packages = JSON.parse(JSON.stringify(C.DEFAULT_PACKAGES));
    if (!Array.isArray(cfg.workDays) || !cfg.workDays.length) cfg.workDays = [1, 2, 3, 4, 5, 6];
    if (!Array.isArray(cfg.questions) || !cfg.questions.length) cfg.questions = C.QUESTIONS.slice();

    // Migración v1 → v2: quien ya usaba la app no ve la bienvenida y conserva su pestaña.
    if (!s.version || s.version < 2) {
      const hasData = Object.keys(out.days).length > 0 || out.prospects.length > 0;
      if (s.config && s.config.onboarded === undefined) cfg.onboarded = hasData;
      const old = out.ui.tab;
      if (old === 'prospectos') out.ui.tab = 'clientes';
      else if (old === 'pruebas') { out.ui.tab = 'progreso'; out.ui.progSeg = 'pruebas'; }
      else if (old === 'semana') { out.ui.tab = 'progreso'; out.ui.progSeg = 'semana'; }
      out.version = 2;
    }
    // Migración v2 → v3 (Blount + Cialdini + Voss): "porque" en paquetes, preguntas nuevas.
    if (out.version < 3) {
      cfg.questions = cfg.questions.map(q => C.QUESTIONS_RENAME[q] || q);
      C.QUESTIONS_NEW.forEach(q => { if (cfg.questions.indexOf(q) === -1) cfg.questions.push(q); });
      if (out.ui.calleSeg === 'paquetes') out.ui.calleSeg = 'precios';
      if (out.ui.calleSeg === 'objeciones') out.ui.calleSeg = 'objecion';
      out.version = 3;
    }
    cfg.packages.forEach((p, i) => { if (typeof p.why !== 'string') p.why = C.PKG_WHY[i] || ''; });
    if (['guion', 'objecion', 'precios', 'cerca', 'lista'].indexOf(out.ui.calleSeg) === -1) out.ui.calleSeg = 'guion';
    if (TABS.indexOf(out.ui.tab) === -1) out.ui.tab = 'hoy';

    out.prospects.forEach(p => {
      if (!p.id) p.id = uid();
      if (C.STAGES.indexOf(p.stage) === -1) p.stage = 'Visitado';
      if (p.nextDate && !validYmd(p.nextDate)) p.nextDate = '';
      if (p.stage === 'Ganado' && !p.wonAt && p.updated) p.wonAt = ymd(new Date(p.updated));
    });
    return out;
  }

  function load() {
    let s = null;
    try { s = JSON.parse(localStorage.getItem(KEY) || 'null'); } catch (e) { s = null; }
    return normalize(s);
  }

  function uid() {
    return Date.now().toString(36) + Math.random().toString(36).slice(2, 7);
  }

  const S = { state: load(), TABS: TABS };

  S.save = function () {
    try {
      localStorage.setItem(KEY, JSON.stringify(S.state));
      return true;
    } catch (e) {
      return false;
    }
  };

  S.replace = function (raw) {
    S.state = normalize(raw);
    S.save();
  };

  S.reset = function () {
    S.state = defaultState();
    S.state.config.onboarded = true;
    S.save();
  };

  // Deshacer: copia completa del estado antes de una acción.
  S.snapshot = function () { return JSON.stringify(S.state); };
  S.restore = function (snap) {
    try { S.state = normalize(JSON.parse(snap)); S.save(); return true; } catch (e) { return false; }
  };

  // ---------- Días ----------
  S.getDay = function (d) {
    const days = S.state.days;
    if (!days[d] || typeof days[d] !== 'object') days[d] = {};
    const x = days[d];
    if (typeof x.visits !== 'number') x.visits = Number(x.visits) || 0;
    if (typeof x.demos !== 'number') x.demos = Number(x.demos) || 0;
    if (typeof x.laters !== 'number') x.laters = Number(x.laters) || 0;
    if (typeof x.owners !== 'number') x.owners = Number(x.owners) || 0;
    if (typeof x.absent !== 'number') x.absent = Number(x.absent) || 0;
    if (!Array.isArray(x.salesLog)) x.salesLog = [];
    if (!Array.isArray(x.rejLog)) x.rejLog = [];
    if (!x.answers || typeof x.answers !== 'object') x.answers = {};
    if (!x.prep || typeof x.prep !== 'object') x.prep = {};
    if (typeof x.note !== 'string') x.note = '';
    return x;
  };

  S.dayStats = function (d) {
    const x = S.state.days[d] || {};
    const sales = Array.isArray(x.salesLog) ? x.salesLog : [];
    const rej = Array.isArray(x.rejLog) ? x.rejLog : [];
    return {
      visits: Number(x.visits) || 0,
      demos: Number(x.demos) || 0,
      laters: Number(x.laters) || 0,
      owners: Number(x.owners) || 0,
      absent: Number(x.absent) || 0,
      sales: sales.length,
      units: sales.reduce((a, s) => a + (Number(s.units) || 0), 0),
      revenue: sales.reduce((a, s) => a + (Number(s.amount) || 0), 0),
      rej: rej.length,
      hours: Number(x.hours) || 0,
      committed: !!x.committed,
      rest: !!x.rest
    };
  };

  S.minVisits = function (x) {
    return Math.max(x.demos || 0, x.owners || 0, (x.salesLog || []).length + (x.rejLog || []).length + (x.laters || 0));
  };

  // Cada venta, "no", "volver", demo o charla con el dueño implica una visita: mantiene los números coherentes.
  S.fixVisits = function (x) {
    const need = S.minVisits(x);
    if (x.visits < need) { x.visits = need; return true; }
    return false;
  };

  S.isWorkDay = function (d) {
    return S.state.config.workDays.indexOf(dow(d)) !== -1;
  };

  S.dayMet = function (d) {
    const g = Number(S.state.config.dailyVisitGoal) || 0;
    return g > 0 && S.dayStats(d).visits >= g;
  };

  // Racha: días de trabajo seguidos cumpliendo la meta. Hoy no rompe la racha si aún no se cumple.
  S.streak = function () {
    const t = ymd();
    let n = 0;
    let d = S.dayMet(t) ? t : addDays(t, -1);
    for (let i = 0; i < 400; i++) {
      if (!S.isWorkDay(d)) { d = addDays(d, -1); continue; }
      if (S.dayMet(d)) { n++; d = addDays(d, -1); } else break;
    }
    return n;
  };

  S.rangeStats = function (from, to) {
    const r = {
      visits: 0, demos: 0, owners: 0, absent: 0, laters: 0, sales: 0, units: 0, revenue: 0, rej: 0, hours: 0, met: 0, workDays: 0,
      reasons: {}, types: {}, asi: { sales: 0, rej: 0 }, noAsi: { sales: 0, rej: 0 }
    };
    for (let d = from; d <= to; d = addDays(d, 1)) {
      const s = S.dayStats(d);
      r.visits += s.visits; r.demos += s.demos; r.sales += s.sales; r.units += s.units;
      r.revenue += s.revenue; r.rej += s.rej; r.hours += s.hours;
      r.owners += s.owners; r.absent += s.absent; r.laters += s.laters;
      if (S.isWorkDay(d)) { r.workDays++; if (S.dayMet(d)) r.met++; }
      const x = S.state.days[d];
      if (x && Array.isArray(x.rejLog)) x.rejLog.forEach(j => {
        r.reasons[j.reason] = (r.reasons[j.reason] || 0) + 1;
        const k = j.type || 'sin';
        r.types[k] = (r.types[k] || 0) + 1;
        if (j.asi) r.asi.rej++; else r.noAsi.rej++;
      });
      if (x && Array.isArray(x.salesLog)) x.salesLog.forEach(j => { if (j.asi) r.asi.sales++; else r.noAsi.sales++; });
    }
    return r;
  };

  S.totals = function () {
    const r = { visits: 0, demos: 0, owners: 0, sales: 0, units: 0, revenue: 0, rej: 0, hours: 0 };
    Object.keys(S.state.days).forEach(d => {
      const s = S.dayStats(d);
      r.visits += s.visits; r.demos += s.demos; r.sales += s.sales; r.owners += s.owners;
      r.units += s.units; r.revenue += s.revenue; r.rej += s.rej; r.hours += s.hours;
    });
    return r;
  };

  S.unitsSince = function (from) {
    let u = 0;
    Object.keys(S.state.days).forEach(d => { if (d >= from) u += S.dayStats(d).units; });
    return u;
  };

  S.workDaysBetween = function (from, to) {
    let n = 0;
    for (let d = from; d <= to; d = addDays(d, 1)) if (S.isWorkDay(d)) n++;
    return n;
  };

  S.earliestDay = function () {
    const keys = Object.keys(S.state.days).sort();
    return keys.length ? keys[0] : null;
  };

  // Pendiente: tiene fecha y no está perdido (un cliente ganado también puede tener entrega o revisión).
  S.isPending = function (p) { return !!p.nextDate && p.stage !== 'Perdido'; };

  S.dueProspects = function (t) {
    return S.state.prospects
      .filter(x => S.isPending(x) && x.nextDate <= t)
      .sort((a, b) => ((a.nextDate + (a.nextTime || '99:99')) < (b.nextDate + (b.nextTime || '99:99')) ? -1 : 1));
  };

  // Mensajes de WhatsApp que tocan hoy (Blount: se mandan antes del primer bloque de visitas).
  S.messageQueue = function (t) {
    const tomorrow = addDays(t, 1);
    const out = [];
    S.state.prospects.forEach(p => {
      if (p.stage === 'Perdido') return;
      const sent = p.sent || {};
      const created = p.created ? ymd(new Date(p.created)) : '';
      const open = p.stage !== 'Ganado';
      let k = '';
      if (!open) {
        if (p.wonAt && daysBetween(p.wonAt, t) >= 7 && !p.resultsAsked) k = 'resultados';
        else if (p.resultsAsked && !p.refAsked && p.wonAt && daysBetween(p.wonAt, t) >= 7) k = 'pedirRef';
      } else if ((Number(p.noReply) || 0) >= 2 && !sent.descarto) k = 'descarto';
      else if (p.nextDate === tomorrow && p.nextTime && sent.cita !== p.nextDate) k = 'cita';
      else if (p.why === 'dueno' && created === t && !sent.dueno) k = 'dueno';
      else if (p.source === 'Referido' && !(Number(p.msgs) > 0)) k = 'referido';
      else if (created && daysBetween(created, t) === 1 && !(Number(p.msgs) > 0) && p.stage !== 'Por visitar') k = 'seg24';
      if (k) out.push({ p: p, k: k });
    });
    const order = ['cita', 'dueno', 'seg24', 'referido', 'descarto', 'resultados', 'pedirRef'];
    return out.sort((a, b) => order.indexOf(a.k) - order.indexOf(b.k));
  };

  S.founders = function () {
    return S.state.prospects.filter(p => p.founder).length;
  };

  // Experimento A/B activo (el más reciente corriendo con dos variantes).
  S.activeAB = function () {
    const ex = S.state.experiments.filter(e => e.status === 'Corriendo' && e.a && e.b);
    return ex.length ? ex[ex.length - 1] : null;
  };

  S.abStats = function (id) {
    const r = { A: { days: 0, visits: 0, demos: 0, sales: 0, units: 0 }, B: { days: 0, visits: 0, demos: 0, sales: 0, units: 0 } };
    Object.keys(S.state.days).forEach(d => {
      const x = S.state.days[d];
      if (!x || !x.ab || x.ab.id !== id || !r[x.ab.v]) return;
      const s = S.dayStats(d);
      const o = r[x.ab.v];
      o.days++; o.visits += s.visits; o.demos += s.demos; o.sales += s.sales; o.units += s.units;
    });
    return r;
  };

  // Cifra no redonda (Voss): 800 → 807, 1150 → 1152. Parece calculada, no inventada.
  S.nonRound = function (n) {
    n = Math.round(Number(n) || 0);
    if (n <= 0) return 0;
    if (n % 10 === 0) return n + 7;
    if (n % 5 === 0) return n + 2;
    return n;
  };

  S.findProspect = function (id) {
    return S.state.prospects.find(x => x.id === id) || null;
  };

  S.uid = uid;

  // Teléfono de Ecuador a formato internacional sin "+" (593…)
  S.waNumber = function (phone) {
    let n = String(phone || '').replace(/\D/g, '');
    if (!n) return '';
    if (n.indexOf('593') === 0) return n;
    if (n.length === 10 && n[0] === '0') return '593' + n.slice(1);
    if (n.length === 9 && n[0] === '9') return '593' + n;
    return n;
  };

  S.setPath = function (path, val) {
    const parts = path.split('.');
    let o = S.state;
    for (let i = 0; i < parts.length - 1; i++) {
      const k = parts[i];
      if (o[k] === undefined || o[k] === null || typeof o[k] !== 'object') o[k] = {};
      o = o[k];
    }
    o[parts[parts.length - 1]] = val;
  };

  S.getPath = function (path) {
    return path.split('.').reduce((o, k) => (o == null ? undefined : o[k]), S.state);
  };

  S.dates = { ymd, parseYmd, addDays, daysBetween, dow, validYmd };
  window.STORE = S;
})();

/* Estado, persistencia (localStorage) y cálculos. Sin dependencias. */
'use strict';

(function () {
  const C = window.CONTENT;
  const KEY = 'clyclick_ceo_v1';

  // ---------- Fechas (siempre en hora local, nunca toISOString para evitar desfase UTC) ----------
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

  // ---------- Estado ----------
  function defaultState() {
    const t = ymd();
    return {
      version: 1,
      config: {
        sellerName: '',
        dailyVisitGoal: 15,
        workDays: [1, 2, 3, 4, 5, 6],
        unitPrice: 15,
        unitCost: 0,
        monthlyGoal: 0,
        monthDays: 24,
        packages: JSON.parse(JSON.stringify(C.DEFAULT_PACKAGES)),
        questions: C.QUESTIONS.slice(),
        lastBackup: ''
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
      ui: { tab: 'hoy', pfilter: 'Todos' }
    };
  }

  function load() {
    const d = defaultState();
    let s = null;
    try { s = JSON.parse(localStorage.getItem(KEY) || 'null'); } catch (e) { s = null; }
    if (!s || typeof s !== 'object') return d;
    return normalize(s, d);
  }

  function normalize(s, d) {
    d = d || defaultState();
    const out = Object.assign({}, d, s);
    out.config = Object.assign({}, d.config, s.config || {});
    out.goal = Object.assign({}, d.goal, s.goal || {});
    out.ui = Object.assign({}, d.ui, s.ui || {});
    out.days = (s.days && typeof s.days === 'object') ? s.days : {};
    out.prospects = Array.isArray(s.prospects) ? s.prospects : [];
    out.experiments = Array.isArray(s.experiments) ? s.experiments : [];
    out.reviews = Array.isArray(s.reviews) ? s.reviews : [];
    if (!Array.isArray(out.config.packages) || out.config.packages.length !== 3) {
      out.config.packages = JSON.parse(JSON.stringify(C.DEFAULT_PACKAGES));
    }
    if (!Array.isArray(out.config.workDays)) out.config.workDays = [1, 2, 3, 4, 5, 6];
    if (!Array.isArray(out.config.questions) || !out.config.questions.length) out.config.questions = C.QUESTIONS.slice();
    return out;
  }

  const S = { state: load() };

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
    S.save();
  };

  // ---------- Días ----------
  S.getDay = function (d) {
    const days = S.state.days;
    if (!days[d]) days[d] = {};
    const x = days[d];
    if (typeof x.visits !== 'number') x.visits = 0;
    if (typeof x.demos !== 'number') x.demos = 0;
    if (typeof x.laters !== 'number') x.laters = 0;
    if (!Array.isArray(x.salesLog)) x.salesLog = [];
    if (!Array.isArray(x.rejLog)) x.rejLog = [];
    if (!x.answers || typeof x.answers !== 'object') x.answers = {};
    if (!x.prep || typeof x.prep !== 'object') x.prep = {};
    if (typeof x.note !== 'string') x.note = '';
    return x;
  };

  S.dayStats = function (d) {
    const x = S.state.days[d] || {};
    const sales = x.salesLog || [];
    const rej = x.rejLog || [];
    return {
      visits: x.visits || 0,
      demos: x.demos || 0,
      laters: x.laters || 0,
      sales: sales.length,
      units: sales.reduce((a, s) => a + (Number(s.units) || 0), 0),
      revenue: sales.reduce((a, s) => a + (Number(s.amount) || 0), 0),
      rej: rej.length,
      hours: Number(x.hours) || 0,
      committed: !!x.committed,
      rest: !!x.rest
    };
  };

  // Cada venta, "no", "volver" o demo implica una visita: mantiene los números coherentes.
  S.fixVisits = function (x) {
    const need = Math.max(x.demos || 0, (x.salesLog || []).length + (x.rejLog || []).length + (x.laters || 0));
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

  // Racha: días de trabajo seguidos cumpliendo la meta de visitas. Hoy no rompe la racha si aún no se cumple.
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
    const r = { visits: 0, demos: 0, sales: 0, units: 0, revenue: 0, rej: 0, hours: 0, met: 0, workDays: 0, reasons: {} };
    for (let d = from; d <= to; d = addDays(d, 1)) {
      const s = S.dayStats(d);
      r.visits += s.visits; r.demos += s.demos; r.sales += s.sales; r.units += s.units;
      r.revenue += s.revenue; r.rej += s.rej; r.hours += s.hours;
      if (S.isWorkDay(d)) { r.workDays++; if (S.dayMet(d)) r.met++; }
      const x = S.state.days[d];
      if (x && Array.isArray(x.rejLog)) x.rejLog.forEach(j => { r.reasons[j.reason] = (r.reasons[j.reason] || 0) + 1; });
    }
    return r;
  };

  S.totals = function () {
    const r = { visits: 0, demos: 0, sales: 0, units: 0, revenue: 0, rej: 0, hours: 0 };
    Object.keys(S.state.days).forEach(d => {
      const s = S.dayStats(d);
      r.visits += s.visits; r.demos += s.demos; r.sales += s.sales;
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

  S.uid = function () {
    return Date.now().toString(36) + Math.random().toString(36).slice(2, 7);
  };

  // Teléfono de Ecuador a formato wa.me (593…)
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

  S.dates = { ymd, parseYmd, addDays, daysBetween, dow };
  window.STORE = S;
})();

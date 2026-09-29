/* Controlador: navegación, eventos, modales, respaldo. */
'use strict';

(function () {
  const C = window.CONTENT;
  const S = window.STORE;
  const V = window.VIEWS;
  const U = window.U;
  const D = S.dates;
  const esc = U.esc, money = U.money;

  const $app = document.getElementById('app');
  const $modal = document.getElementById('modal');
  const $body = document.getElementById('modal-body');
  const $toast = document.getElementById('toast');
  let tipOffset = 0;
  let toastTimer = null;
  let modalCtx = {};

  const TABS = ['hoy', 'calle', 'prospectos', 'pruebas', 'semana', 'meta'];

  function persist() {
    if (!S.save()) toast('⚠ No se pudo guardar. Revisa el espacio del navegador.');
  }

  function toast(msg) {
    $toast.textContent = msg;
    $toast.classList.remove('hidden');
    clearTimeout(toastTimer);
    toastTimer = setTimeout(() => $toast.classList.add('hidden'), 2600);
  }

  function render() {
    const tab = TABS.indexOf(S.state.ui.tab) === -1 ? 'hoy' : S.state.ui.tab;
    document.getElementById('top-date').textContent =
      new Date().toLocaleDateString('es-EC', { weekday: 'long', day: 'numeric', month: 'long' });
    let html = '';
    if (tab === 'hoy') html = V.hoy(tipOffset);
    else if (tab === 'calle') html = V.calle();
    else if (tab === 'prospectos') html = V.prospectos();
    else if (tab === 'pruebas') html = V.pruebas();
    else if (tab === 'semana') html = V.semana();
    else html = V.meta();
    $app.innerHTML = html;
    document.querySelectorAll('.tabs button').forEach(b => b.classList.toggle('on', b.dataset.tab === tab));
  }

  function goTab(tab) {
    S.state.ui.tab = tab;
    persist();
    render();
    window.scrollTo(0, 0);
  }

  function openModal(html, ctx) {
    modalCtx = ctx || {};
    $body.innerHTML = html;
    $modal.classList.remove('hidden');
    $body.scrollTop = 0;
  }
  function closeModal() {
    $modal.classList.add('hidden');
    $body.innerHTML = '';
    modalCtx = {};
  }

  function val(id) {
    const el = document.getElementById(id);
    return el ? el.value.trim() : '';
  }

  // ---------- Ventas / "no" ----------
  function openSale() {
    const pk = S.state.config.packages;
    let h = '<h2>💰 Registrar venta</h2><p class="mut">¿Qué se llevó?</p>';
    pk.forEach((p, i) => {
      h += '<button class="btn block ' + (i === 1 ? '' : 'sec') + '" style="margin-bottom:8px" data-act="sale-pkg" data-i="' + i + '">' +
        esc(p.name) + ' · ' + (Number(p.units) || 0) + ' u · ' + money(p.price) + '</button>';
    });
    h += '<h3>Otra cantidad</h3><div class="grid2"><div><label for="sc-u">Unidades</label><input id="sc-u" type="number" min="1" step="1" inputmode="numeric" value="1"></div>' +
      '<div><label for="sc-a">Total $</label><input id="sc-a" type="number" min="0" step="0.01" inputmode="decimal" value="' + (Number(S.state.config.unitPrice) || 0) + '"></div></div>';
    h += '<button class="btn ok block mt" data-act="sale-custom">Guardar venta</button>';
    h += '<button class="btn ghost block mt" data-act="modal-close">Cancelar</button>';
    openModal(h);
  }

  function addSale(units, amount, pkg) {
    if (!(units > 0)) { toast('Pon al menos 1 unidad'); return; }
    const d = S.getDay(D.ymd());
    d.salesLog.push({ units: units, amount: amount, pkg: pkg || '', at: Date.now() });
    const bumped = S.fixVisits(d);
    persist();
    render();
    openModal(
      '<h2>🎉 Venta registrada</h2><p><b>' + units + '</b> hablador(es) · <b>' + money(amount) + '</b>' + (bumped ? '<br><span class="mut small">Sumé la visita automáticamente.</span>' : '') + '</p>' +
      '<p class="mut">' + '<span class="law">Ley 13 · Regla pico-final</span><br>Termina bien: agradece y pregunta cómo maneja sus pedidos, citas o reservas. Ahí puede estar tu próximo cliente de software.</p>' +
      '<button class="btn block" data-act="p-new-won" data-u="' + units + '" data-a="' + amount + '">Guardar datos del cliente</button>' +
      '<button class="btn ghost block mt" data-act="modal-close">Ahora no</button>'
    );
  }

  function openNo() {
    let h = '<h2>✋ Me dijo que no</h2><p class="mut"><span class="law">Ley 21</span><br>No es un fracaso: es un dato. ¿Cuál fue la razón principal?</p><div class="chips">';
    C.REASONS.forEach(r => { h += '<button class="chip" data-act="no-reason" data-r="' + esc(r) + '">' + esc(r) + '</button>'; });
    h += '</div><button class="btn ghost block mt" data-act="modal-close">Cancelar</button>';
    openModal(h);
  }

  // ---------- Prospectos ----------
  function openProspect(p, src) {
    p = p || {};
    const isNew = !p.id;
    const opt = (list, cur) => list.map(x => '<option' + (x === cur ? ' selected' : '') + '>' + esc(x) + '</option>').join('');
    let h = '<h2>' + (isNew ? 'Nuevo registro' : 'Editar') + '</h2>';
    h += '<label for="pf-name">Negocio *</label><input id="pf-name" value="' + esc(p.name || '') + '" placeholder="Ej. Cafetería La Esquina">';
    h += '<label for="pf-rubro">Rubro</label><select id="pf-rubro"><option value="">—</option>' + opt(C.RUBROS, p.rubro) + '</select>';
    h += '<div id="pf-hint" class="mut small"></div>';
    h += '<div class="grid2"><div><label for="pf-contact">Persona de contacto</label><input id="pf-contact" value="' + esc(p.contact || '') + '"></div>' +
      '<div><label for="pf-phone">WhatsApp / teléfono</label><input id="pf-phone" type="tel" inputmode="tel" value="' + esc(p.phone || '') + '" placeholder="09XXXXXXXX"></div></div>';
    h += '<label for="pf-zone">Dirección / zona</label><input id="pf-zone" value="' + esc(p.zone || '') + '">';
    h += '<label for="pf-stage">Etapa</label><select id="pf-stage">' + opt(C.STAGES, p.stage || 'Visitado') + '</select>';
    h += '<div class="grid2"><div><label for="pf-next">Próxima acción</label><input id="pf-next" value="' + esc(p.nextAction || '') + '" placeholder="Ej. Volver a las 15:00"></div>' +
      '<div><label for="pf-date">Fecha</label><input id="pf-date" type="date" value="' + esc(p.nextDate || '') + '"></div></div>';
    h += '<div class="grid2"><div><label for="pf-units">Habladores comprados</label><input id="pf-units" type="number" min="0" inputmode="numeric" value="' + esc(p.units || '') + '"></div>' +
      '<div><label for="pf-amount">Monto $</label><input id="pf-amount" type="number" min="0" step="0.01" inputmode="decimal" value="' + esc(p.amount || '') + '"></div></div>';
    h += '<label for="pf-soft">¿Interés en tu software? (Ley 26)</label><select id="pf-soft">' + opt(['No', 'Tal vez', 'Sí'], p.software || 'No') + '</select>';
    h += '<label for="pf-softwhich">¿Cuál?</label><select id="pf-softwhich"><option value="">—</option>' + opt(C.SOFTS, p.softWhich) + '</select>';
    h += '<label for="pf-pre">Pre-mortem: ¿por qué se podría caer esta venta? (Ley 25)</label><input id="pf-pre" value="' + esc(p.premortem || '') + '" placeholder="Ej. El dueño casi nunca está">';
    h += '<label for="pf-notes">Notas</label><textarea id="pf-notes">' + esc(p.notes || '') + '</textarea>';
    h += '<button class="btn ok block mt" data-act="p-save">Guardar</button>';
    if (!isNew) h += '<button class="btn bad block mt" data-act="p-delete">Eliminar</button>';
    h += '<button class="btn ghost block mt" data-act="modal-close">Cancelar</button>';
    openModal(h, { id: p.id || null, src: src || '', created: p.created || null });
    updateRubroHint();
  }

  function updateRubroHint() {
    const r = document.getElementById('pf-rubro');
    const hint = document.getElementById('pf-hint');
    if (!r || !hint) return;
    const soft = C.RUBRO_SOFT[r.value];
    hint.textContent = soft ? '💡 Tienes software para este rubro: ' + soft + '. Pregunta cómo maneja pedidos, citas o ventas.' : '';
    const sw = document.getElementById('pf-softwhich');
    if (soft && sw && !sw.value) sw.value = soft;
  }

  function saveProspect() {
    const name = val('pf-name');
    if (!name) { toast('Escribe el nombre del negocio'); return; }
    const now = Date.now();
    const rec = {
      id: modalCtx.id || S.uid(),
      name: name,
      rubro: val('pf-rubro'),
      contact: val('pf-contact'),
      phone: val('pf-phone'),
      zone: val('pf-zone'),
      stage: val('pf-stage') || 'Visitado',
      nextAction: val('pf-next'),
      nextDate: val('pf-date'),
      units: Number(val('pf-units')) || 0,
      amount: Number(val('pf-amount')) || 0,
      software: val('pf-soft') || 'No',
      softWhich: val('pf-softwhich'),
      premortem: val('pf-pre'),
      notes: val('pf-notes'),
      created: modalCtx.created || now,
      updated: now
    };
    const i = S.state.prospects.findIndex(x => x.id === rec.id);
    if (i === -1) S.state.prospects.push(rec); else S.state.prospects[i] = rec;
    let bumped = false;
    if (modalCtx.src === 'later') {
      const d = S.getDay(D.ymd());
      d.laters += 1;
      bumped = S.fixVisits(d);
    }
    persist();
    closeModal();
    render();
    toast(modalCtx.src === 'later' || rec.nextDate ? 'Guardado. Te aparecerá en Hoy el ' + U.fmtDate(rec.nextDate) + (bumped ? ' · visita sumada' : '') : 'Guardado');
  }

  // ---------- Experimentos ----------
  function openExp(e) {
    e = e || {};
    const isNew = !e.id;
    const opt = (list, cur) => list.map(x => '<option' + (x === cur ? ' selected' : '') + '>' + esc(x) + '</option>').join('');
    let h = '<h2>' + (isNew ? 'Nuevo experimento' : 'Experimento') + '</h2><p class="mut"><span class="law">Ley 21</span><br>Una sola cosa a la vez, por al menos una semana o 20 visitas.</p>';
    h += '<label for="ef-title">Qué pruebo *</label><input id="ef-title" value="' + esc(e.title || '') + '">';
    h += '<label for="ef-hyp">Hipótesis: si hago X, entonces Y sube</label><textarea id="ef-hyp">' + esc(e.hypothesis || '') + '</textarea>';
    h += '<div class="grid2"><div><label for="ef-metric">Métrica</label><input id="ef-metric" value="' + esc(e.metric || '') + '"></div>' +
      '<div><label for="ef-start">Inicio</label><input id="ef-start" type="date" value="' + esc(e.start || D.ymd()) + '"></div></div>';
    h += '<label for="ef-status">Estado</label><select id="ef-status">' + opt(['Corriendo', 'Funcionó', 'No funcionó'], e.status || 'Corriendo') + '</select>';
    h += '<label for="ef-result">Resultado / aprendizaje</label><textarea id="ef-result" placeholder="Qué pasó con la métrica y qué haces ahora">' + esc(e.result || '') + '</textarea>';
    h += '<button class="btn ok block mt" data-act="exp-save">Guardar</button>';
    if (!isNew) h += '<button class="btn bad block mt" data-act="exp-delete">Eliminar</button>';
    h += '<button class="btn ghost block mt" data-act="modal-close">Cancelar</button>';
    openModal(h, { id: e.id || null });
  }

  function saveExp() {
    const title = val('ef-title');
    if (!title) { toast('Escribe qué vas a probar'); return; }
    const rec = {
      id: modalCtx.id || S.uid(),
      title: title,
      hypothesis: val('ef-hyp'),
      metric: val('ef-metric'),
      start: val('ef-start'),
      status: val('ef-status') || 'Corriendo',
      result: val('ef-result')
    };
    const i = S.state.experiments.findIndex(x => x.id === rec.id);
    if (i === -1) S.state.experiments.push(rec); else S.state.experiments[i] = rec;
    persist();
    closeModal();
    render();
    toast(rec.status === 'Corriendo' ? 'Experimento en marcha' : 'Guardado. Fracaso = información (Ley 21)');
  }

  // ---------- Respaldo ----------
  function backupJson() { return JSON.stringify(S.state, null, 2); }

  function markBackup() {
    S.state.config.lastBackup = D.ymd();
    persist();
  }

  function exportFile() {
    try {
      const blob = new Blob([backupJson()], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = 'clyclick-respaldo-' + D.ymd() + '.json';
      document.body.appendChild(a);
      a.click();
      setTimeout(() => { URL.revokeObjectURL(url); a.remove(); }, 1000);
      markBackup();
      render();
      toast('Respaldo descargado');
    } catch (e) {
      toast('No se pudo descargar. Usa "Copiar respaldo".');
    }
  }

  function copyBackup() {
    const txt = backupJson();
    const done = () => { markBackup(); render(); toast('Respaldo copiado. Pégalo en un chat contigo mismo o en tus notas.'); };
    if (navigator.clipboard && navigator.clipboard.writeText) {
      navigator.clipboard.writeText(txt).then(done, () => toast('No se pudo copiar'));
    } else {
      const ta = document.createElement('textarea');
      ta.value = txt; document.body.appendChild(ta); ta.select();
      try { document.execCommand('copy'); done(); } catch (e) { toast('No se pudo copiar'); }
      ta.remove();
    }
  }

  function importFile(file) {
    const r = new FileReader();
    r.onload = function () {
      let data;
      try { data = JSON.parse(String(r.result)); } catch (e) { toast('El archivo no es un respaldo válido'); return; }
      if (!data || typeof data !== 'object' || !data.config || !data.days) { toast('El archivo no es un respaldo de esta app'); return; }
      if (!confirm('¿Reemplazar los datos actuales por los del respaldo?')) return;
      S.replace(data);
      render();
      toast('Respaldo restaurado');
    };
    r.readAsText(file);
  }

  // ---------- Eventos ----------
  document.addEventListener('click', function (e) {
    const el = e.target.closest('[data-act]');
    if (!el) return;
    const act = el.dataset.act;
    const t = D.ymd();

    if (act === 'modal-bg') { if (e.target === $modal) closeModal(); return; }

    switch (act) {
      case 'tab': goTab(el.dataset.tab); break;
      case 'tip-next': tipOffset++; render(); break;
      case 'commit': {
        const d = S.getDay(t); d.committed = true; d.rest = false; persist(); render();
        toast('Compromiso hecho. Ahora cúmplelo (Ley 7)');
        break;
      }
      case 'rest': { const d = S.getDay(t); d.rest = true; d.committed = false; persist(); render(); break; }
      case 'unrest': { const d = S.getDay(t); d.rest = false; persist(); render(); break; }
      case 'inc': {
        const d = S.getDay(t); const k = el.dataset.k;
        d[k] = (d[k] || 0) + 1;
        const bumped = S.fixVisits(d);
        persist(); render();
        if (bumped) toast('Sumé la visita automáticamente');
        else if (k === 'visits' && d.visits === Number(S.state.config.dailyVisitGoal)) toast('✅ ¡Meta de visitas cumplida!');
        break;
      }
      case 'dec': {
        const d = S.getDay(t); const k = el.dataset.k;
        const min = k === 'visits'
          ? Math.max(d.demos, d.salesLog.length + d.rejLog.length + d.laters)
          : 0;
        if ((d[k] || 0) > min) { d[k] -= 1; persist(); render(); }
        else if (k === 'visits' && d.visits > 0) toast('Primero deshaz la demo, venta o "no" de esa visita');
        break;
      }
      case 'sale': openSale(); break;
      case 'sale-pkg': {
        const p = S.state.config.packages[Number(el.dataset.i)];
        addSale(Number(p.units) || 0, Number(p.price) || 0, p.name);
        break;
      }
      case 'sale-custom': {
        const u = Math.floor(Number(val('sc-u')));
        const a = Number(val('sc-a'));
        if (!(a >= 0)) { toast('Monto inválido'); break; }
        addSale(u, a, 'Personalizado');
        break;
      }
      case 'undo-sale': {
        const d = S.getDay(t);
        const last = d.salesLog[d.salesLog.length - 1];
        if (last && confirm('¿Deshacer la última venta (' + last.units + ' u · ' + money(last.amount) + ')?')) {
          d.salesLog.pop(); persist(); render();
        }
        break;
      }
      case 'no': openNo(); break;
      case 'no-reason': {
        const d = S.getDay(t);
        d.rejLog.push({ reason: el.dataset.r, at: Date.now() });
        const bumped = S.fixVisits(d);
        persist(); closeModal(); render();
        toast('Anotado: ' + el.dataset.r + (bumped ? ' · visita sumada' : '') + '. A la siguiente 💪');
        break;
      }
      case 'undo-no': {
        const d = S.getDay(t);
        const last = d.rejLog[d.rejLog.length - 1];
        if (last && confirm('¿Deshacer el último "no" (' + last.reason + ')?')) { d.rejLog.pop(); persist(); render(); }
        break;
      }
      case 'later':
        openProspect({ stage: 'Seguimiento', nextAction: 'Volver a visitar', nextDate: D.addDays(t, 1) }, 'later');
        break;
      case 'ans': {
        const d = S.getDay(t);
        const q = S.state.config.questions[Number(el.dataset.i)];
        const v = el.dataset.v === '1';
        if (d.answers[q] === v) delete d.answers[q]; else d.answers[q] = v;
        persist(); render();
        break;
      }
      case 'prep': {
        const d = S.getDay(t); const i = el.dataset.i;
        d.prep[i] = !d.prep[i]; persist(); render();
        break;
      }
      case 'p-new': openProspect({ stage: 'Por visitar' }); break;
      case 'p-new-won':
        openProspect({ stage: 'Ganado', units: Number(el.dataset.u) || 0, amount: Number(el.dataset.a) || 0 }, 'won');
        break;
      case 'p-edit': {
        const p = S.state.prospects.find(x => x.id === el.dataset.id);
        if (p) openProspect(p);
        break;
      }
      case 'p-save': saveProspect(); break;
      case 'p-delete':
        if (modalCtx.id && confirm('¿Eliminar este registro?')) {
          S.state.prospects = S.state.prospects.filter(x => x.id !== modalCtx.id);
          persist(); closeModal(); render();
        }
        break;
      case 'pfilter': S.state.ui.pfilter = el.dataset.s; persist(); render(); break;
      case 'exp-new': openExp(); break;
      case 'exp-idea': {
        const idea = C.EXP_IDEAS[Number(el.dataset.i)];
        openExp({ title: idea.title, hypothesis: idea.hypothesis, metric: idea.metric });
        break;
      }
      case 'exp-edit': {
        const x = S.state.experiments.find(y => y.id === el.dataset.id);
        if (x) openExp(x);
        break;
      }
      case 'exp-save': saveExp(); break;
      case 'exp-delete':
        if (modalCtx.id && confirm('¿Eliminar este experimento?')) {
          S.state.experiments = S.state.experiments.filter(x => x.id !== modalCtx.id);
          persist(); closeModal(); render();
        }
        break;
      case 'review-save': {
        const rec = { id: S.uid(), date: t };
        let any = false;
        C.REVIEW_FIELDS.forEach(f => { rec[f[0]] = val('rv-' + f[0]); if (rec[f[0]]) any = true; });
        if (!any) { toast('Escribe al menos una respuesta'); break; }
        const st = S.rangeStats(D.addDays(t, -6), t);
        rec.stats = { visits: st.visits, sales: st.sales, units: st.units, revenue: st.revenue };
        S.state.reviews.push(rec);
        persist(); render(); window.scrollTo(0, 0);
        toast('Revisión guardada. Aplica tu mejora del 1% (Ley 19)');
        break;
      }
      case 'review-del':
        if (confirm('¿Eliminar esta revisión?')) {
          S.state.reviews = S.state.reviews.filter(x => x.id !== el.dataset.id);
          persist(); render();
        }
        break;
      case 'dow': {
        const d = Number(el.dataset.d);
        const wd = S.state.config.workDays;
        const i = wd.indexOf(d);
        if (i === -1) wd.push(d); else if (wd.length > 1) wd.splice(i, 1);
        persist(); render();
        break;
      }
      case 'export': exportFile(); break;
      case 'copy': copyBackup(); break;
      case 'reset':
        if (confirm('¿Borrar TODOS los datos? Esto no se puede deshacer.') && confirm('¿Seguro? Descarga un respaldo antes si lo necesitas.')) {
          S.reset(); S.state.ui.tab = 'meta'; persist(); render(); toast('Datos borrados');
        }
        break;
      case 'modal-close': closeModal(); break;
    }
  });

  document.addEventListener('input', function (e) {
    const el = e.target;
    if (el.id === 'p-search') {
      document.getElementById('p-list').innerHTML = V.prospectList(el.value);
      return;
    }
    if (el.id === 'cfg-questions') {
      const qs = el.value.split('\n').map(s => s.trim()).filter(Boolean);
      if (qs.length) { S.state.config.questions = qs; persist(); }
      return;
    }
    if (!el.dataset.bind) return;
    let v = el.value;
    if (el.dataset.type === 'num') v = v === '' ? 0 : Number(v);
    if (el.dataset.type === 'num' && !isFinite(v)) return;
    S.setPath(el.dataset.bind, v);
    persist();
    if (el.dataset.after === 'meta') {
      const lbl = document.getElementById('lv-' + el.dataset.bind.replace(/\./g, '-'));
      if (lbl) lbl.textContent = v;
      const g = document.getElementById('meta-goal'); if (g) g.innerHTML = V.metaGoalBox();
      const q = document.getElementById('meta-eq'); if (q) q.innerHTML = V.metaEqBox();
      const c = document.getElementById('meta-calc'); if (c) c.innerHTML = V.metaCalcBox();
    }
  });

  document.addEventListener('change', function (e) {
    const el = e.target;
    if (el.id === 'pf-rubro') updateRubroHint();
    if (el.id === 'imp' && el.files && el.files[0]) { importFile(el.files[0]); el.value = ''; }
    // Recalcula la vista de Hoy (por hora) al terminar de escribir horas.
    if (el.id === 'hours' && S.state.ui.tab === 'hoy') render();
  });

  document.addEventListener('visibilitychange', function () {
    if (document.visibilityState === 'visible' && $modal.classList.contains('hidden')) {
      const a = document.activeElement;
      if (!a || (a.tagName !== 'INPUT' && a.tagName !== 'TEXTAREA')) render();
    }
  });

  if (navigator.storage && navigator.storage.persist) {
    navigator.storage.persist().catch(function () {});
  }

  render();
})();

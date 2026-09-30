/* Controlador: navegación, hojas inferiores, deshacer, eventos y funciones nativas. */
'use strict';

(function () {
  const C = window.CONTENT;
  const S = window.STORE;
  const N = window.NATIVE;
  const U = window.U;
  const V = window.VIEWS;
  const SH = window.SHEETS;
  const D = S.dates;
  const money = U.money, icon = U.icon;

  const $app = document.getElementById('app');
  const $sheetRoot = document.getElementById('sheet-root');
  const $snack = document.getElementById('snack-root');
  let $dock = null;
  let $tabbar = null;

  let tipOffset = 0;
  let query = '';
  let sheet = null;          // { el, ctx, locked }
  let sheetUrls = [];        // object URLs a liberar al cerrar la hoja
  let lastSnap = null;       // copia para "Deshacer"
  let snackTimer = null;
  let quoteBlob = null;
  let quoteUrl = null;
  let quoteTimer = null;
  let obDraft = null;
  let geoBusy = false;
  let locating = false;
  let viewer = null;         // { el, id, pid, blob, url }
  let lastTab = null;
  let cercaTried = false;    // un intento automático de ubicación en Calle › Cerca

  // Próxima acción sugerida según el motivo de "Volver" (solo si el campo sigue con un valor por defecto).
  const WHY_NEXT = {
    dueno: 'Hablar con el dueño (mandarle su perfil esta noche)',
    consultar: 'Mostrárselo a los que deciden',
    pensar: 'Preguntar: ¿qué tendría que ver para decidirse?',
    cita: 'Cita para cerrar'
  };

  const TAB_DEF = [
    ['hoy', 'home', 'Hoy'], ['calle', 'pin', 'Calle'], ['clientes', 'users', 'Clientes'],
    ['progreso', 'chart', 'Progreso'], ['meta', 'target', 'Meta']
  ];

  function persist() {
    if (!S.save()) snack('No se pudo guardar. Revisa el espacio del iPhone.');
  }
  function $(id) { return document.getElementById(id); }
  function val(id) { const el = $(id); return el ? String(el.value).trim() : ''; }
  function today() { return D.ymd(); }
  function clamp(v, a, b) { return Math.max(a, Math.min(b, v)); }

  // ---------- Estructura fija: dock y tab bar ----------
  function buildChrome() {
    const dock = document.createElement('div');
    dock.className = 'dock hidden';
    dock.id = 'dock';
    dock.innerHTML = '<div class="dock-in">' +
      '<button class="dk visit" data-act="dock-visit" aria-label="Sumar visita">' + icon('store', 24, 2) + '<span>Visita</span><span class="cnt" id="cnt-visits">0</span></button>' +
      '<button class="dk owner" data-act="dock-owner" aria-label="Hablé con el dueño">' + icon('person', 24, 2) + '<span>Dueño</span><span class="cnt" id="cnt-owners">0</span></button>' +
      '<button class="dk demo" data-act="dock-demo" aria-label="Sumar demo">' + icon('tap', 24, 2) + '<span>Demo</span><span class="cnt" id="cnt-demos">0</span></button>' +
      '<button class="dk sale" data-act="dock-sale" aria-label="Registrar venta">' + icon('cash', 24, 2) + '<span>Venta</span></button>' +
      '<button class="dk no" data-act="dock-no" aria-label="Registrar no">' + icon('noCircle', 24, 2) + '<span>No</span></button>' +
      '<button class="dk later" data-act="dock-later" aria-label="Volver luego">' + icon('again', 24, 2) + '<span>Volver</span></button>' +
      '</div>';
    document.body.appendChild(dock);
    $dock = dock;

    const tb = document.createElement('nav');
    tb.className = 'tabbar';
    tb.setAttribute('aria-label', 'Secciones');
    tb.innerHTML = '<div class="tabbar-in">' + TAB_DEF.map(t =>
      '<button class="tab" data-act="tab" data-tab="' + t[0] + '">' + icon(t[1], 26, 1.8) + '<span>' + t[2] + '</span></button>'
    ).join('') + '</div>';
    document.body.appendChild(tb);
    $tabbar = tb;
  }

  function updateChrome() {
    const tab = S.state.ui.tab;
    const st = S.dayStats(today());
    $dock.classList.toggle('hidden', tab !== 'hoy');
    document.body.classList.toggle('has-dock', tab === 'hoy');
    $('cnt-visits').textContent = st.visits;
    $('cnt-demos').textContent = st.demos;
    $('cnt-owners').textContent = st.owners;
    const due = S.dueProspects(today()).length;
    $tabbar.querySelectorAll('.tab').forEach(b => {
      const on = b.dataset.tab === tab;
      b.classList.toggle('on', on);
      b.setAttribute('aria-current', on ? 'page' : 'false');
      const old = b.querySelector('.dot');
      if (old) old.remove();
      if (b.dataset.tab === 'clientes' && due > 0) {
        const dot = document.createElement('span');
        dot.className = 'dot';
        dot.textContent = due > 9 ? '9+' : String(due);
        b.appendChild(dot);
      }
    });
  }

  // ---------- Render ----------
  function render() {
    const tab = S.TABS.indexOf(S.state.ui.tab) === -1 ? 'hoy' : S.state.ui.tab;
    S.state.ui.tab = tab;
    let html;
    if (tab === 'hoy') html = V.hoy(tipOffset);
    else if (tab === 'calle') html = V.calle();
    else if (tab === 'clientes') html = V.clientes(query);
    else if (tab === 'progreso') html = V.progreso();
    else html = V.meta();
    $app.innerHTML = html;
    if (tab !== lastTab && $app.firstElementChild) $app.firstElementChild.classList.add('enter');
    lastTab = tab;
    updateChrome();
    onScroll();
    if (tab === 'calle' && $('carousel')) bindCarousel();
    if (tab === 'clientes' && S.state.ui.psort === 'cerca' && !N.lastPos) locate();
    if (tab === 'calle' && S.state.ui.calleSeg === 'cerca' && !N.lastPos && !cercaTried) { cercaTried = true; locate(); }
  }

  function goTab(tab) {
    if (S.state.ui.tab === tab) { window.scrollTo({ top: 0, behavior: 'smooth' }); return; }
    S.state.ui.tab = tab;
    persist();
    render();
    window.scrollTo(0, 0);
  }

  let scrollRaf = 0;
  function onScroll() {
    if (scrollRaf) return;
    scrollRaf = requestAnimationFrame(function () {
      scrollRaf = 0;
      document.body.classList.toggle('scrolled', window.scrollY > 34);
    });
  }

  function bindCarousel() {
    const car = $('carousel');
    const dots = $('dots') ? $('dots').children : [];
    car.addEventListener('scroll', function () {
      const slide = car.querySelector('.slide');
      if (!slide) return;
      const w = slide.getBoundingClientRect().width + 12;
      const i = clamp(Math.round(car.scrollLeft / w), 0, dots.length - 1);
      for (let k = 0; k < dots.length; k++) dots[k].classList.toggle('on', k === i);
    }, { passive: true });
  }

  // ---------- Snackbar con Deshacer ----------
  function snack(text, opts) {
    opts = opts || {};
    clearTimeout(snackTimer);
    lastSnap = opts.undo || null;
    $snack.innerHTML = '<div class="snack" role="status"><div class="txt"></div>' + (opts.undo ? '<button class="sa" data-act="undo-last">Deshacer</button>' : '') + '</div>';
    $snack.querySelector('.txt').textContent = text;
    snackTimer = setTimeout(hideSnack, opts.undo ? 6000 : 3200);
  }
  function hideSnack() {
    clearTimeout(snackTimer);
    $snack.innerHTML = '';
    lastSnap = null;
  }

  function undoLast() {
    if (!lastSnap) return;
    const snap = lastSnap;
    hideSnack();
    S.restore(snap);
    if (sheet && sheet.ctx.kind === 'dayEdit') refreshSheet(SH.dayEdit(sheet.ctx.date));
    else if (sheet && sheet.ctx.kind === 'detail') {
      const p = S.findProspect(sheet.ctx.id);
      if (p) { refreshSheet(SH.prospectDetail(p)); loadPhotos(p.id); } else closeSheet();
    } else if (sheet && sheet.ctx.kind === 'messages') {
      const p = S.findProspect(sheet.ctx.id);
      if (p) refreshSheet(SH.messages(p, sheet.ctx.k, sheet.ctx.fromDetail)); else closeSheet();
    } else closeSheet();
    render();
    snack('Deshecho');
  }

  // ---------- Hojas inferiores ----------
  function sheetHtml(def) {
    return '<div class="sheet-top">' + (def.locked ? '<div style="height:11px"></div>' : '<div class="grabber"></div>') +
      '<div class="sheet-head"><div class="l">' + (def.left || '') + '</div><div class="ttl">' + U.esc(def.title || '') + '</div><div class="r">' + (def.right || '') + '</div></div></div>' +
      '<div class="sheet-body">' + def.body + '</div>';
  }

  function openSheet(def, ctx) {
    closeSheetNow();
    const wrap = document.createElement('div');
    wrap.className = 'sheet-wrap';
    wrap.innerHTML = '<div class="sheet-bg" data-act="sheet-bg"></div><div class="sheet' + (def.cls ? ' ' + def.cls : '') + '" role="dialog" aria-modal="true">' + sheetHtml(def) + '</div>';
    $sheetRoot.appendChild(wrap);
    sheet = { el: wrap, ctx: ctx || {}, locked: !!def.locked };
    document.body.classList.add('lock');
    document.body.classList.remove('kb');
    if (!def.locked) bindDrag(wrap);
  }

  function refreshSheet(def) {
    if (!sheet) return;
    const body = sheet.el.querySelector('.sheet-body');
    const top = body ? body.scrollTop : 0;
    sheet.el.querySelector('.sheet').innerHTML = sheetHtml(def);
    const nb = sheet.el.querySelector('.sheet-body');
    if (nb) nb.scrollTop = top;
  }

  function releaseUrls() {
    sheetUrls.forEach(u => URL.revokeObjectURL(u));
    sheetUrls = [];
    if (quoteUrl) { URL.revokeObjectURL(quoteUrl); quoteUrl = null; }
    quoteBlob = null;
  }

  function closeSheetNow() {
    if (!sheet) return;
    sheet.el.remove();
    sheet = null;
    releaseUrls();
    document.body.classList.remove('lock');
  }

  function closeSheet() {
    if (!sheet) return;
    const s = sheet;
    sheet = null;
    const sh = s.el.querySelector('.sheet');
    s.el.classList.add('closing');
    if (sh) { sh.style.transform = ''; sh.classList.add('closing'); }
    releaseUrls();
    document.body.classList.remove('lock');
    setTimeout(function () { s.el.remove(); }, 220);
  }

  // Deslizar hacia abajo desde la parte superior para cerrar.
  function bindDrag(wrap) {
    const top = wrap.querySelector('.sheet-top');
    const sh = wrap.querySelector('.sheet');
    let y0 = null, dy = 0, pid = null;
    top.addEventListener('pointerdown', function (e) {
      if (e.target.closest('button, a, input, select, textarea, label')) return;
      y0 = e.clientY; dy = 0; pid = e.pointerId;
      try { top.setPointerCapture(pid); } catch (err) { /* sin captura */ }
      sh.style.transition = 'none';
    });
    top.addEventListener('pointermove', function (e) {
      if (y0 === null || e.pointerId !== pid) return;
      dy = Math.max(0, e.clientY - y0);
      sh.style.transform = 'translateY(' + dy + 'px)';
    });
    function end() {
      if (y0 === null) return;
      y0 = null;
      sh.style.transition = 'transform .2s ease-out';
      if (dy > 90) { closeSheet(); } else { sh.style.transform = ''; }
    }
    top.addEventListener('pointerup', end);
    top.addEventListener('pointercancel', end);
  }

  // ---------- Ventas ----------
  function asiOn() { const x = $('asi-sw'); return !!(x && x.checked); }

  function addSale(units, amount, pkg) {
    if (!(units > 0)) { snack('Pon al menos 1 unidad'); return; }
    if (!(amount >= 0)) { snack('Monto inválido'); return; }
    const asi = asiOn();
    const snap = S.snapshot();
    const d = S.getDay(today());
    d.salesLog.push({ units: units, amount: amount, pkg: pkg || '', asi: asi, at: Date.now() });
    const bumped = S.fixVisits(d);
    persist();
    render();
    openSheet(SH.saleDone(units, amount, bumped), { kind: 'saleDone' });
    hideSnack();
    lastSnap = snap; // "Deshacer venta" en la hoja de confirmación
  }

  // ---------- Clientes ----------
  function openProspectForm(p, src, from) {
    openSheet(SH.prospectForm(p, src), { kind: 'form', id: p.id || null, src: src || '', from: from || '' });
    updateRubroHint();
    updateWhyHint(false);
    if (!p.id && (src === 'later' || src === 'won')) fillGeo(false);
  }

  function updateRubroHint() {
    const r = $('pf-rubro');
    const hint = $('pf-hint');
    const wrap = $('pf-hint-wrap');
    if (!r || !hint || !wrap) return;
    const soft = C.RUBRO_SOFT[r.value];
    hint.textContent = soft ? 'Tienes software para este rubro: ' + soft + '. Pregunta cómo maneja pedidos, citas o ventas (Ley 26).' : '';
    wrap.style.display = soft ? '' : 'none';
    const sw = $('pf-softwhich');
    if (soft && sw && !sw.value) sw.value = soft;
  }

  // Voss · detector de "sí" falso: marca el chip, muestra la pista y ajusta etiquetas.
  function updateWhyHint(touchNext) {
    const inpEl = $('pf-why');
    if (!inpEl) return;
    const k = inpEl.value;
    const w = C.VOLVER_WHY.find(x => x.k === k);
    document.querySelectorAll('[data-act="pf-why"]').forEach(b => b.classList.toggle('on', b.dataset.k === k));
    const wrap = $('pf-why-wrap'), hint = $('pf-why-hint');
    if (wrap && hint) { hint.textContent = w ? w.hint : ''; wrap.style.display = w ? '' : 'none'; }
    const lbl = $('pf-contact-lbl');
    if (lbl) lbl.textContent = k === 'dueno' ? 'Nombre del dueño' : 'Persona de contacto';
    if (touchNext) {
      const nx = $('pf-next');
      const defaults = ['', 'Volver a visitar'].concat(Object.keys(WHY_NEXT).map(x => WHY_NEXT[x]));
      if (nx && defaults.indexOf(nx.value.trim()) !== -1) nx.value = WHY_NEXT[k] || 'Volver a visitar';
    }
  }

  function updateOwnerHint() {
    const sl = $('pf-otype'), wrap = $('pf-otype-wrap'), hint = $('pf-otype-hint');
    if (!sl || !wrap || !hint) return;
    const o = C.OWNER_TYPES.find(x => x.k === sl.value);
    hint.textContent = o ? o.tip : '';
    wrap.style.display = o ? '' : 'none';
  }

  function fillGeo(manual) {
    if (geoBusy) return;
    const status = $('pf-geo-status');
    if (!status) return;
    geoBusy = true;
    status.textContent = 'Buscando tu ubicación…';
    N.getPosition().then(function (pos) {
      if (!sheet || sheet.ctx.kind !== 'form' || !$('pf-lat')) return;
      $('pf-lat').value = pos.lat;
      $('pf-lng').value = pos.lng;
      $('pf-acc').value = pos.acc;
      $('pf-geo-status').textContent = 'Ubicación guardada (±' + pos.acc + ' m)';
      const zone = $('pf-zone');
      if (zone && !zone.value.trim()) {
        return N.reverseGeocode(pos.lat, pos.lng).then(function (addr) {
          const z = $('pf-zone');
          if (addr && z && !z.value.trim()) {
            z.value = addr;
            const st = $('pf-geo-status');
            if (st) st.textContent = 'Ubicación y dirección aproximada guardadas (±' + pos.acc + ' m)';
          }
        });
      }
    }).catch(function (err) {
      const st = $('pf-geo-status');
      if (st) st.textContent = manual ? err.message + '. Revisa Ajustes › Privacidad › Localización.' : 'Toca para guardar la ubicación';
    }).then(function () { geoBusy = false; });
  }

  function refreshLocViews() {
    if (S.state.ui.tab === 'clientes' && $('p-list')) $('p-list').innerHTML = V.clientList(query);
    if (S.state.ui.tab === 'calle' && S.state.ui.calleSeg === 'cerca' && !sheet) render();
    if (sheet && sheet.ctx.kind === 'route') refreshSheet(SH.route(sheet.ctx.focus));
  }

  function locate(fresh) {
    if (locating) return;
    locating = true;
    (fresh ? N.getPosition() : N.recentPosition()).then(function () {
      refreshLocViews();
    }).catch(function (err) {
      snack(err.message);
      refreshLocViews();
    }).then(function () { locating = false; });
  }

  function openDetail(p) {
    openSheet(SH.prospectDetail(p), { kind: 'detail', id: p.id });
    loadPhotos(p.id);
  }

  function saveProspect() {
    const ctx = sheet ? sheet.ctx : {};
    const name = val('pf-name');
    if (!name) { snack('Escribe el nombre del negocio'); const n = $('pf-name'); if (n) n.focus(); return; }
    const existing = ctx.id ? S.findProspect(ctx.id) : null;
    const isNew = !existing;
    const later = isNew && ctx.src === 'later';
    const date = val('pf-date');
    const time = val('pf-time');
    const keep = (id, key) => ($(id) ? val(id) : (existing && existing[key] != null ? existing[key] : ''));
    const chk = (id, key) => ($(id) ? !!$(id).checked : !!(existing && existing[key]));
    const why = keep('pf-why', 'why');
    if (later && !why) { snack('Elige por qué vuelves (detector de «sí» falso)'); return; }
    if (later && (!D.validYmd(date) || !time)) {
      snack('Pon día y hora: «cuando quiera» no es una cita (Blount)');
      const f = !D.validYmd(date) ? $('pf-date') : $('pf-time');
      if (f) f.focus();
      return;
    }
    const w = C.VOLVER_WHY.find(x => x.k === why);
    const snap = S.snapshot();
    const now = Date.now();
    const lat = val('pf-lat'), lng = val('pf-lng');
    const stage = val('pf-stage') || 'Visitado';
    const post = {};
    C.POST_Q.forEach(q => { post[q[0]] = $('pf-post-' + q[0]) ? val('pf-post-' + q[0]) : ((existing && existing.post && existing.post[q[0]]) || ''); });
    const rec = Object.assign({}, existing || {}, {
      id: existing ? existing.id : S.uid(),
      name: name,
      rubro: val('pf-rubro'),
      contact: val('pf-contact'),
      phone: val('pf-phone'),
      zone: val('pf-zone'),
      lat: lat !== '' && isFinite(Number(lat)) ? Number(lat) : null,
      lng: lng !== '' && isFinite(Number(lng)) ? Number(lng) : null,
      acc: Number(val('pf-acc')) || null,
      stage: stage,
      nextAction: val('pf-next'),
      nextDate: D.validYmd(date) ? date : '',
      nextTime: time,
      why: why,
      temp: w ? w.temp : (existing ? existing.temp || '' : ''),
      source: keep('pf-source', 'source'),
      referredBy: keep('pf-ref', 'referredBy'),
      ownerType: keep('pf-otype', 'ownerType'),
      deciders: keep('pf-deciders', 'deciders'),
      keyFact: keep('pf-key', 'keyFact'),
      founder: chk('pf-founder', 'founder'),
      mentionOk: chk('pf-mention', 'mentionOk'),
      post: post,
      wonAt: stage === 'Ganado' ? ((existing && existing.wonAt) || today()) : ((existing && existing.wonAt) || ''),
      units: Number(val('pf-units')) || 0,
      amount: Number(val('pf-amount')) || 0,
      software: val('pf-soft') || 'No',
      softWhich: val('pf-softwhich'),
      premortem: val('pf-pre'),
      notes: val('pf-notes'),
      created: existing && existing.created ? existing.created : now,
      updated: now
    });
    if (existing) S.state.prospects[S.state.prospects.indexOf(existing)] = rec;
    else S.state.prospects.push(rec);

    let bumped = false;
    if (later) {
      const d = S.getDay(today());
      d.laters += 1;
      if (why === 'dueno') d.absent += 1;
      bumped = S.fixVisits(d);
    }
    const calBox = $('pf-cal');
    const wantCal = !!(calBox && calBox.checked);
    if (rec.nextDate) S.state.config.calDefault = wantCal;
    persist();

    // Se llama dentro del mismo toque para que iOS permita abrir Compartir/Calendario.
    if (wantCal && rec.nextDate) N.addToCalendar(rec).catch(function () { snack('No se pudo crear el recordatorio'); });
    else if (wantCal && !rec.nextDate) snack('Pon una fecha para crear el recordatorio');

    if (isNew) closeSheet(); else openDetail(rec);
    render();
    let msg = isNew ? 'Cliente guardado' : 'Cambios guardados';
    if (later) msg = 'Agendado ' + U.relDate(rec.nextDate) + ' ' + rec.nextTime + (bumped ? ' · visita sumada' : '') + (rec.temp === 'frio' ? ' · frío (sí falso)' : '') + (why === 'dueno' ? ' · esta noche mándale su perfil' : '');
    if (!(wantCal && !rec.nextDate)) snack(msg, { undo: snap });
  }

  function loadPhotos(pid) {
    N.photos.list(pid).then(function (rows) {
      if (!sheet || sheet.ctx.kind !== 'detail' || sheet.ctx.id !== pid) return;
      const box = $('det-photos');
      if (!box) return;
      sheetUrls.forEach(u => URL.revokeObjectURL(u));
      sheetUrls = [];
      const urls = rows.map(r => { const u = URL.createObjectURL(r.blob); sheetUrls.push(u); return u; });
      box.innerHTML = rows.length ? '<div class="photos">' + rows.map((r, i) =>
        '<button class="ph" data-act="photo-view" data-pid="' + U.esc(r.id) + '" style="background-image:url(\'' + urls[i] + '\')" aria-label="Ver foto"></button>').join('') + '</div>' : '';
      const p = S.findProspect(pid);
      const av = $('det-avatar');
      if (p && av) av.innerHTML = U.avatar(p, true, urls[0] || '');
    }).catch(function () { /* sin fotos disponibles */ });
  }

  function openViewer(id) {
    N.photos.get(id).then(function (r) {
      if (!r) return;
      closeViewer();
      const url = URL.createObjectURL(r.blob);
      const el = document.createElement('div');
      el.className = 'viewer';
      el.innerHTML = '<div class="vbar"><button class="nav-btn" data-act="viewer-close">Cerrar</button></div><img alt="Foto del cliente" src="' + url + '">' +
        '<div class="vbar b"><button class="nav-btn" data-act="viewer-share">' + icon('share', 22, 2) + ' Compartir</button><button class="nav-btn" style="color:#ff453a" data-act="viewer-del">' + icon('trash', 22, 2) + ' Eliminar</button></div>';
      document.body.appendChild(el);
      viewer = { el: el, id: r.id, pid: r.pid, blob: r.blob, url: url };
    });
  }
  function closeViewer() {
    if (!viewer) return;
    viewer.el.remove();
    URL.revokeObjectURL(viewer.url);
    viewer = null;
  }

  // ---------- Cotización ----------
  function quoteOpts() {
    const cfg = S.state.config;
    const p = sheet && sheet.ctx.id ? S.findProspect(sheet.ctx.id) : null;
    return {
      business: val('q-business'),
      contact: p ? p.contact : '',
      phone: p ? p.phone : '',
      packages: cfg.packages,
      unitPrice: cfg.unitPrice,
      seller: cfg.sellerName,
      sellerPhone: cfg.sellerPhone
    };
  }

  function genQuote() {
    if (!sheet || sheet.ctx.kind !== 'quote') return;
    const o = quoteOpts();
    const wa = $('q-wa');
    if (wa) wa.href = N.waUrl(o.phone, N.quoteText(o));
    const btn = $('q-share');
    if (btn) btn.disabled = true;
    quoteBlob = null;
    N.quoteImage(o).then(function (blob) {
      if (!sheet || sheet.ctx.kind !== 'quote') return;
      quoteBlob = blob;
      if (quoteUrl) URL.revokeObjectURL(quoteUrl);
      quoteUrl = URL.createObjectURL(blob);
      const img = $('quote-img');
      if (img) img.src = quoteUrl;
      const b = $('q-share');
      if (b) b.disabled = false;
    }).catch(function () { snack('No se pudo crear la imagen'); });
  }

  function openQuote(p) {
    openSheet(SH.quote(p), { kind: 'quote', id: p ? p.id : null, back: p ? p.id : null });
    genQuote();
  }

  // ---------- Respaldo ----------
  function backupBlob() {
    return new Blob([JSON.stringify(S.state, null, 2)], { type: 'application/json' });
  }
  function backupName() { return 'clyclick-respaldo-' + today() + '.json'; }
  function markBackup() { S.state.config.lastBackup = today(); persist(); }

  function importFile(file) {
    const r = new FileReader();
    r.onload = function () {
      let data;
      try { data = JSON.parse(String(r.result)); } catch (e) { snack('El archivo no es un respaldo válido'); return; }
      if (!data || typeof data !== 'object' || !data.config || !data.days) { snack('El archivo no es un respaldo de esta app'); return; }
      if (!confirm('¿Reemplazar los datos actuales por los del respaldo?')) return;
      S.replace(data);
      S.state.config.onboarded = true;
      persist();
      render();
      snack('Respaldo restaurado');
    };
    r.readAsText(file);
  }

  function weekSummary() {
    const t = today();
    const a = S.rangeStats(D.addDays(t, -6), t);
    const imp = val('rv-improve');
    return 'Semana al ' + U.fmtDate(t) + ' · Sistema CEO Clyclick\n' +
      'Visitas: ' + a.visits + ' · Dueños: ' + a.owners + ' · Demos: ' + a.demos + ' · Ventas: ' + a.sales + '\n' +
      'Habladores: ' + a.units + ' · Ingreso: ' + money(a.revenue) + ' · Cierre: ' + U.pct(a.sales, a.visits) + '\n' +
      'Días con meta: ' + a.met + ' de ' + a.workDays + (imp ? '\nMejora del 1%: ' + imp : '');
  }

  // ---------- Bienvenida ----------
  function startOnboarding() {
    const c = S.state.config;
    obDraft = { name: c.sellerName, phone: c.sellerPhone, city: c.sellerCity, price: c.unitPrice, cost: c.unitCost, goal: c.dailyVisitGoal, days: c.workDays.slice() };
    openSheet(SH.onboarding(1, obDraft), { kind: 'onb', step: 1 });
  }
  function collectOnb() {
    if (!obDraft) return;
    if ($('ob-name')) obDraft.name = val('ob-name');
    if ($('ob-phone')) obDraft.phone = val('ob-phone');
    if ($('ob-city')) obDraft.city = val('ob-city');
    if ($('ob-price')) obDraft.price = Number(val('ob-price')) || 0;
    if ($('ob-cost')) obDraft.cost = Number(val('ob-cost')) || 0;
  }

  // ---------- Que el cliente llene sus datos (Cialdini · compromiso) ----------
  function saveSelf() {
    const ctx = sheet ? sheet.ctx : {};
    const business = val('sf-business');
    if (!business) { snack('Escriba el nombre del negocio'); const n = $('sf-business'); if (n) n.focus(); return; }
    const profile = {};
    ['business', 'owner', 'phone', 'instagram', 'facebook', 'tiktok', 'address', 'hours', 'highlight'].forEach(k => { profile[k] = val('sf-' + k); });
    const snap = S.snapshot();
    const now = Date.now();
    let p = ctx.id ? S.findProspect(ctx.id) : null;
    if (p) {
      p.profile = profile;
      p.name = business;
      if (profile.owner && !p.contact) p.contact = profile.owner;
      if (profile.phone && !p.phone) p.phone = profile.phone;
      if (profile.address && !p.zone) p.zone = profile.address;
      p.updated = now;
    } else {
      p = {
        id: S.uid(), name: business, contact: profile.owner, phone: profile.phone, zone: profile.address,
        stage: 'Ganado', source: 'Calle', units: Number(ctx.units) || 0, amount: Number(ctx.amount) || 0,
        wonAt: today(), profile: profile, lat: null, lng: null, created: now, updated: now
      };
      S.state.prospects.push(p);
      const pid = p.id;
      N.getPosition().then(function (pos) {
        const x = S.findProspect(pid);
        if (x && (x.lat == null || x.lat === '')) { x.lat = pos.lat; x.lng = pos.lng; x.acc = pos.acc; persist(); }
      }).catch(function () { /* sin ubicación */ });
    }
    persist();
    render();
    openDetail(p);
    snack('Datos guardados. Pregúntale dónde lo va a poner (Voss).', { undo: snap });
  }

  // ---------- Pliego de negociación (Voss) ----------
  function collectPliego() {
    return {
      goal: val('pl-goal'), client: val('pl-client'),
      target: Number(val('pl-target')) || 0, low: Number(val('pl-low')) || 0, high: Number(val('pl-high')) || 0,
      summary: val('pl-summary'),
      acc: $('pl-acc') ? $('pl-acc').value : '', qs: $('pl-qs') ? $('pl-qs').value : '', extras: $('pl-extras') ? $('pl-extras').value : ''
    };
  }

  function pliegoText(d, p) {
    const lines = x => String(x || '').split('\n').map(y => y.trim()).filter(Boolean).map(y => '• ' + y).join('\n');
    const who = p ? p.name : d.client;
    let t = 'Pliego de negociación' + (who ? ' · ' + who : '') + '\n';
    if (d.goal) t += 'Objetivo: ' + d.goal + '\n';
    if (d.low && d.high) t += 'Rango: "Proyectos así van de ' + money(d.low) + ' a ' + money(d.high) + '."' + (d.target ? ' (mi objetivo: ' + money(d.target) + ')' : '') + '\n';
    t += 'Al empezar: "' + C.PLIEGO_FAIR + '"\n';
    if (d.summary) t += '\nResumen (hasta oír "así es"):\n' + d.summary + '\n';
    if (d.acc) t += '\nAutoacusaciones:\n' + lines(d.acc) + '\n';
    if (d.qs) t += '\nPreguntas con qué y cómo:\n' + lines(d.qs) + '\n';
    if (d.extras) t += '\nExtras en vez de descuento:\n' + lines(d.extras) + '\n';
    return t.trim();
  }

  function refreshMessages(p) {
    if (sheet && sheet.ctx.kind === 'messages' && sheet.ctx.id === p.id) refreshSheet(SH.messages(p, sheet.ctx.k, sheet.ctx.fromDetail));
    else if (sheet && sheet.ctx.kind === 'detail' && sheet.ctx.id === p.id) { refreshSheet(SH.prospectDetail(p)); loadPhotos(p.id); }
  }

  // ---------- Clics ----------
  document.addEventListener('click', function (e) {
    const el = e.target.closest('[data-act]');
    if (!el) return;
    const act = el.dataset.act;
    if (act === 'link') return; // enlace nativo (WhatsApp, teléfono, Maps)
    const t = today();

    switch (act) {
      case 'tab': goTab(el.dataset.tab); break;
      case 'seg': {
        S.state.ui[el.dataset.seg] = el.dataset.v;
        persist();
        if (el.dataset.seg === 'psort') {
          if ($('p-list')) $('p-list').innerHTML = V.clientList(query);
          $app.querySelectorAll('[data-seg="psort"]').forEach(b => b.classList.toggle('on', b.dataset.v === el.dataset.v));
          if (el.dataset.v === 'cerca') locate();
        } else render();
        break;
      }
      case 'goto':
        S.state.ui.tab = el.dataset.tab;
        if (el.dataset.seg) S.state.ui[el.dataset.seg] = el.dataset.v;
        persist(); closeSheet(); render(); window.scrollTo(0, 0);
        break;
      case 'tip-next': tipOffset++; render(); break;
      case 'commit': {
        const d = S.getDay(t); d.committed = true; d.rest = false; persist(); render();
        snack('Compromiso hecho. Ahora cúmplelo (Ley 7).');
        break;
      }
      case 'rest': { const d = S.getDay(t); d.rest = true; d.committed = false; persist(); render(); break; }
      case 'unrest': { const d = S.getDay(t); d.rest = false; persist(); render(); break; }

      // Dock de calle
      case 'dock-visit': {
        const snap = S.snapshot();
        const d = S.getDay(t); d.visits += 1; persist(); render();
        const g = Number(S.state.config.dailyVisitGoal) || 0;
        let m = 'Visita ' + d.visits + (g ? ' de ' + g : '');
        if (g && d.visits === g) m = '¡Meta cumplida! Haz una más: puede ser la venta (Blount).';
        else if (g && d.visits > g) m = 'Visita ' + d.visits + ' · extra. Esta puede ser la venta.';
        snack(m, { undo: snap });
        break;
      }
      case 'dock-owner': {
        const snap = S.snapshot();
        const d = S.getDay(t); d.owners += 1; const bumped = S.fixVisits(d); persist(); render();
        snack('Hablaste con el dueño · ' + d.owners + ' hoy' + (bumped ? ' · visita sumada' : ''), { undo: snap });
        break;
      }
      case 'dock-demo': {
        const snap = S.snapshot();
        const d = S.getDay(t); d.demos += 1; const bumped = S.fixVisits(d); persist(); render();
        snack('Demo ' + d.demos + (bumped ? ' · visita sumada' : ''), { undo: snap });
        break;
      }
      case 'dock-sale': openSheet(SH.sale(false), { kind: 'sale' }); break;
      case 'sale-pkg': {
        const p = S.state.config.packages[Number(el.dataset.i)];
        addSale(Number(p.units) || 0, Number(p.price) || 0, p.name);
        break;
      }
      case 'sale-custom': addSale(Math.floor(Number(val('sc-u'))), Number(val('sc-a')), 'Personalizado'); break;
      case 'dock-no': openSheet(SH.no(null), { kind: 'no', type: null }); break;
      case 'no-type': {
        if (!sheet) break;
        sheet.ctx.type = el.dataset.k;
        refreshSheet(SH.no(el.dataset.k, false));
        break;
      }
      case 'no-back': if (sheet) { sheet.ctx.type = null; refreshSheet(SH.no(null)); } break;
      case 'no-to-later':
        openProspectForm({ stage: 'Seguimiento', nextAction: 'Volver a visitar', nextDate: D.addDays(t, 1), nextTime: '' }, 'later');
        break;
      case 'no-reason': {
        const type = sheet && sheet.ctx.type ? sheet.ctx.type : '';
        const asi = asiOn();
        const snap = S.snapshot();
        const d = S.getDay(t);
        d.rejLog.push({ reason: el.dataset.r, type: type, asi: asi, at: Date.now() });
        const bumped = S.fixVisits(d);
        persist(); closeSheet(); render();
        const nt = C.NO_TYPES.find(x => x.k === type);
        snack('"No" anotado: ' + el.dataset.r + (nt ? ' (' + nt.t.toLowerCase() + ')' : '') + (bumped ? ' · visita sumada' : ''), { undo: snap });
        break;
      }
      case 'dock-later':
        openProspectForm({ stage: 'Seguimiento', nextAction: 'Volver a visitar', nextDate: D.addDays(t, 1), nextTime: '' }, 'later');
        break;
      case 'pf-why': {
        const w = $('pf-why');
        if (!w) break;
        w.value = w.value === el.dataset.k ? '' : el.dataset.k;
        updateWhyHint(true);
        break;
      }
      case 'ab-set': {
        const d = S.getDay(t);
        if (d.ab && d.ab.id === el.dataset.id && d.ab.v === el.dataset.v) delete d.ab;
        else d.ab = { id: el.dataset.id, v: el.dataset.v };
        persist(); render();
        if (d.ab) snack('Hoy usas la variante ' + d.ab.v);
        break;
      }

      // Ruta y clientes cerca (Blount · Cialdini)
      case 'route-open':
        openSheet(SH.route(el.dataset.id || ''), { kind: 'route', focus: el.dataset.id || '' });
        if (!N.lastPos) locate();
        break;
      case 'route-locate': locate(true); break;
      case 'cerca-locate': cercaTried = true; locate(true); break;

      // Mensajes de WhatsApp
      case 'msg-open': {
        const p = S.findProspect(el.dataset.id);
        if (!p) break;
        const fromDetail = !!(sheet && sheet.ctx.kind === 'detail');
        openSheet(SH.messages(p, el.dataset.k || '', fromDetail), { kind: 'messages', id: p.id, k: el.dataset.k || '', fromDetail: fromDetail });
        break;
      }
      case 'msg-send': {
        // No se cancela el enlace: WhatsApp se abre y aquí solo se anota el envío.
        const p = S.findProspect(el.dataset.id);
        if (!p) break;
        const k = el.dataset.k;
        p.msgs = (Number(p.msgs) || 0) + 1;
        p.lastMsg = Date.now();
        if (k !== 'gracias') p.noReply = (Number(p.noReply) || 0) + 1;
        p.sent = p.sent || {};
        if (k !== 'libre') p.sent[k] = k === 'cita' ? p.nextDate : t;
        if (k === 'resultados') p.resultsAsked = true;
        if (k === 'pedirRef') p.refAsked = true;
        p.updated = Date.now();
        persist();
        setTimeout(function () { refreshMessages(p); render(); }, 400);
        break;
      }
      case 'msg-replied': {
        const p = S.findProspect(el.dataset.id);
        if (!p) break;
        const snap = S.snapshot();
        p.noReply = 0; p.replied = Date.now(); p.updated = Date.now();
        persist(); refreshMessages(p); render();
        snack('Anotado: respondió', { undo: snap });
        break;
      }

      // Que el cliente llene sus datos
      case 'self-open': {
        const p = el.dataset.id ? S.findProspect(el.dataset.id) : null;
        openSheet(SH.selfFill(p), { kind: 'self', id: p ? p.id : null, units: Number(el.dataset.u) || 0, amount: Number(el.dataset.a) || 0 });
        break;
      }
      case 'self-save': saveSelf(); break;

      // Pliego de negociación
      case 'pliego-open': {
        const p = el.dataset.id ? S.findProspect(el.dataset.id) : null;
        openSheet(SH.pliego(p), { kind: 'pliego', id: p ? p.id : null });
        break;
      }
      case 'pliego-calc': {
        const target = Number(val('pl-target'));
        if (!(target > 0)) { snack('Pon tu precio objetivo'); break; }
        $('pl-low').value = S.nonRound(target);
        $('pl-high').value = S.nonRound(target * 1.45);
        snack('Rango listo: di la cifra baja como tu objetivo');
        break;
      }
      case 'pliego-save': {
        const p = sheet && sheet.ctx.id ? S.findProspect(sheet.ctx.id) : null;
        if (!p) break;
        const snap = S.snapshot();
        p.pliego = collectPliego();
        if (!p.software || p.software === 'No') p.software = 'Tal vez';
        p.updated = Date.now();
        persist(); render(); openDetail(p);
        snack('Pliego guardado en la ficha', { undo: snap });
        break;
      }
      case 'pliego-copy': {
        const p = sheet && sheet.ctx.id ? S.findProspect(sheet.ctx.id) : null;
        N.copy(pliegoText(collectPliego(), p)).then(r => snack(r === 'copied' ? 'Pliego copiado' : 'No se pudo copiar'));
        break;
      }
      case 'undo-last': undoLast(); break;

      case 'ans': {
        const d = S.getDay(t);
        const q = S.state.config.questions[Number(el.dataset.i)];
        const v = el.dataset.v === '1';
        if (d.answers[q] === v) delete d.answers[q]; else d.answers[q] = v;
        persist(); render();
        break;
      }
      case 'hours-step': {
        const d = S.getDay(t);
        d.hours = clamp((Number(d.hours) || 0) + 0.5 * Number(el.dataset.d), 0, 16);
        persist(); render();
        break;
      }
      case 'day-edit': openSheet(SH.dayEdit(t), { kind: 'dayEdit', date: t }); break;
      case 'de-step': {
        const date = sheet.ctx.date;
        const x = S.getDay(date);
        const k = el.dataset.k;
        const dir = Number(el.dataset.d);
        x[k] = Math.max(0, (x[k] || 0) + dir);
        if (k === 'visits' && x.visits < S.minVisits(x)) { x.visits = S.minVisits(x); snack('Mínimo ' + x.visits + ' por los registros de ese día'); }
        S.fixVisits(x);
        persist(); render(); refreshSheet(SH.dayEdit(date));
        break;
      }
      case 'de-del-sale':
      case 'de-del-no': {
        const date = sheet.ctx.date;
        const snap = S.snapshot();
        const x = S.getDay(date);
        const list = act === 'de-del-sale' ? x.salesLog : x.rejLog;
        list.splice(Number(el.dataset.i), 1);
        persist(); render(); refreshSheet(SH.dayEdit(date));
        snack(act === 'de-del-sale' ? 'Venta eliminada' : '"No" eliminado', { undo: snap });
        break;
      }

      case 'prep': {
        const d = S.getDay(t); const i = el.dataset.i;
        d.prep[i] = !d.prep[i]; persist(); render();
        break;
      }
      case 'obj-open': openSheet(SH.objection(Number(el.dataset.i)), { kind: 'obj' }); break;
      case 'quote-open': openQuote(el.dataset.id ? S.findProspect(el.dataset.id) : null); break;
      case 'quote-share':
        if (!quoteBlob) { snack('La imagen aún se está creando'); break; }
        N.deliver(quoteBlob, 'cotizacion-' + N.slug(val('q-business') || 'clyclick') + '.png', { preferShare: true, title: 'Cotización Clyclick' })
          .then(res => { if (res === 'downloaded') snack('Imagen descargada'); });
        break;
      case 'quote-copy':
        N.copy(N.quoteText(quoteOpts())).then(r => snack(r === 'copied' ? 'Texto copiado' : 'No se pudo copiar'));
        break;

      // Clientes
      case 'p-new': openProspectForm({ stage: 'Por visitar' }, ''); break;
      case 'p-new-won':
        openProspectForm({ stage: 'Ganado', units: Number(el.dataset.u) || 0, amount: Number(el.dataset.a) || 0 }, 'won');
        break;
      case 'p-open': { const p = S.findProspect(el.dataset.id); if (p) openDetail(p); break; }
      case 'p-edit': { const p = S.findProspect(el.dataset.id); if (p) openProspectForm(p, '', 'detail'); break; }
      case 'p-save': saveProspect(); break;
      case 'p-delete': {
        const p = sheet && sheet.ctx.id ? S.findProspect(sheet.ctx.id) : null;
        if (!p || !confirm('¿Eliminar a ' + p.name + '? También se borran sus fotos.')) break;
        S.state.prospects = S.state.prospects.filter(x => x.id !== p.id);
        N.photos.delFor(p.id).catch(() => {});
        persist(); closeSheet(); render(); snack('Cliente eliminado');
        break;
      }
      case 'p-stage': {
        const p = S.findProspect(el.dataset.id);
        if (!p || p.stage === el.dataset.s) break;
        const snap = S.snapshot();
        p.stage = el.dataset.s; p.updated = Date.now();
        if (p.stage === 'Ganado' && !p.wonAt) p.wonAt = t;
        persist(); render(); refreshSheet(SH.prospectDetail(p)); loadPhotos(p.id);
        snack('Etapa: ' + p.stage + (p.stage === 'Ganado' ? ' · a los 7 días te recuerdo pedir resultados' : ''), { undo: snap });
        break;
      }
      case 'p-done': {
        const p = S.findProspect(el.dataset.id);
        if (!p) break;
        const snap = S.snapshot();
        p.nextDate = ''; p.nextTime = ''; p.nextAction = ''; p.updated = Date.now();
        persist(); render(); refreshSheet(SH.prospectDetail(p)); loadPhotos(p.id);
        snack('Pendiente hecho', { undo: snap });
        break;
      }
      case 'p-new-ref': {
        const parent = S.findProspect(el.dataset.id);
        if (!parent) break;
        parent.refAsked = true; parent.updated = Date.now(); persist();
        const by = parent.contact ? parent.contact + ' (' + parent.name + ')' : parent.name;
        openProspectForm({ stage: 'Por visitar', source: 'Referido', referredBy: by, nextAction: 'Primer mensaje: contacto referido' }, 'ref');
        break;
      }
      case 'p-geo': fillGeo(true); break;
      case 'act-cal': {
        const p = S.findProspect(el.dataset.id);
        if (!p) break;
        if (!p.nextDate) { snack('Primero agenda una fecha de seguimiento'); break; }
        N.addToCalendar(p).then(res => { if (res === 'downloaded') snack('Abre el archivo descargado para agregarlo al Calendario'); });
        break;
      }
      case 'act-vcf': {
        const p = S.findProspect(el.dataset.id);
        if (p) N.saveContact(p).then(res => { if (res === 'downloaded') snack('Abre el archivo descargado para guardar el contacto'); });
        break;
      }
      case 'pfilter':
        S.state.ui.pfilter = el.dataset.s; persist(); render();
        break;
      case 'photo-view': openViewer(el.dataset.pid); break;
      case 'viewer-close': closeViewer(); break;
      case 'viewer-share':
        if (viewer) N.deliver(viewer.blob, 'foto-cliente.jpg', { preferShare: true, title: 'Foto' });
        break;
      case 'viewer-del':
        if (viewer && confirm('¿Eliminar esta foto?')) {
          const pid = viewer.pid;
          N.photos.del(viewer.id).then(() => { closeViewer(); loadPhotos(pid); snack('Foto eliminada'); });
        }
        break;

      // Experimentos
      case 'exp-new': openSheet(SH.exp(), { kind: 'exp', id: null }); break;
      case 'exp-idea': {
        const idea = C.EXP_IDEAS[Number(el.dataset.i)];
        openSheet(SH.exp({ title: idea.title, hypothesis: idea.hypothesis, metric: idea.metric, a: idea.a || '', b: idea.b || '' }), { kind: 'exp', id: null });
        break;
      }
      case 'exp-open': {
        const x = S.state.experiments.find(y => y.id === el.dataset.id);
        if (x) openSheet(SH.exp(x), { kind: 'exp', id: x.id });
        break;
      }
      case 'exp-save': {
        const title = val('ef-title');
        if (!title) { snack('Escribe qué vas a probar'); break; }
        const a = val('ef-a'), b = val('ef-b');
        if (!!a !== !!b) { snack('Pon las dos variantes (A y B) o ninguna'); break; }
        const id = sheet.ctx.id || S.uid();
        const rec = { id: id, title: title, hypothesis: val('ef-hyp'), metric: val('ef-metric'), start: val('ef-start'), status: val('ef-status') || 'Corriendo', result: val('ef-result'), a: a, b: b };
        const i = S.state.experiments.findIndex(x => x.id === id);
        if (i === -1) S.state.experiments.push(rec); else S.state.experiments[i] = rec;
        persist(); closeSheet(); render();
        snack(rec.status === 'Corriendo' ? (a ? 'Experimento A/B en marcha: elige la variante cada mañana en Hoy' : 'Experimento en marcha') : 'Guardado · fracaso = información (Ley 21)');
        break;
      }
      case 'exp-delete': {
        const snap = S.snapshot();
        S.state.experiments = S.state.experiments.filter(x => x.id !== sheet.ctx.id);
        persist(); closeSheet(); render(); snack('Experimento eliminado', { undo: snap });
        break;
      }

      // Revisión semanal
      case 'review-save': {
        const rec = { id: S.uid(), date: t };
        let any = false;
        C.REVIEW_FIELDS.forEach(f => { rec[f[0]] = val('rv-' + f[0]); if (rec[f[0]]) any = true; });
        if (!any) { snack('Escribe al menos una respuesta'); break; }
        const st = S.rangeStats(D.addDays(t, -6), t);
        rec.stats = { visits: st.visits, sales: st.sales, units: st.units, revenue: st.revenue };
        S.state.reviews.push(rec);
        persist(); render(); window.scrollTo(0, 0);
        snack('Revisión guardada. Aplica tu mejora del 1% (Ley 19).');
        break;
      }
      case 'review-share': N.shareText(weekSummary(), 'Mi semana').then(r => { if (r === 'copied') snack('Resumen copiado'); }); break;
      case 'review-open': {
        const r = S.state.reviews.find(x => x.id === el.dataset.id);
        if (r) openSheet(SH.review(r), { kind: 'review', id: r.id });
        break;
      }
      case 'review-del': {
        const snap = S.snapshot();
        S.state.reviews = S.state.reviews.filter(x => x.id !== el.dataset.id);
        persist(); closeSheet(); render(); snack('Revisión eliminada', { undo: snap });
        break;
      }

      // Ajustes
      case 'goal-step': {
        const c = S.state.config;
        c.dailyVisitGoal = clamp((Number(c.dailyVisitGoal) || 0) + Number(el.dataset.d), 1, 100);
        persist(); render();
        break;
      }
      case 'dow': {
        const d = Number(el.dataset.d);
        const wd = S.state.config.workDays;
        const i = wd.indexOf(d);
        if (i === -1) wd.push(d); else if (wd.length > 1) wd.splice(i, 1);
        persist(); render();
        break;
      }
      case 'pkg-open': openSheet(SH.pkg(Number(el.dataset.i)), { kind: 'pkg' }); break;
      case 'pkg-save': {
        const i = Number(el.dataset.i);
        const units = Math.floor(Number(val('pk-units')));
        const price = Number(val('pk-price'));
        const name = val('pk-name');
        if (!name) { snack('Pon un nombre'); break; }
        if (!(units >= 1)) { snack('Mínimo 1 unidad'); break; }
        if (!(price >= 0)) { snack('Precio inválido'); break; }
        S.state.config.packages[i] = { name: name, units: units, price: price, desc: val('pk-desc'), why: val('pk-why') };
        persist(); closeSheet(); render(); snack('Paquete guardado');
        break;
      }
      case 'q-edit': openSheet(SH.questions(), { kind: 'questions' }); break;
      case 'q-save': {
        const qs = ($('q-text') ? $('q-text').value : '').split('\n').map(s => s.trim()).filter(Boolean);
        if (!qs.length) { snack('Escribe al menos una pregunta'); break; }
        S.state.config.questions = qs;
        persist(); closeSheet(); render(); snack('Preguntas guardadas');
        break;
      }
      case 'backup-share':
        N.deliver(backupBlob(), backupName(), { preferShare: true, title: 'Respaldo Clyclick' }).then(res => {
          if (res !== 'cancelled') { markBackup(); render(); snack(res === 'shared' ? 'Respaldo guardado' : 'Respaldo descargado'); }
        });
        break;
      case 'backup-download':
        N.download(backupBlob(), backupName()); markBackup(); render(); snack('Respaldo descargado');
        break;
      case 'backup-copy':
        N.copy(JSON.stringify(S.state)).then(r => {
          if (r === 'copied') { markBackup(); render(); snack('Respaldo copiado. Pégalo en un chat contigo mismo.'); } else snack('No se pudo copiar');
        });
        break;
      case 'reset':
        if (confirm('¿Borrar TODOS los datos? Esto no se puede deshacer.') && confirm('¿Seguro? Descarga un respaldo antes si lo necesitas.')) {
          S.state.prospects.forEach(p => N.photos.delFor(p.id).catch(() => {}));
          S.reset();
          S.state.ui.tab = 'meta'; S.state.ui.metaSeg = 'ajustes';
          persist(); render(); snack('Datos borrados');
        }
        break;

      // Bienvenida
      case 'onb-next':
        collectOnb();
        sheet.ctx.step = Number(el.dataset.step);
        refreshSheet(SH.onboarding(sheet.ctx.step, obDraft));
        break;
      case 'ob-goal':
        obDraft.goal = clamp((Number(obDraft.goal) || 0) + Number(el.dataset.d), 1, 100);
        refreshSheet(SH.onboarding(3, obDraft));
        break;
      case 'ob-dow': {
        const d = Number(el.dataset.d);
        const i = obDraft.days.indexOf(d);
        if (i === -1) obDraft.days.push(d); else if (obDraft.days.length > 1) obDraft.days.splice(i, 1);
        refreshSheet(SH.onboarding(3, obDraft));
        break;
      }
      case 'onb-done': {
        collectOnb();
        const c = S.state.config;
        c.sellerName = obDraft.name || '';
        c.sellerPhone = obDraft.phone || '';
        c.sellerCity = obDraft.city || '';
        c.unitPrice = Number(obDraft.price) || 0;
        c.unitCost = Number(obDraft.cost) || 0;
        c.dailyVisitGoal = Number(obDraft.goal) || 15;
        c.workDays = obDraft.days.slice();
        c.onboarded = true;
        persist(); closeSheet(); render();
        snack('¡Listo! Cada mañana responde "Sí, lo haré".');
        break;
      }
      case 'onb-skip':
        S.state.config.onboarded = true; persist(); closeSheet(); render();
        break;

      case 'sheet-bg': if (sheet && !sheet.locked) closeSheet(); break;
      case 'sheet-close': closeSheet(); break;
    }
  });

  // ---------- Escritura ----------
  document.addEventListener('input', function (e) {
    const el = e.target;
    if (el.id === 'p-search') {
      query = el.value;
      $('p-list').innerHTML = V.clientList(query);
      return;
    }
    if (el.id === 'q-business') {
      clearTimeout(quoteTimer);
      quoteTimer = setTimeout(genQuote, 350);
      return;
    }
    if (!el.dataset || !el.dataset.bind) return;
    let v = el.value;
    if (el.dataset.type === 'num') {
      v = v === '' ? 0 : Number(v);
      if (!isFinite(v)) return;
    }
    S.setPath(el.dataset.bind, v);
    persist();
    if (el.dataset.after === 'meta') {
      const lbl = $('lv-' + el.dataset.bind.replace(/\./g, '-'));
      if (lbl) lbl.textContent = v;
      if ($('meta-hero')) $('meta-hero').innerHTML = V.metaHero();
      if ($('meta-eq')) $('meta-eq').innerHTML = V.metaEq();
      if ($('meta-calc')) $('meta-calc').innerHTML = V.metaCalc();
      if ($('meta-hour')) $('meta-hour').innerHTML = V.metaHour();
    }
  });

  document.addEventListener('change', function (e) {
    const el = e.target;
    if (el.id === 'pf-rubro') updateRubroHint();
    else if (el.id === 'pf-otype') updateOwnerHint();
    else if (el.id === 'pf-source') { const w = $('pf-ref-wrap'); if (w) w.style.display = el.value === 'Referido' ? '' : 'none'; }
    else if (el.id === 'pf-stage') { const w = $('pf-post'); if (w) w.style.display = el.value === 'Ganado' ? '' : 'none'; }
    else if (el.id === 'cfg-cal') { S.state.config.calDefault = !!el.checked; persist(); }
    else if (el.id === 'de-date' && sheet && sheet.ctx.kind === 'dayEdit') {
      const v = el.value;
      if (D.validYmd(v) && v <= today()) { sheet.ctx.date = v; refreshSheet(SH.dayEdit(v)); }
      else { el.value = sheet.ctx.date; snack('Elige un día de hoy o anterior'); }
    } else if (el.id === 'photo-input' && el.files && el.files[0]) {
      const pid = el.dataset.id;
      const file = el.files[0];
      el.value = '';
      snack('Guardando foto…');
      N.photos.add(pid, file).then(function () { loadPhotos(pid); snack('Foto guardada'); })
        .catch(function (err) { snack(err && err.message ? err.message : 'No se pudo guardar la foto'); });
    } else if (el.id === 'imp' && el.files && el.files[0]) {
      importFile(el.files[0]);
      el.value = '';
    }
  });

  // Oculta dock y tab bar mientras se escribe en la pantalla (no en hojas).
  document.addEventListener('focusin', function (e) {
    if (e.target.matches && e.target.matches('main input, main textarea, main select') && !e.target.matches('[type=range], [type=file]')) document.body.classList.add('kb');
  });
  document.addEventListener('focusout', function () {
    setTimeout(function () {
      const a = document.activeElement;
      if (!a || !a.matches || !a.matches('main input, main textarea, main select')) document.body.classList.remove('kb');
    }, 60);
  });

  window.addEventListener('scroll', onScroll, { passive: true });
  document.addEventListener('keydown', function (e) {
    if (e.key === 'Escape') { if (viewer) closeViewer(); else if (sheet && !sheet.locked) closeSheet(); }
  });
  document.addEventListener('visibilitychange', function () {
    if (document.visibilityState !== 'visible' || sheet || viewer) return;
    const a = document.activeElement;
    if (!a || (a.tagName !== 'INPUT' && a.tagName !== 'TEXTAREA')) render();
  });

  if (navigator.storage && navigator.storage.persist) navigator.storage.persist().catch(function () {});

  buildChrome();
  render();
  if (!S.state.config.onboarded) startOnboarding();

  // Para pruebas automatizadas.
  window.APP = { render: render, openSheet: openSheet, closeSheet: closeSheet };
})();

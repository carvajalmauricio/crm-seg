/* Hojas inferiores (bottom sheets). Cada función devuelve {title, left, right, body, cls, locked}. */
'use strict';

(function () {
  const C = window.CONTENT;
  const S = window.STORE;
  const N = window.NATIVE;
  const U = window.U;
  const D = S.dates;
  const esc = U.esc, money = U.money, icon = U.icon;

  const cancel = () => U.navBtn('sheet-close', 'Cancelar', 'Cancelar');
  const close = () => U.navBtn('sheet-close', 'Cerrar', 'Cerrar');
  const save = (act, extra) => '<button class="nav-btn bold" data-act="' + act + '"' + (extra || '') + '>Guardar</button>';
  const opts = (list, cur) => list.map(x => '<option' + (x === cur ? ' selected' : '') + '>' + esc(x) + '</option>').join('');
  const selIc = '<span class="selic">' + icon('chevDown', 16, 2.2) + '</span>';
  const hhmm = at => { try { return new Date(at).toLocaleTimeString('es-EC', { hour: '2-digit', minute: '2-digit' }); } catch (e) { return ''; } };

  function inp(id, label, value, o) {
    o = o || {};
    return '<label class="field"><span class="lbl">' + esc(label) + '</span><input id="' + id + '" type="' + (o.type || 'text') + '"' +
      (o.inputmode ? ' inputmode="' + o.inputmode + '"' : '') + (o.min != null ? ' min="' + o.min + '"' : '') + (o.step ? ' step="' + o.step + '"' : '') +
      (o.auto ? ' autocomplete="' + o.auto + '"' : '') + ' value="' + esc(value == null ? '' : value) + '" placeholder="' + esc(o.ph || '') + '"></label>';
  }
  function area(id, label, value, ph, rows) {
    return '<label class="field"><span class="lbl">' + esc(label) + '</span><textarea id="' + id + '" rows="' + (rows || 3) + '" placeholder="' + esc(ph || '') + '">' + esc(value || '') + '</textarea></label>';
  }
  function sel(id, label, list, cur, blank) {
    return '<label class="field"><span class="lbl">' + esc(label) + '</span><select id="' + id + '">' + (blank ? '<option value="">—</option>' : '') + opts(list, cur) + '</select>' + selIc + '</label>';
  }

  const SH = {};

  // ---------- Ventas y "no" ----------
  SH.sale = function () {
    const cfg = S.state.config;
    const body = U.group('¿Qué se llevó?', cfg.packages.map((p, i) => {
      const u = Number(p.units) || 0;
      return U.cell({ act: 'sale-pkg', data: { i: i }, icon: 'cash', iconBg: i === 1 ? 'bg-green' : 'bg-gray', title: p.name + (i === 1 ? ' · recomendado' : ''), sub: u + ' hablador' + (u === 1 ? '' : 'es'), trailHtml: '<b style="color:var(--label)">' + money(p.price) + '</b>', chev: true });
    }).join('')) +
      U.group('Otra cantidad', '<div class="field"><div class="row2"><label><span class="lbl">Unidades</span><input id="sc-u" type="number" inputmode="numeric" min="1" step="1" value="1"></label>' +
        '<label><span class="lbl">Total $</span><input id="sc-a" type="number" inputmode="decimal" min="0" step="0.01" value="' + (Number(cfg.unitPrice) || 0) + '"></label></div></div>') +
      '<div class="pad"><button class="btn green" data-act="sale-custom">Guardar venta</button></div>';
    return { title: 'Registrar venta', left: cancel(), body: body };
  };

  SH.saleDone = function (units, amount, bumped) {
    const body = '<div class="done-hero"><div class="circle">' + icon('check', 40, 2.6) + '</div><h2>Venta registrada</h2>' +
      '<div class="muted">' + units + ' hablador' + (units === 1 ? '' : 'es') + ' · ' + money(amount) + (bumped ? ' · visita sumada' : '') + '</div></div>' +
      '<div class="card">' + U.law('Ley 13 · Regla pico-final') + '<p class="tip-body">Termina bien: agradece y pregunta cómo maneja sus pedidos, citas o reservas. Ahí puede estar tu próximo cliente de software.</p></div>' +
      '<div class="pad btns"><button class="btn" data-act="p-new-won" data-u="' + units + '" data-a="' + amount + '">' + icon('person', 20, 2) + ' Guardar datos del cliente</button>' +
      '<button class="btn gray" data-act="sheet-close">Listo</button>' +
      '<button class="btn plain red" data-act="undo-last">Deshacer venta</button></div>';
    return { title: '', left: '', right: close(), body: body };
  };

  SH.no = function () {
    const body = '<div class="pad muted" style="margin-bottom:16px">' + U.law('Ley 21') + ' No es un fracaso: es un dato. ¿Cuál fue la razón principal?</div>' +
      U.group('', C.REASONS.map(r => U.cell({ act: 'no-reason', data: { r: r }, title: r, chev: true })).join(''));
    return { title: 'Me dijo que no', left: cancel(), body: body };
  };

  // ---------- Cliente: formulario ----------
  SH.prospectForm = function (p, src) {
    p = p || {};
    const isNew = !p.id;
    const cfg = S.state.config;
    const hasLoc = p.lat != null && p.lat !== '';
    const calOn = p.nextDate ? false : !!cfg.calDefault;
    let body = '';
    body += U.group('Negocio', inp('pf-name', 'Nombre del negocio *', p.name, { ph: 'Ej. Cafetería La Esquina', auto: 'off' }) +
      sel('pf-rubro', 'Rubro', C.RUBROS, p.rubro, true) + '<div class="field" id="pf-hint-wrap" style="display:none"><div class="hint" id="pf-hint"></div></div>');
    body += U.group('Contacto', inp('pf-contact', 'Persona de contacto', p.contact, { auto: 'off' }) +
      inp('pf-phone', 'WhatsApp / teléfono', p.phone, { type: 'tel', inputmode: 'tel', ph: '09XXXXXXXX', auto: 'off' }));
    body += U.group('Ubicación', inp('pf-zone', 'Dirección o zona', p.zone, { ph: 'Calle, barrio', auto: 'off' }) +
      '<input type="hidden" id="pf-lat" value="' + esc(hasLoc ? p.lat : '') + '"><input type="hidden" id="pf-lng" value="' + esc(hasLoc ? p.lng : '') + '"><input type="hidden" id="pf-acc" value="' + esc(p.acc || '') + '">' +
      U.cell({ act: 'p-geo', icon: 'nav', iconBg: 'bg-blue', title: hasLoc ? 'Actualizar con mi ubicación' : 'Usar mi ubicación actual', subHtml: '<span id="pf-geo-status">' + (hasLoc ? 'Ubicación guardada' + (p.acc ? ' (±' + esc(p.acc) + ' m)' : '') : 'Para volver con Apple Maps y ordenar por cercanía') + '</span>' }));
    body += U.group('<span>Seguimiento</span>' + U.law('Ley 20'), sel('pf-stage', 'Etapa', C.STAGES, p.stage || 'Visitado') +
      inp('pf-next', 'Próxima acción', p.nextAction, { ph: 'Ej. Volver a mostrarle su perfil', auto: 'off' }) +
      '<div class="field"><div class="row2"><label><span class="lbl">Fecha</span><input id="pf-date" type="date" value="' + esc(p.nextDate || '') + '"></label>' +
      '<label><span class="lbl">Hora</span><input id="pf-time" type="time" value="' + esc(p.nextTime || '') + '"></label></div></div>' +
      U.cell({ icon: 'cal', iconBg: 'bg-red', title: 'Recordatorio en el Calendario', sub: 'Al guardar · alerta 15 min antes', trailHtml: '<label class="switch"><input type="checkbox" id="pf-cal"' + (calOn || (src === 'later' && cfg.calDefault) ? ' checked' : '') + ' aria-label="Recordatorio en Calendario"><span></span></label>' }));
    body += U.group('Venta', '<div class="field"><div class="row2"><label><span class="lbl">Habladores comprados</span><input id="pf-units" type="number" inputmode="numeric" min="0" value="' + esc(p.units || '') + '"></label>' +
      '<label><span class="lbl">Monto $</span><input id="pf-amount" type="number" inputmode="decimal" min="0" step="0.01" value="' + esc(p.amount || '') + '"></label></div></div>');
    body += U.group('<span>Tu software</span>' + U.law('Ley 26'), sel('pf-soft', '¿Tiene interés?', ['No', 'Tal vez', 'Sí'], p.software || 'No') + sel('pf-softwhich', '¿Cuál?', C.SOFTS, p.softWhich, true));
    body += U.group('Notas', inp('pf-pre', 'Pre-mortem: ¿por qué se podría caer? (Ley 25)', p.premortem, { ph: 'Ej. El dueño casi nunca está' }) + area('pf-notes', 'Notas', p.notes, '', 3));
    if (!isNew) body += U.group('', U.cell({ act: 'p-delete', cls: 'danger', title: 'Eliminar cliente' }));
    return { title: isNew ? (src === 'later' ? 'Volver luego' : 'Nuevo cliente') : 'Editar', left: cancel(), right: save('p-save'), body: body };
  };

  // ---------- Cliente: ficha ----------
  function act(label, ic, o) {
    o = o || {};
    if (o.off) return '<span class="act off">' + icon(ic, 22, 2) + '<span>' + esc(label) + '</span></span>';
    if (o.href) return '<a class="act" data-act="link" href="' + esc(o.href) + '"' + (o.blank === false ? '' : ' target="_blank" rel="noopener"') + '>' + icon(ic, 22, 2) + '<span>' + esc(label) + '</span></a>';
    return '<button class="act" data-act="' + o.act + '" data-id="' + esc(o.id || '') + '">' + icon(ic, 22, 2) + '<span>' + esc(label) + '</span></button>';
  }

  SH.prospectDetail = function (p) {
    const wa = U.waLink(p);
    const tel = U.tel(p);
    const maps = N.mapsUrl(p);
    const pos = N.lastPos;
    const dist = pos && p.lat != null && p.lat !== '' ? N.fmtDist(N.distance(pos, p)) : '';
    let body = '<div class="profile">' + '<div id="det-avatar">' + U.avatar(p, true) + '</div><div class="name">' + esc(p.name) + '</div>' +
      '<div class="meta">' + esc([p.rubro, p.zone].filter(Boolean).join(' · ') || 'Sin rubro') + '</div><div class="mt8">' + U.pill(p.stage) + '</div></div>';
    body += '<div class="acts">' +
      act('WhatsApp', 'chat', { href: wa, off: !wa }) +
      act('Llamar', 'phone', { href: tel ? 'tel:' + tel : '', off: !tel, blank: false }) +
      act('Cómo llegar', 'nav', { href: maps, off: !maps }) +
      act('Calendario', 'cal', { act: 'act-cal', id: p.id, off: !p.nextDate }) +
      act('Contacto', 'contact', { act: 'act-vcf', id: p.id }) +
      act('Cotizar', 'cash', { act: 'quote-open', id: p.id }) + '</div>';

    body += '<div class="group-h" style="padding:0 32px 7px">Etapa</div><div class="hscroll" style="padding-bottom:26px">' +
      C.STAGES.map(s => '<button class="chip' + (p.stage === s ? ' on' : '') + '" data-act="p-stage" data-id="' + esc(p.id) + '" data-s="' + esc(s) + '">' + esc(s) + '</button>').join('') + '</div>';

    const open = p.stage !== 'Ganado' && p.stage !== 'Perdido';
    let seg = '';
    if (p.nextDate && open) {
      const overdue = p.nextDate < D.ymd();
      seg += U.cell({ act: 'p-edit', data: { id: p.id }, icon: 'clock', iconBg: overdue ? 'bg-red' : 'bg-orange', title: p.nextAction || 'Seguimiento', sub: U.relDate(p.nextDate) + (p.nextTime ? ' · ' + p.nextTime : '') + (overdue ? ' · atrasado' : ''), subWarn: overdue, chev: true });
      seg += U.cell({ act: 'act-cal', data: { id: p.id }, icon: 'cal', iconBg: 'bg-red', title: 'Agregar al Calendario', sub: 'Alerta 15 min antes', chev: true });
    } else {
      seg += U.cell({ act: 'p-edit', data: { id: p.id }, icon: 'cal', iconBg: 'bg-gray', title: 'Agendar seguimiento', chev: true });
    }
    body += U.group('Seguimiento', seg);

    let info = '';
    if (p.contact) info += U.cell({ icon: 'person', iconBg: 'bg-gray', title: p.contact, sub: 'Contacto' });
    if (tel) info += U.cell({ href: 'tel:' + tel, attrs: 'data-act="link"', icon: 'phone', iconBg: 'bg-green', title: p.phone, sub: 'Teléfono', chev: true });
    if (p.zone || maps) info += U.cell({ href: maps, attrs: 'data-act="link"', icon: 'pin', iconBg: 'bg-blue', title: p.zone || 'Ubicación guardada', sub: dist ? 'A ' + dist + ' de ti' : 'Abrir en Apple Maps', chev: !!maps });
    const softHint = C.RUBRO_SOFT[p.rubro];
    if (p.software && p.software !== 'No') info += U.cell({ icon: 'star', iconBg: 'bg-pink', title: 'Interés en software: ' + p.software, sub: p.softWhich || '' });
    else if (softHint) info += U.cell({ icon: 'bulb', iconBg: 'bg-yellow', title: 'Ofrécele tu software de ' + softHint, sub: 'Pregunta cómo maneja pedidos, citas o ventas' });
    if (p.units || p.amount) info += U.cell({ icon: 'cash', iconBg: 'bg-green', title: 'Compró ' + (Number(p.units) || 0) + ' hablador(es)', trail: money(p.amount) });
    if (p.premortem) info += U.cell({ icon: 'warn', iconBg: 'bg-orange', title: p.premortem, sub: 'Pre-mortem' });
    if (p.notes) info += U.cell({ icon: 'doc', iconBg: 'bg-gray', title: p.notes, sub: 'Notas' });
    if (info) body += U.group('Información', info, p.created ? 'Registrado el ' + esc(U.fmtDate(D.ymd(new Date(p.created)))) + '.' : '');

    body += U.group('Fotos', '<div id="det-photos"></div>' +
      '<label class="cell tap inset-icon" for="photo-input"><span class="ico bg-indigo">' + icon('camera', 19, 2) + '</span><span class="main"><span class="t" style="display:block">Tomar o elegir foto</span><span class="s" style="display:block">Del local o del logo, para diseñar su perfil</span></span></label>' +
      '<input id="photo-input" class="sr" type="file" accept="image/*" data-id="' + esc(p.id) + '">',
      'Las fotos se guardan solo en este iPhone.');
    return { title: '', left: close(), right: '<button class="nav-btn" data-act="p-edit" data-id="' + esc(p.id) + '">Editar</button>', body: body };
  };

  // ---------- Cotización ----------
  SH.quote = function (p) {
    const body = '<img id="quote-img" class="quote-img" alt="Vista previa de la cotización">' +
      U.group('', inp('q-business', 'Para (nombre del negocio)', p ? p.name : '', { ph: 'Opcional', auto: 'off' })) +
      '<div class="pad btns"><button class="btn" id="q-share" data-act="quote-share" disabled>' + icon('share', 20, 2) + ' Compartir imagen</button>' +
      '<a class="btn green" id="q-wa" data-act="link" target="_blank" rel="noopener" href="#">' + icon('chat', 20, 2) + ' Enviar texto por WhatsApp</a>' +
      '<button class="btn gray" data-act="quote-copy">' + icon('copy', 20, 2) + ' Copiar texto</button></div>' +
      '<div class="center-note mt12">Compartir imagen abre la hoja de Compartir: elige WhatsApp y el chat del cliente. Ley 15 · el marco importa.</div>';
    return { title: 'Cotización', left: close(), body: body };
  };

  // ---------- Objeción ----------
  SH.objection = function (i) {
    const o = C.OBJECTIONS[i];
    const body = '<div class="pad"><h2 style="margin:0 0 6px;font-size:24px">«' + esc(o.obj) + '»</h2><div style="margin-bottom:12px">' + U.law('Ley 3 · Nunca discutas') + '</div>' +
      '<div class="say"><span class="tag">1 · Acuerdo</span>' + esc(o.agree) + '</div>' +
      '<div class="say"><span class="tag">2 · Reencuadre</span>' + esc(o.reframe) + '</div>' +
      '<div class="say"><span class="tag">3 · Cierre de sí o no</span>' + esc(o.close) + '</div>' +
      '<p class="muted mt12">Nunca empieces con "no, pero…". Si empiezas llevando la contraria, deja de escucharte.</p></div>';
    return { title: 'Objeción', left: close(), body: body };
  };

  // ---------- Corregir registros de un día ----------
  SH.dayEdit = function (date) {
    const x = S.getDay(date);
    const min = S.minVisits(x);
    let body = U.group('', '<label class="field"><span class="lbl">Día</span><input id="de-date" type="date" value="' + esc(date) + '" max="' + D.ymd() + '"></label>');
    body += U.group('Contadores',
      U.cell({ icon: 'store', iconBg: 'bg-blue', title: 'Visitas', trailHtml: U.stepper('de-step', { k: 'visits' }, x.visits) }) +
      U.cell({ icon: 'tap', iconBg: 'bg-indigo', title: 'Demos', trailHtml: U.stepper('de-step', { k: 'demos' }, x.demos) }) +
      U.cell({ icon: 'again', iconBg: 'bg-gray', title: 'Volver', trailHtml: U.stepper('de-step', { k: 'laters' }, x.laters) }),
      'Las visitas no pueden ser menos que demos, ni que ventas + "no" + volver (mínimo ' + min + ').');
    const sales = x.salesLog.map((s, i) => U.cell({ title: (Number(s.units) || 0) + ' u · ' + money(s.amount), sub: [s.pkg, hhmm(s.at)].filter(Boolean).join(' · '), trailHtml: '<button class="trash-btn" data-act="de-del-sale" data-i="' + i + '" aria-label="Eliminar venta">' + icon('trash', 20, 2) + '</button>' })).join('');
    body += U.group('Ventas (' + x.salesLog.length + ')', sales || U.cell({ title: 'Sin ventas este día', cls: '' }));
    const nos = x.rejLog.map((r, i) => U.cell({ title: r.reason, sub: hhmm(r.at), trailHtml: '<button class="trash-btn" data-act="de-del-no" data-i="' + i + '" aria-label="Eliminar no">' + icon('trash', 20, 2) + '</button>' })).join('');
    body += U.group('"No" anotados (' + x.rejLog.length + ')', nos || U.cell({ title: 'Sin "no" este día' }), 'Al eliminar algo aparece «Deshacer» por unos segundos.');
    return { title: 'Corregir registros', left: '', right: U.navBtn('sheet-close', '<b>Listo</b>', 'Listo'), body: body };
  };

  // ---------- Experimentos ----------
  SH.exp = function (e) {
    e = e || {};
    const isNew = !e.id;
    let body = '<div class="pad muted" style="margin-bottom:14px">' + U.law('Ley 21') + ' Una sola cosa a la vez, durante una semana o 20 visitas.</div>';
    body += U.group('', inp('ef-title', 'Qué pruebo *', e.title, { auto: 'off' }) + area('ef-hyp', 'Hipótesis: si hago X, entonces Y sube', e.hypothesis, '', 3) +
      '<div class="field"><div class="row2"><label><span class="lbl">Métrica</span><input id="ef-metric" value="' + esc(e.metric || '') + '"></label><label><span class="lbl">Inicio</span><input id="ef-start" type="date" value="' + esc(e.start || D.ymd()) + '"></label></div></div>' +
      sel('ef-status', 'Estado', ['Corriendo', 'Funcionó', 'No funcionó'], e.status || 'Corriendo') +
      area('ef-result', 'Resultado / aprendizaje', e.result, 'Qué pasó con la métrica y qué haces ahora', 3));
    if (!isNew) body += U.group('', U.cell({ act: 'exp-delete', cls: 'danger', title: 'Eliminar experimento' }));
    return { title: isNew ? 'Nuevo experimento' : 'Experimento', left: cancel(), right: save('exp-save'), body: body };
  };

  // ---------- Revisión guardada ----------
  SH.review = function (r) {
    let body = '';
    if (r.stats) body += '<div class="card"><div class="strip" style="margin:0;border:0;padding:0"><div><div class="v">' + r.stats.visits + '</div><div class="k">visitas</div></div><div><div class="v">' + r.stats.sales + '</div><div class="k">ventas</div></div><div><div class="v">' + money(r.stats.revenue) + '</div><div class="k">ingreso</div></div></div></div>';
    const cells = C.REVIEW_FIELDS.filter(f => r[f[0]]).map(f => U.cell({ title: r[f[0]], sub: f[1] })).join('');
    body += U.group('', cells || U.cell({ title: 'Sin respuestas' }));
    body += U.group('', U.cell({ act: 'review-del', data: { id: r.id }, cls: 'danger', title: 'Eliminar revisión' }));
    return { title: U.fmtDate(r.date), left: close(), body: body };
  };

  // ---------- Ajustes ----------
  SH.pkg = function (i) {
    const p = S.state.config.packages[i];
    const body = U.group(i === 1 ? 'Paquete recomendado' : 'Paquete', inp('pk-name', 'Nombre', p.name) +
      '<div class="field"><div class="row2"><label><span class="lbl">Unidades</span><input id="pk-units" type="number" inputmode="numeric" min="1" value="' + esc(p.units) + '"></label>' +
      '<label><span class="lbl">Precio $</span><input id="pk-price" type="number" inputmode="decimal" min="0" step="0.01" value="' + esc(p.price) + '"></label></div></div>' +
      inp('pk-desc', 'Descripción', p.desc), 'Ley 16 · El del medio debe costar más que el básico pero quedar lejos del más caro.');
    return { title: p.name, left: cancel(), right: save('pkg-save', ' data-i="' + i + '"'), body: body };
  };

  SH.questions = function () {
    const body = U.group('', area('q-text', 'Una pregunta por línea', S.state.config.questions.join('\n'), '', 9), 'Hazlas de sí o no (Ley 6). Empieza con "¿Hice…?" o "¿Cumplí…?".');
    return { title: 'Preguntas', left: cancel(), right: save('q-save'), body: body };
  };

  // ---------- Bienvenida ----------
  SH.onboarding = function (step, draft) {
    let b = '<div class="onb">';
    if (step === 1) {
      b += '<div class="onb-ico">' + icon('target', 38, 2) + '</div><div class="step">Paso 1 de 3</div><h2>Tu Sistema CEO</h2><p>Configura lo básico en un minuto. Todo se guarda solo en este iPhone.</p></div>';
      b += U.group('', inp('ob-name', 'Tu nombre', draft.name, { auto: 'name' }) + inp('ob-phone', 'Tu WhatsApp', draft.phone, { type: 'tel', inputmode: 'tel', ph: '09XXXXXXXX' }), 'Aparece en tus mensajes y cotizaciones.');
      b += '<div class="pad btns"><button class="btn" data-act="onb-next" data-step="2">Continuar</button></div>';
    } else if (step === 2) {
      b += '<div class="onb-ico">' + icon('cash', 38, 2) + '</div><div class="step">Paso 2 de 3</div><h2>Tus números</h2><p>Ley 23 · Sin tu costo real no sabes cuánto ganas.</p></div>';
      b += U.group('', '<div class="field"><div class="row2"><label><span class="lbl">Precio por hablador $</span><input id="ob-price" type="number" inputmode="decimal" min="0" step="0.01" value="' + esc(draft.price) + '"></label>' +
        '<label><span class="lbl">Tu costo real $</span><input id="ob-cost" type="number" inputmode="decimal" min="0" step="0.01" value="' + esc(draft.cost || '') + '" placeholder="Acrílico + vinil + NFC"></label></div></div>',
        'Podrás cambiarlo después en Meta.');
      b += '<div class="pad btns"><button class="btn" data-act="onb-next" data-step="3">Continuar</button><button class="btn plain" data-act="onb-next" data-step="1">Atrás</button></div>';
    } else {
      b += '<div class="onb-ico">' + icon('store', 38, 2) + '</div><div class="step">Paso 3 de 3</div><h2>Tu compromiso</h2><p>Ley 6 · ¿A cuántos negocios vas a entrar cada día?</p></div>';
      b += U.group('', U.cell({ title: 'Visitas por día', trailHtml: U.stepper('ob-goal', {}, draft.goal) }) +
        '<div class="cell" style="display:block"><div class="t" style="margin-bottom:8px">Días de trabajo</div><div class="day-chips">' +
        [1, 2, 3, 4, 5, 6, 0].map(d => '<button class="chip' + (draft.days.indexOf(d) !== -1 ? ' on' : '') + '" data-act="ob-dow" data-d="' + d + '">' + C.DOW[d] + '</button>').join('') + '</div></div>',
        'Con 5 horas al día, entre 15 y 20 visitas es un buen punto de partida. Ajusta con tus datos.');
      b += '<div class="pad btns"><button class="btn green" data-act="onb-done">Empezar</button><button class="btn plain" data-act="onb-next" data-step="2">Atrás</button></div>';
    }
    return { title: '', left: '', right: step === 1 ? U.navBtn('onb-skip', 'Omitir', 'Omitir') : '', body: b, locked: true };
  };

  window.SHEETS = SH;
})();

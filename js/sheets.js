/* Hojas inferiores (bottom sheets). Cada función devuelve {title, left, right, body, cls, locked}. */
'use strict';

(function () {
  const C = window.CONTENT;
  const S = window.STORE;
  const N = window.NATIVE;
  const U = window.U;
  const D = S.dates;
  const esc = U.esc, money = U.money, icon = U.icon, pct = U.pct;

  const cancel = () => U.navBtn('sheet-close', 'Cancelar', 'Cancelar');
  const close = () => U.navBtn('sheet-close', 'Cerrar', 'Cerrar');
  const save = (act, extra) => '<button class="nav-btn bold" data-act="' + act + '"' + (extra || '') + '>Guardar</button>';
  const backTo = (id, label) => U.navBtn('p-open', icon('back', 22, 2.4) + (label || 'Ficha'), 'Volver a la ficha', ' data-id="' + esc(id) + '"');
  const opts = (list, cur) => list.map(x => '<option' + (x === cur ? ' selected' : '') + '>' + esc(x) + '</option>').join('');
  const selIc = '<span class="selic">' + icon('chevDown', 16, 2.2) + '</span>';
  const hhmm = at => { try { return new Date(at).toLocaleTimeString('es-EC', { hour: '2-digit', minute: '2-digit' }); } catch (e) { return ''; } };
  const sw = (id, on, label) => '<label class="switch"><input type="checkbox" id="' + id + '"' + (on ? ' checked' : '') + ' aria-label="' + esc(label) + '"><span></span></label>';

  function inp(id, label, value, o) {
    o = o || {};
    return '<label class="field"><span class="lbl"' + (o.lblId ? ' id="' + o.lblId + '"' : '') + '>' + esc(label) + '</span><input id="' + id + '" type="' + (o.type || 'text') + '"' +
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

  // Voss · casilla para medir si el resumen con "así es" da más ventas.
  function asiSwitch(on) {
    return U.group('', U.cell({ icon: 'handshake', iconBg: 'bg-purple', title: 'Hice el resumen y dijo «así es»', sub: 'Voss · para medir si cierras más así', trailHtml: sw('asi-sw', on, 'Dijo así es') }));
  }

  // ---------- Ventas y "no" ----------
  SH.sale = function (asi) {
    const cfg = S.state.config;
    const body = asiSwitch(asi) +
      U.group('<span>¿Qué se llevó?</span>' + U.law('De mayor a menor'), cfg.packages.map((p, i) => ({ p: p, i: i })).reverse().map(o => {
        const p = o.p, i = o.i;
        const u = Number(p.units) || 0;
        return U.cell({ act: 'sale-pkg', data: { i: i }, icon: 'cash', iconBg: i === 1 ? 'bg-green' : 'bg-gray', title: p.name + (i === 1 ? ' · recomendado' : ''), sub: u + ' hablador' + (u === 1 ? '' : 'es'), trailHtml: '<b style="color:var(--label)">' + money(p.price) + '</b>', chev: true });
      }).join('')) +
      U.group('Otra cantidad', '<div class="field"><div class="row2"><label><span class="lbl">Unidades</span><input id="sc-u" type="number" inputmode="numeric" min="1" step="1" value="1"></label>' +
        '<label><span class="lbl">Total $</span><input id="sc-a" type="number" inputmode="decimal" min="0" step="0.01" value="' + (Number(cfg.unitPrice) || 0) + '"></label></div></div>') +
      '<div class="pad btns"><button class="btn green" data-act="sale-custom">Guardar venta</button></div>';
    return { title: 'Registrar venta', left: cancel(), body: body };
  };

  SH.saleDone = function (units, amount, bumped) {
    const f = S.founders();
    let body = '<div class="done-hero"><div class="circle">' + icon('check', 40, 2.6) + '</div><h2>Venta registrada</h2>' +
      '<div class="muted">' + units + ' hablador' + (units === 1 ? '' : 'es') + ' · ' + money(amount) + (bumped ? ' · visita sumada' : '') + '</div></div>';
    body += '<div class="card">' + U.law('Voss · un «sí» sin el «cómo» no vale') + '<p class="tip-body">Pregúntale ahora:</p><ul class="qlist">' +
      C.POST_Q.map(q => '<li>' + esc(q[1]) + '</li>').join('') + '</ul></div>';
    if (f < C.FOUNDERS_MAX) {
      body += '<div class="card">' + U.law('Cialdini · cliente fundador ' + (f + 1) + ' de ' + C.FOUNDERS_MAX) +
        '<p class="tip-body">Ofrécele el diseño gratis a cambio de permiso para mencionarlo y una foto con el hablador. Marca «Cliente fundador» en su ficha.</p></div>';
    }
    body += '<div class="card">' + U.law('Ley 13 · pico-final · Cialdini · referidos') + '<p class="tip-body">Termina bien: "¿A qué otro negocio de la zona le serviría?" y "¿Cómo maneja sus pedidos o citas?". Ahí están tu próximo cliente y tu software.</p></div>';
    body += '<div class="pad btns"><button class="btn" data-act="self-open" data-u="' + units + '" data-a="' + amount + '">' + icon('pen', 20, 2) + ' Que el cliente llene sus datos</button>' +
      '<button class="btn tinted" data-act="p-new-won" data-u="' + units + '" data-a="' + amount + '">' + icon('person', 20, 2) + ' Los lleno yo</button>' +
      '<button class="btn gray" data-act="sheet-close">Listo</button>' +
      '<button class="btn plain red" data-act="undo-last">Deshacer venta</button></div>';
    return { title: '', left: '', right: close(), body: body };
  };

  // Paso 1: tipo de "no" (Blount). Paso 2: razón.
  SH.no = function (type, asi) {
    if (!type) {
      const body = '<div class="pad muted" style="margin-bottom:16px">' + U.law('Blount · 3 tipos de «no»') + ' ¿Qué tipo de "no" fue?</div>' +
        U.group('', C.NO_TYPES.map(t => U.cell({ act: 'no-type', data: { k: t.k }, title: t.t, sub: t.d, chev: true })).join(''), 'Ley 21 · No es un fracaso: es un dato.');
      return { title: 'Me dijo que no', left: cancel(), body: body };
    }
    const nt = C.NO_TYPES.find(x => x.k === type) || C.NO_TYPES[0];
    let body = '<div class="card">' + U.law('Blount · ' + nt.t) + '<p class="tip-body">' + esc(nt.tip) + '</p></div>' + asiSwitch(asi) +
      U.group('¿Cuál fue la razón?', nt.reasons.map(r => U.cell({ act: 'no-reason', data: { r: r }, title: r, chev: true })).join(''));
    if (type === 'evasiva') {
      body += U.group('', U.cell({ act: 'no-to-later', icon: 'again', iconBg: 'bg-gray', title: 'Mejor regístralo como «Volver»', sub: 'Con día, hora y motivo, para no perderlo', chev: true }));
    }
    return { title: nt.t, left: U.navBtn('no-back', icon('back', 22, 2.4) + 'Tipos', 'Volver a los tipos'), body: body };
  };

  // ---------- Cliente: formulario ----------
  SH.prospectForm = function (p, src) {
    p = p || {};
    const isNew = !p.id;
    const cfg = S.state.config;
    const later = src === 'later';
    const hasLoc = p.lat != null && p.lat !== '';
    const calOn = p.nextDate && !later ? false : !!cfg.calDefault;
    const why = C.VOLVER_WHY.find(x => x.k === p.why);
    const ot = C.OWNER_TYPES.find(x => x.k === p.ownerType);
    let body = '';

    if (later || p.why || p.stage === 'Seguimiento') {
      body += U.group('<span>¿Por qué vuelves?' + (later ? ' *' : '') + '</span>' + U.law('Voss · sí falso'),
        '<input type="hidden" id="pf-why" value="' + esc(p.why || '') + '">' +
        '<div class="cell" style="display:block"><div class="chips-wrap">' + C.VOLVER_WHY.map(w =>
          '<button type="button" class="chip w-' + w.temp + (p.why === w.k ? ' on' : '') + '" data-act="pf-why" data-k="' + w.k + '">' + esc(w.t) + '</button>').join('') + '</div></div>' +
        '<div class="field" id="pf-why-wrap"' + (why ? '' : ' style="display:none"') + '><div class="hint" id="pf-why-hint">' + (why ? esc(why.hint) : '') + '</div></div>',
        'Los "sí" falsos (tiene razón, lo intento, lo voy a pensar, pase cuando quiera) quedan marcados como fríos.');
    }

    body += U.group('Negocio', inp('pf-name', 'Nombre del negocio *', p.name, { ph: 'Ej. Cafetería La Esquina', auto: 'off' }) +
      sel('pf-rubro', 'Rubro', C.RUBROS, p.rubro, true) + '<div class="field" id="pf-hint-wrap" style="display:none"><div class="hint" id="pf-hint"></div></div>');
    body += U.group('Contacto', inp('pf-contact', p.why === 'dueno' ? 'Nombre del dueño' : 'Persona de contacto', p.contact, { auto: 'off', lblId: 'pf-contact-lbl' }) +
      inp('pf-phone', 'WhatsApp / teléfono', p.phone, { type: 'tel', inputmode: 'tel', ph: '09XXXXXXXX', auto: 'off' }) +
      sel('pf-source', '¿De dónde vino?', C.SOURCES, p.source || (isNew ? 'Calle' : ''), true) +
      '<div id="pf-ref-wrap"' + (p.source === 'Referido' ? '' : ' style="display:none"') + '>' + inp('pf-ref', 'Referido por', p.referredBy, { ph: 'Ej. Don Luis, de la Panadería Central', auto: 'off' }) + '</div>');
    body += U.group('Ubicación', inp('pf-zone', 'Dirección o zona', p.zone, { ph: 'Calle, barrio', auto: 'off' }) +
      '<input type="hidden" id="pf-lat" value="' + esc(hasLoc ? p.lat : '') + '"><input type="hidden" id="pf-lng" value="' + esc(hasLoc ? p.lng : '') + '"><input type="hidden" id="pf-acc" value="' + esc(p.acc || '') + '">' +
      U.cell({ act: 'p-geo', icon: 'nav', iconBg: 'bg-blue', title: hasLoc ? 'Actualizar con mi ubicación' : 'Usar mi ubicación actual', subHtml: '<span id="pf-geo-status">' + (hasLoc ? 'Ubicación guardada' + (p.acc ? ' (±' + esc(p.acc) + ' m)' : '') : 'Para la ruta, Apple Maps y «Clientes cerca»') + '</span>' }));
    body += U.group('<span>Seguimiento</span>' + U.law('Ley 20 · Blount'), sel('pf-stage', 'Etapa', C.STAGES, p.stage || 'Visitado') +
      inp('pf-next', 'Próxima acción', p.nextAction, { ph: 'Ej. Volver a mostrarle su perfil', auto: 'off' }) +
      '<div class="field"><div class="row2"><label><span class="lbl">Fecha' + (later ? ' *' : '') + '</span><input id="pf-date" type="date" value="' + esc(p.nextDate || '') + '"></label>' +
      '<label><span class="lbl">Hora' + (later ? ' *' : '') + '</span><input id="pf-time" type="time" value="' + esc(p.nextTime || '') + '"></label></div></div>' +
      U.cell({ icon: 'cal', iconBg: 'bg-red', title: 'Recordatorio en el Calendario', sub: 'Al guardar · alerta 15 min antes', trailHtml: sw('pf-cal', calOn, 'Recordatorio en Calendario') }),
      later ? 'Blount · «Cuando quiera» no es una cita: pide día y hora.' : '');
    body += U.group('<span>Venta consultiva</span>' + U.law('Voss'),
      sel('pf-otype', 'Tipo de dueño', C.OWNER_TYPES.map(x => x.k), p.ownerType, true) +
      '<div class="field" id="pf-otype-wrap"' + (ot ? '' : ' style="display:none"') + '><div class="hint" id="pf-otype-hint">' + (ot ? esc(ot.tip) : '') + '</div></div>' +
      inp('pf-deciders', '¿Quién más decide?', p.deciders, { ph: 'Ej. Su socio, su esposa', auto: 'off' }) +
      inp('pf-key', 'Dato clave (lo inesperado que cambia la venta)', p.keyFact, { ph: 'Ej. Abre otro local en marzo', auto: 'off' }));
    const post = p.post || {};
    body += U.group('Venta', '<div class="field"><div class="row2"><label><span class="lbl">Habladores comprados</span><input id="pf-units" type="number" inputmode="numeric" min="0" value="' + esc(p.units || '') + '"></label>' +
      '<label><span class="lbl">Monto $</span><input id="pf-amount" type="number" inputmode="decimal" min="0" step="0.01" value="' + esc(p.amount || '') + '"></label></div></div>' +
      '<div id="pf-post"' + (p.stage === 'Ganado' ? '' : ' style="display:none"') + '>' + C.POST_Q.map(q => inp('pf-post-' + q[0], q[1], post[q[0]], { ph: q[2], auto: 'off' })).join('') + '</div>',
      p.stage === 'Ganado' ? 'Voss · un «sí» sin el «cómo» no vale.' : '');
    body += U.group('<span>Referencia</span>' + U.law('Cialdini'),
      U.cell({ icon: 'star', iconBg: 'bg-yellow', title: 'Cliente fundador', sub: 'De los primeros ' + C.FOUNDERS_MAX + ' · llevas ' + S.founders(), trailHtml: sw('pf-founder', !!p.founder, 'Cliente fundador') }) +
      U.cell({ icon: 'handshake', iconBg: 'bg-green', title: 'Puedo mencionarlo', sub: 'Me dio permiso para usarlo de referencia', trailHtml: sw('pf-mention', !!p.mentionOk, 'Puedo mencionarlo') }));
    body += U.group('<span>Tu software</span>' + U.law('Ley 26'), sel('pf-soft', '¿Tiene interés?', ['No', 'Tal vez', 'Sí'], p.software || 'No') + sel('pf-softwhich', '¿Cuál?', C.SOFTS, p.softWhich, true));
    body += U.group('Notas', inp('pf-pre', 'Pre-mortem: ¿por qué se podría caer? (Ley 25)', p.premortem, { ph: 'Ej. El dueño casi nunca está' }) + area('pf-notes', 'Notas', p.notes, '', 3));
    if (!isNew) body += U.group('', U.cell({ act: 'p-delete', cls: 'danger', title: 'Eliminar cliente' }));
    const title = isNew ? (later ? 'Volver luego' : src === 'won' ? 'Cliente nuevo' : src === 'ref' ? 'Negocio referido' : 'Nuevo cliente') : 'Editar';
    return { title: title, left: cancel(), right: save('p-save'), body: body };
  };

  // ---------- Cliente: ficha ----------
  function act(label, ic, o) {
    o = o || {};
    if (o.off) return '<span class="act off">' + icon(ic, 22, 2) + '<span>' + esc(label) + '</span></span>';
    if (o.href) return '<a class="act" data-act="link" href="' + esc(o.href) + '"' + (o.blank === false ? '' : ' target="_blank" rel="noopener"') + '>' + icon(ic, 22, 2) + '<span>' + esc(label) + '</span></a>';
    return '<button class="act" data-act="' + o.act + '" data-id="' + esc(o.id || '') + '">' + icon(ic, 22, 2) + '<span>' + esc(label) + '</span></button>';
  }

  SH.prospectDetail = function (p) {
    const tel = U.tel(p);
    const maps = N.mapsUrl(p);
    const pos = N.lastPos;
    const dist = pos && p.lat != null && p.lat !== '' ? N.fmtDist(N.distance(pos, p)) : '';
    const open = p.stage !== 'Ganado' && p.stage !== 'Perdido';
    const why = C.VOLVER_WHY.find(x => x.k === p.why);
    const pills = U.pill(p.stage) + (open ? U.tempPill(p.temp) : '') + (p.founder ? '<span class="pill founder">Fundador</span>' : '');
    let body = '<div class="profile">' + '<div id="det-avatar">' + U.avatar(p, true) + '</div><div class="name">' + esc(p.name) + '</div>' +
      '<div class="meta">' + esc([p.rubro, p.zone].filter(Boolean).join(' · ') || 'Sin rubro') + '</div><div class="mt8 pills">' + pills + '</div></div>';
    body += '<div class="acts four">' +
      act('Mensajes', 'chat', { act: 'msg-open', id: p.id }) +
      act('Llamar', 'phone', { href: tel ? 'tel:' + tel : '', off: !tel, blank: false }) +
      act('Llegar', 'nav', { href: maps, off: !maps }) +
      act('Calendario', 'cal', { act: 'act-cal', id: p.id, off: !p.nextDate }) +
      act('Contacto', 'contact', { act: 'act-vcf', id: p.id }) +
      act('Cotizar', 'cash', { act: 'quote-open', id: p.id }) +
      act('Que llene', 'pen', { act: 'self-open', id: p.id }) +
      act('Software', 'doc', { act: 'pliego-open', id: p.id }) + '</div>';

    body += '<div class="group-h" style="padding:0 32px 7px">Etapa</div><div class="hscroll" style="padding-bottom:26px">' +
      C.STAGES.map(s => '<button class="chip' + (p.stage === s ? ' on' : '') + '" data-act="p-stage" data-id="' + esc(p.id) + '" data-s="' + esc(s) + '">' + esc(s) + '</button>').join('') + '</div>';

    if (open && why) {
      body += '<div class="card' + (why.temp === 'frio' ? ' cold' : '') + '">' + U.law('Voss · ' + why.t) + '<p class="tip-body">' + esc(why.hint) + '</p></div>';
    }
    if (open && p.source === 'Referido' && p.referredBy) {
      body += '<div class="card">' + U.law('Cialdini · referido') + '<p class="tip-body">Entra con: "' + esc(p.referredBy) + ' me dijo que le preguntara a usted."</p></div>';
    }

    let seg = '';
    if (S.isPending(p)) {
      const overdue = p.nextDate < D.ymd();
      seg += U.cell({ act: 'p-edit', data: { id: p.id }, icon: 'clock', iconBg: overdue ? 'bg-red' : 'bg-orange', title: p.nextAction || 'Seguimiento', sub: U.relDate(p.nextDate) + (p.nextTime ? ' · ' + p.nextTime : ' · sin hora') + (overdue ? ' · atrasado' : ''), subWarn: overdue, chev: true });
      seg += U.cell({ act: 'act-cal', data: { id: p.id }, icon: 'cal', iconBg: 'bg-red', title: 'Agregar al Calendario', sub: 'Alerta 15 min antes', chev: true });
      seg += U.cell({ act: 'p-done', data: { id: p.id }, icon: 'check', iconBg: 'bg-green', title: 'Marcar como hecho', sub: 'Quita el pendiente de Hoy' });
    } else {
      seg += U.cell({ act: 'p-edit', data: { id: p.id }, icon: 'cal', iconBg: 'bg-gray', title: 'Agendar seguimiento', sub: 'Con día y hora (Blount)', chev: true });
    }
    body += U.group('Seguimiento', seg);

    const nr = Number(p.noReply) || 0;
    let msgs = U.cell({ act: 'msg-open', data: { id: p.id }, icon: 'chat', iconBg: 'bg-green', title: 'Plantillas de WhatsApp', sub: (Number(p.msgs) || 0) + ' enviado' + ((Number(p.msgs) || 0) === 1 ? '' : 's') + (p.lastMsg ? ' · último ' + U.relDate(D.ymd(new Date(p.lastMsg))) : ''), chev: true });
    if (nr > 0) {
      msgs += U.cell({ icon: nr >= 2 ? 'warn' : 'clock', iconBg: nr >= 2 ? 'bg-orange' : 'bg-gray', title: nr + ' sin respuesta', sub: nr >= 2 ? 'Manda el «¿Ya descartó…?»' : 'Si te responde, márcalo', trailHtml: '<button class="btn sm tinted" data-act="msg-replied" data-id="' + esc(p.id) + '">Respondió</button>' });
    }
    body += U.group('Mensajes', msgs);

    if (p.stage === 'Ganado') {
      const post = p.post || {};
      let pv = C.POST_Q.map(q => U.cell({ act: 'p-edit', data: { id: p.id }, icon: post[q[0]] ? 'check' : 'info', iconBg: post[q[0]] ? 'bg-green' : 'bg-gray', title: post[q[0]] || 'Sin respuesta', sub: q[1], chev: true })).join('');
      const d7 = p.wonAt ? D.addDays(p.wonAt, 7) : '';
      pv += U.cell({ act: 'msg-open', data: { id: p.id, k: 'resultados' }, icon: 'chart', iconBg: p.resultsAsked ? 'bg-green' : 'bg-blue', title: p.resultsAsked ? 'Resultados preguntados' : 'Preguntar resultados a los 7 días', sub: !p.resultsAsked && d7 ? 'Te lo recuerdo en Hoy el ' + U.fmtDate(d7) : '', chev: true });
      pv += U.cell({ act: 'msg-open', data: { id: p.id, k: 'pedirRef' }, icon: 'users', iconBg: p.refAsked ? 'bg-green' : 'bg-teal', title: p.refAsked ? 'Referido pedido' : 'Pedir un referido', chev: true });
      pv += U.cell({ act: 'p-new-ref', data: { id: p.id }, icon: 'plus', iconBg: 'bg-blue', title: 'Registrar negocio referido', sub: 'Queda como «Referido por ' + (p.name || '') + '»', chev: true });
      body += U.group('<span>Después de la venta</span>' + U.law('Voss · Cialdini'), pv, 'Si lo usa, tienes resultados que mostrar y más referidos.');
    }

    let info = '';
    if (p.contact) info += U.cell({ icon: 'person', iconBg: 'bg-gray', title: p.contact, sub: p.why === 'dueno' ? 'Dueño' : 'Contacto' });
    if (tel) info += U.cell({ href: 'tel:' + tel, attrs: 'data-act="link"', icon: 'phone', iconBg: 'bg-green', title: p.phone, sub: 'Teléfono', chev: true });
    if (p.zone || maps) info += U.cell({ href: maps, attrs: 'data-act="link"', icon: 'pin', iconBg: 'bg-blue', title: p.zone || 'Ubicación guardada', sub: dist ? 'A ' + dist + ' de ti' : 'Abrir en Apple Maps', chev: !!maps });
    const ot = C.OWNER_TYPES.find(x => x.k === p.ownerType);
    if (ot) info += U.cell({ icon: 'person', iconBg: 'bg-indigo', title: 'Dueño ' + ot.k.toLowerCase(), sub: ot.tip });
    if (p.deciders) info += U.cell({ icon: 'users', iconBg: 'bg-gray', title: p.deciders, sub: 'También decide' });
    if (p.keyFact) info += U.cell({ icon: 'bulb', iconBg: 'bg-yellow', title: p.keyFact, sub: 'Dato clave' });
    if (p.source) info += U.cell({ icon: 'flag', iconBg: 'bg-teal', title: p.source + (p.source === 'Referido' && p.referredBy ? ' por ' + p.referredBy : ''), sub: '¿De dónde vino?' });
    const pr = p.profile;
    if (pr && Object.keys(pr).some(k => pr[k])) {
      info += U.cell({ act: 'self-open', data: { id: p.id }, icon: 'pen', iconBg: 'bg-purple', title: 'Datos que llenó el cliente', sub: [pr.instagram, pr.hours, pr.highlight].filter(Boolean).join(' · ') || 'Ver', chev: true });
    }
    if (p.pliego && p.pliego.low) info += U.cell({ act: 'pliego-open', data: { id: p.id }, icon: 'doc', iconBg: 'bg-purple', title: 'Pliego: ' + money(p.pliego.low) + ' a ' + money(p.pliego.high), sub: p.pliego.goal || 'Software', chev: true });
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

  // ---------- Plantillas de WhatsApp ----------
  function templateOrder(p, focus) {
    let ks = [];
    if (p.stage === 'Ganado') ks = ['gracias', 'resultados', 'pedirRef'];
    else {
      if ((Number(p.noReply) || 0) >= 2) ks.push('descarto');
      if (p.source === 'Referido' || p.referredBy) ks.push('referido');
      if (p.why === 'dueno') ks.push('dueno');
      if (p.nextDate && p.nextTime) ks.push('cita');
      ks.push('seg24', 'dueno', 'cita');
    }
    if (focus) ks.unshift(focus);
    return ks.filter((k, i) => ks.indexOf(k) === i && C.TEMPLATES.some(t => t.k === k));
  }

  SH.messages = function (p, focus, fromDetail) {
    const phone = S.waNumber(p.phone);
    const nr = Number(p.noReply) || 0;
    let body = '<div class="pad muted" style="margin-bottom:14px">' + (phone ? 'Toca un mensaje para abrirlo en WhatsApp con ' + esc(p.contact || p.name) + '. Puedes editarlo antes de enviarlo.' : 'Sin teléfono guardado: WhatsApp te pedirá elegir el chat.') + '</div>';
    body += U.group('Sugeridos', templateOrder(p, focus).map(k => {
      const t = C.TEMPLATES.find(x => x.k === k);
      const text = U.tplText(k, p);
      const sent = p.sent && p.sent[k];
      return '<a class="cell tap msg-cell' + (k === focus ? ' focus' : '') + '" data-act="msg-send" data-id="' + esc(p.id) + '" data-k="' + k + '" href="' + esc(N.waUrl(p.phone, text)) + '" target="_blank" rel="noopener">' +
        '<span class="main"><span class="t" style="display:block">' + esc(t.t) + (sent ? ' <span class="pill s4">Enviado</span>' : '') + '</span>' +
        '<span class="s" style="display:block">' + esc(t.d) + '</span><span class="msg-prev">' + esc(text) + '</span></span>' +
        '<span class="trail"><span class="wa-btn">' + icon('chat', 19, 2) + '</span></span></a>';
    }).join(''), (p.stage !== 'Ganado' && nr < 2) ? 'El «¿Ya descartó…?» aparece después de 2 mensajes sin respuesta.' : '');
    const free = U.waLink(p) || N.waUrl(p.phone, '');
    body += U.group('', '<a class="cell tap inset-icon" data-act="msg-send" data-id="' + esc(p.id) + '" data-k="libre" href="' + esc(free) + '" target="_blank" rel="noopener"><span class="ico bg-green">' + icon('chat', 19, 2) + '</span><span class="main"><span class="t" style="display:block">Mensaje libre</span></span><span class="trail"><span class="chev">' + icon('chev', 18, 2.2) + '</span></span></a>' +
      (nr > 0 ? U.cell({ icon: 'check', iconBg: 'bg-blue', title: nr + ' sin respuesta', sub: 'Si te contestó, márcalo', trailHtml: '<button class="btn sm tinted" data-act="msg-replied" data-id="' + esc(p.id) + '">Respondió</button>' }) : ''));
    return { title: 'Mensajes', left: fromDetail ? backTo(p.id) : close(), body: body };
  };

  // ---------- Que el cliente llene sus datos (Cialdini · compromiso) ----------
  SH.selfFill = function (p) {
    p = p || {};
    const pr = p.profile || {};
    const v = (k, fb) => pr[k] || fb || '';
    let body = '<div class="self-hero"><div class="onb-ico">' + icon('pen', 38, 2) + '</div><h2>Sus datos</h2><p>Escriba cómo quiere que sus clientes vean su negocio.</p></div>';
    body += U.group('Su negocio', inp('sf-business', 'Nombre del negocio *', v('business', p.name), { auto: 'organization' }) +
      inp('sf-owner', 'Su nombre', v('owner', p.contact), { auto: 'name' }) +
      inp('sf-phone', 'WhatsApp del negocio', v('phone', p.phone), { type: 'tel', inputmode: 'tel', ph: '09XXXXXXXX', auto: 'tel' }));
    body += U.group('Redes', inp('sf-instagram', 'Instagram', v('instagram'), { ph: '@sunegocio', auto: 'off' }) +
      inp('sf-facebook', 'Facebook', v('facebook'), { auto: 'off' }) + inp('sf-tiktok', 'TikTok', v('tiktok'), { ph: '@sunegocio', auto: 'off' }));
    body += U.group('Su local', inp('sf-address', 'Dirección', v('address', p.zone), { auto: 'street-address' }) +
      inp('sf-hours', 'Horario', v('hours'), { ph: 'Ej. Lun a Sáb, 8:00 a 18:00', auto: 'off' }) +
      area('sf-highlight', '¿Qué quiere que sus clientes vean primero?', v('highlight'), 'Ej. El menú del día, las promociones…', 3));
    body += '<div class="pad btns"><button class="btn green" data-act="self-save">Listo</button></div>' +
      '<div class="center-note mt12">Cuando termine, devuélvale el celular a su asesor.</div>';
    return { title: 'Sus datos', left: cancel(), right: save('self-save'), body: body, cls: 'self' };
  };

  // ---------- Ruta del día (Blount · centro y radios) ----------
  SH.route = function (focusId) {
    const V = window.VIEWS;
    const t = D.ymd();
    const citas = S.dueProspects(t).filter(x => x.nextDate === t && x.nextTime);
    let body = '<div class="pad muted" style="margin-bottom:14px">' + U.law('Blount · centro y radios') + ' Agenda las citas en bloques y, entre una y otra, visita los negocios cercanos.</div>';
    if (citas.length) {
      citas.forEach(c => {
        const near = V.nearbyToVisit(c);
        const mc = N.mapsUrl(c);
        let rows = U.cell({ href: mc, attrs: mc ? 'data-act="link"' : '', icon: 'clock', iconBg: c.id === focusId ? 'bg-orange' : 'bg-blue', title: c.nextTime + ' · ' + (c.name || ''), sub: c.nextAction || 'Cita', chev: !!mc });
        rows += near.map(x => U.cell({ href: N.mapsUrl(x.p), attrs: 'data-act="link"', icon: 'store', iconBg: 'bg-gray', title: x.p.name || '', sub: N.fmtDist(x.d) + ' · ' + x.p.stage, chev: true })).join('');
        if (!near.length) rows += U.cell({ title: 'Sin negocios guardados cerca', sub: 'Entra a los de la misma cuadra antes o después de la cita' });
        body += U.group('Cita de las ' + esc(c.nextTime), rows);
      });
    } else {
      body += U.group('Citas con hora de hoy', U.cell({ icon: 'cal', iconBg: 'bg-gray', title: 'Sin citas con hora hoy', sub: 'Cada «Volver» con día y hora aparece aquí' }));
    }
    const pos = N.lastPos;
    if (pos) {
      const list = V.nearbyToVisit({ id: '_yo', lat: pos.lat, lng: pos.lng }, 2000).slice(0, 12);
      body += U.group('Por visitar cerca de ti', list.length ? list.map(x => U.cell({ href: N.mapsUrl(x.p), attrs: 'data-act="link"', icon: 'store', iconBg: 'bg-teal', title: x.p.name || '', sub: N.fmtDist(x.d) + ' · ' + x.p.stage, chev: true })).join('') :
        U.cell({ title: 'Sin negocios por visitar a menos de 2 km' }), 'Registra negocios «Por visitar» con ubicación para armar tu ruta.');
    }
    body += '<div class="pad"><button class="btn tinted" data-act="route-locate">' + icon('nav', 20, 2) + (pos ? ' Actualizar mi ubicación' : ' Usar mi ubicación') + '</button></div>';
    return { title: 'Ruta de hoy', left: close(), body: body };
  };

  // ---------- Pliego de negociación para software (Voss) ----------
  SH.pliego = function (p, d) {
    d = d || (p && p.pliego) || {};
    const acc = d.acc != null ? d.acc : C.PLIEGO_ACC.join('\n');
    const qs = d.qs != null ? d.qs : C.PLIEGO_Q.join('\n');
    const ex = d.extras != null ? d.extras : C.PLIEGO_EXTRAS.join('\n');
    let body = '<div class="pad muted" style="margin-bottom:14px">' + U.law('Voss · pliego de negociación') + ' Prepáralo antes de cada cotización de desarrollo a medida o página web.</div>';
    body += U.group('Objetivo', inp('pl-goal', '¿Qué quiero lograr?', d.goal, { ph: 'Ej. Sistema de citas para la clínica', auto: 'off' }) +
      (p ? '' : inp('pl-client', 'Cliente', d.client, { ph: 'Opcional', auto: 'off' })));
    body += U.group('<span>Precio en rango</span>' + U.law('Cifras no redondas'),
      '<div class="field"><div class="row2"><label><span class="lbl">Tu precio objetivo $</span><input id="pl-target" type="number" inputmode="decimal" min="0" value="' + esc(d.target || '') + '"></label>' +
      '<div style="display:flex;align-items:flex-end"><button class="btn sm tinted" type="button" data-act="pliego-calc">Calcular rango</button></div></div></div>' +
      '<div class="field"><div class="row2"><label><span class="lbl">Desde $</span><input id="pl-low" type="number" inputmode="decimal" min="0" value="' + esc(d.low || '') + '"></label>' +
      '<label><span class="lbl">Hasta $</span><input id="pl-high" type="number" inputmode="decimal" min="0" value="' + esc(d.high || '') + '"></label></div></div>',
      'Di: "Proyectos así van de $X a $Y." El cliente se queda con la cifra baja: pon ahí tu objetivo. Una cifra como $807 parece calculada, no inventada.');
    body += U.group('Resumen con sus palabras', area('pl-summary', 'Su problema, hasta que diga «así es»', d.summary, 'O sea: …', 3));
    body += U.group('Autoacusaciones', area('pl-acc', 'Lo peor que puede estar pensando (una por línea)', acc, '', 4));
    body += U.group('Preguntas con «qué» y «cómo»', area('pl-qs', '3 a 5 preguntas (una por línea)', qs, '', 5));
    body += U.group('Extras que no son dinero', area('pl-extras', 'Para dar en vez de descuento (uno por línea)', ex, '', 4), 'Nunca partas la diferencia: ofrece un extra.');
    body += '<div class="card">' + U.law('Voss · justicia') + '<p class="tip-body">"' + esc(C.PLIEGO_FAIR) + '"</p><p class="muted" style="margin:4px 0 0">Dilo al empezar la reunión.</p></div>';
    body += '<div class="pad btns">' + (p ? '<button class="btn" data-act="pliego-save">Guardar en la ficha</button>' : '') +
      '<button class="btn gray" data-act="pliego-copy">' + icon('copy', 20, 2) + ' Copiar pliego</button></div>';
    return { title: 'Pliego', left: p ? backTo(p.id) : close(), right: p ? save('pliego-save') : '', body: body };
  };

  // ---------- Cotización ----------
  SH.quote = function (p) {
    const body = '<img id="quote-img" class="quote-img" alt="Vista previa de la cotización">' +
      U.group('', inp('q-business', 'Para (nombre del negocio)', p ? p.name : '', { ph: 'Opcional', auto: 'off' })) +
      '<div class="pad btns"><button class="btn" id="q-share" data-act="quote-share" disabled>' + icon('share', 20, 2) + ' Compartir imagen</button>' +
      '<a class="btn green" id="q-wa" data-act="link" target="_blank" rel="noopener" href="#">' + icon('chat', 20, 2) + ' Enviar texto por WhatsApp</a>' +
      '<button class="btn gray" data-act="quote-copy">' + icon('copy', 20, 2) + ' Copiar texto</button></div>' +
      '<div class="center-note mt12">Compartir imagen abre la hoja de Compartir: elige WhatsApp y el chat del cliente. Opciones de mayor a menor (Cialdini · contraste).</div>';
    return { title: 'Cotización', left: close(), body: body };
  };

  // ---------- Objeción en 3 pasos (Voss + Blount) ----------
  SH.objection = function (i) {
    const o = C.OBJECTIONS[i];
    const body = '<div class="pad"><h2 style="margin:0 0 6px;font-size:24px">«' + esc(o.obj) + '»</h2><div style="margin-bottom:12px">' + U.law('Voss + Blount') + ' <span class="pill k-' + o.kind + '">' + esc(C.OBJ_KINDS[o.kind] || '') + '</span></div>' +
      '<div class="say"><span class="tag">1 · Repite y calla 4 segundos</span>"' + U.fill(esc(o.mirror)) + '"</div>' +
      '<div class="say"><span class="tag">2 · Nombra lo que siente</span>"' + U.fill(esc(o.label)) + '"</div>' +
      '<div class="say"><span class="tag">3 · Responde y pregunta</span>"' + U.fill(esc(o.turn)) + '"<br><b>"' + U.fill(esc(o.ask)) + '"</b></div>' +
      (o.note ? '<div class="note-box">' + U.fill(esc(o.note)) + '</div>' : '') +
      '<p class="muted mt12">Máximo 2 intentos. Si sigue en "no": gracias, sonrisa y al siguiente. Nunca "le entiendo" ni "no, pero…".</p></div>';
    return { title: 'Objeción', left: close(), body: body };
  };

  // ---------- Corregir registros de un día ----------
  SH.dayEdit = function (date) {
    const x = S.getDay(date);
    const min = S.minVisits(x);
    let body = U.group('', '<label class="field"><span class="lbl">Día</span><input id="de-date" type="date" value="' + esc(date) + '" max="' + D.ymd() + '"></label>');
    body += U.group('Contadores',
      U.cell({ icon: 'store', iconBg: 'bg-blue', title: 'Visitas', trailHtml: U.stepper('de-step', { k: 'visits' }, x.visits) }) +
      U.cell({ icon: 'person', iconBg: 'bg-teal', title: 'Hablé con el dueño', trailHtml: U.stepper('de-step', { k: 'owners' }, x.owners) }) +
      U.cell({ icon: 'tap', iconBg: 'bg-indigo', title: 'Demos', trailHtml: U.stepper('de-step', { k: 'demos' }, x.demos) }) +
      U.cell({ icon: 'again', iconBg: 'bg-gray', title: 'Volver', trailHtml: U.stepper('de-step', { k: 'laters' }, x.laters) }),
      'Las visitas no pueden ser menos que demos, dueños, ni que ventas + "no" + volver (mínimo ' + min + ').');
    const sales = x.salesLog.map((s, i) => U.cell({ title: (Number(s.units) || 0) + ' u · ' + money(s.amount), sub: [s.pkg, s.asi ? 'así es' : '', hhmm(s.at)].filter(Boolean).join(' · '), trailHtml: '<button class="trash-btn" data-act="de-del-sale" data-i="' + i + '" aria-label="Eliminar venta">' + icon('trash', 20, 2) + '</button>' })).join('');
    body += U.group('Ventas (' + x.salesLog.length + ')', sales || U.cell({ title: 'Sin ventas este día', cls: '' }));
    const tl = k => { const t = C.NO_TYPES.find(n => n.k === k); return t ? t.t : ''; };
    const nos = x.rejLog.map((r, i) => U.cell({ title: r.reason, sub: [tl(r.type), r.asi ? 'así es' : '', hhmm(r.at)].filter(Boolean).join(' · '), trailHtml: '<button class="trash-btn" data-act="de-del-no" data-i="' + i + '" aria-label="Eliminar no">' + icon('trash', 20, 2) + '</button>' })).join('');
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
    body += U.group('Variantes A/B (opcional)',
      '<div class="field"><div class="row2"><label><span class="lbl">Variante A</span><input id="ef-a" value="' + esc(e.a || '') + '" autocomplete="off"></label>' +
      '<label><span class="lbl">Variante B</span><input id="ef-b" value="' + esc(e.b || '') + '" autocomplete="off"></label></div></div>',
      'Con las dos, cada mañana eliges en Hoy cuál usas y la app compara el cierre de cada una.');
    if (!isNew && e.a && e.b) {
      const r = S.abStats(e.id);
      body += U.group('Resultados A/B', ['A', 'B'].map(v => U.cell({
        title: v + ' · ' + (v === 'A' ? e.a : e.b),
        sub: r[v].days + ' días · ' + r[v].visits + ' visitas · ' + r[v].demos + ' demos · ' + r[v].sales + ' ventas · ' + (r[v].sales ? Math.round(r[v].units / r[v].sales * 10) / 10 : 0) + ' u/venta',
        trail: pct(r[v].sales, r[v].visits)
      })).join(''), 'Cierre = ventas ÷ visitas. Con menos de 20 visitas por variante aún es pronto para decidir.');
    }
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
      inp('pk-desc', 'Descripción', p.desc) +
      inp('pk-why', 'Porque… (la razón para el cliente)', p.why, { ph: C.PKG_WHY[i] || '' }),
      'Ley 16 · El del medio debe costar más que el básico pero quedar lejos del más caro. Cialdini · con un «porque» la gente acepta más.');
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
      b += U.group('', inp('ob-name', 'Tu nombre', draft.name, { auto: 'name' }) + inp('ob-phone', 'Tu WhatsApp', draft.phone, { type: 'tel', inputmode: 'tel', ph: '09XXXXXXXX' }) +
        inp('ob-city', 'Tu ciudad', draft.city, { ph: 'Ej. Cuenca', auto: 'address-level2' }), 'Aparecen en tu guion, mensajes y cotizaciones.');
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

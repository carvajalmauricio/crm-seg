/* Funciones nativas del iPhone sin servidor: Calendario (.ics), Contactos (.vcf), GPS,
   Apple Maps, fotos (IndexedDB), hoja de Compartir e imagen de cotización. */
'use strict';

(function () {
  const S = window.STORE;
  const N = {};

  // ---------- Entorno ----------
  N.isStandalone = function () {
    return window.navigator.standalone === true ||
      (!!window.matchMedia && window.matchMedia('(display-mode: standalone)').matches);
  };

  N.canShareFiles = function (files) {
    try { return !!(navigator.share && navigator.canShare && navigator.canShare({ files: files })); } catch (e) { return false; }
  };

  N.download = function (blob, name) {
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = name;
    a.rel = 'noopener';
    a.style.display = 'none';
    document.body.appendChild(a);
    a.click();
    setTimeout(function () { URL.revokeObjectURL(url); a.remove(); }, 4000);
  };

  // Entrega un archivo: hoja de Compartir si se pide y está disponible; si no, descarga.
  // Importante: se llama directo desde el toque del usuario (sin await antes) para que iOS lo permita.
  N.deliver = function (blob, name, opts) {
    opts = opts || {};
    let file = null;
    try { file = new File([blob], name, { type: blob.type }); } catch (e) { file = null; }
    if (opts.preferShare && file && N.canShareFiles([file])) {
      return navigator.share({ files: [file], title: opts.title || name }).then(
        function () { return 'shared'; },
        function (err) {
          if (err && err.name === 'AbortError') return 'cancelled';
          N.download(blob, name);
          return 'downloaded';
        }
      );
    }
    N.download(blob, name);
    return Promise.resolve('downloaded');
  };

  N.shareText = function (text, title) {
    if (navigator.share) {
      return navigator.share({ text: text, title: title || '' }).then(
        function () { return 'shared'; },
        function (err) { return err && err.name === 'AbortError' ? 'cancelled' : N.copy(text); }
      );
    }
    return N.copy(text);
  };

  N.copy = function (text) {
    if (navigator.clipboard && navigator.clipboard.writeText) {
      return navigator.clipboard.writeText(text).then(function () { return 'copied'; }, function () { return 'failed'; });
    }
    const ta = document.createElement('textarea');
    ta.value = text;
    ta.setAttribute('readonly', '');
    ta.style.position = 'fixed'; ta.style.opacity = '0';
    document.body.appendChild(ta);
    ta.select();
    let ok = false;
    try { ok = document.execCommand('copy'); } catch (e) { ok = false; }
    ta.remove();
    return Promise.resolve(ok ? 'copied' : 'failed');
  };

  // ---------- Calendario (.ics) ----------
  function icsEsc(s) {
    return String(s == null ? '' : s).replace(/\\/g, '\\\\').replace(/\r?\n/g, '\\n').replace(/,/g, '\\,').replace(/;/g, '\\;');
  }
  // Líneas de máximo 75 bytes (RFC 5545), sin partir caracteres UTF-8.
  function fold(line) {
    const enc = new TextEncoder();
    const out = [];
    let cur = '';
    let bytes = 0;
    for (const ch of line) {
      const b = enc.encode(ch).length;
      if (bytes + b > 73) { out.push(cur); cur = ' ' + ch; bytes = 1 + b; } else { cur += ch; bytes += b; }
    }
    out.push(cur);
    return out.join('\r\n');
  }
  function pad(n) { return String(n).padStart(2, '0'); }
  function localStamp(d) {
    return d.getFullYear() + pad(d.getMonth() + 1) + pad(d.getDate()) + 'T' + pad(d.getHours()) + pad(d.getMinutes()) + '00';
  }
  function utcStamp() {
    return new Date().toISOString().replace(/[-:]/g, '').replace(/\.\d{3}/, '');
  }

  N.eventDate = function (p) {
    const d = S.dates.parseYmd(p.nextDate);
    const tm = /^(\d{1,2}):(\d{2})$/.exec(p.nextTime || '') || [null, '10', '00'];
    d.setHours(Number(tm[1]), Number(tm[2]), 0, 0);
    return d;
  };

  N.icsText = function (p) {
    const start = N.eventDate(p);
    const end = new Date(start.getTime() + 30 * 60000);
    const summary = (p.nextAction || 'Seguimiento') + ' · ' + (p.name || 'Cliente');
    const desc = [
      p.contact ? 'Contacto: ' + p.contact : '',
      p.phone ? 'WhatsApp: ' + p.phone : '',
      p.rubro || '',
      p.notes || '',
      'Sistema CEO Clyclick · Ley 20: una pequeña falla ahora crea una gran falla después.'
    ].filter(Boolean).join('\n');
    const loc = p.zone || (p.lat != null ? p.lat + ', ' + p.lng : '');
    const lines = [
      'BEGIN:VCALENDAR', 'VERSION:2.0', 'PRODID:-//Clyclick//Sistema CEO//ES', 'CALSCALE:GREGORIAN', 'METHOD:PUBLISH',
      'BEGIN:VEVENT',
      'UID:' + (p.id || S.uid()) + '-' + String(p.nextDate).replace(/-/g, '') + '@clyclick',
      'DTSTAMP:' + utcStamp(),
      'DTSTART:' + localStamp(start),
      'DTEND:' + localStamp(end),
      'SUMMARY:' + icsEsc(summary),
      'DESCRIPTION:' + icsEsc(desc)
    ];
    if (loc) lines.push('LOCATION:' + icsEsc(loc));
    const maps = N.mapsUrl(p);
    if (maps) lines.push('URL:' + maps);
    lines.push('BEGIN:VALARM', 'ACTION:DISPLAY', 'DESCRIPTION:' + icsEsc(summary), 'TRIGGER:-PT15M', 'END:VALARM');
    lines.push('END:VEVENT', 'END:VCALENDAR');
    return lines.map(fold).join('\r\n') + '\r\n';
  };

  N.addToCalendar = function (p) {
    const blob = new Blob([N.icsText(p)], { type: 'text/calendar;charset=utf-8' });
    const name = 'seguimiento-' + slug(p.name) + '.ics';
    return N.deliver(blob, name, { preferShare: N.isStandalone(), title: 'Seguimiento: ' + (p.name || '') });
  };

  // ---------- Contactos (.vcf) ----------
  N.vcardText = function (p) {
    const person = (p.contact || '').trim();
    const lines = ['BEGIN:VCARD', 'VERSION:3.0'];
    lines.push('N:;' + icsEsc(person || p.name || '') + ';;;');
    lines.push('FN:' + icsEsc(person || p.name || ''));
    if (p.name) lines.push('ORG:' + icsEsc(p.name));
    const wa = S.waNumber(p.phone);
    if (wa) lines.push('TEL;TYPE=CELL:+' + wa);
    if (p.zone) lines.push('ADR;TYPE=WORK:;;' + icsEsc(p.zone) + ';;;;');
    const maps = N.mapsUrl(p);
    if (maps) lines.push('URL:' + maps);
    lines.push('NOTE:' + icsEsc(['Cliente Clyclick', p.rubro, p.stage].filter(Boolean).join(' · ')));
    lines.push('END:VCARD');
    return lines.map(fold).join('\r\n') + '\r\n';
  };

  N.saveContact = function (p) {
    const blob = new Blob([N.vcardText(p)], { type: 'text/vcard;charset=utf-8' });
    return N.deliver(blob, slug(p.contact || p.name) + '.vcf', { preferShare: N.isStandalone(), title: p.name || 'Contacto' });
  };

  // ---------- Ubicación ----------
  N.lastPos = null;

  N.getPosition = function () {
    return new Promise(function (resolve, reject) {
      if (!navigator.geolocation) { reject(new Error('Tu navegador no permite ubicación')); return; }
      navigator.geolocation.getCurrentPosition(function (pos) {
        N.lastPos = { lat: round6(pos.coords.latitude), lng: round6(pos.coords.longitude), acc: Math.round(pos.coords.accuracy || 0), at: Date.now() };
        resolve(N.lastPos);
      }, function (err) {
        reject(new Error(err && err.code === 1 ? 'Permiso de ubicación denegado' : 'No se pudo obtener la ubicación'));
      }, { enableHighAccuracy: true, timeout: 12000, maximumAge: 60000 });
    });
  };

  N.recentPosition = function () {
    if (N.lastPos && Date.now() - N.lastPos.at < 120000) return Promise.resolve(N.lastPos);
    return N.getPosition();
  };

  // Dirección aproximada con OpenStreetMap (gratis, sin clave). Si falla, devuelve ''.
  N.reverseGeocode = function (lat, lng) {
    const ctrl = window.AbortController ? new AbortController() : null;
    const timer = setTimeout(function () { if (ctrl) ctrl.abort(); }, 7000);
    const url = 'https://nominatim.openstreetmap.org/reverse?format=jsonv2&zoom=18&addressdetails=1&accept-language=es&lat=' +
      encodeURIComponent(lat) + '&lon=' + encodeURIComponent(lng);
    return fetch(url, { signal: ctrl ? ctrl.signal : undefined, headers: { Accept: 'application/json' } })
      .then(function (r) { if (!r.ok) throw new Error('http'); return r.json(); })
      .then(function (j) {
        const a = (j && j.address) || {};
        const road = a.road || a.pedestrian || a.footway || '';
        const parts = [
          road ? road + (a.house_number ? ' ' + a.house_number : '') : '',
          a.neighbourhood || a.suburb || a.quarter || '',
          a.city || a.town || a.village || a.county || ''
        ].filter(Boolean);
        return parts.join(', ') || (j && j.display_name) || '';
      })
      .catch(function () { return ''; })
      .then(function (v) { clearTimeout(timer); return v; });
  };

  N.distance = function (a, b) {
    if (!a || !b || a.lat == null || b.lat == null) return Infinity;
    const R = 6371000;
    const toR = Math.PI / 180;
    const dLat = (b.lat - a.lat) * toR;
    const dLng = (b.lng - a.lng) * toR;
    const h = Math.sin(dLat / 2) ** 2 + Math.cos(a.lat * toR) * Math.cos(b.lat * toR) * Math.sin(dLng / 2) ** 2;
    return 2 * R * Math.asin(Math.min(1, Math.sqrt(h)));
  };

  N.fmtDist = function (m) {
    if (!isFinite(m)) return '';
    if (m < 1000) return (Math.max(10, Math.round(m / 10) * 10)) + ' m';
    return (m / 1000).toFixed(m < 10000 ? 1 : 0).replace('.', ',') + ' km';
  };

  N.mapsUrl = function (p) {
    if (p && p.lat != null && p.lng != null && p.lat !== '' && p.lng !== '') {
      return 'https://maps.apple.com/?daddr=' + p.lat + ',' + p.lng + '&dirflg=w';
    }
    if (p && p.zone) return 'https://maps.apple.com/?daddr=' + encodeURIComponent(p.zone) + '&dirflg=w';
    return '';
  };

  // ---------- Fotos (IndexedDB) ----------
  const DB_NAME = 'clyclick_ceo';
  const STORE_NAME = 'photos';
  let dbPromise = null;

  function openDb() {
    if (dbPromise) return dbPromise;
    dbPromise = new Promise(function (resolve, reject) {
      if (!window.indexedDB) { reject(new Error('Sin almacenamiento de fotos')); return; }
      const req = indexedDB.open(DB_NAME, 1);
      req.onupgradeneeded = function () {
        const db = req.result;
        if (!db.objectStoreNames.contains(STORE_NAME)) {
          const st = db.createObjectStore(STORE_NAME, { keyPath: 'id' });
          st.createIndex('pid', 'pid', { unique: false });
        }
      };
      req.onsuccess = function () { resolve(req.result); };
      req.onerror = function () { reject(req.error); };
    });
    dbPromise.catch(function () { dbPromise = null; });
    return dbPromise;
  }

  function run(mode, fn) {
    return openDb().then(function (db) {
      return new Promise(function (resolve, reject) {
        const tx = db.transaction(STORE_NAME, mode);
        const st = tx.objectStore(STORE_NAME);
        let result;
        const req = fn(st);
        if (req) req.onsuccess = function () { result = req.result; };
        tx.oncomplete = function () { resolve(result); };
        tx.onerror = function () { reject(tx.error); };
        tx.onabort = function () { reject(tx.error); };
      });
    });
  }

  function blobToBuffer(blob) {
    if (blob.arrayBuffer) return blob.arrayBuffer();
    return new Promise(function (resolve, reject) {
      const r = new FileReader();
      r.onload = function () { resolve(r.result); };
      r.onerror = function () { reject(r.error); };
      r.readAsArrayBuffer(blob);
    });
  }

  N.resizeImage = function (file, max, quality) {
    max = max || 1600;
    quality = quality || 0.82;
    return new Promise(function (resolve, reject) {
      const url = URL.createObjectURL(file);
      const img = new Image();
      img.onload = function () {
        let w = img.naturalWidth, h = img.naturalHeight;
        const k = Math.min(1, max / Math.max(w, h));
        w = Math.max(1, Math.round(w * k)); h = Math.max(1, Math.round(h * k));
        const c = document.createElement('canvas');
        c.width = w; c.height = h;
        c.getContext('2d').drawImage(img, 0, 0, w, h);
        URL.revokeObjectURL(url);
        c.toBlob(function (b) { if (b) resolve(b); else reject(new Error('No se pudo procesar la foto')); }, 'image/jpeg', quality);
      };
      img.onerror = function () { URL.revokeObjectURL(url); reject(new Error('Formato de foto no compatible')); };
      img.src = url;
    });
  };

  // Las fotos se guardan como ArrayBuffer (compatible con todas las versiones de Safari).
  N.photos = {
    add: function (pid, file) {
      return N.resizeImage(file).then(blobToBuffer).then(function (buf) {
        const rec = { id: S.uid(), pid: pid, type: 'image/jpeg', data: buf, created: Date.now() };
        return run('readwrite', function (st) { return st.put(rec); }).then(function () { return rec.id; });
      });
    },
    list: function (pid) {
      return run('readonly', function (st) { return st.index('pid').getAll(pid); }).then(function (rows) {
        return (rows || []).sort(function (a, b) { return a.created - b.created; }).map(function (r) {
          return { id: r.id, pid: r.pid, created: r.created, blob: new Blob([r.data], { type: r.type || 'image/jpeg' }) };
        });
      });
    },
    get: function (id) {
      return run('readonly', function (st) { return st.get(id); }).then(function (r) {
        return r ? { id: r.id, pid: r.pid, blob: new Blob([r.data], { type: r.type || 'image/jpeg' }) } : null;
      });
    },
    del: function (id) {
      return run('readwrite', function (st) { return st.delete(id); });
    },
    delFor: function (pid) {
      return N.photos.list(pid).then(function (rows) {
        return Promise.all(rows.map(function (r) { return N.photos.del(r.id); }));
      });
    },
    counts: function () {
      return run('readonly', function (st) { return st.getAll(); }).then(function (rows) {
        const c = {};
        (rows || []).forEach(function (r) { c[r.pid] = (c[r.pid] || 0) + 1; });
        return c;
      });
    }
  };

  // ---------- Cotización (imagen para WhatsApp) ----------
  const FONT = '-apple-system, "SF Pro Display", "Helvetica Neue", system-ui, Roboto, "Segoe UI", Arial, sans-serif';

  function rr(ctx, x, y, w, h, r) {
    ctx.beginPath();
    ctx.moveTo(x + r, y);
    ctx.arcTo(x + w, y, x + w, y + h, r);
    ctx.arcTo(x + w, y + h, x, y + h, r);
    ctx.arcTo(x, y + h, x, y, r);
    ctx.arcTo(x, y, x + w, y, r);
    ctx.closePath();
  }
  function fit(ctx, text, maxW) {
    text = String(text || '');
    if (ctx.measureText(text).width <= maxW) return text;
    while (text.length > 1 && ctx.measureText(text + '…').width > maxW) text = text.slice(0, -1);
    return text + '…';
  }
  function wrap(ctx, text, maxW, maxLines) {
    const words = String(text || '').split(/\s+/);
    const lines = [];
    let cur = '';
    words.forEach(function (w) {
      const t = cur ? cur + ' ' + w : w;
      if (ctx.measureText(t).width > maxW && cur) { lines.push(cur); cur = w; } else cur = t;
    });
    if (cur) lines.push(cur);
    if (lines.length > maxLines) {
      const keep = lines.slice(0, maxLines);
      keep[maxLines - 1] = fit(ctx, keep[maxLines - 1] + ' ' + lines[maxLines], maxW);
      return keep;
    }
    return lines;
  }
  function money(n) {
    n = Number(n) || 0;
    return '$' + (Math.round(n * 100) % 100 === 0 ? String(Math.round(n)) : n.toFixed(2));
  }

  N.quoteImage = function (o) {
    const W = 1080, H = 1350;
    const c = document.createElement('canvas');
    c.width = W; c.height = H;
    const ctx = c.getContext('2d');
    ctx.fillStyle = '#f2f2f7';
    ctx.fillRect(0, 0, W, H);

    const g = ctx.createLinearGradient(0, 0, W, 320);
    g.addColorStop(0, '#0a84ff');
    g.addColorStop(1, '#5856d6');
    ctx.fillStyle = g;
    ctx.fillRect(0, 0, W, 320);

    ctx.textBaseline = 'alphabetic';
    ctx.fillStyle = 'rgba(255,255,255,.85)';
    ctx.font = '700 32px ' + FONT;
    ctx.fillText('CLYCLICK', 72, 100);
    ctx.font = '400 38px ' + FONT;
    ctx.fillText(o.business ? 'Propuesta para' : 'Hablador con QR + NFC', 72, 185);
    ctx.fillStyle = '#ffffff';
    ctx.font = '800 66px ' + FONT;
    ctx.fillText(fit(ctx, o.business || 'Opciones para su negocio', W - 144), 72, 262);

    ctx.fillStyle = '#3c3c43';
    ctx.font = '400 32px ' + FONT;
    wrap(ctx, 'Sus clientes ven su menú, WhatsApp, ubicación y redes en un toque, sin descargar nada.', W - 144, 2)
      .forEach(function (l, i) { ctx.fillText(l, 72, 385 + i * 44); });

    const unit = Number(o.unitPrice) || 0;
    let y = 480;
    // De mayor a menor (Cialdini · contraste). El recomendado sigue siendo el del medio.
    (o.packages || []).map(function (p, i) { return { p: p, i: i }; }).reverse().forEach(function (x) {
      const p = x.p;
      const rec = x.i === 1;
      const units = Number(p.units) || 0;
      const price = Number(p.price) || 0;
      const h = 225;
      ctx.save();
      ctx.shadowColor = 'rgba(0,0,0,.08)';
      ctx.shadowBlur = 24;
      ctx.shadowOffsetY = 6;
      rr(ctx, 60, y, W - 120, h, 36);
      ctx.fillStyle = '#ffffff';
      ctx.fill();
      ctx.restore();
      if (rec) {
        rr(ctx, 60, y, W - 120, h, 36);
        ctx.lineWidth = 6;
        ctx.strokeStyle = '#0a84ff';
        ctx.stroke();
        ctx.font = '700 24px ' + FONT;
        const label = 'RECOMENDADO';
        const lw = ctx.measureText(label).width + 36;
        rr(ctx, W - 100 - lw, y - 22, lw, 44, 22);
        ctx.fillStyle = '#0a84ff';
        ctx.fill();
        ctx.fillStyle = '#ffffff';
        ctx.fillText(label, W - 100 - lw + 18, y + 9);
      }
      ctx.fillStyle = '#000000';
      ctx.font = '700 46px ' + FONT;
      ctx.fillText(fit(ctx, p.name, 520), 104, y + 82);
      ctx.fillStyle = '#6e6e73';
      ctx.font = '400 32px ' + FONT;
      const per = units > 1 ? ' · ' + money(price / units) + ' c/u' : '';
      ctx.fillText(units + ' hablador' + (units === 1 ? '' : 'es') + per, 104, y + 132);
      const save = unit * units - price;
      if (save > 0.009) {
        ctx.fillStyle = '#248a3d';
        ctx.font = '600 30px ' + FONT;
        ctx.fillText('Ahorra ' + money(save), 104, y + 180);
      }
      ctx.fillStyle = rec ? '#0a84ff' : '#000000';
      ctx.font = '800 92px ' + FONT;
      const pt = money(price);
      ctx.fillText(pt, W - 104 - ctx.measureText(pt).width, y + 145);
      y += h + 34;
    });

    ctx.fillStyle = '#3c3c43';
    ctx.font = '600 32px ' + FONT;
    const foot = [o.seller, o.sellerPhone ? 'WhatsApp ' + o.sellerPhone : ''].filter(Boolean).join(' · ') || 'Clyclick';
    const ft = fit(ctx, foot, W - 144);
    ctx.fillText(ft, (W - ctx.measureText(ft).width) / 2, H - 70);

    return new Promise(function (resolve, reject) {
      c.toBlob(function (b) { if (b) resolve(b); else reject(new Error('No se pudo crear la imagen')); }, 'image/png');
    });
  };

  N.quoteText = function (o) {
    const pk = o.packages || [];
    const lines = pk.map(function (p, i) {
      const u = Number(p.units) || 0;
      return '• ' + p.name + (i === 1 ? ' (recomendado)' : '') + ': ' + u + ' hablador' + (u === 1 ? '' : 'es') + ' — ' + money(p.price);
    }).reverse();
    const hi = 'Hola' + (o.contact ? ' ' + o.contact : '') + (o.seller ? ', soy ' + o.seller + ', de Clyclick.' : ', le escribo de Clyclick.');
    const rec = pk[1] ? 'Le recomiendo el ' + pk[1].name + (pk[1].why ? ', porque ' + pk[1].why : '') + '. ' : '';
    return hi + ' Le comparto las opciones del hablador con QR y NFC' + (o.business ? ' para ' + o.business : '') + ':\n\n' +
      lines.join('\n') + '\n\n' + rec + '¿Sería mala idea si se lo preparo esta semana?';
  };

  N.waUrl = function (phone, text) {
    const n = S.waNumber(phone);
    return 'https://wa.me/' + (n || '') + '?text=' + encodeURIComponent(text || '');
  };

  // ---------- Utilidades ----------
  function round6(v) { return Math.round(v * 1e6) / 1e6; }
  function slug(s) {
    const x = String(s || 'cliente').normalize('NFD').replace(/[\u0300-\u036f]/g, '')
      .toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '');
    return x.slice(0, 40) || 'cliente';
  }
  N.slug = slug;

  window.NATIVE = N;
})();

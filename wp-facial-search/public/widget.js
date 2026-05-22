(function () {
  'use strict';

  var cfg   = window.FacialSearch || {};
  var API   = (cfg.apiRoot || '').replace(/\/$/, '');
  var NONCE = cfg.nonce || '';
  var COLOR = cfg.primaryColor || '#2563eb';

  // Inject CSS variable for the primary color
  document.documentElement.style.setProperty('--fs-primary', COLOR);

  // ── State ──────────────────────────────────────────────────────────────────

  var state = {
    email:         '',
    eventId:       0,
    events:        [],
    selfieBase64:  null,
    cameraStream:  null,
    cameraCapture: false, // true = next cam click captures
  };

  // ── Build DOM ──────────────────────────────────────────────────────────────

  var bubble = el('button', { id: 'fs-bubble', title: 'Encuentra tus fotos' });
  bubble.innerHTML = cameraIcon();
  bubble.addEventListener('click', togglePanel);

  var panel = el('div', { id: 'fs-panel', class: 'fs-hidden' });
  panel.innerHTML = [
    '<div class="fs-header">',
    '  <div class="fs-header-icon">' + cameraIcon() + '</div>',
    '  <div class="fs-header-text"><h3>Encuentra tus fotos</h3><p>Reconocimiento facial</p></div>',
    '  <button class="fs-close" id="fs-close" aria-label="Cerrar">&times;</button>',
    '</div>',
    '<div class="fs-body">',

    /* ── Step 1: email + event ── */
    '<div class="fs-step fs-active" id="fs-s1">',
    '  <div id="fs-m1"></div>',
    '  <label class="fs-label" for="fs-email">Tu correo electrónico</label>',
    '  <input class="fs-input" type="email" id="fs-email" autocomplete="email" placeholder="atleta@correo.com">',
    '  <label class="fs-label" for="fs-event">Evento</label>',
    '  <select class="fs-input" id="fs-event"><option value="">Cargando eventos…</option></select>',
    '  <button class="fs-btn" id="fs-b1">Continuar →</button>',
    '</div>',

    /* ── Step 2: selfie (first-time users) ── */
    '<div class="fs-step" id="fs-s2">',
    '  <div id="fs-m2"></div>',
    '  <p style="margin-top:0"><strong>Primera vez aquí.</strong> Necesitamos una foto tuya para identificarte.</p>',
    '  <div class="fs-selfie-wrap">',
    '    <video class="fs-video" id="fs-video" autoplay playsinline muted></video>',
    '    <img  class="fs-preview" id="fs-preview" alt="Vista previa">',
    '    <canvas id="fs-canvas" style="display:none"></canvas>',
    '    <label class="fs-upload-label" for="fs-file">📂 Subir foto desde galería</label>',
    '    <input type="file" id="fs-file" accept="image/*" style="display:none">',
    '    <button class="fs-btn-secondary" id="fs-cam">📷 Usar la cámara</button>',
    '  </div>',
    '  <button class="fs-btn" id="fs-b2" disabled>Buscar mis fotos</button>',
    '</div>',

    /* ── Step 3: results ── */
    '<div class="fs-step" id="fs-s3">',
    '  <div id="fs-m3"></div>',
    '  <div id="fs-gallery"></div>',
    '  <button class="fs-btn-secondary" id="fs-restart" style="margin-top:16px;">← Buscar de nuevo</button>',
    '</div>',

    '</div>', // .fs-body
  ].join('');

  document.body.appendChild(bubble);
  document.body.appendChild(panel);

  // ── Wire events ────────────────────────────────────────────────────────────

  q('#fs-close').addEventListener('click', closePanel);
  q('#fs-b1').addEventListener('click', handleStep1);
  q('#fs-b2').addEventListener('click', handleStep2);
  q('#fs-restart').addEventListener('click', restart);
  q('#fs-file').addEventListener('change', handleFileUpload);
  q('#fs-cam').addEventListener('click', handleCameraClick);

  loadEvents();

  // ── Panel open/close ───────────────────────────────────────────────────────

  function togglePanel() {
    panel.classList.toggle('fs-hidden');
  }

  function closePanel() {
    panel.classList.add('fs-hidden');
    stopCamera();
  }

  // ── Step navigation ────────────────────────────────────────────────────────

  function showStep(n) {
    qAll('.fs-step').forEach(function (s) { s.classList.remove('fs-active'); });
    q('#fs-s' + n).classList.add('fs-active');
  }

  // ── Message helpers ────────────────────────────────────────────────────────

  function setMsg(slot, text, type) {
    var wrap = q('#fs-m' + slot);
    if (!wrap) return;
    if (!text) { wrap.innerHTML = ''; return; }
    var div = document.createElement('div');
    div.className = 'fs-msg fs-msg-' + (type || 'error');
    div.textContent = text;
    wrap.innerHTML = '';
    wrap.appendChild(div);
  }

  function setLoading(slot, on) {
    var btn = q('#fs-b' + slot);
    if (btn) btn.disabled = on;
    if (on) setMsg(slot, '⏳ Procesando…', 'info');
    else     setMsg(slot, '');
  }

  // ── Load events ────────────────────────────────────────────────────────────

  function loadEvents() {
    apiFetch('GET', '/events').then(function (events) {
      if (!Array.isArray(events)) return;
      state.events = events;
      var sel = q('#fs-event');
      sel.innerHTML = '<option value="">— Selecciona un evento —</option>';
      events.forEach(function (e) {
        var opt = document.createElement('option');
        opt.value       = e.id;
        opt.textContent = e.name;
        sel.appendChild(opt);
      });
    }).catch(function () {
      setMsg(1, 'No se pudieron cargar los eventos.', 'error');
    });
  }

  // ── Step 1 ─────────────────────────────────────────────────────────────────

  function handleStep1() {
    var email   = q('#fs-email').value.trim();
    var eventId = q('#fs-event').value;
    setMsg(1, '');

    if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      return setMsg(1, 'Ingresa un correo electrónico válido.');
    }
    if (!eventId) {
      return setMsg(1, 'Selecciona un evento.');
    }

    state.email   = email;
    state.eventId = parseInt(eventId, 10);

    setLoading(1, true);
    lookup(null).then(function (result) {
      setLoading(1, false);
      if (result.needs_selfie || result.error === 'selfie requerida para nuevo usuario') {
        showStep(2);
      } else if (result.error) {
        setMsg(1, result.error);
      } else {
        renderResults(result);
      }
    });
  }

  // ── Step 2 ─────────────────────────────────────────────────────────────────

  function handleStep2() {
    if (!state.selfieBase64) {
      return setMsg(2, 'Toma o sube una foto tuya primero.');
    }
    setLoading(2, true);
    lookup(state.selfieBase64).then(function (result) {
      setLoading(2, false);
      if (result.error) return setMsg(2, result.error);
      renderResults(result);
    });
  }

  // ── API call ───────────────────────────────────────────────────────────────

  function lookup(selfie) {
    var body = { email: state.email, event_id: state.eventId };
    if (selfie) body.selfie = selfie;
    return apiFetch('POST', '/lookup', body).catch(function () {
      return { error: 'Error de conexión. Intenta de nuevo.' };
    });
  }

  function apiFetch(method, path, body) {
    var opts = {
      method: method,
      headers: { 'X-WP-Nonce': NONCE },
    };
    if (body) {
      opts.headers['Content-Type'] = 'application/json';
      opts.body = JSON.stringify(body);
    }
    return fetch(API + path, opts).then(function (r) { return r.json(); });
  }

  // ── Results ────────────────────────────────────────────────────────────────

  function renderResults(result) {
    stopCamera();
    showStep(3);

    var matches   = result.matches || [];
    var container = q('#fs-gallery');
    container.innerHTML = '';
    setMsg(3, '');

    if (matches.length === 0) {
      var empty = el('div', { class: 'fs-empty' });
      empty.innerHTML = '<span>😕</span>No encontramos fotos tuyas en este evento.<br>' +
        '<small style="color:#9ca3af;margin-top:6px;display:block">Tu selfie quedó guardada para futuras búsquedas.</small>';
      container.appendChild(empty);
      return;
    }

    setMsg(3, '¡Encontramos ' + matches.length + ' foto' + (matches.length > 1 ? 's' : '') + '!', 'success');

    var gallery = el('div', { class: 'fs-gallery' });
    matches.forEach(function (url) {
      var a   = el('a', { href: url, target: '_blank', rel: 'noopener noreferrer' });
      var img = el('img', { src: url, loading: 'lazy', alt: 'Foto del evento' });
      a.appendChild(img);
      gallery.appendChild(a);
    });
    container.appendChild(gallery);
  }

  // ── Restart ────────────────────────────────────────────────────────────────

  function restart() {
    stopCamera();
    state.selfieBase64  = null;
    state.cameraCapture = false;

    q('#fs-email').value      = '';
    q('#fs-event').value      = '';
    q('#fs-preview').style.display = 'none';
    q('#fs-b2').disabled      = true;
    q('#fs-cam').textContent  = '📷 Usar la cámara';

    [1, 2, 3].forEach(function (n) { setMsg(n, ''); });
    q('#fs-gallery').innerHTML = '';
    showStep(1);
  }

  // ── Camera ─────────────────────────────────────────────────────────────────

  function handleCameraClick() {
    if (!state.cameraStream) {
      startCamera();
    } else if (state.cameraCapture) {
      captureFrame();
    }
  }

  function startCamera() {
    navigator.mediaDevices.getUserMedia({ video: { facingMode: 'user' } })
      .then(function (stream) {
        state.cameraStream  = stream;
        state.cameraCapture = true;
        var video = q('#fs-video');
        video.srcObject    = stream;
        video.style.display = 'block';
        q('#fs-cam').textContent = '📸 Capturar foto';
      })
      .catch(function () {
        setMsg(2, 'No se pudo acceder a la cámara. Sube una foto desde tu galería.');
      });
  }

  function captureFrame() {
    var video  = q('#fs-video');
    var canvas = q('#fs-canvas');
    canvas.width  = video.videoWidth  || 640;
    canvas.height = video.videoHeight || 480;
    canvas.getContext('2d').drawImage(video, 0, 0);
    var dataUrl = canvas.toDataURL('image/jpeg', 0.88);
    setSelfiePreview(dataUrl);
    stopCamera();
    q('#fs-cam').textContent = '📷 Usar la cámara';
  }

  function stopCamera() {
    if (state.cameraStream) {
      state.cameraStream.getTracks().forEach(function (t) { t.stop(); });
      state.cameraStream  = null;
      state.cameraCapture = false;
    }
    var video = q('#fs-video');
    if (video) video.style.display = 'none';
  }

  // ── File upload ────────────────────────────────────────────────────────────

  function handleFileUpload(e) {
    var file = e.target.files && e.target.files[0];
    if (!file) return;
    var reader = new FileReader();
    reader.onload = function (ev) { setSelfiePreview(ev.target.result); };
    reader.readAsDataURL(file);
  }

  function setSelfiePreview(dataUrl) {
    var preview = q('#fs-preview');
    preview.src            = dataUrl;
    preview.style.display  = 'block';
    state.selfieBase64     = dataUrl.split(',')[1]; // strip "data:image/jpeg;base64,"
    q('#fs-b2').disabled   = false;
  }

  // ── Tiny helpers ───────────────────────────────────────────────────────────

  function q(selector) { return panel.querySelector(selector) || document.querySelector(selector); }
  function qAll(selector) { return Array.prototype.slice.call(panel.querySelectorAll(selector)); }

  function el(tag, attrs) {
    var node = document.createElement(tag);
    Object.keys(attrs || {}).forEach(function (k) {
      if (k === 'class') node.className = attrs[k];
      else node.setAttribute(k, attrs[k]);
    });
    return node;
  }

  function cameraIcon() {
    return '<svg viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">' +
      '<path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z"/>' +
      '<circle cx="12" cy="13" r="4" fill="none" stroke="currentColor" stroke-width="2"/>' +
      '</svg>';
  }
})();

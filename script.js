/* 
   script.js — Quantity Measurement App
   Concepts: ES9, Classes, Objects, Async/Await, Promises,
   Callbacks, AJAX (fetch), DOM Manipulation, Event Handling,
   Forms, Exception Handling, Conditional Logic,
   Dynamic UI Rendering
    */

'use strict';

/* ── 1. CONFIG Object (Object literal + Object.freeze)  */
const CONFIG = Object.freeze({
  API_BASE: 'http://localhost:5006/api/v1',
  TOKEN_KEY: 'qm_tok',
  USER_KEY:  'qm_usr',
  TOAST_MS:  3000,
});

/* ── 2. UNITS Object  */
const UNITS = Object.freeze({
  LENGTH:      ['FEET', 'INCHES', 'YARDS', 'CENTIMETERS'],
  WEIGHT:      ['GRAM', 'KILOGRAM', 'POUND'],
  VOLUME:      ['MILLILITRE', 'LITRE', 'GALLON'],
  TEMPERATURE: ['CELSIUS', 'FAHRENHEIT'],
});

const UNIT_LABELS = Object.freeze({
  FEET: 'ft',   INCHES: 'in',      YARDS: 'yd',    CENTIMETERS: 'cm',
  METER: 'm',   KILOMETER: 'km', MILE: 'mi',    GRAM: 'g',
  KILOGRAM: 'kg', POUND: 'lb',   OUNCE: 'oz',   TONNE: 't',
  MILLILITER: 'ml', LITER: 'L',  GALLON: 'gal', QUART: 'qt',
  PINT: 'pt',   CUP: 'cup',      FLUID_OUNCE: 'fl oz',
  CELSIUS: '°C', FAHRENHEIT: '°F', KELVIN: 'K',
});

/* ── 3. Custom Exception Classes (ES6 Classes)  */
class AppError extends Error {
  constructor(message, name = 'AppError') {
    super(message);
    this.name = name;
  }
}

class ValidationError extends AppError {
  constructor(message) {
    super(message, 'ValidationError');
  }
}

class ApiError extends AppError {
  constructor(message, status = 0) {
    super(message, 'ApiError');
    this.status = status;
  }
}

class AuthError extends AppError {
  constructor(message) {
    super(message, 'AuthError');
  }
}

/* ── 4. AuthStore Class — Private Fields (ES2022)  */
class AuthStore {
  // Private class fields
  #token    = null;
  #username = null;

  constructor() {
    // Read persisted auth from localStorage
    this.#token    = localStorage.getItem(CONFIG.TOKEN_KEY);
    this.#username = localStorage.getItem(CONFIG.USER_KEY);
  }

  // Getters
  get token()      { return this.#token; }
  get username()   { return this.#username; }
  get isLoggedIn() { return !!this.#token; }

  // Save to memory + localStorage
  save(token, username) {
    this.#token    = token;
    this.#username = username;
    localStorage.setItem(CONFIG.TOKEN_KEY, token);
    localStorage.setItem(CONFIG.USER_KEY,  username);
  }

  // Clear session
  clear() {
    this.#token    = null;
    this.#username = null;
    localStorage.removeItem(CONFIG.TOKEN_KEY);
    localStorage.removeItem(CONFIG.USER_KEY);
  }
}

/* ── 5. ApiService Class — AJAX / fetch / Async-Await  */
class ApiService {
  #auth;

  constructor(authStore) {
    this.#auth = authStore;
  }

  // Build headers with optional Bearer token
  #buildHeaders(useAuth) {
    const headers = { 'Content-Type': 'application/json' };
    if (useAuth && this.#auth.token) {
      headers['Authorization'] = `Bearer ${this.#auth.token}`;
    }
    return headers;
  }

  /**
   * Core AJAX method using fetch API.
   * Returns a Promise — awaited by callers.
   * Async/Await + Exception Handling
   */
  async request(path, method = 'GET', body = null, useAuth = true) {
    try {
      const response = await fetch(`${CONFIG.API_BASE}${path}`, {
        method,
        headers: this.#buildHeaders(useAuth),
        body: body ? JSON.stringify(body) : undefined,
      });

      // Conditional logic on response status
      if (response.status === 401) {
        throw new AuthError('Session expired. Please login again.');
      }

      if (!response.ok) {
        const data = await response.json().catch(() => ({}));
        throw new ApiError(data.message || data.error || `Request failed (${response.status})`, response.status);
      }

      return response.status === 204 ? null : response.json();

    } catch (err) {
      // Re-throw known errors, wrap unknown ones
      if (err instanceof AppError) throw err;
      throw new ApiError('Cannot reach server. Is the API running?');
    }
  }

  /* Promise-returning API methods (ES6 shorthand methods) */
convert(quantity, targetUnit) {
  return this.request('/quantities/convert', 'POST', {
    quantity:   quantity,
    targetUnit: { value: 0, unitName: targetUnit, measurementType: quantity.measurementType }
  });
}  compare(first, second)              { return this.request('/quantities/compare',  'POST', { first, second }); }
  add(first, second, targetUnit) {
  return this.request('/quantities/add', 'POST', {
    first,
    second,
    targetUnit: { value: 0, unitName: targetUnit, measurementType: first.measurementType }
  });
}

subtract(first, second, targetUnit) {
  return this.request('/quantities/subtract', 'POST', {
    first,
    second,
    targetUnit: { value: 0, unitName: targetUnit, measurementType: first.measurementType }
  });
}
  divide(first, second)               { return this.request('/quantities/divide',   'POST', { first, second }); }
  history()                           { return this.request('/quantities/history'); }
  login(u, p)    { return this.request('/auth/login',    'POST', { username: u, password: p }, false); }
  register(u, p) { return this.request('/auth/register', 'POST', { username: u, password: p }, false); }
}

/* ── 6. UIRenderer Class — DOM Manipulation  */
class UIRenderer {

  /* DOM Manipulation helpers */
  static el(id)     { return document.getElementById(id); }
  static numVal(id) { return parseFloat(UIRenderer.el(id).value); }
  static strVal(id) { return UIRenderer.el(id).value.trim(); }
  static selVal(id) { return UIRenderer.el(id).value; }

  /**
   * Dynamically fill a <select> with unit options.
   * DOM Manipulation: innerHTML injection
   */
  static fillSelect(id, type, defaultIdx = 0) {
    const el = UIRenderer.el(id);
    // ES9: Array.map + template literals
    el.innerHTML = UNITS[type]
      .map((u, i) => `<option value="${u}"${i === defaultIdx ? ' selected' : ''}>${UNIT_LABELS[u]} — ${u}</option>`)
      .join('');
  }

  /**
   * Show result box with dynamic content and conditional styling.
   * DOM Manipulation + Conditional Logic
   */
  static showResult(id, { number, caption, badge = null, mode = '' }) {
    const box = UIRenderer.el(id);

    // DOM manipulation: update textContent and dataset
    box.querySelector('.result-number').textContent   = number;
    box.querySelector('.result-number').dataset.unit  = badge || '';
    box.querySelector('.result-caption').textContent  = caption;

    const badgeEl = box.querySelector('.result-badge');
    if (badgeEl) badgeEl.textContent = badge || '';

    // Conditional class assignment based on mode
    box.className = `result-box show${mode ? ' ' + mode : ''}`;
  }

  static hideResult(id) {
    UIRenderer.el(id).className = 'result-box';
  }

  /**
   * Dynamically render the nav bar based on auth state.
   * Dynamic UI Rendering + Conditional Logic
   */
  static renderNav(auth) {
    const nav = UIRenderer.el('navActions');

    if (auth.isLoggedIn) {
      // ES6: String substring + toUpperCase
      const initials = auth.username.substring(0, 2).toUpperCase();
      // Template literal — dynamic HTML injection
      nav.innerHTML = `
        <div class="user-chip" onclick="App.toggleDropdown()" role="button" aria-haspopup="true">
          <div class="avatar" aria-hidden="true">${initials}</div>
          <span class="user-display">${auth.username}</span>
          <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="#64748b" stroke-width="2.5" aria-hidden="true">
            <path d="M6 9l6 6 6-6"/>
          </svg>
        </div>`;
    } else {
      nav.innerHTML = `
        <button class="btn" onclick="App.openModal('login')">Login</button>
        <button class="btn btn--primary" onclick="App.openModal('register')">Register</button>`;
    }
  }

  /**
   * Dynamically render history records.
   * ES9 Spread, Destructuring, Filter, Map, Template Literals
   */
  static renderHistory(records, filter = 'ALL') {
    const container = UIRenderer.el('histContent');

    // Conditional logic: empty state
    if (!records || records.length === 0) {
      container.innerHTML = `
        <div class="empty-state">
          <div class="empty-icon">📭</div>
          <div class="empty-text">No history yet — start converting!</div>
        </div>`;
      return;
    }

    // ES9: Array spread operator
    const filtered = filter === 'ALL'
      ? [...records]
      : records.filter(({ operationType }) => operationType === filter); // Destructuring in filter

    if (filtered.length === 0) {
      container.innerHTML = `
        <div class="empty-state">
          <div class="empty-icon">🔍</div>
          <div class="empty-text">No ${filter} records found.</div>
        </div>`;
      return;
    }

    // Dynamic HTML rendering using map + template literals
    container.innerHTML = [...filtered].reverse().map(h => {
      const op2    = h.operand2Value != null ? ` ↔ ${h.operand2Value} ${h.operand2Unit}` : '';
      const result = h.isError ? '⚠ Error' : `${h.resultValue} ${h.resultUnit || ''}`;
      const time   = new Date(h.timestamp).toLocaleString();

      return `
        <div class="history-card">
          <div class="history-card-inner">
            <div class="history-left">
              <div class="op-pill">${h.operationType}</div>
              <div class="h-detail">${h.operand1Value} ${h.operand1Unit}${op2}</div>
              <div class="h-time">${time}</div>
            </div>
            <div class="history-right">
              <div class="h-result">${result}</div>
            </div>
          </div>
        </div>`;
    }).join('');
  }

  /**
   * Toast notification with Callback pattern.
   */
  static toast(message, type = 'info', callback = null) {
    const el = UIRenderer.el('toast');
    el.textContent = message;
    el.className   = `toast show ${type}`;

    // Callback invoked after toast disappears
    setTimeout(() => {
      el.classList.remove('show');
      if (typeof callback === 'function') callback(); // Callback
    }, CONFIG.TOAST_MS);
  }

  static showErr(id, msg) {
    const el = UIRenderer.el(id);
    el.textContent = msg;
    el.classList.add('visible');
  }

  static hideErr(id) {
    UIRenderer.el(id).classList.remove('visible');
  }
}

/* ── 7. Validator — Pure Functions + Exception Handling  */
const Validator = {
  number(value, label) {
    if (isNaN(value) || value === '') {
      throw new ValidationError(`${label} must be a valid number.`);
    }
  },
  nonZero(value, label) {
    if (value === 0) {
      throw new ValidationError(`${label} cannot be zero.`);
    }
  },
  required(value, label) {
    if (!value || !value.trim()) {
      throw new ValidationError(`${label} is required.`);
    }
  },
  minLength(value, min, label) {
    if (value.length < min) {
      throw new ValidationError(`${label} must be at least ${min} characters.`);
    }
  },
};

/* ── 8. DTO Factory — ES6 Object shorthand  */
const makeQty = (value, unitName, measurementType) => ({ value, unitName, measurementType });

/* ── 9. App — IIFE Module Pattern  */
const App = (() => {

  // Private state variables
  const auth    = new AuthStore();
  const api     = new ApiService(auth);
  let   _hist   = [];
  let   _filter = 'ALL';

  const PANELS = ['convert', 'compare', 'add', 'subtract', 'divide', 'history'];

  /* ── Unit population  */
  function fillUnits(prefix) {
    const type = UIRenderer.selVal(`${prefix}Type`);

    // Object mapping prefix to its selects + default indices
    const map = {
      cv:  [['cvFrom', 0], ['cvTo', 1]],
      cmp: [['cmp1u',  0], ['cmp2u',  0]],
      add: [['add1u',  0], ['add2u',  0], ['addTgt', 0]],
      sub: [['sub1u',  0], ['sub2u',  0], ['subTgt', 0]],
      div: [['div1u',  0], ['div2u',  0]],
    };

    (map[prefix] || []).forEach(([id, idx]) => UIRenderer.fillSelect(id, type, idx));
  }

  /* ── Tab switching — DOM Manipulation + Event Handling  */
  function switchTab(name, el) {
    // Hide all panels
    PANELS.forEach(t => {
      UIRenderer.el(`panel-${t}`).style.display = 'none';
    });

    // Remove active from all tabs
    document.querySelectorAll('.tab').forEach(t => {
      t.classList.remove('active');
      t.setAttribute('aria-selected', 'false');
    });

    // Show selected panel
    UIRenderer.el(`panel-${name}`).style.display = 'block';
    el.classList.add('active');
    el.setAttribute('aria-selected', 'true');

    if (name === 'history') loadHistory();
  }

  function goHistory() {
    closeDropdown();
    switchTab('history', UIRenderer.el('histTabBtn'));
  }

  /* ── Unit swap — ES6 Destructuring  */
  function swapUnits(fromId, toId) {
    const f = UIRenderer.el(fromId);
    const t = UIRenderer.el(toId);
    // Destructuring assignment swap
    [f.value, t.value] = [t.value, f.value];
  }

  /* ── Clear panel  */
  function clearPanel(prefix) {
    const inputMap = {
      cv:  ['cvVal'],
      cmp: ['cmp1v', 'cmp2v'],
      add: ['add1v', 'add2v'],
      sub: ['sub1v', 'sub2v'],
      div: ['div1v', 'div2v'],
    };
    (inputMap[prefix] || []).forEach(id => { UIRenderer.el(id).value = ''; });
    UIRenderer.hideResult(`${prefix}Result`);
  }

  /* ── Dropdown  */
  function toggleDropdown() { UIRenderer.el('userDropdown').classList.toggle('open'); }
  function closeDropdown()  { UIRenderer.el('userDropdown').classList.remove('open'); }

  /* ── Modals  */
  function openModal(name) {
    UIRenderer.el(`${name}Modal`).classList.add('open');
    // Focus first input — accessibility
    const firstInput = UIRenderer.el(`${name}Modal`).querySelector('input');
    if (firstInput) setTimeout(() => firstInput.focus(), 50);
  }

  function closeModal(name) {
    UIRenderer.el(`${name}Modal`).classList.remove('open');
    UIRenderer.hideErr(name === 'login' ? 'loginErr' : 'regErr');
  }

  /* ── Centralised error handler  */
  function handleError(err) {
    if (err instanceof ValidationError) {
      UIRenderer.toast(err.message, 'err');
    } else if (err instanceof AuthError) {
      auth.clear();
      UIRenderer.renderNav(auth);
      UIRenderer.toast(err.message, 'err');
    } else {
      UIRenderer.toast(err.message || 'An unexpected error occurred.', 'err');
    }
  }

  /* ── OPERATIONS — Async/Await + Exception Handling  */

  async function doConvert() {
    try {
      const val  = UIRenderer.numVal('cvVal');
      const from = UIRenderer.selVal('cvFrom');
      const to   = UIRenderer.selVal('cvTo');
      const type = UIRenderer.selVal('cvType');

      Validator.number(val, 'Value');

      // Await Promise returned by ApiService
      const data = await api.convert(makeQty(val, from, type), to);

      UIRenderer.showResult('cvResult', {
        number:  (+data.value).toFixed(4),
        caption: `${val} ${UNIT_LABELS[from]} equals`,
        badge:   UNIT_LABELS[to],
      });

    } catch (err) {
      handleError(err);
    }
  }

  async function doCompare() {
    try {
      const v1 = UIRenderer.numVal('cmp1v'), u1 = UIRenderer.selVal('cmp1u');
      const v2 = UIRenderer.numVal('cmp2v'), u2 = UIRenderer.selVal('cmp2u');
      const t  = UIRenderer.selVal('cmpType');

      Validator.number(v1, 'First value');
      Validator.number(v2, 'Second value');

      const data = await api.compare(makeQty(v1, u1, t), makeQty(v2, u2, t));

      UIRenderer.showResult('cmpResult', {
        number:  data.equal ? '✓ Equal' : '✗ Not Equal',
        caption: `${v1} ${UNIT_LABELS[u1]} vs ${v2} ${UNIT_LABELS[u2]}`,
        mode:    data.equal ? 'eq' : 'neq',
      });

    } catch (err) {
      handleError(err);
    }
  }

  async function doAdd() {
    try {
      const v1 = UIRenderer.numVal('add1v'), u1 = UIRenderer.selVal('add1u');
      const v2 = UIRenderer.numVal('add2v'), u2 = UIRenderer.selVal('add2u');
      const tu = UIRenderer.selVal('addTgt'), t = UIRenderer.selVal('addType');

      Validator.number(v1, 'First value');
      Validator.number(v2, 'Second value');

      const data = await api.add(makeQty(v1, u1, t), makeQty(v2, u2, t), tu);

      UIRenderer.showResult('addResult', {
        number:  (+data.value).toFixed(4),
        caption: `${v1} ${UNIT_LABELS[u1]} + ${v2} ${UNIT_LABELS[u2]}`,
        badge:   UNIT_LABELS[tu],
      });

    } catch (err) {
      handleError(err);
    }
  }

  async function doSubtract() {
    try {
      const v1 = UIRenderer.numVal('sub1v'), u1 = UIRenderer.selVal('sub1u');
      const v2 = UIRenderer.numVal('sub2v'), u2 = UIRenderer.selVal('sub2u');
      const tu = UIRenderer.selVal('subTgt'), t = UIRenderer.selVal('subType');

      Validator.number(v1, 'First value');
      Validator.number(v2, 'Second value');

      const data = await api.subtract(makeQty(v1, u1, t), makeQty(v2, u2, t), tu);

      UIRenderer.showResult('subResult', {
        number:  (+data.value).toFixed(4),
        caption: `${v1} ${UNIT_LABELS[u1]} − ${v2} ${UNIT_LABELS[u2]}`,
        badge:   UNIT_LABELS[tu],
      });

    } catch (err) {
      handleError(err);
    }
  }

  async function doDivide() {
    try {
      const v1 = UIRenderer.numVal('div1v'), u1 = UIRenderer.selVal('div1u');
      const v2 = UIRenderer.numVal('div2v'), u2 = UIRenderer.selVal('div2u');
      const t  = UIRenderer.selVal('divType');

      Validator.number(v1, 'First value');
      Validator.number(v2, 'Second value');
      Validator.nonZero(v2, 'Second value');

      const data = await api.divide(makeQty(v1, u1, t), makeQty(v2, u2, t));

      UIRenderer.showResult('divResult', {
        number:  (+data.value).toFixed(6),
        caption: `${v1} ${UNIT_LABELS[u1]} ÷ ${v2} ${UNIT_LABELS[u2]}`,
      });

    } catch (err) {
      handleError(err);
    }
  }

  /* ── AUTH — Async + Exception Handling + Forms  */

  async function doLogin() {
    const username = UIRenderer.strVal('loginUser');
    const password = UIRenderer.strVal('loginPass');
    UIRenderer.hideErr('loginErr');

    try {
      Validator.required(username, 'Username');
      Validator.required(password, 'Password');

      // AJAX call — awaiting Promise
      const data = await api.login(username, password);

      auth.save(data.token, data.username);
      UIRenderer.renderNav(auth);
      closeModal('login');

      // Callback: passed to toast — called when toast fades out
      UIRenderer.toast(`Welcome, ${data.username}!`, 'ok', () => {
        console.log('Login toast dismissed — callback fired.');
      });

    } catch (err) {
      const msg = err instanceof ValidationError ? err.message : 'Invalid username or password.';
      UIRenderer.showErr('loginErr', msg);
    }
  }

  async function doRegister() {
    const username = UIRenderer.strVal('regUser');
    const password = UIRenderer.strVal('regPass');
    UIRenderer.hideErr('regErr');

    try {
      Validator.required(username, 'Username');
      Validator.required(password, 'Password');
      Validator.minLength(password, 6, 'Password');

      await api.register(username, password);

      closeModal('register');
      UIRenderer.toast('Account created! Please login.', 'ok');
      openModal('login');
      UIRenderer.el('loginUser').value = username;

    } catch (err) {
      const msg = err instanceof ValidationError ? err.message : (err.message || 'Registration failed.');
      UIRenderer.showErr('regErr', msg);
    }
  }

  function logout() {
    auth.clear();
    UIRenderer.renderNav(auth);
    closeDropdown();
    UIRenderer.toast('Logged out successfully.', 'ok');
  }

  /* ── HISTORY — Async + Dynamic Rendering  */

  async function loadHistory() {
    const container = UIRenderer.el('histContent');

    // Conditional logic: not logged in
    if (!auth.isLoggedIn) {
      container.innerHTML = `
        <div class="empty-state">
          <div class="empty-icon">🔒</div>
          <div class="empty-text">Please login to view your history.</div>
        </div>`;
      return;
    }

    // Show loading spinner — DOM manipulation
    container.innerHTML = `
      <div class="empty-state">
        <div class="spinner"></div>
      </div>`;

    try {
      // AJAX — async fetch returning Promise
      _hist = await api.history();
      UIRenderer.renderHistory(_hist, _filter);

    } catch (err) {
      if (err instanceof AuthError) {
        auth.clear();
        UIRenderer.renderNav(auth);
      }
      container.innerHTML = `
        <div class="empty-state">
          <div class="empty-icon">⚠</div>
          <div class="empty-text">${err.message}</div>
        </div>`;
    }
  }

  function filterHistory(type, el) {
    _filter = type;
    // DOM manipulation: toggle active class on pills
    document.querySelectorAll('.filter-pill').forEach(p => p.classList.remove('active'));
    el.classList.add('active');
    UIRenderer.renderHistory(_hist, type);
  }

  /* ── EVENT HANDLING — Registered in init  */

  function registerEvents() {

    // Event: document click — close dropdown on outside click
    document.addEventListener('click', (e) => {
      if (!e.target.closest('.user-chip') && !e.target.closest('.dropdown')) {
        closeDropdown();
      }
    });

    // Event: Escape key — close modals and dropdown
    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape') {
        document.querySelectorAll('.overlay.open').forEach(o => o.classList.remove('open'));
        closeDropdown();
      }
    });

    // Event: Enter on login password → submit login form
    const loginPass = document.getElementById('loginPass');
    if (loginPass) {
      loginPass.addEventListener('keydown', (e) => {
        if (e.key === 'Enter') doLogin();
      });
    }

    // Event: Enter on register password → submit register form
    const regPass = document.getElementById('regPass');
    if (regPass) {
      regPass.addEventListener('keydown', (e) => {
        if (e.key === 'Enter') doRegister();
      });
    }

    // Event: overlay click — close modal on backdrop click
    document.querySelectorAll('.overlay').forEach(overlay => {
      overlay.addEventListener('click', (e) => {
        if (e.target === overlay) overlay.classList.remove('open');
      });
    });
  }

  /* ── INIT  */

  function init() {
    // Populate all unit selects
    ['cv', 'cmp', 'add', 'sub', 'div'].forEach(prefix => fillUnits(prefix));

    // Render nav depending on stored auth
    UIRenderer.renderNav(auth);

    // Set footer year dynamically
    const yearEl = document.getElementById('footerYear');
    if (yearEl) yearEl.textContent = new Date().getFullYear();

    // Register all event listeners
    registerEvents();
  }

  // Run on load
  init();

  /* ── Public API — expose only needed functions  */
  return {
    switchTab,
    fillUnits,
    swapUnits,
    clearPanel,
    toggleDropdown,
    closeDropdown,
    goHistory,
    openModal,
    closeModal,
    doConvert,
    doCompare,
    doAdd,
    doSubtract,
    doDivide,
    doLogin,
    doRegister,
    logout,
    loadHistory,
    filterHistory,
  };

})();
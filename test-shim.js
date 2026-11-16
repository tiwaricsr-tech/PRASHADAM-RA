/* ============================================================
   Minimal DOM shim (TEST ONLY) — just enough to run the POS app
   ============================================================ */
function ClassList(el) { this.el = el }
ClassList.prototype._arr = function () { return (this.el.attrs.class || '').split(/\s+/).filter(Boolean) };
ClassList.prototype._save = function (a) { this.el.attrs.class = a.join(' ') };
ClassList.prototype.add = function () { var a = this._arr(); for (var i = 0; i < arguments.length; i++) if (arguments[i] && a.indexOf(arguments[i]) < 0) a.push(arguments[i]); this._save(a) };
ClassList.prototype.remove = function () { var a = this._arr(); for (var i = 0; i < arguments.length; i++) { var x = a.indexOf(arguments[i]); if (x >= 0) a.splice(x, 1) } this._save(a) };
ClassList.prototype.toggle = function (c, f) { var a = this._arr(), has = a.indexOf(c) >= 0, want = f === undefined ? !has : !!f; if (want && !has) a.push(c); if (!want && has) a.splice(a.indexOf(c), 1); this._save(a); return want };
ClassList.prototype.contains = function (c) { return this._arr().indexOf(c) >= 0 };

var VOID = { IMG: 1, BR: 1, INPUT: 1, HR: 1, META: 1, LINK: 1, SOURCE: 1, PATH: 1, RECT: 1, CIRCLE: 1 };

function El(tag) {
  this.tagName = String(tag).toUpperCase();
  this.childNodes = []; this.children = []; this.attrs = {}; this.parent = null;
  this._own = ''; this._html = ''; this._listeners = {}; this._cl = null;
}
Object.defineProperties(El.prototype, {
  id: { get: function () { return this.attrs.id || '' }, set: function (v) { this.attrs.id = v } },
  className: { get: function () { return this.attrs.class || '' }, set: function (v) { this.attrs.class = v } },
  classList: { get: function () { if (!this._cl) this._cl = new ClassList(this); return this._cl } },
  innerHTML: {
    get: function () { return this._html },
    set: function (h) {
      this._html = String(h); this.childNodes = []; this.children = [];
      var frag = parseHTML(this._html);
      var kids = frag.childNodes.slice();
      for (var i = 0; i < kids.length; i++) this.appendChild(kids[i]);
    }
  },
  textContent: {
    get: function () { var s = this._own; for (var i = 0; i < this.childNodes.length; i++) { var n = this.childNodes[i]; s += n.isText ? n.text : n.textContent } return s },
    set: function (t) { this._own = String(t); this.childNodes = []; this.children = []; this._html = '' }
  },
  value: {
    get: function () {
      if (this._valueSet !== undefined) return this._valueSet;
      if (this.attrs.value !== undefined) return this.attrs.value;
      if (this.tagName === 'SELECT') {
        var kids = this.children.filter(function (c) { return c.tagName === 'OPTION' });
        for (var i = 0; i < kids.length; i++) if (kids[i].attrs.selected !== undefined)
          return kids[i].attrs.value !== undefined ? kids[i].attrs.value : kids[i].textContent;
        if (kids[0]) return kids[0].attrs.value !== undefined ? kids[0].attrs.value : kids[0].textContent;
        return '';
      }
      return this.attrs.value !== undefined ? this.attrs.value : '';
    },
    set: function (v) { this._valueSet = v }
  },
  checked: { get: function () { return this._checked !== undefined ? this._checked : this.attrs.checked !== undefined }, set: function (v) { this._checked = !!v } },
  dataset: {
    get: function () { var o = {}; for (var k in this.attrs) if (k.slice(0, 5) === 'data-') o[k.slice(5)] = this.attrs[k]; return o }
  },
  style: { get: function () { if (!this._style) this._style = {}; return this._style } }
});
El.prototype.appendChild = function (n) { n.parent = this; this.childNodes.push(n); if (!n.isText) this.children.push(n); return n };
El.prototype.removeChild = function (n) {
  var i = this.childNodes.indexOf(n); if (i >= 0) this.childNodes.splice(i, 1);
  i = this.children.indexOf(n); if (i >= 0) this.children.splice(i, 1);
};
El.prototype.remove = function () { if (this.parent) this.parent.removeChild(this) };
El.prototype.getAttribute = function (n) { return this.attrs[n.toLowerCase()] };
El.prototype.addEventListener = function (t, fn) { (this._listeners[t] = this._listeners[t] || []).push(fn) };
El.prototype.fire = function (t, ev) {
  ev = ev || {}; ev.target = ev.target || this; ev.type = t;
  var h = this['on' + t]; if (typeof h === 'function') h.call(this, ev);
  var ls = this._listeners[t] || []; for (var i = 0; i < ls.length; i++) ls[i].call(this, ev);
};
El.prototype.click = function () { this.fire('click', { target: this }) };

function matchesSimple(el, s) {
  var m = /^([a-zA-Z][\w-]*)?((?:[.#][\w-]+)*)((?:\[[^\]]+\])*)$/.exec(s);
  if (!m) return false;
  if (m[1] && el.tagName !== m[1].toUpperCase()) return false;
  var re = /([.#])([\w-]+)/g, am;
  while ((am = re.exec(m[2] || ''))) {
    if (am[1] === '#' && el.attrs.id !== am[2]) return false;
    if (am[1] === '.' && !el.classList.contains(am[2])) return false;
  }
  var ar = /\[([\w-]+)(?:="([^"]*)")?\]/g, aa;
  while ((aa = ar.exec(m[3] || ''))) {
    var v = el.attrs[aa[1]];
    if (v === undefined) return false;
    if (aa[2] !== undefined && v !== aa[2]) return false;
  }
  return true;
}
function matches(el, sel) {
  var parts = sel.split(/\s+/).filter(Boolean);
  if (!parts.length) return false;
  if (!matchesSimple(el, parts[parts.length - 1])) return false;
  var anc = el.parent, pi = parts.length - 2;
  while (anc && pi >= 0) { if (matchesSimple(anc, parts[pi])) pi--; anc = anc.parent }
  return pi < 0;
}
El.prototype.matches = function (s) { return matchesSimple(this, s) };
El.prototype.closest = function (s) { var n = this; while (n) { if (matchesSimple(n, s)) return n; n = n.parent } return null };
function qsa(root, sel, out) {
  for (var i = 0; i < root.children.length; i++) {
    var c = root.children[i];
    if (matches(c, sel)) out.push(c);
    qsa(c, sel, out);
  }
  return out;
}
El.prototype.querySelectorAll = function (sel) { return qsa(this, sel, []) };
El.prototype.querySelector = function (sel) { var r = qsa(this, sel, []); return r.length ? r[0] : null };
El.prototype.getElementById = function (id) {
  for (var i = 0; i < this.children.length; i++) {
    var c = this.children[i];
    if (c.attrs.id === id) return c;
    var f = c.getElementById(id); if (f) return f;
  }
  return null;
};

function parseHTML(html) {
  var frag = new El('#fragment'), stack = [frag], last = 0, m;
  var re = /<\/?([a-zA-Z][\w-]*)((?:[^>"']|"[^"]*"|'[^']*')*?)(\/?)>/g;
  function text(t) {
    if (!t.trim()) return;
    stack[stack.length - 1].appendChild({ isText: true, text: t, parent: stack[stack.length - 1] });
  }
  while ((m = re.exec(html))) {
    text(html.slice(last, m.index));
    var full = m[0], tag = m[1], attrs = m[2], selfClose = m[3] === '/';
    if (full.slice(0, 2) === '</') {
      for (var s = stack.length - 1; s > 0; s--) if (stack[s].tagName === tag.toUpperCase()) { stack.length = s; break }
    } else {
      var el = new El(tag);
      var are = /([\w-]+)\s*=\s*(?:"([^"]*)"|'([^']*)')|([\w-]+)/g, am;
      while ((am = are.exec(attrs))) {
        if (am[1]) el.attrs[am[1].toLowerCase()] = am[2] !== undefined ? am[2] : am[3];
        else if (am[4]) el.attrs[am[4].toLowerCase()] = '';
      }
      stack[stack.length - 1].appendChild(el);
      if (el.attrs.onclick) {
        (function (code) {
          el.onclick = function (ev) { var fn = new Function('event', code); fn.call(el, ev || {}) };
        })(el.attrs.onclick);
      }
      if (el.attrs.oninput) {
        (function (code) {
          el.oninput = function (ev) { var fn = new Function('event', code); fn.call(el, ev || {}) };
        })(el.attrs.oninput);
      }
      if (!selfClose && !VOID[el.tagName]) stack.push(el);
    }
    last = re.lastIndex;
  }
  text(html.slice(last));
  return frag;
}

/* document */
var document = new El('#DOCUMENT');
document.createElement = function (t) { return new El(t) };
document.addEventListener = El.prototype.addEventListener;
document.fire = El.prototype.fire;
/* load static body markup */
(function () {
  var frag = parseHTML(typeof __BODY__ !== 'undefined' ? __BODY__ : '');
  frag.childNodes.slice().forEach(function (n) { document.appendChild(n) });
})();

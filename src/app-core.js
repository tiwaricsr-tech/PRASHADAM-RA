/* ================================================================
   APP CORE — helpers, storage, session, login, notifications, POS
   ================================================================ */

/* ---------- tiny helpers ---------- */
function $(s) { return document.querySelector(s) }
function $$(s) { return Array.prototype.slice.call(document.querySelectorAll(s)) }
function esc(s) {
  return String(s == null ? '' : s).replace(/[&<>"']/g, function (c) {
    return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c];
  });
}
var INR = new Intl.NumberFormat('en-IN');
function fmt(n) { return '₹' + INR.format(Math.round(n)) }
function fmt2(n) { return '₹' + Number(n).toFixed(2) }
function fmtK(n) { return n >= 1000 ? (n / 1000).toFixed(n >= 10000 ? 0 : 1) + 'k' : String(Math.round(n)) }
function fmtDT(t) { return new Date(t).toLocaleString('en-IN', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' }) }
function dkey(t) { var d = new Date(t); return d.getFullYear() + '-' + String(d.getMonth() + 1).padStart(2, '0') + '-' + String(d.getDate()).padStart(2, '0') }
function timeAgo(t) {
  var s = (Date.now() - t) / 1000;
  if (s < 60) return 'just now';
  if (s < 3600) return Math.floor(s / 60) + ' min ago';
  if (s < 86400) return Math.floor(s / 3600) + ' hr ago';
  return Math.floor(s / 86400) + ' days ago';
}
function toast(m) {
  var t = document.createElement('div'); t.className = 'toast'; t.textContent = m;
  $('#toasts').appendChild(t);
  setTimeout(function () { t.classList.add('out') }, 2300);
  setTimeout(function () { t.remove() }, 2750);
}
function openModal(id) { $('#' + id).classList.remove('hidden') }
function closeModal(id) { $('#' + id).classList.add('hidden') }
var CF_CB = null;
function confirmBox(msg, cb) { $('#cf-msg').textContent = msg; CF_CB = cb; openModal('modal-confirm') }
function prodById(id) { for (var i = 0; i < DB.products.length; i++) if (DB.products[i].id === id) return DB.products[i]; return null }
/* product photo: uploaded image first, then built-in stock photo library */
function imgSrc(p) {
  if (!p) return null;
  if (p.img) return p.img;
  if (typeof PHOTOS !== 'undefined' && PHOTOS[p.id]) return PHOTOS[p.id];
  return null;
}
function billById(id) { for (var i = 0; i < DB.bills.length; i++) if (DB.bills[i].id === id) return DB.bills[i]; return null }

/* ---------- storage (localStorage with in-memory fallback for sandboxed preview) ---------- */
var LS_OK = (function () { try { localStorage.setItem('__t', '1'); localStorage.removeItem('__t'); return true } catch (e) { return false } })();
var MEM = {};
function sget(k, d) {
  if (LS_OK) { try { var v = localStorage.getItem(k); if (v != null) return JSON.parse(v) } catch (e) { } }
  return (k in MEM) ? MEM[k] : d;
}
function sset(k, v) { MEM[k] = v; if (LS_OK) { try { localStorage.setItem(k, JSON.stringify(v)) } catch (e) { } } }

var DB = null;
function loadDB() {
  var d = sget('posdb', null);
  if (d && d.v === 2) {
    DB = d;
    if (DB.settings.name === 'Spice Garden Restaurant') { DB.settings.name = 'Prashadam'; save(); }
    return false;
  }
  DB = JSON.parse(JSON.stringify({
    products: SEED.products, bills: SEED.bills, users: SEED.users,
    settings: SEED.settings, notifs: SEED.notifs, counters: SEED.counters
  }));
  checkLowStock(); save();
  return true;
}
function save() { sset('posdb', DB) }
function resetDemo() {
  MEM = {};
  if (LS_OK) { try { localStorage.removeItem('posdb') } catch (e) { } }
  loadDB(); applyBrand();
}

/* ---------- session / routing ---------- */
function getSession() { return sget('pos_sess', null) }
function setSession(u) { sset('pos_sess', u) }
function clearSession() { sset('pos_sess', null) }
function show(id) { $$('.screen').forEach(function (s) { s.classList.toggle('active', s.id === id) }) }

function route() {
  applyBrand();
  var s = getSession();
  if (!s) { show('screen-login'); return }
  if (s.role === 'admin') { show('screen-admin'); $('#adm-user').textContent = s.name; $('#adm-av').textContent = s.name ? s.name[0].toUpperCase() : 'A'; goPage('dash') }
  else { show('screen-pos'); enterPOS() }
}
function logout() { clearSession(); route() }

function applyBrand() {
  var s = DB.settings;
  $('#pos-brand-name').textContent = s.name;
  $('#adm-brand-name').textContent = s.name;
  $('#login-title').textContent = s.name;
  document.title = s.name + ' — POS & Billing';
  var logoHtml = s.logo ? '<img class="blogo" src="' + s.logo + '" alt="logo">' : '<div class="bemoji">🍽️</div>';
  $('#pos-logo-wrap').innerHTML = logoHtml;
  $('#adm-logo-wrap').innerHTML = logoHtml;
  if (s.logo) {
    $('#login-hero').src = s.logo; $('#login-hero').classList.remove('hidden');
    $('#login-logo-wrap').innerHTML = '<img class="login-logo" src="' + s.logo + '" alt="logo">';
  } else {
    $('#login-hero').classList.add('hidden');
    $('#login-logo-wrap').innerHTML = '<div class="hero-emoji">🍽️</div>';
  }
}

/* ---------- login ---------- */
var loginRole = 'billing';
function setLoginRole(r) {
  loginRole = r;
  $('#login-tab-billing').classList.toggle('on', r === 'billing');
  $('#login-tab-admin').classList.toggle('on', r === 'admin');
}
function doLogin(e) {
  e.preventDefault();
  var u = $('#login-u').value.trim(), p = $('#login-p').value, err = $('#login-err'), usr = null;
  DB.users.forEach(function (x) { if (x.u === u && x.p === p) usr = x });
  if (!usr) { err.textContent = '❌ Invalid username or password'; err.classList.remove('hidden'); return }
  if (usr.role !== loginRole) {
    err.textContent = '❌ This is a ' + (usr.role === 'admin' ? 'Admin' : 'Billing') + ' account — please use the "' + (usr.role === 'admin' ? 'Admin Panel' : 'Billing Staff') + '" tab.';
    err.classList.remove('hidden'); return;
  }
  err.classList.add('hidden');
  setSession({ u: usr.u, name: usr.name, role: usr.role });
  $('#login-p').value = '';
  route();
  toast('👋 Welcome, ' + usr.name + '!');
}

/* ---------- notifications (low stock tracker) ---------- */
function notifKey(p, it) { return p.id + '|' + it.label }
function checkLowStock() {
  DB.products.forEach(function (p) {
    p.items.forEach(function (it) {
      var low = it.stock <= p.threshold;
      var has = DB.notifs.some(function (n) { return n.key === notifKey(p, it) && !n.read });
      if (low && !has) {
        DB.notifs.unshift({
          id: 'N' + Date.now() + '_' + Math.floor(Math.random() * 9999),
          key: notifKey(p, it),
          msg: 'Low stock: ' + p.name + (p.items.length > 1 ? ' (' + it.label + ')' : '') + ' — only ' + it.stock + ' left',
          time: Date.now(), read: false
        });
      }
      if (!low) DB.notifs.forEach(function (n) { if (n.key === notifKey(p, it) && !n.read) n.read = true });
    });
  });
  if (DB.notifs.length > 80) DB.notifs = DB.notifs.slice(0, 80);
  renderBell(); save();
}
function renderBell() {
  var c = DB.notifs.filter(function (n) { return !n.read }).length;
  ['pos', 'adm'].forEach(function (x) {
    var b = $('#bell-badge-' + x); if (!b) return;
    b.textContent = c; b.classList.toggle('hidden', c === 0);
  });
}
function toggleBell() {
  var d = $('#bell-drop');
  if (!d.classList.contains('hidden')) { d.classList.add('hidden'); return }
  renderBellList(); d.classList.remove('hidden');
}
function renderBellList() {
  var l = $('#bell-list');
  if (!DB.notifs.length) { l.innerHTML = '<div class="bd-empty">🔔 No notifications yet</div>'; return }
  l.innerHTML = DB.notifs.map(function (n) {
    return '<div class="notif' + (n.read ? '' : ' unread') + '"><div class="ni">' + (n.read ? '📭' : '⚠️') + '</div>' +
      '<div><div class="nm">' + esc(n.msg) + '</div><div class="nt">' + timeAgo(n.time) + '</div></div></div>';
  }).join('');
}
function markAllRead() { DB.notifs.forEach(function (n) { n.read = true }); renderBell(); renderBellList(); save() }
function clearNotifs() { DB.notifs = []; renderBell(); renderBellList(); save() }

/* ---------- POS: menu ---------- */
var CART = { type: 'Dine-In', table: '', cust: '', phone: '', pay: 'Cash', lines: [] };
var posCat = 'All', posQ = '';

function catData() {
  var counts = {}, list = [];
  DB.products.forEach(function (p) { if (!(p.cat in counts)) { counts[p.cat] = 0; list.push(p.cat) } counts[p.cat]++ });
  return { list: list, counts: counts };
}
function renderMenu() {
  var c = catData();
  $('#cat-chips').innerHTML = ['All'].concat(c.list).map(function (cat) {
    return '<button class="chip' + (cat === posCat ? ' on' : '') + '" onclick="pickCat(\'' + esc(cat) + '\')">' +
      esc(cat) + ' · ' + (cat === 'All' ? DB.products.length : c.counts[cat]) + '</button>';
  }).join('');
  var q = posQ.toLowerCase();
  var list = DB.products.filter(function (p) { return (posCat === 'All' || p.cat === posCat) && (!q || p.name.toLowerCase().indexOf(q) >= 0) });
  var g = $('#menu-grid');
  if (!list.length) {
    g.innerHTML = '<div class="menu-empty"><div>🔍</div>No dishes found' + (q ? ' for “' + esc(posQ) + '”' : '') + '</div>';
    return;
  }
  g.innerHTML = list.map(function (p) {
    var tot = 0, low = false;
    p.items.forEach(function (it) { tot += it.stock; if (it.stock <= p.threshold) low = true });
    var oos = tot <= 0;
    var prices = p.items.map(function (i) { return i.price });
    var pmin = Math.min.apply(null, prices), pmax = Math.max.apply(null, prices);
    var badge = oos ? '<span class="badge badge-out p-low">Out of stock</span>' : (low ? '<span class="badge badge-low p-low">⚠ few left</span>' : '');
    var src = imgSrc(p);
    return '<div class="p-card' + (oos ? ' oos' : '') + '" ' + (oos ? '' : 'onclick="openItemModal(\'' + p.id + '\')"') + '>' +
      '<div class="p-img">' + (src ? '<img src="' + src + '" alt="">' : p.emoji) + badge + '</div>' +
      '<div class="p-body"><div style="display:flex;align-items:center;gap:7px"><span class="vegmark' + (p.veg ? '' : ' nv') + '"></span>' +
      '<span class="p-name" style="flex:1">' + esc(p.name) + '</span></div>' +
      '<div class="p-price">' + (pmin === pmax ? fmt(pmin) : fmt(pmin) + ' – ' + fmt(pmax)) + '</div></div></div>';
  }).join('');
}
function pickCat(c) { posCat = c; renderMenu() }

/* ---------- POS: item modal ---------- */
var MI = { pid: null, idx: 0, qty: 1 };
function openItemModal(pid) {
  var p = prodById(pid); if (!p) return;
  var firstOk = 0;
  p.items.forEach(function (it, i) { if (it.stock > 0) { firstOk = firstOk || i } });
  if (p.items[firstOk].stock <= 0) firstOk = 0;
  MI = { pid: pid, idx: firstOk, qty: 1 };
  $('#mi-title').textContent = p.name;
  $('#mi-name').textContent = p.name;
  $('#mi-cat').textContent = p.cat;
  $('#mi-veg').innerHTML = '<span class="vegmark' + (p.veg ? '' : ' nv') + '"></span>';
  var msrc = imgSrc(p);
  $('#mi-img').innerHTML = msrc ? '<img src="' + msrc + '" alt="" style="width:100%;height:100%;object-fit:cover">' : p.emoji;
  renderMIOpts();
  openModal('modal-item');
}
function renderMIOpts() {
  var p = prodById(MI.pid); if (!p) return;
  $('#mi-opts').innerHTML = p.items.map(function (it, i) {
    var dis = it.stock <= 0;
    return '<div class="mi-opt' + (i === MI.idx ? ' on' : '') + (dis ? ' dis' : '') + '"' + (dis ? '' : ' onclick="miPick(' + i + ')"') + '>' +
      '<div class="mo-l">' + esc(it.label) + '</div>' +
      '<div style="text-align:right"><div class="mo-p">' + fmt(it.price) + '</div>' +
      '<div class="mo-s">' + (dis ? 'Out of stock' : it.stock + ' in stock') + '</div></div></div>';
  }).join('');
  updateMIQty();
}
function miPick(i) { MI.idx = i; MI.qty = 1; renderMIOpts() }
function updateMIQty() {
  var p = prodById(MI.pid); if (!p) return;
  var it = p.items[MI.idx]; if (!it) return;
  var max = Math.max(1, it.stock);
  if (MI.qty > max) MI.qty = max;
  if (MI.qty < 1) MI.qty = 1;
  $('#mi-qty').textContent = MI.qty;
  $('#mi-stock-note').textContent = it.stock > 0
    ? ((p.items.length > 1 ? '“' + it.label + '” — ' : '') + it.stock + ' available')
    : 'This option is out of stock';
}
function miStep(d) { MI.qty += d; updateMIQty() }
function addItemToCart() {
  var p = prodById(MI.pid); if (!p) return;
  var it = p.items[MI.idx];
  if (!it || it.stock < 1) { toast('❌ Out of stock'); return }
  if (MI.qty > it.stock) { toast('Only ' + it.stock + ' left in stock'); MI.qty = it.stock; updateMIQty(); return }
  var line = null;
  CART.lines.forEach(function (l) { if (l.pid === p.id && l.label === it.label) line = l });
  if (line) {
    if (line.qty + MI.qty > it.stock) { toast('Only ' + it.stock + ' in stock — ' + line.qty + ' already in order'); return }
    line.qty += MI.qty;
  } else {
    CART.lines.push({ pid: p.id, label: it.label, price: it.price, qty: MI.qty });
  }
  closeModal('modal-item'); renderCart();
  toast('✅ ' + p.name + ' added to order');
}

/* ---------- POS: cart ---------- */
function cartTotals() {
  var sub = 0;
  CART.lines.forEach(function (l) { sub += l.price * l.qty });
  var gst = Math.round(sub * DB.settings.gst / 100 * 100) / 100;
  var raw = sub + gst, tot = Math.round(raw);
  return { sub: sub, gst: gst, roff: Math.round((tot - raw) * 100) / 100, total: tot };
}
function renderOrderFields() {
  var f = $('#order-fields');
  if (CART.type === 'Dine-In') {
    f.innerHTML = '<input id="f-table" placeholder="Table no. (e.g. T5)" value="' + esc(CART.table) + '" maxlength="6" oninput="CART.table=this.value">';
  } else if (CART.type === 'Parcel') {
    f.innerHTML = '<input id="f-cust" placeholder="Customer name" value="' + esc(CART.cust) + '" maxlength="30" oninput="CART.cust=this.value">' +
      '<input id="f-phone" placeholder="Phone (optional)" value="' + esc(CART.phone) + '" maxlength="12" oninput="CART.phone=this.value">';
  } else {
    f.innerHTML = '<input id="f-cust" placeholder="Customer name (optional)" value="' + esc(CART.cust) + '" maxlength="30" oninput="CART.cust=this.value">';
  }
}
function renderCart() {
  renderOrderFields();
  var T = cartTotals();
  $('#cart-gst-l').textContent = 'GST (' + DB.settings.gst + '%)';
  $('#cart-sub').textContent = fmt(T.sub);
  $('#cart-gst').textContent = fmt2(T.gst);
  $('#cart-roff').textContent = (T.roff < 0 ? '−' : '+') + '₹' + Math.abs(T.roff).toFixed(2);
  $('#cart-total').textContent = fmt(T.total);
  /* bottom cart bar (mobile) */
  var cn = 0; CART.lines.forEach(function (l) { cn += l.qty });
  $('#cb-count').textContent = cn;
  $('#cb-items').textContent = cn + (cn === 1 ? ' item' : ' items');
  $('#cb-total').textContent = fmt(T.total);
  $('#cartbar').classList.toggle('hidden', CART.lines.length === 0);
  var el = $('#cart-lines');
  if (!CART.lines.length) {
    el.innerHTML = '<div class="cart-empty"><div>🛒</div>Tap dishes from the menu<br>to start a new order</div>';
    $('#btn-genbill').disabled = true;
    return;
  }
  $('#btn-genbill').disabled = false;
  el.innerHTML = CART.lines.map(function (l, i) {
    var p = prodById(l.pid), multi = p && p.items.length > 1;
    var csrc = p ? imgSrc(p) : null;
    var thumb = csrc ? '<img class="cl-thumb" src="' + csrc + '" alt="">' : '<div class="cl-thumb emoji">' + (p ? p.emoji : '🍽️') + '</div>';
    return '<div class="cl"><div class="cl-top">' + thumb + '<div class="cl-name" style="flex:1">' + esc(p ? p.name : '?') +
      '<small>' + esc(multi ? l.label + ' • ' + fmt(l.price) : fmt(l.price)) + '</small></div>' +
      '<button class="x" style="width:26px;height:26px;font-size:12px" onclick="rmLine(' + i + ')">✕</button></div>' +
      '<div class="cl-bot"><div class="stepper"><button onclick="chQty(' + i + ',-1)">−</button><b>' + l.qty + '</b><button onclick="chQty(' + i + ',1)">＋</button></div>' +
      '<span class="cl-amt">' + fmt(l.price * l.qty) + '</span></div></div>';
  }).join('');
}
function chQty(i, d) {
  var l = CART.lines[i]; if (!l) return;
  var p = prodById(l.pid);
  var it = p ? p.items.filter(function (x) { return x.label === l.label })[0] : null;
  var max = it ? it.stock : 99;
  var nq = l.qty + d;
  if (nq < 1) return;
  if (nq > max) { toast('Only ' + max + ' in stock'); return }
  l.qty = nq; renderCart();
}
function rmLine(i) { CART.lines.splice(i, 1); renderCart() }
function clearCart() {
  if (!CART.lines.length) return;
  confirmBox('Clear the current order?', function () { CART.lines = []; renderCart(); toast('🧹 Order cleared') });
}
/* mobile cart drawer */
function openCart() { $('#cart-panel').classList.add('open'); $('#cart-backdrop').classList.add('on') }
function closeCart() { $('#cart-panel').classList.remove('open'); $('#cart-backdrop').classList.remove('on') }

/* ---------- POS: generate bill ---------- */
function generateBill() {
  if (!CART.lines.length) return;
  for (var i = 0; i < CART.lines.length; i++) {
    var l = CART.lines[i], p = prodById(l.pid);
    var it = p ? p.items.filter(function (x) { return x.label === l.label })[0] : null;
    if (!p || !it) { CART.lines.splice(i, 1); i--; continue }
    if (l.qty > it.stock) { toast('❌ ' + p.name + ' (' + l.label + '): only ' + it.stock + ' left'); renderCart(); return }
  }
  if (!CART.lines.length) { renderCart(); return }
  var s = getSession(), T = cartTotals();
  var bill = {
    id: 'BILL-' + (++DB.counters.bill), t: Date.now(),
    type: CART.type, table: CART.table.trim(), cust: CART.cust.trim(), phone: CART.phone.trim(),
    pay: CART.pay,
    items: CART.lines.map(function (l) { var p = prodById(l.pid); return { pid: l.pid, name: p ? p.name : '?', label: l.label, price: l.price, qty: l.qty } }),
    sub: T.sub, gst: T.gst, roff: T.roff, total: T.total,
    by: s ? s.name : '?', cancelled: false
  };
  CART.lines.forEach(function (l) {
    var p = prodById(l.pid);
    p.items.forEach(function (it) { if (it.label === l.label) it.stock = Math.max(0, it.stock - l.qty) });
  });
  DB.bills.push(bill);
  CART.lines = []; CART.table = ''; CART.cust = ''; CART.phone = '';
  closeCart();
  checkLowStock(); save();
  renderMenu(); renderCart();
  showBill(bill.id, true);
}

/* ---------- receipt (thermal) ---------- */
function receiptHTML(b) {
  var s = DB.settings;
  var lines = b.items.map(function (l) {
    var p = prodById(l.pid), multi = p && p.items.length > 1;
    var nm = esc(l.name) + (multi ? ' (' + esc(l.label) + ')' : '');
    return '<div class="r-itm"><span class="qty">' + l.qty + '×</span><span class="nm">' + nm + '</span><span class="amt">' + fmt(l.price * l.qty) + '</span></div>';
  }).join('');
  var meta = [
    ['Bill No', '<b>' + esc(b.id) + '</b>'],
    ['Date', new Date(b.t).toLocaleString('en-IN', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' })],
    ['Order', b.type + (b.type === 'Dine-In' && b.table ? ' / ' + esc(b.table) : '') + (b.type !== 'Dine-In' && b.cust ? ' / ' + esc(b.cust) : '')]
  ];
  if (b.phone) meta.push(['Phone', esc(b.phone)]);
  meta.push(['Payment', b.pay]);
  meta.push(['Cashier', esc(b.by)]);
  var itemsCount = b.items.reduce(function (a, l) { return a + l.qty }, 0);
  return '<div class="receipt' + (s.paper === '58' ? ' paper58' : '') + '">' +
    '<div class="rc">' + (s.logo ? '<img class="r-logo" src="' + s.logo + '" alt="logo">' : '') + '<div class="r-name">' + esc(s.name) + '</div>' +
    '<div class="r-sub">' + esc(s.addr) + '</div>' +
    '<div class="r-sub">Ph: ' + esc(s.phone) + '</div>' +
    (s.gstin ? '<div class="r-sub">GSTIN: ' + esc(s.gstin) + '</div>' : '') + '</div>' +
    '<div class="rdash"></div>' +
    meta.map(function (m) { return '<div class="rr"><span>' + m[0] + ':</span><span>' + m[1] + '</span></div>' }).join('') +
    '<div class="rdash"></div>' + lines + '<div class="rdash"></div>' +
    '<div class="rr"><span>Subtotal</span><span>' + fmt2(b.sub) + '</span></div>' +
    '<div class="rr"><span>CGST (' + (s.gst / 2) + '%)</span><span>' + fmt2(b.gst / 2) + '</span></div>' +
    '<div class="rr"><span>SGST (' + (s.gst / 2) + '%)</span><span>' + fmt2(b.gst / 2) + '</span></div>' +
    '<div class="rr"><span>Round off</span><span>' + (b.roff < 0 ? '-' : '+') + Math.abs(b.roff).toFixed(2) + '</span></div>' +
    '<div class="rr r-big"><span>TOTAL</span><span>' + fmt(b.total) + '</span></div>' +
    '<div class="rdash"></div>' +
    (b.cancelled ? '<div class="rc" style="font-weight:bold;letter-spacing:2px">*** CANCELLED ***</div>' : '') +
    '<div class="rc r-note">' + esc(s.footer) + '</div>' +
    '<div class="rc r-note">' + itemsCount + ' items · ' + (s.paper === '58' ? '58mm' : '80mm') + ' thermal</div>' +
    '</div>';
}

/* ---------- bill modal / print / cancel ---------- */
var CURBILL = null;
function showBill(id, fresh) {
  var b = billById(id); if (!b) return;
  CURBILL = b;
  $('#mb-title').textContent = fresh ? '✅ Bill ' + b.id + ' Generated' : 'Bill ' + b.id;
  $('#mb-body').innerHTML =
    (fresh ? '<div class="bill-success">Bill <b>' + esc(b.id) + '</b> created · ' + fmt(b.total) + ' paid by ' + esc(b.pay) + ' · stock updated</div>' : '') +
    '<div style="background:#f4f5f9;border-radius:14px;padding:14px;box-shadow:inset 0 2px 8px rgba(0,0,0,.06);max-height:52vh;overflow:auto">' + receiptHTML(b) + '</div>';
  $('#btn-bill-cancel').classList.toggle('hidden', !!b.cancelled);
  $$('#paper-toggle button').forEach(function (btn) { btn.classList.toggle('on', btn.dataset.paper === DB.settings.paper) });
  openModal('modal-bill');
}
function setPaper(w) {
  DB.settings.paper = w; save();
  $$('#paper-toggle button').forEach(function (btn) { btn.classList.toggle('on', btn.dataset.paper === w) });
  if (CURBILL) {
    var box = $('#mb-body').querySelector('div');
    if (box) box.innerHTML = receiptHTML(CURBILL);
  }
}
function printBill() {
  if (!CURBILL) return;
  $('#print-area').innerHTML = receiptHTML(CURBILL);
  try { window.print() } catch (e) { }
  toast('🖨️ Printing ' + CURBILL.id + ' — if no dialog opens here, download the file and open it in your browser');
}
function cancelBill() {
  if (!CURBILL || CURBILL.cancelled) return;
  var b = CURBILL;
  confirmBox('Cancel bill ' + b.id + '? The stock will be restored and this bill will be excluded from revenue.', function () {
    b.cancelled = true;
    b.items.forEach(function (l) {
      var p = prodById(l.pid);
      if (p) p.items.forEach(function (it) { if (it.label === l.label) it.stock += l.qty });
    });
    checkLowStock(); save();
    closeModal('modal-bill');
    toast('🗑️ Bill ' + b.id + ' cancelled — stock restored');
    if ($('#screen-admin').classList.contains('active')) { renderDash(); renderBills(); renderStock() }
    else renderMenu();
  });
}

/* ---------- POS entry + clock ---------- */
var clockOn = false;
function enterPOS() {
  var s = getSession();
  $('#pos-user').textContent = s ? s.name : '—';
  $('#pos-av').textContent = (s && s.name) ? s.name[0].toUpperCase() : '?';
  $('#btn-admin-panel').classList.toggle('hidden', !(s && s.role === 'admin'));
  renderMenu(); renderCart();
  if (!clockOn) {
    clockOn = true;
    var tick = function () {
      var d = new Date(), el = $('#pos-clock'); if (!el) return;
      el.innerHTML = '<b>' + d.toLocaleTimeString('en-IN', { hour12: false }) + '</b><br><span>' +
        d.toLocaleDateString('en-IN', { weekday: 'short', day: 'numeric', month: 'short', year: 'numeric' }) + '</span>';
    };
    tick(); setInterval(tick, 1000);
  }
}

/* ---------- core bindings ---------- */
function bindCore() {
  $('#login-form').addEventListener('submit', doLogin);
  $('#login-tab-billing').onclick = function () { setLoginRole('billing') };
  $('#login-tab-admin').onclick = function () { setLoginRole('admin') };
  $('#fill-admin').onclick = function () { setLoginRole('admin'); $('#login-u').value = 'admin'; $('#login-p').value = 'admin123' };
  $('#fill-billing').onclick = function () { setLoginRole('billing'); $('#login-u').value = 'billing'; $('#login-p').value = 'billing123' };
  $('#btn-logout-pos').onclick = logout;
  $('#btn-logout-adm').onclick = logout;
  $('#btn-admin-panel').onclick = function () { show('screen-admin'); $('#adm-user').textContent = getSession().name; $('#adm-av').textContent = 'A'; goPage('dash') };
  $('#btn-go-pos').onclick = function () { show('screen-pos'); enterPOS() };
  $('#menu-search').addEventListener('input', function () { posQ = this.value; renderMenu() });
  $('#mi-minus').onclick = function () { miStep(-1) };
  $('#mi-plus').onclick = function () { miStep(1) };
  $('#btn-mi-add').onclick = addItemToCart;
  $('#btn-clearcart').onclick = clearCart;
  $('#cartbar-btn').onclick = openCart;
  $('#btn-close-cart').onclick = closeCart;
  $('#cart-backdrop').onclick = closeCart;
  $('#btn-genbill').onclick = generateBill;
  $$('#ot-seg button').forEach(function (b) {
    b.onclick = function () {
      CART.type = b.dataset.type;
      $$('#ot-seg button').forEach(function (x) { x.classList.toggle('on', x === b) });
      renderOrderFields();
    };
  });
  $$('#pay-seg button').forEach(function (b) {
    b.onclick = function () {
      CART.pay = b.dataset.pay;
      $$('#pay-seg button').forEach(function (x) { x.classList.toggle('on', x === b) });
    };
  });
  $('#bell-btn-pos').onclick = toggleBell;
  $('#bell-btn-adm').onclick = toggleBell;
  $('#btn-bell-read').onclick = markAllRead;
  $('#btn-bell-clear').onclick = clearNotifs;
  $('#btn-bill-print').onclick = printBill;
  $('#btn-bill-cancel').onclick = cancelBill;
  $$('#paper-toggle button').forEach(function (b) { b.onclick = function () { setPaper(b.dataset.paper) } });
  $('#btn-cf-ok').onclick = function () { closeModal('modal-confirm'); if (CF_CB) { var cb = CF_CB; CF_CB = null; cb() } };
  $('#btn-cf-no').onclick = function () { CF_CB = null; closeModal('modal-confirm') };
  $$('.modal-back').forEach(function (m) {
    m.addEventListener('mousedown', function (e) { if (e.target === m) closeModal(m.id) });
  });
  document.addEventListener('click', function (e) {
    var d = $('#bell-drop');
    if (!d.classList.contains('hidden') && !d.contains(e.target) &&
      !(e.target.closest && (e.target.closest('#bell-btn-pos') || e.target.closest('#bell-btn-adm')))) d.classList.add('hidden');
  });
  document.addEventListener('keydown', function (e) {
    if (e.key === 'Escape') {
      $$('.modal-back').forEach(function (m) { m.classList.add('hidden') });
      $('#bell-drop').classList.add('hidden'); CF_CB = null;
    }
  });
}

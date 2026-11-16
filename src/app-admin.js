/* ================================================================
   ADMIN PANEL — dashboard, bills, stock, products, settings
   ================================================================ */
var CURPAGE = 'dash';

function goPage(pg) {
  CURPAGE = pg;
  $$('.nav-btn[data-page]').forEach(function (b) { b.classList.toggle('on', b.dataset.page === pg) });
  $$('.page').forEach(function (p) { p.classList.toggle('on', p.id === 'page-' + pg) });
  if (pg === 'dash') renderDash();
  if (pg === 'bills') renderBills();
  if (pg === 'stock') renderStock();
  if (pg === 'addprod') { if (!$('#pf-items').children.length) openProductForm(null) }
  if (pg === 'settings') renderSettings();
}

/* ---------- dashboard ---------- */
function renderDash() {
  var todayK = dkey(Date.now());
  var tRev = 0, tB = 0, aRev = 0, lowN = 0;
  DB.bills.forEach(function (b) {
    if (b.cancelled) return;
    if (dkey(b.t) === todayK) { tRev += b.total; tB++ }
    aRev += b.total;
  });
  DB.products.forEach(function (p) { p.items.forEach(function (it) { if (it.stock <= p.threshold) lowN++ }) });
  $('#st-today-rev').textContent = fmt(tRev);
  $('#st-today-bills').textContent = tB;
  $('#st-total-rev').textContent = fmt(aRev);
  $('#st-low').textContent = lowN;
  $('#dash-date').textContent = '· ' + new Date().toLocaleDateString('en-IN', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' });
  $('#chart7').innerHTML = chart7HTML();
  var bs = bestSellers(8);
  $('#best-list').innerHTML = bs.length ? bs.map(function (x, i) {
    var p = prodById(x.pid);
    var bsrc = p ? imgSrc(p) : null;
    var maxq = bs[0].qty || 1;
    return '<div class="best-row"><div class="best-rank">' + (i + 1) + '</div><div class="best-mid">' +
      '<div class="best-name">' + (bsrc ? '<img class="best-thumb" src="' + bsrc + '" alt="">' : '<span class="vegmark' + ((p ? p.veg : true) ? '' : ' nv') + '"></span>') + esc(p ? p.name : x.name) + '</div>' +
      '<div style="background:#f1f3f5;border-radius:4px"><div class="best-bar" style="width:' + Math.max(5, Math.round(100 * x.qty / maxq)) + '%"></div></div></div>' +
      '<div class="best-meta"><b>' + x.qty + ' sold</b>' + fmt(x.rev) + '</div></div>';
  }).join('') : '<div class="empty-state"><div>📦</div>No sales yet</div>';
  var rec = DB.bills.slice().sort(function (a, b) { return b.t - a.t }).slice(0, 5);
  $('#recent-bills').innerHTML = '<thead><tr><th>Bill ID</th><th>Time</th><th>Order</th><th>Payment</th><th>Total</th></tr></thead><tbody>' +
    (rec.length ? rec.map(function (b) {
      return '<tr class="clickable" onclick="viewBill(\'' + b.id + '\')"><td class="id-cell">' + esc(b.id) +
        (b.cancelled ? ' <span class="badge badge-cancel">CANCELLED</span>' : '') + '</td><td>' + fmtDT(b.t) + '</td><td>' + b.type +
        (b.table ? ' · ' + esc(b.table) : '') + '</td><td>' + b.pay + '</td><td><b>' + fmt(b.total) + '</b></td></tr>';
    }).join('') : '<tr><td colspan="5" class="mut">No bills yet</td></tr>') + '</tbody>';
}

function chart7HTML() {
  var days = [];
  for (var i = 6; i >= 0; i--) {
    var dd = new Date(); dd.setDate(dd.getDate() - i);
    days.push({ k: dkey(dd.getTime()), lab: dd.toLocaleDateString('en-IN', { weekday: 'short' }), dnum: dd.getDate(), tot: 0 });
  }
  DB.bills.forEach(function (b) {
    if (b.cancelled) return;
    var k = dkey(b.t);
    days.forEach(function (x) { if (x.k === k) x.tot += b.total });
  });
  var max = Math.max.apply(null, days.map(function (x) { return x.tot }).concat([1]));
  var W = 680, H = 250, padB = 46, padT = 30, bw = 54, gap = (W - 7 * bw) / 8;
  var bars = days.map(function (x, i) {
    var h = x.tot > 0 ? Math.max(5, (H - padB - padT) * x.tot / max) : 3;
    var bx = gap + i * (bw + gap), by = H - padB - h;
    var isToday = i === 6;
    return '<rect x="' + bx + '" y="' + by + '" width="' + bw + '" height="' + h + '" rx="7" fill="' + (isToday ? '#e3b45b' : 'rgba(217,161,63,.38)') + '" opacity="' + (x.tot > 0 ? 1 : .35) + '"></rect>' +
      (x.tot > 0 ? '<text x="' + (bx + bw / 2) + '" y="' + (by - 8) + '" text-anchor="middle" font-size="13" font-weight="700" fill="#f5eee1">₹' + fmtK(x.tot) + '</text>' : '') +
      '<text x="' + (bx + bw / 2) + '" y="' + (H - padB + 18) + '" text-anchor="middle" font-size="12" fill="#b5a48e" font-weight="600">' + x.lab + '</text>' +
      '<text x="' + (bx + bw / 2) + '" y="' + (H - padB + 34) + '" text-anchor="middle" font-size="11" fill="#8a7a64">' + x.dnum + '</text>';
  }).join('');
  return '<svg viewBox="0 0 ' + W + ' ' + H + '" style="width:100%;height:auto;display:block">' + bars + '</svg>';
}

function bestSellers(n) {
  var m = {};
  DB.bills.forEach(function (b) {
    if (b.cancelled) return;
    b.items.forEach(function (l) {
      if (!m[l.pid]) m[l.pid] = { pid: l.pid, name: l.name, qty: 0, rev: 0 };
      m[l.pid].qty += l.qty; m[l.pid].rev += l.price * l.qty;
    });
  });
  return Object.keys(m).map(function (k) { return m[k] })
    .sort(function (a, b) { return b.qty - a.qty }).slice(0, n);
}

/* ---------- bills ---------- */
function renderBills() {
  var q = ($('#bill-search').value || '').trim().toUpperCase();
  var f = $('#bill-filter').value;
  var todayK = dkey(Date.now());
  var list = DB.bills.slice().sort(function (a, b) { return b.t - a.t }).filter(function (b) {
    if (q && b.id.toUpperCase().indexOf(q) < 0) return false;
    if (f === 'today' && dkey(b.t) !== todayK) return false;
    if (f === 'cancelled' && !b.cancelled) return false;
    return true;
  });
  var rev = 0; list.forEach(function (b) { if (!b.cancelled) rev += b.total });
  $('#bills-summary').textContent = '· ' + list.length + ' bills shown · ' + fmt(rev);
  $('#bills-tbl').innerHTML = '<thead><tr><th>Bill ID</th><th>Date &amp; Time</th><th>Order</th><th>Items</th><th>Payment</th><th>Total</th><th>Status</th><th style="text-align:right">Actions</th></tr></thead><tbody>' +
    (list.length ? list.map(function (b) {
      var itemsN = b.items.reduce(function (a, l) { return a + l.qty }, 0);
      return '<tr><td class="id-cell">' + esc(b.id) + '</td><td>' + fmtDT(b.t) + '</td><td>' + b.type +
        (b.type === 'Dine-In' && b.table ? ' · ' + esc(b.table) : '') + (b.cust ? ' · ' + esc(b.cust) : '') +
        '</td><td>' + itemsN + '</td><td>' + b.pay + '</td><td><b>' + fmt(b.total) + '</b></td>' +
        '<td>' + (b.cancelled ? '<span class="badge badge-cancel">Cancelled</span>' : '<span class="badge badge-paid">Paid</span>') + '</td>' +
        '<td><div class="row-actions"><button class="mini-act" title="View & print" onclick="viewBill(\'' + b.id + '\')">👁️</button></div></td></tr>';
    }).join('') : '<tr><td colspan="8"><div class="empty-state"><div>🧾</div>No bills found — try another Bill ID</div></td></tr>') + '</tbody>';
}
function viewBill(id) { showBill(id, false) }

/* ---------- stock ---------- */
function renderStock() {
  var c = catData(), sel = $('#stk-cat'), cur = sel.value || 'all';
  sel.innerHTML = '<option value="all">All categories</option>' + c.list.map(function (x) { return '<option value="' + esc(x) + '">' + esc(x) + '</option>' }).join('');
  sel.value = (cur !== 'all' && c.list.indexOf(cur) >= 0) ? cur : 'all';
  var catSel = sel.value;
  var q = ($('#stk-search').value || '').toLowerCase();
  var lowOnly = $('#stk-low').checked;
  var list = DB.products.filter(function (p) {
    if (q && p.name.toLowerCase().indexOf(q) < 0) return false;
    if (catSel !== 'all' && p.cat !== catSel) return false;
    if (lowOnly && !p.items.some(function (it) { return it.stock <= p.threshold })) return false;
    return true;
  });
  var lowCount = 0;
  DB.products.forEach(function (p) { p.items.forEach(function (it) { if (it.stock <= p.threshold) lowCount++ }) });
  $('#stock-count').textContent = '· ' + DB.products.length + ' products · ' + lowCount + ' low on stock';
  $('#stock-tbl').innerHTML = '<thead><tr><th>Product</th><th>Category</th><th>Quantity options · price · stock</th><th>Alert below</th><th style="text-align:right">Actions</th></tr></thead><tbody>' +
    (list.length ? list.map(function (p) {
      var anyLow = p.items.some(function (it) { return it.stock <= p.threshold });
      var allZero = p.items.every(function (it) { return it.stock <= 0 });
      return '<tr class="' + (anyLow ? 'lowrow' : '') + '">' +
        '<td><div class="prod-cell"><div class="pic">' + (imgSrc(p) ? '<img src="' + imgSrc(p) + '">' : p.emoji) + '</div>' +
        '<div><b><span class="vegmark' + (p.veg ? '' : ' nv') + '"></span>' + esc(p.name) + '</b>' +
        '<small>' + (allZero ? '❌ OUT OF STOCK' : (anyLow ? '⚠️ LOW STOCK' : '✓ In stock')) + '</small></div></div></td>' +
        '<td style="font-size:12.5px">' + esc(p.cat) + '</td>' +
        '<td><div class="stk-groups">' + p.items.map(function (it, i) {
          return '<div class="stk-group' + (it.stock <= p.threshold ? ' low' : '') + '"><span class="sg-l">' + esc(it.label) + '</span><span class="sg-p">' + fmt(it.price) + '</span>' +
            '<div class="stepper sm"><button onclick="bumpStock(\'' + p.id + '\',' + i + ',-1)">−</button>' +
            '<input value="' + it.stock + '" onchange="setStock(\'' + p.id + '\',' + i + ',this.value)">' +
            '<button onclick="bumpStock(\'' + p.id + '\',' + i + ',1)">＋</button></div></div>';
        }).join('') + '</div></td>' +
        '<td>' + p.threshold + '</td>' +
        '<td><div class="row-actions">' +
        '<button class="mini-act" title="Restock" onclick="restockModal(\'' + p.id + '\')">📥</button>' +
        '<button class="mini-act" title="Edit product" onclick="editProduct(\'' + p.id + '\')">✏️</button>' +
        '<button class="mini-act danger" title="Delete product" onclick="deleteProduct(\'' + p.id + '\')">🗑️</button>' +
        '</div></td></tr>';
    }).join('') : '<tr><td colspan="5"><div class="empty-state"><div>📦</div>No products found</div></td></tr>') + '</tbody>';
}
function bumpStock(pid, i, d) { var p = prodById(pid); if (!p || !p.items[i]) return; setStock(pid, i, p.items[i].stock + d) }
function setStock(pid, i, v) {
  var p = prodById(pid); if (!p || !p.items[i]) return;
  var n = parseInt(v, 10); if (isNaN(n) || n < 0) n = 0;
  p.items[i].stock = n;
  checkLowStock(); save(); renderStock();
}
var RS = { pid: null };
function restockModal(pid) {
  var p = prodById(pid); if (!p) return;
  RS.pid = pid;
  $('#rs-prod').textContent = p.name + ' — ' + p.cat;
  $('#rs-item').innerHTML = p.items.map(function (it, i) { return '<option value="' + i + '">' + esc(it.label) + ' (current stock: ' + it.stock + ')</option>' }).join('');
  $('#rs-qty').value = 10;
  openModal('modal-restock');
}
function doRestock() {
  var p = prodById(RS.pid); if (!p) return;
  var i = parseInt($('#rs-item').value, 10) || 0;
  var n = parseInt($('#rs-qty').value, 10);
  if (!n || n < 1) { toast('Enter a quantity to add'); return }
  p.items[i].stock += n;
  checkLowStock(); save(); closeModal('modal-restock'); renderStock();
  toast('📥 ' + p.name + ' restocked (+' + n + ' ' + esc(p.items[i].label) + ')');
}

/* ---------- product add / edit form ---------- */
var PF = { editId: null, img: null };
var EMOJIS = ['', '🍕', '🍔', '🍟', '🌭', '🥪', '🌮', '🌯', '🥗', '🍝', '🍜', '🍲', '🍛', '🍣', '🍱', '🥟', '🍗', '🍖', '🦐', '🐟', '🍚', '🥘', '🧀', '🥚', '🥔', '🥬', '🌽', '🍄', '🍞', '🫓', '🥞', '🥣', '🍦', '🍧', '🍰', '🍮', '🥮', '🍩', '🍪', '🍫', '☕', '🍵', '🥤', '🧃', '🥛', '💧', '🍋', '🌶️', '🧄', '🥜', '🍿', '🥠', '🍢', '🍥', '🫘', '🫛'];
var LABELS = ['Half', 'Full', 'Small', 'Large', 'Piece', 'Regular', 'Plate', 'Cup', 'Bowl', 'Glass', 'Bottle'];

function fillEmojiSelect() {
  $('#pf-emoji').innerHTML = '<option value="">🍽️ Default icon</option>' +
    EMOJIS.slice(1).map(function (e) { return '<option value="' + e + '">' + e + '</option>' }).join('');
}
function addFormItemRow(label, price, stock) {
  var row = document.createElement('div'); row.className = 'pfi-row';
  var isCustom = label && LABELS.indexOf(label) < 0;
  row.innerHTML =
    '<div class="pfi-lw"><select class="pfi-label">' +
    LABELS.map(function (l) { return '<option' + (l === label ? ' selected' : '') + '>' + l + '</option>' }).join('') +
    '<option value="__c"' + (isCustom ? ' selected' : '') + '>✏️ Custom…</option></select>' +
    '<input type="text" class="pfi-cust' + (isCustom ? '' : ' hidden') + '" placeholder="e.g. Jumbo" maxlength="18" value="' + esc(isCustom ? label : '') + '"></div>' +
    '<input type="number" class="pfi-price" min="1" placeholder="Price ₹" value="' + (price != null && price !== '' ? price : '') + '">' +
    '<input type="number" class="pfi-stock" min="0" placeholder="Stock" value="' + (stock != null && stock !== '' ? stock : '') + '">' +
    '<button type="button" class="x" style="width:34px;height:34px" title="Remove">✕</button>';
  var sel = row.querySelector('select'), cust = row.querySelector('.pfi-cust');
  sel.addEventListener('change', function () { cust.classList.toggle('hidden', sel.value !== '__c') });
  row.querySelector('button.x').onclick = function () { row.remove() };
  $('#pf-items').appendChild(row);
}
function openProductForm(p) {
  PF.editId = p ? p.id : null; PF.img = p ? p.img : null;
  $('#pf-title').textContent = p ? '✏️ Edit Product — ' + p.name : '➕ Add New Product';
  $('#pf-name').value = p ? p.name : '';
  $('#pf-cat').value = p ? p.cat : '';
  $('#pf-veg').value = p ? (p.veg ? '1' : '0') : '1';
  $('#pf-emoji').value = p ? (p.emoji || '') : '';
  $('#pf-threshold').value = p ? p.threshold : 10;
  var fsrc = p ? imgSrc(p) : null;
  $('#pf-img-prev').innerHTML = fsrc ? '<img src="' + fsrc + '">' : '<span>' + (p && p.emoji ? p.emoji : '🍽️') + '</span>';
  $('#pf-img-clear').classList.toggle('hidden', !(p && p.img));
  $('#pf-items').innerHTML = '';
  if (p) p.items.forEach(function (it) { addFormItemRow(it.label, it.price, it.stock) });
  else addFormItemRow('Regular', '', 25);
  $('#pf-err').classList.add('hidden');
  $('#cat-list').innerHTML = catData().list.map(function (c) { return '<option value="' + esc(c) + '">' }).join('');
}
function collectPFItems() {
  var out = [], seen = {};
  $$('#pf-items .pfi-row').forEach(function (r) {
    var sel = r.querySelector('select').value;
    var label = sel === '__c' ? r.querySelector('.pfi-cust').value.trim() : sel;
    var price = parseFloat(r.querySelector('.pfi-price').value);
    var stock = parseInt(r.querySelector('.pfi-stock').value, 10);
    if (!label || !isFinite(price) || price <= 0 || seen[label]) return;
    seen[label] = 1;
    out.push({ label: label, price: Math.round(price * 100) / 100, stock: (isNaN(stock) || stock < 0) ? 0 : stock });
  });
  return out;
}
function saveProduct(e) {
  e.preventDefault();
  var err = $('#pf-err');
  var name = $('#pf-name').value.trim();
  var cat = $('#pf-cat').value.trim() || 'Others';
  var veg = $('#pf-veg').value === '1';
  var emoji = $('#pf-emoji').value || '🍽️';
  var th = parseInt($('#pf-threshold').value, 10); if (isNaN(th) || th < 0) th = 10;
  var items = collectPFItems();
  var problems = [];
  if (!name) problems.push('product name');
  if (!cat) problems.push('category');
  if (items.length < 1) problems.push('at least one quantity option with a price');
  if (problems.length) { err.textContent = '❌ Please provide: ' + problems.join(', '); err.classList.remove('hidden'); window.scrollTo(0, 0); return }
  err.classList.add('hidden');
  if (PF.editId) {
    var p = prodById(PF.editId);
    if (p) { p.name = name; p.cat = cat; p.veg = veg; p.emoji = emoji; p.img = PF.img; p.threshold = th; p.items = items }
  } else {
    DB.products.push({ id: 'P' + (++DB.counters.prod), name: name, cat: cat, veg: veg, emoji: emoji, img: PF.img, threshold: th, items: items });
  }
  checkLowStock(); save();
  toast(PF.editId ? '✏️ Product updated' : '✅ ' + name + ' added to the menu');
  goPage('stock');
}
function editProduct(id) { var p = prodById(id); if (!p) return; openProductForm(p); goPage('addprod') }
function deleteProduct(id) {
  var p = prodById(id); if (!p) return;
  confirmBox('Delete "' + p.name + '" from the menu? Past bills are not affected.', function () {
    DB.products = DB.products.filter(function (x) { return x.id !== id });
    DB.notifs.forEach(function (n) { if (n.key.indexOf(id + '|') === 0) n.read = true });
    save(); renderBell(); renderStock(); renderMenu();
    toast('🗑️ ' + p.name + ' deleted');
  });
}
function bindImageInput() {
  $('#pf-img-btn').onclick = function () { $('#pf-img-file').click() };
  $('#pf-img-clear').onclick = function () {
    PF.img = null;
    $('#pf-img-prev').innerHTML = '<span>🍽️</span>';
    $('#pf-img-clear').classList.add('hidden');
    $('#pf-img-file').value = '';
  };
  $('#pf-img-file').addEventListener('change', function () {
    var inp = this, f = inp.files && inp.files[0];
    if (!f) return;
    if (!/^image\//.test(f.type)) { toast('Please choose an image file'); return }
    var reader = new FileReader();
    reader.onload = function (ev) {
      var im = new Image();
      im.onload = function () {
        var c = document.createElement('canvas');
        var sc = Math.min(1, 512 / Math.max(im.width, im.height));
        c.width = Math.max(1, Math.round(im.width * sc));
        c.height = Math.max(1, Math.round(im.height * sc));
        c.getContext('2d').drawImage(im, 0, 0, c.width, c.height);
        PF.img = c.toDataURL('image/jpeg', 0.85);
        $('#pf-img-prev').innerHTML = '<img src="' + PF.img + '">';
        $('#pf-img-clear').classList.remove('hidden');
        toast('🖼️ Image added');
      };
      im.onerror = function () { toast('Could not read that image') };
      im.src = ev.target.result;
    };
    reader.readAsDataURL(f);
    inp.value = '';
  });
}

/* ---------- settings ---------- */
function renderSettings() {
  var s = DB.settings;
  $('#set-name').value = s.name; $('#set-addr').value = s.addr; $('#set-phone').value = s.phone;
  $('#set-gstin').value = s.gstin; $('#set-gst').value = s.gst; $('#set-footer').value = s.footer; $('#set-paper').value = s.paper;
}
function saveSettings() {
  var s = DB.settings;
  s.name = $('#set-name').value.trim() || s.name;
  s.addr = $('#set-addr').value.trim();
  s.phone = $('#set-phone').value.trim();
  s.gstin = $('#set-gstin').value.trim();
  var g = parseFloat($('#set-gst').value); s.gst = (isNaN(g) || g < 0) ? 0 : g;
  s.footer = $('#set-footer').value.trim();
  s.paper = $('#set-paper').value;
  applyBrand(); save(); renderCart();
  toast('⚙️ Settings saved');
}

/* ---------- admin bindings ---------- */
function bindAdmin() {
  $$('.nav-btn[data-page]').forEach(function (b) {
    b.onclick = function () {
      if (b.dataset.page === 'addprod') openProductForm(null);
      goPage(b.dataset.page);
    };
  });
  $('#st-low-click').onclick = function () { goPage('stock'); $('#stk-low').checked = true; renderStock() };
  $('#bill-search').addEventListener('input', renderBills);
  $('#bill-filter').addEventListener('change', renderBills);
  $('#stk-search').addEventListener('input', renderStock);
  $('#stk-cat').addEventListener('change', renderStock);
  $('#stk-low').addEventListener('change', renderStock);
  $('#pform').addEventListener('submit', saveProduct);
  $('#btn-pf-additem').onclick = function () { addFormItemRow('', '', '') };
  $('#btn-pf-cancel').onclick = function () { goPage('stock') };
  $('#btn-rs-add').onclick = doRestock;
  $('#btn-set-save').onclick = saveSettings;
  $('#btn-reset-demo').onclick = function () {
    confirmBox('Reset ALL data back to fresh demo data (100 dishes + sample bills)? All your bills, stock changes and added products will be lost.', function () {
      resetDemo(); renderBell(); goPage(CURPAGE);
      toast('🔄 Fresh demo data restored');
    });
  };
}

/* ---------- boot ---------- */
function boot() {
  loadDB();
  bindCore();
  bindAdmin();
  fillEmojiSelect();
  bindImageInput();
  if (!LS_OK) $('#banner-storage').classList.remove('hidden');
  renderBell();
  route();
}
boot();

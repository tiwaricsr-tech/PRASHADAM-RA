/* ============================================================
   Integration test cases (run inside the vm after the app boots)
   ============================================================ */
var PASS = 0, FAIL = 0;
function T(name, cond) {
  if (cond) { PASS++; console.log('  ✓ ' + name) }
  else { FAIL++; console.log('  ✗ FAIL: ' + name) }
}
function ev() { return { preventDefault: function () { } } }

/* ---------- login & routing ---------- */
T('boot: login screen visible', $('#screen-login').classList.contains('active'));
T('boot: 100 products seeded', DB.products.length === 100);
T('boot: sample bills seeded', DB.bills.length === 26);
T('boot: low-stock notifications created', DB.notifs.length >= 3);

$('#login-u').value = 'admin'; $('#login-p').value = 'wrongpass'; setLoginRole('admin');
doLogin(ev());
T('wrong password shows error', !$('#login-err').classList.contains('hidden'));

$('#login-u').value = 'admin'; $('#login-p').value = 'admin123'; setLoginRole('billing');
doLogin(ev());
T('role mismatch shows error', !$('#login-err').classList.contains('hidden'));

$('#login-u').value = 'billing'; $('#login-p').value = 'billing123'; setLoginRole('billing');
doLogin(ev());
T('billing login → POS screen', $('#screen-pos').classList.contains('active'));
T('billing user has no admin button', $('#btn-admin-panel').classList.contains('hidden'));
T('menu renders 100 cards', $$('#menu-grid .p-card').length === 100);
T('stock photo library embedded — all 100 dishes (' + Object.keys(PHOTOS).length + ')', typeof PHOTOS !== 'undefined' && Object.keys(PHOTOS).length === 100);
T('menu cards show photos', $$('#menu-grid .p-img img').length === Object.keys(PHOTOS).length);
T('category chips rendered', $$('#cat-chips .chip').length === 13);

/* ---------- search & filter ---------- */
$('#menu-search').value = 'biryani'; posQ = 'biryani'; renderMenu();
T('search "biryani" finds 5 dishes', $$('#menu-grid .p-card').length === 5);
posQ = ''; $('#menu-search').value = ''; renderMenu();

/* ---------- item modal & cart ---------- */
var p45 = prodById('P43');
T('P43 is Chicken Biryani', p45.name === 'Chicken Biryani');
var fullIdx = p45.items.map(function (i) { return i.label }).indexOf('Full');
var startStock = p45.items[fullIdx].stock; /* 4 in seed */
openItemModal('P43');
T('item modal opens', !$('#modal-item').classList.contains('hidden'));
miPick(fullIdx); MI.qty = 3; updateMIQty(); addItemToCart();
T('Chicken Biryani Full x3 in cart', CART.lines.length === 1 && CART.lines[0].qty === 3);
T('cart line shows photo thumbnail', $$('#cart-lines .cl-thumb').length === 1);
closeModal('modal-item');

/* bottom cart bar (price shown at bottom of screen) */
var chai2 = DB.products.filter(function (p) { return p.name === 'Masala Chai' })[0];
openItemModal(chai2.id); MI.qty = 2; updateMIQty(); addItemToCart(); closeModal('modal-item');
T('bottom cart bar shows item count & total price', !$('#cartbar').classList.contains('hidden') && $('#cb-count').textContent === '5' && $('#cb-total').textContent === '₹704');
openCart();
T('cart drawer opens from bottom bar', $('#cart-panel').classList.contains('open') && $('#cart-backdrop').classList.contains('on'));
closeCart();
T('cart drawer closes', !$('#cart-panel').classList.contains('open') && !$('#cart-backdrop').classList.contains('on'));
CART.lines = CART.lines.filter(function (l) { return l.pid !== chai2.id }); renderCart();

var chai = DB.products.filter(function (p) { return p.name === 'Masala Chai' })[0];
openItemModal(chai.id); MI.qty = 2; updateMIQty(); addItemToCart();
T('2 lines in cart', CART.lines.length === 2);

/* out-of-stock product cannot be added */
var momos = DB.products.filter(function (p) { return p.name === 'Veg Momos (6 pcs)' })[0];
openItemModal(momos.id); addItemToCart();
T('out-of-stock item not added', CART.lines.length === 2 && $('#mi-qty').textContent === '1');
closeModal('modal-item');

/* quantity cap at available stock (only 4 Full, already 3 in cart) */
openItemModal('P43'); miPick(fullIdx); MI.qty = 5; updateMIQty();
T('qty capped at 4', $('#mi-qty').textContent === '4' && $('#mi-qty').textContent !== '5');
MI.qty = 1; updateMIQty(); addItemToCart();
T('merge same item line (3+1=4)', CART.lines.length === 2 && CART.lines[0].qty === 4);
closeModal('modal-item');

/* ---------- totals ---------- */
/* 4 × 210 (biryani full) + 2 × 20 (chai) = 880 ; gst 44 ; total 924 */
var Tt = cartTotals();
T('subtotal = 880', Tt.sub === 880);
T('gst 5% = 44', Tt.gst === 44);
T('total = 924', Tt.total === 924);

/* stock limit: 4 available, 4 in cart → cannot add more */
CART.lines[0].qty = 4; renderCart();
chQty(0, 1);
T('stock limit blocks 5th add', CART.lines[0].qty === 4);

/* ---------- order type & bill generation ---------- */
CART.type = 'Parcel'; CART.cust = 'Test Customer'; renderCart();
var nBills = DB.bills.length;
generateBill();
var b = DB.bills[DB.bills.length - 1];
T('bill created', DB.bills.length === nBills + 1);
T('bill id sequential (BILL-1027)', b.id === 'BILL-1027');
T('bill total = 924', b.total === 924);
T('bill captured customer', b.cust === 'Test Customer');
T('stock decremented 4→0', prodById('P43').items[fullIdx].stock === 0);
T('cart cleared', CART.lines.length === 0);
T('bottom cart bar hides when empty', $('#cartbar').classList.contains('hidden'));
T('bill modal shown', !$('#modal-bill').classList.contains('hidden'));
T('receipt contains TOTAL & restaurant name', $('#mb-body').innerHTML.indexOf('TOTAL') >= 0 && $('#mb-body').innerHTML.indexOf('Prashadam') >= 0);
T('low-stock notification raised for Chicken Biryani', DB.notifs.some(function (n) { return n.msg.indexOf('Chicken Biryani') >= 0 }));
T('bell badge shows unread', !$('#bell-badge-pos').classList.contains('hidden'));
closeModal('modal-bill');

/* out-of-stock card no longer clickable */
renderMenu();
var oosCard = $('#menu-grid .p-card.oos');
T('out-of-stock card marked (Veg Momos seeded at 0)', oosCard !== null);

/* ---------- admin ---------- */
logout();
T('logout returns to login', $('#screen-login').classList.contains('active'));
$('#login-u').value = 'admin'; $('#login-p').value = 'admin123'; setLoginRole('admin');
doLogin(ev());
T('admin login → admin screen', $('#screen-admin').classList.contains('active'));

/* dashboard */
T('today revenue rendered', $('#st-today-rev').textContent.indexOf('₹') === 0);
T('7-day chart svg rendered', $('#chart7').innerHTML.indexOf('<svg') === 0);
T('best sellers rendered', $$('#best-list .best-row').length >= 5);
T('recent bills rendered', $$('#recent-bills tbody tr').length === 5);

/* bills page + search by id */
goPage('bills');
T('all bills listed', $$('#bills-tbl tbody tr').length === DB.bills.length);
$('#bill-search').value = 'BILL-1001'; renderBills();
T('search by bill id finds 1', $$('#bills-tbl tbody tr').length === 1);
viewBill('BILL-1001');
T('bill view modal opens', !$('#modal-bill').classList.contains('hidden'));
T('view shows correct bill no', $('#mb-title').textContent.indexOf('BILL-1001') >= 0);
closeModal('modal-bill');

/* stock page */
goPage('stock');
T('stock table has 100 rows', $$('#stock-tbl tbody tr').length === 100);
T('low-stock row highlighted', $$('#stock-tbl tr.lowrow').length >= 3);
$('#stk-low').checked = true; renderStock();
T('low-stock filter works', $$('#stock-tbl tbody tr').length < 100);
$('#stk-low').checked = false; renderStock();

/* restock flow */
var before = prodById('P43').items[fullIdx].stock;
T('stock is 0 before restock', before === 0);
restockModal('P43');
$('#rs-item').value = String(fullIdx); $('#rs-qty').value = '25';
doRestock();
T('restock adds stock (0→25)', prodById('P43').items[fullIdx].stock === 25);
T('restock clears low-stock notif state', !DB.notifs.some(function (n) { return n.msg.indexOf('Chicken Biryani') >= 0 && !n.read }));

/* set stock directly */
setStock('P43', fullIdx, 30);
T('manual stock edit', prodById('P43').items[fullIdx].stock === 30);
bumpStock('P43', fullIdx, -1);
T('bumpStock -1', prodById('P43').items[fullIdx].stock === 29);

/* ---------- add / edit / delete product ---------- */
openProductForm(null);
$('#pf-name').value = 'Test Special Thali';
$('#pf-cat').value = 'Thalis';
$('#pf-veg').value = '1';
$('#pf-threshold').value = '5';
var row1 = $$('#pf-items .pfi-row')[0];
row1.querySelector('.pfi-price').value = '199';
row1.querySelector('.pfi-stock').value = '15';
addFormItemRow('Half', '', '10');
var row2 = $$('#pf-items .pfi-row')[1];
row2.querySelector('.pfi-price').value = '120';
saveProduct(ev());
T('new product saved (101 total)', DB.products.length === 101);
var np = DB.products[100];
T('new product got id P101', np.id === 'P101');
T('new product has 2 qty options', np.items.length === 2 && np.items[1].label === 'Half' && np.items[1].price === 120);
T('after save → stock page', $('#page-stock').classList.contains('on'));
T('new category appears in chips after menu render', (renderMenu(), $$('#cat-chips .chip').length === 14));

/* validation: empty name rejected */
openProductForm(null);
saveProduct(ev());
T('validation error shown', !$('#pf-err').classList.contains('hidden'));

/* edit product */
editProduct('P101');
T('edit form prefilled', $('#pf-name').value === 'Test Special Thali');
$('#pf-name').value = 'Test Special Thali Deluxe';
saveProduct(ev());
T('product renamed', prodById('P101').name === 'Test Special Thali Deluxe');

/* delete product */
deleteProduct('P101');
$('#btn-cf-ok').onclick();
T('product deleted (back to 100)', DB.products.length === 100);

/* ---------- cancel bill restores stock ---------- */
goPage('bills');
viewBill(b.id);
CURBILL = b;
var stockBeforeCancel = prodById('P43').items[fullIdx].stock; /* 29 */
cancelBill();
$('#btn-cf-ok').onclick();
T('bill marked cancelled', b.cancelled === true);
T('cancel restores stock (+4)', prodById('P43').items[fullIdx].stock === stockBeforeCancel + 4);
$('#bill-filter').value = 'cancelled'; renderBills();
T('cancelled filter shows the bill', $$('#bills-tbl tbody tr').length === 1);
$('#bill-filter').value = 'all'; renderBills();

/* cancelled bill excluded from revenue */
var rev = 0; DB.bills.forEach(function (x) { if (!x.cancelled) rev += x.total });
renderDash();
T('dash total revenue matches', $('#st-total-rev').textContent === fmt(rev));

/* ---------- settings ---------- */
goPage('settings');
$('#set-name').value = 'New Name Test'; $('#set-gst').value = '12';
saveSettings();
T('settings saved', DB.settings.name === 'New Name Test' && DB.settings.gst === 12);
T('brand updated in header', $('#pos-brand-name').textContent === 'New Name Test');
$('#set-name').value = 'Prashadam'; $('#set-gst').value = '5';
saveSettings();

/* ---------- notifications UI ---------- */
goPage('dash');
$('#bell-btn-adm').onclick();
T('bell dropdown opens with items', !$('#bell-drop').classList.contains('hidden') && $$('#bell-list .notif').length > 0);
markAllRead();
T('mark all read clears badge', $('#bell-badge-adm').classList.contains('hidden'));
clearNotifs();
T('clear empties list', DB.notifs.length === 0);

/* reset demo */
$('#btn-reset-demo').onclick();
$('#btn-cf-ok').onclick();
T('reset demo restores 100 products & bills', DB.products.length === 100 && DB.bills.length === 26);

window.__R = { PASS: PASS, FAIL: FAIL };
console.log('-------------------------------------------');
console.log('RESULTS: ' + PASS + ' passed, ' + FAIL + ' failed');

/* ================================================================
   SEED DATA — 100 dishes, demo users, sample bills
   ================================================================ */
var __LOGO = (typeof LOGO !== 'undefined' && LOGO) ? LOGO : null;

var SEED = (function () {
  /* deterministic RNG so demo data is stable */
  var _s = 987654321;
  function rnd() { _s = (_s * 1103515245 + 12345) % 2147483648; return _s / 2147483648; }
  function ri(a, b) { return a + Math.floor(rnd() * (b - a + 1)); }
  function pk(arr) { return arr[Math.floor(rnd() * arr.length)]; }
  function pkw(pairs) { /* [[item,weight],...] */
    var tot = 0; pairs.forEach(function (p) { tot += p[1]; });
    var r = rnd() * tot;
    for (var i = 0; i < pairs.length; i++) { r -= pairs[i][1]; if (r <= 0) return pairs[i][0]; }
    return pairs[0][0];
  }

  /* [name, category, veg(1/0), emoji, [[label, price], ...]] */
  var D = [
    /* ---- VEG STARTERS (9) ---- */
    ['Paneer Tikka', 'Veg Starters', 1, '🍢', [['Half', 130], ['Full', 240]]],
    ['Hara Bhara Kebab', 'Veg Starters', 1, '🥬', [['Plate', 180]]],
    ['Crispy Corn', 'Veg Starters', 1, '🌽', [['Plate', 190]]],
    ['Cheese Corn Balls', 'Veg Starters', 1, '🧆', [['Plate', 200]]],
    ['Mushroom Chilli (Dry)', 'Veg Starters', 1, '🍄', [['Plate', 210]]],
    ['Paneer Chilli (Dry)', 'Veg Starters', 1, '🧀', [['Plate', 230]]],
    ['Honey Chilli Potato', 'Veg Starters', 1, '🍟', [['Plate', 190]]],
    ['French Fries', 'Veg Starters', 1, '🍟', [['Small', 90], ['Large', 140]]],
    ['Veg Spring Roll', 'Veg Starters', 1, '🥟', [['Plate', 160]]],
    /* ---- NON-VEG STARTERS (8) ---- */
    ['Chicken Tikka', 'Non-Veg Starters', 0, '🍗', [['Half', 150], ['Full', 260]]],
    ['Tandoori Chicken', 'Non-Veg Starters', 0, '🍗', [['Half', 190], ['Full', 320]]],
    ['Chicken 65', 'Non-Veg Starters', 0, '🌶️', [['Plate', 240]]],
    ['Chicken Lollipop', 'Non-Veg Starters', 0, '🍗', [['Plate', 260]]],
    ['Mutton Seekh Kebab', 'Non-Veg Starters', 0, '🍢', [['Plate', 300]]],
    ['Fish Amritsari', 'Non-Veg Starters', 0, '🐟', [['Plate', 310]]],
    ['Prawns Koliwada', 'Non-Veg Starters', 0, '🦐', [['Plate', 340]]],
    ['Chicken Wings (6 pcs)', 'Non-Veg Starters', 0, '🍗', [['Plate', 250]]],
    /* ---- SOUPS (5) ---- */
    ['Tomato Soup', 'Soups', 1, '🍅', [['Bowl', 110]]],
    ['Manchow Soup', 'Soups', 1, '🥣', [['Bowl', 120]]],
    ['Hot & Sour Soup', 'Soups', 1, '🥣', [['Bowl', 120]]],
    ['Sweet Corn Soup', 'Soups', 1, '🌽', [['Bowl', 120]]],
    ['Chicken Clear Soup', 'Soups', 0, '🍲', [['Bowl', 150]]],
    /* ---- VEG MAIN COURSE (10) ---- */
    ['Paneer Butter Masala', 'Veg Main Course', 1, '🧈', [['Half', 150], ['Full', 260]]],
    ['Shahi Paneer', 'Veg Main Course', 1, '👑', [['Half', 140], ['Full', 240]]],
    ['Palak Paneer', 'Veg Main Course', 1, '🥬', [['Half', 140], ['Full', 240]]],
    ['Kadhai Paneer', 'Veg Main Course', 1, '🌶️', [['Half', 150], ['Full', 250]]],
    ['Malai Kofta', 'Veg Main Course', 1, '🥔', [['Half', 150], ['Full', 250]]],
    ['Dal Makhani', 'Veg Main Course', 1, '🫘', [['Half', 130], ['Full', 220]]],
    ['Dal Tadka', 'Veg Main Course', 1, '🫘', [['Half', 110], ['Full', 180]]],
    ['Chana Masala', 'Veg Main Course', 1, '🫘', [['Half', 110], ['Full', 190]]],
    ['Mix Veg Sabzi', 'Veg Main Course', 1, '🥕', [['Half', 110], ['Full', 190]]],
    ['Bhindi Masala', 'Veg Main Course', 1, '🫛', [['Half', 110], ['Full', 180]]],
    /* ---- NON-VEG MAIN (7) ---- */
    ['Butter Chicken', 'Non-Veg Main', 0, '🍛', [['Half', 190], ['Full', 320]]],
    ['Chicken Curry', 'Non-Veg Main', 0, '🍛', [['Half', 170], ['Full', 290]]],
    ['Kadhai Chicken', 'Non-Veg Main', 0, '🌶️', [['Half', 180], ['Full', 300]]],
    ['Chicken Tikka Masala', 'Non-Veg Main', 0, '🍛', [['Half', 190], ['Full', 310]]],
    ['Mutton Rogan Josh', 'Non-Veg Main', 0, '🍖', [['Half', 230], ['Full', 380]]],
    ['Fish Curry', 'Non-Veg Main', 0, '🐟', [['Half', 190], ['Full', 320]]],
    ['Egg Curry', 'Non-Veg Main', 0, '🥚', [['Half', 110], ['Full', 180]]],
    /* ---- BIRYANI & RICE (10) ---- */
    ['Veg Biryani', 'Biryani & Rice', 1, '🍛', [['Half', 100], ['Full', 160]]],
    ['Paneer Biryani', 'Biryani & Rice', 1, '🧀', [['Half', 120], ['Full', 190]]],
    ['Egg Biryani', 'Biryani & Rice', 0, '🥚', [['Half', 110], ['Full', 180]]],
    ['Chicken Biryani', 'Biryani & Rice', 0, '🍗', [['Half', 130], ['Full', 210]]],
    ['Mutton Biryani', 'Biryani & Rice', 0, '🍖', [['Half', 170], ['Full', 280]]],
    ['Veg Fried Rice', 'Biryani & Rice', 1, '🍚', [['Half', 90], ['Full', 150]]],
    ['Chicken Fried Rice', 'Biryani & Rice', 0, '🍚', [['Half', 110], ['Full', 180]]],
    ['Schezwan Fried Rice', 'Biryani & Rice', 1, '🌶️', [['Half', 100], ['Full', 170]]],
    ['Jeera Rice', 'Biryani & Rice', 1, '🍚', [['Plate', 130]]],
    ['Veg Pulao', 'Biryani & Rice', 1, '🍲', [['Plate', 150]]],
    /* ---- BREADS (6) ---- */
    ['Tandoori Roti', 'Breads', 1, '🫓', [['Piece', 25]]],
    ['Butter Roti', 'Breads', 1, '🫓', [['Piece', 30]]],
    ['Plain Naan', 'Breads', 1, '🫓', [['Piece', 40]]],
    ['Butter Naan', 'Breads', 1, '🫓', [['Piece', 50]]],
    ['Garlic Naan', 'Breads', 1, '🧄', [['Piece', 60]]],
    ['Lachha Paratha', 'Breads', 1, '🥮', [['Piece', 55]]],
    /* ---- SOUTH INDIAN (8) ---- */
    ['Masala Dosa', 'South Indian', 1, '🥞', [['Plate', 120]]],
    ['Plain Dosa', 'South Indian', 1, '🥞', [['Plate', 80]]],
    ['Onion Dosa', 'South Indian', 1, '🧅', [['Plate', 100]]],
    ['Mysore Masala Dosa', 'South Indian', 1, '🌶️', [['Plate', 130]]],
    ['Ghee Roast Dosa', 'South Indian', 1, '🧈', [['Plate', 150]]],
    ['Idli Sambar (2 pcs)', 'South Indian', 1, '🍥', [['Plate', 60]]],
    ['Medu Vada (2 pcs)', 'South Indian', 1, '🍩', [['Plate', 60]]],
    ['Veg Uttapam', 'South Indian', 1, '🥞', [['Plate', 110]]],
    /* ---- CHINESE (10) ---- */
    ['Veg Hakka Noodles', 'Chinese', 1, '🍜', [['Half', 90], ['Full', 150]]],
    ['Chicken Hakka Noodles', 'Chinese', 0, '🍜', [['Half', 110], ['Full', 180]]],
    ['Veg Manchurian (Gravy)', 'Chinese', 1, '🥡', [['Plate', 170]]],
    ['Chicken Manchurian (Gravy)', 'Chinese', 0, '🥡', [['Plate', 210]]],
    ['Chilli Paneer', 'Chinese', 1, '🧀', [['Plate', 210]]],
    ['American Chopsuey', 'Chinese', 1, '🍝', [['Plate', 180]]],
    ['Veg Momos (6 pcs)', 'Chinese', 1, '🥟', [['Plate', 100]]],
    ['Chicken Momos (6 pcs)', 'Chinese', 0, '🥟', [['Plate', 130]]],
    ['Schezwan Noodles', 'Chinese', 1, '🍜', [['Half', 100], ['Full', 170]]],
    ['Burnt Garlic Rice', 'Chinese', 1, '🧄', [['Plate', 170]]],
    /* ---- CHAAT & SNACKS (10) ---- */
    ['Samosa', 'Chaat & Snacks', 1, '🥟', [['Piece', 15]]],
    ['Kachori', 'Chaat & Snacks', 1, '🥮', [['Piece', 15]]],
    ['Poha', 'Chaat & Snacks', 1, '🥣', [['Plate', 50]]],
    ['Pav Bhaji', 'Chaat & Snacks', 1, '🍞', [['Plate', 120]]],
    ['Vada Pav', 'Chaat & Snacks', 1, '🍔', [['Piece', 30]]],
    ['Chole Bhature', 'Chaat & Snacks', 1, '🍛', [['Plate', 130]]],
    ['Bhel Puri', 'Chaat & Snacks', 1, '🥗', [['Plate', 70]]],
    ['Sev Puri', 'Chaat & Snacks', 1, '🥗', [['Plate', 70]]],
    ['Dahi Puri', 'Chaat & Snacks', 1, '🥗', [['Plate', 80]]],
    ['Papdi Chaat', 'Chaat & Snacks', 1, '🥗', [['Plate', 80]]],
    /* ---- DESSERTS (8) ---- */
    ['Gulab Jamun (2 pcs)', 'Desserts', 1, '🍮', [['Plate', 60]]],
    ['Rasmalai (2 pcs)', 'Desserts', 1, '🥮', [['Plate', 80]]],
    ['Gajar Halwa', 'Desserts', 1, '🥕', [['Plate', 90]]],
    ['Moong Dal Halwa', 'Desserts', 1, '🍮', [['Plate', 100]]],
    ['Vanilla Ice Cream', 'Desserts', 1, '🍨', [['Plate', 60]]],
    ['Brownie with Ice Cream', 'Desserts', 1, '🍫', [['Plate', 150]]],
    ['Jalebi', 'Desserts', 1, '🍥', [['Plate', 70]]],
    ['Kulfi Falooda', 'Desserts', 1, '🍧', [['Plate', 110]]],
    /* ---- BEVERAGES (9) ---- */
    ['Masala Chai', 'Beverages', 1, '☕', [['Cup', 20]]],
    ['Filter Coffee', 'Beverages', 1, '☕', [['Cup', 30]]],
    ['Cold Drink', 'Beverages', 1, '🥤', [['Small', 25], ['Large', 40]]],
    ['Fresh Lime Soda', 'Beverages', 1, '🍋', [['Glass', 50]]],
    ['Sweet Lassi', 'Beverages', 1, '🥛', [['Glass', 60]]],
    ['Mango Shake', 'Beverages', 1, '🥤', [['Small', 70], ['Large', 100]]],
    ['Banana Shake', 'Beverages', 1, '🥤', [['Small', 70], ['Large', 100]]],
    ['Cold Coffee', 'Beverages', 1, '🧋', [['Small', 90], ['Large', 120]]],
    ['Mineral Water', 'Beverages', 1, '💧', [['Bottle', 20]]]
  ];

  var products = D.map(function (d, i) {
    return {
      id: 'P' + (i + 1),
      name: d[0], cat: d[1], veg: !!d[2], emoji: d[3], img: null,
      threshold: 10,
      items: d[4].map(function (x) { return { label: x[0], price: x[1], stock: ri(18, 55) }; })
    };
  });

  function byName(n) { for (var i = 0; i < products.length; i++) if (products[i].name === n) return products[i]; return null; }
  function setStock(n, label, v) { var p = byName(n); if (p) p.items.forEach(function (it) { if (it.label === label) it.stock = v; }); }
  /* deliberately low / out-of-stock items so the notification system is visible immediately */
  setStock('Chicken Biryani', 'Full', 4);
  setStock('Butter Naan', 'Piece', 6);
  setStock('Cold Drink', 'Large', 5);
  setStock('Veg Momos (6 pcs)', 'Plate', 0);

  var settings = {
    name: 'Prashadam',
    addr: '12, New Market, TT Nagar, Bhopal (M.P.)',
    phone: '+91 98765 43210',
    gstin: '23ABCDE1234F1Z5',
    gst: 5,
    footer: 'Thank You! Visit Again 😊',
    paper: '80',
    logo: __LOGO
  };

  var users = [
    { u: 'admin', p: 'admin123', role: 'admin', name: 'Admin' },
    { u: 'billing', p: 'billing123', role: 'billing', name: 'Cashier' }
  ];

  /* ---------- sample bills for the last 7 days ---------- */
  var popular = ['Chicken Biryani', 'Butter Naan', 'Paneer Butter Masala', 'Masala Dosa', 'Cold Drink',
    'Masala Chai', 'Butter Chicken', 'Dal Makhani', 'Gulab Jamun (2 pcs)', 'Veg Hakka Noodles',
    'Tandoori Roti', 'Sweet Lassi', 'Chicken Tikka', 'Pav Bhaji', 'Jeera Rice', 'Filter Coffee'];
  var bills = [];
  var counter = 1000;

  function mkBill(t, type, table, cust, pay) {
    var nLines = ri(2, 5), used = {}, lines = [];
    for (var i = 0; i < nLines; i++) {
      var p = byName(rnd() < 0.68 ? pk(popular) : pk(D)[0]);
      if (!p || used[p.id]) { i--; continue; }
      used[p.id] = 1;
      var it = pk(p.items);
      var qty = (it.price <= 60) ? ri(1, 4) : ri(1, 2);
      lines.push({ pid: p.id, name: p.name, label: it.label, price: it.price, qty: qty });
    }
    var sub = 0; lines.forEach(function (l) { sub += l.price * l.qty; });
    var gst = Math.round(sub * settings.gst / 100 * 100) / 100;
    var raw = sub + gst, total = Math.round(raw);
    return {
      id: 'BILL-' + (++counter), t: t, type: type, table: table, cust: cust, pay: pay,
      items: lines, sub: sub, gst: gst, roff: Math.round((total - raw) * 100) / 100,
      total: total, by: 'billing', cancelled: false
    };
  }

  for (var day = 6; day >= 0; day--) {
    var n = (day === 0) ? 3 : ri(3, 6);
    for (var b = 0; b < n; b++) {
      var t;
      if (day === 0) { t = Date.now() - (b === 0 ? 40 * 60000 : b === 1 ? 3 * 3600000 : 6 * 3600000) - ri(0, 9) * 60000; }
      else { var d = new Date(); d.setDate(d.getDate() - day); d.setHours(ri(11, 22), ri(0, 59), ri(0, 59), 0); t = d.getTime(); }
      var type = pkw([['Dine-In', 55], ['Parcel', 30], ['Pack', 15]]);
      var table = type === 'Dine-In' ? 'T' + ri(1, 12) : '';
      var cust = type !== 'Dine-In' ? pk(['Rahul', 'Priya', 'Amit', 'Sneha', 'Vikas', 'Pooja', '']) : '';
      var pay = pkw([['Cash', 45], ['UPI', 40], ['Card', 15]]);
      bills.push(mkBill(t, type, table, cust, pay));
    }
  }

  return {
    products: products,
    bills: bills,
    users: users,
    settings: settings,
    notifs: [],
    counters: { bill: counter, prod: 100 }
  };
})();

if (typeof module !== 'undefined' && module.exports) { module.exports = SEED; }

/* Host test runner: builds a vm context, loads shim + app + tests */
const fs = require('fs');
const vm = require('vm');

const html = fs.readFileSync(__dirname + '/index.html', 'utf8');
const body = fs.readFileSync(__dirname + '/src/body.html', 'utf8');
const shim = fs.readFileSync(__dirname + '/test-shim.js', 'utf8');
const cases = fs.readFileSync(__dirname + '/test-cases.js', 'utf8');

const js = html.substring(html.indexOf('<script>') + 8, html.lastIndexOf('</script>'));

const store = {};
const sandbox = {
  console,
  setTimeout, setInterval, clearTimeout, clearInterval,
  print: function () { }, scrollTo: function () { },
  localStorage: {
    getItem: k => (k in store ? store[k] : null),
    setItem: (k, v) => { store[k] = String(v) },
    removeItem: k => { delete store[k] }
  }
};
sandbox.window = sandbox;
sandbox.globalThis = sandbox;
sandbox.__BODY__ = body;

const ctx = vm.createContext(sandbox);

let failed = 1;
try {
  vm.runInContext(shim, ctx, { filename: 'test-shim.js' });
  vm.runInContext(js, ctx, { filename: 'app.js' });
  vm.runInContext(cases, ctx, { filename: 'test-cases.js' });
  const R = ctx.__R || { PASS: 0, FAIL: 1 };
  failed = R.FAIL;
} catch (e) {
  console.error('CRASH:', e.stack || e);
}

setTimeout(() => { process.exit(failed ? 1 : 0); }, 300);

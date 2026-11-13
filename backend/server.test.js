const assert = require('node:assert/strict');
const { spawn } = require('node:child_process');
const { test } = require('node:test');
const fs = require('node:fs/promises');
const net = require('node:net');
const os = require('node:os');
const path = require('node:path');

let serverProcess;
let serverUrl;
let tempDirectory;
let startupOutput = '';

function delay(milliseconds) {
  return new Promise(resolve => setTimeout(resolve, milliseconds));
}

async function findAvailablePort() {
  const listener = net.createServer();
  await new Promise((resolve, reject) => {
    listener.once('error', reject);
    listener.listen(0, '127.0.0.1', resolve);
  });
  const { port } = listener.address();
  await new Promise(resolve => listener.close(resolve));
  return port;
}

async function request(endpoint, { method = 'GET', body, token } = {}) {
  const response = await fetch(`${serverUrl}${endpoint}`, {
    method,
    headers: {
      ...(body === undefined ? {} : { 'Content-Type': 'application/json' }),
      ...(token ? { Authorization: `Bearer ${token}` } : {})
    },
    ...(body === undefined ? {} : { body: JSON.stringify(body) })
  });
  const text = await response.text();
  let data;
  try {
    data = JSON.parse(text);
  } catch {
    data = text;
  }
  return { status: response.status, data };
}

async function startTestServer() {
  tempDirectory = await fs.mkdtemp(path.join(os.tmpdir(), 'tradepro-tests-'));
  const port = await findAvailablePort();
  serverUrl = `http://127.0.0.1:${port}`;
  serverProcess = spawn(process.execPath, [path.join(__dirname, 'server.js')], {
    cwd: __dirname,
    env: {
      ...process.env,
      DATABASE_PATH: path.join(tempDirectory, 'test.db'),
      JWT_SECRET: 'integration-test-secret',
      PORT: String(port)
    },
    stdio: ['ignore', 'pipe', 'pipe']
  });
  serverProcess.stdout.on('data', chunk => { startupOutput += chunk.toString(); });
  serverProcess.stderr.on('data', chunk => { startupOutput += chunk.toString(); });

  const deadline = Date.now() + 10000;
  while (Date.now() < deadline) {
    if (serverProcess.exitCode !== null) {
      throw new Error(`Test server exited during startup:\n${startupOutput}`);
    }
    try {
      const response = await fetch(`${serverUrl}/api/stocks`);
      if (response.ok) return;
    } catch {}
    await delay(100);
  }
  throw new Error(`Test server did not start:\n${startupOutput}`);
}

async function stopTestServer() {
  if (serverProcess && serverProcess.exitCode === null) {
    serverProcess.kill();
    await new Promise(resolve => {
      serverProcess.once('exit', resolve);
      setTimeout(resolve, 3000).unref();
    });
  }
  if (tempDirectory) await fs.rm(tempDirectory, { recursive: true, force: true });
}

test('core API flows', async t => {
  try {
    await startTestServer();
  const email = `integration-${process.pid}@example.test`;
  const password = 'TestPassword2026!';
  let token;
  let adversarialToken;

  await t.test('registration validates input, creates users, and rejects duplicates', async () => {
    const invalid = await request('/api/auth/register', {
      method: 'POST',
      body: { email: 'not-an-email', password: 'short', name: '' }
    });
    assert.equal(invalid.status, 400);

    const registered = await request('/api/auth/register', {
      method: 'POST',
      body: { email, password, name: 'Integration Trader' }
    });
    assert.equal(registered.status, 200);
    assert.equal(registered.data.user.email, email);
    assert.ok(registered.data.token);
    token = registered.data.token;

    const duplicate = await request('/api/auth/register', {
      method: 'POST',
      body: { email, password, name: 'Duplicate Trader' }
    });
    assert.equal(duplicate.status, 400);
  });

  await t.test('login and authenticated identity enforce credentials and tokens', async () => {
    const badLogin = await request('/api/auth/login', {
      method: 'POST',
      body: { email, password: 'wrong-password' }
    });
    assert.equal(badLogin.status, 401);

    const unauthorized = await request('/api/auth/me');
    assert.equal(unauthorized.status, 401);

    const invalidToken = await request('/api/auth/me', { token: 'invalid' });
    assert.equal(invalidToken.status, 403);

    const me = await request('/api/auth/me', { token });
    assert.equal(me.status, 200);
    assert.equal(me.data.email, email);
    assert.equal(me.data.balance, 100000);

    const secondUser = await request('/api/auth/register', {
      method: 'POST',
      body: {
        email: `adversarial-${process.pid}@example.test`,
        password,
        name: 'Validation Trader'
      }
    });
    assert.equal(secondUser.status, 200);
    adversarialToken = secondUser.data.token;
  });

  await t.test('public stock list, detail, and history return expected data', async () => {
    const list = await request('/api/stocks');
    assert.equal(list.status, 200);
    assert.equal(list.data.length, 10);

    const detail = await request('/api/stocks/aapl');
    assert.equal(detail.status, 200);
    assert.equal(detail.data.symbol, 'AAPL');

    const missing = await request('/api/stocks/NOTREAL');
    assert.equal(missing.status, 404);

    const history = await request('/api/stocks/AAPL/history?limit=5');
    assert.equal(history.status, 200);
    assert.ok(history.data.length <= 5);
    assert.ok(history.data.every(point => Number.isFinite(point.price) && point.time));
  });

  await t.test('empty portfolio reflects the initialized balance', async () => {
    const unauthorized = await request('/api/portfolio');
    assert.equal(unauthorized.status, 401);

    const portfolio = await request('/api/portfolio', { token });
    assert.equal(portfolio.status, 200);
    assert.equal(portfolio.data.balance, 100000);
    assert.equal(portfolio.data.totalValue, 100000);
    assert.deepEqual(portfolio.data.holdings, []);
  });

  await t.test('market buys, partial and full sells keep balances and records consistent', async () => {
    const quote = await request('/api/stocks/AAPL');
    const buy = await request('/api/orders', {
      method: 'POST',
      token,
      body: { symbol: 'AAPL', type: 'market', side: 'buy', quantity: 2 }
    });
    assert.equal(buy.status, 200);
    assert.equal(buy.data.total, buy.data.executionPrice * 2);

    let portfolio = await request('/api/portfolio', { token });
    assert.equal(portfolio.status, 200);
    assert.equal(portfolio.data.balance, 100000 - buy.data.total);
    assert.equal(portfolio.data.holdings[0].quantity, 2);
    assert.equal(portfolio.data.holdings[0].name, quote.data.name);

    const tooExpensive = await request('/api/orders', {
      method: 'POST',
      token,
      body: { symbol: 'AAPL', type: 'market', side: 'buy', quantity: 1000000 }
    });
    assert.equal(tooExpensive.status, 400);

    const partialSell = await request('/api/orders', {
      method: 'POST',
      token,
      body: { symbol: 'AAPL', type: 'market', side: 'sell', quantity: 1 }
    });
    assert.equal(partialSell.status, 200);

    const fullSell = await request('/api/orders', {
      method: 'POST',
      token,
      body: { symbol: 'AAPL', type: 'market', side: 'sell', quantity: 1 }
    });
    assert.equal(fullSell.status, 200);

    portfolio = await request('/api/portfolio', { token });
    assert.equal(portfolio.status, 200);
    assert.deepEqual(portfolio.data.holdings, []);
    assert.equal(portfolio.data.balance, 100000 - buy.data.total + partialSell.data.total + fullSell.data.total);

    const orders = await request('/api/orders', { token });
    const transactions = await request('/api/transactions', { token });
    assert.equal(orders.status, 200);
    assert.equal(orders.data.length, 3);
    assert.equal(transactions.status, 200);
    assert.equal(transactions.data.length, 3);
  });

  await t.test('watchlist add, duplicate add, and removal are idempotent', async () => {
    const initial = await request('/api/watchlist', { token });
    assert.equal(initial.status, 200);
    assert.deepEqual(initial.data, []);

    for (let index = 0; index < 2; index += 1) {
      const add = await request('/api/watchlist', {
        method: 'POST',
        token,
        body: { symbol: 'aapl' }
      });
      assert.equal(add.status, 200);
    }

    const populated = await request('/api/watchlist', { token });
    assert.deepEqual(populated.data, ['AAPL']);

    const remove = await request('/api/watchlist/AAPL', { method: 'DELETE', token });
    assert.equal(remove.status, 200);
    const empty = await request('/api/watchlist', { token });
    assert.deepEqual(empty.data, []);
  });

  await t.test('orders reject invalid quantities, sides, types, and limit prices', async () => {
    const seedHolding = await request('/api/orders', {
      method: 'POST',
      token: adversarialToken,
      body: { symbol: 'AAPL', type: 'market', side: 'buy', quantity: 1 }
    });
    assert.equal(seedHolding.status, 200);

    const invalidOrders = [
      { symbol: 'AAPL', type: 'market', side: 'buy', quantity: 0 },
      { symbol: 'AAPL', type: 'market', side: 'buy', quantity: -1 },
      { symbol: 'AAPL', type: 'market', side: 'buy', quantity: 1.5 },
      { symbol: 'AAPL', type: 'market', side: 'hold', quantity: 1 },
      { symbol: 'AAPL', type: 'other', side: 'buy', quantity: 1 },
      { symbol: 'AAPL', type: 'limit', side: 'buy', quantity: 1, price: 0 },
      { symbol: 'AAPL', type: 'limit', side: 'buy', quantity: 1 }
    ];

    for (const body of invalidOrders) {
      const result = await request('/api/orders', { method: 'POST', token: adversarialToken, body });
      assert.equal(result.status, 400, `Expected invalid order to be rejected: ${JSON.stringify(body)}`);
    }

    const invalidPortfolio = await request('/api/portfolio', { token: adversarialToken });
    assert.equal(invalidPortfolio.data.balance, 100000 - seedHolding.data.total);
    assert.equal(invalidPortfolio.data.holdings[0].quantity, 1);
  });
  } finally {
    await stopTestServer();
  }
});
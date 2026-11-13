require('dotenv').config();
const express = require('express');
const http = require('http');
const WebSocket = require('ws');
const cors = require('cors');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const Database = require('better-sqlite3');
const path = require('path');

const app = express();
const server = http.createServer(app);
const wss = new WebSocket.Server({ server });

app.use(cors());
app.use(express.json());

const db = new Database(process.env.DATABASE_PATH || path.join(__dirname, 'trading.db'));
const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key-change-in-production';

// Initialize database
function initDB() {
  db.exec(`
    CREATE TABLE IF NOT EXISTS users (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      email TEXT UNIQUE NOT NULL,
      password TEXT NOT NULL,
      name TEXT NOT NULL,
      balance REAL DEFAULT 100000,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS holdings (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER NOT NULL,
      symbol TEXT NOT NULL,
      quantity INTEGER NOT NULL,
      avg_price REAL NOT NULL,
      FOREIGN KEY (user_id) REFERENCES users(id),
      UNIQUE(user_id, symbol)
    );

    CREATE TABLE IF NOT EXISTS orders (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER NOT NULL,
      symbol TEXT NOT NULL,
      type TEXT NOT NULL,
      side TEXT NOT NULL,
      quantity INTEGER NOT NULL,
      price REAL,
      filled_quantity INTEGER DEFAULT 0,
      status TEXT DEFAULT 'pending',
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (user_id) REFERENCES users(id)
    );

    CREATE TABLE IF NOT EXISTS transactions (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER NOT NULL,
      symbol TEXT NOT NULL,
      side TEXT NOT NULL,
      quantity INTEGER NOT NULL,
      price REAL NOT NULL,
      total REAL NOT NULL,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (user_id) REFERENCES users(id)
    );

    CREATE TABLE IF NOT EXISTS price_history (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      symbol TEXT NOT NULL,
      price REAL NOT NULL,
      timestamp DATETIME DEFAULT CURRENT_TIMESTAMP
    );
  `);

  // Insert sample stocks if empty
  const stocks = [
    { symbol: 'AAPL', name: 'Apple Inc.', price: 175.50 },
    { symbol: 'GOOGL', name: 'Alphabet Inc.', price: 142.30 },
    { symbol: 'MSFT', name: 'Microsoft Corp.', price: 378.90 },
    { symbol: 'TSLA', name: 'Tesla Inc.', price: 248.75 },
    { symbol: 'AMZN', name: 'Amazon.com Inc.', price: 155.20 },
    { symbol: 'META', name: 'Meta Platforms Inc.', price: 485.60 },
    { symbol: 'NVDA', name: 'NVIDIA Corp.', price: 875.30 },
    { symbol: 'JPM', name: 'JPMorgan Chase & Co.', price: 178.40 },
    { symbol: 'V', name: 'Visa Inc.', price: 265.80 },
    { symbol: 'JNJ', name: 'Johnson & Johnson', price: 162.30 }
  ];

  stocks.forEach(stock => {
    const exists = db.prepare('SELECT 1 FROM price_history WHERE symbol = ? LIMIT 1').get(stock.symbol);
    if (!exists) {
      const now = Date.now();
      for (let i = 0; i < 100; i++) {
        const variation = (Math.random() - 0.5) * 10;
        const price = stock.price + variation;
        const timestamp = new Date(now - (100 - i) * 60 * 1000).toISOString();
        db.prepare('INSERT INTO price_history (symbol, price, timestamp) VALUES (?, ?, ?)')
          .run(stock.symbol, price, timestamp);
      }
    }
  });
}

initDB();

// Mock stock data with real-time updates
const stocks = {
  'AAPL': { symbol: 'AAPL', name: 'Apple Inc.', price: 175.50, change: 0, changePercent: 0 },
  'GOOGL': { symbol: 'GOOGL', name: 'Alphabet Inc.', price: 142.30, change: 0, changePercent: 0 },
  'MSFT': { symbol: 'MSFT', name: 'Microsoft Corp.', price: 378.90, change: 0, changePercent: 0 },
  'TSLA': { symbol: 'TSLA', name: 'Tesla Inc.', price: 248.75, change: 0, changePercent: 0 },
  'AMZN': { symbol: 'AMZN', name: 'Amazon.com Inc.', price: 155.20, change: 0, changePercent: 0 },
  'META': { symbol: 'META', name: 'Meta Platforms Inc.', price: 485.60, change: 0, changePercent: 0 },
  'NVDA': { symbol: 'NVDA', name: 'NVIDIA Corp.', price: 875.30, change: 0, changePercent: 0 },
  'JPM': { symbol: 'JPM', name: 'JPMorgan Chase & Co.', price: 178.40, change: 0, changePercent: 0 },
  'V': { symbol: 'V', name: 'Visa Inc.', price: 265.80, change: 0, changePercent: 0 },
  'JNJ': { symbol: 'JNJ', name: 'Johnson & Johnson', price: 162.30, change: 0, changePercent: 0 }
};

// WebSocket clients
const clients = new Set();

// Broadcast stock updates to all connected clients
function broadcastStockUpdate() {
  const message = JSON.stringify({ type: 'stocks', data: Object.values(stocks) });
  clients.forEach(client => {
    if (client.readyState === WebSocket.OPEN) {
      client.send(message);
    }
  });
}

// Simulate real-time price updates
setInterval(() => {
  Object.keys(stocks).forEach(symbol => {
    const stock = stocks[symbol];
    const volatility = stock.price * 0.002;
    const change = (Math.random() - 0.5) * volatility * 2;
    const newPrice = Math.max(0.01, stock.price + change);
    const changeAmount = newPrice - stock.price;
    const changePercent = (changeAmount / stock.price) * 100;
    
    stock.price = newPrice;
    stock.change = changeAmount;
    stock.changePercent = changePercent;
    
    const timestamp = new Date().toISOString();
    db.prepare('INSERT INTO price_history (symbol, price, timestamp) VALUES (?, ?, ?)').run(symbol, newPrice, timestamp);
  });
  broadcastStockUpdate();
}, 2000);

wss.on('connection', (ws) => {
  clients.add(ws);
  ws.send(JSON.stringify({ type: 'stocks', data: Object.values(stocks) }));
  
  ws.on('close', () => {
    clients.delete(ws);
  });
});

// Auth middleware
const authenticateToken = (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];
  
  if (!token) return res.status(401).json({ error: 'Access token required' });
  
  jwt.verify(token, JWT_SECRET, (err, user) => {
    if (err) return res.status(403).json({ error: 'Invalid token' });
    req.user = user;
    next();
  });
};

// Auth routes
app.post('/api/auth/register', async (req, res) => {
  try {
    const { email, password, name } = req.body || {};
    const normalizedEmail = typeof email === 'string' ? email.trim().toLowerCase() : '';
    const normalizedName = typeof name === 'string' ? name.trim() : '';

    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(normalizedEmail) ||
        typeof password !== 'string' || password.length < 8 || !normalizedName) {
      return res.status(400).json({ error: 'Valid name, email, and password are required' });
    }
    
    const existing = db.prepare('SELECT * FROM users WHERE email = ?').get(normalizedEmail);
    if (existing) {
      return res.status(400).json({ error: 'Email already registered' });
    }
    
    const hashedPassword = await bcrypt.hash(password, 10);
    const result = db.prepare('INSERT INTO users (email, password, name) VALUES (?, ?, ?)')
      .run(normalizedEmail, hashedPassword, normalizedName);
    
    const user = { id: result.lastInsertRowid, email: normalizedEmail, name: normalizedName };
    const token = jwt.sign(user, JWT_SECRET, { expiresIn: '7d' });
    
    res.json({ user, token });
  } catch (err) {
    res.status(500).json({ error: 'Registration failed' });
  }
});

app.post('/api/auth/login', async (req, res) => {
  try {
    const { email, password } = req.body || {};
    const normalizedEmail = typeof email === 'string' ? email.trim().toLowerCase() : '';
    
    if (!normalizedEmail || typeof password !== 'string') {
      return res.status(400).json({ error: 'Email and password are required' });
    }

    const user = db.prepare('SELECT * FROM users WHERE email = ?').get(normalizedEmail);
    if (!user) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }
    
    const valid = await bcrypt.compare(password, user.password);
    if (!valid) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }
    
    const tokenUser = { id: user.id, email: user.email, name: user.name };
    const token = jwt.sign(tokenUser, JWT_SECRET, { expiresIn: '7d' });
    
    res.json({ user: tokenUser, token });
  } catch (err) {
    res.status(500).json({ error: 'Login failed' });
  }
});

app.get('/api/auth/me', authenticateToken, (req, res) => {
  const user = db.prepare('SELECT id, email, name, balance FROM users WHERE id = ?').get(req.user.id);
  if (!user) return res.status(404).json({ error: 'User not found' });
  res.json(user);
});

// Stock routes
app.get('/api/stocks', (req, res) => {
  res.json(Object.values(stocks));
});

app.get('/api/stocks/:symbol', (req, res) => {
  const stock = stocks[req.params.symbol.toUpperCase()];
  if (!stock) return res.status(404).json({ error: 'Stock not found' });
  res.json(stock);
});

app.get('/api/stocks/:symbol/history', (req, res) => {
  const { symbol } = req.params;
  const { interval = '1m', limit = 100 } = req.query;
  
  let msFilter = 0;
  switch (interval) {
    case '1m': msFilter = 60 * 60 * 1000; break;
    case '5m': msFilter = 6 * 60 * 60 * 1000; break;
    case '15m': msFilter = 24 * 60 * 60 * 1000; break;
    case '1h': msFilter = 7 * 24 * 60 * 60 * 1000; break;
    case '1d': msFilter = 30 * 24 * 60 * 60 * 1000; break;
  }
  
  const since = new Date(Date.now() - msFilter).toISOString();
  
  const history = db.prepare(`
    SELECT price, timestamp FROM price_history 
    WHERE symbol = ? AND timestamp >= ?
    ORDER BY timestamp ASC LIMIT ?
  `).all(symbol.toUpperCase(), since, parseInt(limit));
  
  res.json(history.map(h => ({ price: h.price, time: h.timestamp })));
});

// Portfolio routes
app.get('/api/portfolio', authenticateToken, (req, res) => {
  const holdings = db.prepare(`
    SELECT symbol, quantity, avg_price
    FROM holdings
    WHERE user_id = ?
  `).all(req.user.id);
  
  const user = db.prepare('SELECT balance FROM users WHERE id = ?').get(req.user.id);
  
  const portfolio = holdings.map(h => {
    const stock = stocks[h.symbol];
    const currentPrice = stock?.price ?? h.avg_price;
    return {
      symbol: h.symbol,
      name: stock?.name || h.symbol,
      quantity: h.quantity,
      avgPrice: h.avg_price,
      currentPrice,
      value: h.quantity * currentPrice,
      gain: (currentPrice - h.avg_price) * h.quantity,
      gainPercent: ((currentPrice - h.avg_price) / h.avg_price) * 100
    };
  });
  
  const totalValue = portfolio.reduce((sum, h) => sum + h.value, 0) + user.balance;
  const totalGain = portfolio.reduce((sum, h) => sum + h.gain, 0);
  
  res.json({
    holdings: portfolio,
    balance: user.balance,
    totalValue,
    totalGain,
    totalGainPercent: totalValue > 0 ? (totalGain / (totalValue - totalGain)) * 100 : 0
  });
});

// Order routes
app.post('/api/orders', authenticateToken, (req, res) => {
  try {
    const { symbol, type, side, quantity, price } = req.body || {};
    const normalizedSymbol = typeof symbol === 'string' ? symbol.trim().toUpperCase() : '';

    if (!Number.isSafeInteger(quantity) || quantity <= 0 ||
        !['market', 'limit'].includes(type) || !['buy', 'sell'].includes(side) ||
        (type === 'limit' && (typeof price !== 'number' || !Number.isFinite(price) || price <= 0))) {
      return res.status(400).json({ error: 'Invalid order details' });
    }

    const stock = stocks[normalizedSymbol];
    
    if (!stock) return res.status(404).json({ error: 'Stock not found' });
    
    const executionPrice = type === 'market' ? stock.price : price;
    const total = executionPrice * quantity;
    
    const user = db.prepare('SELECT balance FROM users WHERE id = ?').get(req.user.id);
    
    if (side === 'buy') {
      if (user.balance < total) {
        return res.status(400).json({ error: 'Insufficient funds' });
      }
    } else {
      const holding = db.prepare('SELECT quantity FROM holdings WHERE user_id = ? AND symbol = ?')
        .get(req.user.id, normalizedSymbol);
      if (!holding || holding.quantity < quantity) {
        return res.status(400).json({ error: 'Insufficient shares' });
      }
    }
    
    // Execute order
    const result = db.prepare(`
      INSERT INTO orders (user_id, symbol, type, side, quantity, price, status)
      VALUES (?, ?, ?, ?, ?, ?, 'filled')
    `).run(req.user.id, normalizedSymbol, type, side, quantity, executionPrice);
    
    // Update balance
    if (side === 'buy') {
      db.prepare('UPDATE users SET balance = balance - ? WHERE id = ?').run(total, req.user.id);
    } else {
      db.prepare('UPDATE users SET balance = balance + ? WHERE id = ?').run(total, req.user.id);
    }
    
    // Update holdings
    const existing = db.prepare('SELECT * FROM holdings WHERE user_id = ? AND symbol = ?')
      .get(req.user.id, normalizedSymbol);
    
    if (side === 'buy') {
      if (existing) {
        const newQuantity = existing.quantity + quantity;
        const newAvgPrice = ((existing.quantity * existing.avg_price) + total) / newQuantity;
        db.prepare('UPDATE holdings SET quantity = ?, avg_price = ? WHERE user_id = ? AND symbol = ?')
          .run(newQuantity, newAvgPrice, req.user.id, normalizedSymbol);
      } else {
        db.prepare('INSERT INTO holdings (user_id, symbol, quantity, avg_price) VALUES (?, ?, ?, ?)')
          .run(req.user.id, normalizedSymbol, quantity, executionPrice);
      }
    } else {
      const newQuantity = existing.quantity - quantity;
      if (newQuantity === 0) {
        db.prepare('DELETE FROM holdings WHERE user_id = ? AND symbol = ?')
          .run(req.user.id, normalizedSymbol);
      } else {
        db.prepare('UPDATE holdings SET quantity = ? WHERE user_id = ? AND symbol = ?')
          .run(newQuantity, req.user.id, normalizedSymbol);
      }
    }
    
    // Record transaction
    db.prepare(`
      INSERT INTO transactions (user_id, symbol, side, quantity, price, total)
      VALUES (?, ?, ?, ?, ?, ?)
    `).run(req.user.id, normalizedSymbol, side, quantity, executionPrice, total);
    
    res.json({ success: true, orderId: result.lastInsertRowid, executionPrice, total });
  } catch (err) {
    res.status(500).json({ error: 'Order failed' });
  }
});

app.get('/api/orders', authenticateToken, (req, res) => {
  const orders = db.prepare(`
    SELECT * FROM orders WHERE user_id = ? ORDER BY created_at DESC LIMIT 50
  `).all(req.user.id);
  res.json(orders);
});

app.get('/api/transactions', authenticateToken, (req, res) => {
  const transactions = db.prepare(`
    SELECT * FROM transactions WHERE user_id = ? ORDER BY created_at DESC LIMIT 100
  `).all(req.user.id);
  res.json(transactions);
});

// Watchlist
app.get('/api/watchlist', authenticateToken, (req, res) => {
  const watchlist = db.prepare('SELECT symbol FROM watchlist WHERE user_id = ?').all(req.user.id);
  res.json(watchlist.map(w => w.symbol));
});

app.post('/api/watchlist', authenticateToken, (req, res) => {
  const { symbol } = req.body;
  db.prepare('INSERT OR IGNORE INTO watchlist (user_id, symbol) VALUES (?, ?)')
    .run(req.user.id, symbol.toUpperCase());
  res.json({ success: true });
});

app.delete('/api/watchlist/:symbol', authenticateToken, (req, res) => {
  db.prepare('DELETE FROM watchlist WHERE user_id = ? AND symbol = ?')
    .run(req.user.id, req.params.symbol.toUpperCase());
  res.json({ success: true });
});

// Create watchlist table
db.exec(`CREATE TABLE IF NOT EXISTS watchlist (
  user_id INTEGER NOT NULL,
  symbol TEXT NOT NULL,
  PRIMARY KEY (user_id, symbol),
  FOREIGN KEY (user_id) REFERENCES users(id)
)`);

const PORT = process.env.PORT || 3001;
server.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
const API_BASE = 'http://localhost:3001/api';

function getAuthHeaders(token) {
  return {
    'Content-Type': 'application/json',
    ...(token && { Authorization: `Bearer ${token}` })
  };
}

async function request(endpoint, options = {}, token) {
  const res = await fetch(`${API_BASE}${endpoint}`, {
    ...options,
    headers: getAuthHeaders(token)
  });

  const data = await res.json().catch(() => ({}));
  
  if (!res.ok) {
    throw new Error(data.error || `Request failed: ${res.status}`);
  }
  
  return data;
}

export const api = {
  // Auth
  register: (email, password, name) => request('/auth/register', {
    method: 'POST',
    body: JSON.stringify({ email, password, name })
  }),

  login: (email, password) => request('/auth/login', {
    method: 'POST',
    body: JSON.stringify({ email, password })
  }),

  getMe: (token) => request('/auth/me', {}, token),

  // Stocks
  getStocks: () => request('/stocks'),
  getStock: (symbol) => request(`/stocks/${symbol}`),
  getStockHistory: (symbol, interval = '1m', limit = 100) => 
    request(`/stocks/${symbol}/history?interval=${interval}&limit=${limit}`),

  // Portfolio
  getPortfolio: (token) => request('/portfolio', {}, token),

  // Orders
  placeOrder: (token, { symbol, type, side, quantity, price }) => request('/orders', {
    method: 'POST',
    body: JSON.stringify({ symbol, type, side, quantity, price })
  }, token),

  getOrders: (token) => request('/orders', {}, token),

  // Transactions
  getTransactions: (token) => request('/transactions', {}, token),

  // Watchlist
  getWatchlist: (token) => request('/watchlist', {}, token),
  addToWatchlist: (token, symbol) => request('/watchlist', {
    method: 'POST',
    body: JSON.stringify({ symbol })
  }, token),
  removeFromWatchlist: (token, symbol) => request(`/watchlist/${symbol}`, {
    method: 'DELETE'
  }, token),
};

export default api;
import React, { useEffect, useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { useWebSocket } from '../context/WebSocketContext';
import { api } from '../services/api';
import { Card, Button, Badge, Loading, EmptyState, Input } from '../components/UI';
import { StockRow } from '../components/StockRow';

export function Watchlist() {
  const { token, loading: authLoading } = useAuth();
  const { getStock, getAllStocks } = useWebSocket();
  const [watchlist, setWatchlist] = useState([]);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);
  const [adding, setAdding] = useState(false);

  useEffect(() => {
    if (token) {
      fetchWatchlist();
    }
  }, [token]);

  const fetchWatchlist = async () => {
    try {
      const symbols = await api.getWatchlist(token);
      setWatchlist(symbols);
    } catch (err) {
      console.error('Failed to fetch watchlist:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleAdd = async (symbol) => {
    if (!symbol) return;
    setAdding(true);
    try {
      await api.addToWatchlist(token, symbol.toUpperCase());
      fetchWatchlist();
    } catch (err) {
      alert(err.message);
    } finally {
      setAdding(false);
    }
  };

  const handleRemove = async (symbol) => {
    try {
      await api.removeFromWatchlist(token, symbol);
      setWatchlist(prev => prev.filter(s => s !== symbol));
    } catch (err) {
      alert(err.message);
    }
  };

  if (authLoading) return <Loading fullScreen />;

  const allStocks = getAllStocks();
  const watchedStocks = watchlist.map(symbol => getStock(symbol)).filter(Boolean);

  return (
    <div className="content">
      <div style={{display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24}}>
        <div>
          <h1 className="page-title">Watchlist</h1>
          <p className="page-subtitle">Track your favorite stocks</p>
        </div>
        <div style={{display: 'flex', gap: 8}}>
          <Input
            placeholder="Add symbol (e.g. AAPL)"
            value={search}
            onChange={e => setSearch(e.target.value.toUpperCase())}
            onKeyDown={e => e.key === 'Enter' && handleAdd(search)}
            style={{width: 200}}
          />
          <Button variant="primary" onClick={() => handleAdd(search)} loading={adding}>
            Add
          </Button>
        </div>
      </div>

      {loading ? (
        <Loading />
      ) : watchedStocks.length > 0 ? (
        <Card>
          <div style={{display: 'flex', flexDirection: 'column'}}>
            {watchedStocks.map(stock => (
              <div
                key={stock.symbol}
                className="stock-row"
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  padding: '12px 16px',
                  borderBottom: '1px solid var(--border)'
                }}
              >
                <div style={{display: 'flex', alignItems: 'center', gap: 12, flex: 1}}>
                  <div>
                    <div className="stock-symbol">{stock.symbol}</div>
                    <div className="stock-name">{stock.name}</div>
                  </div>
                </div>
                <div className="stock-price" style={{textAlign: 'right', minWidth: 140}}>
                  <div className="stock-price-value">${stock.price.toFixed(2)}</div>
                  <div className={`stock-price-change ${stock.change >= 0 ? 'positive' : 'negative'}`}>
                    {stock.change >= 0 ? '+' : ''}${stock.change.toFixed(2)} ({stock.change >= 0 ? '+' : ''}{stock.changePercent.toFixed(2)}%)
                  </div>
                </div>
                <Button variant="ghost" size="sm" onClick={() => handleRemove(stock.symbol)} style={{color: 'var(--danger)'}}>
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <g>
                      <polyline points="3 6 5 6 21 6"/>
                      <path d="M19 6v14a2 2 0 01-2 2H7a2 2 0 01-2-2V6m3 0V4a2 2 0 012-2h4a2 2 0 012 2v2"/>
                    </g>
                  </svg>
                </Button>
              </div>
            ))}
          </div>
        </Card>
      ) : (
        <Card>
          <EmptyState
            title="Watchlist Empty"
            description="Add stocks to track their performance"
            action={
              <div style={{display: 'flex', gap: 8}}>
                <Input
                  placeholder="Add symbol (e.g. AAPL)"
                  value={search}
                  onChange={e => setSearch(e.target.value.toUpperCase())}
                  onKeyDown={e => e.key === 'Enter' && handleAdd(search)}
                  style={{width: 200}}
                />
                <Button variant="primary" onClick={() => handleAdd(search)} loading={adding}>
                  Add
                </Button>
              </div>
            }
          />
        </Card>
      )}

      <Card style={{marginTop: 20}}>
        <h3 style={{margin: '0 0 16px', fontSize: 16}}>Popular Stocks</h3>
        <div style={{display: 'flex', flexWrap: 'wrap', gap: 8}}>
          {allStocks.slice(0, 20).map(stock => (
            <Button
              key={stock.symbol}
              variant={watchlist.includes(stock.symbol) ? 'success' : 'secondary'}
              size="sm"
              onClick={() => handleAdd(stock.symbol)}
              disabled={watchlist.includes(stock.symbol)}
            >
              {stock.symbol}
            </Button>
          ))}
        </div>
      </Card>
    </div>
  );
}
import React, { useState, useEffect, useMemo } from 'react';
import { useSearchParams } from 'react-router-dom';
import { useWebSocket } from '../context/WebSocketContext';
import { api } from '../services/api';
import { Card, Button, Input, Tabs, Badge, Loading } from '../components/UI';
import { StockRow, StockCard } from '../components/StockRow';
import { StockChart, MiniChart } from '../components/Chart';

const intervals = [
  { id: '1m', label: '1M' },
  { id: '5m', label: '5M' },
  { id: '15m', label: '15M' },
  { id: '1h', label: '1H' },
  { id: '1d', label: '1D' },
];

export function Market() {
  const { stocks, connected, getAllStocks, getStock } = useWebSocket();
  const [searchParams, setSearchParams] = useSearchParams();
  const [selectedSymbol, setSelectedSymbol] = useState(searchParams.get('symbol') || 'AAPL');
  const [interval, setInterval] = useState('1m');
  const [history, setHistory] = useState([]);
  const [loadingHistory, setLoadingHistory] = useState(false);
  const [search, setSearch] = useState('');

  const allStocks = getAllStocks();
  const selectedStock = getStock(selectedSymbol);

  useEffect(() => {
    const symbol = searchParams.get('symbol');
    if (symbol) setSelectedSymbol(symbol.toUpperCase());
  }, [searchParams]);

  useEffect(() => {
    if (selectedSymbol) {
      fetchHistory();
    }
  }, [selectedSymbol, interval]);

  const fetchHistory = async () => {
    setLoadingHistory(true);
    try {
      const data = await api.getStockHistory(selectedSymbol, interval, 200);
      setHistory(data);
    } catch (err) {
      console.error('Failed to fetch history:', err);
    } finally {
      setLoadingHistory(false);
    }
  };

  const filteredStocks = useMemo(() => 
    allStocks.filter(s => 
      s.symbol.toLowerCase().includes(search.toLowerCase()) ||
      s.name.toLowerCase().includes(search.toLowerCase())
    ).sort((a, b) => a.symbol.localeCompare(b.symbol)),
  [allStocks, search]);

  return (
    <div className="content">
      <div style={{display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24}}>
        <div>
          <h1 className="page-title">Market</h1>
          <p className="page-subtitle">Real-time stock data and charts</p>
        </div>
        <div style={{display: 'flex', gap: 8, alignItems: 'center'}}>
          <Badge variant={connected ? 'success' : 'danger'}>{connected ? 'Live' : 'Offline'}</Badge>
          <div className="search-box" style={{width: 300}}>
            <input
              type="text"
              placeholder="Search stocks..."
              value={search}
              onChange={e => setSearch(e.target.value)}
            />
          </div>
        </div>
      </div>

      <div className="grid" style={{gridTemplateColumns: '320px 1fr', gap: 20}}>
        <Card style={{height: 'fit-content', position: 'sticky', top: 100}}>
          <div style={{marginBottom: 16}}>
            <Input
              placeholder="Search..."
              value={search}
              onChange={e => setSearch(e.target.value)}
              style={{width: '100%'}}
            />
          </div>
          <div style={{maxHeight: 500, overflowY: 'auto'}}>
            {filteredStocks.map(stock => (
              <StockRow
                key={stock.symbol}
                stock={stock}
                onClick={() => {
                  setSelectedSymbol(stock.symbol);
                  setSearchParams({ symbol: stock.symbol });
                }}
              />
            ))}
          </div>
        </Card>

        <div style={{minWidth: 0}}>
          {selectedStock && (
            <>
              <Card style={{marginBottom: 20}}>
                <div style={{display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 16}}>
                  <div>
                    <div style={{display: 'flex', alignItems: 'center', gap: 12, marginBottom: 8}}>
                      <span style={{fontSize: 24, fontWeight: 700}}>{selectedStock.symbol}</span>
                      <Badge variant={selectedStock.change >= 0 ? 'success' : 'danger'}>
                        {selectedStock.change >= 0 ? '+' : ''}{selectedStock.changePercent.toFixed(2)}%
                      </Badge>
                    </div>
                    <div style={{color: 'var(--text-secondary)', fontSize: 14}}>{selectedStock.name}</div>
                  </div>
                  <div style={{textAlign: 'right'}}>
                    <div style={{fontSize: 36, fontWeight: 700}}>${selectedStock.price.toFixed(2)}</div>
                    <div className={selectedStock.change >= 0 ? 'positive' : 'negative'}>
                      {selectedStock.change >= 0 ? '+' : ''}${selectedStock.change.toFixed(2)} 
                      ({selectedStock.change >= 0 ? '+' : ''}{selectedStock.changePercent.toFixed(2)}%)
                    </div>
                  </div>
                </div>
                <Tabs tabs={intervals} activeTab={interval} onChange={setInterval} />
              </Card>

              <Card>
                <h3 style={{margin: '0 0 16px', fontSize: 16}}>{selectedStock.symbol} Price Chart</h3>
                {loadingHistory ? (
                  <Loading />
                ) : (
                  <StockChart data={history} height={400} />
                )}
              </Card>

              <div className="grid grid-4" style={{marginTop: 20, gap: 16}}>
                <Card>
                  <div style={{fontSize: 12, color: 'var(--text-secondary)', marginBottom: 4}}>Open</div>
                  <div style={{fontSize: 20, fontWeight: 600}}>${(selectedStock.price * 0.99).toFixed(2)}</div>
                </Card>
                <Card>
                  <div style={{fontSize: 12, color: 'var(--text-secondary)', marginBottom: 4}}>High</div>
                  <div style={{fontSize: 20, fontWeight: 600}}>${(selectedStock.price * 1.02).toFixed(2)}</div>
                </Card>
                <Card>
                  <div style={{fontSize: 12, color: 'var(--text-secondary)', marginBottom: 4}}>Low</div>
                  <div style={{fontSize: 20, fontWeight: 600}}>${(selectedStock.price * 0.98).toFixed(2)}</div>
                </Card>
                <Card>
                  <div style={{fontSize: 12, color: 'var(--text-secondary)', marginBottom: 4}}>Volume</div>
                  <div style={{fontSize: 20, fontWeight: 600}}>{Math.floor(Math.random() * 10000000).toLocaleString()}</div>
                </Card>
              </div>

              <Card style={{marginTop: 20}}>
                <div style={{display: 'flex', justifyContent: 'space-between', alignItems: 'center'}}>
                  <h3 style={{margin: 0, fontSize: 16}}>Trade {selectedStock.symbol}</h3>
                  <Button variant="primary" onClick={() => window.location.href = `/orders?symbol=${selectedStock.symbol}`}>
                    Place Order
                  </Button>
                </div>
              </Card>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
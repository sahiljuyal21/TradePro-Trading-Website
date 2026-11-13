import React, { useEffect, useState, useMemo } from 'react';
import { useSearchParams } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useWebSocket } from '../context/WebSocketContext';
import { api } from '../services/api';
import { Card, Button, Input, Tabs, Badge, Loading, EmptyState, Table } from '../components/UI';
import { OrderForm } from '../components/OrderForm';
import { StockRow } from '../components/StockRow';

const orderTabs = [
  { id: 'trade', label: 'Trade' },
  { id: 'history', label: 'Order History' },
  { id: 'transactions', label: 'Transactions' },
];

export function Orders() {
  const { token, user, loading: authLoading } = useAuth();
  const { getStock, getAllStocks } = useWebSocket();
  const [searchParams, setSearchParams] = useSearchParams();
  const [activeTab, setActiveTab] = useState('trade');
  const [selectedSymbol, setSelectedSymbol] = useState(searchParams.get('symbol') || 'AAPL');
  const [orders, setOrders] = useState([]);
  const [transactions, setTransactions] = useState([]);
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [userBalance, setUserBalance] = useState(0);
  const [holdings, setHoldings] = useState([]);

  useEffect(() => {
    if (token) {
      fetchData();
    }
  }, [token]);

  useEffect(() => {
    const symbol = searchParams.get('symbol');
    if (symbol) setSelectedSymbol(symbol.toUpperCase());
  }, [searchParams]);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [portfolio, ordersData, transactionsData] = await Promise.all([
        api.getPortfolio(token),
        api.getOrders(token),
        api.getTransactions(token)
      ]);
      setUserBalance(portfolio.balance);
      setHoldings(portfolio.holdings);
      setOrders(ordersData);
      setTransactions(transactionsData);
    } catch (err) {
      console.error('Failed to fetch data:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleOrderSubmit = async (orderData) => {
    setSubmitting(true);
    try {
      await api.placeOrder(token, orderData);
      fetchData();
    } catch (err) {
      alert(err.message);
    } finally {
      setSubmitting(false);
    }
  };

  if (authLoading) return <Loading fullScreen />;

  const selectedStock = getStock(selectedSymbol);
  const allStocks = getAllStocks();

  return (
    <div className="content">
      <div style={{display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24}}>
        <div>
          <h1 className="page-title">Orders</h1>
          <p className="page-subtitle">Place trades and view history</p>
        </div>
      </div>

      <Tabs tabs={orderTabs} activeTab={activeTab} onChange={setActiveTab} style={{marginBottom: 20}} />

      {activeTab === 'trade' && (
        <div className="grid" style={{gridTemplateColumns: '320px 1fr', gap: 20}}>
          <Card style={{height: 'fit-content', position: 'sticky', top: 100}}>
            <h3 style={{margin: '0 0 16px', fontSize: 16}}>Select Stock</h3>
            <Input
              placeholder="Search..."
              onChange={e => {
                const stock = allStocks.find(s => 
                  s.symbol.toLowerCase().includes(e.target.value.toLowerCase()) ||
                  s.name.toLowerCase().includes(e.target.value.toLowerCase())
                );
                if (stock) {
                  setSelectedSymbol(stock.symbol);
                  setSearchParams({ symbol: stock.symbol });
                }
              }}
              style={{width: '100%', marginBottom: 16}}
            />
            <div style={{maxHeight: 400, overflowY: 'auto'}}>
              {allStocks.map(stock => (
                <StockRow
                  key={stock.symbol}
                  stock={stock}
                  onClick={() => {
                    setSelectedSymbol(stock.symbol);
                    setSearchParams({ symbol: stock.symbol });
                  }}
                  showChange
                />
              ))}
            </div>
          </Card>

          <Card>
            {selectedStock ? (
              <OrderForm
                stock={selectedStock}
                onSubmit={handleOrderSubmit}
                loading={submitting}
                userBalance={userBalance}
                holdings={holdings}
              />
            ) : (
              <EmptyState title="Select a Stock" description="Choose a stock from the list to start trading" />
            )}
          </Card>
        </div>
      )}

      {activeTab === 'history' && (
        <Card>
          <h3 style={{margin: '0 0 20px', fontSize: 16}}>Order History</h3>
          {loading ? (
            <Loading />
          ) : orders.length > 0 ? (
            <Table
              headers={['Symbol', 'Type', 'Side', 'Qty', 'Price', 'Status', 'Date']}
              rows={orders}
              renderRow={(o) => (
                <tr>
                  <td><strong>{o.symbol}</strong></td>
                  <td><Badge variant={o.type === 'market' ? 'info' : 'warning'}>{o.type}</Badge></td>
                  <td><Badge variant={o.side === 'buy' ? 'success' : 'danger'}>{o.side}</Badge></td>
                  <td>{o.quantity.toLocaleString()}</td>
                  <td>${o.price?.toFixed(2) || 'Market'}</td>
                  <td><Badge variant={o.status === 'filled' ? 'success' : 'warning'}>{o.status}</Badge></td>
                  <td style={{color: 'var(--text-secondary)', fontSize: 13}}>{new Date(o.created_at).toLocaleString()}</td>
                </tr>
              )}
            />
          ) : (
            <EmptyState title="No Orders" description="Your order history will appear here" />
          )}
        </Card>
      )}

      {activeTab === 'transactions' && (
        <Card>
          <h3 style={{margin: '0 0 20px', fontSize: 16}}>Transactions</h3>
          {loading ? (
            <Loading />
          ) : transactions.length > 0 ? (
            <Table
              headers={['Symbol', 'Side', 'Qty', 'Price', 'Total', 'Date']}
              rows={transactions}
              renderRow={(t) => (
                <tr>
                  <td><strong>{t.symbol}</strong></td>
                  <td><Badge variant={t.side === 'buy' ? 'success' : 'danger'}>{t.side}</Badge></td>
                  <td>{t.quantity.toLocaleString()}</td>
                  <td>${t.price.toFixed(2)}</td>
                  <td>${t.total.toLocaleString(undefined, {minimumFractionDigits: 2})}</td>
                  <td style={{color: 'var(--text-secondary)', fontSize: 13}}>{new Date(t.created_at).toLocaleString()}</td>
                </tr>
              )}
            />
          ) : (
            <EmptyState title="No Transactions" description="Your transactions will appear here" />
          )}
        </Card>
      )}
    </div>
  );
}
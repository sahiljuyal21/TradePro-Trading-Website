import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useWebSocket } from '../context/WebSocketContext';
import { api } from '../services/api';
import { StatCard, Card, Badge, Button, Loading, EmptyState } from '../components/UI';
import { StockCard } from '../components/StockRow';
import { StockChart } from '../components/Chart';

export function Dashboard() {
  const { user, token, loading: authLoading } = useAuth();
  const { stocks, connected, getAllStocks } = useWebSocket();
  const [portfolio, setPortfolio] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (token) {
      fetchPortfolio();
    }
  }, [token]);

  const fetchPortfolio = async () => {
    try {
      const data = await api.getPortfolio(token);
      setPortfolio(data);
    } catch (err) {
      console.error('Failed to fetch portfolio:', err);
    } finally {
      setLoading(false);
    }
  };

  if (authLoading) return <Loading fullScreen />;

  const allStocks = getAllStocks();
  const topStocks = allStocks
    .sort((a, b) => Math.abs(b.changePercent) - Math.abs(a.changePercent))
    .slice(0, 4);

  const totalValue = portfolio?.totalValue || 0;
  const totalGain = portfolio?.totalGain || 0;
  const totalGainPercent = portfolio?.totalGainPercent || 0;
  const dayChange = portfolio?.holdings?.reduce((sum, h) => sum + (h.gain || 0), 0) || 0;
  const dayChangePercent = totalValue > 0 ? (dayChange / (totalValue - dayChange)) * 100 : 0;

  return (
    <div className="content">
      <div style={{display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24}}>
        <div>
          <h1 className="page-title">Dashboard</h1>
          <p className="page-subtitle">Welcome back, {user?.name || 'Trader'}</p>
        </div>
        <div style={{display: 'flex', gap: 8, alignItems: 'center'}}>
          <Badge variant={connected ? 'success' : 'danger'}>
            {connected ? 'Live' : 'Disconnected'}
          </Badge>
          <Link to="/market">
            <Button variant="primary">View Market</Button>
          </Link>
        </div>
      </div>

      <div className="grid grid-4" style={{marginBottom: 24}}>
        <StatCard
          label="Total Value"
          value={`$${totalValue.toLocaleString(undefined, {minimumFractionDigits: 2, maximumFractionDigits: 2})}`}
          change={totalGainPercent}
          changeLabel="Total Gain"
        />
        <StatCard
          label="Total Gain/Loss"
          value={`$${totalGain.toLocaleString(undefined, {minimumFractionDigits: 2, maximumFractionDigits: 2})}`}
          change={totalGainPercent}
          changeLabel="Overall"
        />
        <StatCard
          label="Available Cash"
          value={`$${(portfolio?.balance || 0).toLocaleString(undefined, {minimumFractionDigits: 2, maximumFractionDigits: 2})}`}
        />
        <StatCard
          label="Day Change"
          value={`$${dayChange.toLocaleString(undefined, {minimumFractionDigits: 2, maximumFractionDigits: 2})}`}
          change={dayChangePercent}
          changeLabel="Today"
        />
      </div>

      <div className="grid grid-2" style={{gap: 20}}>
        <Card style={{gridColumn: 'span 2'}}>
          <h3 style={{margin: '0 0 16px', fontSize: 16}}>Portfolio Overview</h3>
          {loading ? (
            <Loading />
          ) : portfolio?.holdings?.length ? (
            <StockChart data={portfolio.holdings.flatMap(h => 
              Array.from({length: 20}, (_, i) => ({
                time: new Date(Date.now() - (19-i) * 3600000).toISOString(),
                price: h.currentPrice * (0.98 + Math.random() * 0.04)
              }))
            )} height={300} />
          ) : (
            <EmptyState
              title="No Holdings Yet"
              description="Start building your portfolio by buying stocks"
              action={<Link to="/market"><Button variant="primary">Browse Market</Button></Link>}
            />
          )}
        </Card>

        <Card>
          <h3 style={{margin: '0 0 16px', fontSize: 16}}>Top Movers</h3>
          <div style={{display: 'flex', flexDirection: 'column', gap: 8}}>
            {topStocks.map(stock => (
              <StockCard key={stock.symbol} stock={stock} onClick={() => window.location.href = `/market?symbol=${stock.symbol}`} />
            ))}
          </div>
        </Card>

        <Card>
          <h3 style={{margin: '0 0 16px', fontSize: 16}}>Quick Actions</h3>
          <div style={{display: 'flex', flexDirection: 'column', gap: 12}}>
            <Link to="/market" style={{textDecoration: 'none'}}>
              <Button variant="secondary" fullWidth style={{justifyContent: 'flex-start'}}>
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="18" y1="20" x2="18" y2="10"/><line x1="12" y1="20" x2="12" y2="4"/><line x1="6" y1="20" x2="6" y2="14"/></svg>
                Browse Market
              </Button>
            </Link>
            <Link to="/portfolio" style={{textDecoration: 'none'}}>
              <Button variant="secondary" fullWidth style={{justifyContent: 'flex-start'}}>
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M21 12V7H5V6H12V4H5a2 2 0 00-2 2v12a2 2 0 002 2h14a2 2 0 002-2v-7"/><path d="M3 3v18h18"/></svg>
                View Portfolio
              </Button>
            </Link>
            <Link to="/orders" style={{textDecoration: 'none'}}>
              <Button variant="secondary" fullWidth style={{justifyContent: 'flex-start'}}>
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M16 4h2a2 2 0 012 2v14a2 2 0 01-2 2H6a2 2 0 01-2-2V6a2 2 0 012-2h2"/><rect x="8" y="2" width="8" height="4" rx="1"/><path d="M10 10h4"/><path d="M10 14h4"/></svg>
                Place Order
              </Button>
            </Link>
            <Link to="/watchlist" style={{textDecoration: 'none'}}>
              <Button variant="secondary" fullWidth style={{justifyContent: 'flex-start'}}>
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M17 21v-6a2 2 0 00-2-2H9a2 2 0 00-2 2v6"/><path d="M7 3 3 7l4 4"/><path d="M21 13l-4 4-4-4"/></svg>
                Manage Watchlist
              </Button>
            </Link>
          </div>
        </Card>
      </div>
    </div>
  );
}
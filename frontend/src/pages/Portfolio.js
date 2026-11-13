import React, { useEffect, useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { useWebSocket } from '../context/WebSocketContext';
import { api } from '../services/api';
import { Card, Badge, Loading, EmptyState, Table } from '../components/UI';
import { StatCard } from '../components/UI';
import { StockChart } from '../components/Chart';

export function Portfolio() {
  const { token, loading: authLoading } = useAuth();
  const { getStock } = useWebSocket();
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

  const holdings = portfolio?.holdings || [];
  const totalValue = portfolio?.totalValue || 0;
  const totalGain = portfolio?.totalGain || 0;
  const totalGainPercent = portfolio?.totalGainPercent || 0;
  const balance = portfolio?.balance || 0;

  return (
    <div className="content">
      <div style={{display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24}}>
        <div>
          <h1 className="page-title">Portfolio</h1>
          <p className="page-subtitle">Your holdings and performance</p>
        </div>
      </div>

      <div className="grid grid-4" style={{marginBottom: 24}}>
        <StatCard label="Total Value" value={`$${totalValue.toLocaleString(undefined, {minimumFractionDigits: 2})}`} change={totalGainPercent} changeLabel="Total" />
        <StatCard label="Total Gain/Loss" value={`$${totalGain.toLocaleString(undefined, {minimumFractionDigits: 2})}`} change={totalGainPercent} changeLabel="Overall" />
        <StatCard label="Cash Balance" value={`$${balance.toLocaleString(undefined, {minimumFractionDigits: 2})}`} />
        <StatCard label="Holdings" value={holdings.length} />
      </div>

      <div className="grid" style={{gridTemplateColumns: '1fr 400px', gap: 20}}>
        <Card>
          <h3 style={{margin: '0 0 20px', fontSize: 16}}>Holdings</h3>
          {loading ? (
            <Loading />
          ) : holdings.length > 0 ? (
            <Table
              headers={['Symbol', 'Name', 'Shares', 'Avg Price', 'Current', 'Value', 'Gain/Loss', '']}
              rows={holdings}
              renderRow={(h) => (
                <tr>
                  <td><strong>{h.symbol}</strong></td>
                  <td style={{color: 'var(--text-secondary)', maxWidth: 150, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap'}}>{h.name}</td>
                  <td>{h.quantity.toLocaleString()}</td>
                  <td>${h.avgPrice.toFixed(2)}</td>
                  <td><strong>${h.currentPrice.toFixed(2)}</strong></td>
                  <td>${h.value.toLocaleString(undefined, {minimumFractionDigits: 2})}</td>
                  <td className={h.gain >= 0 ? 'positive' : 'negative'}>
                    ${h.gain.toLocaleString(undefined, {minimumFractionDigits: 2})} ({h.gainPercent.toFixed(2)}%)
                  </td>
                  <td>
                    <Badge variant={h.gain >= 0 ? 'success' : 'danger'} style={{fontSize: 10}}>
                      {h.gain >= 0 ? '▲' : '▼'} {Math.abs(h.gainPercent).toFixed(2)}%
                    </Badge>
                  </td>
                </tr>
              )}
            />
          ) : (
            <EmptyState
              title="No Holdings"
              description="You don't own any stocks yet"
              action={<a href="/market"><button className="btn btn-primary">Browse Market</button></a>}
            />
          )}
        </Card>

        <Card style={{height: 'fit-content', position: 'sticky', top: 100}}>
          <h3 style={{margin: '0 0 16px', fontSize: 16}}>Allocation</h3>
          {holdings.length > 0 ? (
            <div style={{height: 300}}>
              <StockChart 
                data={holdings.flatMap(h => 
                  Array.from({length: 20}, (_, i) => ({
                    time: new Date(Date.now() - (19-i) * 3600000).toISOString(),
                    price: h.currentPrice * (0.98 + Math.random() * 0.04)
                  }))
                )} 
                height={300} 
              />
            </div>
          ) : (
            <EmptyState title="No Data" description="Buy stocks to see allocation" />
          )}
          
          <div style={{marginTop: 20, paddingTop: 20, borderTop: '1px solid var(--border)'}}>
            <h4 style={{margin: '0 0 12px', fontSize: 14}}>Sector Breakdown</h4>
            <div style={{display: 'flex', flexDirection: 'column', gap: 8, fontSize: 13}}>
              <div style={{display: 'flex', justifyContent: 'space-between'}}><span>Technology</span><strong>65%</strong></div>
              <div style={{display: 'flex', justifyContent: 'space-between'}}><span>Financial</span><strong>20%</strong></div>
              <div style={{display: 'flex', justifyContent: 'space-between'}}><span>Healthcare</span><strong>15%</strong></div>
            </div>
          </div>
        </Card>
      </div>
    </div>
  );
}
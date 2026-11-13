import React from 'react';
import { Link } from 'react-router-dom';

export function StockRow({ stock, onClick, showChange = true }) {
  if (!stock) return null;
  
  const isPositive = stock.change >= 0;
  const changeClass = isPositive ? 'positive' : 'negative';
  const changeSign = isPositive ? '+' : '';

  return (
    <div className="stock-row" onClick={onClick} style={{cursor: onClick ? 'pointer' : 'default'}}>
      <div className="stock-info">
        <span className="stock-symbol">{stock.symbol}</span>
        <span className="stock-name">{stock.name}</span>
      </div>
      <div className="stock-price">
        <div className="stock-price-value">${stock.price.toFixed(2)}</div>
        {showChange && (
          <div className={`stock-price-change ${changeClass}`}>
            <span>{changeSign}{stock.change.toFixed(2)}</span>
            <span>({changeSign}{stock.changePercent.toFixed(2)}%)</span>
          </div>
        )}
      </div>
    </div>
  );
}

export function StockCard({ stock, onClick }) {
  if (!stock) return null;
  
  const isPositive = stock.change >= 0;
  const changeClass = isPositive ? 'positive' : 'negative';
  const changeSign = isPositive ? '+' : '';

  return (
    <div className="card" style={{cursor: onClick ? 'pointer' : 'default'}} onClick={onClick}>
      <div style={{display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 12}}>
        <div>
          <div className="stock-symbol">{stock.symbol}</div>
          <div className="stock-name">{stock.name}</div>
        </div>
        <div className={`badge ${isPositive ? 'badge-success' : 'badge-danger'}`}>
          {changeSign}{stock.changePercent.toFixed(2)}%
        </div>
      </div>
      <div style={{fontSize: 28, fontWeight: 700, marginBottom: 8}}>
        ${stock.price.toFixed(2)}
      </div>
      <div className={changeClass} style={{fontSize: 14, fontWeight: 500}}>
        {changeSign}{stock.change.toFixed(2)} ({changeSign}{stock.changePercent.toFixed(2)}%)
      </div>
    </div>
  );
}
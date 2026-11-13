import React, { useState, useEffect } from 'react';
import { Button, Input, Select, Card } from './UI';

export function OrderForm({ stock, onSubmit, loading, userBalance, holdings }) {
  const [side, setSide] = useState('buy');
  const [type, setType] = useState('market');
  const [quantity, setQuantity] = useState('');
  const [price, setPrice] = useState('');
  const [errors, setErrors] = useState({});

  const holding = holdings?.find(h => h.symbol === stock?.symbol);
  const maxSellQty = holding?.quantity || 0;
  const maxBuyQty = stock && userBalance ? Math.floor(userBalance / stock.price) : 0;

  const validate = () => {
    const newErrors = {};
    if (!quantity || parseInt(quantity) <= 0) {
      newErrors.quantity = 'Quantity is required';
    } else if (side === 'buy' && maxBuyQty > 0 && parseInt(quantity) > maxBuyQty) {
      newErrors.quantity = `Max: ${maxBuyQty} shares (${maxBuyQty * stock.price.toFixed(2)})`;
    } else if (side === 'sell' && parseInt(quantity) > maxSellQty) {
      newErrors.quantity = `Max: ${maxSellQty} shares owned`;
    }
    if (type === 'limit' && (!price || parseFloat(price) <= 0)) {
      newErrors.price = 'Limit price is required';
    }
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (validate()) {
      onSubmit({
        symbol: stock.symbol,
        type,
        side,
        quantity: parseInt(quantity),
        price: type === 'limit' ? parseFloat(price) : undefined
      });
    }
  };

  const total = type === 'market' && stock && quantity
    ? stock.price * parseInt(quantity)
    : type === 'limit' && price && quantity
      ? parseFloat(price) * parseInt(quantity)
      : 0;

  const estimatedFee = total * 0.001;
  const estimatedTotal = total + estimatedFee;

  return (
    <Card>
      <div style={{display: 'flex', gap: 8, marginBottom: 16}}>
        <button
          className={`btn ${side === 'buy' ? 'btn-success' : 'btn-secondary'} ${side === 'buy' ? '' : 'btn-ghost'}`}
          onClick={() => setSide('buy')}
          style={{flex: 1}}
        >
          Buy
        </button>
        <button
          className={`btn ${side === 'sell' ? 'btn-danger' : 'btn-secondary'} ${side === 'sell' ? '' : 'btn-ghost'}`}
          onClick={() => setSide('sell')}
          style={{flex: 1}}
        >
          Sell
        </button>
      </div>

      <form onSubmit={handleSubmit}>
        <div className="form-group">
          <label className="form-label">Order Type</label>
          <div style={{display: 'flex', gap: 8}}>
            <button
              type="button"
              className={`btn ${type === 'market' ? 'btn-primary' : 'btn-secondary'}`}
              onClick={() => setType('market')}
              style={{flex: 1}}
            >
              Market
            </button>
            <button
              type="button"
              className={`btn ${type === 'limit' ? 'btn-primary' : 'btn-secondary'}`}
              onClick={() => setType('limit')}
              style={{flex: 1}}
            >
              Limit
            </button>
          </div>
        </div>

        <div className="form-row">
          <Input
            label="Quantity"
            type="number"
            min="1"
            max={side === 'buy' ? maxBuyQty || undefined : maxSellQty}
            value={quantity}
            onChange={e => setQuantity(e.target.value)}
            error={errors.quantity}
            placeholder={side === 'buy' ? `Max: ${maxBuyQty}` : `Max: ${maxSellQty}`}
          />
          {type === 'limit' && (
            <Input
              label="Limit Price"
              type="number"
              step="0.01"
              min="0.01"
              value={price}
              onChange={e => setPrice(e.target.value)}
              error={errors.price}
              placeholder={stock?.price?.toFixed(2)}
            />
          )}
        </div>

        {stock && (
          <div style={{background: 'var(--bg-tertiary)', borderRadius: 8, padding: 16, marginTop: 16}}>
            <div style={{display: 'flex', justifyContent: 'space-between', marginBottom: 8}}>
              <span style={{color: 'var(--text-secondary)'}}>Est. Price</span>
              <strong>${(type === 'market' ? stock.price : Number(price || stock.price)).toFixed(2)}</strong>
            </div>
            <div style={{display: 'flex', justifyContent: 'space-between', marginBottom: 8}}>
              <span style={{color: 'var(--text-secondary)'}}>Quantity</span>
              <strong>{quantity || 0}</strong>
            </div>
            <div style={{display: 'flex', justifyContent: 'space-between', marginBottom: 8, borderTop: '1px solid var(--border)', paddingTop: 8}}>
              <span style={{color: 'var(--text-secondary)'}}>Subtotal</span>
              <strong>${total.toFixed(2)}</strong>
            </div>
            <div style={{display: 'flex', justifyContent: 'space-between', marginBottom: 8}}>
              <span style={{color: 'var(--text-secondary)', fontSize: 13}}>Est. Fee (0.1%)</span>
              <span style={{fontSize: 13}}>${estimatedFee.toFixed(2)}</span>
            </div>
            <div style={{display: 'flex', justifyContent: 'space-between', fontWeight: 600, fontSize: 16}}>
              <span>Total</span>
              <span>${estimatedTotal.toFixed(2)}</span>
            </div>
          </div>
        )}

        <Button type="submit" variant={side === 'buy' ? 'success' : 'danger'} fullWidth loading={loading}>
          {side === 'buy' ? 'Buy' : 'Sell'} {stock?.symbol}
        </Button>
      </form>
    </Card>
  );
}
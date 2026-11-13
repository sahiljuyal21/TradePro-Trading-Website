import React, { useMemo } from 'react';
import {
  LineChart, Line, AreaChart, Area, XAxis, YAxis,
  CartesianGrid, Tooltip, ResponsiveContainer, Legend
} from 'recharts';

export function StockChart({ data, height = 300, type = 'area', color = 'var(--accent)' }) {
  if (!data?.length) {
    return (
      <div className="chart-container" style={{display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--text-muted)'}}>
        No data available
      </div>
    );
  }

  const formattedData = useMemo(() => 
    data.map(d => ({
      time: new Date(d.time).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      price: d.price,
      timestamp: d.time
    })).slice(-100),
  [data]);

  const priceMin = Math.min(...formattedData.map(d => d.price));
  const priceMax = Math.max(...formattedData.map(d => d.price));
  const padding = (priceMax - priceMin) * 0.1 || 1;

  const isPositive = formattedData.length > 1 
    ? formattedData[formattedData.length - 1].price >= formattedData[0].price
    : true;
  const lineColor = isPositive ? 'var(--success)' : 'var(--danger)';

  const ChartComponent = type === 'area' ? AreaChart : LineChart;
  const SeriesComponent = type === 'area' ? Area : Line;

  return (
    <div className="chart-container" style={{height}}>
      <ResponsiveContainer width="100%" height="100%">
        <ChartComponent data={formattedData} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
          <defs>
            <linearGradient id="colorPrice" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor={lineColor} stopOpacity={type === 'area' ? 0.3 : 0} />
              <stop offset="95%" stopColor={lineColor} stopOpacity={type === 'area' ? 0 : 0} />
            </linearGradient>
          </defs>
          <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" vertical={false} />
          <XAxis
            dataKey="time"
            stroke="var(--text-muted)"
            fontSize={11}
            tickCount={6}
            tick={{ fill: 'var(--text-muted)' }}
            axisLine={{ stroke: 'var(--border)' }}
            tickLine={false}
          />
          <YAxis
            stroke="var(--text-muted)"
            fontSize={11}
            tickCount={5}
            tick={{ fill: 'var(--text-muted)' }}
            axisLine={false}
            tickLine={false}
            domain={[priceMin - padding, priceMax + padding]}
            tickFormatter={v => '$' + v.toFixed(2)}
          />
          <Tooltip
            contentStyle={{
              background: 'var(--bg-secondary)',
              border: '1px solid var(--border)',
              borderRadius: 8,
              boxShadow: '0 8px 24px var(--shadow)'
            }}
            labelFormatter={v => ''}
            formatter={(value, name) => [`$${value.toFixed(2)}`, 'Price']}
          />
          <Legend />
          <SeriesComponent
            type="monotone"
            dataKey="price"
            stroke={lineColor}
            strokeWidth={2}
            fill="url(#colorPrice)"
            dot={false}
            activeDot={{ r: 4, strokeWidth: 2, fill: lineColor }}
          />
        </ChartComponent>
      </ResponsiveContainer>
    </div>
  );
}

export function MiniChart({ data, color = 'var(--accent)', width = 120, height = 40 }) {
  if (!data?.length) return <div style={{width, height}} />;
  
  const formattedData = data.slice(-30).map(d => ({ price: d.price }));
  const isPositive = formattedData.length > 1 
    ? formattedData[formattedData.length - 1].price >= formattedData[0].price
    : true;
  const lineColor = isPositive ? 'var(--success)' : 'var(--danger)';

  return (
    <svg width={width} height={height} viewBox={`0 0 ${width} ${height}`}>
      <defs>
        <linearGradient id="miniGradient" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={lineColor} stopOpacity={0.3} />
          <stop offset="100%" stopColor={lineColor} stopOpacity={0} />
        </linearGradient>
      </defs>
      <path
        d={formattedData.map((d, i) => {
          const x = (i / (formattedData.length - 1)) * width;
          const y = height - ((d.price - Math.min(...formattedData.map(p => p.price))) / 
            (Math.max(...formattedData.map(p => p.price)) - Math.min(...formattedData.map(p => p.price)) || 1)) * height;
          return `${i === 0 ? 'M' : 'L'} ${x} ${y}`;
        }).join(' ')}
        stroke={lineColor}
        strokeWidth={1.5}
        fill="none"
      />
      <path
        d={formattedData.map((d, i) => {
          const x = (i / (formattedData.length - 1)) * width;
          const y = height - ((d.price - Math.min(...formattedData.map(p => p.price))) / 
            (Math.max(...formattedData.map(p => p.price)) - Math.min(...formattedData.map(p => p.price)) || 1)) * height;
          return `${i === 0 ? 'M' : 'L'} ${x} ${y}`;
        }).join(' ') + ` L ${width} ${height} L 0 ${height} Z`}
        fill="url(#miniGradient)"
      />
    </svg>
  );
}
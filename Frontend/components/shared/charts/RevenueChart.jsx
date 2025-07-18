// Frontend/components/shared/charts/RevenueChart.jsx
import React, { useMemo, useState } from 'react';
import {
  BarChart,
  Bar,
  LineChart,
  Line,
  ComposedChart,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
  Cell
} from 'recharts';
import { formatCurrency } from '../../../utils/helpers';
import './RevenueChart.scss';

const RevenueChart = ({
  data = [],
  height = 350,
  showComparison = false,
  period = 'monthly' // 'daily' | 'weekly' | 'monthly' | 'yearly'
}) => {
  const [chartType, setChartType] = useState('bar'); // 'bar' | 'line' | 'composed'

  const formattedData = useMemo(() => {
    return data.map(item => ({
      ...item,
      revenue: item.revenue || 0,
      previousRevenue: item.previousRevenue || 0,
      growth: item.growth || 0
    }));
  }, [data]);

  const CustomTooltip = ({ active, payload, label }) => {
    if (!active || !payload) return null;

    return (
      <div className="revenue-chart__tooltip">
        <p className="revenue-chart__tooltip-label">{label}</p>
        {payload.map((entry, index) => (
          <div key={index} className="revenue-chart__tooltip-item">
            <span>{entry.name}:</span>
            <span className="revenue-chart__tooltip-value">
              {entry.dataKey === 'growth' 
                ? `${entry.value}%` 
                : formatCurrency(entry.value)
              }
            </span>
          </div>
        ))}
      </div>
    );
  };

  const getBarColor = (value, previousValue) => {
    if (!showComparison) return '#232956';
    return value >= previousValue ? '#28a745' : '#df2528';
  };

  const renderChart = () => {
    switch (chartType) {
      case 'line':
        return (
          <LineChart data={formattedData}>
            <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
            <XAxis dataKey="period" tick={{ fill: '#666', fontSize: 12 }} />
            <YAxis tick={{ fill: '#666', fontSize: 12 }} />
            <Tooltip content={<CustomTooltip />} />
            <Legend />
            <Line 
              type="monotone" 
              dataKey="revenue" 
              stroke="#232956" 
              strokeWidth={3}
              name="รายได้"
              dot={{ fill: '#232956', r: 5 }}
              activeDot={{ r: 7 }}
            />
            {showComparison && (
              <Line 
                type="monotone" 
                dataKey="previousRevenue" 
                stroke="#df2528" 
                strokeWidth={2}
                strokeDasharray="5 5"
                name="รายได้งวดก่อน"
                dot={{ fill: '#df2528', r: 4 }}
              />
            )}
          </LineChart>
        );

      case 'composed':
        return (
          <ComposedChart data={formattedData}>
            <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
            <XAxis dataKey="period" tick={{ fill: '#666', fontSize: 12 }} />
            <YAxis yAxisId="left" tick={{ fill: '#666', fontSize: 12 }} />
            <YAxis yAxisId="right" orientation="right" tick={{ fill: '#666', fontSize: 12 }} />
            <Tooltip content={<CustomTooltip />} />
            <Legend />
            <Bar 
              yAxisId="left"
              dataKey="revenue" 
              fill="#232956"
              name="รายได้"
              radius={[8, 8, 0, 0]}
            />
            <Line 
              yAxisId="right"
              type="monotone" 
              dataKey="growth" 
              stroke="#df2528" 
              strokeWidth={3}
              name="การเติบโต (%)"
              dot={{ fill: '#df2528', r: 5 }}
            />
          </ComposedChart>
        );

      default:
        return (
          <BarChart data={formattedData}>
            <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
            <XAxis dataKey="period" tick={{ fill: '#666', fontSize: 12 }} />
            <YAxis tick={{ fill: '#666', fontSize: 12 }} />
            <Tooltip content={<CustomTooltip />} />
            {showComparison && <Legend />}
            <Bar 
              dataKey="revenue" 
              name="รายได้"
              radius={[8, 8, 0, 0]}
            >
              {formattedData.map((entry, index) => (
                <Cell 
                  key={`cell-${index}`} 
                  fill={getBarColor(entry.revenue, entry.previousRevenue)} 
                />
              ))}
            </Bar>
            {showComparison && (
              <Bar 
                dataKey="previousRevenue" 
                fill="#e0e0e0" 
                name="รายได้งวดก่อน"
                radius={[8, 8, 0, 0]}
              />
            )}
          </BarChart>
        );
    }
  };

  const totalRevenue = useMemo(() => {
    return formattedData.reduce((sum, item) => sum + item.revenue, 0);
  }, [formattedData]);

  const averageRevenue = useMemo(() => {
    return formattedData.length > 0 ? totalRevenue / formattedData.length : 0;
  }, [formattedData, totalRevenue]);

  return (
    <div className="revenue-chart">
      <div className="revenue-chart__header">
        <div className="revenue-chart__stats">
          <div className="revenue-chart__stat">
            <span className="revenue-chart__stat-label">รายได้รวม</span>
            <span className="revenue-chart__stat-value">{formatCurrency(totalRevenue)}</span>
          </div>
          <div className="revenue-chart__stat">
            <span className="revenue-chart__stat-label">เฉลี่ย/{period}</span>
            <span className="revenue-chart__stat-value">{formatCurrency(averageRevenue)}</span>
          </div>
        </div>
        <div className="revenue-chart__controls">
          <button
            className={`revenue-chart__control ${chartType === 'bar' ? 'active' : ''}`}
            onClick={() => setChartType('bar')}
          >
            <svg width="20" height="20" viewBox="0 0 20 20" fill="currentColor">
              <rect x="2" y="10" width="4" height="8" />
              <rect x="8" y="6" width="4" height="12" />
              <rect x="14" y="2" width="4" height="16" />
            </svg>
          </button>
          <button
            className={`revenue-chart__control ${chartType === 'line' ? 'active' : ''}`}
            onClick={() => setChartType('line')}
          >
            <svg width="20" height="20" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="2">
              <polyline points="2,16 7,10 11,14 18,4" />
            </svg>
          </button>
          <button
            className={`revenue-chart__control ${chartType === 'composed' ? 'active' : ''}`}
            onClick={() => setChartType('composed')}
          >
            <svg width="20" height="20" viewBox="0 0 20 20" fill="currentColor">
              <rect x="2" y="12" width="3" height="6" opacity="0.5" />
              <rect x="8" y="8" width="3" height="10" opacity="0.5" />
              <rect x="14" y="6" width="3" height="12" opacity="0.5" />
              <polyline points="3,8 9,6 15,2" fill="none" stroke="currentColor" strokeWidth="2" />
            </svg>
          </button>
        </div>
      </div>
      <ResponsiveContainer width="100%" height={height}>
        {renderChart()}
      </ResponsiveContainer>
    </div>
  );
};

export default RevenueChart;

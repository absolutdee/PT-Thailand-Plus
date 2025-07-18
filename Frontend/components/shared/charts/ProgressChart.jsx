// Frontend/components/shared/charts/ProgressChart.jsx
import React, { useMemo } from 'react';
import {
  LineChart,
  Line,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend
} from 'recharts';
import { formatDate } from '../../../utils/helpers';
import './ProgressChart.scss';

const ProgressChart = ({
  data = [],
  metrics = ['weight', 'bodyFat'],
  height = 300,
  showLegend = true,
  showGrid = true,
  chartType = 'line' // 'line' | 'area'
}) => {
  const metricConfig = {
    weight: {
      label: 'น้ำหนัก (kg)',
      color: '#232956',
      unit: 'kg'
    },
    bodyFat: {
      label: 'ไขมัน (%)',
      color: '#df2528',
      unit: '%'
    },
    muscle: {
      label: 'กล้ามเนื้อ (kg)',
      color: '#28a745',
      unit: 'kg'
    },
    bmi: {
      label: 'BMI',
      color: '#17a2b8',
      unit: ''
    }
  };

  const formattedData = useMemo(() => {
    return data.map(item => ({
      ...item,
      date: formatDate(item.date, 'DD MMM')
    }));
  }, [data]);

  const CustomTooltip = ({ active, payload, label }) => {
    if (!active || !payload) return null;

    return (
      <div className="progress-chart__tooltip">
        <p className="progress-chart__tooltip-date">{label}</p>
        {payload.map((entry, index) => (
          <div key={index} className="progress-chart__tooltip-item">
            <span 
              className="progress-chart__tooltip-dot"
              style={{ backgroundColor: entry.color }}
            />
            <span className="progress-chart__tooltip-label">
              {metricConfig[entry.dataKey]?.label}:
            </span>
            <span className="progress-chart__tooltip-value">
              {entry.value} {metricConfig[entry.dataKey]?.unit}
            </span>
          </div>
        ))}
      </div>
    );
  };

  const Chart = chartType === 'area' ? AreaChart : LineChart;
  const DataComponent = chartType === 'area' ? Area : Line;

  return (
    <div className="progress-chart">
      <ResponsiveContainer width="100%" height={height}>
        <Chart data={formattedData} margin={{ top: 5, right: 20, left: 0, bottom: 5 }}>
          {showGrid && (
            <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
          )}
          <XAxis 
            dataKey="date" 
            tick={{ fill: '#666', fontSize: 12 }}
            axisLine={{ stroke: '#e0e0e0' }}
          />
          <YAxis 
            tick={{ fill: '#666', fontSize: 12 }}
            axisLine={{ stroke: '#e0e0e0' }}
          />
          <Tooltip content={<CustomTooltip />} />
          {showLegend && (
            <Legend 
              wrapperStyle={{ paddingTop: '20px' }}
              iconType="line"
            />
          )}
          {metrics.map(metric => (
            <DataComponent
              key={metric}
              type="monotone"
              dataKey={metric}
              stroke={metricConfig[metric]?.color}
              fill={metricConfig[metric]?.color}
              fillOpacity={chartType === 'area' ? 0.1 : 0}
              strokeWidth={2}
              name={metricConfig[metric]?.label}
              dot={{ fill: metricConfig[metric]?.color, r: 4 }}
              activeDot={{ r: 6 }}
            />
          ))}
        </Chart>
      </ResponsiveContainer>
    </div>
  );
};

export default ProgressChart;

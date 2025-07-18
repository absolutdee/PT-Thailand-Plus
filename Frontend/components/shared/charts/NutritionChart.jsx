// Frontend/components/shared/charts/NutritionChart.jsx
import React, { useState } from 'react';
import {
  PieChart,
  Pie,
  Cell,
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  RadialBarChart,
  RadialBar
} from 'recharts';
import './NutritionChart.scss';

const NutritionChart = ({
  data = {},
  type = 'macros', // 'macros' | 'calories' | 'weekly'
  height = 300
}) => {
  const [chartView, setChartView] = useState('pie');

  const macrosData = [
    { name: 'โปรตีน', value: data.protein || 0, color: '#232956' },
    { name: 'คาร์โบไฮเดรต', value: data.carbs || 0, color: '#17a2b8' },
    { name: 'ไขมัน', value: data.fat || 0, color: '#ffc107' }
  ];

  const caloriesData = [
    {
      name: 'แคลอรี่',
      consumed: data.consumed || 0,
      target: data.target || 2000,
      remaining: Math.max(0, (data.target || 2000) - (data.consumed || 0))
    }
  ];

  const weeklyData = data.weekly || [];

  const CustomTooltip = ({ active, payload }) => {
    if (!active || !payload || !payload[0]) return null;

    return (
      <div className="nutrition-chart__tooltip">
        <p className="nutrition-chart__tooltip-title">{payload[0].name || payload[0].payload.name}</p>
        {payload.map((entry, index) => (
          <div key={index} className="nutrition-chart__tooltip-item">
            <span className="nutrition-chart__tooltip-label">
              {entry.dataKey || 'ปริมาณ'}:
            </span>
            <span className="nutrition-chart__tooltip-value">
              {entry.value} {entry.unit || (type === 'macros' ? 'g' : 'kcal')}
            </span>
          </div>
        ))}
      </div>
    );
  };

  const RADIAN = Math.PI / 180;
  const renderCustomizedLabel = ({ cx, cy, midAngle, innerRadius, outerRadius, percent }) => {
    const radius = innerRadius + (outerRadius - innerRadius) * 0.5;
    const x = cx + radius * Math.cos(-midAngle * RADIAN);
    const y = cy + radius * Math.sin(-midAngle * RADIAN);

    return (
      <text 
        x={x} 
        y={y} 
        fill="white" 
        textAnchor={x > cx ? 'start' : 'end'} 
        dominantBaseline="central"
        fontSize="14"
        fontWeight="600"
      >
        {`${(percent * 100).toFixed(0)}%`}
      </text>
    );
  };

  const renderMacrosChart = () => {
    if (chartView === 'bar') {
      return (
        <BarChart data={macrosData}>
          <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
          <XAxis dataKey="name" tick={{ fill: '#666', fontSize: 12 }} />
          <YAxis tick={{ fill: '#666', fontSize: 12 }} />
          <Tooltip content={<CustomTooltip />} />
          <Bar dataKey="value" radius={[8, 8, 0, 0]}>
            {macrosData.map((entry, index) => (
              <Cell key={`cell-${index}`} fill={entry.color} />
            ))}
          </Bar>
        </BarChart>
      );
    }

    return (
      <PieChart>
        <Pie
          data={macrosData}
          cx="50%"
          cy="50%"
          labelLine={false}
          label={renderCustomizedLabel}
          outerRadius={100}
          fill="#8884d8"
          dataKey="value"
        >
          {macrosData.map((entry, index) => (
            <Cell key={`cell-${index}`} fill={entry.color} />
          ))}
        </Pie>
        <Tooltip content={<CustomTooltip />} />
        <Legend />
      </PieChart>
    );
  };

  const renderCaloriesChart = () => {
    const percentage = Math.round((caloriesData[0].consumed / caloriesData[0].target) * 100);
    const radialData = [
      {
        name: 'บริโภคแล้ว',
        value: percentage,
        fill: percentage > 100 ? '#df2528' : '#232956'
      }
    ];

    return (
      <div className="nutrition-chart__calories">
        <div className="nutrition-chart__calories-chart">
          <ResponsiveContainer width="100%" height={200}>
            <RadialBarChart cx="50%" cy="50%" innerRadius="60%" outerRadius="90%" data={radialData}>
              <RadialBar dataKey="value" cornerRadius={10} fill="#232956" background={{ fill: '#f0f0f0' }} />
            </RadialBarChart>
          </ResponsiveContainer>
          <div className="nutrition-chart__calories-center">
            <span className="nutrition-chart__calories-percent">{percentage}%</span>
            <span className="nutrition-chart__calories-label">ของเป้าหมาย</span>
          </div>
        </div>
        <div className="nutrition-chart__calories-stats">
          <div className="nutrition-chart__calories-stat">
            <span className="nutrition-chart__calories-stat-label">บริโภคแล้ว</span>
            <span className="nutrition-chart__calories-stat-value">{caloriesData[0].consumed} kcal</span>
          </div>
          <div className="nutrition-chart__calories-stat">
            <span className="nutrition-chart__calories-stat-label">เป้าหมาย</span>
            <span className="nutrition-chart__calories-stat-value">{caloriesData[0].target} kcal</span>
          </div>
          <div className="nutrition-chart__calories-stat">
            <span className="nutrition-chart__calories-stat-label">คงเหลือ</span>
            <span className="nutrition-chart__calories-stat-value nutrition-chart__calories-stat-value--remaining">
              {caloriesData[0].remaining} kcal
            </span>
          </div>
        </div>
      </div>
    );
  };

  const renderWeeklyChart = () => (
    <BarChart data={weeklyData}>
      <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
      <XAxis dataKey="day" tick={{ fill: '#666', fontSize: 12 }} />
      <YAxis tick={{ fill: '#666', fontSize: 12 }} />
      <Tooltip content={<CustomTooltip />} />
      <Legend />
      <Bar dataKey="calories" fill="#232956" name="แคลอรี่" radius={[8, 8, 0, 0]} />
      <Bar dataKey="target" fill="#e0e0e0" name="เป้าหมาย" radius={[8, 8, 0, 0]} />
    </BarChart>
  );

  return (
    <div className="nutrition-chart">
      {type === 'macros' && (
        <>
          <div className="nutrition-chart__header">
            <h3 className="nutrition-chart__title">สัดส่วนสารอาหาร</h3>
            <div className="nutrition-chart__controls">
              <button
                className={`nutrition-chart__control ${chartView === 'pie' ? 'active' : ''}`}
                onClick={() => setChartView('pie')}
              >
                <svg width="20" height="20" viewBox="0 0 20 20" fill="currentColor">
                  <path d="M10 2a8 8 0 100 16 8 8 0 000-16zm0 2v6l4.24 4.24A6 6 0 0110 4z"/>
                </svg>
              </button>
              <button
                className={`nutrition-chart__control ${chartView === 'bar' ? 'active' : ''}`}
                onClick={() => setChartView('bar')}
              >
                <svg width="20" height="20" viewBox="0 0 20 20" fill="currentColor">
                  <rect x="2" y="10" width="4" height="8" />
                  <rect x="8" y="6" width="4" height="12" />
                  <rect x="14" y="2" width="4" height="16" />
                </svg>
              </button>
            </div>
          </div>
          <ResponsiveContainer width="100%" height={height}>
            {renderMacrosChart()}
          </ResponsiveContainer>
        </>
      )}

      {type === 'calories' && renderCaloriesChart()}

      {type === 'weekly' && (
        <ResponsiveContainer width="100%" height={height}>
          {renderWeeklyChart()}
        </ResponsiveContainer>
      )}
    </div>
  );
};

export default NutritionChart;

// Frontend/components/shared/charts/NutritionChart.scss
.nutrition-chart {
  background: white;
  border-radius: 12px;
  padding: 24px;

  &__header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 20px;
  }

  &__title {
    font-size: 18px;
    font-weight: 600;
    color: #232956;
    margin: 0;
  }

  &__controls {
    display: flex;
    gap: 8px;
  }

  &__control {
    width: 32px;
    height: 32px;
    border: 1px solid #e0e0e0;
    background: white;
    border-radius: 6px;
    display: flex;
    align-items: center;
    justify-content: center;
    cursor: pointer;
    transition: all 0.2s;
    color: #666;

    &:hover {
      border-color: #232956;
      color: #232956;
    }

    &.active {
      background: #232956;
      border-color: #232956;
      color: white;
    }
  }

  &__tooltip {
    background: white;
    border: 1px solid #e0e0e0;
    border-radius: 8px;
    padding: 12px;
    box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
  }

  &__tooltip-title {
    font-weight: 600;
    color: #333;
    margin: 0 0 8px;
  }

  &__tooltip-item {
    display: flex;
    justify-content: space-between;
    gap: 12px;
    font-size: 14px;
  }

  &__tooltip-label {
    color: #666;
  }

  &__tooltip-value {
    font-weight: 600;
    color: #333;
  }

  &__calories {
    &-chart {
      position: relative;
      margin-bottom: 24px;
    }

    &-center {
      position: absolute;
      top: 50%;
      left: 50%;
      transform: translate(-50%, -50%);
      text-align: center;
      display: flex;
      flex-direction: column;
    }

    &-percent {
      font-size: 32px;
      font-weight: 700;
      color: #232956;
      line-height: 1;
    }

    &-label {
      font-size: 14px;
      color: #666;
      margin-top: 4px;
    }

    &-stats {
      display: grid;
      grid-template-columns: repeat(3, 1fr);
      gap: 16px;
    }

    &-stat {
      text-align: center;
      padding: 16px;
      background: #f8f9fa;
      border-radius: 8px;
    }

    &-stat-label {
      display: block;
      font-size: 12px;
      color: #666;
      margin-bottom: 4px;
    }

    &-stat-value {
      display: block;
      font-size: 18px;
      font-weight: 600;
      color: #232956;

      &--remaining {
        color: #28a745;
      }
    }
  }
}

import React from 'react';
import {
  PieChart,
  Pie,
  Cell,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  LineChart,
  Line,
} from 'recharts';

const ProgressCharts = ({
  progressData = [],
  goalsByCategory = [],
  challengesByDifficulty = [],
  weeklyProgress = [],
  showPieChart = true,
  showBarChart = true,
  showLineChart = true,
}) => {
  const COLORS = {
    completed: '#10b981', // green
    inProgress: '#f59e0b', // amber
    notStarted: '#ef4444', // red
    easy: '#22c55e', // light green
    medium: '#f59e0b', // amber
    hard: '#ef4444', // red
  };

  const renderCustomizedLabel = ({
    cx,
    cy,
    midAngle,
    innerRadius,
    outerRadius,
    percent,
  }) => {
    if (percent < 0.05) return null; // Don't show labels for slices less than 5%

    const RADIAN = Math.PI / 180;
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
        fontSize="12"
        fontWeight="500"
      >
        {`${(percent * 100).toFixed(0)}%`}
      </text>
    );
  };

  const CustomTooltip = ({ active, payload, label }) => {
    if (active && payload && payload.length) {
      return (
        <div className="recharts-tooltip">
          <p className="tooltip-label">{label}</p>
          {payload.map((entry, index) => (
            <p key={index} style={{ color: entry.color }}>
              {`${entry.dataKey}: ${entry.value}`}
            </p>
          ))}
        </div>
      );
    }
    return null;
  };

  return (
    <div className="progress-charts" data-testid="progress-charts">
      {showPieChart && goalsByCategory.length > 0 && (
        <div className="chart-section">
          <h4>Goals by Category</h4>
          <ResponsiveContainer width="100%" height={300}>
            <PieChart>
              <Pie
                data={goalsByCategory}
                cx="50%"
                cy="50%"
                labelLine={false}
                label={renderCustomizedLabel}
                outerRadius={80}
                fill="#8884d8"
                dataKey="value"
              >
                {goalsByCategory.map((entry, index) => (
                  <Cell
                    key={`cell-${index}`}
                    fill={COLORS[entry.name] || COLORS.completed}
                  />
                ))}
              </Pie>
              <Tooltip content={<CustomTooltip />} />
              <Legend />
            </PieChart>
          </ResponsiveContainer>
        </div>
      )}

      {showBarChart && challengesByDifficulty.length > 0 && (
        <div className="chart-section">
          <h4>Challenges by Difficulty</h4>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={challengesByDifficulty}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="difficulty" />
              <YAxis />
              <Tooltip content={<CustomTooltip />} />
              <Legend />
              <Bar
                dataKey="completed"
                fill={COLORS.completed}
                name="Completed"
              />
              <Bar dataKey="total" fill={COLORS.inProgress} name="Total" />
            </BarChart>
          </ResponsiveContainer>
        </div>
      )}

      {showLineChart && weeklyProgress.length > 0 && (
        <div className="chart-section">
          <h4>Weekly Progress Trend</h4>
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={weeklyProgress}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="week" />
              <YAxis />
              <Tooltip content={<CustomTooltip />} />
              <Legend />
              <Line
                type="monotone"
                dataKey="goalsCompleted"
                stroke={COLORS.completed}
                strokeWidth={2}
                name="Goals Completed"
              />
              <Line
                type="monotone"
                dataKey="challengesCompleted"
                stroke={COLORS.inProgress}
                strokeWidth={2}
                name="Challenges Completed"
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
      )}

      {progressData.length > 0 && (
        <div className="chart-section">
          <h4>Overall Progress Distribution</h4>
          <ResponsiveContainer width="100%" height={300}>
            <PieChart>
              <Pie
                data={progressData}
                cx="50%"
                cy="50%"
                labelLine={false}
                label={renderCustomizedLabel}
                outerRadius={100}
                fill="#8884d8"
                dataKey="value"
              >
                {progressData.map((entry, index) => (
                  <Cell
                    key={`cell-${index}`}
                    fill={COLORS[entry.name] || COLORS.notStarted}
                  />
                ))}
              </Pie>
              <Tooltip content={<CustomTooltip />} />
              <Legend />
            </PieChart>
          </ResponsiveContainer>
        </div>
      )}
    </div>
  );
};

export default ProgressCharts;

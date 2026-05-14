import React from 'react';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend
} from 'chart.js';
import { Line } from 'react-chartjs-2';

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend
);

function ResultsChart({ data }) {
  const options = {
    responsive: true,
    maintainAspectRatio: false,
    animation: {
      duration: 300
    },
    plugins: {
      legend: {
        position: 'top',
        labels: {
          color: '#888',
          font: { size: 11 }
        }
      },
      tooltip: {
        mode: 'index',
        intersect: false,
        backgroundColor: 'rgba(22, 33, 62, 0.95)',
        titleColor: '#fff',
        bodyColor: '#ccc',
        borderColor: '#0f3460',
        borderWidth: 1
      }
    },
    scales: {
      x: {
        grid: {
          color: 'rgba(15, 52, 96, 0.3)'
        },
        ticks: {
          color: '#666',
          font: { size: 10 }
        },
        title: {
          display: true,
          text: '迭代次数',
          color: '#888',
          font: { size: 11 }
        }
      },
      y: {
        type: 'linear',
        display: true,
        position: 'left',
        grid: {
          color: 'rgba(15, 52, 96, 0.3)'
        },
        ticks: {
          color: '#666',
          font: { size: 10 }
        },
        title: {
          display: true,
          text: '目标函数',
          color: '#e94560',
          font: { size: 11 }
        }
      },
      y1: {
        type: 'linear',
        display: true,
        position: 'right',
        grid: {
          drawOnChartArea: false
        },
        ticks: {
          color: '#666',
          font: { size: 10 }
        },
        title: {
          display: true,
          text: '压降',
          color: '#4ecdc4',
          font: { size: 11 }
        }
      }
    }
  };

  const chartData = {
    labels: data.map((d, i) => i),
    datasets: [
      {
        label: '目标函数',
        data: data.map(d => d.objective),
        borderColor: '#e94560',
        backgroundColor: 'rgba(233, 69, 96, 0.1)',
        yAxisID: 'y',
        tension: 0.4,
        pointRadius: 2,
        pointHoverRadius: 5,
        fill: true
      },
      {
        label: '压降',
        data: data.map(d => d.pressureDrop),
        borderColor: '#4ecdc4',
        backgroundColor: 'rgba(78, 205, 196, 0.1)',
        yAxisID: 'y1',
        tension: 0.4,
        pointRadius: 2,
        pointHoverRadius: 5,
        fill: true
      }
    ]
  };

  return (
    <div className="chart-container">
      <h3>优化收敛曲线</h3>
      <div style={{ height: '200px' }}>
        {data.length > 0 ? (
          <Line options={options} data={chartData} />
        ) : (
          <div style={{ 
            display: 'flex', 
            alignItems: 'center', 
            justifyContent: 'center', 
            height: '100%', 
            color: '#666',
            fontSize: '0.9rem'
          }}>
            开始优化后将显示收敛曲线
          </div>
        )}
      </div>
    </div>
  );
}

export default ResultsChart;

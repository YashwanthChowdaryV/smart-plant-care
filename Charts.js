import React from 'react';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  ArcElement,
  Title,
  Tooltip,
  Legend,
} from 'chart.js';
import { Line, Bar, Doughnut } from 'react-chartjs-2';

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  ArcElement,
  Title,
  Tooltip,
  Legend
);

export const LineChart = ({ data, title }) => {
  const options = {
    responsive: true,
    plugins: {
      legend: { position: 'top' },
      title: {
        display: true,
        text: title,
        color: '#166534',
        font: { size: 16, weight: 'bold' }
      },
    },
    scales: {
      x: { grid: { color: '#bbf7d0' } },
      y: { grid: { color: '#bbf7d0' } },
    },
  };
  return <Line options={options} data={data} />;
};

export const BarChart = ({ data, title }) => {
  const options = {
    responsive: true,
    plugins: {
      legend: { position: 'top' },
      title: {
        display: true,
        text: title,
        color: '#166534',
        font: { size: 16, weight: 'bold' }
      },
    },
    scales: {
      x: { grid: { color: '#bbf7d0' } },
      y: { grid: { color: '#bbf7d0' } },
    },
  };
  return <Bar options={options} data={data} />;
};

export const DonutChart = ({ data, title }) => {
  const options = {
    responsive: true,
    plugins: {
      legend: { position: 'bottom' },
      title: {
        display: true,
        text: title,
        color: '#166534',
        font: { size: 16, weight: 'bold' }
      },
    },
  };
  return <Doughnut options={options} data={data} />;
};

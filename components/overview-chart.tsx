"use client";

import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  Title,
  Tooltip,
  Legend,
  Filler,
  ArcElement,
} from 'chart.js';
import { Line, Bar, Doughnut } from 'react-chartjs-2';
import { useFinanceStore } from '@/lib/store';
import { formatCurrency } from '@/lib/utils';

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  ArcElement,
  Title,
  Tooltip,
  Legend,
  Filler
);

export function OverviewChart() {
  const { transactions, settings } = useFinanceStore();

  // Get last 6 months
  const months = [];
  for (let i = 5; i >= 0; i--) {
    const d = new Date();
    d.setMonth(d.getMonth() - i);
    months.push(d.toLocaleString('default', { month: 'short' }));
  }

  const incomeData = new Array(6).fill(0);
  const expenseData = new Array(6).fill(0);

  transactions.forEach(t => {
    const tDate = new Date(t.date);
    const mDiff = (new Date().getFullYear() - tDate.getFullYear()) * 12 + (new Date().getMonth() - tDate.getMonth());
    if (mDiff >= 0 && mDiff < 6) {
      const idx = 5 - mDiff;
      if (t.type === 'income') incomeData[idx] += Number(t.amount);
      if (t.type === 'expense') expenseData[idx] += Number(t.amount);
    }
  });

  const data = {
    labels: months,
    datasets: [
      {
        label: 'Income',
        data: incomeData,
        borderColor: '#10b981',
        backgroundColor: 'rgba(16, 185, 129, 0.1)',
        fill: true,
        tension: 0.4,
        borderWidth: 3,
        pointRadius: 4,
        pointBackgroundColor: '#10b981',
      },
      {
        label: 'Expenses',
        data: expenseData,
        borderColor: '#ef4444',
        backgroundColor: 'rgba(239, 68, 68, 0.1)',
        fill: true,
        tension: 0.4,
        borderWidth: 3,
        pointRadius: 4,
        pointBackgroundColor: '#ef4444',
      },
    ],
  };

  const options = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        display: false,
      },
      tooltip: {
        backgroundColor: 'rgba(0, 0, 0, 0.8)',
        padding: 12,
        titleFont: { size: 14, weight: 'bold' as const },
        bodyFont: { size: 13 },
        cornerRadius: 12,
        displayColors: false,
        callbacks: {
          label: (context: any) => `${context.dataset.label}: ${formatCurrency(context.raw, settings.currency)}`,
        },
      },
    },
    scales: {
      x: {
        grid: { display: false },
        ticks: { color: '#94a3b8', font: { size: 11, weight: 'bold' as const } },
      },
      y: {
        grid: { color: 'rgba(148, 163, 184, 0.1)' },
        ticks: { 
          color: '#94a3b8', 
          font: { size: 11 },
          callback: (value: any) => formatCurrency(value, settings.currency).split('.')[0],
        },
      },
    },
  };

  return (
    <div className="h-full w-full min-h-[300px]">
      <Line data={data} options={options} />
    </div>
  );
}

export function SpendingBreakdownChart() {
  const { transactions, settings } = useFinanceStore();

  const categories: Record<string, number> = {};
  transactions.filter(t => t.type === 'expense').forEach(t => {
    categories[t.category] = (categories[t.category] || 0) + Number(t.amount);
  });

  const sortedCategories = Object.entries(categories)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 5);

  const data = {
    labels: sortedCategories.map(c => c[0]),
    datasets: [{
      data: sortedCategories.map(c => c[1]),
      backgroundColor: [
        '#6366f1',
        '#10b981',
        '#f59e0b',
        '#ef4444',
        '#8b5cf6',
      ],
      borderWidth: 0,
      hoverOffset: 10,
    }],
  };

  const options = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: 'right' as const,
        labels: {
          color: '#94a3b8',
          usePointStyle: true,
          pointStyle: 'circle',
          padding: 20,
          font: { size: 11, weight: 'bold' as const },
        }
      },
      tooltip: {
        backgroundColor: 'rgba(0, 0, 0, 0.8)',
        padding: 12,
        cornerRadius: 12,
        displayColors: false,
        callbacks: {
          label: (context: any) => `${context.label}: ${formatCurrency(context.raw, settings.currency)}`,
        },
      }
    },
    cutout: '70%',
  };

  return (
    <div className="h-full w-full min-h-[200px]">
      <Doughnut data={data} options={options} />
    </div>
  );
}

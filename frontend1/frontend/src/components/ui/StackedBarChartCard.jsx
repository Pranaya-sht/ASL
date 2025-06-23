import React from 'react';
import { Bar } from 'react-chartjs-2';
import ChartCard from './ChartCard';

const StackedBarChartCard = ({ title, data, options = {}, icon }) => (
    <ChartCard title={title} icon={icon}>
        <Bar data={data} options={{
            responsive: true,
            maintainAspectRatio: false,
            scales: {
                x: {
                    stacked: true,
                },
                y: {
                    stacked: true,
                    beginAtZero: true
                }
            },
            ...options
        }} />
    </ChartCard>
);

export default StackedBarChartCard;
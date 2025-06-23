import React from 'react';
import { Bar } from 'react-chartjs-2';
import ChartCard from './ChartCard';
import {
    Chart as ChartJS,
    CategoryScale,
    LinearScale,
    BarElement,
    Title,
    Tooltip,
    Legend,
} from "chart.js";
ChartJS.register(
    CategoryScale,
    LinearScale,
    BarElement,
    Title,
    Tooltip,
    Legend
);
const BarChartCard = ({ title, data, options = {}, icon }) => (
    <ChartCard title={title} icon={icon}>
        <Bar data={data} options={{
            responsive: true,
            maintainAspectRatio: false,
            scales: {
                y: {
                    beginAtZero: true,
                    ticks: {
                        precision: 0
                    }
                }
            },
            ...options
        }} />
    </ChartCard>
);

export default BarChartCard;
import React from 'react';
import {
    Chart as ChartJS,
    PointElement,
    LineElement,
    LinearScale,
    Tooltip,
    Legend,
} from 'chart.js';

import { Scatter } from 'react-chartjs-2';

// ✅ Register required parts for scatter charts
ChartJS.register(
    PointElement,
    LineElement,
    LinearScale,
    Tooltip,
    Legend
);


import ChartCard from './ChartCard';

const ScatterChartCard = ({ title, data }) => (
    <ChartCard title={title}>
        <Scatter data={data} options={{
            responsive: true,
            maintainAspectRatio: false,
            scales: {
                y: {
                    title: {
                        display: true,
                        text: 'Average Score'
                    },
                    min: 0,
                    max: 100
                },
                x: {
                    title: {
                        display: true,
                        text: 'Attempts'
                    },
                    min: 0
                }
            }
        }} />
    </ChartCard>
);

export default ScatterChartCard;
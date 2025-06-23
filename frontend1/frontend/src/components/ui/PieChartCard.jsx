import React from 'react';
import {
    Chart as ChartJS,
    ArcElement,
    Tooltip,
    Legend
} from "chart.js";

import { Pie } from "react-chartjs-2";

// Register required elements
ChartJS.register(ArcElement, Tooltip, Legend);
import ChartCard from './ChartCard';

const PieChartCard = ({ title, data, icon }) => {
    if (!data || data.labels.length === 0) {
        return (
            <ChartCard title={title} icon={icon}>
                <div className="flex items-center justify-center h-64">
                    <p className="text-gray-500">No data available</p>
                </div>
            </ChartCard>
        );
    }

    return (
        <ChartCard title={title} icon={icon}>
            <Pie data={data} options={{
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: {
                        position: 'right',
                    }
                }
            }} />
        </ChartCard>
    );
};

export default PieChartCard;
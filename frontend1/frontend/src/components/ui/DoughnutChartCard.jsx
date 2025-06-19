import React from 'react';
import { Doughnut } from 'react-chartjs-2';
import ChartCard from './ChartCard';

const DoughnutChartCard = ({ title, data, icon }) => (
    <ChartCard title={title} icon={icon}>
        <Doughnut data={data} options={{
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: {
                    position: 'right',
                }
            },
            cutout: '70%'
        }} />
    </ChartCard>
);

export default DoughnutChartCard;
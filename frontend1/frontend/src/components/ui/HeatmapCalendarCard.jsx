import React from 'react';
import HeatmapCalendar from './HeatmapCalendar';
import ChartCard from './ChartCard';

const HeatmapCalendarCard = ({ title, data, icon }) => {
    const today = new Date();
    const heatmapData = [];

    for (let i = 29; i >= 0; i--) {
        const date = new Date();
        date.setDate(today.getDate() - i);
        const dateStr = date.toISOString().split('T')[0];

        const activity = data.find(d => d.date === dateStr);
        heatmapData.push({
            date: dateStr,
            count: activity ? activity.count : 0 // ✅ Correct field
        });
    }

    return (
        <ChartCard title={title} icon={icon}>
            <HeatmapCalendar timeline={heatmapData} />
        </ChartCard>
    );
};

export default HeatmapCalendarCard;

import React from 'react';

const HeatmapCalendar = ({ timeline }) => {
    const today = new Date();
    const todayStr = today.toISOString().split('T')[0];
    const heatmapData = [];

    for (let i = 29; i >= 0; i--) {
        const date = new Date();
        date.setDate(today.getDate() - i);
        const dateStr = date.toISOString().split('T')[0];
        const activity = timeline.find(d => d.date === dateStr);

        heatmapData.push({
            date: dateStr,
            activity_count: activity ? activity.count : 0,
            dayOfWeek: new Date(dateStr).getDay(), // 0 (Sun) to 6 (Sat)
        });
    }

    // Padding first week to align with day of the week
    const firstDayOfWeek = new Date(heatmapData[0].date).getDay(); // 0 (Sun) to 6 (Sat)
    const paddedData = [
        ...Array(firstDayOfWeek).fill(null), // pad with empty days
        ...heatmapData
    ];

    // Group into weeks of 7
    const weeks = [];
    for (let i = 0; i < paddedData.length; i += 7) {
        weeks.push(paddedData.slice(i, i + 7));
    }

    // Gradient color scale
    const getColor = (count) => {
        if (count > 10) return "bg-green-700";
        if (count > 5) return "bg-green-500";
        if (count > 2) return "bg-green-300";
        if (count > 0) return "bg-green-100";
        return "bg-gray-200";
    };

    const handleClick = (day) => {
        if (!day) return;
        alert(`You clicked on ${day.date}: ${day.activity_count} activities`);
    };

    return (
        <div className="overflow-x-auto py-4">
            {/* Display today's activity */}
            <div className="mb-4 text-sm text-gray-700">
                <span className="font-medium">Today</span> ({todayStr}):{' '}
                <span className="font-bold">
                    {timeline.find(d => d.date === todayStr)?.count || 0} activities
                </span>
            </div>

            <div className="flex flex-wrap sm:flex-nowrap">
                {/* Weekday Labels */}
                <div className="grid grid-rows-7 gap-1 mr-1">
                    {['S', 'M', 'T', 'W', 'T', 'F', 'S'].map(day => (
                        <div key={day} className="h-6 w-6 flex items-center justify-center text-xs text-gray-500">
                            {day}
                        </div>
                    ))}
                </div>

                {/* Heatmap Calendar Grid */}
                <div className="flex">
                    {weeks.map((week, weekIndex) => (
                        <div key={weekIndex} className="flex flex-col mr-1">
                            {week.map((day, dayIndex) =>
                                day ? (
                                    <div
                                        key={`${weekIndex}-${dayIndex}`}
                                        className={`h-6 w-6 rounded-sm cursor-pointer transition-all duration-150 ease-in-out 
                                            ${getColor(day.activity_count)} 
                                            ${day.date === todayStr ? "ring-2 ring-blue-500" : ""}`}
                                        title={`${day.date}: ${day.activity_count} activities`}
                                        onClick={() => handleClick(day)}
                                    />
                                ) : (
                                    <div key={`empty-${weekIndex}-${dayIndex}`} className="h-6 w-6 mb-1" />
                                )
                            )}
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
};

export default HeatmapCalendar;

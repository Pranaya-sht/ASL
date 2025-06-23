import React from "react";

const HeatmapCalendar = ({ timeline }) => (
    <div className="grid grid-cols-7 gap-1">
        {timeline.map((day, i) => (
            <div
                key={i}
                className={`h-6 w-6 rounded ${day.activity_count > 0
                    ? day.activity_count > 3
                        ? "bg-green-600"
                        : "bg-green-400"
                    : "bg-gray-200"
                    }`}
                title={`${day.date}: ${day.activity_count} activities`}
            />
        ))}
    </div>
);

export default HeatmapCalendar;

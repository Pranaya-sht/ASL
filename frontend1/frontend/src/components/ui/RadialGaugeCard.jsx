import React from 'react';
import ChartCard from './ChartCard';

const RadialGaugeCard = ({ title, data }) => {
    const { value, max, label } = data;
    const percentage = Math.min(100, Math.max(0, (value / max) * 100));

    return (
        <ChartCard title={title}>
            <div className="flex flex-col items-center py-4">
                <div className="relative w-48 h-48">
                    <svg viewBox="0 0 120 120" className="w-full h-full">
                        {/* Background circle */}
                        <circle
                            cx="60"
                            cy="60"
                            r="54"
                            fill="none"
                            stroke="#e5e7eb"
                            strokeWidth="12"
                        />
                        {/* Progress circle */}
                        <circle
                            cx="60"
                            cy="60"
                            r="54"
                            fill="none"
                            stroke={percentage > 70 ? "#10b981" : percentage > 40 ? "#facc15" : "#f87171"}
                            strokeWidth="12"
                            strokeDasharray={`${percentage} ${100 - percentage}`}
                            strokeDashoffset="25"
                            strokeLinecap="round"
                            transform="rotate(-90 60 60)"
                        />
                        {/* Center text */}
                        <text
                            x="60"
                            y="60"
                            textAnchor="middle"
                            dy="7"
                            fontSize="20"
                            fontWeight="bold"
                            fill="#4b5563"
                        >
                            {value}%
                        </text>
                    </svg>
                </div>
                <p className="mt-2 text-lg font-medium text-gray-700">{label}</p>
            </div>
        </ChartCard >
    );
};

export default RadialGaugeCard;
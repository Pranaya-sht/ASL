import React from 'react';
import ChartCard from './ChartCard';

const BulletChartCard = ({ title, data }) => (
    <ChartCard title={title}>
        <div className="space-y-6 py-4">
            {data.map((item, index) => (
                <div key={index} className="space-y-2">
                    <div className="flex justify-between">
                        <span className="font-medium">{item.title}</span>
                        <span className="font-semibold">{item.value}%</span>
                    </div>
                    <div className="relative h-8 bg-gray-200 rounded-full overflow-hidden">
                        {/* Ranges */}
                        <div
                            className="absolute top-0 left-0 h-full bg-green-200"
                            style={{ width: `${item.ranges[0]}%` }}
                        />
                        <div
                            className="absolute top-0 left-0 h-full bg-yellow-200"
                            style={{ width: `${item.ranges[1]}%` }}
                        />
                        <div
                            className="absolute top-0 left-0 h-full bg-red-200"
                            style={{ width: `${item.ranges[2]}%` }}
                        />

                        {/* Target line */}
                        <div
                            className="absolute top-0 h-full w-1 bg-gray-700"
                            style={{ left: `${item.target}%` }}
                        />

                        {/* Value bar */}
                        <div
                            className="absolute top-1/4 h-1/2 bg-blue-600 rounded-full"
                            style={{ width: `${item.value}%` }}
                        />
                    </div>
                    <div className="flex justify-between text-xs text-gray-500">
                        <span>0%</span>
                        <span>Target: {item.target}%</span>
                        <span>100%</span>
                    </div>
                </div>
            ))}
        </div>
    </ChartCard>
);

export default BulletChartCard;
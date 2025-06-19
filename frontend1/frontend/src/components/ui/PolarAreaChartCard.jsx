import React from 'react';
import {
    Chart as ChartJS,
    RadialLinearScale,
    ArcElement,
    Tooltip,
    Legend,
} from 'chart.js';

ChartJS.register(RadialLinearScale, ArcElement, Tooltip, Legend);

import { PolarArea } from 'react-chartjs-2';
import ChartCard from './ChartCard';

// Generate distinct colors for each tag
const generateTagColors = (count) => {
    const colors = [];
    const hueStep = 360 / count;

    for (let i = 0; i < count; i++) {
        const hue = (i * hueStep) % 360;
        colors.push(`hsl(${hue}, 70%, 60%)`);
    }

    return colors;
};

const PolarAreaChartCard = ({ title, data }) => {
    // Generate distinct colors if we have data
    const backgroundColor = data?.labels?.length
        ? generateTagColors(data.labels.length)
        : ['#FF6384', '#36A2EB', '#FFCE56', '#4BC0C0', '#9966FF', '#FF9F40'];

    // Enhance the dataset with distinct colors
    const chartData = {
        ...data,
        datasets: data?.datasets?.map(dataset => ({
            ...dataset,
            backgroundColor,
            borderWidth: 1.5,
        })) || []
    };

    return (
        <ChartCard title={title}>
            <div style={{ height: '500px' }}>
                <PolarArea
                    data={chartData}
                    options={{
                        responsive: true,
                        maintainAspectRatio: false,
                        scales: {
                            r: {
                                ticks: {
                                    display: false,
                                    backdropColor: 'transparent',
                                },
                                grid: {
                                    color: 'rgba(200, 200, 200, 0.3)'
                                },
                                angleLines: {
                                    color: 'rgba(200, 200, 200, 0.3)'
                                },
                                pointLabels: {
                                    font: {
                                        size: 12,
                                        weight: 'bold'
                                    }
                                }
                            }
                        },
                        plugins: {
                            legend: {
                                position: 'right',
                                labels: {
                                    padding: 20,
                                    font: {
                                        size: 12
                                    },
                                    usePointStyle: true,
                                    pointStyle: 'circle',
                                    generateLabels: (chart) => {
                                        const datasets = chart.data.datasets;
                                        return chart.data.labels.map((label, i) => ({
                                            text: label,
                                            fillStyle: datasets[0].backgroundColor[i],
                                            strokeStyle: '#555',
                                            lineWidth: 1,
                                            hidden: false,
                                            index: i
                                        }));
                                    }
                                }
                            },
                            tooltip: {
                                callbacks: {
                                    label: (context) => {
                                        return `${context.label}: ${context.parsed.r}`;
                                    }
                                }
                            }
                        },
                        animation: {
                            animateRotate: true,
                            animateScale: true
                        }
                    }}
                />
            </div>
        </ChartCard>
    );
};

export default PolarAreaChartCard;
'use client';
import React from 'react';
import {
    Chart as ChartJS,
    RadialLinearScale,
    PointElement,
    LineElement,
    Filler,
    Tooltip,
    Legend,
} from 'chart.js';
import { Radar } from 'react-chartjs-2';
import ChartCard from './ChartCard';

ChartJS.register(
    RadialLinearScale,
    PointElement,
    LineElement,
    Filler,
    Tooltip,
    Legend
);

const ProgressRadarChart = ({ analytics }) => {
    const totalLearned = analytics?.learned_flashcards_by_level?.reduce(
        (sum, item) => sum + (item?.count || 0), 0
    ) || 0;

    const totalPracticed = analytics?.daily_practice_tags?.reduce(
        (sum, item) => sum + (item?.count || 0), 0
    ) || 0;

    const totalIncorrect = analytics?.incorrect_tags?.reduce(
        (sum, item) => sum + (item?.count || 0), 0
    ) || 0;

    const likes = analytics?.likes || 0;
    const dislikes = analytics?.dislikes || 0;
    const satisfactionRate = (likes + dislikes) > 0
        ? (likes / (likes + dislikes)) * 100
        : 0;

    const quizPerformanceArray = analytics?.quiz_performance || [];
    const quizPerformance = quizPerformanceArray.length > 0
        ? quizPerformanceArray.reduce(
            (sum, item) => sum + (item?.average_score || 0), 0
        ) / quizPerformanceArray.length
        : 0;

    const completionRate = analytics?.daily_practice_stats?.completion_rate || 0;

    const totalReminders = analytics?.reminder_stats?.total_reminders || 0;
    const sentReminders = analytics?.reminder_stats?.sent_reminders || 0;
    const reminderEngagement = totalReminders > 0
        ? (sentReminders / totalReminders) * 100
        : 0;

    // Composite Accuracy: based on quizzes, learning, and incorrects
    const learningScore = Math.min(100, (totalLearned / 50) * 100);
    const mistakePenalty = totalLearned > 0 ? Math.max(0, 100 - (totalIncorrect / totalLearned * 10)) : 0;
    const compositeAccuracy = (
        0.5 * quizPerformance +
        0.3 * learningScore +
        0.2 * mistakePenalty
    );

    const data = {
        labels: [
            'KNOWLEDGE',
            'PRACTICE',
            'ACCURACY',
            'SATISFACTION',
            'QUIZZES',
            'COMPLETION',
            'ENGAGEMENT'
        ],
        datasets: [
            {
                label: 'Skill Level',
                data: [
                    totalLearned,
                    totalPracticed,
                    compositeAccuracy,
                    satisfactionRate,
                    quizPerformance,
                    completionRate,
                    reminderEngagement
                ],
                backgroundColor: 'rgba(59, 130, 246, 0.25)',
                borderColor: 'rgba(59, 130, 246, 1)',
                borderWidth: 3,
                pointBackgroundColor: 'rgba(59, 130, 246, 1)',
                pointBorderColor: '#fff',
                pointHoverBackgroundColor: '#fff',
                pointHoverBorderColor: 'rgba(59, 130, 246, 1)',
                pointRadius: 6,
                pointHoverRadius: 8,
            }
        ],
    };

    const options = {
        responsive: true,
        maintainAspectRatio: false,
        scales: {
            r: {
                angleLines: {
                    display: true,
                    color: 'rgba(100, 116, 139, 0.5)',
                    lineWidth: 1.5
                },
                grid: {
                    color: 'rgba(100, 116, 139, 0.3)',
                    circular: true,
                },
                pointLabels: {
                    font: {
                        size: 13,
                        weight: 'bold',
                        family: "'Roboto', sans-serif"
                    },
                    color: '#1e293b',
                    backdropColor: 'transparent'
                },
                ticks: {
                    display: true,
                    stepSize: 20,
                    backdropColor: 'transparent',
                    color: 'rgba(100, 116, 139, 0.8)',
                    font: {
                        size: 10,
                        weight: 'bold'
                    }
                },
                suggestedMin: 0,
                suggestedMax: 100,
                startAngle: 30
            }
        },
        plugins: {
            legend: {
                display: false
            },
            tooltip: {
                backgroundColor: 'rgba(15, 23, 42, 0.95)',
                titleFont: {
                    size: 14,
                    weight: '700'
                },
                bodyFont: {
                    size: 13
                },
                padding: 12,
                cornerRadius: 8,
                displayColors: false,
                callbacks: {
                    title: (items) => {
                        return items[0].label;
                    },
                    label: (context) => {
                        const value = context.raw;
                        const metric = data.labels[context.dataIndex];

                        switch (metric) {
                            case 'KNOWLEDGE':
                                return `${value} flashcards learned`;
                            case 'PRACTICE':
                                return `${value} practice sessions`;
                            case 'ACCURACY':
                                return `${value.toFixed(1)}% composite accuracy`;
                            case 'SATISFACTION':
                                return `${value.toFixed(1)}% satisfaction rate`;
                            case 'QUIZZES':
                                return `${value.toFixed(1)}% average score`;
                            case 'COMPLETION':
                                return `${value}% completion rate`;
                            case 'ENGAGEMENT':
                                return `${value.toFixed(1)}% reminder engagement`;
                            default:
                                return value;
                        }
                    }
                }
            }
        },
        animation: {
            duration: 1500,
            easing: 'easeOutExpo'
        },
        elements: {
            line: {
                tension: 0,
            }
        }
    };

    const progressScores = data.datasets[0].data;
    const overallScore = progressScores.reduce((sum, score) => sum + score, 0) / progressScores.length;

    return (
        <ChartCard title="SKILL ASSESSMENT">
            <div className="relative">
                <div className="absolute top-4 right-4 z-10 bg-blue-600 text-white py-1 px-3 rounded-full font-bold text-lg">
                    {overallScore.toFixed(0)}%
                </div>
                <div className="p-4" style={{ height: '500px' }}>
                    <Radar data={data} options={options} />
                </div>
            </div>
        </ChartCard>
    );
};

export default ProgressRadarChart;

// | Label               | What It Measures                                             | Formula / Logic                                                                                                                                             |
// | ------------------- | ------------------------------------------------------------ | ----------------------------------------------------------------------------------------------------------------------------------------------------------- |
// | ✅ **KNOWLEDGE**     | Total flashcards the user has learned                        | Sum of `analytics.learned_flashcards_by_level.count`                                                                                                        |
// | 🔁 **PRACTICE**     | Total flashcards practiced (daily)                           | Sum of `analytics.daily_practice_tags.count`                                                                                                                |
// | 🎯 **ACCURACY**     | Composite score based on learning, quiz, and mistake penalty | `0.5 * quiz avg + 0.3 * learning score + 0.2 * mistake penalty`<br>Learning score = scaled learned flashcards<br>Mistake penalty = lower if many incorrects |
// | ❤️ **SATISFACTION** | Ratio of positive feedback from user                         | `(likes / (likes + dislikes)) * 100`                                                                                                                        |
// | 🧠 **QUIZZES**      | Average quiz score across levels                             | Average of `analytics.quiz_performance[].average_score`                                                                                                     |
// | 📅 **COMPLETION**   | Daily practice completion rate                               | `analytics.daily_practice_stats.completion_rate`                                                                                                            |
// | 🔔 **ENGAGEMENT**   | Reminder engagement rate (sent/total reminders)              | `(sent_reminders / total_reminders) * 100`                                                                                                                  |

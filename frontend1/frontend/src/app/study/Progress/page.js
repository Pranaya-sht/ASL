"use client";
import Link from 'next/link';
import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import BarChartCard from "@/components/ui/BarChartCard";
import PieChartCard from "@/components/ui/PieChartCard";
import DoughnutChartCard from "@/components/ui/DoughnutChartCard";
import HeatmapCalendarCard from "@/components/ui/HeatmapCalendarCard";
import PolarAreaChartCard from "@/components/ui/PolarAreaChartCard";
import StatCardGrid from "@/components/ui/StatCardGrid";
import StackedBarChartCard from "@/components/ui/StackedBarChartCard";
import ScatterChartCard from "@/components/ui/ScatterChartCard";
import BulletChartCard from "@/components/ui/BulletChartCard";
import RadialGaugeCard from "@/components/ui/RadialGaugeCard";
import CombinedSkillTree from "@/components/ui/SkillTreeLearned";
import ProgressRadarChart from "@/components/ui/SpiderChart";
import { FaChartLine, FaTrophy, FaCalendarAlt, FaTags, FaBook, FaLightbulb, FaUserGraduate } from "react-icons/fa";
import SkillTreeCard from "@/components/ui/SkillTreeQuiz";

export default function Progress() {
    const [analytics, setAnalytics] = useState(null);
    const [progress, setProgress] = useState(null);
    const [activeTab, setActiveTab] = useState('overview');
    const [recommendations, setRecommendations] = useState([]);

    useEffect(() => {
        const fetchData = async () => {
            const token = localStorage.getItem("access_token");
            try {
                const [analyticsRes, progressRes] = await Promise.all([
                    fetch("http://localhost:8000/learn/api/user/analytics", {
                        headers: { Authorization: `Bearer ${token}` },
                    }),
                    fetch("http://localhost:8000/learn/api/user/progress", {
                        headers: { Authorization: `Bearer ${token}` },
                    })
                ]);

                const [analyticsData, progressData] = await Promise.all([
                    analyticsRes.json(),
                    progressRes.json()
                ]);

                setAnalytics(analyticsData);
                setProgress(progressData);
                generateRecommendations(analyticsData);
            } catch (error) {
                console.error("Error fetching data:", error);
            }
        };

        fetchData();
    }, []);

    const generateRecommendations = (analytics) => {
        if (!analytics) return;

        const recs = [];
        const quizPerformance = analytics.quiz_performance || [];

        // Analyze quiz performance for recommendations
        quizPerformance.forEach(level => {
            if (level.average_score < 60) {
                recs.push({
                    level: level.level,
                    message: `Focus on reviewing Level ${level.level} flashcards - your average score is low (${level.average_score}%)`,
                    priority: 'high'
                });
            } else if (level.average_score < 80) {
                recs.push({
                    level: level.level,
                    message: `Practice more Level ${level.level} quizzes to improve from ${level.average_score}% to 80%+`,
                    priority: 'medium'
                });
            }
        });

        // Analyze incorrect tags
        const topIncorrectTags = [...(analytics.incorrect_tags || [])]
            .sort((a, b) => b.count - a.count)
            .slice(0, 3);

        topIncorrectTags.forEach(tag => {
            recs.push({
                tag: tag.tag,
                message: `Review "${tag.tag}" concepts - you've  ${tag.count} questions to review on this topic`,
                priority: 'medium'
            });
        });

        // Analyze daily practice
        if (analytics.daily_practice_stats?.completion_rate < 70) {
            recs.push({
                message: `Increase daily practice - current completion rate is ${analytics.daily_practice_stats.completion_rate}%`,
                priority: 'high'
            });
        }

        setRecommendations(recs);
    };

    if (!analytics || !progress) {
        return (
            <div className="flex justify-center items-center min-h-screen">
                <div className="animate-spin h-12 w-12 border-b-4 border-purple-600 rounded-full"></div>
            </div>
        );
    }

    // Prepare data for charts (same as original)
    const quizScoresData = {
        labels: analytics.quiz_scores.map(s => new Date(s.date).toLocaleDateString()),
        datasets: [{
            label: "Quiz Scores",
            data: analytics.quiz_scores.map(s => s.score),
            backgroundColor: "#7c3aed",
        }]
    };

    const flashcardsData = {
        labels: analytics.learned_flashcards_by_level.map(s => `Level ${s.level}`),
        datasets: [{
            label: "Learned Flashcards",
            data: analytics.learned_flashcards_by_level.map(s => s.count),
            backgroundColor: "#10b981",
        }]
    };

    const labels = analytics?.learned_tags?.map(t => t.tag) || [];
    const dataValues = analytics?.learned_tags?.map(t => t.count) || [];

    const learnedTagsData = {
        labels,
        datasets: [{
            label: "Learned Tags",
            data: dataValues,
            backgroundColor: [
                "#f87171", "#facc15", "#34d399", "#60a5fa", "#a78bfa", "#f472b6", "#fb923c"
            ],
        }]
    };

    const practiceTagsData = {
        labels: analytics.daily_practice_tags?.map(t => t.tag) || [],
        datasets: [{
            label: "Daily Practice Tags",
            data: analytics.daily_practice_tags?.map(t => t.count) || [],
            backgroundColor: [
                "#34d399", "#60a5fa", "#fbbf24", "#f472b6", "#c084fc", "#f87171", "#4ade80"
            ],
        }]
    };

    const incorrectTagsData = {
        labels: analytics.incorrect_tags?.map(t => t.tag) || [],
        datasets: [{
            label: "Incorrect Answers",
            data: analytics.incorrect_tags?.map(t => t.count) || [],
        }]
    };

    const feedbackByLevelData = {
        labels: analytics.feedback_by_level.map(f => `Level ${f.level}`),
        datasets: [
            {
                label: "Likes",
                data: analytics.feedback_by_level.map(f => f.likes),
                backgroundColor: "rgba(75, 192, 192, 0.6)",
            },
            {
                label: "Dislikes",
                data: analytics.feedback_by_level.map(f => f.dislikes),
                backgroundColor: "rgba(255, 99, 132, 0.6)",
            }
        ]
    };

    const quizPerformanceData = {
        labels: analytics?.quiz_performance?.map(p => `Level ${p.level}`) || [],
        datasets: [
            {
                label: "Average Score",
                data: analytics?.quiz_performance?.map(p => p.average_score) || [],
                backgroundColor: "rgba(54, 162, 235, 0.6)",
            },
            {
                label: "Best Score",
                data: analytics?.quiz_performance?.map(p => p.best_score) || [],
                backgroundColor: "rgba(75, 192, 192, 0.6)",
            }
        ]
    };

    const incorrectByLevelData = {
        labels: analytics.incorrect_by_level.map(i => `Level ${i.level}`),
        datasets: [{
            label: "Incorrect Answers",
            data: analytics.incorrect_by_level.map(i => i.count),
            backgroundColor: "#f87171",
        }]
    };

    const dailyPracticeData = {
        completed: analytics.daily_practice_stats.completed_practices,
        total: analytics.daily_practice_stats.total_practices,
        rate: analytics.daily_practice_stats.completion_rate
    };

    const reminderData = {
        sent: analytics.reminder_stats.sent_reminders,
        pending: analytics.reminder_stats.pending_reminders
    };

    const heatmapData = analytics.progress_timeline.map(day => ({
        date: day.date,
        count: day.activity_count
    }));

    const scatterData = {
        datasets: [{
            label: 'Quiz Performance',
            data: analytics.quiz_performance.map(p => ({
                x: p.attempts,
                y: p.average_score,
                level: p.level
            })),
            backgroundColor: analytics.quiz_performance.map(p =>
                p.average_score > 80 ? '#10b981' :
                    p.average_score > 60 ? '#facc15' : '#f87171'
            ),
        }]
    };

    const bulletData = analytics.quiz_performance.map(p => ({
        title: `Level ${p.level}`,
        value: p.average_score,
        target: 80,
        ranges: [40, 70, 100]
    }));

    const gaugeData = {
        value: dailyPracticeData.rate,
        max: 100,
        label: "Practice Completion"
    };

    return (
        <div className="p-6 max-w-7xl mx-auto">
            <motion.h1
                className="text-3xl font-bold mb-6 text-center bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent"
                initial={{ opacity: 0, y: -20 }}
                animate={{ opacity: 1, y: 0 }}
            >
                📈 Your Learning Dashboard
            </motion.h1>

            {/* Tab Navigation */}
            <div className="flex overflow-x-auto mb-8 border-b border-gray-200">
                <button
                    onClick={() => setActiveTab('overview')}
                    className={`px-6 py-3 font-medium text-sm rounded-t-lg transition-all ${activeTab === 'overview' ? 'bg-gradient-to-r from-purple-500 to-pink-500 text-white shadow-lg' : 'text-gray-600 hover:bg-gray-100'}`}
                >
                    Overview
                </button>
                <button
                    onClick={() => setActiveTab('performance')}
                    className={`px-6 py-3 font-medium text-sm rounded-t-lg transition-all ${activeTab === 'performance' ? 'bg-gradient-to-r from-purple-500 to-pink-500 text-white shadow-lg' : 'text-gray-600 hover:bg-gray-100'}`}
                >
                    Performance
                </button>
                <button
                    onClick={() => setActiveTab('flashcards')}
                    className={`px-6 py-3 font-medium text-sm rounded-t-lg transition-all ${activeTab === 'flashcards' ? 'bg-gradient-to-r from-purple-500 to-pink-500 text-white shadow-lg' : 'text-gray-600 hover:bg-gray-100'}`}
                >
                    Flashcards
                </button>
                <button
                    onClick={() => setActiveTab('practice')}
                    className={`px-6 py-3 font-medium text-sm rounded-t-lg transition-all ${activeTab === 'practice' ? 'bg-gradient-to-r from-purple-500 to-pink-500 text-white shadow-lg' : 'text-gray-600 hover:bg-gray-100'}`}
                >
                    Practice
                </button>
                <button
                    onClick={() => setActiveTab('recommendations')}
                    className={`px-6 py-3 font-medium text-sm rounded-t-lg transition-all ${activeTab === 'recommendations' ? 'bg-gradient-to-r from-purple-500 to-pink-500 text-white shadow-lg' : 'text-gray-600 hover:bg-gray-100'}`}
                >
                    Recommendations
                </button>
            </div>

            {/* Overview Tab */}
            {activeTab === 'overview' && (
                <div className="space-y-8">
                    <StatCardGrid
                        analytics={analytics}
                        progress={progress}
                        dailyPracticeData={dailyPracticeData}
                        reminderData={reminderData}
                    />

                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                        <div className="bg-white rounded-xl shadow-lg p-6 border border-gray-100">
                            <h3 className="text-xl font-semibold mb-4 flex items-center text-purple-700">
                                <FaLightbulb className="mr-2" /> Quick Insights
                            </h3>
                            <ul className="space-y-3">
                                <li className="flex items-start">
                                    <span className="bg-green-100 text-green-800 p-1 rounded-full mr-2">
                                        <FaUserGraduate className="h-4 w-4" />
                                    </span>
                                    <span>You've learned {analytics.learned_flashcards_by_level.reduce((acc, curr) => acc + curr.count, 0)} flashcards across {analytics.learned_flashcards_by_level.length} levels</span>
                                </li>
                                <li className="flex items-start">
                                    <span className="bg-blue-100 text-blue-800 p-1 rounded-full mr-2">
                                        <FaTrophy className="h-4 w-4" />
                                    </span>
                                    <span>Your highest quiz score is {Math.max(...analytics.quiz_scores.map(s => s.score))}%</span>
                                </li>
                                <li className="flex items-start">
                                    <span className="bg-purple-100 text-purple-800 p-1 rounded-full mr-2">
                                        <FaCalendarAlt className="h-4 w-4" />
                                    </span>
                                    <span>You've completed {dailyPracticeData.completed} of {dailyPracticeData.total} daily practices ({dailyPracticeData.rate}%)</span>
                                </li>
                            </ul>
                        </div>

                        <HeatmapCalendarCard
                            title="Activity Heatmap"
                            data={heatmapData}
                            icon={<FaCalendarAlt />}
                        />
                    </div>

                    <CombinedSkillTree
                        title="Your Learning Journey"
                        levelData={analytics.learned_flashcards_by_level}
                        tagData={analytics.learned_tags_by_level}
                    />
                </div>
            )}

            {/* Performance Tab */}
            {activeTab === 'performance' && (
                <div className="space-y-8">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <BarChartCard
                            title="Recent Quiz Scores"
                            data={quizScoresData}
                            icon={<FaChartLine />}
                        />

                        <SkillTreeCard
                            title="Quiz Performance Tree"
                            data={quizPerformanceData}
                            icon={<FaTrophy />}
                        />
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <StackedBarChartCard
                            title="Feedback by Level"
                            data={feedbackByLevelData}
                            icon={<FaChartLine />}
                        />

                        <ScatterChartCard
                            title="Quiz Attempts vs Scores"
                            data={scatterData}
                        />
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <BulletChartCard
                            title="Quiz Performance Targets"
                            data={bulletData}
                        />

                        <RadialGaugeCard
                            title="Daily Practice Completion"
                            data={gaugeData}
                        />
                    </div>

                    <ProgressRadarChart analytics={analytics} />
                </div>
            )}

            {/* Flashcards Tab */}
            {activeTab === 'flashcards' && (
                <div className="space-y-8">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <BarChartCard
                            title="Learned Flashcards by Level"
                            data={flashcardsData}
                            icon={<FaBook />}
                        />

                        <PieChartCard
                            title="Learned Tags"
                            data={learnedTagsData}
                            icon={<FaTags />}
                        />
                    </div>

                    <BarChartCard
                        title="Incorrect Answers by Level"
                        data={incorrectByLevelData}
                        options={{ indexAxis: 'y' }}
                    />

                    <PolarAreaChartCard
                        title="Incorrect Answers by Tag"
                        data={incorrectTagsData}
                    />
                </div>
            )}

            {/* Practice Tab */}
            {activeTab === 'practice' && (
                <div className="space-y-8">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <DoughnutChartCard
                            title="Daily Practice Tags"
                            data={practiceTagsData}
                            icon={<FaTags />}
                        />

                        <div className="bg-white rounded-xl shadow-lg p-6 border border-gray-100">
                            <h3 className="text-xl font-semibold mb-4 flex items-center text-purple-700">
                                <FaCalendarAlt className="mr-2" /> Practice Consistency
                            </h3>
                            <div className="space-y-4">
                                <div>
                                    <div className="flex justify-between mb-1">
                                        <span className="text-sm font-medium">Completion Rate</span>
                                        <span className="text-sm font-medium">{dailyPracticeData.rate}%</span>
                                    </div>
                                    <div className="w-full bg-gray-200 rounded-full h-2.5">
                                        <div
                                            className="bg-gradient-to-r from-purple-500 to-pink-500 h-2.5 rounded-full"
                                            style={{ width: `${dailyPracticeData.rate}%` }}
                                        ></div>
                                    </div>
                                </div>
                                <div className="grid grid-cols-2 gap-4">
                                    <div className="bg-purple-50 p-4 rounded-lg">
                                        <p className="text-sm text-purple-600">Completed</p>
                                        <p className="text-2xl font-bold text-purple-800">{dailyPracticeData.completed}</p>
                                    </div>
                                    <div className="bg-pink-50 p-4 rounded-lg">
                                        <p className="text-sm text-pink-600">Pending</p>
                                        <p className="text-2xl font-bold text-pink-800">{dailyPracticeData.total - dailyPracticeData.completed}</p>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* Recommendations Tab */}
            {activeTab === 'recommendations' && (
                <div className="space-y-6">
                    <div className="bg-white rounded-xl shadow-lg p-6 border border-gray-100">
                        <h3 className="text-xl font-semibold mb-4 flex items-center text-purple-700">
                            <FaLightbulb className="mr-2" /> Personalized Recommendations
                        </h3>

                        {recommendations.length > 0 ? (
                            <ul className="space-y-4">
                                {recommendations.map((rec, index) => (
                                    <motion.li
                                        key={index}
                                        className={`p-4 rounded-lg border-l-4 ${rec.priority === 'high' ? 'bg-red-50 border-red-500' : 'bg-blue-50 border-blue-500'}`}
                                        initial={{ opacity: 0, x: -20 }}
                                        animate={{ opacity: 1, x: 0 }}
                                        transition={{ delay: index * 0.1 }}
                                    >
                                        <div className="flex items-start">
                                            <span className={`p-1 rounded-full mr-3 ${rec.priority === 'high' ? 'bg-red-100 text-red-600' : 'bg-blue-100 text-blue-600'}`}>
                                                {rec.priority === 'high' ? '❗' : '💡'}
                                            </span>
                                            <p className="text-gray-800">{rec.message}</p>
                                        </div>
                                    </motion.li>
                                ))}
                            </ul>
                        ) : (
                            <div className="text-center py-8">
                                <p className="text-gray-500">Great job! No urgent recommendations at this time.</p>
                            </div>
                        )}
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div className="bg-white rounded-xl shadow-lg p-6 border border-gray-100">
                            <h3 className="text-xl font-semibold mb-4 flex items-center text-purple-700">
                                <FaTrophy className="mr-2" /> Level Performance Summary
                            </h3>
                            <div className="space-y-4">
                                {analytics.quiz_performance.map((level, index) => (
                                    <div key={index} className="border-b border-gray-100 pb-3 last:border-0">
                                        <div className="flex justify-between mb-1">
                                            <span className="font-medium">Level {level.level}</span>
                                            <span className={`font-semibold ${level.average_score > 80 ? 'text-green-600' :
                                                level.average_score > 60 ? 'text-yellow-600' : 'text-red-600'
                                                }`}>
                                                {level.average_score}% avg
                                            </span>
                                        </div>
                                        <div className="w-full bg-gray-200 rounded-full h-2">
                                            <div
                                                className={`h-2 rounded-full ${level.average_score > 80 ? 'bg-green-500' :
                                                    level.average_score > 60 ? 'bg-yellow-500' : 'bg-red-500'
                                                    }`}
                                                style={{ width: `${level.average_score}%` }}
                                            ></div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>

                        <div className="bg-white rounded-xl shadow-lg p-6 border border-gray-100">
                            <h3 className="text-xl font-semibold mb-4 flex items-center text-purple-700">
                                <FaTags className="mr-2" /> Focus Areas
                            </h3>
                            <div className="space-y-3">
                                {analytics.incorrect_tags
                                    .sort((a, b) => b.count - a.count)
                                    .slice(0, 5)
                                    .map((tag, index) => (
                                        <div key={index} className="flex justify-between items-center">
                                            <span className="text-gray-700">{tag.tag}</span>
                                            <Link href="/study/IncorrectAnswers">
                                                <span className="bg-red-100 text-red-800 px-2 py-1 rounded-full text-xs font-medium cursor-pointer">
                                                    {tag.count} questions & answers
                                                </span>
                                            </Link>
                                        </div>
                                    ))}
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
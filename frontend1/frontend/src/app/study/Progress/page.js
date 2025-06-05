"use client";

import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { Bar, Pie, Doughnut } from "react-chartjs-2";
import { FaChartLine } from "react-icons/fa";
import "chart.js/auto";

export default function Progress() {
    const [analytics, setAnalytics] = useState(null);
    const [progress, setProgress] = useState(null);

    useEffect(() => {
        fetchAnalytics();
        fetchProgress();
    }, []);

    const fetchAnalytics = async () => {
        const token = localStorage.getItem("access_token");
        const res = await fetch("http://localhost:8000/learn/api/user/analytics", {
            headers: { Authorization: `Bearer ${token}` },
        });
        const data = await res.json();
        setAnalytics(data);
    };

    const fetchProgress = async () => {
        const token = localStorage.getItem("access_token");
        const res = await fetch("http://localhost:8000/learn/api/user/progress", {
            headers: { Authorization: `Bearer ${token}` },
        });
        const data = await res.json();
        setProgress(data);
    };

    if (!analytics || !progress) {
        return (
            <div className="flex justify-center items-center min-h-screen">
                <div className="animate-spin h-12 w-12 border-b-4 border-purple-600 rounded-full"></div>
            </div>
        );
    }

    // Chart data definitions
    const quizScoresData = {
        labels: analytics.quiz_scores.map((s) =>
            new Date(s.date).toLocaleDateString()
        ),
        datasets: [
            {
                label: "Quiz Scores",
                data: analytics.quiz_scores.map((s) => s.score),
                backgroundColor: "#7c3aed",
            },
        ],
    };

    const flashcardsData = {
        labels: analytics.learned_flashcards_by_level.map((s) => `Level ${s.level}`),
        datasets: [
            {
                label: "Learned Flashcards",
                data: analytics.learned_flashcards_by_level.map((s) => s.count),
                backgroundColor: "#10b981",
            },
        ],
    };

    const learnedTagsData = {
        labels: analytics.learned_tags.map((t) => t.tag),
        datasets: [
            {
                label: "Learned Tags",
                data: analytics.learned_tags.map((t) => t.count),
                backgroundColor: [
                    "#f87171", "#facc15", "#34d399", "#60a5fa", "#a78bfa", "#f472b6", "#fb923c"
                ],
            },
        ],
    };

    const practiceTagsData = {
        labels: analytics.daily_practice_tags.map((t) => t.tag),
        datasets: [
            {
                label: "Daily Practice Tags",
                data: analytics.daily_practice_tags.map((t) => t.count),
                backgroundColor: [
                    "#34d399", "#60a5fa", "#fbbf24", "#f472b6", "#c084fc", "#f87171", "#4ade80"
                ],
            },
        ],
    };

    const incorrectTagsData = {
        labels: analytics.incorrect_tags.map((t) => t.tag),
        datasets: [
            {
                label: "Incorrect Answers by Tag",
                data: analytics.incorrect_tags.map((t) => t.count),
                backgroundColor: "#f87171",
            },
        ],
    };

    return (
        <div className="p-6">
            <h1 className="text-3xl font-bold mb-4 text-center bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent">
                📈 Progress Overview
            </h1>

            <div className="grid gap-6 lg:grid-cols-2">
                <motion.div
                    className="bg-white rounded-xl p-6 shadow-lg"
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                >
                    <h2 className="text-xl font-semibold mb-2 flex items-center gap-2">
                        <FaChartLine /> Recent Quiz Scores
                    </h2>
                    <Bar data={quizScoresData} />
                </motion.div>

                <motion.div
                    className="bg-white rounded-xl p-6 shadow-lg"
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                >
                    <h2 className="text-xl font-semibold mb-2 flex items-center gap-2">
                        <FaChartLine /> Learned Flashcards by Level
                    </h2>
                    <Bar data={flashcardsData} />
                </motion.div>
            </div>

            <div className="grid gap-6 lg:grid-cols-2 mt-6">
                <motion.div
                    className="bg-white rounded-xl p-6 shadow-lg"
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                >
                    <h2 className="text-xl font-semibold mb-2">🏷️ Learned Tags</h2>
                    <Pie data={learnedTagsData} />
                </motion.div>

                <motion.div
                    className="bg-white rounded-xl p-6 shadow-lg"
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                >
                    <h2 className="text-xl font-semibold mb-2">📘 Daily Practice Tags</h2>
                    <Doughnut data={practiceTagsData} />
                </motion.div>
            </div>

            <div className="mt-6 bg-white rounded-xl p-6 shadow-lg">
                <h2 className="text-xl font-semibold mb-2">❌ Incorrect Answers by Tag</h2>
                <Bar
                    data={incorrectTagsData}
                    options={{ indexAxis: 'y' }}
                />
            </div>

            <div className="mt-6 bg-white rounded-xl p-6 shadow-lg">
                <h2 className="text-xl font-semibold mb-2">👍👎 Feedback Stats</h2>
                <p className="text-green-600">Likes: {analytics.likes}</p>
                <p className="text-red-600">Dislikes: {analytics.dislikes}</p>
            </div>

            <div className="mt-6 bg-white rounded-xl p-6 shadow-lg">
                <h2 className="text-xl font-semibold mb-2">📊 User Progress Summary</h2>
                <p><strong>Email:</strong> {progress.email}</p>
                <p><strong>Current Level:</strong> {progress.current_level}</p>
                <p><strong>Total Quizzes Taken:</strong> {progress.total_quizzes}</p>
                <p><strong>Total Correct Answers:</strong> {progress.total_correct}</p>
                <p><strong>Last Score:</strong> {progress.last_score}</p>
                <p><strong>Last Updated:</strong> {new Date(progress.updated_at).toLocaleString()}</p>
            </div>
        </div>
    );
}

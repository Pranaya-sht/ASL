import React from 'react';
import { motion } from 'framer-motion';
import StatCard from './StatCard';

const StatCardGrid = ({ analytics, progress, dailyPracticeData, reminderData }) => {
    const stats = [
        {
            title: "Current Level",
            value: progress.current_level,
            icon: "🏆",
            color: "bg-purple-100 text-purple-800"
        },
        {
            title: "Total Quizzes",
            value: progress.total_quizzes,
            icon: "📝",
            color: "bg-blue-100 text-blue-800"
        },
        {
            title: "Total Correct",
            value: progress.total_correct,
            icon: "✅",
            color: "bg-green-100 text-green-800"
        },
        {
            title: "Last Score",
            value: `${progress.last_score}%`,
            icon: "🎯",
            color: progress.last_score > 70 ? "bg-green-100 text-green-800" :
                progress.last_score > 50 ? "bg-yellow-100 text-yellow-800" : "bg-red-100 text-red-800"
        },
        {
            title: "Practice Completion",
            value: `${dailyPracticeData.rate}%`,
            icon: "📊",
            color: dailyPracticeData.rate > 70 ? "bg-green-100 text-green-800" :
                dailyPracticeData.rate > 40 ? "bg-yellow-100 text-yellow-800" : "bg-red-100 text-red-800"
        },
        {
            title: "Reminders Sent",
            value: `${reminderData.sent}/${reminderData.sent + reminderData.pending}`,
            icon: "🔔",
            color: "bg-indigo-100 text-indigo-800"
        },
        {
            title: "Liked Flashcards",
            value: analytics.likes,
            icon: "👍",
            color: "bg-green-100 text-green-800"
        },
        {
            title: "Disliked Flashcards",
            value: analytics.dislikes,
            icon: "👎",
            color: "bg-red-100 text-red-800"
        }
    ];

    return (
        <motion.div
            className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.5 }}
        >
            {stats.map((stat, index) => (
                <StatCard
                    key={index}
                    icon={stat.icon}
                    title={stat.title}
                    value={stat.value}
                    color={stat.color}
                />
            ))}
        </motion.div>
    );
};

export default StatCardGrid;     
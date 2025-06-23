"use client";

import { useEffect, useState } from "react";
import ReactPlayer from "react-player";
import { motion } from "framer-motion";
import { FaCheck, FaFire, FaTag } from "react-icons/fa";

export default function DailyPractice() {
    const [flashcards, setFlashcards] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetchDailyPractice();
    }, []);

    const fetchDailyPractice = async () => {
        setLoading(true);
        const token = localStorage.getItem("access_token");
        const res = await fetch("http://localhost:8000/learn/api/daily-practice", {
            headers: { Authorization: `Bearer ${token}` },
        });

        if (res.ok) {
            const data = await res.json();
            setFlashcards(data);
        } else {
            console.error("Failed to fetch daily practice");
        }

        setLoading(false);
    };

    const handleComplete = async (id, currentStatus) => {
        const token = localStorage.getItem("access_token");
        const newStatus = !currentStatus;

        await fetch("http://localhost:8000/learn/api/daily-practice/complete", {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                Authorization: `Bearer ${token}`,
            },
            body: JSON.stringify({ flashcard_id: id, completed: newStatus }),
        });

        setFlashcards((prev) =>
            prev.map((card) =>
                card.id === id ? { ...card, completed: newStatus } : card
            )
        );
    };

    if (loading) {
        return (
            <div className="flex justify-center items-center min-h-screen">
                <div className="animate-spin h-12 w-12 border-b-4 border-blue-600 rounded-full"></div>
            </div>
        );
    }

    if (!flashcards.length) {
        return (
            <div className="text-center text-gray-700 py-10">
                <h2 className="text-2xl font-bold">No Practice Available Today</h2>
            </div>
        );
    }

    return (
        <div className="p-6">
            <h1 className="text-3xl font-bold mb-4 text-center bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent">
                🔥 Daily Practice
            </h1>
            <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
                {flashcards.map((card) => (
                    <motion.div
                        key={card.id}
                        className="bg-white rounded-xl shadow-lg overflow-hidden"
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.3 }}
                    >
                        <div className="p-4">
                            <h2 className="text-xl font-bold mb-2">{card.gloss}</h2>

                            {/* Tags Section */}
                            {card.tags && card.tags.length > 0 && (
                                <div className="flex flex-wrap gap-2 mb-3">
                                    {card.tags.map((tag, index) => (
                                        <span
                                            key={index}
                                            className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800"
                                        >
                                            <FaTag className="mr-1" size={10} />
                                            {tag}
                                        </span>
                                    ))}
                                </div>
                            )}

                            <ReactPlayer url={card.video_url} controls width="100%" height="200px" />
                            <button
                                onClick={() => handleComplete(card.id, card.completed)}
                                className={`mt-4 w-full py-2 rounded-lg font-semibold ${card.completed
                                    ? "bg-green-500 text-white"
                                    : "bg-blue-500 text-white hover:bg-blue-600"
                                    }`}
                            >
                                {card.completed ? (
                                    <span className="flex items-center justify-center gap-2">
                                        <FaCheck /> Completed
                                    </span>
                                ) : (
                                    <span className="flex items-center justify-center gap-2">
                                        <FaFire /> Mark as Completed
                                    </span>
                                )}
                            </button>
                        </div>
                    </motion.div>
                ))}
            </div>
        </div>
    );
}
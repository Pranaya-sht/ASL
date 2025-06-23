'use client';
import { useEffect, useState } from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import { getUserProgress } from "../../../components/utils/api.js";
import { FaBookOpen, FaListAlt, FaFire, FaTimesCircle, FaClock, FaSearch } from 'react-icons/fa';
import ConfettiBurst from "../../../components/ConfettiBurst";
import { Planet } from 'react-kawaii';

export default function Dashboard() {
    const [progress, setProgress] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    useEffect(() => {
        async function fetchProgress() {
            try {
                const data = await getUserProgress();
                setProgress(data);
            } catch (err) {
                console.error(err);
                setError("Failed to fetch progress.");
            } finally {
                setLoading(false);
            }
        }
        fetchProgress();
    }, []);

    return (
        <div className="min-h-screen bg-gradient-to-r from-purple-600 via-pink-500 to-red-500 p-6 text-white flex flex-col items-center justify-start">
            <h1 className="text-4xl font-extrabold mb-4 text-center">
                Welcome Back to Your <span className="bg-clip-text text-transparent bg-gradient-to-r from-yellow-300 to-pink-300 animate-pulse">ASL Adventure!</span>
            </h1>

            {loading && (
                <div className="flex items-center justify-center h-40">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-4 border-white"></div>
                </div>
            )}

            {error && (
                <div className="bg-red-600 text-white p-4 rounded-lg shadow-lg">
                    {error}
                </div>
            )}

            {!loading && progress && (
                <>
                    <ConfettiBurst trigger={progress.last_score >= 70} />
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.6, ease: "easeOut" }}
                        className="bg-white bg-opacity-20 backdrop-blur-lg border border-white border-opacity-30 rounded-xl p-6 w-full max-w-xl shadow-xl"
                    >
                        <div className="flex justify-center mb-4">
                            <Planet size={80} mood="happy" color="#FDA4AF" />
                        </div>
                        <div className="space-y-2 mb-6 text-black">
                            <p>🌟 Current Level: <span className="font-bold">{progress.current_level}</span></p>
                            <p>🏆 Last Score: <span className="font-bold">{progress.last_score}%</span></p>
                            <p>🎯 Total Correct Answers: <span className="font-bold">{progress.total_correct}</span></p>
                        </div>

                        {/* Primary Action Buttons */}
                        <div className="grid grid-cols-2 gap-4">
                            <Link href="/study/flashcard">
                                <motion.button
                                    whileHover={{ scale: 1.05 }}
                                    whileTap={{ scale: 0.95 }}
                                    className="flex items-center justify-center gap-2 bg-green-500 px-4 py-3 rounded-xl shadow-lg hover:bg-green-600"
                                >
                                    <FaBookOpen /> Learn
                                </motion.button>
                            </Link>
                            <Link href="/study/Quiz">
                                <motion.button
                                    whileHover={{ scale: 1.05 }}
                                    whileTap={{ scale: 0.95 }}
                                    className="flex items-center justify-center gap-2 bg-yellow-400 px-4 py-3 rounded-xl shadow-lg hover:bg-yellow-500"
                                >
                                    <FaListAlt /> Quiz
                                </motion.button>
                            </Link>
                            <Link href="/study/DailyPractice">
                                <motion.button
                                    whileHover={{ scale: 1.05 }}
                                    whileTap={{ scale: 0.95 }}
                                    className="flex items-center justify-center gap-2 bg-pink-500 px-4 py-3 rounded-xl shadow-lg hover:bg-pink-600"
                                >
                                    <FaFire /> Daily Practice
                                </motion.button>
                            </Link>
                            <Link href="/study/IncorrectAnswers">
                                <motion.button
                                    whileHover={{ scale: 1.05 }}
                                    whileTap={{ scale: 0.95 }}
                                    className="flex items-center justify-center gap-2 bg-red-500 px-4 py-3 rounded-xl shadow-lg hover:bg-red-600"
                                >
                                    <FaTimesCircle /> Incorrect Answers
                                </motion.button>
                            </Link>
                        </div>

                        {/* Extra Features */}
                        <div className="grid grid-cols-2 gap-4 mt-4">


                            <Link href="/study/Dictionary">
                                <motion.button
                                    whileHover={{ scale: 1.05 }}
                                    whileTap={{ scale: 0.95 }}
                                    className="flex items-center justify-center gap-2 bg-indigo-500 px-4 py-3 rounded-xl shadow-lg hover:bg-indigo-600"
                                >
                                    <FaSearch /> Dictionary
                                </motion.button>
                            </Link>
                            <Link href="/study/reminder">
                                <motion.button
                                    whileHover={{ scale: 1.05 }}
                                    whileTap={{ scale: 0.95 }}
                                    className="flex items-center justify-center gap-2 bg-purple-500 px-4 py-3 rounded-xl shadow-lg hover:bg-purple-600"
                                >
                                    <FaClock /> Reminder
                                </motion.button>
                            </Link>
                        </div>
                    </motion.div>
                </>
            )}
        </div>
    );
}

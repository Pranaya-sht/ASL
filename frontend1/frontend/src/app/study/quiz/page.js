"use client";

import { useEffect, useState } from "react";
import ReactPlayer from "react-player";
import { FaCheckCircle, FaRedo, FaArrowRight, FaClock, FaTrophy, FaExclamationTriangle } from "react-icons/fa";
import { motion, AnimatePresence } from "framer-motion";
import { Howl } from "howler";

export default function QuizPage() {
    const [questions, setQuestions] = useState([]);
    const [answers, setAnswers] = useState([]);
    const [submitted, setSubmitted] = useState(false);
    const [result, setResult] = useState(null);
    const [currentQuestion, setCurrentQuestion] = useState(0);
    const [loading, setLoading] = useState(true);
    const [timeSpent, setTimeSpent] = useState(0);
    const [level, setLevel] = useState(1); // Level from 1 to 10

    useEffect(() => {
        fetchQuiz();
        const timer = setInterval(() => setTimeSpent(prev => prev + 1), 1000);
        return () => clearInterval(timer);
    }, [level]);

    const fetchQuiz = () => {
        setLoading(true);
        const token = localStorage.getItem("access_token");
        fetch(`http://localhost:8000/learn/api/quiz/level/${level}`, {
            headers: { Authorization: `Bearer ${token}` }
        })
            .then(res => res.json())
            .then(data => {
                if (data.error) {
                    setQuestions([]);
                } else {
                    setQuestions(data);
                }
                setLoading(false);
                console.log(data);
            })
            .catch(err => {
                console.error("Failed to fetch quiz:", err);
                setLoading(false);
            });
        setAnswers([]);
        setSubmitted(false);
        setResult(null);
        setCurrentQuestion(0);
        setTimeSpent(0);

    };

    const handleAnswer = (qIndex, selected) => {
        const q = questions[qIndex];
        const updated = [...answers];
        updated[qIndex] = {
            question: q.correct_answer,
            selected,
            correct: selected === q.correct_answer
        };
        setAnswers(updated);
    };

    const handleSubmit = async () => {
        // console.log(JSON.stringify(payload))
        const token = localStorage.getItem("access_token");
        const res = await fetch("http://localhost:8000/learn/api/quiz/submit", {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                Authorization: `Bearer ${token}`
            },
            body: JSON.stringify({ level, answers })
        });
        const data = await res.json();
        setResult(data);
        setSubmitted(true);

        if (data.passed) {
            const sound = new Howl({ src: ["/sounds/success.mp3"] });
            sound.play();
        }
    };

    const handleNextLevel = () => {
        if (level < 10) {
            setLevel(level + 1);
        }
    };

    const formatTime = (seconds) => {
        const mins = Math.floor(seconds / 60);
        const secs = seconds % 60;
        return `${mins}:${secs.toString().padStart(2, '0')}`;
    };

    const getAnsweredCount = () => answers.filter(a => a).length;

    if (loading) {
        return (
            <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center">
                <div className="bg-white rounded-2xl shadow-xl p-8 text-center">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
                    <p className="text-gray-600 font-medium">Loading your quiz...</p>
                </div>
            </div>
        );
    }



    return (
        <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
            <div className="container mx-auto px-4 py-8">
                {!submitted ? (
                    <div className="max-w-4xl mx-auto">
                        {/* Header */}
                        <motion.div
                            className="bg-white rounded-2xl shadow-xl p-6 mb-8"
                            initial={{ opacity: 0, y: -20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ duration: 0.5 }}
                        >
                            <div className="flex items-center justify-between">
                                <div>
                                    <h1 className="text-3xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                                        Level {level} Quiz
                                    </h1>
                                    <p className="text-gray-600 mt-1">Answer all questions to proceed to the next level</p>
                                </div>
                                <div className="flex items-center gap-6 text-sm">
                                    <div className="flex items-center gap-2 bg-blue-50 px-3 py-2 rounded-lg">
                                        <FaClock className="text-blue-600" />
                                        <span className="font-medium">{formatTime(timeSpent)}</span>
                                    </div>
                                    <div className="flex items-center gap-2 bg-green-50 px-3 py-2 rounded-lg">
                                        <FaCheckCircle className="text-green-600" />
                                        <span className="font-medium">{getAnsweredCount()}/{questions.length}</span>
                                    </div>
                                </div>
                            </div>

                            {/* Progress Bar */}
                            <div className="mt-4">
                                <div className="flex justify-between text-sm text-gray-600 mb-2">
                                    <span>Progress</span>
                                    <span>{Math.round((getAnsweredCount() / questions.length) * 100)}%</span>
                                </div>
                                <div className="w-full bg-gray-200 rounded-full h-2">
                                    <motion.div
                                        className="bg-gradient-to-r from-blue-500 to-purple-500 h-2 rounded-full"
                                        initial={{ width: 0 }}
                                        animate={{ width: `${(getAnsweredCount() / questions.length) * 100}%` }}
                                        transition={{ duration: 0.3 }}
                                    />
                                </div>
                            </div>
                        </motion.div>

                        {/* Questions */}
                        <div className="space-y-6">
                            <AnimatePresence>
                                {questions.map((q, i) => (
                                    <motion.div
                                        key={i}
                                        className="bg-white rounded-2xl shadow-xl overflow-hidden"
                                        initial={{ opacity: 0, x: -20 }}
                                        animate={{ opacity: 1, x: 0 }}
                                        transition={{ duration: 0.5, delay: i * 0.1 }}
                                        whileHover={{ scale: 1.02 }}
                                    >
                                        <div className="bg-gradient-to-r from-blue-500 to-purple-600 px-6 py-4">
                                            <h3 className="text-white font-semibold text-lg">
                                                Question {i + 1} of {questions.length}
                                            </h3>
                                        </div>

                                        <div className="p-6">
                                            {/* Video Player */}
                                            <div className="mb-6">
                                                <div className="relative rounded-xl overflow-hidden shadow-lg">
                                                    <ReactPlayer
                                                        url={q.video_url}
                                                        controls
                                                        width="100%"
                                                        height="300px"
                                                        className="rounded-xl"
                                                    />
                                                </div>
                                            </div>

                                            {/* Options */}
                                            <div className="space-y-3">
                                                <p className="text-gray-700 font-medium mb-4">Choose your answer:</p>
                                                {q.options && q.options.map((opt) => (
                                                    <motion.button
                                                        key={opt}
                                                        onClick={() => handleAnswer(i, opt)}
                                                        className={`w-full p-4 rounded-xl border-2 text-left transition-all duration-200 ${answers[i]?.selected === opt
                                                            ? "border-blue-500 bg-blue-50 text-blue-700 shadow-md"
                                                            : "border-gray-200 bg-gray-50 hover:border-blue-300 hover:bg-blue-25"
                                                            }`}
                                                        whileHover={{ scale: 1.02 }}
                                                        whileTap={{ scale: 0.98 }}
                                                    >
                                                        <div className="flex items-center gap-3">
                                                            <div className={`w-6 h-6 rounded-full border-2 flex items-center justify-center ${answers[i]?.selected === opt
                                                                ? "border-blue-500 bg-blue-500"
                                                                : "border-gray-300"
                                                                }`}>
                                                                {answers[i]?.selected === opt && (
                                                                    <FaCheckCircle className="text-white text-sm" />
                                                                )}
                                                            </div>
                                                            <span className="font-medium">{opt}</span>
                                                        </div>
                                                    </motion.button>
                                                ))}
                                            </div>
                                        </div>
                                    </motion.div>
                                ))}
                            </AnimatePresence>
                        </div>

                        {/* Submit Button */}
                        <motion.div
                            className="mt-8 text-center"
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            transition={{ delay: 0.5 }}
                        >
                            <button
                                onClick={handleSubmit}
                                disabled={getAnsweredCount() < questions.length}
                                className={`px-8 py-4 rounded-xl font-semibold text-lg shadow-lg transition-all duration-200 ${getAnsweredCount() === questions.length
                                    ? "bg-gradient-to-r from-green-500 to-emerald-600 text-white hover:from-green-600 hover:to-emerald-700 hover:scale-105"
                                    : "bg-gray-300 text-gray-500 cursor-not-allowed"
                                    }`}
                            >
                                Submit Quiz
                            </button>
                        </motion.div>
                    </div>
                ) : (
                    /* Results */
                    <motion.div
                        className="max-w-2xl mx-auto"
                        initial={{ opacity: 0, scale: 0.9 }}
                        animate={{ opacity: 1, scale: 1 }}
                        transition={{ duration: 0.5 }}
                    >
                        <div className="bg-white rounded-2xl shadow-2xl overflow-hidden">
                            <div className={`px-8 py-6 ${result?.passed ? 'bg-gradient-to-r from-green-500 to-emerald-600' : 'bg-gradient-to-r from-red-500 to-pink-600'}`}>
                                <div className="text-center text-white">
                                    {result?.passed ? (
                                        <FaTrophy className="text-6xl mx-auto mb-4" />
                                    ) : (
                                        <FaExclamationTriangle className="text-6xl mx-auto mb-4" />
                                    )}
                                    <h2 className="text-3xl font-bold mb-2">
                                        {result?.passed ? "Congratulations!" : "Keep Trying!"}
                                    </h2>
                                    <p className="text-xl opacity-90">
                                        Your Score: {result?.score}%
                                    </p>
                                </div>
                            </div>

                            <div className="p-8">
                                <div className="grid grid-cols-2 gap-6 mb-8">
                                    <div className="text-center p-4 bg-blue-50 rounded-xl">
                                        <div className="text-2xl font-bold text-blue-600">{result?.score}%</div>
                                        <div className="text-gray-600">Score</div>
                                    </div>
                                    <div className="text-center p-4 bg-purple-50 rounded-xl">
                                        <div className="text-2xl font-bold text-purple-600">{formatTime(timeSpent)}</div>
                                        <div className="text-gray-600">Time Taken</div>
                                    </div>
                                </div>

                                <div className="text-center mb-8">
                                    <p className={`text-lg font-medium ${result?.passed ? 'text-green-600' : 'text-red-600'}`}>
                                        {result?.passed ? "🎉 You passed! Ready for the next level." : "📚 Review the material and try again."}
                                    </p>
                                </div>

                                <div className="flex justify-center gap-4">
                                    <motion.button
                                        onClick={fetchQuiz}
                                        className="flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-yellow-500 to-orange-500 text-white rounded-xl font-semibold shadow-lg hover:from-yellow-600 hover:to-orange-600 transition-all duration-200"
                                        whileHover={{ scale: 1.05 }}
                                        whileTap={{ scale: 0.95 }}
                                    >
                                        <FaRedo /> Retry Quiz
                                    </motion.button>

                                    {result?.passed && level < 10 && (
                                        <motion.button
                                            onClick={handleNextLevel}
                                            className="flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-blue-500 to-purple-600 text-white rounded-xl font-semibold shadow-lg hover:from-blue-600 hover:to-purple-700 transition-all duration-200"
                                            whileHover={{ scale: 1.05 }}
                                            whileTap={{ scale: 0.95 }}
                                        >
                                            <FaArrowRight /> Next Level
                                        </motion.button>
                                    )}
                                </div>
                            </div>
                        </div>
                    </motion.div>
                )}
            </div>
        </div>
    );
}

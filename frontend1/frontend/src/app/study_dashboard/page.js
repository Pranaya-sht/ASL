// This will be a Next.js-compatible React component file for Quiz, Dashboard, and Flashcard Review UI
// Install dependencies: `npm install recharts react-icons react-player framer-motion howler`

"use client";

import { useEffect, useState } from "react";
import ReactPlayer from "react-player";
import { FaCheckCircle, FaRedo, FaArrowRight } from "react-icons/fa";
import { motion } from "framer-motion";
import { Howl } from "howler";

export default function QuizPage() {
    const [questions, setQuestions] = useState([]);
    const [answers, setAnswers] = useState([]);
    const [submitted, setSubmitted] = useState(false);
    const [result, setResult] = useState(null);

    useEffect(() => {
        fetchQuiz();
    }, []);

    const fetchQuiz = () => {
        const token = localStorage.getItem("access_token");
        fetch("http://localhost:8000/learn/api/quiz/level/1", {
            headers: { Authorization: `Bearer ${token}` }
        })
            .then(res => res.json())
            .then(setQuestions);
        setAnswers([]);
        setSubmitted(false);
        setResult(null);
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
        const token = localStorage.getItem("access_token");
        const res = await fetch("http://localhost:8000/learn/api/quiz/submit", {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                Authorization: `Bearer ${token}`
            },
            body: JSON.stringify({ level: 1, answers })
        });
        const data = await res.json();
        setResult(data);
        setSubmitted(true);

        if (data.passed) {
            const sound = new Howl({ src: ["/sounds/success.mp3"] });
            sound.play();
        }
    };

    return (
        <div className="p-6 space-y-6 max-w-3xl mx-auto">
            <h1 className="text-2xl font-bold text-blue-600">Level 1 Quiz</h1>
            {!submitted ? (
                <>
                    {questions.map((q, i) => (
                        <div key={i} className="bg-white shadow rounded-lg p-4 mb-4">
                            <ReactPlayer url={q.video_url} controls width="100%" height="200px" className="rounded-md mb-2" />
                            <div className="grid grid-cols-2 gap-3">
                                {q.options.map(opt => (
                                    <button
                                        key={opt}
                                        onClick={() => handleAnswer(i, opt)}
                                        className={`p-2 rounded-lg border ${answers[i]?.selected === opt ? "bg-blue-600 text-white" : "bg-gray-100 hover:bg-blue-100"
                                            }`}
                                    >
                                        {opt}
                                    </button>
                                ))}
                            </div>
                            {submitted && (
                                <div className="text-sm text-gray-500 mt-2">
                                    ✅ Correct Answer: <strong>{q.correct_answer}</strong>
                                </div>
                            )}
                        </div>
                    ))}
                    <button
                        onClick={handleSubmit}
                        className="bg-green-600 text-white px-4 py-2 rounded-lg shadow mt-4"
                    >
                        Submit Quiz
                    </button>
                </>
            ) : (
                <motion.div
                    className="bg-white p-6 rounded-xl shadow text-center"
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.5 }}
                >
                    <FaCheckCircle className="text-green-500 text-5xl mx-auto mb-4" />
                    <h2 className="text-2xl font-bold">Score: {result?.score}%</h2>
                    <p className="text-gray-600">{result?.passed ? "✅ You passed!" : "❌ Try again to unlock the level."}</p>

                    <div className="flex justify-center gap-4 mt-6">
                        <button
                            onClick={fetchQuiz}
                            className="flex items-center gap-2 px-4 py-2 bg-yellow-500 text-white rounded shadow"
                        >
                            <FaRedo /> Retry
                        </button>
                        {result?.passed && (
                            <button
                                className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded shadow"
                            >
                                <FaArrowRight /> Next Level
                            </button>
                        )}
                    </div>
                </motion.div>
            )}
        </div>
    );
}

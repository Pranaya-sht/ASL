"use client";

import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import ReactPlayer from "react-player";
import {
    FaPlay,
    FaCheck,
    FaFilter,
    FaChevronLeft,
    FaChevronRight,
    FaGraduationCap,
    FaEye,
    FaEyeSlash,
    FaVideo,
    FaTags,
    FaTimes,
    FaLayerGroup,
    FaThumbsUp,
    FaThumbsDown
} from "react-icons/fa";

export default function FlashcardReview() {
    const [flashcards, setFlashcards] = useState([]);
    const [flipped, setFlipped] = useState({});
    const [learned, setLearned] = useState({});
    const [showOnlyUnlearned, setShowOnlyUnlearned] = useState(false);
    const [page, setPage] = useState(1);
    const [loading, setLoading] = useState(true);
    const [totalCards, setTotalCards] = useState(0);
    const [level, setLevel] = useState(1);
    const [selectedTag, setSelectedTag] = useState("");
    const [availableTags, setAvailableTags] = useState([]);
    const [liked, setLiked] = useState({});
    const [disliked, setDisliked] = useState({});

    const limit = 9;

    const fetchFlashcards = () => {
        setLoading(true);
        const token = localStorage.getItem("access_token");
        fetch(
            `http://localhost:8000/learn/api/flashcards/level/${level}?page=${page}&limit=${limit}`,
            {
                headers: { Authorization: `Bearer ${token}` },
            }
        )
            .then((res) => res.json())
            .then((data) => {
                const validCards = Array.isArray(data)
                    ? data.filter((card) => card.video_url && card.video_url.trim() !== "")
                    : data.flashcards?.filter((card) => card.video_url && card.video_url.trim() !== "") || [];

                setFlashcards(validCards);
                setTotalCards(data.total || validCards.length);

                // Initialize liked/disliked states
                const initialLiked = {};
                const initialDisliked = {};
                validCards.forEach(card => {
                    initialLiked[card.id] = card.liked || false;
                    initialDisliked[card.id] = card.disliked || false;
                });
                setLiked(initialLiked);
                setDisliked(initialDisliked);

                const predefinedTags = [
                    "nature",
                    "beginner",
                    "question",
                    "emotion",
                    "intermediate",
                    "expression",
                    "advanced",
                    "technology",
                    "noun",
                    "adjective",
                    "verb",
                    "health",
                    "food",
                    "education",
                    "daily life"
                ];
                setAvailableTags(predefinedTags);

                setLoading(false);
            })
            .catch((err) => {
                console.error("Failed to fetch flashcards:", err);
                setLoading(false);
            });
    };

    useEffect(() => {
        fetchFlashcards();
    }, [page, level]);

    const toggleFlip = (id) => {
        setFlipped((prev) => ({ ...prev, [id]: !prev[id] }));
    };

    const toggleLearned = async (id) => {
        const token = localStorage.getItem("access_token");
        try {
            const res = await fetch(`http://localhost:8000/learn/api/flashcards/${id}/learned`, {
                method: "POST",
                headers: { Authorization: `Bearer ${token}` },
            });
            const data = await res.json();
            setLearned((prev) => ({ ...prev, [id]: data.status === "learned" }));
        } catch (err) {
            console.error("Failed to update learned status:", err);
        }
    };

    const resetLearned = async () => {
        const token = localStorage.getItem("access_token");
        try {
            const res = await fetch(`http://localhost:8000/learn/api/flashcards/reset`, {
                method: "POST",
                headers: { Authorization: `Bearer ${token}` },
            });
            if (res.ok) {
                setLearned({});
                fetchFlashcards();
            } else {
                console.error("Failed to reset learned status");
            }
        } catch (err) {
            console.error("Failed to reset learned status:", err);
        }
    };

    const handleFeedback = async (cardId, isLike) => {
        const token = localStorage.getItem("access_token");
        try {
            // If clicking the same button again, remove the feedback
            const shouldRemove = (isLike && liked[cardId]) || (!isLike && disliked[cardId]);

            const res = await fetch(`http://localhost:8000/learn/api/flashcards/${cardId}/feedback`, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    Authorization: `Bearer ${token}`,
                },
                body: JSON.stringify({
                    liked: isLike,
                    remove: shouldRemove
                }),
            });

            if (res.ok) {
                if (shouldRemove) {
                    setLiked(prev => ({ ...prev, [cardId]: false }));
                    setDisliked(prev => ({ ...prev, [cardId]: false }));
                } else {
                    setLiked(prev => ({ ...prev, [cardId]: isLike }));
                    setDisliked(prev => ({ ...prev, [cardId]: !isLike }));
                }
            }
        } catch (error) {
            console.error("Error submitting feedback:", error);
        }
    };

    const filteredCards = flashcards.filter((card) =>
        card.video_url &&
        card.video_url.trim() !== "" &&
        (!showOnlyUnlearned || (!card.learned && !learned[card.id])) &&
        (selectedTag === "" || (card.tags && card.tags.includes(selectedTag)))
    );

    const learnedCount = flashcards.filter((card) => card.learned || learned[card.id]).length;
    const totalValidCards = flashcards.length;

    if (loading) {
        return (
            <div className="min-h-screen bg-gradient-to-br from-purple-50 to-pink-100 flex items-center justify-center">
                <div className="bg-white rounded-2xl shadow-xl p-8 text-center">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600 mx-auto mb-4"></div>
                    <p className="text-gray-600 font-medium">Loading flashcards...</p>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gradient-to-br from-purple-50 to-pink-100">
            <div className="container mx-auto px-4 py-8">
                <div className="max-w-7xl mx-auto">
                    <motion.div
                        className="bg-white rounded-2xl shadow-xl p-6 mb-8"
                        initial={{ opacity: 0, y: -20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.5 }}
                    >
                        <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-4">
                            <div>
                                <h1 className="text-3xl font-bold bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent mb-2">
                                    Flashcard Review
                                </h1>
                                <p className="text-gray-600">Study and master your vocabulary with interactive flashcards</p>
                            </div>

                            <div className="flex items-center gap-4 flex-wrap">
                                <div className="flex items-center gap-2 bg-green-50 px-3 py-2 rounded-lg">
                                    <FaGraduationCap className="text-green-600" />
                                    <span className="font-medium text-green-700">{learnedCount} Learned</span>
                                </div>
                                <div className="flex items-center gap-2 bg-purple-50 px-3 py-2 rounded-lg">
                                    <FaVideo className="text-purple-600" />
                                    <span className="font-medium text-purple-700">{totalValidCards} Total</span>
                                </div>

                                <motion.button
                                    onClick={() => setShowOnlyUnlearned((prev) => !prev)}
                                    className={`flex items-center gap-2 px-4 py-2 rounded-lg font-medium transition-all duration-200 ${showOnlyUnlearned
                                        ? "bg-purple-600 text-white shadow-lg"
                                        : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                                        }`}
                                    whileHover={{ scale: 1.05 }}
                                    whileTap={{ scale: 0.95 }}
                                >
                                    <FaFilter />
                                    {showOnlyUnlearned ? (
                                        <>
                                            <FaEye /> Show All
                                        </>
                                    ) : (
                                        <>
                                            <FaEyeSlash /> Only Unlearned
                                        </>
                                    )}
                                </motion.button>

                                <select
                                    value={selectedTag}
                                    onChange={(e) => setSelectedTag(e.target.value)}
                                    className="px-4 py-2 rounded-lg bg-white border text-sm text-gray-700 shadow"
                                >
                                    <option value="">All Tags</option>
                                    {availableTags.map((tag, idx) => (
                                        <option key={idx} value={tag}>
                                            {tag}
                                        </option>
                                    ))}
                                </select>

                                <motion.button
                                    onClick={resetLearned}
                                    className="flex items-center gap-2 px-4 py-2 rounded-lg font-medium transition-all duration-200 bg-red-500 text-white shadow-lg hover:bg-red-600"
                                    whileHover={{ scale: 1.05 }}
                                    whileTap={{ scale: 0.95 }}
                                >
                                    <FaGraduationCap />
                                    Reset Learned
                                </motion.button>
                            </div>
                        </div>

                        {/* Level Selector */}
                        <div className="mt-4 flex flex-wrap gap-2">
                            {[...Array(10)].map((_, idx) => (
                                <motion.button
                                    key={idx + 1}
                                    onClick={() => {
                                        setLevel(idx + 1);
                                        setPage(1);
                                    }}
                                    className={`px-4 py-2 rounded-lg font-semibold text-sm transition-all duration-200 ${level === idx + 1
                                        ? "bg-purple-600 text-white shadow-lg"
                                        : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                                        }`}
                                    whileHover={{ scale: 1.05 }}
                                    whileTap={{ scale: 0.95 }}
                                >
                                    Level {idx + 1}
                                </motion.button>
                            ))}
                        </div>

                        {/* Progress Bar */}
                        <div className="mt-6">
                            <div className="flex justify-between text-sm text-gray-600 mb-2">
                                <span>Learning Progress</span>
                                <span>{totalValidCards > 0 ? Math.round((learnedCount / totalValidCards) * 100) : 0}%</span>
                            </div>
                            <div className="w-full bg-gray-200 rounded-full h-3">
                                <motion.div
                                    className="bg-gradient-to-r from-green-500 to-emerald-500 h-3 rounded-full"
                                    initial={{ width: 0 }}
                                    animate={{ width: `${totalValidCards > 0 ? (learnedCount / totalValidCards) * 100 : 0}%` }}
                                    transition={{ duration: 0.5 }}
                                />
                            </div>
                        </div>
                    </motion.div>

                    {/* Flashcards Grid */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8 p-4">
                        <AnimatePresence>
                            {filteredCards.map((card, index) => (
                                <motion.div
                                    key={card.id}
                                    className="relative w-full h-[28rem] cursor-pointer perspective-1000 group"
                                    initial={{ opacity: 0, y: 20 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    exit={{ opacity: 0, y: -20 }}
                                    transition={{ duration: 0.4, delay: index * 0.1 }}
                                    whileHover={{ scale: 1.02 }}
                                >
                                    {/* 3D Card Container */}
                                    <motion.div
                                        className="absolute w-full h-full rounded-2xl shadow-xl transition-transform duration-700 [transform-style:preserve-3d]"
                                        animate={{ rotateY: flipped[card.id] ? 180 : 0 }}
                                    >
                                        {/* FRONT SIDE */}
                                        <div
                                            className="absolute w-full h-full bg-gradient-to-br from-indigo-600 to-purple-600 rounded-2xl flex flex-col items-center justify-between p-6 [backface-visibility:hidden] shadow-2xl overflow-hidden"
                                            onClick={() => toggleFlip(card.id)}
                                        >
                                            {/* Decoration */}
                                            <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-bl-full"></div>
                                            <div className="absolute bottom-0 left-0 w-32 h-32 bg-white/10 rounded-tr-full"></div>

                                            {/* Main Content */}
                                            <div className="z-10 w-full text-center">
                                                <div className="mb-4 flex justify-center items-center gap-3">
                                                    <div className="p-3 bg-white/20 rounded-full">
                                                        <FaPlay className="text-white text-xl" />
                                                    </div>
                                                    {/* Feedback Buttons */}
                                                    <div className="flex gap-3 mt-1">
                                                        {/* Like */}
                                                        <motion.button
                                                            onClick={(e) => {
                                                                e.stopPropagation();
                                                                handleFeedback(card.id, true);
                                                            }}
                                                            className="p-2 rounded-full"
                                                            whileHover={{ scale: 1.1 }}
                                                            whileTap={{ scale: 0.9 }}
                                                        >
                                                            <motion.div
                                                                className="flex items-center gap-1"
                                                                animate={{
                                                                    color: liked[card.id] ? "#3B82F6" : "#6B7280"
                                                                }}
                                                            >
                                                                {liked[card.id] ? (
                                                                    <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }}>
                                                                        <FaCheck className="w-6 h-6" />
                                                                    </motion.div>
                                                                ) : (
                                                                    <FaThumbsUp className="w-6 h-6" />
                                                                )}
                                                            </motion.div>
                                                        </motion.button>

                                                        {/* Dislike */}
                                                        <motion.button
                                                            onClick={(e) => {
                                                                e.stopPropagation();
                                                                handleFeedback(card.id, false);
                                                            }}
                                                            className="p-2 rounded-full"
                                                            whileHover={{ scale: 1.1 }}
                                                            whileTap={{ scale: 0.9 }}
                                                        >
                                                            <motion.div
                                                                className="flex items-center gap-1"
                                                                animate={{
                                                                    color: disliked[card.id] ? "#EF4444" : "#6B7280"
                                                                }}
                                                            >
                                                                {disliked[card.id] ? (
                                                                    <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }}>
                                                                        <FaTimes className="w-6 h-6" />
                                                                    </motion.div>
                                                                ) : (
                                                                    <FaThumbsDown className="w-6 h-6" />
                                                                )}
                                                            </motion.div>
                                                        </motion.button>
                                                    </div>
                                                </div>

                                                {/* Gloss */}
                                                <h3 className="text-white text-2xl font-bold mb-2 break-words px-4">{card.gloss}</h3>
                                                <div className="flex justify-center items-center gap-2 text-sm text-white/90">
                                                    <FaLayerGroup /> Level {card.complexity || level}
                                                </div>
                                            </div>

                                            {/* Tags */}
                                            <div className="w-full z-10 mt-auto">
                                                <p className="text-white/80 text-lg mt-3 text-center">Click to flip card</p>
                                                <div className="flex flex-wrap justify-center gap-2 mt-2">
                                                    {card.tags?.map((tag, i) => (
                                                        <motion.span
                                                            key={i}
                                                            className="bg-white/20 text-white text-xs px-3 py-1 rounded-full backdrop-blur-sm"
                                                            whileHover={{ scale: 1.05 }}
                                                        >
                                                            #{tag}
                                                        </motion.span>
                                                    ))}
                                                </div>
                                            </div>
                                        </div>

                                        {/* BACK SIDE */}
                                        <div className="absolute w-full h-full bg-gradient-to-br from-gray-50 to-gray-100 rounded-2xl p-6 flex flex-col [transform:rotateY(180deg)] [backface-visibility:hidden] shadow-2xl overflow-hidden">
                                            <div className="flex-1 flex items-center justify-center bg-gray-200 rounded-xl overflow-hidden relative">
                                                <ReactPlayer
                                                    url={card.video_url}
                                                    controls
                                                    width="100%"
                                                    height="100%"
                                                    className="rounded-xl"
                                                    playing={flipped[card.id]}
                                                />
                                            </div>
                                            <div className="mt-4 text-center">
                                                <p className="text-gray-800 font-semibold text-lg">{card.gloss}</p>
                                            </div>
                                        </div>
                                    </motion.div>

                                    {/* Learned Button */}
                                    <motion.button
                                        onClick={(e) => {
                                            e.stopPropagation();
                                            toggleLearned(card.id);
                                        }}
                                        className={`absolute -bottom-5 left-1/2 transform -translate-x-1/2 px-5 py-2.5 text-sm font-medium rounded-full shadow-lg transition-all duration-200 z-20 ${card.learned || learned[card.id]
                                            ? "bg-green-500 text-white shadow-md shadow-green-200"
                                            : "bg-white text-gray-700 hover:bg-gray-50 shadow-md"
                                            }`}
                                        whileHover={{ scale: 1.05, y: -2 }}
                                        whileTap={{ scale: 0.95 }}
                                    >
                                        <div className="flex items-center gap-2">
                                            {card.learned || learned[card.id] ? (
                                                <>
                                                    <FaCheck className="text-sm" />
                                                    Learned
                                                </>
                                            ) : (
                                                <>
                                                    <FaGraduationCap className="text-sm" />
                                                    <span>Mark as Learned</span>
                                                </>
                                            )}
                                        </div>
                                    </motion.button>
                                </motion.div>
                            ))}
                        </AnimatePresence>
                    </div>

                    {/* Pagination */}
                    {filteredCards.length > 0 && (
                        <motion.div
                            className="flex justify-center items-center gap-4 mt-12"
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            transition={{ delay: 0.5 }}
                        >
                            <motion.button
                                disabled={page === 1}
                                onClick={() => setPage((prev) => Math.max(1, prev - 1))}
                                className={`flex items-center gap-2 px-6 py-3 rounded-xl font-medium transition-all duration-200 ${page === 1
                                    ? "bg-gray-200 text-gray-400 cursor-not-allowed"
                                    : "bg-white text-gray-700 hover:bg-gray-50 shadow-lg hover:shadow-xl"
                                    }`}
                            >
                                <FaChevronLeft />
                                Previous
                            </motion.button>

                            <div className="flex items-center gap-2 px-4 py-2 bg-white rounded-xl shadow-lg">
                                <span className="text-gray-600 font-medium">Page {page}</span>
                            </div>

                            <motion.button
                                onClick={() => setPage((prev) => prev + 1)}
                                disabled={filteredCards.length < limit}
                                className={`flex items-center gap-2 px-6 py-3 rounded-xl font-medium transition-all duration-200 ${filteredCards.length < limit
                                    ? "bg-gray-200 text-gray-400 cursor-not-allowed"
                                    : "bg-gradient-to-r from-purple-500 to-pink-500 text-white shadow-lg hover:from-purple-600 hover:to-pink-600 hover:shadow-xl"
                                    }`}
                            >
                                Next
                                <FaChevronRight />
                            </motion.button>
                        </motion.div>
                    )}
                </div>
            </div>
        </div>
    );
}
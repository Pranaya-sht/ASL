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
    FaLayerGroup,
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
                                    className="relative w-full h-[28rem] cursor-pointer [perspective:1000px] group"
                                    initial={{ opacity: 0, y: 20 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    exit={{ opacity: 0, y: -20 }}
                                    transition={{ duration: 0.4, delay: index * 0.1 }}
                                    whileHover={{ scale: 1.02 }}
                                >
                                    {/* Card container with 3D flip effect */}
                                    <motion.div
                                        className="absolute w-full h-full rounded-2xl shadow-xl [transform-style:preserve-3d] transition-transform duration-700"
                                        animate={{ rotateY: flipped[card.id] ? 180 : 0 }}
                                    >
                                        {/* Front Side */}
                                        <div className="absolute w-full h-full bg-gradient-to-br from-indigo-600 to-purple-600 rounded-2xl flex flex-col items-center justify-between p-6 [backface-visibility:hidden] shadow-2xl overflow-hidden"
                                            onClick={() => toggleFlip(card.id)}
                                        >

                                            {/* Decorative elements */}
                                            <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-bl-full"></div>
                                            <div className="absolute bottom-0 left-0 w-32 h-32 bg-white/10 rounded-tr-full"></div>

                                            {/* Main content */}
                                            <div className="text-center z-10 w-full">
                                                <div className="mb-4 flex justify-center">
                                                    <div className="p-3 bg-white/20 rounded-full">
                                                        <FaPlay className="text-white text-xl" />
                                                    </div>
                                                    {/* Feedback buttons */}
                                                    <div className="mt-4 flex justify-center gap-3">
                                                        <motion.button
                                                            onClick={(e) => {
                                                                e.stopPropagation();
                                                                handleFeedback(card.id, true);
                                                            }}
                                                            className="relative p-2 rounded-full"
                                                            whileHover={{ scale: 1.1 }}
                                                            whileTap={{ scale: 0.9 }}
                                                        >
                                                            <motion.div
                                                                className="flex items-center gap-1"
                                                                animate={{
                                                                    color: liked[card.id] ? "#3B82F6" : "#6B7280"
                                                                }}
                                                                transition={{ duration: 0.2 }}
                                                            >
                                                                {liked[card.id] ? (
                                                                    <motion.div
                                                                        initial={{ scale: 0 }}
                                                                        animate={{ scale: 1 }}
                                                                        transition={{
                                                                            type: "spring",
                                                                            stiffness: 500,
                                                                            damping: 15
                                                                        }}
                                                                    >
                                                                        <svg
                                                                            xmlns="http://www.w3.org/2000/svg"
                                                                            viewBox="0 0 24 24"
                                                                            fill="currentColor"
                                                                            className="w-6 h-6"
                                                                        >
                                                                            <path d="M7.493 18.75c-.425 0-.82-.236-.975-.632A7.48 7.48 0 016 15.375c0-1.75.599-3.358 1.602-4.634.151-.192.373-.309.6-.397.473-.183.89-.514 1.212-.924a9.042 9.042 0 012.861-2.4c.723-.384 1.35-.956 1.653-1.715a4.498 4.498 0 00.322-1.672V3a.75.75 0 01.75-.75 2.25 2.25 0 012.25 2.25c0 1.152-.26 2.243-.723 3.218-.266.558.107 1.282.725 1.282h3.126c1.026 0 1.945.694 2.054 1.715.045.422.068.85.068 1.285a11.95 11.95 0 01-2.649 7.521c-.388.482-.987.729-1.605.729H14.23c-.483 0-.964-.078-1.423-.23l-3.114-1.04a4.501 4.501 0 00-1.423-.23h-.777zM2.331 10.977a11.969 11.969 0 00-.831 4.398 12 12 0 00.52 3.507c.26.85 1.084 1.368 1.973 1.368H4.9c.445 0 .72-.498.523-.898a8.963 8.963 0 01-.924-3.977c0-1.708.476-3.305 1.302-4.666.245-.403-.028-.959-.5-.959H4.25c-.832 0-1.612.453-1.918 1.227z" />
                                                                        </svg>
                                                                    </motion.div>
                                                                ) : (
                                                                    <motion.div
                                                                        whileHover={{ scale: 1.1 }}
                                                                        whileTap={{ scale: 0.9 }}
                                                                    >
                                                                        <svg
                                                                            xmlns="http://www.w3.org/2000/svg"
                                                                            fill="none"
                                                                            viewBox="0 0 24 24"
                                                                            stroke="currentColor"
                                                                            className="w-6 h-6"
                                                                        >
                                                                            <path strokeLinecap="round" strokeLinejoin="round" d="M6.633 10.25c.806 0 1.533-.446 2.031-1.08a9.041 9.041 0 0 1 2.861-2.4c.723-.384 1.35-.956 1.653-1.715a4.498 4.498 0 0 0 .322-1.672V2.75a.75.75 0 0 1 .75-.75 2.25 2.25 0 0 1 2.25 2.25c0 1.152-.26 2.243-.723 3.218-.266.558.107 1.282.725 1.282m0 0h3.126c1.026 0 1.945.694 2.054 1.715.045.422.068.85.068 1.285a11.95 11.95 0 0 1-2.649 7.521c-.388.482-.987.729-1.605.729H13.48c-.483 0-.964-.078-1.423-.23l-3.114-1.04a4.501 4.501 0 0 0-1.423-.23H5.904m10.598-9.75H14.25M5.904 18.5c.083.205.173.405.27.602.197.4-.078.898-.523.898h-.908c-.889 0-1.713-.518-1.972-1.368a12 12 0 0 1-.521-3.507c0-1.553.295-3.036.831-4.398C3.387 9.953 4.167 9.5 5 9.5h1.053c.472 0 .745.556.5.96a8.958 8.958 0 0 0-1.302 4.665c0 1.194.232 2.333.654 3.375Z" />
                                                                        </svg>
                                                                    </motion.div>
                                                                )}
                                                            </motion.div>
                                                        </motion.button>

                                                        <motion.button
                                                            onClick={(e) => {
                                                                e.stopPropagation();
                                                                handleFeedback(card.id, false);
                                                            }}
                                                            className="relative p-2 rounded-full"
                                                            whileHover={{ scale: 1.1 }}
                                                            whileTap={{ scale: 0.9 }}
                                                        >
                                                            <motion.div
                                                                className="flex items-center gap-1"
                                                                animate={{
                                                                    color: disliked[card.id] ? "#EF4444" : "#6B7280"
                                                                }}
                                                                transition={{ duration: 0.2 }}
                                                            >
                                                                {disliked[card.id] ? (
                                                                    <motion.div
                                                                        initial={{ scale: 0 }}
                                                                        animate={{ scale: 1 }}
                                                                        transition={{
                                                                            type: "spring",
                                                                            stiffness: 500,
                                                                            damping: 15
                                                                        }}
                                                                    >
                                                                        <svg
                                                                            xmlns="http://www.w3.org/2000/svg"
                                                                            viewBox="0 0 24 24"
                                                                            fill="currentColor"
                                                                            className="w-6 h-6"
                                                                        >
                                                                            <path d="M15.73 5.25h1.035A7.465 7.465 0 0118 9.375a7.465 7.465 0 01-1.235 4.125h-.148c-.806 0-1.534.446-2.031 1.08a9.04 9.04 0 01-2.861 2.4c-.723.384-1.35.956-1.653 1.715a4.498 4.498 0 00-.322 1.672V21a.75.75 0 01-.75.75 2.25 2.25 0 01-2.25-2.25c0-1.152.26-2.243.723-3.218C7.74 15.724 7.366 15 6.748 15H3.622c-1.026 0-1.945-.694-2.054-1.715A12.134 12.134 0 011.5 12c0-2.848.992-5.464 2.649-7.521.388-.482.987-.729 1.605-.729H9.77a4.5 4.5 0 011.423.23l3.114 1.04a4.5 4.5 0 001.423.23zM21.669 13.773c.536-1.362.831-2.845.831-4.398 0-1.22-.182-2.398-.52-3.507-.26-.85-1.084-1.368-1.973-1.368H19.1c-.445 0-.72.498-.523.898.591 1.2.924 2.55.924 3.977a8.959 8.959 0 01-1.302 4.666c-.245.403.028.959.5.959h1.053c.832 0 1.612-.453 1.918-1.227z" />
                                                                        </svg>
                                                                    </motion.div>
                                                                ) : (
                                                                    <motion.div
                                                                        whileHover={{ scale: 1.1 }}
                                                                        whileTap={{ scale: 0.9 }}
                                                                    >
                                                                        <svg
                                                                            xmlns="http://www.w3.org/2000/svg"
                                                                            fill="none"
                                                                            viewBox="0 0 24 24"
                                                                            stroke="currentColor"
                                                                            className="w-6 h-6"
                                                                        >
                                                                            <path strokeLinecap="round" strokeLinejoin="round" d="M7.498 15.25H4.372c-1.026 0-1.945-.694-2.054-1.715a12.137 12.137 0 0 1-.068-1.285c0-2.848.992-5.464 2.649-7.521C5.287 4.247 5.886 4 6.504 4h4.016a4.5 4.5 0 0 1 1.423.23l3.114 1.04a4.5 4.5 0 0 0 1.423.23h1.294M7.498 15.25c.618 0 .991.724.725 1.282A7.471 7.471 0 0 0 7.5 19.75 2.25 2.25 0 0 0 9.75 22a.75.75 0 0 0 .75-.75v-.633c0-.573.11-1.14.322-1.672.304-.76.93-1.33 1.653-1.715a9.04 9.04 0 0 0 2.86-2.4c.498-.634 1.226-1.08 2.032-1.08h.384m-10.253 1.5H9.7m8.075-9.75c.01.05.027.1.05.148.593 1.2.925 2.55.925 3.977 0 1.487-.36 2.89-.999 4.125m.023-8.25c-.076-.365.183-.75.575-.75h.908c.889 0 1.713.518 1.972 1.368.339 1.11.521 2.287.521 3.507 0 1.553-.295 3.036-.831 4.398-.306.774-1.086 1.227-1.918 1.227h-1.053c-.472 0-.745-.556-.5-.96a8.95 8.95 0 0 0 .303-.54" />
                                                                        </svg>
                                                                    </motion.div>
                                                                )}
                                                            </motion.div>
                                                        </motion.button>
                                                    </div>



                                                </div>
                                                <h3 className="text-white text-2xl font-bold mb-2 break-words px-4">
                                                    {card.gloss}
                                                </h3>
                                                <div className="flex justify-center items-center gap-2 text-sm text-white/90">
                                                    <FaLayerGroup /> Level {card.complexity || level}
                                                </div>
                                            </div>

                                            {/* Tags at bottom */}
                                            <div className="mt-auto w-full z-10">
                                                <p className="text-white/80 text-3xl mt-3 text-center">Click to flip card</p>
                                                <div className="flex flex-wrap justify-center gap-2">
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

                                        {/* Back Side */}
                                        <div className="absolute w-full h-full bg-gradient-to-br from-gray-50 to-gray-100 rounded-2xl p-6 flex flex-col [transform:rotateY(180deg)] [backface-visibility:hidden] shadow-2xl overflow-hidden">
                                            {/* Video player */}
                                            <div className="flex-1 flex items-center justify-center bg-gray-200 rounded-xl overflow-hidden relative">
                                                <ReactPlayer
                                                    url={card.video_url}
                                                    controls
                                                    width="100%"
                                                    height="100%"
                                                    className="rounded-xl"
                                                    light={false}
                                                    playing={flipped[card.id]}
                                                />
                                            </div>

                                            {/* Gloss text */}
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
                                        className={`absolute -bottom-4 left-1/2 transform -translate-x-1/2 px-5 py-2.5 text-sm font-medium rounded-full shadow-lg transition-all duration-200 z-10 ${card.learned || learned[card.id]
                                            ? "bg-green-500 text-white shadow-md shadow-green-200"
                                            : "bg-white text-gray-700 hover:bg-gray-50 shadow-md"
                                            }`}
                                        whileHover={{ scale: 1.05, y: -2 }}
                                        whileTap={{ scale: 0.95 }}
                                        initial={{ y: 10 }}
                                        animate={{ y: 0 }}
                                    >
                                        <div className="flex items-center gap-2">
                                            {card.learned || learned[card.id] ? (
                                                <>
                                                    <motion.span
                                                        animate={{ scale: [1, 1.2, 1] }}
                                                        transition={{ duration: 0.3 }}
                                                    >
                                                        <FaCheck className="text-sm" />
                                                    </motion.span>
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
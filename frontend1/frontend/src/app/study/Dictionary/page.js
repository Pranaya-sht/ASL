"use client";

import { useState } from "react";
import ReactPlayer from "react-player";
import { motion } from "framer-motion";
import { FaSearch, FaTag, FaFilter } from "react-icons/fa";

export default function Dictionary() {
    const [query, setQuery] = useState("");
    const [results, setResults] = useState([]);
    const [selectedTag, setSelectedTag] = useState("");
    const [availableTags, setAvailableTags] = useState([]);

    const handleSearch = async () => {
        if (!query) return;
        const token = localStorage.getItem("access_token");
        const res = await fetch(
            `http://localhost:8000/learn/api/dictionary/search?query=${query}`,
            {
                headers: { Authorization: `Bearer ${token}` },
            }
        );
        const data = await res.json();
        if (data.message) {
            setResults([]);
        } else {
            setResults(data);
            // Extract unique tags from results
            const tags = [...new Set(data.flatMap(word => word.tags || []))];
            setAvailableTags(tags);
        }
    };

    const handleTagFilter = (tag) => {
        setSelectedTag(selectedTag === tag ? "" : tag);
    };

    const filteredResults = selectedTag
        ? results.filter(word => word.tags && word.tags.includes(selectedTag))
        : results;

    return (
        <div className="p-6">
            <h1 className="text-3xl font-bold mb-4 text-center bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent">
                📖 ASL Dictionary
            </h1>

            {/* Search Bar */}
            <div className="flex items-center justify-center mb-6">
                <input
                    type="text"
                    placeholder="Search word..."
                    value={query}
                    onChange={(e) => setQuery(e.target.value)}
                    onKeyPress={(e) => e.key === "Enter" && handleSearch()}
                    className="p-3 rounded-l-lg border border-gray-300 focus:outline-none flex-grow max-w-md"
                />
                <button
                    onClick={handleSearch}
                    className="bg-blue-500 text-white px-4 py-3 rounded-r-lg hover:bg-blue-600"
                >
                    <FaSearch />
                </button>
            </div>

            {/* Tag Filter Section */}
            {availableTags.length > 0 && (
                <div className="mb-6">
                    <div className="flex items-center gap-2 mb-2">
                        <FaFilter className="text-gray-600" />
                        <h3 className="font-medium text-gray-700">Filter by Tag:</h3>
                    </div>
                    <div className="flex flex-wrap gap-2">
                        {availableTags.map((tag) => (
                            <button
                                key={tag}
                                onClick={() => handleTagFilter(tag)}
                                className={`px-3 py-1 rounded-full text-sm flex items-center gap-1 ${selectedTag === tag
                                        ? "bg-blue-500 text-white"
                                        : "bg-gray-100 text-gray-800 hover:bg-gray-200"
                                    }`}
                            >
                                <FaTag size={12} />
                                {tag}
                            </button>
                        ))}
                        {selectedTag && (
                            <button
                                onClick={() => setSelectedTag("")}
                                className="px-3 py-1 rounded-full text-sm bg-red-100 text-red-800 hover:bg-red-200"
                            >
                                Clear Filter
                            </button>
                        )}
                    </div>
                </div>
            )}

            {/* Results Grid */}
            <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
                {filteredResults.map((word) => (
                    <motion.div
                        key={word.id}
                        className="bg-white rounded-xl shadow-lg p-4 hover:shadow-xl transition-shadow"
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        whileHover={{ scale: 1.02 }}
                    >
                        <h2 className="text-xl font-bold mb-2">{word.gloss}</h2>
                        <p className="text-gray-600 mb-2">Level: {word.complexity}</p>

                        {/* Tags Display */}
                        {word.tags && word.tags.length > 0 && (
                            <div className="flex flex-wrap gap-1 mb-3">
                                {word.tags.map((tag) => (
                                    <span
                                        key={tag}
                                        className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800"
                                    >
                                        <FaTag className="mr-1" size={10} />
                                        {tag}
                                    </span>
                                ))}
                            </div>
                        )}

                        {word.video_url && (
                            <ReactPlayer
                                url={word.video_url}
                                controls
                                width="100%"
                                height="200px"
                                className="rounded-lg overflow-hidden"
                            />
                        )}
                    </motion.div>
                ))}
            </div>

            {filteredResults.length === 0 && (
                <div className="text-center py-10 text-gray-500">
                    {selectedTag
                        ? `No words found with tag "${selectedTag}"`
                        : "No results found. Try a different search term."}
                </div>
            )}
        </div>
    );
}
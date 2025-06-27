'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Hand, BookOpen, Play } from 'lucide-react';
import { ChevronDown, Video, FileText } from 'lucide-react';

export default function HomePage() {
    const [isAuthenticated, setIsAuthenticated] = useState(false);
    const [mounted, setMounted] = useState(false);
    const router = useRouter();
    const [isOpen, setIsOpen] = useState(false);

    const toggleDropdown = () => setIsOpen(!isOpen);

    const handleOptionClick = (path) => {
        router.push(path);
        setIsOpen(false);
    };

    useEffect(() => {
        setMounted(true);
        // Check if user is authenticated by looking for the token in localStorage
        const token = localStorage.getItem('access_token');
        setIsAuthenticated(!!token);
    }, []);

    if (!mounted) {
        return (
            <div className="min-h-screen bg-white dark:bg-gray-900 transition-colors duration-300">

                <main className="pt-16">
                    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                        <div className="py-20 lg:py-32">
                            <div className="text-center">
                                <div className="w-24 h-24 bg-gray-200 dark:bg-gray-700 rounded-full mx-auto mb-8 animate-pulse" />
                                <div className="w-96 h-12 bg-gray-200 dark:bg-gray-700 rounded mx-auto mb-6 animate-pulse" />
                                <div className="w-128 h-6 bg-gray-200 dark:bg-gray-700 rounded mx-auto mb-8 animate-pulse" />
                                <div className="flex gap-4 justify-center">
                                    <div className="w-32 h-12 bg-gray-200 dark:bg-gray-700 rounded animate-pulse" />
                                    <div className="w-32 h-12 bg-gray-200 dark:bg-gray-700 rounded animate-pulse" />
                                </div>
                            </div>
                        </div>
                    </div>
                </main>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-white dark:bg-gray-900 transition-colors duration-300">


            {/* Main Content */}
            <main className="pt-16">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    {/* Hero Section */}
                    <div className="py-20 lg:py-32">
                        <div className="text-center">
                            <div className="flex justify-center mb-8">
                                <div className="p-4 bg-blue-100 dark:bg-blue-900/20 rounded-full">
                                    <Hand className="h-16 w-16 text-blue-600 dark:text-blue-400" />
                                </div>
                            </div>

                            <h1 className="text-4xl lg:text-6xl font-bold text-gray-900 dark:text-white mb-6">
                                Learn ASL
                                <span className="bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                                    {' '}Interactively
                                </span>
                            </h1>

                            <p className="text-xl text-gray-600 dark:text-gray-300 mb-8 max-w-2xl mx-auto">
                                Master American Sign Language with real-time hand tracking,
                                interactive lessons, and personalized feedback.
                            </p>

                            {/* CTA Buttons */}
                            <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
                                {!isAuthenticated ? (
                                    <Button
                                        onClick={() => router.push('/register')}
                                        size="lg"
                                        className="bg-blue-600 hover:bg-blue-700 text-white px-8 py-3 text-lg"
                                    >
                                        Get Started Free
                                    </Button>
                                ) : (
                                    <Button
                                        onClick={() => router.push('/study/flashcard')}
                                        size="lg"
                                        className="bg-blue-600 hover:bg-blue-700 text-white px-8 py-3 text-lg"
                                    >
                                        Continue Learning
                                    </Button>
                                )}

                                <div className="relative inline-block">
                                    <Button
                                        onClick={toggleDropdown}
                                        variant="outline"
                                        size="lg"
                                        className="px-8  py-3 text-lg border-2 flex items-center gap-2"
                                    >
                                        <Play className="h-5 w-5" />
                                        Translator
                                        <ChevronDown className={`h-4 w-4 transition-transform duration-200 ${isOpen ? 'rotate-180' : ''}`} />
                                    </Button>

                                    {isOpen && (
                                        <div className="absolute top-full left-0 mt-2 w-full min-w-[250px] bg-white dark:bg-gray-800 border-2 border-gray-200 dark:border-gray-600 rounded-lg shadow-lg z-50">
                                            <div className="py-2">
                                                <button
                                                    onClick={() => handleOptionClick('/predict')}
                                                    className="w-full px-4 py-3 text-left text-gray-900 dark:text-white hover:bg-gray-50 dark:hover:bg-gray-700 flex items-center gap-3 transition-colors"
                                                >
                                                    <Video className="h-5 w-5 text-blue-600 dark:text-blue-400" />
                                                    <div>
                                                        <div className="font-medium">Video Translator</div>
                                                        <div className="text-sm text-gray-500 dark:text-gray-400">Translate sign language videos</div>
                                                    </div>
                                                </button>
                                                <button
                                                    onClick={() => handleOptionClick('/translator')}
                                                    className="w-full px-4 py-3 text-left text-gray-900 dark:text-white hover:bg-gray-50 dark:hover:bg-gray-700 flex items-center gap-3 transition-colors"
                                                >
                                                    <FileText className="h-5 w-5 text-green-600 dark:text-green-400" />
                                                    <div>
                                                        <div className="font-medium">Text to Sign Translator</div>
                                                        <div className="text-sm text-gray-500 dark:text-gray-400">Convert text to sign language</div>
                                                    </div>
                                                </button>
                                            </div>
                                        </div>
                                    )}

                                    {/* Backdrop to close dropdown when clicking outside */}
                                    {isOpen && (
                                        <div
                                            className="fixed inset-0 z-40"
                                            onClick={() => setIsOpen(false)}
                                        />
                                    )}
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Features Section */}
                    <div className="py-20">
                        <div className="grid md:grid-cols-3 gap-8">
                            <div className="text-center p-6">
                                <div className="inline-flex p-3 bg-green-100 dark:bg-green-900/20 rounded-full mb-4">
                                    <Hand className="h-8 w-8 text-green-600 dark:text-green-400" />
                                </div>
                                <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
                                    Real-time Tracking
                                </h3>
                                <p className="text-gray-600 dark:text-gray-300">
                                    Advanced hand tracking technology provides instant feedback on your signing.
                                </p>
                            </div>

                            <div className="text-center p-6">
                                <div className="inline-flex p-3 bg-purple-100 dark:bg-purple-900/20 rounded-full mb-4">
                                    <BookOpen className="h-8 w-8 text-purple-600 dark:text-purple-400" />
                                </div>
                                <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
                                    Interactive Lessons
                                </h3>
                                <p className="text-gray-600 dark:text-gray-300">
                                    Structured learning path with engaging exercises and practice sessions.
                                </p>
                            </div>

                            <div className="text-center p-6">
                                <div className="inline-flex p-3 bg-orange-100 dark:bg-orange-900/20 rounded-full mb-4">
                                    <Play className="h-8 w-8 text-orange-600 dark:text-orange-400" />
                                </div>
                                <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
                                    Progress Tracking
                                </h3>
                                <p className="text-gray-600 dark:text-gray-300">
                                    Monitor your learning journey with detailed analytics and achievements.
                                </p>
                            </div>
                        </div>
                    </div>
                </div>
            </main>
        </div>
    );
}
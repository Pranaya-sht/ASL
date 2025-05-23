'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation'; // Use `next/navigation` for client-side router
import { Button } from '@/components/ui/button';
export default function HomePage() {
    const [isAuthenticated, setIsAuthenticated] = useState(false);
    const router = useRouter();

    useEffect(() => {
        // Check if user is authenticated by looking for the token in localStorage
        const token = localStorage.getItem('access_token');
        setIsAuthenticated(!!token);
    }, []);

    const handleLogout = () => {
        localStorage.removeItem('access_token');
        setIsAuthenticated(false);
        router.push('/login');
    };

    return (
        <div className="min-h-screen bg-blue">

            <div className="min-h-screen bg-gradient-to-br from-blue-500 via-green-500 to-pink-500 dark:from-gray-900 dark:via-gray-800 dark:to-black text-gray-900 dark:text-white transition-colors duration-300">




                {/* Main Content */}
                <div className="flex flex-col items-center justify-center min-h-screen text-white p-6">
                    <h2 className="text-4xl font-bold mb-4">Welcome to ASL Learning!</h2>
                    <p className="text-lg mb-6">
                        Learn American Sign Language interactively with real-time tracking!
                    </p>
                    <div className="space-x-4">
                        {isAuthenticated ? (
                            <> </>
                        ) : (
                            <>
                                <button
                                    onClick={() => router.push('/register')}
                                    className="bg-blue-500 px-6 py-3 rounded-full hover:bg-blue-600"
                                >
                                    Get Started
                                </button>
                            </>
                        )}
                        <Button
                            onClick={() => router.push('/predict')}
                            className="px-5 py-3 rounded-full hover:bg-green-600 transition-colors duration-300 
        bg-green-500 dark:bg-slate-500 dark:hover:bg-gray-700"
                        >
                            Try Prediction
                        </Button>


                    </div>
                </div>
            </div>
        </div>
    );
}

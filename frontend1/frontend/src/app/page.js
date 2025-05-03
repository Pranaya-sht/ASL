'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation'; // Use `next/navigation` for client-side router

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
        <div className="min-h-screen bg-gradient-to-br from-blue-500 to-pink-500">



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
                    <button
                        onClick={() => router.push('/predict')}
                        className="bg-green-500 px-6 py-3 rounded-full hover:bg-green-600"
                    >
                        Try Prediction
                    </button>
                </div>
            </div>
        </div>
    );
}

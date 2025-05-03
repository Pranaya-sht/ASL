'use client';
import Link from 'next/link';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';

export default function Navbar() {
    const [isLoggedIn, setIsLoggedIn] = useState(false);
    const router = useRouter();

    useEffect(() => {
        const token = localStorage.getItem('access_token');
        setIsLoggedIn(!!token);
    }, []);

    const handleLogout = () => {
        localStorage.removeItem('access_token');
        setIsLoggedIn(false);
        router.push('/');
    };

    return (
        <nav className="bg-gray-900 text-white px-6 py-4 flex justify-between items-center">
            <Link href="/" className="text-xl font-bold hover:text-blue-300">
                🖐️ ASL App
            </Link>
            <div className="space-x-4">
                {isLoggedIn ? (
                    <>

                        <button
                            onClick={handleLogout}
                            className="hover:text-red-400"
                        >
                            Logout
                        </button>
                    </>
                ) : (
                    <>
                        <Link href="/login" className="hover:text-blue-300">
                            Login
                        </Link>
                        <Link href="/register" className="hover:text-blue-300">
                            Register
                        </Link>
                    </>
                )}
            </div>
        </nav>
    );
}

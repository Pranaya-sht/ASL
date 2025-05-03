'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation'; // For navigation

export default function LoginPage() {
    const [formData, setFormData] = useState({ email: '', password: '' });
    const [message, setMessage] = useState('');
    const router = useRouter(); // Next.js navigation hook

    const handleSubmit = async (e) => {
        e.preventDefault();
        setMessage('');
        try {
            const encodedData = new URLSearchParams();
            encodedData.append('username', formData.email); // Email goes in "username"
            encodedData.append('password', formData.password);

            const res = await fetch('http://127.0.0.1:8000/users/login', {
                method: 'POST',
                headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
                body: encodedData,
            });

            const data = await res.json();

            if (res.ok) {
                // Save token (optional)
                localStorage.setItem('access_token', data.access_token);

                // Redirect to authorized page
                router.push('/predict');
            } else {
                setMessage(data.detail || '❌ Login failed.');
            }
        } catch (error) {
            console.error(error);
            setMessage('❌ Server error');
        }
    };

    return (
        <div className="min-h-screen flex flex-col items-center justify-center bg-gradient-to-br from-blue-500 to-black-500 p-4">
            <h1 className="text-3xl font-bold text-white mb-6">Login</h1>
            <form onSubmit={handleSubmit} className="bg-white p-6 rounded shadow-md w-80 space-y-4">
                <input
                    type="email"
                    placeholder="Email"
                    className="w-full p-2 border border-gray-300 rounded"
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                />
                <input
                    type="password"
                    placeholder="Password"
                    className="w-full p-2 border border-gray-300 rounded"
                    value={formData.password}
                    onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                />
                <button type="submit" className="w-full bg-blue-500 text-white p-2 rounded hover:bg-blue-600">
                    Login
                </button>
                {message && <p className="text-center text-sm text-gray-700">{message}</p>}
            </form>
        </div>
    );
}

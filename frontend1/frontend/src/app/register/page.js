'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';

export default function RegisterPage() {
    const router = useRouter(); // ✅ Next.js router for navigation
    const [formData, setFormData] = useState({
        username: '',
        email: '',
        password: '',
    });
    const [messages, setMessages] = useState([]);

    const handleSubmit = async (e) => {
        e.preventDefault();
        setMessages([]);
        try {
            const res = await fetch('http://127.0.0.1:8000/users/register', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(formData),
            });

            const data = await res.json();

            if (res.ok) {
                setMessages(['✅ Registered successfully!']);
                // Redirect to login after a short delay (optional)
                setTimeout(() => {
                    router.push('/login'); // ✅ Navigate to login page
                }, 1000);
            } else {
                if (Array.isArray(data.detail)) {
                    const errorMsgs = data.detail.map(err => `❌ ${err.msg}`);
                    setMessages(errorMsgs);
                } else if (data.detail) {
                    setMessages([`❌ ${data.detail}`]);
                } else {
                    setMessages(['❌ Registration failed.']);
                }
            }
        } catch (error) {
            console.error(error);
            setMessages(['❌ Server error']);
        }
    };

    return (
        <div className="min-h-screen flex flex-col items-center justify-center bg-gradient-to-br from-blue-500 to-black-500 p-4">
            <h1 className="text-3xl font-bold text-white mb-6">Register</h1>
            <form onSubmit={handleSubmit} className="bg-white p-6 rounded shadow-md w-80 space-y-4">
                <input
                    type="text"
                    placeholder="Username"
                    className="w-full p-2 border border-gray-300 rounded"
                    value={formData.username}
                    onChange={(e) => setFormData({ ...formData, username: e.target.value })}
                />
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
                    Register
                </button>
                {messages.map((msg, idx) => (
                    <p key={idx} className="text-center text-sm text-gray-700">{msg}</p>
                ))}
            </form>
        </div>
    );
}

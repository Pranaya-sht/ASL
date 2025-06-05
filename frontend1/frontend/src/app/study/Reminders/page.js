"use client";

import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { FaPlus, FaCheck } from "react-icons/fa";

export default function Reminders() {
    const [reminders, setReminders] = useState([]);
    const [message, setMessage] = useState("");
    const [remindAt, setRemindAt] = useState("");

    useEffect(() => {
        fetchReminders();
    }, []);

    const fetchReminders = async () => {
        const token = localStorage.getItem("access_token");
        const res = await fetch("http://localhost:8000/learn/api/reminders/upcoming", {
            headers: { Authorization: `Bearer ${token}` },
        });
        const data = await res.json();
        setReminders(data);
    };

    const handleAddReminder = async () => {
        if (!message || !remindAt) return;
        const token = localStorage.getItem("access_token");
        await fetch("http://localhost:8000/learn/api/reminders", {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                Authorization: `Bearer ${token}`,
            },
            body: JSON.stringify({ message, remind_at: remindAt }),
        });
        setMessage("");
        setRemindAt("");
        fetchReminders();
    };

    const markAsSent = async (id) => {
        const token = localStorage.getItem("access_token");
        await fetch(`http://localhost:8000/learn/api/reminders/${id}/mark_sent`, {
            method: "POST",
            headers: { Authorization: `Bearer ${token}` },
        });
        fetchReminders();
    };

    return (
        <div className="p-6">
            <h1 className="text-3xl font-bold mb-4 text-center bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent">
                ⏰ Reminders
            </h1>
            <div className="bg-white rounded-xl shadow-lg p-6 mb-6">
                <h2 className="text-xl font-semibold mb-2 flex items-center gap-2">
                    <FaPlus /> Add Reminder
                </h2>
                <input
                    type="text"
                    placeholder="Reminder message"
                    value={message}
                    onChange={(e) => setMessage(e.target.value)}
                    className="w-full mb-2 p-2 rounded-lg border border-gray-300"
                />
                <input
                    type="datetime-local"
                    value={remindAt}
                    onChange={(e) => setRemindAt(e.target.value)}
                    className="w-full mb-2 p-2 rounded-lg border border-gray-300"
                />
                <button
                    onClick={handleAddReminder}
                    className="bg-blue-500 text-white px-4 py-2 rounded-lg hover:bg-blue-600"
                >
                    Add Reminder
                </button>
            </div>
            <div className="grid gap-4">
                {reminders.map((reminder) => (
                    <motion.div
                        key={reminder.id}
                        className="bg-white rounded-xl shadow-lg p-4 flex items-center justify-between"
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                    >
                        <div>
                            <h3 className="text-lg font-bold">{reminder.message}</h3>
                            <p className="text-gray-600">
                                Remind at: {new Date(reminder.remind_at).toLocaleString()}
                            </p>
                        </div>
                        <button
                            onClick={() => markAsSent(reminder.id)}
                            className="bg-green-500 text-white px-4 py-2 rounded-lg hover:bg-green-600"
                        >
                            <FaCheck /> Done
                        </button>
                    </motion.div>
                ))}
            </div>
        </div>
    );
}

import React from 'react';
import { motion } from 'framer-motion';

const StatCard = ({ icon, title, value, color = "bg-purple-100 text-purple-800" }) => (
    <motion.div
        className={`p-4 rounded-lg shadow flex flex-col items-center ${color}`}
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
    >
        <div className="text-2xl mb-2">{icon}</div>
        <div className="text-sm font-medium">{title}</div>
        <div className="text-xl font-bold mt-1">{value}</div>
    </motion.div>
);

export default StatCard;
import React from "react";
import { motion } from "framer-motion";

const StatCard = ({ icon, title, value }) => (
    <motion.div
        className="bg-white p-4 rounded-lg shadow flex flex-col items-center"
        whileHover={{ scale: 1.05 }}
    >
        <div className="text-3xl text-purple-600 mb-2">{icon}</div>
        <div className="text-sm text-gray-500">{title}</div>
        <div className="text-xl font-semibold">{value}</div>
    </motion.div>
);

export default StatCard;

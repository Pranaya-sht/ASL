import React from 'react';
import { motion } from 'framer-motion';

const ChartCard = ({ title, children, icon }) => (
    <motion.div
        className="bg-white rounded-xl p-6 shadow-lg flex flex-col"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
    >
        <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
            {icon} {title}
        </h2>
        <div className="flex-grow min-h-[300px]">
            {children}
        </div>
    </motion.div>
);

export default ChartCard;
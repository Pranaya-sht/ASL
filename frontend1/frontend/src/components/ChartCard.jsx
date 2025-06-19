import React from "react";

const ChartCard = ({ title, children }) => (
    <div className="bg-white rounded-lg p-4 shadow">
        <h3 className="text-lg font-semibold mb-3">{title}</h3>
        {children}
    </div>
);

export default ChartCard;

// components/SkillTreeCard.jsx
'use client';
import React from 'react';
import ReactFlow, { Background, Controls } from 'react-flow-renderer';
import ChartCard from './ChartCard';

const getColor = (score) => {
    if (score >= 80) return '#4ade80'; // green
    if (score >= 40) return '#facc15'; // yellow
    return '#f87171'; // red
};

const SkillTreeCard = ({ title, data, icon }) => {
    if (!data || !data.labels || data.labels.length === 0) {
        return (
            <ChartCard title={title} icon={icon}>
                <div className="flex items-center justify-center h-64">
                    <p className="text-gray-500">No quiz performance data</p>
                </div>
            </ChartCard>
        );
    }

    const nodes = data.labels.map((label, i) => ({
        id: `${i + 1}`,
        data: {
            label: `${label}\nAvg: ${data.datasets[0].data[i] ?? 0}\nBest: ${data.datasets[1].data[i] ?? 0}`
        },
        position: { x: i * 180, y: 100 },
        style: {
            background: getColor(data.datasets[0].data[i] ?? 0),
            color: '#000',
            borderRadius: '12px',
            padding: '10px',
            fontWeight: 'bold',
            whiteSpace: 'pre-line',
            textAlign: 'center'
        }
    }));


    const edges = nodes.slice(1).map((node, i) => ({
        id: `e${nodes[i].id}-${node.id}`,
        source: nodes[i].id,
        target: node.id,
        animated: true,
        style: { stroke: '#888' }
    }));

    return (
        <ChartCard title={title} icon={icon}>
            <div style={{ width: '100%', height: 300 }}>
                <ReactFlow nodes={nodes} edges={edges} fitView>
                    <Background />
                    <Controls />
                </ReactFlow>
            </div>
        </ChartCard>
    );
};

export default SkillTreeCard;

'use client';
import React from 'react';
import ReactFlow, { Background, Controls } from 'react-flow-renderer';
import ChartCard from './ChartCard';

const levelColors = [
    '#2563eb', '#10b981', '#f59e0b', '#a855f7', '#ec4899',
    '#f43f5e', '#0ea5e9', '#14b8a6', '#f97316', '#22c55e'
];

const getLevelColor = (levelIndex) => levelColors[levelIndex % levelColors.length];

const getTagShadeByRatio = (hex, ratio) => {
    const lighten = 0.45 - (0.35 * ratio); // darker with higher count
    const col = parseInt(hex.slice(1), 16);
    let r = (col >> 16) + lighten * 255;
    let g = ((col >> 8) & 0x00FF) + lighten * 255;
    let b = (col & 0x0000FF) + lighten * 255;
    r = Math.min(255, r);
    g = Math.min(255, g);
    b = Math.min(255, b);
    return `rgb(${Math.round(r)}, ${Math.round(g)}, ${Math.round(b)})`;
};

const CombinedSkillTree = ({ title, levelData, tagData }) => {
    if (!levelData?.length && !tagData?.length) {
        return (
            <ChartCard title={title}>
                <div className="text-gray-500 text-center py-10">No skill data available.</div>
            </ChartCard>
        );
    }

    const nodes = [];
    const edges = [];

    const LEVEL_SPACING_X = 400;
    const TAGS_PER_ROW = 3;
    const TAG_SPACING_X = 140;
    const TAG_SPACING_Y = 120;
    const TOP_LABEL_Y = 0;
    const LEVEL_Y = 100;
    const FIRST_TAG_Y = 300;

    // Summary Node
    const totalLearned = levelData.reduce((sum, l) => sum + l.count, 0);
    nodes.push({
        id: 'summary',
        data: { label: `Levels\nTotal Learned: ${totalLearned}` },
        position: { x: (levelData.length - 1) * LEVEL_SPACING_X / 2, y: TOP_LABEL_Y },
        style: {
            background: '#1e293b',
            color: '#fff',
            padding: 14,
            fontWeight: 'bold',
            borderRadius: '14px',
            boxShadow: '0 4px 10px rgba(0,0,0,0.2)',
            whiteSpace: 'pre-line',
            textAlign: 'center',
            minWidth: 160
        }
    });

    levelData.forEach((levelItem, levelIndex) => {
        const levelId = `level-${levelItem.level}`;
        const levelX = levelIndex * LEVEL_SPACING_X;
        const levelColor = getLevelColor(levelIndex);

        nodes.push({
            id: levelId,
            data: { label: `Level ${levelItem.level}\nLearned: ${levelItem.count}` },
            position: { x: levelX, y: LEVEL_Y },
            style: {
                background: levelColor,
                border: '2px solid #1e293b',
                borderRadius: '12px',
                padding: 16,
                fontWeight: 'bold',
                boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
                color: '#fff',
                whiteSpace: 'pre-line',
                textAlign: 'center',
                minWidth: 120
            }
        });

        edges.push({
            id: `e-summary-${levelId}`,
            source: 'summary',
            target: levelId,
            animated: true,
            style: { stroke: '#334155', strokeWidth: 1.6 }
        });

        const relatedTags = tagData.filter(tag => tag.level === levelItem.level);
        const maxTagCount = Math.max(...relatedTags.map(t => t.count), 1);

        relatedTags.forEach((tag, tagIndex) => {
            const row = Math.floor(tagIndex / TAGS_PER_ROW);
            const col = tagIndex % TAGS_PER_ROW;

            const tagId = `tag-${levelItem.level}-${tagIndex}`;
            const tagX = levelX + (col - (TAGS_PER_ROW - 1) / 2) * TAG_SPACING_X;
            const tagY = FIRST_TAG_Y + row * TAG_SPACING_Y;

            const ratio = tag.count / maxTagCount;
            const tagColor = getTagShadeByRatio(levelColor, ratio);

            nodes.push({
                id: tagId,
                data: { label: `${tag.tag}\nLearned: ${tag.count}` },
                position: { x: tagX, y: tagY },
                style: {
                    background: tagColor,
                    border: '1px solid #cbd5e1',
                    borderRadius: '10px',
                    padding: 10,
                    boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
                    fontSize: 13,
                    textAlign: 'center',
                    whiteSpace: 'pre-line',
                    color: '#000',
                    minWidth: 110
                }
            });

            edges.push({
                id: `e-${levelId}-${tagId}`,
                source: levelId,
                target: tagId,
                animated: true,
                style: { stroke: '#64748b', strokeWidth: 1.8 }
            });
        });
    });

    return (
        <ChartCard title={title}>
            <div style={{ width: '100%', height: 950 }}>
                <ReactFlow nodes={nodes} edges={edges} fitView>
                    <Background />
                    <Controls />
                </ReactFlow>
            </div>
        </ChartCard>
    );
};

export default CombinedSkillTree;

import React from 'react';
import dayjs from 'dayjs';
import { motion, AnimatePresence } from 'framer-motion';

const HeatmapTooltip = ({ active, day, entry, x, y }) => {
    if (!active || !day) return null;

    const dateStr = day.format("MMMM D, YYYY");

    return (
        <AnimatePresence>
            <motion.div
                initial={{ opacity: 0, y: 10, scale: 0.95 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, scale: 0.95 }}
                style={{ left: x, top: y - 10 }}
                className="fixed z-50 pointer-events-none transform -translate-x-1/2 -translate-y-full mb-2"
            >
                <div className="bg-gray-900 text-white p-3 rounded-lg shadow-xl border border-gray-700 text-xs min-w-32">
                    <p className="font-bold border-b border-gray-700 pb-1 mb-1">{dateStr}</p>
                    {entry?.solved ? (
                        <div className="space-y-1">
                            <div className="flex justify-between items-center gap-4">
                                <span className="text-gray-400">Score:</span>
                                <span className="font-mono text-green-400">{entry.score} pts</span>
                            </div>
                            <div className="flex justify-between items-center gap-4">
                                <span className="text-gray-400">Time:</span>
                                <span className="font-mono text-blue-300">{entry.timeTaken}s</span>
                            </div>
                            <div className="flex justify-between items-center gap-4">
                                <span className="text-gray-400">Difficulty:</span>
                                <span className={`capitalize ${entry.difficulty === 'hard' ? 'text-red-400' :
                                        entry.difficulty === 'medium' ? 'text-yellow-400' : 'text-green-400'
                                    }`}>
                                    {entry.difficulty || 'medium'}
                                </span>
                            </div>
                        </div>
                    ) : (
                        <p className="text-gray-400 italic">No activity recorded</p>
                    )}
                    {/* Pointer */}
                    <div className="absolute left-1/2 bottom-0 transform -translate-x-1/2 translate-y-1/2 rotate-45 w-2 h-2 bg-gray-900 border-r border-b border-gray-700"></div>
                </div>
            </motion.div>
        </AnimatePresence>
    );
};

export default HeatmapTooltip;

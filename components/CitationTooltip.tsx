"use client";
import React, { useState } from 'react';
import { Citation } from '../src/types';

interface CitationTooltipProps {
    citationNumber: number;
    citation: Citation;
}

/**
 * Handles inline display rendering providing popup context window trace semantics for valid matched answers arrays.
 */
export const CitationTooltip: React.FC<CitationTooltipProps> = ({ citationNumber, citation }) => {
    const [isHovered, setIsHovered] = useState(false);

    return (
        <span
            className="relative cursor-pointer inline-flex items-center justify-center font-mono text-[10px] rounded-full bg-blue-100 text-blue-800 px-1.5 mx-1 border border-blue-200 hover:bg-blue-300 transition-colors transform -translate-y-1 align-middle"
            onMouseEnter={() => setIsHovered(true)}
            onMouseLeave={() => setIsHovered(false)}
        >
            {citationNumber}

            {isHovered && (
                <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 w-72 p-4 bg-white text-gray-800 rounded-xl shadow-2xl border border-gray-100 text-sm z-50 pointer-events-none drop-shadow-xl text-left font-sans">
                    <p className="font-semibold mb-2 text-xs text-gray-400 uppercase tracking-wider">Source {citationNumber}</p>
                    <p className="line-clamp-4 leading-relaxed tracking-wide">{citation.chunk_texts[0]}</p>
                    <div className="mt-3 flex items-center justify-between text-xs text-gray-400 border-t border-gray-50 pt-2">
                        <span>Relevance Map</span>
                        <span className="font-medium text-blue-500">{(citation.confidence * 100).toFixed(1)}%</span>
                    </div>
                    {/* CSS Caret styling */}
                    <div className="absolute top-full left-1/2 transform -translate-x-1/2 -mt-[1px] border-solid border-t-white border-l-transparent border-r-transparent border-b-transparent border-8" />
                </div>
            )}
        </span>
    );
};

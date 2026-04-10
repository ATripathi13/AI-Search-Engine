"use client";

import React, { useState } from 'react';
import { useEventStream } from '../hooks/useEventStream';
import { CitationTooltip } from '../components/CitationTooltip';
import { Citation } from '../src/types';

export default function SearchPage() {
    const [query, setQuery] = useState('');
    const { submitQuery, status, tokens, finalAnswer, isLoading, error } = useEventStream('/api/search');

    const handleSearch = (e: React.FormEvent) => {
        e.preventDefault();
        if (query.trim()) {
            submitQuery(query);
        }
    };

    /**
     * Replaces standard [1] brackets safely extracting inline node indices injecting Custom UI components flawlessly.
     */
    const renderAnswerWithCitations = (answer: string, citations: Citation[]) => {
        const parts = answer.split(/(\[\d+\])/g);

        return parts.map((part, index) => {
            const match = part.match(/\[(\d+)\]/);
            if (match) {
                const num = parseInt(match[1], 10);
                const citation = citations[num - 1]; // citations structurally natively match indices identically
                if (citation) {
                    return <CitationTooltip key={index} citationNumber={num} citation={citation} />;
                }
            }
            return <span key={index}>{part}</span>;
        });
    };

    return (
        <div className="min-h-screen bg-slate-50 flex flex-col items-center py-20 px-6 font-sans text-gray-900 selection:bg-blue-100">
            <h1 className="text-4xl font-extrabold tracking-tight mb-10 text-transparent bg-clip-text bg-gradient-to-r from-gray-900 to-gray-600">AI Answer Engine</h1>

            <form onSubmit={handleSearch} className="w-full max-w-3xl relative mb-12 shadow-[0_8px_30px_rgb(0,0,0,0.04)] rounded-2xl group transition-all duration-300 hover:shadow-[0_8px_30px_rgb(0,0,0,0.08)]">
                <input
                    type="text"
                    value={query}
                    onChange={(e) => setQuery(e.target.value)}
                    placeholder="Research deeply any complex question you have..."
                    className="w-full rounded-2xl border border-gray-200 py-5 px-6 pr-32 text-lg focus:ring-4 focus:ring-blue-100 focus:border-blue-500 outline-none transition-all bg-white text-black placeholder-gray-400 shadow-sm"
                />
                <button
                    type="submit"
                    disabled={isLoading || !query}
                    className="absolute right-3 top-3 bottom-3 px-6 bg-black text-white rounded-xl font-semibold hover:bg-gray-800 disabled:opacity-50 disabled:hover:bg-black transition-all flex items-center justify-center min-w-[100px]"
                >
                    {isLoading ? (
                        <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    ) : 'Search'}
                </button>
            </form>

            <div className="w-full max-w-3xl flex flex-col gap-6">
                {error && (
                    <div className="p-4 bg-red-50 text-red-600 rounded-2xl border border-red-100 flex items-center gap-3">
                        <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" /></svg>
                        {error}
                    </div>
                )}

                {(isLoading || tokens || finalAnswer) && (
                    <div className="bg-white rounded-3xl p-8 sm:p-10 shadow-[0_8px_30px_rgb(0,0,0,0.04)] border border-gray-100 w-full min-h-[300px] flex flex-col relative transition-all duration-500">
                        {status && !finalAnswer && (
                            <div className="text-sm tracking-wide text-blue-500 font-semibold mb-6 flex items-center uppercase">
                                <div className="w-2.5 h-2.5 bg-blue-500 rounded-full mr-3 animate-pulse" />
                                {status}
                            </div>
                        )}

                        <div className="prose prose-blue max-w-none prose-lg leading-relaxed text-gray-700">
                            {finalAnswer ? (
                                renderAnswerWithCitations(finalAnswer.answer, finalAnswer.citations)
                            ) : (
                                <span>{tokens}</span>
                            )}

                            {!finalAnswer && isLoading && tokens && (
                                <span className="inline-block w-2 h-5 ml-1 align-middle bg-gray-400 animate-pulse" />
                            )}
                        </div>

                        {finalAnswer?.metrics && (
                            <div className="mt-10 pt-5 border-t border-gray-100 text-[11px] uppercase tracking-widest text-gray-400 font-semibold flex flex-wrap gap-x-6 gap-y-3 justify-between sm:justify-start items-center">
                                <span className="flex items-center gap-2">
                                    <div className="w-1.5 h-1.5 bg-green-400 rounded-full" />
                                    Model {finalAnswer.metrics.model_selection}
                                </span>
                                <span>Latency {(finalAnswer.metrics.stage_latencies?.generation || 0)}ms</span>
                                <span>Usage ${finalAnswer.metrics.estimated_cost?.toFixed(6) || "0.000000"}</span>
                                <span className="px-2 py-1 bg-gray-50 rounded-md border border-gray-200">Hops: {finalAnswer.metrics.hop_count || 1}</span>
                            </div>
                        )}
                    </div>
                )}
            </div>
        </div>
    );
}



import React from 'react';
import { IconClock, IconUser, IconTag } from './Icons';

interface ContextPanelProps {
  data: {
    dates: Set<string>;
    characters: Set<string>;
    tags: Set<string>;
  };
}

// --- Helper Functions for "Magic Analytics" ---

// Tries to extract a year from a string like "été 1995" or "2001"
const parseYear = (dateStr: string): number | null => {
  const match = dateStr.match(/\d{4}/);
  return match ? parseInt(match[0], 10) : null;
};

// Groups dates by decade
const groupDatesByDecade = (dates: Set<string>) => {
  const sortedDates = Array.from(dates)
    .map(d => ({ original: d, year: parseYear(d) }))
    .filter(d => d.year !== null)
    .sort((a, b) => a.year! - b.year!);

  if (sortedDates.length === 0) return {};

  return sortedDates.reduce((acc, date) => {
    const decade = Math.floor(date.year! / 10) * 10;
    if (!acc[decade]) {
      acc[decade] = [];
    }
    acc[decade].push(date);
    return acc;
  }, {} as Record<string, { original: string; year: number | null }[]>);
};

const ContextPanel: React.FC<ContextPanelProps> = ({ data }) => {
  const groupedDates = groupDatesByDecade(data.dates);
  const decades = Object.keys(groupedDates).map(Number).sort((a, b) => a - b);
  const charactersArray = Array.from(data.characters);
  const tagsArray = Array.from(data.tags);

  return (
    <div className="bg-ink-50 border-l border-ink-100 h-full flex flex-col w-full md:w-80 overflow-y-auto font-sans">
      <div className="p-4 border-b border-ink-100 bg-white sticky top-0 z-10">
        <h2 className="font-serif font-semibold text-lg text-ink-800">Analyse du Récit</h2>
      </div>

      <div className="p-4 space-y-8">
        
        {/* --- TIMELINE --- */}
        <section>
          <h3 className="flex items-center gap-2 text-ink-600 font-medium text-sm uppercase tracking-wide mb-3">
            <IconClock className="w-4 h-4" />
            <span>Chronologie</span>
          </h3>
          {decades.length > 0 ? (
            <div className="relative border-l-2 border-ink-200 ml-2 space-y-4">
              {decades.map((decade, i) => (
                <div key={decade} className="pl-6 relative">
                  <div className="absolute -left-[9px] top-1 w-4 h-4 bg-ink-200 rounded-full border-4 border-ink-50"></div>
                  <h4 className="font-bold text-xs text-ink-500 uppercase tracking-wider">{`Années ${decade}`}</h4>
                  <div className="mt-2 space-y-1">
                    {groupedDates[decade].map((date, j) => (
                       <div key={j} className="text-xs font-mono text-ink-600 bg-white p-1.5 rounded border border-ink-100">{date.original}</div>
                    ))}
                  </div>
                   {/* Gap detection */}
                   {i < decades.length - 1 && decades[i+1] - decade > 10 && (
                        <div className="h-8 my-2 border-l-2 border-dashed border-ink-300 ml-[-25px] flex items-center pl-2">
                           <span className="text-[10px] text-ink-400 italic">Période inexplorée...</span>
                        </div>
                   )}
                </div>
              ))}
            </div>
          ) : (
            <span className="text-xs text-ink-400 italic">Aucune date identifiée</span>
          )}
        </section>

        {/* --- CHARACTERS --- */}
        <section>
          <h3 className="flex items-center gap-2 text-ink-600 font-medium text-sm uppercase tracking-wide mb-3">
            <IconUser className="w-4 h-4" />
            <span>Personnages</span>
          </h3>
          {charactersArray.length > 0 ? (
            <div className="space-y-2">
              {charactersArray.slice(0, 3).map((char, i) => ( // Top 3
                <div key={i} className="flex items-center gap-3 bg-white p-2 rounded-lg border border-accent/20 shadow-sm">
                  <div className="w-8 h-8 rounded-full bg-accent/10 flex items-center justify-center font-serif font-bold text-accent">{
                    // FIX: Add a type guard to ensure `char` is a string before calling `charAt`.
                    // The type was inferred as `unknown`, likely due to mixed data types from the API response being added to the Set.
                    typeof char === 'string' ? char.charAt(0) : '?'
                  }</div>
                  <span className="font-semibold text-ink-800">{String(char)}</span>
                </div>
              ))}
              {charactersArray.length > 3 && (
                <div className="pt-2 text-xs text-ink-500">
                  et {charactersArray.length - 3} autre(s) mentionné(s).
                </div>
              )}
            </div>
          ) : (
             <span className="text-xs text-ink-400 italic">Aucun personnage identifié</span>
          )}
        </section>

        {/* --- THEMES (TAG CLOUD) --- */}
        <section>
          <h3 className="flex items-center gap-2 text-ink-600 font-medium text-sm uppercase tracking-wide mb-3">
            <IconTag className="w-4 h-4" />
            <span>Thèmes</span>
          </h3>
          {tagsArray.length > 0 ? (
            <div className="max-h-40 overflow-y-auto rounded-lg bg-white p-3 border border-ink-100 shadow-inner">
              <div className="flex flex-wrap gap-2 items-center">
                {tagsArray.map((tag, i) => {
                  const sizeClass = i % 3 === 0 ? 'text-base font-bold' : i % 3 === 1 ? 'text-sm' : 'text-xs';
                  const colorClass = i % 4 === 0 ? 'bg-rose-100 text-rose-800' : i % 4 === 1 ? 'bg-sky-100 text-sky-800' : i % 4 === 2 ? 'bg-teal-100 text-teal-800' : 'bg-amber-100 text-amber-800';
                  return (
                    <span key={i} className={`px-3 py-1 rounded-full transition-all hover:shadow-md ${sizeClass} ${colorClass}`}>
                      #{tag}
                    </span>
                  )
                })}
              </div>
            </div>
          ) : (
            <span className="text-xs text-ink-400 italic">En attente d'analyse...</span>
          )}
        </section>
      </div>
    </div>
  );
};

export default ContextPanel;
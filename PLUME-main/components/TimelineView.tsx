import React, { useState } from 'react';
import { IconClock, IconPlus, IconBookOpen, IconCheck, IconX } from './Icons';

interface TimelineViewProps {
  dates: Set<string>;
  onAddManualDate: (dateStr: string) => Promise<void>;
  isLoading: boolean;
  showToast: (message: string, type: 'success' | 'error') => void;
}

// --- Helper Functions for "Magic Analytics" (Copied from ContextPanel) ---
const parseYear = (dateStr: string): number | null => {
  const match = dateStr.match(/\d{4}/);
  return match ? parseInt(match[0], 10) : null;
};

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

const TimelineView: React.FC<TimelineViewProps> = ({ dates, onAddManualDate, isLoading, showToast }) => {
  const [isAddEventModalOpen, setIsAddEventModalOpen] = useState(false);
  const [newDateInput, setNewDateInput] = useState('');
  const [isAddingDate, setIsAddingDate] = useState(false); // Local loading for add event

  const groupedDates = groupDatesByDecade(dates);
  const decades = Object.keys(groupedDates).map(Number).sort((a, b) => a - b);
  const totalEvents = dates.size;

  const handleAddEventSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newDateInput.trim()) {
      showToast("Veuillez entrer une date.", "error");
      return;
    }
    setIsAddingDate(true);
    try {
      await onAddManualDate(newDateInput.trim());
      setNewDateInput('');
      setIsAddEventModalOpen(false);
    } catch (error) {
      console.error("Error adding manual date:", error);
      showToast("Erreur lors de l'ajout de la date.", "error");
    } finally {
      setIsAddingDate(false);
    }
  };

  return (
    <div className="h-full overflow-y-auto bg-paper">
      <div className="max-w-4xl mx-auto p-8 md:p-12">
        {/* Header */}
        <div className="mb-8 flex flex-col md:flex-row items-center justify-between gap-4">
            <div>
                <h2 className="font-serif text-3xl font-bold text-ink-900">La Chronologie</h2>
                <p className="text-ink-500 mt-2">Le fil du temps de votre récit, reconstitué par PLUME.</p>
            </div>
            <div className="px-4 py-2 bg-white border border-ink-200 rounded-full text-sm font-medium text-ink-600 shadow-sm flex items-center gap-2">
                <IconClock className="w-4 h-4 text-ink-400" />
                <span>{totalEvents} Événements marquants</span>
            </div>
        </div>
        
        {isLoading && (
            <div className="text-center py-20 bg-white border border-ink-100 rounded-xl shadow-sm animate-pulse">
                <IconClock className="w-12 h-12 text-ink-300 mx-auto mb-4" />
                <p className="text-ink-500 font-medium">Chargement de votre chronologie...</p>
            </div>
        )}

        {!isLoading && totalEvents === 0 ? (
          <div className="text-center py-20 bg-white border-2 border-dashed border-ink-200 rounded-xl">
             <IconClock className="w-12 h-12 text-ink-300 mx-auto mb-4" />
             <p className="text-ink-500 font-medium">Commencez à écrire dans l'Atelier pour générer votre chronologie.</p>
             <button
                onClick={() => setIsAddEventModalOpen(true)}
                className="mt-6 px-6 py-3 bg-accent text-white rounded-full shadow-md hover:bg-amber-600 transition-colors flex items-center gap-2 mx-auto"
             >
                <IconPlus className="w-5 h-5" /> Ajouter un événement manuellement
             </button>
          </div>
        ) : !isLoading && (
          <div className="relative border-l-2 border-accent/30 ml-3 md:ml-6 space-y-8 py-4">
            {decades.map((decade, i) => (
              <div key={decade} className="relative group pl-8 md:pl-12">
                {/* Decade Header */}
                <div className="absolute -left-[9px] -top-2 w-4 h-4 bg-white rounded-full border-4 border-accent z-10"></div>
                <h3 className="font-bold text-xl text-ink-800 bg-white pr-4 -ml-4 pl-4 py-1 rounded-r-lg inline-block relative z-0">
                    Années {decade}
                </h3>
                
                <div className="mt-4 space-y-4">
                    {groupedDates[decade].map((date, j) => (
                       <div key={`${decade}-${j}`} className="group relative">
                          <div className="absolute -left-[30px] top-4 w-2 h-2 rounded-full bg-accent/60 group-hover:bg-accent transition-colors z-10"></div>
                          <div className="bg-white p-4 rounded-lg shadow-sm border border-ink-100 hover:shadow-md transition-shadow group-hover:border-accent/50 ml-[-20px] pl-[35px]">
                            <span className="inline-block px-2 py-0.5 mb-1 bg-ink-100 text-ink-700 text-xs font-bold uppercase tracking-wider rounded">
                              {date.original}
                            </span>
                            <p className="text-ink-800 font-serif text-base mt-1">
                              Un moment clé de votre vie.
                            </p>
                          </div>
                       </div>
                    ))}
                </div>
                 {/* Gap detection */}
                 {i < decades.length - 1 && decades[i+1] - decade > 10 && (
                      <div className="h-10 my-4 border-l-2 border-dashed border-ink-300 ml-[-25px] flex items-center pl-4 text-[10px] text-ink-400 italic">
                         Période inexplorée...
                      </div>
                 )}
              </div>
            ))}
             <div className="pl-8 md:pl-12 pt-8">
                 <button 
                    onClick={() => setIsAddEventModalOpen(true)}
                    className="px-4 py-2 border border-dashed border-ink-300 text-ink-500 rounded-lg w-full hover:bg-white hover:border-accent hover:text-accent transition-colors text-sm flex items-center justify-center gap-2"
                 >
                    <IconPlus className="w-4 h-4" /> Ajouter un événement manuellement
                 </button>
             </div>
          </div>
        )}
      </div>

      {/* Add Event Modal */}
      {isAddEventModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm animate-fade-in">
              <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden">
                  <div className="bg-[#2d333b] p-6 text-center">
                      <IconBookOpen className="w-8 h-8 text-accent mx-auto mb-3" />
                      <h2 className="text-2xl font-serif font-bold text-white">Ajouter un Événement</h2>
                      <p className="text-white/60 text-sm mt-1">Saisissez une date clé pour votre chronologie.</p>
                  </div>
                  <form onSubmit={handleAddEventSubmit} className="p-8 space-y-6">
                      <div>
                          <label htmlFor="newDate" className="block text-sm font-bold text-ink-600 mb-2">
                              Date ou Période (ex: "1995", "Été 2003", "Ma naissance")
                          </label>
                          <input
                              type="text"
                              id="newDate"
                              value={newDateInput}
                              onChange={(e) => setNewDateInput(e.target.value)}
                              placeholder="Ex: 1988"
                              required
                              className="w-full px-4 py-2 border border-ink-200 rounded-lg focus:ring-2 focus:ring-accent/50 focus:border-accent outline-none transition-all"
                              autoFocus
                          />
                      </div>
                      <div className="flex justify-end gap-3">
                          <button
                              type="button"
                              onClick={() => { setIsAddEventModalOpen(false); setNewDateInput(''); }}
                              disabled={isAddingDate}
                              className="px-5 py-2.5 rounded-lg border border-ink-200 text-ink-600 hover:bg-ink-50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                          >
                              Annuler
                          </button>
                          <button
                              type="submit"
                              disabled={isAddingDate || !newDateInput.trim()}
                              className="px-5 py-2.5 rounded-lg bg-accent text-white font-semibold hover:bg-amber-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                          >
                              {isAddingDate ? (
                                  <>
                                      <svg className="animate-spin h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg>
                                      Ajout en cours...
                                  </>
                              ) : (
                                  <>
                                      <IconCheck className="w-5 h-5" />
                                      Ajouter
                                  </>
                              )}
                          </button>
                      </div>
                  </form>
              </div>
          </div>
      )}
    </div>
  );
};

export default TimelineView;


import React, { useState } from 'react';
import { IconFeather, IconBook, IconClock, IconLock } from './Icons';
import AuthModal from './AuthModal';
import ExamplesSection from './ExamplesSection';
import FAQSection from './FAQSection';
import SupportSection from './SupportSection';

interface LandingPageProps {
  onLogin: () => void;
}

const LandingPage: React.FC<LandingPageProps> = ({ onLogin }) => {
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
  const [authMode, setAuthMode] = useState<'login' | 'signup'>('signup');

  const openAuth = (mode: 'login' | 'signup') => {
    setAuthMode(mode);
    setIsAuthModalOpen(true);
  };

  return (
    <div className="bg-paper min-h-screen text-ink-900 font-sans flex flex-col">
      <AuthModal isOpen={isAuthModalOpen} onClose={() => setIsAuthModalOpen(false)} initialView={authMode} />

      {/* Hero Section */}
      <header className="bg-[#5c2b2b] text-white relative overflow-hidden">
        <div className="absolute inset-0 opacity-10 bg-[url('https://www.transparenttextures.com/patterns/aged-paper.png')]"></div>
        <div className="max-w-7xl mx-auto px-6 py-24 md:py-32 relative z-10 flex flex-col items-center text-center">
          <div className="w-16 h-16 bg-white/10 rounded-full flex items-center justify-center mb-6 backdrop-blur-sm border border-white/20">
            <IconFeather className="w-8 h-8 text-amber-400" />
          </div>
          <h1 className="font-serif text-5xl md:text-7xl font-bold mb-6 tracking-tight">PLUME</h1>
          <p className="text-xl md:text-2xl text-amber-100 font-serif italic max-w-2xl mb-10 leading-relaxed">
            "Immortalisez votre existence. Transformez vos souvenirs épars en une autobiographie d'exception grâce à l'intelligence artificielle."
          </p>
          <div className="flex flex-col sm:flex-row gap-4 items-center justify-center">
            <button
              onClick={() => openAuth('signup')}
              className="px-10 py-4 bg-amber-600 hover:bg-amber-500 text-white rounded-full font-semibold text-lg shadow-xl hover:shadow-2xl transition-all transform hover:-translate-y-1"
            >
              Commencer mon Récit
            </button>
            <button
              onClick={() => openAuth('login')}
              className="px-10 py-4 bg-white/10 hover:bg-white/20 text-white rounded-full font-semibold text-lg border-2 border-white/30 hover:border-white/50 backdrop-blur-sm transition-all transform hover:-translate-y-1"
            >
              Ouvrir mon Livre
            </button>
          </div>
          <p className="mt-4 text-sm text-white/60">Déjà 12,000 pages écrites aujourd'hui.</p>
        </div>
      </header>

      {/* Features Grid */}
      <section className="py-20 px-6 max-w-7xl mx-auto">
        <div className="text-center mb-16">
          <span className="text-amber-700 font-bold tracking-widest text-xs uppercase">Fonctionnalités Premium</span>
          <h2 className="font-serif text-4xl font-bold text-ink-900 mt-2">Votre Assistant Biographe Personnel</h2>
        </div>

        <div className="grid md:grid-cols-3 gap-8">
          {/* Feature 1 */}
          <div className="bg-white p-8 rounded-2xl shadow-sm border border-ink-100 hover:shadow-xl transition-shadow">
            <div className="w-12 h-12 bg-amber-100 rounded-xl flex items-center justify-center text-amber-700 mb-6">
              <IconFeather className="w-6 h-6" />
            </div>
            <h3 className="font-serif text-xl font-bold mb-3">Atelier de Rédaction IA</h3>
            <p className="text-ink-500 leading-relaxed">
              La maïeutique digitale. PLUME vous pose les bonnes questions pour faire émerger vos souvenirs les plus précieux et les rédige avec style.
            </p>
          </div>

          {/* Feature 2 */}
          <div className="bg-white p-8 rounded-2xl shadow-sm border border-ink-100 hover:shadow-xl transition-shadow">
            <div className="w-12 h-12 bg-amber-100 rounded-xl flex items-center justify-center text-amber-700 mb-6">
              <IconClock className="w-6 h-6" />
            </div>
            <h3 className="font-serif text-xl font-bold mb-3">Chronologie Intelligente</h3>
            <p className="text-ink-500 leading-relaxed">
              L'IA extrait automatiquement les dates et événements pour construire une frise interactive.
            </p>
          </div>

          {/* Feature 3 */}
          <div className="bg-white p-8 rounded-2xl shadow-sm border border-ink-100 hover:shadow-xl transition-shadow">
            <div className="w-12 h-12 bg-amber-100 rounded-xl flex items-center justify-center text-amber-700 mb-6">
              <IconBook className="w-6 h-6" />
            </div>
            <h3 className="font-serif text-xl font-bold mb-3">Coffre à Souvenirs</h3>
            <p className="text-ink-500 leading-relaxed">
              Centralisez photos, personnages et thèmes. Une cartographie complète de votre entourage et de vos moments forts.
            </p>
          </div>
        </div>
      </section>

      {/* Examples Section */}
      <ExamplesSection />

      {/* FAQ Section */}
      <FAQSection />

      {/* Support Section */}
      <SupportSection />

      {/* Trust Section */}
      <section className="bg-ink-50 py-16 border-t border-ink-200">
        <div className="max-w-5xl mx-auto px-6 text-center">
          <div className="flex flex-col md:flex-row items-center justify-center gap-8 text-ink-500 opacity-70">
            <div className="flex items-center gap-2">
              <IconLock className="w-5 h-5" />
              <span className="font-medium">Données Chiffrées & Privées</span>
            </div>
            <div className="h-1 w-1 bg-ink-300 rounded-full hidden md:block"></div>
            <div className="flex items-center gap-2">
              <IconBook className="w-5 h-5" />
              <span className="font-medium">Export Format Livre Qualité Éditeur</span>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
};

export default LandingPage;
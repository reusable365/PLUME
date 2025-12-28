
import React, { useState } from 'react';
import { IconFeather, IconBook, IconClock, IconLock, IconCamera } from './Icons';
import AuthModal from './AuthModal';
import ExamplesSection from './ExamplesSection';
import FAQSection from './FAQSection';
import SupportSection from './SupportSection';
import RecentActivityTicker from './RecentActivityTicker';
import FeaturesSection from './FeaturesSection';

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
        {/* Animated Background Elements */}
        <div className="absolute inset-0 opacity-10 bg-[url('https://www.transparenttextures.com/patterns/aged-paper.png')]"></div>
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div className="absolute top-1/4 left-1/4 w-64 h-64 bg-amber-500/10 rounded-full blur-3xl animate-pulse"></div>
          <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-rose-500/10 rounded-full blur-3xl animate-pulse" style={{ animationDelay: '1s' }}></div>
        </div>

        <div className="max-w-7xl mx-auto px-6 py-24 md:py-32 relative z-10 flex flex-col items-center text-center">
          <div className="w-20 h-20 bg-white/10 rounded-full flex items-center justify-center mb-8 backdrop-blur-md border border-white/20 shadow-2xl animate-custom-bounce">
            <IconFeather className="w-10 h-10 text-amber-400" />
          </div>

          <h1 className="font-serif text-5xl md:text-7xl font-bold mb-6 tracking-tight leading-tight">
            Vos souvenirs méritent <br />
            <span className="text-amber-400">l'éternité</span>
          </h1>

          <p className="text-xl md:text-2xl text-amber-50 font-serif italic max-w-3xl mb-12 leading-relaxed opacity-90">
            "Écrivez le livre de votre vie, simplement. Plume transforme vos fragments de mémoire en une autobiographie d'exception."
          </p>

          <div className="flex flex-col sm:flex-row gap-5 items-center justify-center w-full max-w-md sm:max-w-none z-20">
            <button
              onClick={() => openAuth('signup')}
              className="w-full sm:w-auto px-8 py-4 bg-amber-600 hover:bg-amber-500 text-white rounded-full font-semibold text-lg shadow-lg hover:shadow-amber-500/30 transition-all transform hover:-translate-y-1 hover:scale-105"
            >
              Commencer mon Récit
            </button>
            <button
              onClick={() => openAuth('login')}
              className="w-full sm:w-auto px-8 py-4 bg-white/5 hover:bg-white/10 text-white rounded-full font-semibold text-lg border border-white/20 hover:border-white/40 backdrop-blur-sm transition-all transform hover:-translate-y-1"
            >
              Ouvrir mon Livre
            </button>
          </div>

          <RecentActivityTicker />

        </div>
      </header>

      {/* Features Process Section */}
      <FeaturesSection />

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


import React, { useState } from 'react';
import { IconFeather, IconBook, IconClock, IconLock, IconCamera } from './Icons';
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
          <span className="text-amber-700 font-bold tracking-widest text-xs uppercase">Une Technologie Unique</span>
          <h2 className="font-serif text-4xl font-bold text-ink-900 mt-2">Bien plus qu'un simple éditeur de texte</h2>
          <p className="mt-4 text-ink-500 max-w-2xl mx-auto">Plume combine une maïeutique bienveillante à une analyse sémantique de pointe pour transformer le chaos de la mémoire en une œuvre d'art.</p>
        </div>

        <div className="grid md:grid-cols-3 gap-8">
          {/* Feature 1: L'Architecte */}
          <div className="bg-white p-8 rounded-2xl shadow-sm border border-ink-100 hover:shadow-xl transition-all hover:-translate-y-1">
            <div className="w-14 h-14 bg-amber-50 rounded-2xl flex items-center justify-center text-amber-700 mb-6 shadow-inner">
              <IconFeather className="w-7 h-7" />
            </div>
            <h3 className="font-serif text-xl font-bold mb-3 text-ink-900">Plume, votre Architecte</h3>
            <p className="text-ink-500 leading-relaxed text-sm">
              Il ne vous laisse jamais seul face à la page blanche. Grâce à sa <strong>maïeutique active</strong>, il vous pose les questions qui débloquent les souvenirs enfouis, s'adaptant à votre ton et votre rythme.
              <br /><span className="text-xs font-bold text-amber-600 mt-2 block uppercase">Modes : Émotion • Action • Sensoriel</span>
            </p>
          </div>

          {/* Feature 2: PhotoCatalyst */}
          <div className="bg-white p-8 rounded-2xl shadow-sm border border-ink-100 hover:shadow-xl transition-all hover:-translate-y-1">
            <div className="w-14 h-14 bg-indigo-50 rounded-2xl flex items-center justify-center text-indigo-700 mb-6 shadow-inner">
              <IconCamera className="w-7 h-7" />
            </div>
            <h3 className="font-serif text-xl font-bold mb-3 text-ink-900">PhotoCatalyst™</h3>
            <p className="text-ink-500 leading-relaxed text-sm">
              Une image vaut mille mots, mais Plume vous aide à les écrire. Notre IA de vision <strong>analyse vos photos</strong> pour en extraire les lieux, les époques et même les émotions, servant de point de départ instantané à l'écriture.
            </p>
          </div>

          {/* Feature 3: Le Sanctuaire */}
          <div className="bg-white p-8 rounded-2xl shadow-sm border border-ink-100 hover:shadow-xl transition-all hover:-translate-y-1">
            <div className="w-14 h-14 bg-emerald-50 rounded-2xl flex items-center justify-center text-emerald-700 mb-6 shadow-inner">
              <IconBook className="w-7 h-7" />
            </div>
            <h3 className="font-serif text-xl font-bold mb-3 text-ink-900">Le Sanctuaire</h3>
            <p className="text-ink-500 leading-relaxed text-sm">
              Vos souvenirs sont précieux. Plume les organise automatiquement dans une <strong>Boutique des Souvenirs</strong> interactive, classés par personnes, lieux et tags, prêts à être assemblés dans votre chef-d'œuvre final.
              <br /><span className="text-xs font-bold text-emerald-600 mt-2 block uppercase">Score de Maturité Intégré</span>
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
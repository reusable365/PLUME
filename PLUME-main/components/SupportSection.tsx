
import React from 'react';
import { IconVideo, IconMail, IconBook } from './Icons';

const SupportSection: React.FC = () => {
    return (
        <section className="py-20 px-6 max-w-7xl mx-auto bg-gradient-to-br from-slate-50 via-white to-amber-50/20">
            <div className="text-center mb-16">
                <span className="text-amber-700 font-bold tracking-widest text-xs uppercase">Support & Tutoriels</span>
                <h2 className="font-serif text-4xl font-bold text-ink-900 mt-2">Nous sommes là pour vous aider</h2>
                <p className="text-ink-500 mt-4 max-w-2xl mx-auto">
                    Découvrez comment tirer le meilleur parti de PLUME avec nos tutoriels vidéo et notre support technique réactif.
                </p>
            </div>

            <div className="grid md:grid-cols-3 gap-8">
                {/* Video Tutorials */}
                <div className="bg-white p-8 rounded-2xl shadow-lg border border-ink-100 hover:shadow-2xl transition-all hover:-translate-y-1">
                    <div className="w-16 h-16 bg-gradient-to-br from-red-500 to-pink-500 rounded-2xl flex items-center justify-center text-white mb-6 shadow-lg">
                        <IconVideo className="w-8 h-8" />
                    </div>
                    <h3 className="font-serif text-2xl font-bold text-ink-900 mb-4">Tutoriels Vidéo</h3>
                    <p className="text-ink-500 leading-relaxed mb-6">
                        Apprenez à utiliser PLUME avec nos guides vidéo pas à pas. De la création de votre premier souvenir à l'export de votre livre.
                    </p>
                    <div className="space-y-3">
                        <a href="#" className="block p-3 bg-ink-50 rounded-lg hover:bg-accent/10 transition-colors">
                            <p className="text-sm font-semibold text-ink-800">🎬 Démarrage rapide (5 min)</p>
                        </a>
                        <a href="#" className="block p-3 bg-ink-50 rounded-lg hover:bg-accent/10 transition-colors">
                            <p className="text-sm font-semibold text-ink-800">📸 Utiliser le Catalyseur Photo</p>
                        </a>
                        <a href="#" className="block p-3 bg-ink-50 rounded-lg hover:bg-accent/10 transition-colors">
                            <p className="text-sm font-semibold text-ink-800">📖 Exporter votre livre</p>
                        </a>
                    </div>
                </div>

                {/* Documentation */}
                <div className="bg-white p-8 rounded-2xl shadow-lg border border-ink-100 hover:shadow-2xl transition-all hover:-translate-y-1">
                    <div className="w-16 h-16 bg-gradient-to-br from-amber-500 to-orange-500 rounded-2xl flex items-center justify-center text-white mb-6 shadow-lg">
                        <IconBook className="w-8 h-8" />
                    </div>
                    <h3 className="font-serif text-2xl font-bold text-ink-900 mb-4">Documentation</h3>
                    <p className="text-ink-500 leading-relaxed mb-6">
                        Consultez notre documentation complète pour maîtriser toutes les fonctionnalités de PLUME.
                    </p>
                    <div className="space-y-3">
                        <a href="#" className="block p-3 bg-ink-50 rounded-lg hover:bg-accent/10 transition-colors">
                            <p className="text-sm font-semibold text-ink-800">📚 Guide de l'utilisateur</p>
                        </a>
                        <a href="#" className="block p-3 bg-ink-50 rounded-lg hover:bg-accent/10 transition-colors">
                            <p className="text-sm font-semibold text-ink-800">💡 Astuces et bonnes pratiques</p>
                        </a>
                        <a href="#" className="block p-3 bg-ink-50 rounded-lg hover:bg-accent/10 transition-colors">
                            <p className="text-sm font-semibold text-ink-800">🔧 Résolution de problèmes</p>
                        </a>
                    </div>
                </div>

                {/* Contact Support */}
                <div className="bg-white p-8 rounded-2xl shadow-lg border border-ink-100 hover:shadow-2xl transition-all hover:-translate-y-1">
                    <div className="w-16 h-16 bg-gradient-to-br from-blue-500 to-indigo-500 rounded-2xl flex items-center justify-center text-white mb-6 shadow-lg">
                        <IconMail className="w-8 h-8" />
                    </div>
                    <h3 className="font-serif text-2xl font-bold text-ink-900 mb-4">Support Technique</h3>
                    <p className="text-ink-500 leading-relaxed mb-6">
                        Notre équipe est disponible pour répondre à toutes vos questions. Temps de réponse moyen : 24h.
                    </p>
                    <div className="space-y-4">
                        <a
                            href="mailto:support@plume-app.com"
                            className="block w-full px-6 py-3 bg-accent text-white text-center rounded-xl font-semibold hover:bg-accent-light transition-colors shadow-md hover:shadow-lg"
                        >
                            Envoyer un email
                        </a>
                        <div className="text-center">
                            <p className="text-xs text-ink-400">Ou appelez-nous au</p>
                            <p className="text-lg font-bold text-accent">01 23 45 67 89</p>
                            <p className="text-xs text-ink-400 mt-1">Lun-Ven, 9h-18h</p>
                        </div>
                    </div>
                </div>
            </div>

            {/* Additional Help Section */}
            <div className="mt-16 bg-gradient-to-r from-accent/10 to-amber-100/50 rounded-2xl p-8 border border-accent/20">
                <div className="max-w-3xl mx-auto text-center">
                    <h3 className="font-serif text-2xl font-bold text-ink-900 mb-4">
                        Besoin d'aide pour démarrer ?
                    </h3>
                    <p className="text-ink-600 mb-6">
                        Réservez une session de 30 minutes avec un expert PLUME pour découvrir toutes les fonctionnalités
                        et créer vos premiers souvenirs ensemble.
                    </p>
                    <button className="px-8 py-4 bg-accent text-white rounded-full font-semibold text-lg shadow-xl hover:shadow-2xl hover:bg-accent-light transition-all transform hover:-translate-y-1">
                        Réserver une démo personnalisée
                    </button>
                </div>
            </div>
        </section>
    );
};

export default SupportSection;

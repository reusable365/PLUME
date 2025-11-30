
import React, { useState } from 'react';
import { IconChevronDown, IconHelp } from './Icons';

interface FAQItem {
    question: string;
    answer: string;
}

const faqData: FAQItem[] = [
    {
        question: "Comment PLUME protège-t-il mes données personnelles ?",
        answer: "Toutes vos données sont chiffrées de bout en bout et stockées de manière sécurisée. Nous utilisons Supabase avec des politiques de sécurité strictes (RLS). Vos souvenirs vous appartiennent et ne sont jamais partagés avec des tiers."
    },
    {
        question: "Puis-je exporter mon livre une fois terminé ?",
        answer: "Absolument ! PLUME vous permet d'exporter votre autobiographie en plusieurs formats : PDF haute qualité pour l'impression, EPUB pour les liseuses, et même un format Word éditable. Vous gardez le contrôle total de votre œuvre."
    },
    {
        question: "Comment fonctionne l'IA de PLUME ?",
        answer: "PLUME utilise Gemini AI de Google pour analyser vos souvenirs et générer des récits littéraires. L'IA pose des questions pertinentes pour approfondir vos souvenirs, extrait automatiquement les dates et personnages, et rédige dans le ton que vous choisissez (authentique, poétique, etc.)."
    },
    {
        question: "Combien de temps faut-il pour créer un livre ?",
        answer: "Cela dépend de vous ! Certains utilisateurs écrivent leur livre en quelques semaines, d'autres prennent plusieurs mois pour explorer leurs souvenirs en profondeur. PLUME s'adapte à votre rythme et sauvegarde automatiquement votre progression."
    },
    {
        question: "Puis-je ajouter des photos à mon récit ?",
        answer: "Oui ! Le Catalyseur Photo de PLUME analyse vos images avec l'IA pour enrichir vos souvenirs. Vous pouvez également organiser vos photos par personnages, lieux et événements dans la Galerie de Souvenirs."
    },
    {
        question: "Quel est le prix de PLUME ?",
        answer: "PLUME propose un plan Premium à 19€/mois ou 190€/an. Cela inclut l'accès illimité à l'IA, l'export de votre livre, et toutes les fonctionnalités avancées (chronologie, galerie, tableau de bord). Essai gratuit de 14 jours disponible."
    }
];

const FAQSection: React.FC = () => {
    const [openIndex, setOpenIndex] = useState<number | null>(null);

    const toggleFAQ = (index: number) => {
        setOpenIndex(openIndex === index ? null : index);
    };

    return (
        <section className="py-20 px-6 max-w-4xl mx-auto">
            <div className="text-center mb-16">
                <div className="flex items-center justify-center gap-3 mb-4">
                    <div className="w-12 h-12 bg-amber-100 rounded-xl flex items-center justify-center text-amber-700">
                        <IconHelp className="w-6 h-6" />
                    </div>
                </div>
                <span className="text-amber-700 font-bold tracking-widest text-xs uppercase">Questions Fréquentes</span>
                <h2 className="font-serif text-4xl font-bold text-ink-900 mt-2">Tout ce que vous devez savoir</h2>
                <p className="text-ink-500 mt-4">
                    Des réponses claires à vos questions sur PLUME
                </p>
            </div>

            <div className="space-y-4">
                {faqData.map((faq, index) => (
                    <div
                        key={index}
                        className="bg-white rounded-2xl border border-ink-100 shadow-sm hover:shadow-md transition-shadow overflow-hidden"
                    >
                        <button
                            onClick={() => toggleFAQ(index)}
                            className="w-full flex items-center justify-between p-6 text-left hover:bg-ink-50 transition-colors"
                        >
                            <span className="font-serif text-lg font-bold text-ink-900 pr-4">
                                {faq.question}
                            </span>
                            <IconChevronDown
                                className={`w-5 h-5 text-accent flex-shrink-0 transition-transform duration-300 ${openIndex === index ? 'rotate-180' : ''
                                    }`}
                            />
                        </button>
                        <div
                            className={`overflow-hidden transition-all duration-300 ${openIndex === index ? 'max-h-96' : 'max-h-0'
                                }`}
                        >
                            <div className="px-6 pb-6 text-ink-600 leading-relaxed">
                                {faq.answer}
                            </div>
                        </div>
                    </div>
                ))}
            </div>

            <div className="mt-12 text-center">
                <p className="text-ink-500 mb-4">Vous avez d'autres questions ?</p>
                <a
                    href="mailto:support@plume-app.com"
                    className="inline-flex items-center gap-2 px-6 py-3 bg-accent text-white rounded-full font-semibold hover:bg-accent-light transition-colors shadow-lg hover:shadow-xl"
                >
                    Contactez notre équipe
                </a>
            </div>
        </section>
    );
};

export default FAQSection;

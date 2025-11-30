import { DigitalMemory } from '../types';

// Mock data for simulation
const MOCK_MEMORIES: DigitalMemory[] = [
    {
        id: 'mem_1',
        platform: 'instagram',
        externalId: 'ig_123456',
        date: '2019-06-15',
        imageUrl: 'https://images.unsplash.com/photo-1469854523086-cc02fe5d8800?ixlib=rb-4.0.3&auto=format&fit=crop&w=1000&q=80',
        content: "Roadtrip inoubliable avec le paternel ! La vieille Ford a tenu le coup (presque). #roadtrip #family #vintage",
        location: "Route 66, USA",
        likes: 142,
        taggedPeople: ['Jean Dupont'],
        analysis: {
            emotion: "Nostalgie joyeuse",
            themes: ["Famille", "Voyage", "Aventure"],
            suggestedAngles: [
                "L'odeur de l'essence et de la liberté",
                "Les conversations père-fils sur la route",
                "La panne comme moment de complicité"
            ]
        }
    },
    {
        id: 'mem_2',
        platform: 'facebook',
        externalId: 'fb_987654',
        date: '2015-12-24',
        imageUrl: 'https://images.unsplash.com/photo-1543589077-47d81606c1bf?ixlib=rb-4.0.3&auto=format&fit=crop&w=1000&q=80',
        content: "Noël en famille, le premier de Léo. Magique. 🎄✨",
        location: "Lyon, France",
        likes: 89,
        taggedPeople: ['Marie Dupont', 'Léo Dupont'],
        analysis: {
            emotion: "Émerveillement",
            themes: ["Famille", "Fêtes", "Enfance"],
            suggestedAngles: [
                "Le regard de Léo devant le sapin",
                "La transmission des traditions",
                "Le calme après l'ouverture des cadeaux"
            ]
        }
    },
    {
        id: 'mem_3',
        platform: 'linkedin',
        externalId: 'li_456789',
        date: '2021-09-01',
        content: "Fier d'annoncer ma promotion au poste de Directeur Artistique. Merci à toute l'équipe pour la confiance ! Une nouvelle page qui se tourne. 🚀 #career #design #leadership",
        likes: 350,
        analysis: {
            emotion: "Fierté accomplie",
            themes: ["Travail", "Réussite", "Évolution"],
            suggestedAngles: [
                "Le chemin parcouru pour en arriver là",
                "Les doutes avant la nomination",
                "La vision pour l'avenir"
            ]
        }
    },
    {
        id: 'mem_4',
        platform: 'instagram',
        externalId: 'ig_789012',
        date: '2018-08-20',
        imageUrl: 'https://images.unsplash.com/photo-1510414842594-a61c69b5ae57?ixlib=rb-4.0.3&auto=format&fit=crop&w=1000&q=80',
        content: "Seul face à la mer. Le bruit des vagues remet tout en place. 🌊 #meditation #nature #bretagne",
        location: "Saint-Malo, France",
        likes: 210,
        analysis: {
            emotion: "Sérénité",
            themes: ["Nature", "Introspection", "Solitude"],
            suggestedAngles: [
                "Le dialogue intérieur face à l'océan",
                "La puissance apaisante des éléments",
                "Ce que la mer a emporté ce jour-là"
            ]
        }
    }
];

export const digitalMemoryService = {
    // Simulate connecting to a platform
    connectPlatform: async (platform: string): Promise<boolean> => {
        return new Promise((resolve) => {
            setTimeout(() => {
                resolve(true);
            }, 1500); // Simulate network delay
        });
    },

    // Simulate scanning for memories
    scanMemories: async (): Promise<DigitalMemory[]> => {
        return new Promise((resolve) => {
            setTimeout(() => {
                resolve(MOCK_MEMORIES);
            }, 2500); // Simulate processing time
        });
    },

    // Get stored memories (mock)
    getMemories: (): DigitalMemory[] => {
        return MOCK_MEMORIES;
    }
};

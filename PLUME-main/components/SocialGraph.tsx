import React, { useEffect, useState } from 'react';
import { entityService } from '../services/entityService';
import { Entity, RelationCategory } from '../types';
import { IconUser, IconUserGroup, IconPlus, IconBriefcase, IconHeart, IconStar } from './Icons';

const SocialGraph: React.FC = () => {
    const [people, setPeople] = useState<Entity[]>([]);
    const [loading, setLoading] = useState(true);
    const [newPersonName, setNewPersonName] = useState('');
    const [newPersonRelation, setNewPersonRelation] = useState('');
    const [newPersonCategory, setNewPersonCategory] = useState<RelationCategory>(RelationCategory.FAMILY);
    const [showAddForm, setShowAddForm] = useState(false);

    useEffect(() => {
        loadPeople();
    }, []);

    const loadPeople = async () => {
        try {
            const data = await entityService.getEntitiesByType('person');
            setPeople(data);
        } catch (error) {
            console.error('Failed to load people', error);
        } finally {
            setLoading(false);
        }
    };

    const handleAddPerson = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!newPersonName) return;

        try {
            await entityService.createEntity('person', newPersonName, {
                relationship: newPersonRelation,
                category: newPersonCategory
            });
            setNewPersonName('');
            setNewPersonRelation('');
            setShowAddForm(false);
            loadPeople();
        } catch (error) {
            console.error('Failed to add person', error);
        }
    };

    const getCategoryIcon = (category?: RelationCategory) => {
        switch (category) {
            case RelationCategory.FAMILY: return <IconHeart className="w-5 h-5 text-rose-500" />;
            case RelationCategory.FRIEND: return <IconStar className="w-5 h-5 text-amber-500" />;
            case RelationCategory.WORK: return <IconBriefcase className="w-5 h-5 text-blue-500" />;
            default: return <IconUser className="w-5 h-5 text-gray-500" />;
        }
    };

    const groupedPeople = people.reduce((acc, person) => {
        const category = person.metadata.category || RelationCategory.OTHER;
        if (!acc[category]) acc[category] = [];
        acc[category].push(person);
        return acc;
    }, {} as Record<string, Entity[]>);

    if (loading) return <div className="p-8 text-center text-gray-500">Chargement de vos relations...</div>;

    return (
        <div className="h-full overflow-y-auto bg-gray-50 p-8">
            <div className="max-w-6xl mx-auto">
                <div className="flex justify-between items-center mb-8">
                    <div>
                        <h2 className="text-3xl font-serif text-gray-900 mb-2">Mon Cercle Social</h2>
                        <p className="text-gray-600">Cartographie de vos relations : famille, amis, collègues...</p>
                    </div>
                    <button
                        onClick={() => setShowAddForm(!showAddForm)}
                        className="flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors"
                    >
                        <IconPlus className="w-5 h-5" />
                        <span>Ajouter une relation</span>
                    </button>
                </div>

                {showAddForm && (
                    <div className="mb-8 bg-white p-6 rounded-xl shadow-sm border border-gray-100 animate-fade-in-down">
                        <form onSubmit={handleAddPerson} className="flex flex-wrap gap-4 items-end">
                            <div className="flex-1 min-w-[200px]">
                                <label className="block text-sm font-medium text-gray-700 mb-1">Nom</label>
                                <input
                                    type="text"
                                    value={newPersonName}
                                    onChange={(e) => setNewPersonName(e.target.value)}
                                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                                    placeholder="Ex: Papa, Marie..."
                                />
                            </div>
                            <div className="flex-1 min-w-[200px]">
                                <label className="block text-sm font-medium text-gray-700 mb-1">Relation</label>
                                <input
                                    type="text"
                                    value={newPersonRelation}
                                    onChange={(e) => setNewPersonRelation(e.target.value)}
                                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                                    placeholder="Ex: Père, Meilleure amie..."
                                />
                            </div>
                            <div className="flex-1 min-w-[200px]">
                                <label className="block text-sm font-medium text-gray-700 mb-1">Catégorie</label>
                                <select
                                    value={newPersonCategory}
                                    onChange={(e) => setNewPersonCategory(e.target.value as RelationCategory)}
                                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                                >
                                    {Object.values(RelationCategory).map((cat) => (
                                        <option key={cat} value={cat}>{cat}</option>
                                    ))}
                                </select>
                            </div>
                            <button
                                type="submit"
                                className="px-6 py-2 bg-gray-900 text-white rounded-lg hover:bg-gray-800 transition-colors"
                            >
                                Enregistrer
                            </button>
                        </form>
                    </div>
                )}

                <div className="space-y-12">
                    {Object.entries(groupedPeople).map(([category, categoryPeople]) => (
                        <div key={category}>
                            <h3 className="flex items-center gap-2 text-xl font-medium text-gray-800 mb-4 border-b pb-2">
                                {getCategoryIcon(category as RelationCategory)}
                                {category}
                                <span className="text-sm font-normal text-gray-500 ml-2">({(categoryPeople as Entity[]).length})</span>
                            </h3>
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                                {(categoryPeople as Entity[]).map((person) => (
                                    <div key={person.id} className="group bg-white p-6 rounded-xl shadow-sm border border-gray-100 hover:shadow-md transition-all hover:-translate-y-1 cursor-pointer">
                                        <div className="flex items-start justify-between mb-4">
                                            <div className="w-12 h-12 rounded-full bg-gray-100 flex items-center justify-center text-xl font-serif text-gray-600">
                                                {person.value.charAt(0).toUpperCase()}
                                            </div>
                                            <div className="opacity-0 group-hover:opacity-100 transition-opacity">
                                                <button className="text-gray-400 hover:text-gray-600">
                                                    <IconUserGroup className="w-4 h-4" />
                                                </button>
                                            </div>
                                        </div>
                                        <h4 className="text-lg font-medium text-gray-900 mb-1">{person.value}</h4>
                                        <p className="text-sm text-indigo-600 font-medium mb-2">{person.metadata.relationship || 'Relation'}</p>
                                        <div className="flex flex-wrap gap-2 mt-4">
                                            {/* Placeholder for future tags or stats */}
                                            <span className="px-2 py-1 bg-gray-50 text-xs text-gray-500 rounded-full">0 souvenirs</span>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    ))}

                    {people.length === 0 && !loading && (
                        <div className="text-center py-12 bg-white rounded-xl border border-dashed border-gray-300">
                            <IconUserGroup className="w-12 h-12 text-gray-300 mx-auto mb-4" />
                            <p className="text-gray-500">Vous n'avez pas encore ajouté de relations.</p>
                            <button
                                onClick={() => setShowAddForm(true)}
                                className="mt-4 text-indigo-600 font-medium hover:underline"
                            >
                                Commencer à ajouter
                            </button>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default SocialGraph;

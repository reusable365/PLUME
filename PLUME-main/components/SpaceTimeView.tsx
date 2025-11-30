import React, { useEffect, useState } from 'react';
import { entityService } from '../services/entityService';
import { Entity } from '../types';
import { IconMapPin, IconCalendar, IconPlus, IconMap } from './Icons';

const SpaceTimeView: React.FC = () => {
    const [places, setPlaces] = useState<Entity[]>([]);
    const [dates, setDates] = useState<Entity[]>([]);
    const [loading, setLoading] = useState(true);
    const [activeTab, setActiveTab] = useState<'places' | 'timeline'>('places');
    const [newItemValue, setNewItemValue] = useState('');
    const [newItemExtra, setNewItemExtra] = useState(''); // Address or Date details
    const [showAddForm, setShowAddForm] = useState(false);

    useEffect(() => {
        loadData();
    }, []);

    const loadData = async () => {
        try {
            const [placesData, datesData] = await Promise.all([
                entityService.getEntitiesByType('place'),
                entityService.getEntitiesByType('date') // Assuming 'date' type entities exist or we filter events
            ]);
            setPlaces(placesData);
            setDates(datesData);
        } catch (error) {
            console.error('Failed to load space-time data', error);
        } finally {
            setLoading(false);
        }
    };

    const handleAddItem = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!newItemValue) return;

        try {
            if (activeTab === 'places') {
                await entityService.createEntity('place', newItemValue, { address: newItemExtra });
            } else {
                await entityService.createEntity('date', newItemValue, { date: newItemExtra });
            }
            setNewItemValue('');
            setNewItemExtra('');
            setShowAddForm(false);
            loadData();
        } catch (error) {
            console.error('Failed to add item', error);
        }
    };

    if (loading) return <div className="p-8 text-center text-gray-500">Chargement de l'espace-temps...</div>;

    return (
        <div className="h-full overflow-y-auto bg-gray-50 p-8">
            <div className="max-w-6xl mx-auto">
                <div className="flex justify-between items-center mb-8">
                    <div>
                        <h2 className="text-3xl font-serif text-gray-900 mb-2">Espace & Temps</h2>
                        <p className="text-gray-600">Vos lieux marquants et votre chronologie personnelle.</p>
                    </div>
                    <button
                        onClick={() => setShowAddForm(!showAddForm)}
                        className="flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors"
                    >
                        <IconPlus className="w-5 h-5" />
                        <span>Ajouter {activeTab === 'places' ? 'un lieu' : 'une date'}</span>
                    </button>
                </div>

                <div className="flex gap-4 mb-8 border-b border-gray-200">
                    <button
                        onClick={() => setActiveTab('places')}
                        className={`pb-4 px-4 font-medium transition-colors relative ${activeTab === 'places' ? 'text-indigo-600' : 'text-gray-500 hover:text-gray-700'
                            }`}
                    >
                        <div className="flex items-center gap-2">
                            <IconMapPin className="w-5 h-5" />
                            Lieux
                        </div>
                        {activeTab === 'places' && (
                            <div className="absolute bottom-0 left-0 w-full h-0.5 bg-indigo-600 rounded-t-full" />
                        )}
                    </button>
                    <button
                        onClick={() => setActiveTab('timeline')}
                        className={`pb-4 px-4 font-medium transition-colors relative ${activeTab === 'timeline' ? 'text-indigo-600' : 'text-gray-500 hover:text-gray-700'
                            }`}
                    >
                        <div className="flex items-center gap-2">
                            <IconCalendar className="w-5 h-5" />
                            Chronologie
                        </div>
                        {activeTab === 'timeline' && (
                            <div className="absolute bottom-0 left-0 w-full h-0.5 bg-indigo-600 rounded-t-full" />
                        )}
                    </button>
                </div>

                {showAddForm && (
                    <div className="mb-8 bg-white p-6 rounded-xl shadow-sm border border-gray-100 animate-fade-in-down">
                        <form onSubmit={handleAddItem} className="flex flex-wrap gap-4 items-end">
                            <div className="flex-1 min-w-[200px]">
                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                    {activeTab === 'places' ? 'Nom du lieu' : 'Titre de l\'événement'}
                                </label>
                                <input
                                    type="text"
                                    value={newItemValue}
                                    onChange={(e) => setNewItemValue(e.target.value)}
                                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                                    placeholder={activeTab === 'places' ? "Ex: Maison d'enfance" : "Ex: Naissance de Léo"}
                                />
                            </div>
                            <div className="flex-1 min-w-[200px]">
                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                    {activeTab === 'places' ? 'Adresse / Ville' : 'Date / Année'}
                                </label>
                                <input
                                    type="text"
                                    value={newItemExtra}
                                    onChange={(e) => setNewItemExtra(e.target.value)}
                                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                                    placeholder={activeTab === 'places' ? "Ex: Paris, France" : "Ex: 1995"}
                                />
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

                {activeTab === 'places' && (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {places.map((place) => (
                            <div key={place.id} className="group bg-white p-6 rounded-xl shadow-sm border border-gray-100 hover:shadow-md transition-all hover:-translate-y-1 cursor-pointer">
                                <div className="flex items-start justify-between mb-4">
                                    <div className="w-12 h-12 rounded-full bg-indigo-50 flex items-center justify-center text-indigo-600">
                                        <IconMapPin className="w-6 h-6" />
                                    </div>
                                </div>
                                <h4 className="text-lg font-medium text-gray-900 mb-1">{place.value}</h4>
                                <p className="text-sm text-gray-500 mb-2">{place.metadata.address || 'Adresse inconnue'}</p>
                            </div>
                        ))}
                        {places.length === 0 && !loading && (
                            <div className="col-span-full text-center py-12 bg-white rounded-xl border border-dashed border-gray-300">
                                <IconMap className="w-12 h-12 text-gray-300 mx-auto mb-4" />
                                <p className="text-gray-500">Aucun lieu enregistré.</p>
                            </div>
                        )}
                    </div>
                )}

                {activeTab === 'timeline' && (
                    <div className="relative border-l-2 border-indigo-100 ml-4 space-y-8 py-4">
                        {dates.map((date) => (
                            <div key={date.id} className="relative pl-8">
                                <div className="absolute -left-[9px] top-1 w-4 h-4 rounded-full bg-indigo-600 border-4 border-white shadow-sm" />
                                <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 hover:shadow-md transition-all">
                                    <span className="inline-block px-3 py-1 bg-indigo-50 text-indigo-700 text-sm font-medium rounded-full mb-2">
                                        {date.metadata.date || 'Date inconnue'}
                                    </span>
                                    <h4 className="text-lg font-medium text-gray-900">{date.value}</h4>
                                </div>
                            </div>
                        ))}
                        {dates.length === 0 && !loading && (
                            <div className="pl-8 text-gray-500 italic">Aucun événement marquant enregistré.</div>
                        )}
                    </div>
                )}
            </div>
        </div>
    );
};

export default SpaceTimeView;

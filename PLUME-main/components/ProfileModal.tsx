

import React, { useState } from 'react';
import { supabase } from '../services/supabaseClient';
import { IconUser, IconCheck, IconImage } from './Icons';
import { User, Photo } from '../types';

interface ProfileModalProps {
    user: User;
    onComplete: (updatedUser: User) => void;
}

type Tab = 'identity' | 'photos';

const ProfileModal: React.FC<ProfileModalProps> = ({ user, onComplete }) => {
    const [activeTab, setActiveTab] = useState<Tab>('identity');

    // Identity state
    const [firstName, setFirstName] = useState(user.firstName || '');
    const [lastName, setLastName] = useState(user.lastName || '');
    const [birthDate, setBirthDate] = useState(user.birthDate || '');

    // Photos state - only profile photos
    const [photos, setPhotos] = useState<Photo[]>((user.photos || []).filter(p => p.isProfilePhoto === true));

    const [loading, setLoading] = useState(false);

    const handlePhotoUpload = (period: Photo['period']) => {
        // Simulation: Ajoute une photo placeholder
        const newPhoto: Photo = {
            period,
            url: `https://via.placeholder.com/100x100?text=${period.charAt(0).toUpperCase()}`, // Utiliser un vrai placeholder
            caption: `Souvenir (${period})`,
            isProfilePhoto: true // Mark as profile photo
        };
        setPhotos(prev => [...prev, newPhoto]);
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        if (!firstName.trim() || !birthDate) {
            alert("Veuillez remplir votre prénom et votre date de naissance.");
            return;
        }

        setLoading(true);

        try {
            // Merge profile photos with existing non-profile photos
            const nonProfilePhotos = (user.photos || []).filter(p => !p.isProfilePhoto);
            const allPhotos = [...nonProfilePhotos, ...photos];

            const updates = {
                id: user.id,
                first_name: firstName,
                last_name: lastName,
                birth_date: birthDate,
                photos: allPhotos,
                updated_at: new Date().toISOString(),
            };

            const { error } = await supabase.from('profiles').upsert(updates);
            if (error) throw error;

            const updatedUser: User = {
                ...user,
                firstName,
                lastName,
                birthDate,
                photos: allPhotos,
                name: `${firstName} ${lastName}`.trim() || user.email.split('@')[0]
            };

            onComplete(updatedUser);

        } catch (error) {
            console.error('Error updating profile:', error);
            alert("Erreur lors de la sauvegarde du profil. Veuillez réessayer.");
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm animate-fade-in">
            <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg overflow-hidden">
                <div className="bg-[#2d333b] p-6 text-center">
                    <h2 className="text-2xl font-serif font-bold text-white">Profil de l'Écrivain</h2>
                    <p className="text-white/60 text-sm mt-1">Contextualisez votre histoire pour PLUME.</p>
                </div>

                {/* Tabs */}
                <div className="flex border-b border-ink-200">
                    <button
                        onClick={() => setActiveTab('identity')}
                        className={`flex-1 py-3 text-sm font-semibold transition-all ${activeTab === 'identity' ? 'text-accent border-b-2 border-accent' : 'text-ink-500 hover:bg-ink-50'}`}
                    >
                        Identité
                    </button>
                    <button
                        onClick={() => setActiveTab('photos')}
                        className={`flex-1 py-3 text-sm font-semibold transition-all ${activeTab === 'photos' ? 'text-accent border-b-2 border-accent' : 'text-ink-500 hover:bg-ink-50'}`}
                    >
                        Photothèque
                    </button>
                </div>

                <form onSubmit={handleSubmit}>
                    <div className="p-8">
                        {activeTab === 'identity' && (
                            <div className="space-y-5 animate-fade-in">
                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <label className="block text-xs font-bold text-ink-500 uppercase mb-1">Prénom</label>
                                        <input type="text" value={firstName} onChange={(e) => setFirstName(e.target.value)} required className="w-full input-style" placeholder="Marcel" />
                                    </div>
                                    <div>
                                        <label className="block text-xs font-bold text-ink-500 uppercase mb-1">Nom</label>
                                        <input type="text" value={lastName} onChange={(e) => setLastName(e.target.value)} required className="w-full input-style" placeholder="Proust" />
                                    </div>
                                </div>
                                <div>
                                    <label className="block text-xs font-bold text-ink-500 uppercase mb-1">Date de naissance</label>
                                    <input type="date" value={birthDate} onChange={(e) => setBirthDate(e.target.value)} required className="w-full input-style text-ink-700" />
                                    <p className="text-[10px] text-ink-400 mt-1 italic">Permet de calculer votre âge lors des événements.</p>
                                </div>
                            </div>
                        )}

                        {activeTab === 'photos' && (
                            <div className="space-y-6 animate-fade-in">
                                <PhotoSection title="Enfance" period="enfance" onUpload={handlePhotoUpload} photos={photos.filter(p => p.period === 'enfance')} />
                                <PhotoSection title="Jeunesse / Adolescence" period="jeunesse" onUpload={handlePhotoUpload} photos={photos.filter(p => p.period === 'jeunesse')} />
                                <PhotoSection title="Âge Adulte" period="adulte" onUpload={handlePhotoUpload} photos={photos.filter(p => p.period === 'adulte')} />
                            </div>
                        )}
                    </div>

                    <div className="bg-ink-50 px-8 py-4 border-t border-ink-200 flex justify-end">
                        <button type="submit" disabled={loading} className="w-full md:w-auto py-3 px-6 bg-accent hover:bg-amber-600 text-white font-bold rounded-lg shadow-md hover:shadow-lg transition-all flex items-center justify-center gap-2">
                            {loading ? 'Enregistrement...' : <><IconCheck className="w-5 h-5" />Enregistrer le Profil</>}
                        </button>
                    </div>
                </form>
            </div>
            <style>{`.input-style { all: unset; box-sizing: border-box; width: 100%; padding: 0.5rem 1rem; border: 1px solid #cbd2d9; border-radius: 0.5rem; background-color: #f5f7fa; transition: background-color 150ms ease-in-out; } .input-style:focus { background-color: white; border-color: #d97706; }`}</style>
        </div>
    );
};

const PhotoSection = ({ title, period, onUpload, photos }: { title: string, period: Photo['period'], onUpload: (p: Photo['period']) => void, photos: Photo[] }) => (
    <div>
        <h4 className="font-bold text-sm text-ink-700 mb-2">{title}</h4>
        <div className="grid grid-cols-3 md:grid-cols-5 gap-3">
            {photos.map((photo, i) => (
                <div key={i} className="aspect-square bg-ink-100 rounded-lg overflow-hidden">
                    <img src={photo.url} alt={photo.caption} className="w-full h-full object-cover" />
                </div>
            ))}
            <div
                onClick={() => onUpload(period)}
                className="aspect-square border-2 border-dashed border-ink-300 rounded-lg flex flex-col items-center justify-center text-ink-400 hover:text-accent hover:border-accent cursor-pointer transition-colors"
            >
                <IconImage className="w-6 h-6 mb-1" />
                <span className="text-[10px] font-bold">AJOUTER</span>
            </div>
        </div>
    </div>
);

export default ProfileModal;
import { supabase } from './supabaseClient';
import { Entity, EntityType, EntityMetadata } from '../types';

export const entityService = {
    /**
     * Récupère les entités d'un certain type pour l'utilisateur connecté
     */
    async getEntitiesByType(type: EntityType): Promise<Entity[]> {
        const { data, error } = await supabase
            .from('entities')
            .select('*')
            .eq('type', type)
            .order('value', { ascending: true });

        if (error) {
            console.error(`Error fetching entities of type ${type}:`, error);
            throw error;
        }

        return data as Entity[];
    },

    /**
     * Crée une nouvelle entité
     */
    async createEntity(type: EntityType, value: string, metadata: EntityMetadata = {}): Promise<Entity> {
        const { data: { user } } = await supabase.auth.getUser();

        if (!user) throw new Error('User not authenticated');

        const { data, error } = await supabase
            .from('entities')
            .insert([
                {
                    user_id: user.id,
                    type,
                    value,
                    metadata
                }
            ])
            .select()
            .single();

        if (error) {
            console.error('Error creating entity:', error);
            throw error;
        }

        return data as Entity;
    },

    /**
     * Met à jour les métadonnées d'une entité
     */
    async updateEntityMetadata(id: string, metadata: EntityMetadata): Promise<Entity> {
        const { data, error } = await supabase
            .from('entities')
            .update({ metadata })
            .eq('id', id)
            .select()
            .single();

        if (error) {
            console.error('Error updating entity metadata:', error);
            throw error;
        }

        return data as Entity;
    },

    /**
     * Supprime une entité
     */
    async deleteEntity(id: string): Promise<void> {
        const { error } = await supabase
            .from('entities')
            .delete()
            .eq('id', id);

        if (error) {
            console.error('Error deleting entity:', error);
            throw error;
        }
    }
};

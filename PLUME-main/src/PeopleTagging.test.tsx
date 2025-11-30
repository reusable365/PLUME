import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor, act } from '@testing-library/react';
import React from 'react';
import PhotoCatalyst from '../components/PhotoCatalyst';
import BoutiqueSouvenirs from '../components/BoutiqueSouvenirs';
import * as photoAnalysisService from '../services/photoAnalysisService';
import { supabase } from '../services/supabaseClient';

// Mock Supabase
const mockSelect = vi.fn();
const mockEq = vi.fn();
const mockSingle = vi.fn();
const mockOrder = vi.fn();
const mockUpdate = vi.fn();

vi.mock('../services/supabaseClient', () => ({
    supabase: {
        from: vi.fn(() => ({
            select: mockSelect,
            eq: mockEq,
            single: mockSingle,
            order: mockOrder,
            update: mockUpdate,
        })),
        storage: {
            from: vi.fn(() => ({
                upload: vi.fn().mockResolvedValue({ data: {}, error: null }),
                getPublicUrl: vi.fn().mockReturnValue({ data: { publicUrl: 'http://test.com/photo.jpg' } }),
            })),
        },
    },
}));

// Mock Photo Analysis Service
vi.mock('../services/photoAnalysisService', () => ({
    analyzePhotoWithVision: vi.fn(),
    generateNarrativePrompt: vi.fn(),
    uploadPhotoToSupabase: vi.fn(),
    savePhotoMetadata: vi.fn(),
    getAvailableCharacters: vi.fn(),
    saveCharactersToEntities: vi.fn(),
}));

describe('People Tagging Feature', () => {
    const mockUserId = 'user-123';
    const mockOnComplete = vi.fn();
    const mockOnClose = vi.fn();

    beforeEach(() => {
        vi.clearAllMocks();

        // Default mocks
        mockSelect.mockReturnThis();
        mockEq.mockReturnThis();
        mockSingle.mockResolvedValue({ data: null, error: null });
        mockOrder.mockReturnThis();
        mockUpdate.mockResolvedValue({ error: null });

        (photoAnalysisService.getAvailableCharacters as any).mockResolvedValue(['Alice', 'Bob']);
        (photoAnalysisService.analyzePhotoWithVision as any).mockResolvedValue({
            description: 'A test photo',
            detectedPeople: [],
            narrativeAngles: { emotion: 'Q1', action: 'Q2', sensory: 'Q3' }
        });
        (photoAnalysisService.uploadPhotoToSupabase as any).mockResolvedValue('http://test.com/photo.jpg');
    });

    describe('PhotoCatalyst', () => {
        it('allows adding people tags and saves them', async () => {
            render(
                <PhotoCatalyst
                    userId={mockUserId}
                    onComplete={mockOnComplete}
                    onClose={mockOnClose}
                />
            );

            // 1. Select a file
            const file = new File(['dummy'], 'test.png', { type: 'image/png' });
            const input = screen.getByLabelText(/cliquez pour sélectionner/i) || document.querySelector('input[type="file"]');

            // Note: In the actual component, it might be a hidden input or drag-drop area. 
            // We'll assume we can trigger the change event on the input.
            if (input) {
                fireEvent.change(input, { target: { files: [file] } });
            } else {
                // Fallback if we can't find input easily (depends on implementation)
                // Assuming standard file input exists
                const inputs = document.querySelectorAll('input[type="file"]');
                if (inputs.length > 0) fireEvent.change(inputs[0], { target: { files: [file] } });
            }

            // Wait for analysis to complete (mocked)
            await waitFor(() => {
                expect(photoAnalysisService.analyzePhotoWithVision).toHaveBeenCalled();
            });

            // 2. Add a person tag
            const personInput = await screen.findByPlaceholderText(/Ajouter une personne/i);
            fireEvent.change(personInput, { target: { value: 'Charlie' } });
            fireEvent.keyDown(personInput, { key: 'Enter', code: 'Enter' });

            // Verify tag is added
            expect(screen.getByText('Charlie')).toBeDefined();

            // 3. Select an angle (required to confirm)
            const angleButton = screen.getByText(/Émotion/i); // Assuming 'Emotion' is part of the angle button text
            fireEvent.click(angleButton);

            // 4. Confirm
            const confirmButton = screen.getByText(/Graver ce souvenir/i);
            fireEvent.click(confirmButton);

            // 5. Verify savePhotoMetadata is called with the tag
            await waitFor(() => {
                expect(photoAnalysisService.savePhotoMetadata).toHaveBeenCalledWith(
                    mockUserId,
                    expect.objectContaining({
                        linkedCharacters: ['Charlie']
                    })
                );
            });
        });
    });

    describe('BoutiqueSouvenirs', () => {
        it('displays photos and filters by character', async () => {
            // Mock profile photos
            const mockPhotos = [
                { id: 'p1', url: 'url1', linkedCharacters: ['Alice'] },
                { id: 'p2', url: 'url2', linkedCharacters: ['Bob'] },
                { id: 'p3', url: 'url3', linkedCharacters: ['Alice', 'Bob'] }
            ];

            mockSingle.mockResolvedValue({
                data: { photos: mockPhotos }
            });

            // Mock entities for filter options
            mockSelect.mockImplementation((columns) => {
                if (columns === '*') { // entities query
                    return {
                        eq: () => ({
                            data: [
                                { type: 'person', value: 'Alice' },
                                { type: 'person', value: 'Bob' }
                            ]
                        })
                    };
                }
                return { eq: () => ({ single: () => ({ data: { photos: mockPhotos } }) }) };
            });

            render(<BoutiqueSouvenirs userId={mockUserId} />);

            // 1. Switch to Photos view
            const photosButton = screen.getByText(/Photos/i);
            fireEvent.click(photosButton);

            // 2. Verify all photos are shown initially
            // We can check for images or some other identifier. 
            // The component renders images with alt text.
            // Let's assume we can find them.
            // Or check the "3 photos trouvées" text
            await waitFor(() => {
                expect(screen.getByText(/3 photos trouvées/i)).toBeDefined();
            });

            // 3. Filter by 'Alice'
            // Find the character filter dropdown/select
            // It might be hidden under "Filtres".
            const filterButton = screen.getByText(/Filtres/i);
            fireEvent.click(filterButton);

            const charSelect = screen.getByLabelText(/Personnage/i) || screen.getByRole('combobox', { name: /Personnage/i });
            fireEvent.change(charSelect, { target: { value: 'Alice' } });

            // 4. Verify filtered count
            // Should be p1 and p3 -> 2 photos
            await waitFor(() => {
                expect(screen.getByText(/2 photos trouvées/i)).toBeDefined();
            });
        });
    });
});

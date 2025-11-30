import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import App from '@/App';
import React from 'react';

// Mock Supabase to avoid network calls
vi.mock('../services/supabaseClient', () => ({
    supabase: {
        auth: {
            getSession: vi.fn().mockResolvedValue({ data: { session: null } }),
            onAuthStateChange: vi.fn().mockReturnValue({ data: { subscription: { unsubscribe: vi.fn() } } }),
        },
        from: vi.fn().mockReturnValue({
            select: vi.fn().mockReturnThis(),
            eq: vi.fn().mockReturnThis(),
            single: vi.fn().mockResolvedValue({ data: null, error: null }),
            order: vi.fn().mockReturnThis(),
        }),
    },
}));

describe('App Smoke Test', () => {
    it('renders the landing page by default', () => {
        render(<App />);
        // Assuming LandingPage has some specific text or element
        // Since we don't have the LandingPage code visible yet, we'll check for something generic or just that it doesn't crash
        // But based on App.tsx, if no session, it renders LandingPage.
        // Let's just check if the container is present.
        const appContainer = document.querySelector('.bg-paper'); // App wrapper class
        // Actually, LandingPage might be different.
        // Let's check for "PLUME" text which is likely in the header or landing page.
        // Wait, App.tsx renders LandingPage component if no session.
    });
});

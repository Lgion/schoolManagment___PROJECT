import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import ReviewCell from '../ReviewCell';

describe('ReviewCell', () => {
    const mockOnChange = jest.fn();

    beforeEach(() => {
        jest.clearAllMocks();
    });

    it('renders with standard style when confidence is high', () => {
        const row = { nom: 'Jean Dupont', note: 15, confiance: 0.9 };
        const { container } = render(<ReviewCell index={0} row={row} onChange={mockOnChange} />);

        expect(screen.getByText('Jean Dupont')).toBeTruthy();
        expect(screen.getByDisplayValue('15')).toBeTruthy();

        const tr = container.querySelector('tr');
        expect(tr.classList.contains('--is-warning')).toBe(false);
    });

    it('renders with warning style when confidence is low (Soft Warning)', () => {
        const row = { nom: 'Marie Curie', note: 18, confiance: 0.7 }; // confiance < 0.8
        const { container } = render(<ReviewCell index={1} row={row} onChange={mockOnChange} />);

        const tr = container.querySelector('tr');
        expect(tr.classList.contains('--is-warning')).toBe(true);
        expect(tr.getAttribute('title')).toBe('Vérification recommandée');
    });

    it('removes warning style immediately when user edits the value (Optimistic update)', () => {
        const row = { nom: 'Albert Einstein', note: 10, confiance: 0.5 };
        const { container } = render(<ReviewCell index={2} row={row} onChange={mockOnChange} />);

        const tr = container.querySelector('tr');
        expect(tr.classList.contains('--is-warning')).toBe(true); // Initially warning

        const input = screen.getByDisplayValue('10');
        fireEvent.change(input, { target: { value: '12' } });

        // Optimistic update should remove warning
        expect(tr.classList.contains('--is-warning')).toBe(false);

        // Ensure onChange was called to propagate to parent
        expect(mockOnChange).toHaveBeenCalledWith(2, {
            ...row,
            note: 12,
            isEdited: true
        });
    });

    it('adds focused class on input focus', () => {
        const row = { nom: 'Test', note: 10, confiance: 0.9 };
        const { container } = render(<ReviewCell index={0} row={row} onChange={mockOnChange} />);

        const tr = container.querySelector('tr');
        const input = screen.getByDisplayValue('10');

        fireEvent.focus(input);
        expect(tr.classList.contains('--is-focused')).toBe(true);

        fireEvent.blur(input);
        expect(tr.classList.contains('--is-focused')).toBe(false);
    });
});

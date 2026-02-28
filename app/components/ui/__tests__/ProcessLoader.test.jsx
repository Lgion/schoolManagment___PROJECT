import React from 'react';
import { render, screen } from '@testing-library/react';
import ProcessLoader from '../ProcessLoader';

describe('ProcessLoader', () => {
    it('renders with default message', () => {
        render(<ProcessLoader />);
        expect(screen.getByText('Traitement en cours...')).toBeTruthy();
    });

    it('renders with custom message', () => {
        render(<ProcessLoader message="Custom process" />);
        expect(screen.getByText('Custom process')).toBeTruthy();
    });
});

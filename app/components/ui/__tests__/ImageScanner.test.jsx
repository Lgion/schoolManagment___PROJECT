import React from 'react';
import { render, screen } from '@testing-library/react';
import ImageScanner from '../ImageScanner';

describe('ImageScanner', () => {
    it('renders the scanner button initially', () => {
        render(<ImageScanner classeId="123" />);
        expect(screen.getByText('Scanner une classe')).toBeTruthy();
    });
});

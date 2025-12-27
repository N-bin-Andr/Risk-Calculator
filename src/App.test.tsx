import React from 'react';
import { render, screen } from '@testing-library/react';
import App from './App';

// Типизируем тест
test('renders learn react link', () => {
  render(<App />);
  const linkElement = screen.getByText(/MyRiskCalculator/i);
  expect(linkElement).toBeInTheDocument();
});

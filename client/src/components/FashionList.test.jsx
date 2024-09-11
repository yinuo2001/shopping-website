import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom/extend-expect';
import axios from 'axios';
import { useAuth0 } from '@auth0/auth0-react';
import { useAuthToken } from '../AuthTokenContext';
import FashionList from './FashionList';
import { BrowserRouter as Router } from 'react-router-dom';

jest.mock('axios');
jest.mock('@auth0/auth0-react');
jest.mock('../AuthTokenContext');


useAuth0.mockReturnValue({
  loginWithRedirect: jest.fn(),
  logout: jest.fn(),
  isAuthenticated: true,
  user: { name: 'John Doe' },
});

useAuthToken.mockReturnValue({
  accessToken: 'mock-access-token',
});

test('renders FashionList component', async () => {
  axios.get.mockResolvedValueOnce({
    data: [
      { id: 1, name: 'Product 1', price: 100, picture: 'product1.jpg' },
      { id: 2, name: 'Product 2', price: 200, picture: 'product2.jpg' },
    ],
  });

  global.fetch = jest.fn(() =>
    Promise.resolve({
      ok: true,
      text: () => Promise.resolve(JSON.stringify({ products: [] })),
    })
  );

  render(
    <Router>
      <FashionList />
    </Router>
  );

  expect(screen.getByText('Loading location...')).toBeInTheDocument();

  await waitFor(() => {
    expect(screen.getByText('Product 1')).toBeInTheDocument();
    expect(screen.getByText('$100.00')).toBeInTheDocument();
    expect(screen.getByText('Product 2')).toBeInTheDocument();
    expect(screen.getByText('$200.00')).toBeInTheDocument();
  });
});

test('displays location', async () => {
  axios.request.mockResolvedValueOnce({
    data: {
      city: { name: 'City Name' },
      country: { name: 'Country Name' },
    },
  });

  render(
    <Router>
      <FashionList />
    </Router>
  );

  await waitFor(() => {
    expect(screen.getByText('City Name, Country Name')).toBeInTheDocument();
  });
});

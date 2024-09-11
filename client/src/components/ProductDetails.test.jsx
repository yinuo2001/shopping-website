import React from 'react';
import { render, screen, waitFor, fireEvent } from '@testing-library/react';
import '@testing-library/jest-dom/extend-expect';
import axios from 'axios';
import { useAuth0 } from '@auth0/auth0-react';
import { useAuthToken } from '../AuthTokenContext';
import ProductDetails from './ProductDetails';
import { BrowserRouter as Router } from 'react-router-dom';

jest.mock('axios');
jest.mock('@auth0/auth0-react');
jest.mock('../AuthTokenContext');

// Mock the useAuth0 hook
useAuth0.mockReturnValue({
  loginWithRedirect: jest.fn(),
  logout: jest.fn(),
  isAuthenticated: true,
  user: { name: 'John Doe' },
});

// Mock the useAuthToken hook
useAuthToken.mockReturnValue({
  accessToken: 'mock-access-token',
});

// Mock the fetch function
global.fetch = jest.fn();

test('renders ProductDetails component and displays product info', async () => {
  // Mock API responses
  axios.request.mockResolvedValueOnce({
    data: {
      city: { name: 'City Name' },
      country: { name: 'Country Name' },
    },
  });

  global.fetch.mockImplementationOnce(() =>
    Promise.resolve({
      ok: true,
      json: () => Promise.resolve({
        id: 1,
        name: 'Product Name',
        price: 99.99,
        description: 'Product Description',
        picture: 'product.jpg',
      }),
    })
  ).mockImplementationOnce(() =>
    Promise.resolve({
      ok: true,
      text: () => Promise.resolve(JSON.stringify({ products: [] })),
    })
  );

  render(
    <Router>
      <ProductDetails />
    </Router>
  );

  expect(screen.getByText('Loading location...')).toBeInTheDocument();

  await waitFor(() => {
    expect(screen.getByText('Product Name')).toBeInTheDocument();
    expect(screen.getByText('$99.99')).toBeInTheDocument();
    expect(screen.getByText('Product Description')).toBeInTheDocument();
  });
});

test('handles Add to Cart functionality', async () => {
  global.fetch.mockImplementationOnce(() =>
    Promise.resolve({
      ok: true,
      json: () => Promise.resolve({
        id: 1,
        name: 'Product Name',
        price: 99.99,
        description: 'Product Description',
        picture: 'product.jpg',
      }),
    })
  ).mockImplementationOnce(() =>
    Promise.resolve({
      ok: true,
      text: () => Promise.resolve(JSON.stringify({ products: [] })),
    })
  ).mockImplementationOnce(() =>
    Promise.resolve({
      ok: true,
    })
  );

  render(
    <Router>
      <ProductDetails />
    </Router>
  );

  await waitFor(() => {
    expect(screen.getByText('Product Name')).toBeInTheDocument();
  });

  const addButton = screen.getByText('Add to Cart');
  fireEvent.click(addButton);

  await waitFor(() => {
    expect(fetch).toHaveBeenCalledWith(
      `${process.env.REACT_APP_API_URL}/verify-user/products/1`,
      expect.objectContaining({
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer mock-access-token`,
        },
      })
    );
  });
});

test('shows error message when product data cannot be fetched', async () => {
  global.fetch.mockImplementationOnce(() =>
    Promise.reject(new Error('Network error'))
  );

  render(
    <Router>
      <ProductDetails />
    </Router>
  );

  await waitFor(() => {
    expect(screen.getByText("There's no such product...")).toBeInTheDocument();
  });
});

test('shows alert when adding product to cart without login', async () => {
  useAuth0.mockReturnValue({
    loginWithRedirect: jest.fn(),
    logout: jest.fn(),
    isAuthenticated: false,
    user: null,
  });

  global.fetch.mockImplementationOnce(() =>
    Promise.resolve({
      ok: true,
      json: () => Promise.resolve({
        id: 1,
        name: 'Product Name',
        price: 99.99,
        description: 'Product Description',
        picture: 'product.jpg',
      }),
    })
  ).mockImplementationOnce(() =>
    Promise.resolve({
      ok: true,
      text: () => Promise.resolve(JSON.stringify({ products: [] })),
    })
  );

  render(
    <Router>
      <ProductDetails />
    </Router>
  );

  await waitFor(() => {
    expect(screen.getByText('Product Name')).toBeInTheDocument();
  });

  const addButton = screen.getByText('Add to Cart');
  fireEvent.click(addButton);

  await waitFor(() => {
    expect(window.alert).toHaveBeenCalledWith('Please login to add products to your cart.');
  });
});

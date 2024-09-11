import React from 'react';
import { render, screen, waitFor, fireEvent } from '@testing-library/react';
import '@testing-library/jest-dom/extend-expect';
import axios from 'axios';
import { useAuth0 } from '@auth0/auth0-react';
import { useAuthToken } from '../AuthTokenContext';
import Comments from './Comments';
import { BrowserRouter as Router } from 'react-router-dom';

jest.mock('axios');
jest.mock('@auth0/auth0-react');
jest.mock('../AuthTokenContext');

const mockLoginWithRedirect = jest.fn();
const mockLogout = jest.fn();

useAuth0.mockReturnValue({
  loginWithRedirect: mockLoginWithRedirect,
  logout: mockLogout,
  isAuthenticated: true,
  user: { email: 'user@example.com', sub: 'user-sub' },
});

useAuthToken.mockReturnValue({
  accessToken: 'mock-access-token',
});

global.fetch = jest.fn();

test('renders Comments component and displays comments', async () => {
  // Mock API responses
  axios.get.mockImplementationOnce(() =>
    Promise.resolve({
      data: [
        { id: 1, text: 'This is a comment', userName: 'John Doe', userId: 'user-sub' },
      ],
    })
  );

  axios.request.mockResolvedValueOnce({
    data: {
      city: { name: 'City Name' },
      country: { name: 'Country Name' },
    },
  });

  render(
    <Router>
      <Comments />
    </Router>
  );

  await waitFor(() => {
    expect(screen.getByText('Comments')).toBeInTheDocument();
    expect(screen.getByText('This is a comment')).toBeInTheDocument();
  });
});

test('handles posting a comment', async () => {
  axios.get.mockImplementationOnce(() =>
    Promise.resolve({
      data: [
        { id: 1, text: 'This is a comment', userName: 'John Doe', userId: 'user-sub' },
      ],
    })
  );
  
  global.fetch.mockImplementationOnce(() =>
    Promise.resolve({
      ok: true,
      json: () => Promise.resolve({
        id: 2,
        text: 'New comment',
        userName: 'John Doe',
      }),
    })
  );

  render(
    <Router>
      <Comments />
    </Router>
  );

  await waitFor(() => {
    expect(screen.getByText('Comments')).toBeInTheDocument();
  });

  fireEvent.change(screen.getByPlaceholderText('Please provide your feedback to our website here...'), {
    target: { value: 'New comment' }
  });

  fireEvent.click(screen.getByText('Post'));

  await waitFor(() => {
    expect(screen.getByText('New comment')).toBeInTheDocument();
  });
});

test('handles deleting a comment', async () => {
  axios.get.mockImplementationOnce(() =>
    Promise.resolve({
      data: [
        { id: 1, text: 'Comment to delete', userName: 'John Doe', userId: 'user-sub' },
      ],
    })
  );

  axios.delete.mockImplementationOnce(() =>
    Promise.resolve({ status: 200 })
  );

  render(
    <Router>
      <Comments />
    </Router>
  );

  await waitFor(() => {
    expect(screen.getByText('Comment to delete')).toBeInTheDocument();
  });

  fireEvent.click(screen.getByText('Delete'));

  await waitFor(() => {
    expect(screen.queryByText('Comment to delete')).toBeNull();
  });
});

test('shows alert when not authenticated and tries to post a comment', async () => {
  useAuth0.mockReturnValue({
    loginWithRedirect: mockLoginWithRedirect,
    logout: mockLogout,
    isAuthenticated: false,
    user: null,
  });

  render(
    <Router>
      <Comments />
    </Router>
  );

  await waitFor(() => {
    expect(screen.getByPlaceholderText('Please log in to comment...')).toBeInTheDocument();
  });

  window.alert = jest.fn();
  fireEvent.change(screen.getByPlaceholderText('Please log in to comment...'), {
    target: { value: 'New comment' }
  });

  fireEvent.click(screen.getByText('Post'));

  await waitFor(() => {
    expect(window.alert).toHaveBeenCalledWith('You need to log in to post a comment. Redirecting to login...');
  });
});

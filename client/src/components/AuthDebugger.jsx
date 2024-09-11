import React from 'react';
import { useAuth0 } from '@auth0/auth0-react';

const AuthDebugger = () => {
  const { user, isAuthenticated, getAccessTokenSilently } = useAuth0();
  const [token, setToken] = React.useState('');

  const fetchToken = async () => {
    try {
      const accessToken = await getAccessTokenSilently();
      setToken(accessToken);
    } catch (error) {
      console.error('Error fetching access token:', error);
    }
  };

  React.useEffect(() => {
    if (isAuthenticated) {
      fetchToken();
    }
  }, [isAuthenticated]);

  return (
    <div className="auth-debugger">
      <h1>Auth Debugger</h1>
      {isAuthenticated ? (
        <div>
          <h2>Welcome, {user.name}</h2>
          <h3>Access Token:</h3>
          <pre>{token}</pre>
        </div>
      ) : (
        <p>Please log in to see the access token.</p>
      )}
    </div>
  );
};

export default AuthDebugger;

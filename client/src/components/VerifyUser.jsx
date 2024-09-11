import { useEffect } from "react";
import { useAuthToken } from "../AuthTokenContext";
import { useNavigate } from "react-router-dom";

export default function VerifyUser() {
  const navigate = useNavigate();
  const { accessToken } = useAuthToken();

  useEffect(() => {
    async function verifyUser() {
      try {
        const response = await fetch(`${process.env.REACT_APP_API_URL}/verify-user`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${accessToken}`,
          },
        });

        if (!response.ok) {
          throw new Error("Error verifying user");
        }

        const user = await response.json();

        if (user.auth0Id) {
          navigate("/");
        } else {
          console.error("User verification failed");
        }
      } catch (error) {
        console.error("Failed to verify user:", error);
      }
    }

    if (accessToken) {
      verifyUser();
    }
  }, [accessToken, navigate]);

  return (
    <div className="loading">
      <h1>Loading...</h1>
      <p>
        If you keep seeing this message after logging in, please verify your
        Network tab in the browser's Developer Tools to see if there are any
        errors.
      </p>
      <p>
        Check also your API terminal for any errors in the POST /verify-user
        route.
      </p>
    </div>
  );
}

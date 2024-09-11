import React, { useState, useEffect } from "react";
import { useAuth0 } from "@auth0/auth0-react";
import { useAuthToken } from "../AuthTokenContext";
import axios from "axios";
import { Link, useNavigate } from "react-router-dom";
import Topbar from "./Topbar";
import "../css/Profile.css";

const Profile = () => {
  const navigate = useNavigate();
  const { user, isAuthenticated, logout, loginWithRedirect } = useAuth0();
  const { accessToken } = useAuthToken();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [location, setLocation] = useState("Loading location...");
  const [cartCount, setCartCount] = useState(0);
  const [showSuccessPopup, setShowSuccessPopup] = useState(false);

  useEffect(() => {
    const fetchLocation = async () => {
      const options = {
        method: 'GET',
        url: 'https://ip-geo-location.p.rapidapi.com/ip/check',
        params: {
          format: 'json',
          language: 'en'
        },
        headers: {
          'x-rapidapi-key': process.env.REACT_APP_RAPIDAPI_KEY,
          'x-rapidapi-host': 'ip-geo-location.p.rapidapi.com'
        }
      };

      try {
        const response = await axios.request(options);
        const { city, country } = response.data;
        setLocation(`${city.name}, ${country.name}`);
      } catch (error) {
        console.error('Error fetching location data:', error);
        setLocation("Unable to load location");
      }
    };

    const fetchProfile = async () => {
      if (user && isAuthenticated) {
        try {
          const response = await fetch(`${process.env.REACT_APP_API_URL}/verify-user`, {
            method: 'GET',
            headers: {
              'Content-Type': 'application/json',
              Authorization: `Bearer ${accessToken}`,
            },
          });

          if (response.ok) {
            const data = await response.json();
            setName(data.name);
            setEmail(data.email);
          }

        } catch (error) {
          console.error("Error fetching profile:", error);
        }
      } else {
        loginWithRedirect();
      }
    };

    const fetchCart = async () => {
      if (isAuthenticated) {
        try {
          const response = await fetch(`${process.env.REACT_APP_API_URL}/verify-user/products`, {
            method: 'GET',
            headers: {
              'Content-Type': 'application/json',
              Authorization: `Bearer ${accessToken}`,
            },
          });

          if (response.ok) {
            const text = await response.text();
            if (text) {
              const data = JSON.parse(text);
              setCartCount(data.products.length);
            } else {
              setCartCount(0);
            }
          }

        } catch (error) {
          console.error("Error fetching cart:", error);
        }
      }
    }

    fetchLocation();
    fetchProfile();
    fetchCart();
  }, [isAuthenticated, user?.email, loginWithRedirect]);

  const handleUpdateProfile = async () => {
    if (name) {
      try {
        const response = await fetch(`${process.env.REACT_APP_API_URL}/verify-user`, {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${accessToken}`,
          },
          body: JSON.stringify({ name }),
        });
        if (response.ok) {
          const data = await response.json();
          setName(data.name);
          setShowSuccessPopup(true); // Show the success popup
          setTimeout(() => {
            setShowSuccessPopup(false);
            navigate("/");
          }, 3000);
        }
      } catch (error) {
        console.error("Error updating profile:", error);
      }
    }
  }

  return (
    <div>
      <Topbar
        location={location}
        cartCount={cartCount}
        loginWithRedirect={loginWithRedirect} 
        logout={logout} 
        name={name}
      />
      
      {/* header */}
      <header className="header">
        <Link to="/" className="main-header">Style Haven</Link>
      </header>   

      <div className="profile">
        <section className="profile-info">
          <div className="container box-items">
            <h1>Account Information</h1>
            <div className="content">
              <div className="right">
                <label>Email:</label>
                <input
                  type="text"
                  value={email || ''}
                  readOnly
                  required
                />
                <label>Name:</label>
                <input
                  type="text"
                  value={name.split("@")[0] || ''}
                  onChange={(e) => setName(e.target.value)}
                  required
                />
                <button className="button" onClick={handleUpdateProfile}>Update</button>
              </div>
            </div>
          </div>
        </section>
        {showSuccessPopup && (
          <div className="success-popup">
            Profile updated successfully!
          </div>
        )}
      </div>
    </div>
  );
};

export default Profile;

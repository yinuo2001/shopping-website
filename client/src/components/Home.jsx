import React, { useEffect, useState } from "react";
import "../css/Home.css";
import '@fortawesome/fontawesome-free/css/all.min.css';
import axios from "axios";
import { Link } from "react-router-dom";
import { useAuth0 } from "@auth0/auth0-react";
import { useAuthToken } from "../AuthTokenContext";
import Topbar from "./Topbar";

const Home = () => {
  const { accessToken } = useAuthToken();
  const [currentIndex, setCurrentIndex] = useState(0);
  // const [products, setProducts] = useState(null);
  const [cartCount, setCartCount] = useState(0);
  const { isAuthenticated, loginWithRedirect, logout, user } = useAuth0();
  const [location, setLocation] = useState("Loading location...");
  // const navigate = useNavigate();

  const images = [
    "res/home-slider-01.webp",
    "res/home-slider-02.webp",
    "res/home-slider-03.webp"
  ];


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

    const fetchCart = async () => {
      if (isAuthenticated) {
        try {
          if (!accessToken) return;
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
    };

    fetchLocation();
    fetchCart();
  }, [isAuthenticated, accessToken]);

  const handlePrev = () => {
    const newIndex = (currentIndex === 0) ? images.length - 1 : currentIndex - 1;
    setCurrentIndex(newIndex);
  };

  const handleNext = () => {
    const newIndex = (currentIndex === images.length - 1) ? 0 : currentIndex + 1;
    setCurrentIndex(newIndex);
  };

  return (
    <div className="home">
      <Topbar 
        location={location} 
        cartCount={cartCount} 
        loginWithRedirect={loginWithRedirect} 
        logout={logout} 
        user={user}
      />

      {/* Header */}
      <header className="header">
        <p className="main-header">Style Haven</p>
      </header>

      {/* Navigation Bar */}
      <nav className="nav">
        <Link to="/fashion-products">Fashion</Link>
        <Link to="/jewelry-products">High Jewelry</Link>
        <Link to="/comment">Comment</Link>
      </nav>

      {/* Image Slider */}
      <div className="image-slider">
        <button className="prev-btn" onClick={handlePrev}>
          <i className="fas fa-angle-left"></i>
        </button>
        <ul className="slider" style={{ transform: `translateX(${-currentIndex * 100}%)` }}>
          {images.map((image, index) => (
            <li key={index}>
              <img src={image} alt="stylish models" />
            </li>
          ))}
        </ul>
        <button className="next-btn" onClick={handleNext}>
          <i className="fas fa-angle-right"></i>
        </button>
      </div>

      {/* Footer */}
      <footer className="footer">
        <div className="footer-content">
          <div className="footer-links">
            <a href="#">About Us</a>
            <a href="#">Contact</a>
            <a href="#">Privacy Policy</a>
          </div>
          <p>&copy; 2024 Style Haven </p>
        </div>
      </footer>     
    </div>
  );
}

export default Home;

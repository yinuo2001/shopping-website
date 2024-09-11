import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useParams } from 'react-router-dom';
import Topbar from './Topbar';
import '../css/ProductDetails.css';
import { useAuth0 } from "@auth0/auth0-react";
import { useAuthToken } from '../AuthTokenContext';

const ProductDetails = ({  }) => {
  const { id } = useParams();
  const [product, setProduct] = useState(null);
  const [location, setLocation] = useState('Loading location...');
  const { loginWithRedirect, logout, user, isAuthenticated } = useAuth0();
  const [cartCount, setCartCount] = useState(0);
  const [ cartProducts, setCartProducts ] = useState([]);
  const { accessToken } = useAuthToken();

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
        setLocation('Unable to load location');
      }
    };

    const fetchProduct = async () => {
      try {
        const response = await fetch(`${process.env.REACT_APP_API_URL}/products/${id}`, 
          {
            method: 'GET',
            headers: {
              'Content-Type': 'application/json',
            },
          });
        if (response.ok) {
          const data = await response.json();
          setProduct(data);
        } else {
          console.error("response not ok" + response.status);
        }
      } catch (error) {
        console.error('Error fetching product data:', error);
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
              setCartProducts(data.products.map(product => product.id));
            } else {
              console.log("text is empty");
              setCartCount(0);
              setCartProducts([]);
            }
          }

        } catch (error) {
          console.error("Error fetching cart:", error);
        }
      }
    };

    fetchLocation();
    fetchProduct();
    fetchCart();
  }, [id]);

  const handleAddToCart = async () => {
    if (isAuthenticated) {
      if (cartProducts.includes(product.id)) {
        alert('This product is already in your cart.');
        return;
      }

      try {
        const response = await fetch(`${process.env.REACT_APP_API_URL}/verify-user/products/${id}`, {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${accessToken}`,
          },
        });

        if (response.ok) {
          setCartCount(cartCount + 1);
          setCartProducts([...cartProducts, product.id]);
          console.log(`Product added to cart: ${product.name}`);
        } else {
          console.error('Failed to add product to cart:', response.status);
          alert('error:' + response.status);
        }
      } catch (error) {
        console.error('Error adding product to cart:', error);
      };
    } else {
        alert('Please login to add products to your cart.');
      }
  };

  if (!product) return <p>There's no such product...</p>;

  return (
    <div className="product-details">
      <Topbar 
        location={location} 
        cartCount={cartCount}
        loginWithRedirect={loginWithRedirect} 
        logout={logout} 
        user={user} />
      <header className="header">
        <a href="/" className="main-header">Style Haven</a>
      </header>
      <div className="product-container">
        <img src={`/${product.picture}`} alt={product.name} className="product-image" />
        <div className="product-info">
          <h2 className="product-name">{product.name}</h2>
          <p className="product-price">${product.price.toFixed(2)}</p>
          <p className="product-description">{product.description}</p>
          <button onClick={handleAddToCart} className="add-to-cart">Add to Cart</button>
        </div>
      </div>
    </div>
  );
};

export default ProductDetails;

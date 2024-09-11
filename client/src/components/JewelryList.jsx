import React, { useEffect, useState } from "react";
import axios from "axios";
import { Link } from "react-router-dom";
import "../css/FashionList.css";
import Topbar from "./Topbar";

const JewelryList = () => {
  const [products, setProducts] = useState([]);
  const [location, setLocation] = useState("Loading location...");
  const [cartCount, setCartCount] = useState(0);

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

    const fetchProducts = async () => {
      try {
        const response = await axios.get(`${process.env.REACT_APP_API_URL}/products`);
        const filteredProducts = response.data.filter(product => product.id >= 13);
        setProducts(filteredProducts);
      } catch (error) {
        console.error("Error fetching jewelry products:", error);
      }
    };

    fetchLocation();
    fetchProducts();
  }, []);

  return (
    <div className="fashion-list">
      <Topbar location={location} cartCount={cartCount} />
      
      {/* header */}
      <header className="header">
        <Link to="/" className="main-header">Style Haven</Link>
      </header>      
      
      <div className="product-grid">
        {products.map((product) => (
          <div key={product.id} className="product-card">
            <Link to={`/products/${product.id}`}>
              <img 
                src={`/${product.picture}`}
                alt={product.name} 
                className="product-image" 
              />
              <div className="product-info">
                <h2 className="product-name">{product.name}</h2>
                <p className="product-price">${product.price.toFixed(2)}</p>
              </div>
            </Link>
          </div>
        ))}
      </div>
    </div>
  );
};

export default JewelryList;

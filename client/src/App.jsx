// import React, { useState, useEffect } from "react";
import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import { Auth0Provider, useAuth0 } from "@auth0/auth0-react";
// import { useAuthToken } from "./AuthTokenContext";
import Home from "./components/Home";
import VerifyUser from "./components/VerifyUser";
import Profile from "./components/Profile";
import FashionList from "./components/FashionList";
import JewelryList from "./components/JewelryList";
import ProductDetails from "./components/ProductDetails";
import Comment from "./components/Comment";
import ShoppingCart from "./components/ShoppingCart";
import AuthDebugger from "./components/AuthDebugger";
import { AuthTokenProvider } from "./AuthTokenContext";

function App() {
  // const { isAuthenticated } = useAuth0();
  // const [isLoggedIn, setIsLoggedIn] = useState(false);
  // const [cartCount, setCartCount] = useState(0);
  // const { accessToken } = useAuthToken();

  // useEffect(() => {
  //   setIsLoggedIn(isAuthenticated);
  // }, [isAuthenticated]);

  return (
    <Auth0Provider
      domain={process.env.REACT_APP_AUTH0_DOMAIN}
      clientId={process.env.REACT_APP_AUTH0_CLIENT_ID}
      redirectUri={`${window.location.origin}/verify-user`}
      audience={process.env.REACT_APP_AUTH0_AUDIENCE}
    >
      <AuthTokenProvider>
        <Router>
          <Routes>
            <Route path="/" element={<Home />} />
            <Route path="/verify-user" element={<VerifyUser />} />
            <Route path="/profile" element={<Profile />} />
            <Route path="/fashion-products" element={<FashionList />} />
            <Route path="/jewelry-products" element={<JewelryList />} />
            <Route 
              path="/products/:id" 
              element={<ProductDetails />} />
            <Route path="/comment" element={<Comment />} />
            <Route path="/shopping-cart" element={<ShoppingCart />} />
            <Route path="/auth-debugger" element={<AuthDebugger />} />
          </Routes>
        </Router>
      </AuthTokenProvider>  
    </Auth0Provider>
  );
}

export default App;

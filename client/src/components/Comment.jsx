import React, { useState, useEffect } from "react";
import { useAuth0 } from "@auth0/auth0-react";
import { useAuthToken } from "../AuthTokenContext";
import axios from "axios";
import { Link } from "react-router-dom";
import Topbar from "./Topbar";
import "../css/Comment.css";

const Comments = () => {
  const { accessToken } = useAuthToken();
  const { isAuthenticated, loginWithRedirect, logout, user } = useAuth0();
  const [comments, setComments] = useState([]);
  const [newComment, setNewComment] = useState("");
  const [name, setName] = useState("");
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

    const fetchComments = async () => {
      try {
        const response = await axios.get(`${process.env.REACT_APP_API_URL}/comments`);
        setComments(response.data);
      } catch (error) {
        console.error("Error fetching comments:", error);
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
            setName(data.name.split("@")[0]);
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
    fetchComments();
    fetchProfile();
    fetchCart();
  }, [isAuthenticated, user?.email, loginWithRedirect, user, accessToken]);

  const handlePostComment = async () => {
    if (isAuthenticated) {
      try {
        const newCommentResponse = await fetch(`${process.env.REACT_APP_API_URL}/comments`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${accessToken}`,
          },
          body: JSON.stringify({ text: newComment, email: user.email, userName: name }),
        });
        if (newCommentResponse.ok) {
          const data = await newCommentResponse.json();
          setComments([...comments, data]);
          setNewComment("");
        }
      } catch (error) {
        console.error("Error posting comment:", error);
      }
    } else {
      alert("You need to log in to post a comment. Redirecting to login...");
      loginWithRedirect();
    }
  };

  const handleDeleteComment = async (commentId) => {
    if (isAuthenticated) {
      try {
        await axios.delete(`${process.env.REACT_APP_API_URL}/comments/${commentId}`);
        const response = await axios.get(`${process.env.REACT_APP_API_URL}/comments`);
        setComments(response.data);
      } catch (error) {
        console.error("Error deleting comment:", error);
      }
    } else {
      alert("You need to log in to delete a comment.");
      loginWithRedirect();
    }
  };

  return (
    <div>
      <Topbar
        location={location}
        cartCount={cartCount}
        loginWithRedirect={loginWithRedirect} 
        logout={logout} 
        name={name}
      />
      <div className="comment">

        {/* Header */}
        <header className="header">
          <Link to="/" className="main-header">Style Haven</Link>
        </header>

        {/* Comment Section */}
        <header className="comment-header">
          <h2>Comments</h2>
        </header>

        <div className="comment-input">
          <textarea
            value={newComment}
            onChange={(e) => setNewComment(e.target.value)}
            placeholder={isAuthenticated ? "Please provide your feedback to our website here..." : "Please log in to comment..."}
          ></textarea>
          <button onClick={handlePostComment}>Post</button>
        </div>
        <hr />
        <div className="comments-list">
          {comments.map((comment) => {
            return (
              <div key={comment.id} className="comment-item">
                <p><strong>{comment.userName}</strong>: {comment.text}</p>
                {isAuthenticated && comment.userId === user.sub && (
                  <button onClick={() => handleDeleteComment(comment.id)}>Delete</button>
                )}
                <hr />
              </div>
            )
          })}
        </div>
      </div>
    </div>
  );
};

export default Comments;

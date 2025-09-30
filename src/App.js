import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { ThemeProvider } from './ThemeContext';
import Login from './Login';
import Register from './Register';
import Feed from './Feed';
import Profile from './Profile';
import TripDetails from './TripDetails';
import CreateTrip from './CreateTrip';
import PostDetail from './PostDetail';
import HashtagFeed from './HashtagFeed';
import './App.css';
import './themes.css';

function App() {
  return (
    <ThemeProvider>
      <Router>
        <div className="App">
          <Routes>
            <Route path="/login" element={<Login />} />
            <Route path="/register" element={<Register />} />
            <Route path="/feed" element={<Feed />} />
            <Route path="/profile" element={<Profile />} />
            <Route path="/create-trip" element={<CreateTrip />} />
            <Route path="/trip/:tripId" element={<TripDetails />} />
            <Route path="/post/:postId" element={<PostDetail />} />
            <Route path="/hashtag/:hashtag" element={<HashtagFeed />} />
            <Route path="/" element={<Navigate to="/login" replace />} />
          </Routes>
        </div>
      </Router>
    </ThemeProvider>
  );
}

export default App;

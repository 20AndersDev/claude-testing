import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { ThemeProvider } from './ThemeContext';
import { AuthProvider } from './AuthContext';
import Login from './Login';
import Register from './Register';
import Feed from './Feed';
import Profile from './Profile';
import TripDetails from './TripDetails';
import CreateTrip from './CreateTrip';
import PostDetail from './PostDetail';
import HashtagFeed from './HashtagFeed';
import CountryFeed from './CountryFeed';
import UserSearch from './UserSearch';
import PlaceDetail from './PlaceDetail';
import Settings from './Settings';
import Bookmarks from './Bookmarks';
import FollowRequests from './FollowRequests';
import Planner from './Planner';
import TripPlanDetails from './TripPlanDetails';
import BottomNav from './BottomNav';
import './App.css';
import './themes.css';

function App() {
  return (
    <ThemeProvider>
      <AuthProvider>
        <Router>
        <div className="App">
          <Routes>
            <Route path="/login" element={<Login />} />
            <Route path="/register" element={<Register />} />
            <Route path="/feed" element={<Feed />} />
            <Route path="/profile" element={<Profile />} />
            <Route path="/profile/:userId" element={<Profile />} />
            <Route path="/create-trip" element={<CreateTrip />} />
            <Route path="/trip/:tripId" element={<TripDetails />} />
            <Route path="/post/:postId" element={<PostDetail />} />
            <Route path="/hashtag/:hashtag" element={<HashtagFeed />} />
            <Route path="/country/:countryName" element={<CountryFeed />} />
            <Route path="/search" element={<UserSearch />} />
            <Route path="/place/:placeId" element={<PlaceDetail />} />
            <Route path="/settings" element={<Settings />} />
            <Route path="/bookmarks" element={<Bookmarks />} />
            <Route path="/follow-requests" element={<FollowRequests />} />
            <Route path="/planner" element={<Planner />} />
            <Route path="/planner/:planId" element={<TripPlanDetails />} />
            <Route path="/" element={<Navigate to="/login" replace />} />
          </Routes>
          <BottomNav />
        </div>
      </Router>
      </AuthProvider>
    </ThemeProvider>
  );
}

export default App;

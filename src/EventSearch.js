import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Navbar from './Navbar';
import './EventSearch.css';

function EventSearch() {
  const navigate = useNavigate();
  const [searchQuery, setSearchQuery] = useState('');
  const [location, setLocation] = useState('');
  const [events, setEvents] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  const [selectedCategory, setSelectedCategory] = useState('');

  const categories = [
    { id: '', name: 'All Events' },
    { id: 'KZFzniwnSyZfZ7v7nJ', name: 'Music' },
    { id: 'KZFzniwnSyZfZ7v7nE', name: 'Sports' },
    { id: 'KZFzniwnSyZfZ7v7na', name: 'Arts & Theatre' },
    { id: 'KZFzniwnSyZfZ7v7n1', name: 'Film' },
    { id: 'KZFzniwnSyZfZ7v7nn', name: 'Miscellaneous' },
  ];

  const searchEvents = async () => {
    const apiKey = process.env.REACT_APP_TICKETMASTER_API_KEY;

    if (!apiKey) {
      setError('Ticketmaster API key is not configured. Please add REACT_APP_TICKETMASTER_API_KEY to your .env file');
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      // Build the API URL
      let url = `https://app.ticketmaster.com/discovery/v2/events.json?apikey=${apiKey}&size=20`;

      if (searchQuery.trim()) {
        url += `&keyword=${encodeURIComponent(searchQuery)}`;
      }

      if (location.trim()) {
        url += `&city=${encodeURIComponent(location)}`;
      }

      if (selectedCategory) {
        url += `&classificationId=${selectedCategory}`;
      }

      const response = await fetch(url);
      const data = await response.json();

      if (data._embedded && data._embedded.events) {
        setEvents(data._embedded.events);
      } else {
        setEvents([]);
      }
    } catch (err) {
      console.error('Error fetching events:', err);
      setError('Failed to fetch events. Please try again.');
      setEvents([]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSearch = (e) => {
    e.preventDefault();
    searchEvents();
  };

  // Load popular events on component mount
  useEffect(() => {
    searchEvents();
  }, []);

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      weekday: 'short',
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    });
  };

  const formatTime = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleTimeString('en-US', {
      hour: 'numeric',
      minute: '2-digit',
      hour12: true
    });
  };

  return (
    <>
      <Navbar />
      <div className="event-search-container">
        <div className="event-search-content">
          <div className="event-search-header">
            <h1 className="event-search-title">🎟️ Discover Events</h1>
            <p className="event-search-subtitle">Find concerts, sports, theater, and more</p>
          </div>

          <form onSubmit={handleSearch} className="event-search-form">
            <div className="search-inputs">
              <div className="search-input-group">
                <input
                  type="text"
                  placeholder="Search events (e.g., concerts, sports...)"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="event-search-input"
                />
              </div>

              <div className="search-input-group">
                <input
                  type="text"
                  placeholder="Location (e.g., New York, London...)"
                  value={location}
                  onChange={(e) => setLocation(e.target.value)}
                  className="event-search-input"
                />
              </div>

              <div className="search-input-group">
                <select
                  value={selectedCategory}
                  onChange={(e) => setSelectedCategory(e.target.value)}
                  className="event-category-select"
                >
                  {categories.map(cat => (
                    <option key={cat.id} value={cat.id}>{cat.name}</option>
                  ))}
                </select>
              </div>

              <button type="submit" className="event-search-btn" disabled={isLoading}>
                {isLoading ? 'Searching...' : 'Search'}
              </button>
            </div>
          </form>

          {error && (
            <div className="event-error">
              <p>{error}</p>
            </div>
          )}

          {isLoading ? (
            <div className="events-loading">
              <div className="loading-spinner"></div>
              <p>Finding amazing events...</p>
            </div>
          ) : (
            <div className="events-grid">
              {events.length > 0 ? (
                events.map((event) => (
                  <div key={event.id} className="event-card">
                    {event.images && event.images[0] && (
                      <div className="event-card-image">
                        <img src={event.images[0].url} alt={event.name} />
                        {event.classifications && event.classifications[0] && (
                          <span className="event-category-badge">
                            {event.classifications[0].segment?.name}
                          </span>
                        )}
                      </div>
                    )}

                    <div className="event-card-content">
                      <h3 className="event-card-title">{event.name}</h3>

                      {event.dates?.start?.localDate && (
                        <div className="event-card-date">
                          <span className="event-icon">📅</span>
                          <span>{formatDate(event.dates.start.localDate)}</span>
                          {event.dates?.start?.localTime && (
                            <span className="event-time-badge">
                              {formatTime(`${event.dates.start.localDate}T${event.dates.start.localTime}`)}
                            </span>
                          )}
                        </div>
                      )}

                      {event._embedded?.venues?.[0] && (
                        <div className="event-card-venue">
                          <span className="event-icon">📍</span>
                          <span>
                            {event._embedded.venues[0].name}
                            {event._embedded.venues[0].city?.name &&
                              ` - ${event._embedded.venues[0].city.name}`}
                          </span>
                        </div>
                      )}

                      {event.priceRanges && event.priceRanges[0] && (
                        <div className="event-card-price">
                          <span className="event-icon">💵</span>
                          <span>
                            ${event.priceRanges[0].min} - ${event.priceRanges[0].max}
                          </span>
                        </div>
                      )}

                      {event.url && (
                        <a
                          href={event.url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="event-card-btn"
                        >
                          Get Tickets
                        </a>
                      )}
                    </div>
                  </div>
                ))
              ) : (
                <div className="no-events">
                  <div className="no-events-icon">🎭</div>
                  <h3>No events found</h3>
                  <p>Try adjusting your search criteria</p>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </>
  );
}

export default EventSearch;

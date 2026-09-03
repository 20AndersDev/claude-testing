import React, { useState, useEffect, useRef } from 'react';
import './EventAutocomplete.css';

function EventAutocomplete({ value, onChange, onEventSelected, placeholder = "Search for events..." }) {
  const [searchResults, setSearchResults] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [showDropdown, setShowDropdown] = useState(false);
  const [selectedIndex, setSelectedIndex] = useState(-1);
  const dropdownRef = useRef(null);
  const inputRef = useRef(null);
  const debounceTimerRef = useRef(null);

  const API_KEY = process.env.REACT_APP_TICKETMASTER_API_KEY;

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setShowDropdown(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  const searchEvents = async (query) => {
    if (!query || query.trim().length < 2) {
      setSearchResults([]);
      setShowDropdown(false);
      return;
    }

    setIsLoading(true);

    try {
      // Search for events including past events (2 years back)
      const now = new Date();
      const twoYearsAgo = new Date();
      twoYearsAgo.setFullYear(now.getFullYear() - 2);

      // Format dates as YYYY-MM-DDTHH:mm:ssZ
      const startDateTime = twoYearsAgo.toISOString().replace(/\.\d{3}/, '');

      const url = `https://app.ticketmaster.com/discovery/v2/events.json?apikey=${API_KEY}&keyword=${encodeURIComponent(query)}&size=30&sort=date,desc&startDateTime=${startDateTime}`;

      const response = await fetch(url);

      if (!response.ok) {
        console.error('Ticketmaster API error:', response.status, response.statusText);
        throw new Error('Failed to fetch events');
      }

      const data = await response.json();
      console.log('Ticketmaster API response:', data);

      if (data._embedded && data._embedded.events) {
        const events = data._embedded.events.map(event => {
          // Extract venue information
          const venue = event._embedded?.venues?.[0];
          const city = venue?.city?.name;
          const country = venue?.country?.name;
          const location = city && country ? `${city}, ${country}` : city || country || 'Location TBA';

          // Extract event classification
          const classification = event.classifications?.[0];
          const segment = classification?.segment?.name?.toLowerCase();

          // Map Ticketmaster categories to our event types
          let eventType = 'other';
          if (segment) {
            if (segment.includes('music')) eventType = 'concert';
            else if (segment.includes('sports')) eventType = 'sports';
            else if (segment.includes('arts') || segment.includes('theatre')) eventType = 'theater';
            else if (segment.includes('film')) eventType = 'other';
          }

          // Get event date
          const startDate = event.dates?.start?.localDate;

          return {
            id: event.id,
            name: event.name,
            location: location,
            venue: venue?.name,
            city: city,
            country: country,
            eventType: eventType,
            date: startDate,
            image: event.images?.[0]?.url,
            url: event.url
          };
        });

        setSearchResults(events);
        setShowDropdown(true);
      } else {
        console.log('No events found in API response');
        setSearchResults([]);
        setShowDropdown(true); // Still show dropdown to offer custom option
      }
    } catch (error) {
      console.error('Error searching events:', error);
      setSearchResults([]);
      setShowDropdown(true); // Show dropdown with custom option even on error
    } finally {
      setIsLoading(false);
    }
  };

  const handleInputChange = (e) => {
    const query = e.target.value;
    onChange(query);

    // Debounce the API call
    if (debounceTimerRef.current) {
      clearTimeout(debounceTimerRef.current);
    }

    debounceTimerRef.current = setTimeout(() => {
      searchEvents(query);
    }, 300);
  };

  const handleEventSelect = (event) => {
    onChange(event.name);
    setShowDropdown(false);
    setSearchResults([]);

    if (onEventSelected) {
      onEventSelected({
        eventName: event.name,
        location: event.location,
        city: event.city,
        country: event.country,
        eventType: event.eventType,
        venue: event.venue,
        date: event.date,
        ticketmasterUrl: event.url
      });
    }
  };

  const handleKeyDown = (e) => {
    if (!showDropdown || searchResults.length === 0) return;

    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setSelectedIndex(prev =>
        prev < searchResults.length - 1 ? prev + 1 : prev
      );
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setSelectedIndex(prev => prev > 0 ? prev - 1 : -1);
    } else if (e.key === 'Enter') {
      e.preventDefault();
      if (selectedIndex >= 0 && selectedIndex < searchResults.length) {
        handleEventSelect(searchResults[selectedIndex]);
      }
    } else if (e.key === 'Escape') {
      setShowDropdown(false);
      setSelectedIndex(-1);
    }
  };

  const formatDate = (dateString) => {
    if (!dateString) return '';
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    });
  };

  const isPastEvent = (dateString) => {
    if (!dateString) return false;
    const eventDate = new Date(dateString);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    return eventDate < today;
  };

  return (
    <div className="event-autocomplete-wrapper" ref={dropdownRef}>
      <div className="event-input-container">
        <input
          ref={inputRef}
          type="text"
          value={value}
          onChange={handleInputChange}
          onKeyDown={handleKeyDown}
          onFocus={() => {
            if (searchResults.length > 0) {
              setShowDropdown(true);
            }
          }}
          placeholder={placeholder}
          className="trip-input event-autocomplete-input"
          autoComplete="off"
        />
        {isLoading && (
          <div className="event-loading">
            <span className="loading-spinner-small"></span>
          </div>
        )}
      </div>

      {showDropdown && searchResults.length > 0 && (
        <>
          <div className="event-dropdown">
            <div className="event-dropdown-header">
              <span className="event-dropdown-icon">🎫</span>
              <span className="event-dropdown-title">Ticketmaster Events</span>
            </div>
            <div className="event-results-list">
              {searchResults.map((event, index) => (
                <div
                  key={event.id}
                  className={`event-result-item ${index === selectedIndex ? 'selected' : ''}`}
                  onClick={() => handleEventSelect(event)}
                  onMouseEnter={() => setSelectedIndex(index)}
                >
                  {event.image && (
                    <div className="event-result-image">
                      <img src={event.image} alt={event.name} />
                    </div>
                  )}
                  <div className="event-result-info">
                    <div className="event-result-name">
                      {event.name}
                      {event.date && isPastEvent(event.date) && (
                        <span className="past-event-badge">Past Event</span>
                      )}
                    </div>
                    <div className="event-result-meta">
                      <span className="event-result-location">📍 {event.location}</span>
                      {event.date && (
                        <span className="event-result-date">📅 {formatDate(event.date)}</span>
                      )}
                    </div>
                    {event.venue && (
                      <div className="event-result-venue">{event.venue}</div>
                    )}
                  </div>
                </div>
              ))}
            </div>
            <div className="event-dropdown-footer">
              <span>Powered by Ticketmaster</span>
            </div>
          </div>

          <div
            className="custom-event-button"
            onClick={() => {
              setShowDropdown(false);
              setSearchResults([]);
            }}
          >
            <div className="custom-event-button-content">
              <span className="custom-event-button-icon">✏️</span>
              <div className="custom-event-button-text">
                <div className="custom-event-button-title">Use custom event name</div>
                <div className="custom-event-button-subtitle">Can't find it? Use "{value}"</div>
              </div>
            </div>
          </div>
        </>
      )}

      {showDropdown && searchResults.length === 0 && !isLoading && value.trim().length >= 2 && (
        <div className="event-dropdown">
          <div className="event-no-results">
            <div className="no-results-icon">🔍</div>
            <p>No events found for "{value}"</p>
            <span className="no-results-hint">Try a different search term or use a custom name</span>
          </div>
          <div className="event-results-list">
            <div
              className="event-result-item custom-event-option"
              onClick={() => {
                setShowDropdown(false);
                setSearchResults([]);
              }}
              onMouseEnter={() => setSelectedIndex(-1)}
            >
              <div className="custom-event-icon">✏️</div>
              <div className="event-result-info">
                <div className="event-result-name">Use "{value}" as event name</div>
                <div className="custom-event-hint">Create a custom event entry</div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default EventAutocomplete;

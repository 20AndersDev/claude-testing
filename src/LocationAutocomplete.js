import React, { useEffect, useRef, useState } from 'react';
import './LocationAutocomplete.css';

function LocationAutocomplete({ value, onChange, onPlaceSelected, placeholder = "Location (e.g., Paris, Tokyo)" }) {
  const inputRef = useRef(null);
  const autocompleteRef = useRef(null);
  const [isLoaded, setIsLoaded] = useState(false);

  useEffect(() => {
    // Load Google Maps API script
    const loadGoogleMapsScript = () => {
      if (window.google && window.google.maps && window.google.maps.places) {
        setIsLoaded(true);
        return;
      }

      // Check if script is already being loaded
      const existingScript = document.querySelector('script[src*="maps.googleapis.com"]');
      if (existingScript) {
        existingScript.addEventListener('load', () => setIsLoaded(true));
        return;
      }

      const apiKey = process.env.REACT_APP_GOOGLE_MAPS_API_KEY;

      if (!apiKey) {
        console.error('Google Maps API key is not set. Please add REACT_APP_GOOGLE_MAPS_API_KEY to your .env file');
        return;
      }

      const script = document.createElement('script');
      script.src = `https://maps.googleapis.com/maps/api/js?key=${apiKey}&libraries=places`;
      script.async = true;
      script.defer = true;
      script.id = 'google-maps-script';
      script.onload = () => setIsLoaded(true);
      script.onerror = () => {
        console.error('Failed to load Google Maps API');
      };
      document.head.appendChild(script);
    };

    loadGoogleMapsScript();
  }, []);

  useEffect(() => {
    if (!isLoaded || !inputRef.current || !window.google || !window.google.maps || !window.google.maps.places) return;

    try {
      // Initialize Google Places Autocomplete
      autocompleteRef.current = new window.google.maps.places.Autocomplete(inputRef.current, {
        types: ['(cities)'], // Restrict to cities
        fields: ['address_components', 'formatted_address', 'geometry', 'name']
      });

      // Listen for place selection
      const listener = autocompleteRef.current.addListener('place_changed', () => {
        const place = autocompleteRef.current.getPlace();

        if (!place.address_components) {
          console.log('No address components found');
          return;
        }

        // Extract city and country
        let city = '';
        let country = '';

        place.address_components.forEach(component => {
          const types = component.types;

          if (types.includes('locality')) {
            city = component.long_name;
          } else if (types.includes('administrative_area_level_1') && !city) {
            city = component.long_name;
          }

          if (types.includes('country')) {
            country = component.long_name;
          }
        });

        const locationString = city && country ? `${city}, ${country}` : place.formatted_address;

        if (onPlaceSelected) {
          onPlaceSelected({
            location: locationString,
            city: city || place.name,
            country: country,
            fullAddress: place.formatted_address,
            coordinates: place.geometry ? {
              lat: place.geometry.location.lat(),
              lng: place.geometry.location.lng()
            } : null
          });
        }
      });

      return () => {
        if (listener) {
          window.google.maps.event.removeListener(listener);
        }
      };
    } catch (error) {
      console.error('Error initializing Google Places Autocomplete:', error);
    }
  }, [isLoaded, onPlaceSelected]);

  const handleInputChange = (e) => {
    if (onChange) {
      onChange(e.target.value);
    }
  };

  return (
    <div className="location-autocomplete-wrapper">
      <input
        ref={inputRef}
        type="text"
        value={value}
        onChange={handleInputChange}
        placeholder={placeholder}
        className="trip-input location-autocomplete-input"
        autoComplete="off"
      />
      {!isLoaded && (
        <div className="location-loading">
          <span className="loading-spinner-small"></span>
        </div>
      )}
    </div>
  );
}

export default LocationAutocomplete;

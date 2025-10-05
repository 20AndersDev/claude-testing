import React, { useState, useEffect } from 'react';
import {
  ComposableMap,
  Geographies,
  Geography,
  ZoomableGroup
} from 'react-simple-maps';
import { supabase } from './supabaseClient';
import './VisitedCountriesMap.css';

const geoUrl = 'https://cdn.jsdelivr.net/npm/world-atlas@2/countries-110m.json';

function VisitedCountriesMap({ userId, isOwnProfile }) {
  const [visitedCountries, setVisitedCountries] = useState([]);
  const [selectedCountry, setSelectedCountry] = useState(null);
  const [hoveredCountry, setHoveredCountry] = useState(null);
  const [hoveredCountryName, setHoveredCountryName] = useState('');
  const [totalCountries, setTotalCountries] = useState(195); // Approximate number of countries
  const [isMapHovered, setIsMapHovered] = useState(false);
  const [zoom, setZoom] = useState(1);
  const [isExpanded, setIsExpanded] = useState(true);

  useEffect(() => {
    if (userId) {
      fetchVisitedCountries();
    }
  }, [userId]);

  const fetchVisitedCountries = async () => {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('visited_countries')
        .eq('id', userId)
        .single();

      if (error) throw error;
      setVisitedCountries(data?.visited_countries || []);
    } catch (error) {
      console.error('Error fetching visited countries:', error);
    }
  };

  const handleCountryClick = async (geo) => {
    if (!isOwnProfile) return;

    const countryName = geo.properties.name;
    const countryId = geo.id;

    const isVisited = visitedCountries.includes(countryId);
    let newVisitedCountries;

    if (isVisited) {
      // Remove country
      newVisitedCountries = visitedCountries.filter(id => id !== countryId);
    } else {
      // Add country
      newVisitedCountries = [...visitedCountries, countryId];
    }

    setVisitedCountries(newVisitedCountries);

    // Update in database
    try {
      const { error } = await supabase
        .from('profiles')
        .update({ visited_countries: newVisitedCountries })
        .eq('id', userId);

      if (error) throw error;
    } catch (error) {
      console.error('Error updating visited countries:', error);
      // Revert on error
      setVisitedCountries(visitedCountries);
    }
  };

  const percentageVisited = totalCountries > 0 ? ((visitedCountries.length / totalCountries) * 100).toFixed(1) : 0;

  const handleZoomIn = () => {
    setZoom(prevZoom => Math.min(prevZoom + 0.5, 4));
  };

  const handleZoomOut = () => {
    setZoom(prevZoom => Math.max(prevZoom - 0.5, 1));
  };

  const handleResetZoom = () => {
    setZoom(1);
  };

  return (
    <div className="visited-countries-map-container">
      <div className="map-header" onClick={() => setIsExpanded(!isExpanded)}>
        <div className="map-title-row">
          <h3>🌍 Countries Visited</h3>
          <div className="map-stats">
            <span className="stat-highlight">{visitedCountries.length}</span>
            <span className="stat-label">countries</span>
            <span className="stat-separator">•</span>
            <span className="stat-highlight">{percentageVisited}%</span>
            <span className="stat-label">of world</span>
          </div>
          <button className={`collapse-arrow ${isExpanded ? 'expanded' : 'collapsed'}`}>
            {isExpanded ? '▼' : '▶'}
          </button>
        </div>
      </div>

      {isExpanded && (
        <>

      <div
        className="map-wrapper"
        onMouseEnter={() => setIsMapHovered(true)}
        onMouseLeave={() => setIsMapHovered(false)}
      >
        <ComposableMap
          projectionConfig={{
            scale: 180,
            center: [10, 30]
          }}
          width={800}
          height={280}
        >
          <ZoomableGroup zoom={zoom}>
            <Geographies geography={geoUrl}>
              {({ geographies }) =>
                geographies.map((geo) => {
                  const isVisited = visitedCountries.includes(geo.id);
                  const isHovered = hoveredCountry === geo.id;

                  return (
                    <Geography
                      key={geo.rsmKey}
                      geography={geo}
                      onClick={() => handleCountryClick(geo)}
                      onMouseEnter={() => {
                        setHoveredCountry(geo.id);
                        setHoveredCountryName(geo.properties.name);
                      }}
                      onMouseLeave={() => {
                        setHoveredCountry(null);
                        setHoveredCountryName('');
                      }}
                      style={{
                        default: {
                          fill: isVisited ? '#059669' : '#e5e7eb',
                          stroke: '#fff',
                          strokeWidth: 0.5,
                          outline: 'none',
                          transition: 'all 0.2s ease'
                        },
                        hover: {
                          fill: isVisited ? '#047857' : '#d1d5db',
                          stroke: '#fff',
                          strokeWidth: 0.75,
                          outline: 'none',
                          cursor: isOwnProfile ? 'pointer' : 'default'
                        },
                        pressed: {
                          fill: isVisited ? '#065f46' : '#9ca3af',
                          stroke: '#fff',
                          strokeWidth: 0.75,
                          outline: 'none'
                        }
                      }}
                    />
                  );
                })
              }
            </Geographies>
          </ZoomableGroup>
        </ComposableMap>

        {hoveredCountryName && (
          <div className="country-tooltip">
            {hoveredCountryName}
          </div>
        )}

        {/* Instructions */}
        {isOwnProfile && isMapHovered && (
          <div className="map-instructions-overlay">
            Click on countries to mark them as visited
          </div>
        )}

        {/* Zoom Controls */}
        <div className={`zoom-controls ${isMapHovered ? 'visible' : ''}`}>
          <button
            className="zoom-btn zoom-in"
            onClick={handleZoomIn}
            disabled={zoom >= 4}
            title="Zoom in"
          >
            +
          </button>
          <button
            className="zoom-btn zoom-reset"
            onClick={handleResetZoom}
            disabled={zoom === 1}
            title="Reset zoom"
          >
            ⟲
          </button>
          <button
            className="zoom-btn zoom-out"
            onClick={handleZoomOut}
            disabled={zoom <= 1}
            title="Zoom out"
          >
            −
          </button>
        </div>
      </div>
      </>
      )}
    </div>
  );
}

export default VisitedCountriesMap;

import React, { useState, useEffect } from 'react';
import {
  ComposableMap,
  Geographies,
  Geography,
  ZoomableGroup
} from 'react-simple-maps';
import './WorldMap.css';

const geoUrl = "https://cdn.jsdelivr.net/npm/world-atlas@2/countries-110m.json";

// Country mapping for extracting from post locations
const countryMapping = {
    'france': 'FRA',
    'paris': 'FRA',
    'spain': 'ESP',
    'barcelona': 'ESP',
    'madrid': 'ESP',
    'japan': 'JPN',
    'tokyo': 'JPN',
    'kyoto': 'JPN',
    'italy': 'ITA',
    'rome': 'ITA',
    'milan': 'ITA',
    'germany': 'DEU',
    'berlin': 'DEU',
    'munich': 'DEU',
    'uk': 'GBR',
    'england': 'GBR',
    'london': 'GBR',
    'usa': 'USA',
    'america': 'USA',
    'new york': 'USA',
    'california': 'USA',
    'los angeles': 'USA',
    'australia': 'AUS',
    'sydney': 'AUS',
    'melbourne': 'AUS',
    'canada': 'CAN',
    'toronto': 'CAN',
    'vancouver': 'CAN',
    'brazil': 'BRA',
    'rio de janeiro': 'BRA',
    'sao paulo': 'BRA',
    'india': 'IND',
    'mumbai': 'IND',
    'delhi': 'IND',
    'china': 'CHN',
    'beijing': 'CHN',
    'shanghai': 'CHN',
    'russia': 'RUS',
    'moscow': 'RUS',
    'thailand': 'THA',
    'bangkok': 'THA',
    'south korea': 'KOR',
    'seoul': 'KOR',
    'netherlands': 'NLD',
    'amsterdam': 'NLD',
    'portugal': 'PRT',
    'lisbon': 'PRT',
    'greece': 'GRC',
    'athens': 'GRC',
    'turkey': 'TUR',
    'istanbul': 'TUR',
    'egypt': 'EGY',
    'cairo': 'EGY',
    'morocco': 'MAR',
    'marrakech': 'MAR',
    'south africa': 'ZAF',
    'cape town': 'ZAF',
    'mexico': 'MEX',
    'mexico city': 'MEX',
    'argentina': 'ARG',
    'buenos aires': 'ARG',
    'chile': 'CHL',
    'santiago': 'CHL',
    'norway': 'NOR',
    'oslo': 'NOR',
    'sweden': 'SWE',
    'stockholm': 'SWE',
    'finland': 'FIN',
    'helsinki': 'FIN',
    'denmark': 'DNK',
    'copenhagen': 'DNK',
    'iceland': 'ISL',
    'reykjavik': 'ISL',
    'ireland': 'IRL',
    'dublin': 'IRL',
    'switzerland': 'CHE',
    'zurich': 'CHE',
    'austria': 'AUT',
    'vienna': 'AUT',
    'poland': 'POL',
    'warsaw': 'POL',
    'czech republic': 'CZE',
    'prague': 'CZE',
    'hungary': 'HUN',
    'budapest': 'HUN',
    'croatia': 'HRV',
    'dubrovnik': 'HRV'
};

function WorldMap({ userPosts, visitedCountries: propVisitedCountries, onCountryToggle }) {
  const [visitedCountries, setVisitedCountries] = useState(new Set());
  const [hoveredCountry, setHoveredCountry] = useState(null);

  // Initialize visited countries from props or extract from posts
  useEffect(() => {
    if (propVisitedCountries) {
      setVisitedCountries(new Set(propVisitedCountries));
    } else if (userPosts) {
      const countries = new Set();

      userPosts.forEach(post => {
        if (post.location) {
          const location = post.location.toLowerCase();
          Object.entries(countryMapping).forEach(([key, countryCode]) => {
            if (location.includes(key)) {
              countries.add(countryCode);
            }
          });
        }
      });

      setVisitedCountries(countries);
    }
  }, [userPosts, propVisitedCountries]);

  const handleCountryClick = (geo) => {
    const countryId = geo.properties.ISO_A3 || geo.id || geo.properties.id;
    const countryName = geo.properties.NAME || geo.properties.name || geo.properties.NAME_EN;

    if (onCountryToggle) {
      // If controlled mode, call the parent handler
      onCountryToggle(countryId, countryName);
    } else {
      // If uncontrolled mode, manage state locally
      const newVisitedCountries = new Set(visitedCountries);
      if (newVisitedCountries.has(countryId)) {
        newVisitedCountries.delete(countryId);
      } else {
        newVisitedCountries.add(countryId);
      }
      setVisitedCountries(newVisitedCountries);
    }
  };

  const isCountryVisited = (countryId) => {
    return visitedCountries.has(countryId);
  };

  const getCountryFill = (geo) => {
    const countryId = geo.properties.ISO_A3 || geo.id || geo.properties.id;
    if (isCountryVisited(countryId)) {
      return "#3B82C7"; // Ocean blue for visited countries
    }
    if (hoveredCountry && hoveredCountry.id === countryId) {
      return "#60A5FA"; // Light blue on hover
    }
    return "#E2E8F0"; // Soft gray for unvisited countries
  };

  const getCountryStats = () => {
    const visitedCount = visitedCountries.size;
    // Approximate total countries in the world
    const totalCountries = 195;
    const percentage = ((visitedCount / totalCountries) * 100).toFixed(1);

    return {
      visited: visitedCount,
      total: totalCountries,
      percentage
    };
  };

  const stats = getCountryStats();

  return (
    <div className="world-map-container">
      <div className="map-legend">
        <div className="legend-item">
          <div className="legend-color visited"></div>
          <span>Visited ({stats.visited} countries • {stats.percentage}% of world)</span>
        </div>
      </div>

      <div className="map-wrapper">
        <ComposableMap
          projectionConfig={{
            scale: 140,
            center: [0, 20]
          }}
          width={800}
          height={400}
        >
          <ZoomableGroup>
            <Geographies geography={geoUrl}>
              {({ geographies }) =>
                geographies.map((geo) => (
                  <Geography
                    key={geo.rsmKey}
                    geography={geo}
                    fill={getCountryFill(geo)}
                    stroke="#2C3E50"
                    strokeWidth={0.3}
                    style={{
                      default: {
                        outline: "none",
                      },
                      hover: {
                        outline: "none",
                        cursor: "pointer",
                      },
                      pressed: {
                        outline: "none",
                      },
                    }}
                    onMouseEnter={() => {
                      const countryId = geo.properties.ISO_A3 || geo.id || geo.properties.id;
                      const countryName = geo.properties.NAME || geo.properties.name || geo.properties.NAME_EN;
                      setHoveredCountry({ id: countryId, name: countryName });
                    }}
                    onMouseLeave={() => {
                      setHoveredCountry(null);
                    }}
                    onClick={() => handleCountryClick(geo)}
                  />
                ))
              }
            </Geographies>
          </ZoomableGroup>
        </ComposableMap>
      </div>

      {hoveredCountry && (
        <div className="country-tooltip">
          <div className="country-name">{hoveredCountry.name}</div>
          <div className="country-status">
            {visitedCountries.has(hoveredCountry.id) ? '✓ Visited' : 'Not visited'} • Click to {visitedCountries.has(hoveredCountry.id) ? 'remove' : 'mark as visited'}
          </div>
        </div>
      )}

      <div className="map-instructions">
        <p>💡 Click on countries to mark them as visited or unvisited</p>
        <p>🗺️ Use mouse wheel to zoom in/out, click and drag to pan</p>
      </div>
    </div>
  );
}

export default WorldMap;
import React, { useState, useEffect } from 'react';
import './WorldMap.css';

function WorldMap({ userPosts }) {
  const [visitedCountries, setVisitedCountries] = useState(new Set());
  const [hoveredCountry, setHoveredCountry] = useState(null);

  // Country mapping - simplified list of countries with their codes
  const countryMapping = {
    'france': 'FR',
    'paris': 'FR',
    'spain': 'ES',
    'barcelona': 'ES',
    'madrid': 'ES',
    'japan': 'JP',
    'tokyo': 'JP',
    'kyoto': 'JP',
    'italy': 'IT',
    'rome': 'IT',
    'milan': 'IT',
    'germany': 'DE',
    'berlin': 'DE',
    'munich': 'DE',
    'uk': 'GB',
    'england': 'GB',
    'london': 'GB',
    'usa': 'US',
    'america': 'US',
    'new york': 'US',
    'california': 'US',
    'los angeles': 'US',
    'australia': 'AU',
    'sydney': 'AU',
    'melbourne': 'AU',
    'canada': 'CA',
    'toronto': 'CA',
    'vancouver': 'CA',
    'brazil': 'BR',
    'rio de janeiro': 'BR',
    'sao paulo': 'BR',
    'india': 'IN',
    'mumbai': 'IN',
    'delhi': 'IN',
    'china': 'CN',
    'beijing': 'CN',
    'shanghai': 'CN',
    'russia': 'RU',
    'moscow': 'RU',
    'thailand': 'TH',
    'bangkok': 'TH',
    'south korea': 'KR',
    'seoul': 'KR',
    'netherlands': 'NL',
    'amsterdam': 'NL',
    'portugal': 'PT',
    'lisbon': 'PT',
    'greece': 'GR',
    'athens': 'GR',
    'turkey': 'TR',
    'istanbul': 'TR',
    'egypt': 'EG',
    'cairo': 'EG',
    'morocco': 'MA',
    'marrakech': 'MA',
    'south africa': 'ZA',
    'cape town': 'ZA',
    'mexico': 'MX',
    'mexico city': 'MX',
    'argentina': 'AR',
    'buenos aires': 'AR',
    'chile': 'CL',
    'santiago': 'CL',
    'norway': 'NO',
    'oslo': 'NO',
    'sweden': 'SE',
    'stockholm': 'SE',
    'finland': 'FI',
    'helsinki': 'FI',
    'denmark': 'DK',
    'copenhagen': 'DK',
    'iceland': 'IS',
    'reykjavik': 'IS',
    'ireland': 'IE',
    'dublin': 'IE',
    'switzerland': 'CH',
    'zurich': 'CH',
    'austria': 'AT',
    'vienna': 'AT',
    'poland': 'PL',
    'warsaw': 'PL',
    'czech republic': 'CZ',
    'prague': 'CZ',
    'hungary': 'HU',
    'budapest': 'HU',
    'croatia': 'HR',
    'dubrovnik': 'HR',
    'romania': 'RO',
    'bucharest': 'RO',
    'bulgaria': 'BG',
    'sofia': 'BG',
    'singapore': 'SG',
    'malaysia': 'MY',
    'kuala lumpur': 'MY',
    'indonesia': 'ID',
    'jakarta': 'ID',
    'bali': 'ID',
    'philippines': 'PH',
    'manila': 'PH',
    'vietnam': 'VN',
    'ho chi minh': 'VN',
    'hanoi': 'VN',
    'cambodia': 'KH',
    'phnom penh': 'KH',
    'laos': 'LA',
    'myanmar': 'MM',
    'sri lanka': 'LK',
    'maldives': 'MV',
    'nepal': 'NP',
    'kathmandu': 'NP',
    'bhutan': 'BT',
    'bangladesh': 'BD',
    'pakistan': 'PK',
    'afghanistan': 'AF',
    'iran': 'IR',
    'iraq': 'IQ',
    'israel': 'IL',
    'tel aviv': 'IL',
    'jordan': 'JO',
    'lebanon': 'LB',
    'syria': 'SY',
    'saudi arabia': 'SA',
    'uae': 'AE',
    'dubai': 'AE',
    'abu dhabi': 'AE',
    'qatar': 'QA',
    'kuwait': 'KW',
    'bahrain': 'BH',
    'oman': 'OM',
    'yemen': 'YE',
    'ethiopia': 'ET',
    'kenya': 'KE',
    'nairobi': 'KE',
    'tanzania': 'TZ',
    'uganda': 'UG',
    'rwanda': 'RW',
    'ghana': 'GH',
    'nigeria': 'NG',
    'lagos': 'NG',
    'senegal': 'SN',
    'ivory coast': 'CI',
    'cameroon': 'CM',
    'algeria': 'DZ',
    'tunisia': 'TN',
    'libya': 'LY',
    'sudan': 'SD',
    'botswana': 'BW',
    'namibia': 'NA',
    'zambia': 'ZM',
    'zimbabwe': 'ZW',
    'madagascar': 'MG',
    'mauritius': 'MU',
    'seychelles': 'SC',
    'new zealand': 'NZ',
    'auckland': 'NZ',
    'wellington': 'NZ',
    'fiji': 'FJ',
    'papua new guinea': 'PG',
    'solomon islands': 'SB',
    'vanuatu': 'VU',
    'samoa': 'WS',
    'tonga': 'TO',
    'cook islands': 'CK',
    'tahiti': 'PF',
    'french polynesia': 'PF',
    'guam': 'GU',
    'palau': 'PW',
    'micronesia': 'FM',
    'marshall islands': 'MH',
    'kiribati': 'KI',
    'tuvalu': 'TV',
    'nauru': 'NR'
  };

  // Extract visited countries from user posts
  useEffect(() => {
    const countries = new Set();

    userPosts.forEach(post => {
      if (post.location) {
        const location = post.location.toLowerCase();

        // Check for direct country matches
        Object.entries(countryMapping).forEach(([key, countryCode]) => {
          if (location.includes(key)) {
            countries.add(countryCode);
          }
        });
      }
    });

    setVisitedCountries(countries);
  }, [userPosts]);

  const getCountryStats = () => {
    const totalCountries = Object.keys(countryMapping).length;
    const visitedCount = visitedCountries.size;
    const percentage = ((visitedCount / totalCountries) * 100).toFixed(1);

    return {
      visited: visitedCount,
      total: totalCountries,
      percentage
    };
  };

  const stats = getCountryStats();

  // Simplified SVG world map with country paths
  const CountryPath = ({ countryCode, path, name }) => {
    const isVisited = visitedCountries.has(countryCode);

    return (
      <path
        d={path}
        className={`country ${isVisited ? 'visited' : 'unvisited'}`}
        onMouseEnter={() => setHoveredCountry({ code: countryCode, name, visited: isVisited })}
        onMouseLeave={() => setHoveredCountry(null)}
        data-country={countryCode}
      />
    );
  };

  return (
    <div className="world-map-container">
      <div className="map-header">
        <h3>🌍 Countries Explored</h3>
        <div className="map-stats">
          <div className="stat-item">
            <span className="stat-number">{stats.visited}</span>
            <span className="stat-label">Countries Visited</span>
          </div>
          <div className="stat-item">
            <span className="stat-number">{stats.percentage}%</span>
            <span className="stat-label">World Explored</span>
          </div>
        </div>
      </div>

      <div className="map-wrapper">
        <svg
          className="world-map"
          viewBox="0 0 1000 500"
          xmlns="http://www.w3.org/2000/svg"
        >
          {/* Simplified world map - major countries only */}

          {/* United States */}
          <CountryPath
            countryCode="US"
            name="United States"
            path="M159 206l-6 3-4 3-7-1-5-3-4-5-2-4h-5l-2 4-4 2-7 0-3-2-1-4 2-4 4-2 6 0 4-2 2-4 0-5-2-4-4-2-6 0-4-2-1-4 2-4 4-2 6 0 4-2 2-4 0-5-2-4-4-2z"
          />

          {/* Canada */}
          <CountryPath
            countryCode="CA"
            name="Canada"
            path="M100 100l50-10 60-5 50 0 40 5 30 10 20 15 10 20 0 25-10 20-20 15-30 10-40 5-50 0-60-5-50-10z"
          />

          {/* Brazil */}
          <CountryPath
            countryCode="BR"
            name="Brazil"
            path="M250 350l40-10 50-5 40 5 30 10 20 20 10 30 0 40-10 30-20 20-30 10-40 5-50-5-40-10z"
          />

          {/* Argentina */}
          <CountryPath
            countryCode="AR"
            name="Argentina"
            path="M220 400l30-5 25 0 20 5 15 10 10 15 5 20 0 25-5 20-10 15-15 10-20 5-25 0-30-5z"
          />

          {/* United Kingdom */}
          <CountryPath
            countryCode="GB"
            name="United Kingdom"
            path="M480 180l10-2 8 2 6 4 4 6 2 8-2 8-4 6-6 4-8 2-10-2z"
          />

          {/* France */}
          <CountryPath
            countryCode="FR"
            name="France"
            path="M470 200l15-3 12 3 9 6 6 9 3 12-3 12-6 9-9 6-12 3-15-3z"
          />

          {/* Spain */}
          <CountryPath
            countryCode="ES"
            name="Spain"
            path="M450 220l20-3 15 3 12 6 8 9 4 12-4 12-8 9-12 6-15 3-20-3z"
          />

          {/* Germany */}
          <CountryPath
            countryCode="DE"
            name="Germany"
            path="M510 190l12-2 10 2 8 4 6 6 4 8-4 8-6 6-8 4-10 2-12-2z"
          />

          {/* Italy */}
          <CountryPath
            countryCode="IT"
            name="Italy"
            path="M520 230l8-15 6-5 8-2 10 2 8 5 6 8 2 10-2 10-6 8-8 5-10 2-8-2-6-5z"
          />

          {/* Russia */}
          <CountryPath
            countryCode="RU"
            name="Russia"
            path="M560 120l80-10 100-5 80 5 60 10 40 20 20 30 0 40-20 30-40 20-60 10-80 5-100-5-80-10z"
          />

          {/* China */}
          <CountryPath
            countryCode="CN"
            name="China"
            path="M720 220l50-10 40-5 35 5 30 10 25 15 20 20 15 25 10 30 5 35-5 35-10 30-15 25-20 20-25 15-30 10-35 5-40-5-50-10z"
          />

          {/* Japan */}
          <CountryPath
            countryCode="JP"
            name="Japan"
            path="M850 240l15-5 12-2 10 2 8 5 6 8 2 10-2 10-6 8-8 5-10 2-12-2-15-5z M860 210l8-2 6 2 4 4 2 6-2 6-4 4-6 2-8-2z"
          />

          {/* India */}
          <CountryPath
            countryCode="IN"
            name="India"
            path="M650 280l25-8 30-5 25 5 20 8 15 12 12 15 8 20 5 25-5 25-8 20-12 15-15 12-20 8-25 5-30-5-25-8z"
          />

          {/* Australia */}
          <CountryPath
            countryCode="AU"
            name="Australia"
            path="M750 400l60-10 50-5 45 5 40 10 35 15 30 20 25 25 20 30 15 35 10 40 5 45-5 45-10 40-15 35-20 30-25 25-30 20-35 15-40 10-45 5-50-5-60-10z"
          />

          {/* South Africa */}
          <CountryPath
            countryCode="ZA"
            name="South Africa"
            path="M520 380l25-5 20 0 18 5 15 8 12 12 8 15 5 18 0 20-5 18-8 15-12 12-15 8-18 5-20 0-25-5z"
          />

          {/* Egypt */}
          <CountryPath
            countryCode="EG"
            name="Egypt"
            path="M540 260l15-3 12 3 10 6 8 9 6 12 3 15-3 15-6 12-8 9-10 6-12 3-15-3z"
          />

          {/* Mexico */}
          <CountryPath
            countryCode="MX"
            name="Mexico"
            path="M150 280l30-8 25-5 22 5 18 8 15 12 12 15 8 18 5 22-5 22-8 18-12 15-15 12-18 8-22 5-25-5-30-8z"
          />

          {/* Norway */}
          <CountryPath
            countryCode="NO"
            name="Norway"
            path="M500 120l8-15 6-10 4-8 2-6 0-4-2-6-4-8-6-10-8-15z"
          />

          {/* Sweden */}
          <CountryPath
            countryCode="SE"
            name="Sweden"
            path="M510 130l6-12 5-8 4-6 3-4 2-2 3-4 4-6 5-8 6-12z"
          />

          {/* Thailand */}
          <CountryPath
            countryCode="TH"
            name="Thailand"
            path="M720 300l8-5 10-3 12 3 10 5 8 8 5 10 3 12-3 12-5 10-8 8-10 5-12 3-10-3-8-5z"
          />

          {/* Indonesia */}
          <CountryPath
            countryCode="ID"
            name="Indonesia"
            path="M740 350l15-3 18 0 15 3 12 6 9 9 6 12 3 15-3 15-6 12-9 9-12 6-15 3-18 0-15-3z M780 360l10-2 12 0 10 2 8 4 6 6 4 8-4 8-6 6-8 4-10 2-12 0-10-2z"
          />

          {/* South Korea */}
          <CountryPath
            countryCode="KR"
            name="South Korea"
            path="M820 250l6-3 8-1 6 1 5 3 3 5 1 6-1 6-3 5-5 3-6 1-8-1-6-3z"
          />

          {/* Turkey */}
          <CountryPath
            countryCode="TR"
            name="Turkey"
            path="M550 240l20-5 18-2 15 2 12 5 9 8 6 11 2 14-2 14-6 11-9 8-12 5-15 2-18-2-20-5z"
          />

          {/* Netherlands */}
          <CountryPath
            countryCode="NL"
            name="Netherlands"
            path="M490 185l5-1 4 1 3 2 2 3 1 4-1 4-2 3-3 2-4 1-5-1z"
          />

        </svg>

        {hoveredCountry && (
          <div className="country-tooltip">
            <strong>{hoveredCountry.name}</strong>
            <span className={hoveredCountry.visited ? 'visited-status' : 'unvisited-status'}>
              {hoveredCountry.visited ? '✓ Visited' : 'Not visited'}
            </span>
          </div>
        )}
      </div>

      <div className="map-legend">
        <div className="legend-item">
          <div className="legend-color visited-color"></div>
          <span>Visited Countries</span>
        </div>
        <div className="legend-item">
          <div className="legend-color unvisited-color"></div>
          <span>Not Visited</span>
        </div>
      </div>
    </div>
  );
}

export default WorldMap;
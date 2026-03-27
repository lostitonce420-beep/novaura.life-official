import React, { useState, useEffect, useCallback } from 'react';
import {
  Cloud, Sun, CloudRain, CloudSnow, CloudLightning, Wind,
  Droplets, Eye, Thermometer, MapPin, RefreshCw, Search,
  Sunrise, Sunset, ArrowUp, ArrowDown, Loader2, CloudFog,
} from 'lucide-react';

const WMO_CODES = {
  0: { label: 'Clear sky', icon: Sun, color: 'text-yellow-400' },
  1: { label: 'Mainly clear', icon: Sun, color: 'text-yellow-300' },
  2: { label: 'Partly cloudy', icon: Cloud, color: 'text-gray-300' },
  3: { label: 'Overcast', icon: Cloud, color: 'text-gray-400' },
  45: { label: 'Foggy', icon: CloudFog, color: 'text-gray-400' },
  48: { label: 'Rime fog', icon: CloudFog, color: 'text-gray-400' },
  51: { label: 'Light drizzle', icon: CloudRain, color: 'text-blue-300' },
  53: { label: 'Drizzle', icon: CloudRain, color: 'text-blue-400' },
  55: { label: 'Heavy drizzle', icon: CloudRain, color: 'text-blue-500' },
  61: { label: 'Light rain', icon: CloudRain, color: 'text-blue-300' },
  63: { label: 'Rain', icon: CloudRain, color: 'text-blue-400' },
  65: { label: 'Heavy rain', icon: CloudRain, color: 'text-blue-500' },
  71: { label: 'Light snow', icon: CloudSnow, color: 'text-cyan-200' },
  73: { label: 'Snow', icon: CloudSnow, color: 'text-cyan-300' },
  75: { label: 'Heavy snow', icon: CloudSnow, color: 'text-cyan-400' },
  80: { label: 'Rain showers', icon: CloudRain, color: 'text-blue-400' },
  81: { label: 'Moderate showers', icon: CloudRain, color: 'text-blue-500' },
  82: { label: 'Heavy showers', icon: CloudRain, color: 'text-blue-600' },
  85: { label: 'Snow showers', icon: CloudSnow, color: 'text-cyan-300' },
  95: { label: 'Thunderstorm', icon: CloudLightning, color: 'text-purple-400' },
  96: { label: 'Thunderstorm + hail', icon: CloudLightning, color: 'text-purple-500' },
  99: { label: 'Heavy thunderstorm', icon: CloudLightning, color: 'text-purple-600' },
};

function getWeatherInfo(code) {
  return WMO_CODES[code] || WMO_CODES[0];
}

async function geocode(query) {
  const res = await fetch(`https://geocoding-api.open-meteo.com/v1/search?name=${encodeURIComponent(query)}&count=5&language=en`);
  const data = await res.json();
  return data.results || [];
}

async function fetchWeather(lat, lon) {
  const url = `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}`
    + `&current=temperature_2m,relative_humidity_2m,apparent_temperature,weather_code,wind_speed_10m,wind_direction_10m,surface_pressure`
    + `&hourly=temperature_2m,weather_code,precipitation_probability`
    + `&daily=weather_code,temperature_2m_max,temperature_2m_min,sunrise,sunset,precipitation_sum,wind_speed_10m_max`
    + `&temperature_unit=fahrenheit&wind_speed_unit=mph&precipitation_unit=inch&timezone=auto&forecast_days=7`;
  const res = await fetch(url);
  return res.json();
}

function StatCard({ icon: Icon, label, value, unit, color = 'text-gray-300' }) {
  return (
    <div className="bg-white/5 border border-white/[0.06] rounded-xl px-3 py-2.5">
      <div className="flex items-center gap-1.5 mb-1">
        <Icon className={`w-3.5 h-3.5 ${color}`} />
        <span className="text-[10px] text-gray-500 uppercase tracking-wider">{label}</span>
      </div>
      <p className="text-lg font-semibold text-gray-200">
        {value}<span className="text-xs text-gray-500 ml-0.5">{unit}</span>
      </p>
    </div>
  );
}

export default function WeatherWindow() {
  const [location, setLocation] = useState(null);
  const [weather, setWeather] = useState(null);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [searching, setSearching] = useState(false);
  const [error, setError] = useState(null);

  const loadWeather = useCallback(async (lat, lon, name) => {
    setLoading(true);
    setError(null);
    try {
      const data = await fetchWeather(lat, lon);
      setWeather(data);
      setLocation({ lat, lon, name });
      localStorage.setItem('novaura_weather_loc', JSON.stringify({ lat, lon, name }));
    } catch (err) {
      setError('Failed to load weather data');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    const saved = localStorage.getItem('novaura_weather_loc');
    if (saved) {
      try {
        const { lat, lon, name } = JSON.parse(saved);
        loadWeather(lat, lon, name);
        return;
      } catch { /* fall through */ }
    }
    // Default: try geolocation
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (pos) => loadWeather(pos.coords.latitude, pos.coords.longitude, 'Current Location'),
        () => loadWeather(40.7128, -74.006, 'New York') // fallback
      );
    } else {
      loadWeather(40.7128, -74.006, 'New York');
    }
  }, [loadWeather]);

  const handleSearch = async () => {
    if (!searchQuery.trim()) return;
    setSearching(true);
    try {
      const results = await geocode(searchQuery);
      setSearchResults(results);
    } catch {
      setSearchResults([]);
    } finally {
      setSearching(false);
    }
  };

  const selectLocation = (result) => {
    loadWeather(result.latitude, result.longitude, `${result.name}, ${result.country || ''}`);
    setSearchResults([]);
    setSearchQuery('');
  };

  const current = weather?.current;
  const daily = weather?.daily;
  const hourly = weather?.hourly;
  const weatherInfo = current ? getWeatherInfo(current.weather_code) : null;
  const WeatherIcon = weatherInfo?.icon || Sun;

  return (
    <div className="h-full flex flex-col bg-[#0a0a0f]">
      {/* Search bar */}
      <div className="px-4 py-3 border-b border-white/10">
        <div className="flex gap-2">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
            <input
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && handleSearch()}
              placeholder="Search city..."
              className="w-full pl-9 pr-3 py-2 bg-white/5 border border-white/10 rounded-lg text-sm text-gray-200 placeholder-gray-600 outline-none focus:border-primary/30"
            />
            {searchResults.length > 0 && (
              <div className="absolute top-full left-0 right-0 mt-1 bg-[#12121f] border border-white/10 rounded-lg z-10 overflow-hidden shadow-xl">
                {searchResults.map((r, i) => (
                  <button
                    key={i}
                    onClick={() => selectLocation(r)}
                    className="w-full flex items-center gap-2 px-3 py-2 hover:bg-white/5 text-left"
                  >
                    <MapPin className="w-3.5 h-3.5 text-gray-500 shrink-0" />
                    <span className="text-sm text-gray-200 truncate">{r.name}, {r.admin1 || ''} {r.country || ''}</span>
                  </button>
                ))}
              </div>
            )}
          </div>
          <button
            onClick={() => loadWeather(location?.lat, location?.lon, location?.name)}
            className="p-2 bg-white/5 border border-white/10 rounded-lg hover:bg-white/10 text-gray-400"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          </button>
        </div>
      </div>

      {loading && !weather ? (
        <div className="flex-1 flex items-center justify-center">
          <Loader2 className="w-8 h-8 text-primary animate-spin" />
        </div>
      ) : error ? (
        <div className="flex-1 flex items-center justify-center text-gray-500">
          <p>{error}</p>
        </div>
      ) : (
        <div className="flex-1 overflow-auto px-4 py-3 space-y-4">
          {/* Current conditions */}
          <div className="flex items-center justify-between">
            <div>
              <div className="flex items-center gap-1.5 mb-1">
                <MapPin className="w-3.5 h-3.5 text-gray-500" />
                <span className="text-sm text-gray-400">{location?.name}</span>
              </div>
              <div className="flex items-end gap-3">
                <span className="text-5xl font-bold text-gray-100">{Math.round(current?.temperature_2m)}°</span>
                <div className="pb-1.5">
                  <p className={`text-sm font-medium ${weatherInfo?.color}`}>{weatherInfo?.label}</p>
                  <p className="text-xs text-gray-500">Feels like {Math.round(current?.apparent_temperature)}°F</p>
                </div>
              </div>
            </div>
            <WeatherIcon className={`w-16 h-16 ${weatherInfo?.color} opacity-80`} />
          </div>

          {/* Stats grid */}
          <div className="grid grid-cols-3 gap-2">
            <StatCard icon={Droplets} label="Humidity" value={current?.relative_humidity_2m} unit="%" color="text-blue-400" />
            <StatCard icon={Wind} label="Wind" value={Math.round(current?.wind_speed_10m)} unit="mph" color="text-teal-400" />
            <StatCard icon={Eye} label="Pressure" value={Math.round(current?.surface_pressure)} unit="hPa" color="text-violet-400" />
          </div>

          {/* Hourly forecast */}
          {hourly && (
            <div>
              <h3 className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2">Next 24 Hours</h3>
              <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-thin">
                {hourly.time.slice(0, 24).map((time, i) => {
                  const hr = new Date(time).getHours();
                  const info = getWeatherInfo(hourly.weather_code[i]);
                  const HrIcon = info.icon;
                  return (
                    <div key={i} className="flex flex-col items-center gap-1 min-w-[48px] px-1.5 py-2 bg-white/[0.03] rounded-lg">
                      <span className="text-[10px] text-gray-500">{hr === 0 ? '12am' : hr <= 12 ? `${hr}${hr === 12 ? 'pm' : 'am'}` : `${hr - 12}pm`}</span>
                      <HrIcon className={`w-4 h-4 ${info.color}`} />
                      <span className="text-xs font-medium text-gray-200">{Math.round(hourly.temperature_2m[i])}°</span>
                      {hourly.precipitation_probability?.[i] > 0 && (
                        <span className="text-[9px] text-blue-400">{hourly.precipitation_probability[i]}%</span>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* 7-day forecast */}
          {daily && (
            <div>
              <h3 className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2">7-Day Forecast</h3>
              <div className="space-y-1">
                {daily.time.map((date, i) => {
                  const info = getWeatherInfo(daily.weather_code[i]);
                  const DayIcon = info.icon;
                  const dayName = i === 0 ? 'Today' : new Date(date + 'T12:00').toLocaleDateString('en-US', { weekday: 'short' });
                  return (
                    <div key={i} className="flex items-center gap-3 px-3 py-2 bg-white/[0.02] rounded-lg hover:bg-white/[0.04]">
                      <span className="text-sm text-gray-300 w-12">{dayName}</span>
                      <DayIcon className={`w-4 h-4 ${info.color}`} />
                      <span className="text-xs text-gray-500 flex-1 truncate">{info.label}</span>
                      {daily.precipitation_sum?.[i] > 0 && (
                        <span className="text-[10px] text-blue-400 flex items-center gap-0.5">
                          <Droplets className="w-3 h-3" />{daily.precipitation_sum[i]}"
                        </span>
                      )}
                      <div className="flex items-center gap-2 text-sm">
                        <span className="text-gray-200 font-medium">{Math.round(daily.temperature_2m_max[i])}°</span>
                        <span className="text-gray-500">{Math.round(daily.temperature_2m_min[i])}°</span>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

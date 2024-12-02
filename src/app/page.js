"use client";
import { useState, useEffect } from 'react';
import './WeatherApp.css';

export default function WeatherApp() {
  const [city, setCity] = useState('');
  const [weather, setWeather] = useState(null);
  const [touristSpots, setTouristSpots] = useState([]); // 관광지 정보를 저장할 상태
  const [theme, setTheme] = useState('');

  const googleApiKey = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY;
  const serviceKey = encodeURIComponent(process.env.NEXT_PUBLIC_WEATHER_API_KEY);
  const tourismApiKey = encodeURIComponent(process.env.NEXT_PUBLIC_TOURISM_API_KEY); // 관광지 API 키

  const cityToGrid = {
    '서울': { nx: 60, ny: 127 },
    '대전': { nx: 67, ny: 100 },
    '부산': { nx: 98, ny: 76 },
    '대구': { nx: 89, ny: 90 },
    '인천': { nx: 55, ny: 124 },
    '광주': { nx: 58, ny: 74 },
    '울산': { nx: 102, ny: 84 },
    '수원': { nx: 60, ny: 121 },
    '춘천': { nx: 73, ny: 134 },
    '강릉': { nx: 92, ny: 131 },
    '청주': { nx: 69, ny: 106 },
    '전주': { nx: 63, ny: 89 },
    '목포': { nx: 50, ny: 67 },
    '여수': { nx: 73, ny: 66 },
    '제주': { nx: 53, ny: 38 },
    '안동': { nx: 91, ny: 106 },
    '포항': { nx: 102, ny: 94 },
    '창원': { nx: 89, ny: 77 },
    '천안': { nx: 66, ny: 103 },
    '김해': { nx: 95, ny: 74 },
    '진주': { nx: 81, ny: 63 },
    '속초': { nx: 87, ny: 141 },
    '삼척': { nx: 98, ny: 128 },
    '경주': { nx: 100, ny: 91 },
    '순천': { nx: 72, ny: 70 },
    '광양': { nx: 74, ny: 70 },
    '거제': { nx: 90, ny: 58 },
    '통영': { nx: 84, ny: 62 }
  };

  const fetchCoordinates = async (city) => {
    if (cityToGrid[city]) {
      return cityToGrid[city];
    }
    const geoUrl = `https://maps.googleapis.com/maps/api/geocode/json?address=${encodeURIComponent(city)}&key=${googleApiKey}`;
    const response = await fetch(geoUrl);
    const data = await response.json();
    const location = data.results[0]?.geometry.location;

    if (location) {
      return { nx: Math.round(location.lng), ny: Math.round(location.lat) };
    }
    return null;
  };

  const fetchWeatherData = async () => {
    if (!city) return;

    const coordinates = await fetchCoordinates(city);
    if (!coordinates) {
      console.error("위치를 찾을 수 없습니다.");
      return;
    }

    const { nx, ny } = coordinates;
    const baseDate = new Date().toISOString().slice(0, 10).replace(/-/g, '');
    const baseTime = '0600';

    const url = `http://apis.data.go.kr/1360000/VilageFcstInfoService_2.0/getUltraSrtNcst?ServiceKey=${serviceKey}&pageNo=1&numOfRows=1000&dataType=JSON&base_date=${baseDate}&base_time=${baseTime}&nx=${nx}&ny=${ny}`;

    try {
      const response = await fetch(url);
      const data = await response.json();

      const weatherData = {
        temperature: data.response.body.items.item.find(item => item.category === 'T1H')?.obsrValue ?? "데이터 없음",
        feelsLike: data.response.body.items.item.find(item => item.category === 'T1H')?.obsrValue ?? "데이터 없음",
        humidity: data.response.body.items.item.find(item => item.category === 'REH')?.obsrValue ?? "데이터 없음",
        windSpeed: data.response.body.items.item.find(item => item.category === 'WSD')?.obsrValue ?? "데이터 없음",
        condition: data.response.body.items.item.find(item => item.category === 'PTY')?.obsrValue === "0" ? "맑음" : "흐림",
      };

      setWeather(weatherData);
      setThemeBasedOnWeather(weatherData.condition);
    } catch (error) {
      console.error("날씨 데이터를 가져오는 중 오류 발생:", error);
    }
  };

  const fetchTouristSpots = async () => {
    if (!city) return;

    const tourismUrl = `http://apis.data.go.kr/B551011/KorService1/searchKeyword1?serviceKey=${tourismApiKey}&MobileOS=ETC&MobileApp=WeatherTourApp&keyword=${encodeURIComponent(city)}&numOfRows=10&pageNo=1&_type=json`;

    try {
      const response = await fetch(tourismUrl);
      const data = await response.json();

      const spots = data.response.body.items.item.map(item => ({
        title: item.title,
        address: item.addr1,
        image: item.firstimage,
      }));

      setTouristSpots(spots);
    } catch (error) {
      console.error("관광지 데이터를 가져오는 중 오류 발생:", error);
    }
  };

  const handleSearch = async () => {
    await fetchWeatherData();
    await fetchTouristSpots();
  };

  const setThemeBasedOnWeather = (condition) => {
    switch (condition) {
      case "맑음":
        setTheme("sunny");
        break;
      case "흐림":
        setTheme("cloudy");
        break;
      case "비":
        setTheme("rainy");
        break;
      case "눈":
        setTheme("snowy");
        break;
      default:
        setTheme("default");
        break;
    }
  };

  return (
    <div className={`weather-app ${theme}`}>
      <header className="header">
        <h1>날씨 및 관광 정보</h1>
        <div className="search">
          <input
            type="text"
            placeholder="도시 이름을 입력하세요"
            value={city}
            onChange={(e) => setCity(e.target.value)}
          />
          <button onClick={handleSearch}>검색</button>
        </div>
      </header>

      {weather && (
        <div className="weather-info">
          <div className="main-info">
            <img
              src={
                weather.condition === "맑음"
                  ? "https://cdn-icons-png.flaticon.com/512/869/869869.png"
                  : "https://cdn-icons-png.flaticon.com/512/1163/1163624.png"
              }
              alt="날씨 아이콘"
              className="weather-icon"
            />
            <div className="temperature">{weather.temperature}°</div>
            <div className="condition">{weather.condition}</div>
          </div>

          <div className="details">
            <p>체감 온도: {weather.feelsLike}°</p>
            <p>습도: {weather.humidity}%</p>
            <p>풍속: {weather.windSpeed} m/s</p>
          </div>
        </div>
      )}

{touristSpots.length > 0 && (
  <div className="tourist-spots">
    <h2>추천 관광지</h2>
    <ul>
      {touristSpots.map((spot, index) => (
        spot.image ? ( // 이미지가 있는 경우에만 렌더링
          <li key={index} className="spot">
            <img src={spot.image} alt={spot.title} className="spot-image" />
            <div className="spot-info">
              <h3>{spot.title}</h3>
              <p>{spot.address}</p>
            </div>
          </li>
        ) : null // 이미지가 없는 경우 아무 것도 렌더링하지 않음
      ))}
    </ul>
  </div>
)}
    </div>
  );
}
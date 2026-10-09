import React from 'react';
import Icon from '@mdi/react';
import { 
  mdiWeatherNight,
  mdiWeatherSunny,
  mdiWeatherFog,
  mdiWeatherCloudy,
  mdiWeatherPartlyCloudy,
  mdiWeatherRainy,
  mdiWeatherSnowy,
  mdiWeatherLightning,
  mdiWeatherWindy,
  mdiMapMarker,
} from '@mdi/js';
import { useTheme } from '../../theme/ThemeContext';
import BaseCard from '../BaseCard';

import { useWeather } from '@hakit/core';
import { notification } from 'antd';
import { useLanguage } from '../../i18n/LanguageContext';
import './style.css';
// 添加穿衣指数计算函数
const calculateClothingIndex = (temperature, humidity, windSpeed) => {
  // 基础分值基于温度
  let baseScore;
  if (temperature >= 35) baseScore = 10;
  else if (temperature >= 28) baseScore = 9;
  else if (temperature >= 24) baseScore = 8;
  else if (temperature >= 20) baseScore = 7;
  else if (temperature >= 15) baseScore = 6;
  else if (temperature >= 10) baseScore = 5;
  else if (temperature >= 5) baseScore = 4;
  else if (temperature >= 0) baseScore = 3;
  else if (temperature >= -5) baseScore = 2;
  else baseScore = 1;

  // 湿度调整
  const humidityFactor = humidity >= 85 ? -1 : humidity <= 30 ? 0.5 : 0;

  // 风速调整
  let windFactor = 0;
  if (windSpeed >= 8) windFactor = -1.5;
  else if (windSpeed >= 5) windFactor = -1;
  else if (windSpeed >= 3) windFactor = -0.5;

  // 计算最终指数
  let finalScore = Math.max(1, Math.min(10, baseScore + humidityFactor + windFactor));
  
  // 建议对照表
  const getClothingSuggestions = (t) => ({
    10: { 
      index: t('weather.clothing.levels.extremeHot'), 
      suggestion: t('weather.clothing.suggestions.extremeHot')
    },
    9: { 
      index: t('weather.clothing.levels.veryHot'), 
      suggestion: t('weather.clothing.suggestions.veryHot')
    },
    8: { 
      index: t('weather.clothing.levels.hot'), 
      suggestion: t('weather.clothing.suggestions.hot')
    },
    7: { 
      index: t('weather.clothing.levels.warm'), 
      suggestion: t('weather.clothing.suggestions.warm')
    },
    6: { 
      index: t('weather.clothing.levels.comfortable'), 
      suggestion: t('weather.clothing.suggestions.comfortable')
    },
    5: { 
      index: t('weather.clothing.levels.cool'), 
      suggestion: t('weather.clothing.suggestions.cool')
    },
    4: { 
      index: t('weather.clothing.levels.cold'), 
      suggestion: t('weather.clothing.suggestions.cold')
    },
    3: { 
      index: t('weather.clothing.levels.veryCold'), 
      suggestion: t('weather.clothing.suggestions.veryCold')
    },
    2: { 
      index: t('weather.clothing.levels.extremeCold'), 
      suggestion: t('weather.clothing.suggestions.extremeCold')
    },
    1: { 
      index: t('weather.clothing.levels.freezing'), 
      suggestion: t('weather.clothing.suggestions.freezing')
    }
  });

  return (t) => {
    const suggestions = getClothingSuggestions(t);
    return suggestions[Math.round(finalScore)];
  };
};

function WeatherCard({config}) {
  const titleVisible = config.titleVisible;
  const { theme } = useTheme();
  const { t, language } = useLanguage();
  // 「时钟」风格要显示实时时间。⚠️ 这个 hook 必须在下面的 try/catch 之前 ——
  //    那个 try/catch 里有 return，hook 不能有条件执行。
  const [now, setNow] = React.useState(() => new Date());
  React.useEffect(() => {
    if (config.style !== 'clock') return undefined;
    const id = setInterval(() => setNow(new Date()), 20000);
    return () => clearInterval(id);
  }, [config.style]);
  const debugMode = localStorage.getItem('debugMode') === 'true';
  let weather = null;
  try {
    // eslint-disable-next-line react-hooks/rules-of-hooks
    weather = useWeather(config.entity_id);
  } catch (error) {
    if (debugMode) {
      notification.error({
        message: t('weather.loadError'),
        description: t('weather.loadErrorDesc') + error.message,
        placement: 'topRight',
        duration: 3,
      });
    }
    return <BaseCard title={t('weather.loadError')} icon={mdiMapMarker} >
      <div>{t('weather.loadError')}</div>
    </BaseCard> ;
  }
  
  const {
    apparent_temperature,
    visibility,
    visibility_unit,
    aqi,
    temperature,
    pressure,
    pressure_unit,
    humidity
  } = weather.attributes;

  const getWeatherIcon = (condition) => {
    const iconMap = {
      'clear-night': mdiWeatherNight,
      'sunny': mdiWeatherSunny,
      'fog': mdiWeatherFog,
      'cloudy': mdiWeatherCloudy,
      'partlycloudy': mdiWeatherPartlyCloudy,
      'rainy': mdiWeatherRainy,
      'snowy': mdiWeatherSnowy,
      'lightning': mdiWeatherLightning,
      'windy': mdiWeatherWindy,
    };
    return iconMap[condition] || mdiWeatherCloudy;
  };
  

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return `${date.getMonth() + 1}/${date.getDate()}`;
  };

  const getWindDirection = (bearing) => {
    if (bearing >= 337.5 || bearing < 22.5) return t('weather.wind.north');
    if (bearing >= 22.5 && bearing < 67.5) return t('weather.wind.northEast');
    if (bearing >= 67.5 && bearing < 112.5) return t('weather.wind.east');
    if (bearing >= 112.5 && bearing < 157.5) return t('weather.wind.southEast');
    if (bearing >= 157.5 && bearing < 202.5) return t('weather.wind.south');
    if (bearing >= 202.5 && bearing < 247.5) return t('weather.wind.southWest');
    if (bearing >= 247.5 && bearing < 292.5) return t('weather.wind.west');
    if (bearing >= 292.5 && bearing < 337.5) return t('weather.wind.northWest');
    return bearing;
  };

  const getAQIDescription = (aqi) => {
    if (typeof aqi === 'object') {
      return aqi.category || '';
    }
    const aqiValue = parseInt(aqi);
    if (isNaN(aqiValue)) return '';
    
    if (aqiValue <= 50) return t('weather.aqi.level1');
    if (aqiValue <= 100) return t('weather.aqi.level2');
    if (aqiValue <= 150) return t('weather.aqi.level3');
    if (aqiValue <= 200) return t('weather.aqi.level4');
    if (aqiValue <= 300) return t('weather.aqi.level5');
    return t('weather.aqi.level6');
  };

  const getWindLevel = (speed) => {
    if (speed < 2) return t('weather.wind.level.calm');
    if (speed < 6) return t('weather.wind.level.light');
    if (speed < 12) return t('weather.wind.level.moderate');
    if (speed < 19) return t('weather.wind.level.fresh');
    if (speed < 28) return t('weather.wind.level.strong');
    if (speed < 38) return t('weather.wind.level.gale');
    if (speed < 49) return t('weather.wind.level.storm');
    if (speed < 61) return t('weather.wind.level.violent');
    return t('weather.wind.level.hurricane');
  };

  const forecastData = Array.isArray(weather?.forecast?.forecast) 
  ? weather.forecast.forecast.slice(0, 7) 
  : [];
  
  const clothingAdvice = calculateClothingIndex(
    weather.attributes.temperature,
    weather.attributes.humidity || 50,
    weather.attributes.wind_speed || 0
  )(t);

  // 天气状况文案：HA 给的是 clear-night / partlycloudy 这种英文标识，翻一下
  const condText = (c) => {
    const raw = String(c || '');
    if (!raw) return '';
    const key = `weather.conditions.${raw.replace(/-/g, '_')}`;
    const v = t(key);
    return v === key ? raw : v;
  };

  const pad = (n) => String(n).padStart(2, '0');
  const hhmm = `${pad(now.getHours())}:${pad(now.getMinutes())}`;
  const hhmmss = `${hhmm}:${pad(now.getSeconds())}`;
  // 中文环境：月用中文数字、日用阿拉伯数字（七月25日），星期单独一段（中间留间隔）
  const CN_MONTH = ['一', '二', '三', '四', '五', '六', '七', '八', '九', '十', '十一', '十二'];
  const CN_WEEK = ['星期日', '星期一', '星期二', '星期三', '星期四', '星期五', '星期六'];
  const isZh = language === 'zh';
  const dateMain = isZh
    ? `${CN_MONTH[now.getMonth()]}月${now.getDate()}日`
    : now.toLocaleDateString(undefined, { month: 'long', day: 'numeric' });
  const weekdayText = isZh
    ? CN_WEEK[now.getDay()]
    : now.toLocaleDateString(undefined, { weekday: 'long' });
  const location =
    (config.location || '').trim() ||
    (weather.attributes && weather.attributes.friendly_name) ||
    '';

  const first = forecastData[0] || null;
  const low = first && first.templow != null ? Math.round(first.templow) : null;
  const high =
    first && first.temperature != null ? Math.round(first.temperature) : null;
  const forecastKind = (weather.forecast && weather.forecast.type) || 'daily';

  // ---------- 风格二：时钟风（大时间 + 日期 + 地点 + 天气一行） ----------
  if (config.style === 'clock') {
    return (
      <BaseCard
        title={config.title || t('cardTitles.weather')}
        titleVisible={titleVisible}
        icon={getWeatherIcon(weather.state)}
      >
        <div className="wc-clock">
          <div className="wc-clock-time">{hhmm}</div>
          <div className="wc-clock-date">
            <span>{dateMain}</span>
            <span className="wc-clock-weekday">{weekdayText}</span>
          </div>
          {location ? (
            <div className="wc-clock-loc">
              <Icon path={mdiMapMarker} size={13} />
              <span>{location}</span>
            </div>
          ) : null}

          {/* 下半区：左边天气图标（占一行），右边温度占 60% 高、下面「最低/最高 + 描述」占 35% 高 */}
          <div className="wc-clock-bottom">
            <span className="wc-clock-icon">
              <Icon path={getWeatherIcon(weather.state)} size={34} />
            </span>
            <div className="wc-clock-right">
              <div className="wc-clock-temp">
                {temperature != null ? `${Math.round(temperature)}°C` : '--'}
              </div>
              <div className="wc-clock-sub">
                {low != null && high != null ? (
                  <span className="wc-clock-range">
                    {low}° / {high}°
                  </span>
                ) : null}
                <span className="wc-clock-cond">{condText(weather.state)}</span>
              </div>
            </div>
          </div>
        </div>
      </BaseCard>
    );
  }

  // ---------- 风格三：预报风（更新时间 + 逐小时 + 四个指标块） ----------
  if (config.style === 'forecast') {
    const hours = forecastData.slice(0, 5);
    const windSpeed = weather.attributes.wind_speed;
    const windUnit = weather.attributes.wind_speed_unit || 'm/s';
    const uv = weather.attributes.uv_index;
    const tiles = [
      {
        key: 'air',
        label: t('weather.metrics.airQuality'),
        value: aqi != null ? (typeof aqi === 'object' ? aqi.value ?? '--' : aqi) : '--',
        extra: getAQIDescription(aqi),
      },
      {
        key: 'humidity',
        label: t('weather.metrics.humidity'),
        value: humidity != null ? `${humidity}%` : '--',
        extra: '',
      },
      {
        key: 'wind',
        label: t('weather.metrics.wind'),
        value: windSpeed != null ? `${Math.round(windSpeed)}${windUnit}` : '--',
        extra: '',
      },
      {
        key: 'uv',
        label: t('weather.uv'),
        value: uv != null ? Math.round(uv) : '--',
        extra: '',
      },
    ];

    return (
      <BaseCard
        title={config.title || t('cardTitles.weather')}
        titleVisible={titleVisible}
        icon={getWeatherIcon(weather.state)}
      >
        <div className="wc-fc">
          <div className="wc-fc-head">
            <span className="wc-fc-title">{t('weather.condition')}</span>
            <span className="wc-fc-updated">
              <Icon path={mdiWeatherWindy} size={12} />
              {t('weather.updated')}: {hhmmss}
            </span>
          </div>
          <div className="wc-fc-unit">{t('weather.tempUnit')}</div>

          <div className="wc-fc-hours">
            <div className="wc-fc-hour">
              <span className="wc-fc-hlabel">{t('weather.now')}</span>
              <span className="wc-fc-hicon">
                <Icon path={getWeatherIcon(weather.state)} size={22} />
              </span>
              <span className="wc-fc-htemp">
                {temperature != null ? `${Math.round(temperature)}°` : '--'}
              </span>
            </div>
            {hours.map((h, i) => {
              const d = new Date(h.datetime);
              const label =
                forecastKind === 'hourly'
                  ? `${pad(d.getHours())}:00`
                  : `${d.getMonth() + 1}/${d.getDate()}`;
              return (
                <div className="wc-fc-hour" key={`${h.datetime}-${i}`}>
                  <span className="wc-fc-hlabel">{label}</span>
                  <span className="wc-fc-hicon">
                    <Icon path={getWeatherIcon(h.condition)} size={22} />
                  </span>
                  <span className="wc-fc-htemp">
                    {h.temperature != null ? `${Math.round(h.temperature)}°` : '--'}
                  </span>
                </div>
              );
            })}
          </div>

          <div className="wc-fc-tiles">
            {tiles.map((x) => (
              <div className="wc-fc-tile" key={x.key}>
                <span className="wc-fc-tile-label">{x.label}</span>
                <span className="wc-fc-tile-value">{x.value}</span>
                {x.extra ? <span className="wc-fc-tile-extra">{x.extra}</span> : null}
              </div>
            ))}
          </div>
        </div>
      </BaseCard>
    );
  }

  return (
    <BaseCard
      title={config.title || t('cardTitles.weather')}
      icon={mdiMapMarker}
      titleVisible={titleVisible}
    >
      <div className="current-weather">
        <div className="weather-item">
          <span className="label">
            {apparent_temperature 
              ? t('weather.metrics.feelTemp') 
              : t('weather.metrics.temperature')}
          </span>
          <span className="value">{apparent_temperature || temperature}°C</span>
        </div>
        {humidity && <div className="weather-item">
          <span className="label">{t('weather.metrics.humidity')}</span>
          <span className="value">{humidity}%</span>
        </div>}
        {visibility && <div className="weather-item">
          <span className="label">{t('weather.metrics.visibility')}</span>
          <span className="value">{visibility} {visibility_unit}</span>
        </div>}
        {aqi && <div className="weather-item">
          <span className="label">{t('weather.metrics.airQuality')}</span>
          <span className="value">
            {typeof aqi === 'object' 
              ? `${aqi.aqi || aqi.level} (${getAQIDescription(aqi)})` 
              : `${aqi} (${getAQIDescription(aqi)})`}
          </span>
        </div>}
        {pressure && !aqi && <div className="weather-item">
          <span className="label">{t('weather.metrics.pressure')}</span>
          <span className="value">{pressure} {pressure_unit}</span>
        </div>}
        <div className="weather-item">
          <span className="label">{t('weather.metrics.wind')}</span>
          <span className="value">
            {getWindDirection(weather.attributes.wind_bearing)} {getWindLevel(weather.attributes.wind_speed)}
          </span>
        </div>
      </div>
      <div className="clothing-index">
        <div className="clothing-header">
          <span className="label">{t('weather.clothing.index')}</span>
          <span className="value">{clothingAdvice.index}</span>
        </div>
        <div className="clothing-suggestion">
          {clothingAdvice.suggestion}
        </div>
      </div>
      <div className="forecast">
        {forecastData.map((day, index) => (
          <div key={index} className="forecast-day">
            <div className="weather-date">{formatDate(day.datetime)}</div>
            <div className="weather-icon">
              <Icon 
                path={getWeatherIcon(day.condition)}
                size={14}
                color={theme === 'dark' ? '#ffffff' : '#333333'}
              />
            </div>
            <div className="weather-temp">
              <span className="high">{day.temperature}°</span>
              <span className="low">{day.templow}°</span>
            </div>
          </div>
        ))}
      </div>
    </BaseCard>
  );
}

export default WeatherCard; 
'use client';

import { useEffect, useMemo, useState } from 'react';
import { getTool } from '@/lib/tools/registry';
import { getWeather } from '@/lib/tools/weather/wmo';
import ToolShell from '@/components/tools/ToolShell';
import shared from '@/components/tools/tools-shared.module.css';
import styles from './weather.module.css';

type Place = {
  id: number;
  name: string;
  latitude: number;
  longitude: number;
  country?: string;
  admin1?: string;
  admin2?: string;
};

type Forecast = {
  location: { name: string; timezone: string };
  current: Record<string, any>;
  hourly: { time: string; temperature: number; weatherCode: number; precipitationProbability: number }[];
  daily: {
    date: string;
    weatherCode: number;
    weather: { label: string; icon: string };
    max: number;
    min: number;
    precipitationProbability: number;
  }[];
};

const convert = (celsius: number, fahrenheit: boolean) => fahrenheit ? celsius * 9 / 5 + 32 : celsius;
const round = (value: number) => Math.round(value);

function HourlyChart({ hours, fahrenheit }: { hours: Forecast['hourly']; fahrenheit: boolean }) {
  if (hours.length < 2) return null;
  const values = hours.map((hour) => convert(hour.temperature, fahrenheit));
  const min = Math.min(...values) - 1;
  const max = Math.max(...values) + 1;
  const span = Math.max(1, max - min);
  const x = (index: number) => 26 + index * (668 / (values.length - 1));
  const y = (value: number) => 132 - ((value - min) / span) * 96;
  const line = values.map((value, index) => `${x(index)},${y(value)}`).join(' ');
  const area = `26,150 ${line} ${x(values.length - 1)},150`;

  return (
    <div className={styles.chart}>
      <svg viewBox="0 0 720 172" role="img" aria-label="未来 24 小时温度趋势">
        <defs>
          <linearGradient id="weather-line" x1="0" x2="1">
            <stop stopColor="#25b6d8" />
            <stop offset="1" stopColor="#7c5cff" />
          </linearGradient>
          <linearGradient id="weather-area" x1="0" x2="0" y1="0" y2="1">
            <stop stopColor="#25b6d8" stopOpacity=".22" />
            <stop offset="1" stopColor="#25b6d8" stopOpacity="0" />
          </linearGradient>
        </defs>
        <line x1="26" y1="150" x2="694" y2="150" stroke="#e2e9ef" />
        <polygon points={area} fill="url(#weather-area)" />
        <polyline
          points={line}
          fill="none"
          stroke="url(#weather-line)"
          strokeWidth="3"
          strokeLinejoin="round"
          strokeLinecap="round"
        />
        {values.map((value, index) => index % 3 === 0 && (
          <g key={hours[index].time}>
            <circle cx={x(index)} cy={y(value)} r="3.5" fill="#fff" stroke="#25b6d8" strokeWidth="2" />
            <text x={x(index)} y={y(value) - 11} textAnchor="middle" fontSize="11" fontWeight="600" fill="#2c4353">
              {round(value)}°
            </text>
            <text x={x(index)} y="166" textAnchor="middle" fontSize="10" fill="#8492a0">
              {new Date(hours[index].time).getHours()}:00
            </text>
          </g>
        ))}
      </svg>
    </div>
  );
}

export default function WeatherTool() {
  const meta = getTool('weather')!;
  const [query, setQuery] = useState('');
  const [places, setPlaces] = useState<Place[]>([]);
  const [forecast, setForecast] = useState<Forecast | null>(null);
  const [source, setSource] = useState<{ requestUrl?: string; fetchedAt?: string }>({});
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [fahrenheit, setFahrenheit] = useState(false);

  const loadWeather = async (place: Omit<Place, 'id'>) => {
    setLoading(true);
    setPlaces([]);
    setQuery('');
    try {
      const response = await fetch(
        `/api/tools/weather?lat=${place.latitude}&lon=${place.longitude}&name=${encodeURIComponent(place.name)}`,
      );
      const body = await response.json();
      if (!body.success) throw new Error(body.error);
      setForecast(body.data);
      setSource(body.meta);
      setError('');
      window.localStorage.setItem('tool-weather:last', JSON.stringify(place));
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : '查询失败');
    } finally {
      setLoading(false);
    }
  };

  const locateMe = () => {
    if (!navigator.geolocation) {
      setError('当前浏览器不支持定位，请在上方搜索框手动输入城市名。');
      return;
    }

    navigator.geolocation.getCurrentPosition(
      (position) => loadWeather({
        name: '当前位置',
        latitude: position.coords.latitude,
        longitude: position.coords.longitude,
      }),
      (reason) => {
        const messages: Record<number, string> = {
          1: '定位权限被拒绝，请在浏览器地址栏的权限设置里允许定位，或在上方搜索框手动输入城市名。',
          2: '暂时无法获取你的位置信息，请在上方搜索框手动输入城市名。',
          3: '定位超时，请重试或在上方搜索框手动输入城市名。',
        };
        setError(messages[reason.code] || '定位失败，请在上方搜索框手动输入城市名。');
      },
      { timeout: 10000, maximumAge: 300000 },
    );
  };

  useEffect(() => {
    setFahrenheit(window.localStorage.getItem('tool-weather:unit') === 'f');
    const saved = window.localStorage.getItem('tool-weather:last');
    loadWeather(saved ? JSON.parse(saved) : { name: '杭州', latitude: 30.29365, longitude: 120.16142 });
  }, []);

  useEffect(() => {
    if (!query.trim()) { setPlaces([]); return; }
    const timer = window.setTimeout(async () => {
      try {
        const response = await fetch(`/api/tools/weather/geocode?q=${encodeURIComponent(query)}`);
        const body = await response.json();
        if (body.success) setPlaces(body.data);
      } catch { /* 保留手动输入路径 */ }
    }, 350);
    return () => window.clearTimeout(timer);
  }, [query]);

  const hours = useMemo(
    () => forecast?.hourly.filter((item) => new Date(item.time).getTime() >= Date.now() - 3600000).slice(0, 24) ?? [],
    [forecast],
  );

  // 7 日温度条共用一条全局温标，这样每根条的长度和位置才有可比性
  const scale = useMemo(() => {
    if (!forecast?.daily.length) return { low: 0, span: 1 };
    const low = Math.min(...forecast.daily.map((day) => day.min));
    const high = Math.max(...forecast.daily.map((day) => day.max));
    return { low, span: Math.max(1, high - low) };
  }, [forecast]);

  const current = forecast?.current;

  return (
    <ToolShell meta={meta} requestUrl={source.requestUrl} fetchedAt={source.fetchedAt}>
      <section className={shared.workspace}>
        <div className={styles.searchRow}>
          <div className={styles.searchWrap}>
            <input
              className={`${shared.input} ${styles.searchInput}`}
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder="搜索城市（中文、英文或拼音）"
              aria-label="搜索城市"
            />
            {places.length > 0 && (
              <div className={styles.suggestions}>
                {places.map((place) => (
                  <button
                    type="button"
                    className={styles.suggestion}
                    key={place.id}
                    onClick={() => loadWeather(place)}
                  >
                    <span className={styles.suggestionName}>{place.name}</span>
                    <span className={styles.suggestionMeta}>
                      {[place.admin1, place.country].filter(Boolean).join(' · ')}
                    </span>
                  </button>
                ))}
              </div>
            )}
          </div>

          <button className={shared.button} onClick={locateMe}>
            使用我的位置
          </button>

          <div className={shared.segmented} role="group" aria-label="温度单位">
            {[['c', '°C'], ['f', '°F']].map(([key, label]) => (
              <button
                key={key}
                type="button"
                className={`${shared.segment} ${(key === 'f') === fahrenheit ? shared.segmentActive : ''}`}
                onClick={() => {
                  setFahrenheit(key === 'f');
                  window.localStorage.setItem('tool-weather:unit', key);
                }}
              >
                {label}
              </button>
            ))}
          </div>
        </div>

        {loading && <p className={shared.loading}>正在获取天气…</p>}
        {error && <p className={shared.error}>{error}</p>}

        {forecast && current && (
          <>
            <div className={styles.current}>
              <div className={styles.currentMain}>
                <span className={styles.currentIcon} aria-hidden="true">{current.weather.icon}</span>
                <div className={styles.currentTemp}>
                  <p className={styles.currentPlace}>{forecast.location.name} · {forecast.location.timezone}</p>
                  <strong>{round(convert(current.temperature_2m, fahrenheit))}°</strong>
                  <span className={styles.currentLabel}>{current.weather.label}</span>
                </div>
              </div>

              <div className={styles.currentMetrics}>
                <div className={styles.metric}>
                  <span>体感温度</span>
                  <b>{round(convert(current.apparent_temperature, fahrenheit))}°</b>
                </div>
                <div className={styles.metric}>
                  <span>相对湿度</span>
                  <b>{current.relative_humidity_2m}%</b>
                </div>
                <div className={styles.metric}>
                  <span>风速</span>
                  <b>{current.wind_speed_10m} km/h</b>
                </div>
                <div className={styles.metric}>
                  <span>降水量</span>
                  <b>{current.precipitation} mm</b>
                </div>
              </div>
            </div>

            <h2 className={shared.sectionTitle}>未来 24 小时 <small>温度趋势与降水概率</small></h2>
            <HourlyChart hours={hours} fahrenheit={fahrenheit} />
            <div className={styles.hourRow}>
              {hours.map((hour) => {
                const time = new Date(hour.time);
                const rain = hour.precipitationProbability ?? 0;
                return (
                  <div className={styles.hour} key={hour.time}>
                    <span className={styles.hourTime}>{String(time.getHours()).padStart(2, '0')}:00</span>
                    <span className={styles.hourIcon} aria-hidden="true">
                      {getWeather(hour.weatherCode, time.getHours() >= 6 && time.getHours() < 19).icon}
                    </span>
                    <span className={styles.hourTemp}>{round(convert(hour.temperature, fahrenheit))}°</span>
                    <span className={styles.hourRain}>{rain > 0 ? `${rain}%` : ''}</span>
                  </div>
                );
              })}
            </div>

            <h2 className={shared.sectionTitle}>7 日预报 <small>条形长度对应当日温差</small></h2>
            <div className={styles.daily}>
              {forecast.daily.map((day, index) => {
                const date = new Date(`${day.date}T12:00`);
                const left = ((day.min - scale.low) / scale.span) * 100;
                const width = Math.max(6, ((day.max - day.min) / scale.span) * 100);
                const rain = day.precipitationProbability ?? 0;
                return (
                  <div className={styles.day} key={day.date}>
                    <div>
                      <span className={styles.dayName}>
                        {index === 0 ? '今天' : date.toLocaleDateString('zh-CN', { weekday: 'short' })}
                      </span>
                      <span className={styles.dayDate}>
                        {date.toLocaleDateString('zh-CN', { month: 'numeric', day: 'numeric' })}
                      </span>
                    </div>
                    <span className={styles.dayIcon} aria-hidden="true">{day.weather.icon}</span>
                    <span className={styles.dayLabel} title={day.weather.label}>{day.weather.label}</span>
                    <span className={styles.dayRain}>{rain > 0 ? `${rain}%` : '—'}</span>
                    <div className={styles.dayRange}>
                      <span className={styles.dayMin}>{round(convert(day.min, fahrenheit))}°</span>
                      <div className={styles.dayTrack}>
                        <div className={styles.dayBar} style={{ left: `${left}%`, width: `${width}%` }} />
                      </div>
                      <span className={styles.dayMax}>{round(convert(day.max, fahrenheit))}°</span>
                    </div>
                  </div>
                );
              })}
            </div>
          </>
        )}
      </section>
    </ToolShell>
  );
}

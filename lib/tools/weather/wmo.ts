const WEATHER: Record<number, { label: string; day: string; night: string }> = {
  0: { label: '晴', day: '☀️', night: '🌙' }, 1: { label: '大部晴朗', day: '🌤️', night: '🌙' }, 2: { label: '局部多云', day: '⛅', night: '☁️' }, 3: { label: '阴', day: '☁️', night: '☁️' },
  45: { label: '雾', day: '🌫️', night: '🌫️' }, 48: { label: '雾凇', day: '🌫️', night: '🌫️' }, 51: { label: '小毛毛雨', day: '🌦️', night: '🌧️' }, 53: { label: '毛毛雨', day: '🌦️', night: '🌧️' }, 55: { label: '大毛毛雨', day: '🌧️', night: '🌧️' },
  56: { label: '小冻毛毛雨', day: '🌨️', night: '🌨️' }, 57: { label: '大冻毛毛雨', day: '🌨️', night: '🌨️' }, 61: { label: '小雨', day: '🌦️', night: '🌧️' }, 63: { label: '中雨', day: '🌧️', night: '🌧️' }, 65: { label: '大雨', day: '🌧️', night: '🌧️' },
  66: { label: '小冻雨', day: '🌨️', night: '🌨️' }, 67: { label: '大冻雨', day: '🌨️', night: '🌨️' }, 71: { label: '小雪', day: '🌨️', night: '🌨️' }, 73: { label: '中雪', day: '❄️', night: '❄️' }, 75: { label: '大雪', day: '❄️', night: '❄️' }, 77: { label: '米雪', day: '🌨️', night: '🌨️' },
  80: { label: '小阵雨', day: '🌦️', night: '🌧️' }, 81: { label: '阵雨', day: '🌧️', night: '🌧️' }, 82: { label: '强阵雨', day: '⛈️', night: '⛈️' }, 85: { label: '小阵雪', day: '🌨️', night: '🌨️' }, 86: { label: '大阵雪', day: '❄️', night: '❄️' },
  95: { label: '雷暴', day: '⛈️', night: '⛈️' }, 96: { label: '雷暴伴小冰雹', day: '⛈️', night: '⛈️' }, 99: { label: '雷暴伴大冰雹', day: '⛈️', night: '⛈️' },
};
export const getWeather = (code: number, isDay = true) => ({ ...(WEATHER[code] ?? { label: '未知天气', day: '◌', night: '◌' }), icon: (WEATHER[code] ?? { day: '◌', night: '◌' })[isDay ? 'day' : 'night'] });

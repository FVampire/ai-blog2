import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { checkRateLimit } from '@/lib/tools/rate-limit';
import { getWeather } from '@/lib/tools/weather/wmo';

const schema = z.object({ lat: z.coerce.number().min(-90).max(90), lon: z.coerce.number().min(-180).max(180), name: z.string().trim().max(80).optional().default('当前位置') });
export async function GET(request: NextRequest) {
  const ip = request.headers.get('x-forwarded-for')?.split(',')[0] ?? 'unknown';
  if (!checkRateLimit(`weather:${ip}`)) return NextResponse.json({ success: false, error: '请求过于频繁，请稍后再试。' }, { status: 429 });
  const parsed = schema.safeParse(Object.fromEntries(request.nextUrl.searchParams));
  if (!parsed.success) return NextResponse.json({ success: false, error: '经纬度参数无效。' }, { status: 400 });
  const { lat, lon, name } = parsed.data;
  const url = new URL('https://api.open-meteo.com/v1/forecast');
  url.searchParams.set('latitude', String(lat)); url.searchParams.set('longitude', String(lon));
  url.searchParams.set('current', 'temperature_2m,relative_humidity_2m,apparent_temperature,is_day,precipitation,weather_code,wind_speed_10m,wind_direction_10m');
  url.searchParams.set('hourly', 'temperature_2m,weather_code,precipitation_probability');
  url.searchParams.set('daily', 'weather_code,temperature_2m_max,temperature_2m_min,precipitation_probability_max,sunrise,sunset');
  url.searchParams.set('timezone', 'auto'); url.searchParams.set('forecast_days', '7');
  try {
    const response = await fetch(url, { next: { revalidate: 600 }, signal: AbortSignal.timeout(8000) });
    if (!response.ok) throw new Error(`Open-Meteo ${response.status}`);
    const raw = await response.json();
    const current = { ...raw.current, weather: getWeather(raw.current.weather_code, Boolean(raw.current.is_day)) };
    const hourly = raw.hourly.time.slice(0, 48).map((time: string, index: number) => ({ time, temperature: raw.hourly.temperature_2m[index], weatherCode: raw.hourly.weather_code[index], precipitationProbability: raw.hourly.precipitation_probability[index] }));
    const daily = raw.daily.time.map((date: string, index: number) => ({ date, weatherCode: raw.daily.weather_code[index], weather: getWeather(raw.daily.weather_code[index]), max: raw.daily.temperature_2m_max[index], min: raw.daily.temperature_2m_min[index], precipitationProbability: raw.daily.precipitation_probability_max[index], sunrise: raw.daily.sunrise[index], sunset: raw.daily.sunset[index] }));
    return NextResponse.json({ success: true, data: { location: { name, latitude: raw.latitude, longitude: raw.longitude, timezone: raw.timezone }, current, hourly, daily }, meta: { provider: 'Open-Meteo', requestUrl: url.toString(), fetchedAt: new Date().toISOString(), cacheSeconds: 600 } });
  } catch { return NextResponse.json({ success: false, error: '天气服务暂时不可用，请稍后重试。' }, { status: 502 }); }
}

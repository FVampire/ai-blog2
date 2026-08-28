import type { Metadata } from 'next';
import WeatherTool from './WeatherTool';
export const metadata: Metadata = { title: '天气查询 - 工具箱', description: '由 Open-Meteo 提供的全球当前天气、24 小时趋势和 7 日预报。' };
export default function Page() { return <WeatherTool />; }

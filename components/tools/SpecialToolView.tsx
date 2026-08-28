'use client';

import { useEffect, useMemo, useState } from 'react';
import { copyText } from '@/lib/tools/clipboard';
import { downloadBlob, downloadTextFile } from '@/lib/tools/download';
import { getTool } from '@/lib/tools/registry';
import CopyButton from './CopyButton';
import ToolShell from './ToolShell';
import styles from './tools-shared.module.css';

const Field = ({ label, children }: { label: string; children: React.ReactNode }) => <label className={styles.field}>{label}{children}</label>;

/** 原生取色器无法手输，配一个 HEX 文本框才能粘贴设计稿里的色值 */
function ColorField({ label, value, onChange }: { label: string; value: string; onChange: (next: string) => void }) {
  return (
    <div className={styles.field}>
      {label}
      <div className={styles.colorField}>
        <input type="color" value={value} onChange={(event) => onChange(event.target.value)} aria-label={`${label}取色器`} />
        <input
          type="text"
          value={value}
          spellCheck={false}
          onChange={(event) => {
            const next = event.target.value.startsWith('#') ? event.target.value : `#${event.target.value}`;
            onChange(next.slice(0, 7).toLowerCase());
          }}
          aria-label={`${label} HEX 值`}
        />
      </div>
    </div>
  );
}

function TimestampTool() {
  const [value, setValue] = useState(() => String(Math.floor(Date.now() / 1000)));
  const date = useMemo(() => { const number = Number(value); const result = new Date(number < 1e12 ? number * 1000 : number); return Number.isNaN(result.getTime()) ? null : result; }, [value]);
  return <section className={styles.workspace}><div className={styles.toolbar}><Field label="Unix 时间戳（秒或毫秒）"><input value={value} onChange={(event) => setValue(event.target.value)} /></Field><button className={styles.button} onClick={() => setValue(String(Math.floor(Date.now() / 1000)))}>现在</button></div>{date ? <div className={styles.statGrid}><div className={styles.stat}>本地时间<b>{date.toLocaleString()}</b></div><div className={styles.stat}>ISO 8601<b>{date.toISOString()}</b></div><div className={styles.stat}>Unix 毫秒<b>{date.getTime()}</b></div></div> : <p className={styles.error}>时间戳无效</p>}</section>;
}

function TimezoneTool() {
  const zones = ['Asia/Shanghai', 'Asia/Tokyo', 'Europe/London', 'America/New_York', 'America/Los_Angeles', 'Australia/Sydney'];
  const [now, setNow] = useState(new Date());
  useEffect(() => { const timer = window.setInterval(() => setNow(new Date()), 1000); return () => window.clearInterval(timer); }, []);
  return <section className={styles.workspace}><div className={styles.statGrid}>{zones.map((zone) => <div className={styles.stat} key={zone}>{zone}<b>{new Intl.DateTimeFormat('zh-CN', { timeZone: zone, dateStyle: 'medium', timeStyle: 'medium', hour12: false }).format(now)}</b></div>)}</div></section>;
}

const cronLabels: Record<string, string> = { '*': '每一', '*/5': '每 5', '*/10': '每 10', '*/15': '每 15', '*/30': '每 30' };
function matchesCronField(field: string, value: number) {
  return field.split(',').some((part) => {
    if (part === '*') return true;
    if (part.startsWith('*/')) return value % Number(part.slice(2)) === 0;
    if (part.includes('-')) { const [start, end] = part.split('-').map(Number); return value >= start && value <= end; }
    return value === Number(part);
  });
}
function nextCronDates(parts: string[]) {
  const result: Date[] = []; const date = new Date(); date.setSeconds(0, 0); date.setMinutes(date.getMinutes() + 1);
  for (let tries = 0; tries < 525600 && result.length < 5; tries += 1) {
    if (matchesCronField(parts[0], date.getMinutes()) && matchesCronField(parts[1], date.getHours()) && matchesCronField(parts[2], date.getDate()) && matchesCronField(parts[3], date.getMonth() + 1) && matchesCronField(parts[4], date.getDay())) result.push(new Date(date));
    date.setMinutes(date.getMinutes() + 1);
  }
  return result;
}
function CronTool() {
  const [cron, setCron] = useState('*/15 9-18 * * 1-5');
  const parts = cron.trim().split(/\s+/);
  const valid = parts.length === 5 && parts.every((part) => /^[\d*/,-]+$/.test(part));
  const description = valid ? `${cronLabels[parts[0]] ?? `第 ${parts[0]}`}分钟，${parts[1] === '*' ? '每小时' : `${parts[1]} 时`}，${parts[4] === '1-5' ? '周一至周五' : parts[4] === '*' ? '每天' : `星期字段 ${parts[4]}`}` : '';
  const nextDates = useMemo(() => valid ? nextCronDates(parts) : [], [cron, valid]);
  return <section className={styles.workspace}><Field label="五段 Cron（分 时 日 月 周）"><input className={styles.input} value={cron} onChange={(event) => setCron(event.target.value)} /></Field>{valid ? <div className={styles.preview}><strong>{description}</strong><p>字段：分钟 <code>{parts[0]}</code> · 小时 <code>{parts[1]}</code> · 日期 <code>{parts[2]}</code> · 月份 <code>{parts[3]}</code> · 星期 <code>{parts[4]}</code></p><h3>未来 5 次执行</h3><ol>{nextDates.map((date) => <li key={date.toISOString()}>{date.toLocaleString('zh-CN')}</li>)}</ol><p>说明：本解释器采用标准五段格式，不包含“秒”和厂商扩展。</p></div> : <p className={styles.error}>请输入由数字、星号、斜杠、逗号和连字符组成的五段表达式。</p>}</section>;
}

function lcsDiff(left: string[], right: string[]) {
  const table = Array.from({ length: left.length + 1 }, () => Array(right.length + 1).fill(0));
  for (let i = left.length - 1; i >= 0; i -= 1) for (let j = right.length - 1; j >= 0; j -= 1) table[i][j] = left[i] === right[j] ? table[i + 1][j + 1] + 1 : Math.max(table[i + 1][j], table[i][j + 1]);
  const result: { type: 'same' | 'add' | 'remove'; value: string }[] = [];
  let i = 0; let j = 0;
  while (i < left.length || j < right.length) {
    if (i < left.length && j < right.length && left[i] === right[j]) { result.push({ type: 'same', value: left[i] }); i += 1; j += 1; }
    else if (j < right.length && (i === left.length || table[i][j + 1] >= table[i + 1][j])) { result.push({ type: 'add', value: right[j++] }); }
    else result.push({ type: 'remove', value: left[i++] });
  }
  return result;
}

function DiffTool() {
  const [left, setLeft] = useState('第一行\n需要删除的内容\n相同内容'); const [right, setRight] = useState('第一行\n新增的内容\n相同内容');
  const diff = useMemo(() => lcsDiff(left.split(/\r?\n/), right.split(/\r?\n/)), [left, right]);
  return <section className={styles.workspace}><div className={styles.split}><textarea className={styles.textarea} value={left} onChange={(event) => setLeft(event.target.value)} aria-label="原文本" /><textarea className={styles.textarea} value={right} onChange={(event) => setRight(event.target.value)} aria-label="新文本" /></div><div className={styles.preview} style={{ marginTop: 16 }}>{diff.map((line, index) => <div key={`${index}-${line.type}`} className={`${styles.diffLine} ${line.type === 'add' ? styles.diffAdd : line.type === 'remove' ? styles.diffRemove : ''}`}><span>{line.type === 'add' ? '+' : line.type === 'remove' ? '−' : ' '}</span><span>{line.value || ' '}</span></div>)}</div></section>;
}

function RegexTool() {
  const [pattern, setPattern] = useState('(tool)(s?)'); const [flags, setFlags] = useState('gi'); const [text, setText] = useState('Tools make small tasks easier. One tool at a time.');
  let error = ''; let matches: RegExpMatchArray[] = [];
  try { const regex = new RegExp(pattern, flags.includes('g') ? flags : `${flags}g`); matches = [...text.matchAll(regex)].slice(0, 1000); } catch (reason) { error = reason instanceof Error ? reason.message : '表达式无效'; }
  return <section className={styles.workspace}><div className={styles.toolbar}><Field label="表达式"><input value={pattern} onChange={(event) => setPattern(event.target.value)} /></Field><Field label="Flags"><input value={flags} onChange={(event) => setFlags(event.target.value.replace(/[^dgimsuvy]/g, ''))} /></Field></div><textarea className={styles.textarea} value={text} onChange={(event) => setText(event.target.value)} />{error ? <p className={styles.error}>{error}</p> : <div className={styles.preview}><b>{matches.length} 个匹配</b>{matches.map((match, index) => <p key={`${match.index}-${index}`}><mark className={styles.match}>{match[0]}</mark> @ {match.index} {match.length > 1 && `· 捕获组：${match.slice(1).join(' | ')}`}</p>)}</div>}</section>;
}

function hexToRgb(hex: string) { const raw = hex.replace('#', ''); if (!/^[0-9a-f]{6}$/i.test(raw)) return null; const value = parseInt(raw, 16); return [(value >> 16) & 255, (value >> 8) & 255, value & 255]; }
function rgbToHsl([r, g, b]: number[]) { r /= 255; g /= 255; b /= 255; const max = Math.max(r, g, b); const min = Math.min(r, g, b); let h = 0; let s = 0; const l = (max + min) / 2; if (max !== min) { const d = max - min; s = l > .5 ? d / (2 - max - min) : d / (max + min); h = max === r ? (g - b) / d + (g < b ? 6 : 0) : max === g ? (b - r) / d + 2 : (r - g) / d + 4; h /= 6; } return [Math.round(h * 360), Math.round(s * 100), Math.round(l * 100)]; }
const luminance = (rgb: number[]) => { const values = rgb.map((value) => { const n = value / 255; return n <= .03928 ? n / 12.92 : ((n + .055) / 1.055) ** 2.4; }); return .2126 * values[0] + .7152 * values[1] + .0722 * values[2]; };
function ColorTool() {
  const [foreground, setForeground] = useState('#17212b');
  const [background, setBackground] = useState('#ffffff');
  // 手输过程中会出现 "#1" 这类半成品，取上一次有效值兜底，避免边打字边崩
  const rgb = hexToRgb(foreground);
  const bg = hexToRgb(background);
  if (!rgb || !bg) {
    return <section className={styles.workspace}>
      <div className={styles.toolbar}>
        <ColorField label="前景色" value={foreground} onChange={setForeground} />
        <ColorField label="背景色" value={background} onChange={setBackground} />
      </div>
      <p className={styles.error}>请输入完整的 6 位 HEX 颜色，例如 #17212b。</p>
    </section>;
  }
  const hsl = rgbToHsl(rgb);
  const ratio = (Math.max(luminance(rgb), luminance(bg)) + .05) / (Math.min(luminance(rgb), luminance(bg)) + .05);
  const grade = ratio >= 7 ? 'AAA' : ratio >= 4.5 ? 'AA' : ratio >= 3 ? 'AA 大字' : '未通过';
  return <section className={styles.workspace}>
    <div className={styles.toolbar}>
      <ColorField label="前景色" value={foreground} onChange={setForeground} />
      <ColorField label="背景色" value={background} onChange={setBackground} />
      <div className={`${styles.toolbarSpacer} ${styles.paneActions}`}>
        <CopyButton value={foreground} label="复制前景色" />
        <button className={styles.button} onClick={() => { setForeground(background); setBackground(foreground); }}>⇄ 交换</button>
      </div>
    </div>
    <div className={styles.preview} style={{ color: foreground, background }}>
      <h2>Readable design starts with contrast.</h2>
      <p>清晰的对比度让每个人都更容易阅读内容。</p>
      <p style={{ fontSize: 13 }}>小号正文需要 4.5:1，大号标题需要 3:1。</p>
    </div>
    <div className={styles.statGrid}>
      <div className={styles.stat}>RGB<b>{rgb.join(', ')}</b></div>
      <div className={styles.stat}>HSL<b>{hsl[0]}° {hsl[1]}% {hsl[2]}%</b></div>
      <div className={styles.stat}>对比度<b>{ratio.toFixed(2)} : 1</b></div>
      <div className={styles.stat}>WCAG<b>{grade}</b></div>
    </div>
    {ratio < 4.5 && <p className={styles.warning}>当前对比度低于 WCAG AA 对正文的 4.5:1 要求。</p>}
  </section>;
}

function PaletteTool({ gradient = false }: { gradient?: boolean }) {
  const [base, setBase] = useState('#7c5cff');
  const [angle, setAngle] = useState(120);
  const rgb = hexToRgb(base);
  if (!rgb) {
    return <section className={styles.workspace}>
      <div className={styles.toolbar}><ColorField label="基准色" value={base} onChange={setBase} /></div>
      <p className={styles.error}>请输入完整的 6 位 HEX 颜色，例如 #7c5cff。</p>
    </section>;
  }
  const hsl = rgbToHsl(rgb);
  const colors = [0, 30, 60, 180, 240].map((offset) => `hsl(${(hsl[0] + offset) % 360} ${Math.max(35, hsl[1])}% ${Math.min(72, Math.max(34, hsl[2]))}%)`);
  const css = `linear-gradient(${angle}deg, ${base}, ${colors[3]})`;
  return <section className={styles.workspace}>
    <div className={styles.toolbar}>
      <ColorField label="基准色" value={base} onChange={setBase} />
      {gradient && <Field label={`角度 ${angle}°`}><input type="range" min="0" max="360" value={angle} onChange={(event) => setAngle(Number(event.target.value))} /></Field>}
      <div className={`${styles.toolbarSpacer} ${styles.paneActions}`}>
        <CopyButton value={gradient ? `background: ${css};` : colors.join('\n')} label={gradient ? '复制 CSS' : '复制全部色值'} primary />
      </div>
    </div>
    {gradient ? <div className={styles.preview} style={{ minHeight: 320, background: css }} /> : <>
      <div className={styles.swatches}>
        {colors.map((color) => <button type="button" key={color} className={styles.swatch} style={{ background: color }} onClick={() => copyText(color)} title="点击复制"><span>{color}</span></button>)}
      </div>
      <p className={styles.loading}>点击任意色块可复制该色值。</p>
    </>}
    {gradient && <pre className={styles.codeBlock} style={{ marginTop: 14 }}><code>background: {css};</code></pre>}
  </section>;
}

function ImageBase64Tool() {
  const [data, setData] = useState(''); const [name, setName] = useState('');
  const read = (file?: File) => { if (!file) return; setName(file.name); const reader = new FileReader(); reader.onload = () => setData(String(reader.result)); reader.readAsDataURL(file); };
  return <section className={styles.workspace}><div className={styles.toolbar}><Field label="选择图片"><input type="file" accept="image/*" onChange={(event) => read(event.target.files?.[0])} /></Field><CopyButton value={data} label="复制 Data URL" /><button className={styles.button} disabled={!data} onClick={() => downloadTextFile(data, `${name || 'image'}.txt`)}>下载文本</button></div>{data && <><p className={styles.warning}>Base64 通常比原二进制大约多 33%，不适合大型图片。</p><div className={styles.preview}><img src={data} alt={name || '本地图片预览'} /></div><textarea className={styles.textarea} readOnly value={data} /></>}</section>;
}

function ImageCompressTool() {
  const [source, setSource] = useState(''); const [result, setResult] = useState<Blob | null>(null); const [quality, setQuality] = useState(.82); const [format, setFormat] = useState('image/webp');
  const read = (file?: File) => { if (!file) return; const reader = new FileReader(); reader.onload = () => { setSource(String(reader.result)); setResult(null); }; reader.readAsDataURL(file); };
  const compress = async () => { if (!source) return; const image = new Image(); image.src = source; await image.decode(); const canvas = document.createElement('canvas'); canvas.width = image.naturalWidth; canvas.height = image.naturalHeight; canvas.getContext('2d')!.drawImage(image, 0, 0); canvas.toBlob((blob) => setResult(blob), format, quality); };
  return <section className={styles.workspace}><div className={styles.toolbar}><Field label="图片"><input type="file" accept="image/*" onChange={(event) => read(event.target.files?.[0])} /></Field><Field label={`质量 ${Math.round(quality * 100)}%`}><input type="range" min="10" max="100" value={quality * 100} onChange={(event) => setQuality(Number(event.target.value) / 100)} /></Field><Field label="格式"><select value={format} onChange={(event) => setFormat(event.target.value)}><option value="image/webp">WebP</option><option value="image/jpeg">JPEG</option><option value="image/png">PNG</option></select></Field><button className={`${styles.button} ${styles.buttonPrimary}`} disabled={!source} onClick={compress}>压缩</button><button className={styles.button} disabled={!result} onClick={() => result && downloadBlob(result, `compressed.${format.split('/')[1]}`)}>下载 {result ? `${(result.size / 1024).toFixed(1)} KB` : ''}</button></div>{source && <div className={styles.preview}><img src={source} alt="待压缩图片预览" /></div>}</section>;
}

function QrCodeTool() {
  const [text, setText] = useState('https://example.com'); const [level, setLevel] = useState('M'); const [dark, setDark] = useState('#17212b'); const [url, setUrl] = useState(''); const [svg, setSvg] = useState(''); const [error, setError] = useState('');
  useEffect(() => { let active = true; import('qrcode').then((QRCode) => Promise.all([QRCode.toDataURL(text || ' ', { errorCorrectionLevel: level as 'L' | 'M' | 'Q' | 'H', width: 640, margin: 2, color: { dark, light: '#ffffff' } }), QRCode.toString(text || ' ', { type: 'svg', errorCorrectionLevel: level as 'L' | 'M' | 'Q' | 'H', margin: 2, color: { dark, light: '#ffffff' } })])).then(([nextUrl, nextSvg]) => { if (active) { setUrl(nextUrl); setSvg(nextSvg); setError(''); } }).catch((reason) => setError(String(reason))); return () => { active = false; }; }, [dark, level, text]);
  return <section className={styles.workspace}><div className={styles.toolbar}><Field label="内容"><input value={text} onChange={(event) => setText(event.target.value)} /></Field><Field label="容错"><select value={level} onChange={(event) => setLevel(event.target.value)}>{['L','M','Q','H'].map((item) => <option key={item}>{item}</option>)}</select></Field><ColorField label="前景色" value={dark} onChange={setDark} /><div className={`${styles.toolbarSpacer} ${styles.paneActions}`}><a className={`${styles.button} ${styles.buttonPrimary}`} href={url} download="qrcode.png">下载 PNG</a><button className={styles.button} onClick={() => downloadTextFile(svg, 'qrcode.svg', 'image/svg+xml')}>下载 SVG</button></div></div>{error ? <p className={styles.error}>{error}</p> : <div className={styles.preview} style={{ textAlign: 'center' }}><img src={url} alt="生成的二维码" style={{ width: 320 }} /></div>}</section>;
}

export default function SpecialToolView({ slug }: { slug: string }) {
  const meta = getTool(slug)!;
  const body = (() => { switch (slug) {
    case 'timestamp': return <TimestampTool />; case 'timezone': return <TimezoneTool />; case 'cron': return <CronTool />; case 'text-diff': return <DiffTool />; case 'regex-tester': return <RegexTool />; case 'color': return <ColorTool />; case 'palette': return <PaletteTool />; case 'gradient': return <PaletteTool gradient />; case 'image-base64': return <ImageBase64Tool />; case 'image-compress': return <ImageCompressTool />; case 'qrcode': return <QrCodeTool />; default: return null;
  } })();
  return <ToolShell meta={meta}>{body}</ToolShell>;
}

export const SPECIAL_TOOL_SLUGS = ['timestamp', 'timezone', 'cron', 'text-diff', 'regex-tester', 'color', 'palette', 'gradient', 'image-base64', 'image-compress', 'qrcode'];

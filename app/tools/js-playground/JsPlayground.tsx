'use client';

import dynamic from 'next/dynamic';
import { useEffect, useMemo, useRef, useState } from 'react';
import { javascript } from '@codemirror/lang-javascript';
import { oneDark } from '@codemirror/theme-one-dark';
import { getTool } from '@/lib/tools/registry';
import ToolShell from '@/components/tools/ToolShell';
import shared from '@/components/tools/tools-shared.module.css';
import styles from './playground.module.css';

const CodeMirror = dynamic(() => import('@uiw/react-codemirror'), {
  ssr: false,
  loading: () => <div className={styles.consoleEmpty}>正在加载编辑器…</div>,
});

type Log = { level: string; values: unknown[]; at: string };

const EXAMPLES: Record<string, string> = {
  '数组方法': `const numbers = [3, 1, 4, 1, 5, 9];\nconst result = numbers.filter(n => n % 2).map(n => n ** 2);\nconsole.log({ numbers, result });`,
  'Promise / async': `const wait = ms => new Promise(resolve => setTimeout(resolve, ms));\nasync function main() {\n  console.log('start');\n  await wait(300);\n  console.log('done');\n}\nmain();`,
  'Intl 格式化': `const amount = 123456.78;\nconsole.table(['CNY','USD','JPY'].map(currency => ({\n  currency,\n  value: new Intl.NumberFormat('zh-CN', { style: 'currency', currency }).format(amount)\n})));`,
  '隔离验证': `try {\n  console.log(window.parent.document);\n} catch (error) {\n  console.error('父页面已隔离：', error.message);\n}`,
};

function encodeCode(value: string) {
  const bytes = new TextEncoder().encode(value);
  let binary = '';
  bytes.forEach((byte) => { binary += String.fromCharCode(byte); });
  return btoa(binary).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
}

function decodeCode(value: string) {
  const binary = atob(value.replace(/-/g, '+').replace(/_/g, '/').padEnd(Math.ceil(value.length / 4) * 4, '='));
  return new TextDecoder().decode(Uint8Array.from(binary, (char) => char.charCodeAt(0)));
}

function runnerDocument(code: string) {
  const safeCode = JSON.stringify(code).replace(/</g, '\\u003c');
  return `<!doctype html><meta charset="utf-8"><script>
  const userCode=${safeCode};
  const harness=\`const clean=(value,seen=new WeakSet())=>{if(typeof value==='bigint')return value+'n';if(typeof value==='function')return '[Function '+(value.name||'anonymous')+']';if(typeof value==='symbol')return value.toString();if(value instanceof Error)return {name:value.name,message:value.message,stack:value.stack};if(value&&typeof value==='object'){if(seen.has(value))return '[Circular]';seen.add(value);if(Array.isArray(value))return value.map(item=>clean(item,seen));const result={};for(const key of Object.keys(value).slice(0,100)){try{result[key]=clean(value[key],seen)}catch{result[key]='[Unreadable]'}}return result}return value};['log','info','warn','error','table'].forEach(level=>console[level]=(...values)=>postMessage({kind:'console',level,values:values.map(value=>clean(value)),at:new Date().toISOString()}));self.onerror=(message,source,line,column,error)=>postMessage({kind:'error',level:'error',values:[clean(error||message)],at:new Date().toISOString()});self.onunhandledrejection=event=>postMessage({kind:'error',level:'error',values:[clean(event.reason)],at:new Date().toISOString()});\`;
  const worker=new Worker(URL.createObjectURL(new Blob([harness+'\\n'+userCode+'\\n;postMessage({kind:"done"})'],{type:'text/javascript'})));
  worker.onmessage=event=>parent.postMessage(event.data,'*');
  worker.onerror=event=>parent.postMessage({kind:'error',level:'error',values:[event.message],at:new Date().toISOString()},'*');
  </script>`;
}

function ValueTree({ value, depth = 0 }: { value: unknown; depth?: number }) {
  if (value === null || typeof value !== 'object') {
    return <span>{typeof value === 'string' ? value : String(value)}</span>;
  }
  if (depth > 4) return <span>[…]</span>;
  return (
    <details open={depth < 1}>
      <summary>{Array.isArray(value) ? `Array(${value.length})` : `Object(${Object.keys(value).length})`}</summary>
      <div style={{ paddingLeft: 16 }}>
        {Object.entries(value).map(([key, item]) => (
          <div key={key}><b>{key}:</b> <ValueTree value={item} depth={depth + 1} /></div>
        ))}
      </div>
    </details>
  );
}

export default function JsPlayground() {
  const meta = getTool('js-playground')!;
  const [code, setCode] = useState(EXAMPLES['数组方法']);
  const [logs, setLogs] = useState<Log[]>([]);
  const [run, setRun] = useState<{ id: number; code: string } | null>(null);
  const [status, setStatus] = useState<{ text: string; tone: 'idle' | 'running' | 'done' | 'stopped' }>({
    text: '就绪',
    tone: 'idle',
  });
  const frameRef = useRef<HTMLIFrameElement>(null);
  const extensions = useMemo(() => [javascript({ jsx: true })], []);

  useEffect(() => {
    const hash = new URLSearchParams(window.location.hash.slice(1)).get('code');
    const saved = window.localStorage.getItem('tool-draft:js-playground');
    try {
      if (hash) setCode(decodeCode(hash));
      else if (saved) setCode(saved);
    } catch { /* 分享链接损坏时保留默认示例 */ }
  }, []);

  useEffect(() => { window.localStorage.setItem('tool-draft:js-playground', code); }, [code]);

  useEffect(() => {
    if (!run) return;
    // 超时守卫只针对没跑完的代码，正常结束时必须撤销，否则会覆盖「执行完成」
    const timer = window.setTimeout(() => {
      setRun(null);
      setStatus({ text: '已在 3 秒后终止', tone: 'stopped' });
    }, 3000);
    const handler = (event: MessageEvent) => {
      if (event.source !== frameRef.current?.contentWindow) return;
      if (event.data?.kind === 'console' || event.data?.kind === 'error') {
        setLogs((old) => [...old, event.data].slice(-500));
      }
      if (event.data?.kind === 'done') {
        window.clearTimeout(timer);
        setStatus({ text: '执行完成', tone: 'done' });
      }
    };
    window.addEventListener('message', handler);
    return () => { window.removeEventListener('message', handler); window.clearTimeout(timer); };
  }, [run]);

  const execute = () => {
    setLogs([]);
    setStatus({ text: '运行中…', tone: 'running' });
    setRun({ id: Date.now(), code });
  };

  const share = async () => {
    history.replaceState(null, '', `${location.pathname}#code=${encodeCode(code)}`);
    await navigator.clipboard.writeText(location.href);
    setStatus({ text: '分享链接已复制', tone: 'done' });
  };

  const statusClass = {
    idle: '',
    running: styles.statusRunning,
    done: styles.statusDone,
    stopped: styles.statusStopped,
  }[status.tone];

  return (
    <ToolShell meta={meta}>
      <section
        className={shared.workspace}
        onKeyDown={(event) => {
          if ((event.ctrlKey || event.metaKey) && event.key === 'Enter') { event.preventDefault(); execute(); }
        }}
      >
        <div className={shared.toolbar}>
          <button className={`${shared.button} ${shared.buttonPrimary}`} onClick={execute}>
            运行 · Ctrl/⌘ Enter
          </button>
          <select
            className={shared.input}
            defaultValue=""
            onChange={(event) => { if (event.target.value) setCode(EXAMPLES[event.target.value]); }}
            aria-label="加载示例"
          >
            <option value="" disabled>加载示例…</option>
            {Object.keys(EXAMPLES).map((name) => <option key={name}>{name}</option>)}
          </select>
          <button className={shared.button} onClick={() => setLogs([])} disabled={!logs.length}>
            清空控制台
          </button>
          <button className={shared.button} onClick={share}>复制分享链接</button>
          <span className={`${styles.status} ${statusClass}`}>{status.text}</span>
        </div>

        <div className={styles.grid}>
          <div className={styles.pane}>
            <div className={styles.paneHead}>
              <span>index.js</span>
              <span className={styles.paneCount}>{code.split('\n').length} 行</span>
            </div>
            <div className={styles.editor}>
              <CodeMirror
                value={code}
                height="100%"
                theme={oneDark}
                extensions={extensions}
                onChange={setCode}
                basicSetup={{ autocompletion: true, bracketMatching: true, lineNumbers: true }}
              />
            </div>
          </div>

          <div className={styles.pane}>
            <div className={styles.paneHead}>
              <span>Console</span>
              <span className={styles.paneCount}>{logs.length} 条</span>
            </div>
            <div className={styles.console}>
              {logs.length === 0 ? (
                <div className={styles.consoleEmpty}>
                  <span>运行代码后，console 输出会出现在这里。</span>
                  <span><kbd>Ctrl</kbd> / <kbd>⌘</kbd> + <kbd>Enter</kbd> 可直接运行</span>
                </div>
              ) : logs.map((log, index) => (
                <div
                  key={`${log.at}-${index}`}
                  className={`${styles.logLine} ${log.level === 'error' ? styles.logError : ''} ${log.level === 'warn' ? styles.logWarn : ''}`}
                >
                  <span className={styles.level}>{log.level.toUpperCase()}</span>
                  <span className={styles.logValues}>
                    {log.values.map((value, valueIndex) => <ValueTree key={valueIndex} value={value} />)}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {run && (
          <iframe
            key={run.id}
            ref={frameRef}
            title="JavaScript 隔离执行沙箱"
            sandbox="allow-scripts"
            srcDoc={runnerDocument(run.code)}
            className={styles.sandbox}
          />
        )}

        <p className={shared.warning}>
          代码在无同源权限的沙箱 iframe 内，通过独立 Worker 执行；无法读取本站 DOM、Cookie 或 localStorage。运行超过 3 秒会销毁沙箱。
        </p>
      </section>
    </ToolShell>
  );
}

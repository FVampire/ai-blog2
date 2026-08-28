'use client';

import { useEffect, useMemo, useState } from 'react';
import { downloadTextFile } from '@/lib/tools/download';
import { getTool } from '@/lib/tools/registry';
import { TRANSFORMS } from '@/lib/tools/transforms';
import CopyButton from './CopyButton';
import ToolShell from './ToolShell';
import styles from './tools-shared.module.css';

export default function TransformToolView({ slug }: { slug: string }) {
  const meta = getTool(slug)!;
  const def = TRANSFORMS[slug];
  const defaults = useMemo(
    () => Object.fromEntries((def.options ?? []).map((option) => [option.key, option.defaultValue])),
    [def],
  );
  const [input, setInput] = useState('');
  const [output, setOutput] = useState('');
  const [error, setError] = useState('');
  const [dragging, setDragging] = useState(false);
  const [nonce, setNonce] = useState(0);
  const [options, setOptions] = useState<Record<string, string | boolean | number>>(defaults);
  const generator = Boolean(def.generator);

  useEffect(() => {
    if (generator) return;
    const saved = window.localStorage.getItem(`tool-draft:${slug}`);
    if (saved != null) setInput(saved);
  }, [generator, slug]);

  useEffect(() => {
    if (!generator) window.localStorage.setItem(`tool-draft:${slug}`, input);
    const timer = window.setTimeout(async () => {
      if (!generator && !input.trim()) { setOutput(''); setError(''); return; }
      try {
        if (def.execution === 'server') {
          const response = await fetch(`/api/tools/transform/${slug}`, {
            method: 'POST',
            headers: { 'content-type': 'application/json' },
            body: JSON.stringify({ input, options }),
          });
          const body = await response.json();
          if (!body.success) throw new Error(body.error);
          setOutput(body.data.output);
        } else {
          if (!def.run) throw new Error('工具实现不可用');
          setOutput(await def.run(input, options));
        }
        setError('');
      } catch (reason) {
        setOutput('');
        setError(reason instanceof Error ? reason.message : '转换失败');
      }
    }, 180);
    return () => window.clearTimeout(timer);
  }, [def, generator, input, nonce, options, slug]);

  const swap = async () => {
    if (!def.reverse) return;
    try {
      setInput(await def.reverse(output, options));
      setError('');
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : '反向转换失败');
    }
  };

  const setOption = (key: string, value: string | boolean | number) =>
    setOptions((old) => ({ ...old, [key]: value }));

  return (
    <ToolShell meta={meta}>
      <section className={styles.workspace}>
        <div className={styles.toolbar}>
          {(def.options ?? []).map((option) => {
            // 两三个选项用分段控件比下拉框更快，也更能一眼看到全部可选项
            if (option.type === 'select' && (option.choices?.length ?? 0) <= 3) {
              return (
                <div className={styles.field} key={option.key}>
                  {option.label}
                  <div className={styles.segmented} role="group" aria-label={option.label}>
                    {option.choices?.map((choice) => (
                      <button
                        key={choice.value}
                        type="button"
                        className={`${styles.segment} ${String(options[option.key]) === choice.value ? styles.segmentActive : ''}`}
                        onClick={() => setOption(option.key, choice.value)}
                      >
                        {choice.label}
                      </button>
                    ))}
                  </div>
                </div>
              );
            }

            return (
              <label className={styles.field} key={option.key}>
                {option.label}
                {option.type === 'select' && (
                  <select
                    value={String(options[option.key])}
                    onChange={(event) => setOption(option.key, event.target.value)}
                  >
                    {option.choices?.map((choice) => (
                      <option key={choice.value} value={choice.value}>{choice.label}</option>
                    ))}
                  </select>
                )}
                {(option.type === 'text' || option.type === 'number') && (
                  <input
                    type={option.type}
                    value={String(options[option.key])}
                    min={option.type === 'number' ? 1 : undefined}
                    onChange={(event) => setOption(
                      option.key,
                      option.type === 'number' ? Number(event.target.value) : event.target.value,
                    )}
                  />
                )}
                {option.type === 'toggle' && (
                  <span className={styles.switch}>
                    <input
                      type="checkbox"
                      checked={Boolean(options[option.key])}
                      onChange={(event) => setOption(option.key, event.target.checked)}
                    />
                  </span>
                )}
              </label>
            );
          })}

          <div className={`${styles.toolbarSpacer} ${styles.paneActions}`}>
            {generator ? (
              <button
                className={`${styles.button} ${styles.buttonPrimary}`}
                type="button"
                onClick={() => setNonce((value) => value + 1)}
              >
                重新生成
              </button>
            ) : (
              <>
                {def.samples?.map((sample) => (
                  <button
                    className={styles.button}
                    type="button"
                    key={sample.label}
                    onClick={() => setInput(sample.value)}
                  >
                    {sample.label}
                  </button>
                ))}
                {def.reverse && (
                  <button className={styles.button} type="button" disabled={!output} onClick={swap}>
                    ⇄ 结果转输入
                  </button>
                )}
                <button
                  className={styles.button}
                  type="button"
                  disabled={!input}
                  onClick={() => { setInput(''); setOutput(''); setError(''); }}
                >
                  清空
                </button>
              </>
            )}
          </div>
        </div>

        {def.warning && <p className={styles.warning}>{def.warning}</p>}

        <div className={generator ? undefined : styles.panes}>
          {!generator && <div className={styles.pane}>
            <div className={styles.paneHeader}>
              <span className={styles.paneTitle}>{def.inputLabel ?? '输入'}</span>
              <span className={styles.paneCount}>{[...input].length} 字符</span>
            </div>
            <textarea
              className={styles.textarea}
              value={input}
              placeholder={def.inputPlaceholder ?? '在这里输入内容，或把文件拖进来…'}
              onChange={(event) => setInput(event.target.value)}
              onDragOver={(event) => { event.preventDefault(); setDragging(true); }}
              onDragLeave={() => setDragging(false)}
              onDrop={async (event) => {
                setDragging(false);
                const file = event.dataTransfer.files[0];
                if (file) { event.preventDefault(); setInput(await file.text()); }
              }}
              style={dragging ? { background: 'color-mix(in srgb, var(--tool-accent) 8%, transparent)' } : undefined}
            />
          </div>}

          <div className={`${styles.pane} ${styles.paneOutput}`}>
            <div className={styles.paneHeader}>
              <span className={styles.paneTitle}>{def.outputLabel ?? '输出'}</span>
              <span className={styles.paneCount}>{[...output].length} 字符</span>
              <span className={styles.paneActions}>
                <CopyButton value={output} small />
                <button
                  className={`${styles.button} ${styles.buttonSmall}`}
                  type="button"
                  disabled={!output}
                  onClick={() => downloadTextFile(output, `${slug}.txt`)}
                >
                  下载
                </button>
              </span>
            </div>
            {output ? (
              <textarea
                className={`${styles.textarea} ${styles.output}`}
                readOnly
                value={output}
                aria-label="转换结果"
              />
            ) : (
              <div className={styles.paneEmpty}>
                <b>{error ? '暂无结果' : '结果会实时显示在这里'}</b>
                {error
                  ? '请先修正左侧输入。'
                  : generator ? '调整上方选项即可生成。' : '在左侧输入内容后自动转换，无需点击按钮。'}
              </div>
            )}
            {generator && <p className={styles.loading} style={{ padding: '0 14px 14px' }}>调整上方选项即可实时重新生成。</p>}
          </div>
        </div>

        {error && <p className={styles.error} role="alert">{error}</p>}
      </section>
    </ToolShell>
  );
}

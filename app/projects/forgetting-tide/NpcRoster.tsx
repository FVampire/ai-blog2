'use client';

import { useEffect, useMemo, useState } from 'react';

import Image from 'next/image';

import { npcFactions, npcs, type Npc, type NpcFaction } from './data';
import styles from './forgetting-tide.module.css';

type Filter = NpcFaction | '全部';

function Portrait({ npc }: { npc: Npc }) {
  return (
    <div className={styles.castPortrait}>
      {npc.src ? (
        <Image src={npc.src} alt={`${npc.name}立绘`} fill sizes="(max-width: 700px) 100vw, 28vw" />
      ) : (
        <>
          <span className={styles.portraitGlyph} aria-hidden="true">{npc.glyph}</span>
          <span className={styles.portraitCut} aria-hidden="true" />
        </>
      )}
      <span className={styles.portraitArchive}>ARCHIVE {npc.archive}</span>
      {!npc.src && <span className={styles.portraitStatus}>影像已剥离</span>}
    </div>
  );
}

function npcFromHash() {
  if (typeof window === 'undefined') return npcs[0].id;
  const id = window.location.hash.replace('#', '');
  return npcs.some((npc) => npc.id === id) ? id : npcs[0].id;
}

export default function NpcRoster() {
  const [filter, setFilter] = useState<Filter>('全部');
  const [selectedId, setSelectedId] = useState(npcs[0].id);

  useEffect(() => {
    const applyHash = () => setSelectedId(npcFromHash());
    applyHash();
    window.addEventListener('hashchange', applyHash);
    return () => window.removeEventListener('hashchange', applyHash);
  }, []);

  const visible = useMemo(
    () => (filter === '全部' ? npcs : npcs.filter((npc) => npc.faction === filter)),
    [filter],
  );

  const selected: Npc = visible.find((npc) => npc.id === selectedId) ?? visible[0] ?? npcs[0];
  const splash = selected.splash ?? selected.src ?? '/projects/forgetting-tide/hero.png';

  return (
    <div className={styles.npcStage}>
      <article className={styles.championSplash} id="spotlight">
        <Image src={splash} alt={selected.splashAlt ?? `${selected.name}场景`} fill sizes="100vw" priority />
        <div className={styles.championShade} />
        <div className={styles.championCopy}>
          <span>{selected.faction} · {selected.role}</span>
          <h2>{selected.name}</h2>
          <small>{selected.nameEn}</small>
          <p>{selected.title}</p>
          <blockquote>{selected.claim}</blockquote>
        </div>
      </article>

      <div className={styles.championDossier}>
        <Portrait npc={selected} />
        <div className={styles.championBio}>
          {selected.bio.map((paragraph) => <p key={paragraph.slice(0, 16)}>{paragraph}</p>)}
          <dl>
            <div><dt>身份</dt><dd>{selected.identity}</dd></div>
            <div><dt>立场</dt><dd>{selected.position}</dd></div>
            <div><dt>物证</dt><dd>{selected.evidence}</dd></div>
            <div><dt>代价</dt><dd>{selected.cost}</dd></div>
          </dl>
        </div>
      </div>

      <div className={styles.npcFilters} role="tablist" aria-label="人物阵营">
        {npcFactions.map((faction) => (
          <button
            key={faction}
            type="button"
            role="tab"
            aria-selected={filter === faction}
            className={filter === faction ? styles.npcFilterActive : undefined}
            onClick={() => {
              setFilter(faction);
              const next = faction === '全部' ? npcs[0] : npcs.find((npc) => npc.faction === faction);
              if (next) setSelectedId(next.id);
            }}
          >
            {faction}
          </button>
        ))}
      </div>

      <div className={styles.championGrid} id="roster">
        {visible.map((npc) => (
          <button
            key={npc.id}
            type="button"
            className={`${styles.championTile} ${npc.id === selected.id ? styles.championTileActive : ''}`}
            onClick={() => {
              setSelectedId(npc.id);
              window.history.replaceState(null, '', `#${npc.id}`);
              document.getElementById('spotlight')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
            }}
          >
            <Portrait npc={npc} />
            <span>
              <b>{npc.name}</b>
              <i>{npc.nameEn}</i>
              <small>{npc.faction}</small>
            </span>
          </button>
        ))}
      </div>
    </div>
  );
}

import Image from 'next/image';

import styles from './forgetting-tide.module.css';

const stages = [
  ['1', 'STAGE 01 · 灯尾兔影'],
  ['2', 'STAGE 02 · 引路灯尾'],
  ['3', 'STAGE 03 · 万家灯火'],
] as const;

export default function CompanionGrowth() {
  return (
    <>
      <div className={styles.creatureSection}>
        <div className={styles.creatureCopy}>
          <div className={styles.sectionMark}>04 / COMPANIONS</div>
          <h2>它们不是抽到的，<br />是被认出来的。</h2>
          <p>残响不是怪物，是某个人被潮汐带走的那一部分，脱离主人之后长出的形状。你不能抓它，也不能召唤它。你只能先观察清楚它到底是谁的残响，把仍然指向它的碎片收齐，再让灯塔把那个核心稳定下来。</p>
          <p>所以三阶段成长不是稀有度提升。轮廓一直是同一个，变的是它和你之间累积了多少同行记忆，以及在最后它选择怎么解释自己。</p>
          <div className={styles.creatureTags}>
            {['微光属性', '植忆', '实体召回', '主线生物', '三阶段成长'].map((tag) => <span key={tag}>{tag}</span>)}
          </div>
        </div>
        <div className={styles.evolution}>
          {stages.map(([stage, label]) => (
            <div key={stage}>
              <div className={styles.evolutionImage}>
                <Image
                  src={`/projects/forgetting-tide/creatures/lamp-rabbit-${stage}.png`}
                  alt={`灯尾兔第 ${stage} 阶段形态`}
                  fill
                  sizes="(max-width: 700px) 31vw, (max-width: 980px) 33vw, 20vw"
                />
              </div>
              <span>{label}</span>
            </div>
          ))}
        </div>
      </div>
      <figure className={styles.codexEvidence}>
        <Image
          src="/projects/forgetting-tide/screenshots/creature-detail.png"
          alt="灯笼菇图鉴与三阶段进化路线实机界面"
          fill
          sizes="100vw"
        />
        <figcaption className={styles.mediaBadge}>IN-GAME CODEX · 灯笼菇</figcaption>
      </figure>
    </>
  );
}

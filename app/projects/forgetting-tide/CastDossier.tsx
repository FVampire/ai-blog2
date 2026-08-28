import Image from 'next/image';

import styles from './forgetting-tide.module.css';

type CastPortraitProps = {
  archive: string;
  glyph: string;
  name: string;
  src?: string;
};

type CastMember = CastPortraitProps & {
  identity: string;
  position: string;
  claim: string;
  evidence: string;
  cost: string;
};

const cast: CastMember[] = [
  {
    archive: 'P-00',
    glyph: '寻',
    name: '寻潮者 TIDEWALKER',
    identity: '姓名已被整齐切除的调查者',
    position: '潮灯之家最后一名寻潮者',
    claim: '「我不记得我是谁，但灯塔认得我的手。」',
    evidence: '一盏仍会对他亮起的提灯',
    cost: '每固定一次映照，他自己也少一点',
  },
  {
    archive: 'P-01',
    glyph: '伊',
    name: '伊芮 IRIE',
    identity: '灰烬医院夜班护士',
    position: '救护必须继续，但封锁必须结束',
    claim: '「我们把能救的人都带进来了。」',
    evidence: '急救记录、药房钥匙、被撕掉的封锁命令',
    cost: '她签过那道命令，也撕过它',
  },
  {
    archive: 'P-02',
    glyph: '塞',
    name: '塞勒 SELLER',
    identity: '被收容者',
    position: '没有自由的救护就是囚禁',
    claim: '「门锁上以后，救护就变成了囚禁。」',
    evidence: '空号病床、地下划痕、夜间点名册',
    cost: '他记得的名字里有三个从未存在',
  },
  {
    archive: 'P-03',
    glyph: '米',
    name: '米娅 MIA',
    identity: '灰烬孩子',
    position: '大人的恐惧已经获得了形状',
    claim: '「大人害怕的东西，会沿着纸边爬出来。」',
    evidence: '被反复描画的病历边缘',
    cost: '她看见的，最后都会真的出现',
  },
];

export function CastPortrait({ archive, glyph, name, src }: CastPortraitProps) {
  return (
    <div className={styles.castPortrait}>
      {src ? (
        <Image src={src} alt={`${name}角色立绘`} fill sizes="(max-width: 700px) 100vw, (max-width: 980px) 50vw, 25vw" />
      ) : (
        <>
          <span className={styles.portraitGlyph} aria-hidden="true">{glyph}</span>
          <span className={styles.portraitCut} aria-hidden="true" />
        </>
      )}
      <span className={styles.portraitArchive}>ARCHIVE {archive}</span>
      {!src && <span className={styles.portraitStatus}>影像已剥离</span>}
    </div>
  );
}

export default function CastDossier() {
  return (
    <>
      <figure className={styles.keyVisual}>
        <Image
          src="/projects/forgetting-tide/concepts/visual-anchor.png"
          alt="潮灯之家外滩，寻潮者与三只同行生物望向记忆灯塔"
          fill
          sizes="100vw"
        />
        <figcaption className={styles.mediaBadge}>KEY VISUAL · 潮灯之家外滩</figcaption>
      </figure>
      <div className={styles.castGrid}>
        {cast.map((member) => (
          <article key={member.archive} className={styles.castCard}>
            <CastPortrait {...member} />
            <div className={styles.castCardCopy}>
              <span>{member.archive}</span>
              <h3>{member.name}</h3>
              <dl>
                <div><dt>身份</dt><dd>{member.identity}</dd></div>
                <div><dt>立场</dt><dd>{member.position}</dd></div>
                <div><dt>他主张什么</dt><dd>{member.claim}</dd></div>
                <div><dt>物证</dt><dd>{member.evidence}</dd></div>
                <div><dt>代价</dt><dd>{member.cost}</dd></div>
              </dl>
            </div>
          </article>
        ))}
      </div>
    </>
  );
}

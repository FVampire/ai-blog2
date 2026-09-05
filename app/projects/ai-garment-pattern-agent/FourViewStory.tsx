import Image from "next/image";

import styles from "./four-view.module.css";
import { SHOWCASE_MEDIA } from "./showcase-media";

export default function FourViewStory() {
  return (
    <section className={styles.section} id="four-views">
      <header>
        <p className={styles.kicker}>MULTI-VIEW INTELLIGENCE</p>
        <h2>
          四个视角，
          <br />
          <span>始终是同一件衣服。</span>
        </h2>
        <p>
          从正面参考出发，结合款式规格与纸样结构，展开正面、右侧、背面、左侧。领型、门襟、袖口与面料，在不同视角下保持同一套设计语言。
        </p>
      </header>
      <div className={styles.studio}>
        <div className={styles.toolbar}>
          <b>
            SEAM <span>/ CONCEPT STUDIO</span>
          </b>
          <span>BLUE SHIRT · FOUR VIEWS</span>
        </div>
        <div className={styles.sheet}>
          <Image
            src={SHOWCASE_MEDIA.fourViews}
            alt="浅蓝衬衫四视角概念：正面、右侧、背面、左侧"
            width={1536}
            height={1024}
            unoptimized
            sizes="(max-width: 760px) 100vw, 1200px"
          />
        </div>
        <div className={styles.labels}>
          {["01 / 正面", "02 / 右侧", "03 / 背面", "04 / 左侧"].map((label) => (
            <span key={label}>{label}</span>
          ))}
        </div>
        <footer>
          <span>同款参考约束 · 结构信息辅助 · 跨视角一致性检查</span>
          <small>四视图概念 · 视觉优化</small>
        </footer>
      </div>
      <div className={styles.lower}>
        <article className={styles.reconstruction}>
          <div className={styles.cardTitle}>
            <span>01 / RECONSTRUCTION</span>
            <h3>让平面视角，成为立体外观。</h3>
            <p>
              前后轮廓约束衣身，左右视角补充深度，再将视图颜色投射到三维表面。从正面到侧面，连续查看同一款式。
            </p>
          </div>
          <div className={styles.render}>
            <Image
              src={SHOWCASE_MEDIA.reconstruction}
              alt="蓝衬衫实际外观重建示例：正面、45 度与右侧三维渲染"
              width={1700}
              height={1300}
              unoptimized
              sizes="1700px"
            />
          </div>
          <div className={styles.renderLabels}>
            <span>正面</span>
            <span>45°</span>
            <span>右侧</span>
          </div>
          <small className={styles.caption}>四视图案例的实际 3D 外观重建</small>
        </article>
        <article className={styles.review}>
          <span>02 / VISUAL FEEDBACK LOOP</span>
          <h3>
            生成之后，
            <br />
            继续检查与修正。
          </h3>
          <p>
            将候选轮廓与参考视图逐一对照，比较融合策略、调整深度，再渲染复核。把“看起来像”推进为有对照依据的迭代。
          </p>
          <dl>
            <div>
              <dt>正面轮廓 IoU</dt>
              <dd>0.929</dd>
            </div>
            <div>
              <dt>侧面轮廓 IoU</dt>
              <dd>0.642</dd>
            </div>
          </dl>
          <small>
            该重建案例的视图轮廓重合度，1 表示完全重合；用于外观对照。
          </small>
          <div className={styles.flow}>
            四视图 → 轮廓融合 → 深度约束 → 3D 外观 → 渲染复核
          </div>
        </article>
      </div>
    </section>
  );
}

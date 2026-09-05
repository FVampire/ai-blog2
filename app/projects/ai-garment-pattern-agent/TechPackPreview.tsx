import styles from "./showcase.module.css";

export default function TechPackPreview() {
  return (
    <div className={styles.packPreview} aria-label="裹式上衣真实 BOM 参考用量">
      <header>
        <b>SEAM</b>
        <span>TECH PACK / WRAP BLOUSE</span>
      </header>
      <div className={styles.packPreviewTitle}>
        <div>
          <small>STYLE 001 / SIZE M / VERSION 01</small>
          <h4>裹式上衣 · BOM</h4>
        </div>
        <span>纸样驱动的物料清单</span>
      </div>
      <div className={styles.packMetrics}>
        <div>
          <small>主料参考用量</small>
          <b>2.12 m</b>
        </div>
        <div>
          <small>缝纫线参考用量</small>
          <b>89 m</b>
        </div>
        <div>
          <small>有效门幅</small>
          <b>148 cm</b>
        </div>
      </div>
      <div className={styles.packTable}>
        <h5>物料 / 规格 / 参考用量</h5>
        {[
          ["主料", "醋酸涤纶缎面与撞色涤纶缎面", "2.12 m"],
          ["缝纫", "缝纫线", "89 m"],
          ["标识", "样衣临时标 · 款号 / 尺码 / 版本", "1 套"],
        ].map((row) => (
          <div key={row[0]}>
            {row.map((cell, i) => (
              <span key={i}>{cell}</span>
            ))}
          </div>
        ))}
      </div>
      <footer>
        <span>每一项用量，都能追溯到计算依据</span>
        <p>
          主料：裁片净面积 ÷ 门幅 ÷ 80% 参考排料效率。
          <span>缝纫线：缝合及明线长度 × 2.5 × 115%。</span>
        </p>
        <p>
          来自项目技术包实际输出；主料含 27
          件裁剪实例。用量为面积与缝长估算，实际耗用以排料结果为准。
        </p>
      </footer>
    </div>
  );
}

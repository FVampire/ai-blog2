import styles from "./showcase.module.css";
export default function TechPackPreview() {
  return (
    <div className={styles.packPreview} aria-label="样衣技术包产品演示">
      <header>
        <b>SEAM</b>
        <span>TECH PACK / EVERYDAY SHIRT</span>
      </header>
      <div className={styles.packPreviewTitle}>
        <div>
          <small>STYLE 001 / COTTON POPLIN</small>
          <h4>日常衬衫</h4>
        </div>
        <span>工艺与物料</span>
      </div>
      <div className={styles.packMetrics}>
        <div>
          <small>版型</small>
          <b>落肩 · 宽松</b>
        </div>
        <div>
          <small>面料</small>
          <b>棉质府绸</b>
        </div>
        <div>
          <small>文件</small>
          <b>样衣技术包</b>
        </div>
      </div>
      <div className={styles.packTable}>
        <h5>工艺操作卡</h5>
        {[
          ["01", "衣片准备", "核对片名、纱向与对位标记"],
          ["02", "领与领座", "领面组合、领座定位"],
          ["03", "袖片与克夫", "袖口收褶、克夫缝合"],
          ["04", "整烫与复核", "测量成衣尺寸并记录"],
        ].map((row) => (
          <div key={row[0]}>
            {row.map((cell, i) => (
              <span key={i}>{cell}</span>
            ))}
          </div>
        ))}
      </div>
      <footer>
        <span>面辅料清单</span>
        <p>
          主料 / 棉质府绸<span>辅料 / 粘合衬 · 纽扣 · 缝纫线</span>
        </p>
      </footer>
    </div>
  );
}

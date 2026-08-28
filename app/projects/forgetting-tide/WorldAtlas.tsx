import Image from 'next/image';

import styles from './forgetting-tide.module.css';

const markers = [
  { label: '潮灯之家', className: styles.atlasMarkerLighthouse },
  { label: '灰烬医院', className: styles.atlasMarkerHospital },
  { label: '潮汐之眼', className: styles.atlasMarkerEye },
];

export default function WorldAtlas() {
  return (
    <div className={styles.worldAtlas}>
      <Image
        src="/projects/forgetting-tide/concepts/world-atlas.png"
        alt="维拉汀世界地图，标出潮灯之家、灰烬医院与潮汐之眼"
        fill
        sizes="100vw"
      />
      <div className={styles.atlasEdge} aria-hidden="true" />
      {markers.map((marker) => (
        <span key={marker.label} className={`${styles.atlasMarker} ${marker.className}`}>
          <i aria-hidden="true" />
          {marker.label}
        </span>
      ))}
      <span className={styles.mediaBadge}>WORLD ATLAS · VILLATIN</span>
    </div>
  );
}

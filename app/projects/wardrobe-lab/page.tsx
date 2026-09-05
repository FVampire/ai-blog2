import type { Metadata } from "next";

import WardrobeShowcase from "./WardrobeShowcase";

const SITE_URL = (
  process.env.NEXT_PUBLIC_SITE_URL ||
  process.env.SITE_URL ||
  "http://localhost:3000"
).replace(/\/$/, "");

export const metadata: Metadata = {
  title: "Wardrobe Lab · 万千造型，始终是你",
  description:
    "从一张照片到一整个动态衣橱。图像换装、视频创作、实时预览与批量成片，在同一个工作台完成。",
  alternates: { canonical: `${SITE_URL}/projects/wardrobe-lab` },
};

export default function WardrobeLabPage() {
  return <WardrobeShowcase />;
}

import type { Metadata } from "next";

import WardrobeLabExperience from "./WardrobeLabExperience";

const SITE_URL = (
  process.env.NEXT_PUBLIC_SITE_URL ||
  process.env.SITE_URL ||
  "http://localhost:3000"
).replace(/\/$/, "");

export const metadata: Metadata = {
  title: "Wardrobe Lab · 可回看的 AI 换装工作台",
  description:
    "从输入、抠图、解析、美颜、换装到合成，每一步都可以亲手拖动回看。",
  alternates: { canonical: `${SITE_URL}/projects/wardrobe-lab` },
};

export default function WardrobeLabPage() {
  return <WardrobeLabExperience />;
}

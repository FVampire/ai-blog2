"use client";

import { useEffect, useState } from "react";

import Image, { type ImageProps } from "next/image";

type SafeImageProps = ImageProps & { fallbackSrc?: string };

function resolveImageSrc(value: ImageProps["src"], fallback: string) {
  return typeof value === "string" && value.startsWith("/blog-covers/")
    ? fallback
    : value;
}

export default function SafeImage({
  src,
  fallbackSrc = "/uploads/n8n-workflow-automation-series.webp",
  alt,
  ...props
}: SafeImageProps) {
  const [currentSrc, setCurrentSrc] = useState(
    resolveImageSrc(src, fallbackSrc),
  );

  useEffect(
    () => setCurrentSrc(resolveImageSrc(src, fallbackSrc)),
    [src, fallbackSrc],
  );

  return (
    <Image
      {...props}
      src={currentSrc}
      alt={alt}
      onError={() => setCurrentSrc(fallbackSrc)}
    />
  );
}

"use client";

import { useEffect, useState } from "react";

import Image, { type ImageProps } from "next/image";

type SafeImageProps = ImageProps & { fallbackSrc?: string };

export default function SafeImage({
  src,
  fallbackSrc = "/avatar-ai-256.png",
  alt,
  ...props
}: SafeImageProps) {
  const [currentSrc, setCurrentSrc] = useState(src);

  useEffect(() => setCurrentSrc(src), [src]);

  return (
    <Image
      {...props}
      src={currentSrc}
      alt={alt}
      onError={() => setCurrentSrc(fallbackSrc)}
    />
  );
}

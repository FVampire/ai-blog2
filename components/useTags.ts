'use client';

import { useEffect, useState } from 'react';

export interface TagItem {
  id: number;
  name: string;
  slug: string;
  color: string;
  post_count: number;
}

const CACHE_TTL = 30_000;

let cache: { promise: Promise<TagItem[]>; createdAt: number } | null = null;

function loadTags(): Promise<TagItem[]> {
  const now = Date.now();

  if (cache && now - cache.createdAt < CACHE_TTL) {
    return cache.promise;
  }

  const promise = fetch('/api/tags')
    .then((res) => res.json())
    .then((data) => (data?.success && Array.isArray(data.data) ? (data.data as TagItem[]) : []))
    .catch((err) => {
      console.error('Failed to fetch tags:', err);
      cache = null;
      return [] as TagItem[];
    });

  cache = { promise, createdAt: now };
  return promise;
}

export function useTags(): { tags: TagItem[]; loading: boolean } {
  const [tags, setTags] = useState<TagItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;

    loadTags().then((result) => {
      if (cancelled) return;
      setTags(result);
      setLoading(false);
    });

    return () => {
      cancelled = true;
    };
  }, []);

  return { tags, loading };
}

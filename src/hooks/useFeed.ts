'use client';

import { useFeedStore } from '@/stores/feedStore';

export function useFeed() {
  const activeTab = useFeedStore((s) => s.activeTab);
  const pautas = useFeedStore((s) => s.pautas);
  const posts = useFeedStore((s) => s.posts);
  const setActiveTab = useFeedStore((s) => s.setActiveTab);
  const votarPauta = useFeedStore((s) => s.votarPauta);
  const curtirPost = useFeedStore((s) => s.curtirPost);

  return {
    activeTab,
    pautas,
    posts,
    setActiveTab,
    votarPauta,
    curtirPost,
  };
}


'use client';

import React from 'react';
import { FeedTabs } from '@/components/feed/FeedTabs';
import { FeedList } from '@/components/feed/FeedList';
import { useFeed } from '@/hooks/useFeed';

export default function FeedPage() {
  const { activeTab, setActiveTab } = useFeed();

  return (
    <div className="w-full">
      <FeedTabs activeTab={activeTab} onTabChange={setActiveTab} />
      <FeedList feedLevel={activeTab} />
    </div>
  );
}


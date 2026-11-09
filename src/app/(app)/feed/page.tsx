'use client';

import React from 'react';
import { FeedTabs } from '@/components/feed/FeedTabs';
import { FeedList } from '@/components/feed/FeedList';
import { useFeedStore } from '@/stores/feedStore';

export default function FeedPage() {
  const { activeTab, setActiveTab } = useFeedStore();

  return (
    <div className="w-full">
      <FeedTabs activeTab={activeTab} onTabChange={setActiveTab} />
      <FeedList feedLevel={activeTab} onSwitchTab={setActiveTab} />
    </div>
  );
}

'use client';

import React from 'react';
import { FeedLevel, FEED_TABS } from '@/types/feed';
import { cn } from '@/lib/utils/cn';

interface FeedTabsProps {
  activeTab: FeedLevel;
  onTabChange: (tab: FeedLevel) => void;
}

export const FeedTabs: React.FC<FeedTabsProps> = ({ activeTab, onTabChange }) => {
  return (
    <div className="w-full bg-white border-b border-gray-100 sticky top-14 z-30">
      <div className="flex max-w-md mx-auto">
        {FEED_TABS.map((tab) => {
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => onTabChange(tab.id)}
              className={cn(
                'flex-1 py-3 text-center text-xs sm:text-sm font-semibold transition-all relative',
                isActive
                  ? 'text-gray-900 font-bold'
                  : 'text-gray-400 hover:text-gray-600'
              )}
            >
              {tab.label}
              {isActive && (
                <div className="absolute bottom-0 left-0 right-0 h-[2px] bg-gray-900" />
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
};


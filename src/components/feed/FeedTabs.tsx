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
    <div className="w-full bg-white border-b border-zinc-200 sticky top-14 z-30 shadow-2xs">
      <div className="flex max-w-md mx-auto">
        {FEED_TABS.map((tab) => {
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => onTabChange(tab.id)}
              className={cn(
                'flex-1 py-3 text-center text-xs sm:text-sm font-bold transition-all relative cursor-pointer',
                isActive
                  ? 'text-zinc-950 font-black'
                  : 'text-zinc-400 hover:text-zinc-700'
              )}
            >
              <span>{tab.label}</span>
              {isActive && (
                <div className="absolute bottom-0 left-2 right-2 h-[3px] bg-crimson-600 rounded-t-full" />
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
};

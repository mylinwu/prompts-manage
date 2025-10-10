'use client';
import { useState } from 'react';

type TabKey = 'overview' | 'browse' | 'insert' | 'aggregate' | 'indexes';

export function DbTabs({
  children,
}: {
  children: React.ReactNode;
}) {
  const [active, setActive] = useState<TabKey>('overview');
  return (
    <div className="space-y-4">
      <div className="flex gap-2 flex-wrap">
        {[
          ['overview', '概览'],
          ['browse', '浏览'],
          ['insert', '插入'],
          ['aggregate', '聚合'],
          ['indexes', '索引'],
        ].map(([k, label]) => (
          <button
            key={k}
            className={`px-3 py-2 rounded border ${active === k ? 'bg-black text-white' : 'bg-white'}`}
            onClick={() => setActive(k as TabKey)}
          >
            {label}
          </button>
        ))}
      </div>
      <div>
        {Array.isArray(children)
          ? children.find((child: any) => child?.props?.tab === active)
          : children}
      </div>
    </div>
  );
}

export function TabPanel({ tab, children }: { tab: TabKey; children: React.ReactNode }) {
  return <div data-tab={tab}>{children}</div>;
}


import { Suspense } from 'react';
import Link from 'next/link';
import { DbTabs, TabPanel } from './_components/DbTabs';
import { Overview } from './_components/Overview';
import { Browse } from './_components/Browse';
import { InsertForm } from './_components/InsertForm';
import { AggregateRunner } from './_components/AggregateRunner';
import { Indexes } from './_components/Indexes';

export const dynamic = 'force-dynamic';

export default async function TestDbPage() {
  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold">MongoDB 测试台</h1>
        <div className="text-sm text-gray-500">仅用于开发/验证</div>
      </div>

      <Suspense fallback={<div>加载中…</div>}>
        <DbTabs>
          <TabPanel tab="overview">
            <Overview />
          </TabPanel>
          <TabPanel tab="browse">
            <Browse />
          </TabPanel>
          <TabPanel tab="insert">
            <InsertForm />
          </TabPanel>
          <TabPanel tab="aggregate">
            <AggregateRunner />
          </TabPanel>
          <TabPanel tab="indexes">
            <Indexes />
          </TabPanel>
        </DbTabs>
      </Suspense>
    </div>
  );
}

// 页脚链接


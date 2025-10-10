'use client';
import { useRequest } from 'ahooks';
import { useState } from 'react';

async function fetchJson(path: string, init?: RequestInit) {
  const res = await fetch(path, init);
  if (!res.ok) throw new Error(await res.text());
  return res.json();
}

export function Indexes() {
  const { data, loading, error, refresh } = useRequest(() => fetchJson('/api/test/db/indexes'));
  const [keys, setKeys] = useState('{"name": 1}');

  async function createIndex() {
    const body = { keys: JSON.parse(keys) };
    await fetchJson('/api/test/db/indexes', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) });
    refresh();
  }

  return (
    <div className="space-y-3">
      {loading ? (
        <div>加载中…</div>
      ) : error ? (
        <div className="text-red-600">{String(error)}</div>
      ) : (
        <div className="space-y-2">
          <div className="text-sm">当前索引：</div>
          <pre className="bg-gray-50 p-3 rounded text-sm overflow-auto">{JSON.stringify(data, null, 2)}</pre>
        </div>
      )}

      <div className="space-y-2">
        <div className="text-sm">创建索引 keys JSON：</div>
        <input className="border px-3 py-2 rounded w-full" value={keys} onChange={(e) => setKeys(e.target.value)} />
        <button className="px-3 py-2 rounded bg-black text-white" onClick={createIndex}>创建索引</button>
      </div>
    </div>
  );
}


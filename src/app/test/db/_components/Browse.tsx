'use client';
import { useState } from 'react';
import { useRequest } from 'ahooks';

async function fetchJson(path: string) {
  const res = await fetch(path);
  if (!res.ok) throw new Error(await res.text());
  return res.json();
}

export function Browse() {
  const [search, setSearch] = useState('');
  const { data, loading, error, refresh } = useRequest(() => fetchJson(`/api/test/db/records?page=1&pageSize=10&search=${encodeURIComponent(search)}`), {
    refreshDeps: [search],
  });

  return (
    <div className="space-y-3">
      <div className="flex gap-2 items-center">
        <input className="border px-3 py-2 rounded w-64" placeholder="搜索 name/text" value={search} onChange={(e) => setSearch(e.target.value)} />
        <button className="px-3 py-2 rounded border" onClick={() => refresh()}>搜索</button>
      </div>

      {loading ? (
        <div>加载中…</div>
      ) : error ? (
        <div className="text-red-600">{String(error)}</div>
      ) : (
        <div className="overflow-auto">
          <table className="min-w-[600px] border">
            <thead>
              <tr className="bg-gray-50">
                <th className="p-2 text-left border">_id</th>
                <th className="p-2 text-left border">name</th>
                <th className="p-2 text-left border">text</th>
                <th className="p-2 text-left border">tags</th>
                <th className="p-2 text-left border">updatedAt</th>
              </tr>
            </thead>
            <tbody>
              {data?.items?.map((it: any) => (
                <tr key={it._id} className="odd:bg-white even:bg-gray-50">
                  <td className="p-2 border">{String(it._id)}</td>
                  <td className="p-2 border">{it.name}</td>
                  <td className="p-2 border">{it.text}</td>
                  <td className="p-2 border">{Array.isArray(it.tags) ? it.tags.join(', ') : ''}</td>
                  <td className="p-2 border">{it.updatedAt ? new Date(it.updatedAt).toLocaleString() : ''}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}


'use client';
import { useRequest } from 'ahooks';

async function fetchJson(path: string) {
  const res = await fetch(path);
  if (!res.ok) throw new Error(await res.text());
  return res.json();
}

export function Overview() {
  const { data, loading, error, refresh } = useRequest(() => fetchJson('/api/test/db/collections'));
  return (
    <div className="space-y-3">
      <div className="text-lg font-medium">连接与集合</div>
      {loading ? (
        <div>加载中…</div>
      ) : error ? (
        <div className="text-red-600">{String(error)}</div>
      ) : (
        <div>
          <div className="text-sm text-gray-600">集合数量：{data?.collections?.length ?? 0}</div>
          <div className="text-sm break-all">{JSON.stringify(data)}</div>
        </div>
      )}
      <button className="px-3 py-2 rounded border" onClick={() => refresh()}>刷新</button>
    </div>
  );
}


'use client';
import { useState } from 'react';

export function AggregateRunner() {
  const [input, setInput] = useState('[{"$group": {"_id": "$tags", "count": {"$sum": 1}}}]');
  const [output, setOutput] = useState<any>(null);
  const [loading, setLoading] = useState(false);

  async function run() {
    try {
      setLoading(true);
      const pipeline = JSON.parse(input);
      const res = await fetch('/api/test/db/aggregate', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ pipeline }) });
      const json = await res.json();
      if (!res.ok) throw new Error(JSON.stringify(json));
      setOutput(json.result);
    } catch (e) {
      setOutput(String(e));
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="space-y-3">
      <textarea className="border px-3 py-2 rounded w-full" rows={6} value={input} onChange={(e) => setInput(e.target.value)} />
      <button className="px-3 py-2 rounded bg-black text-white" onClick={run} disabled={loading}>{loading ? '运行中…' : '运行聚合'}</button>
      <pre className="text-sm bg-gray-50 p-3 rounded overflow-auto">{output ? JSON.stringify(output, null, 2) : '无结果'}</pre>
    </div>
  );
}


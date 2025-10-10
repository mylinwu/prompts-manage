'use client';
import { useForm } from 'react-hook-form';

type FormValues = {
  name: string;
  text: string;
  tags: string;
};

export function InsertForm() {
  const { register, handleSubmit, reset } = useForm<FormValues>();
  async function onSubmit(values: FormValues) {
    const body = { name: values.name, text: values.text, tags: values.tags ? values.tags.split(',').map(s => s.trim()).filter(Boolean) : [] };
    const res = await fetch('/api/test/db/records', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) });
    if (!res.ok) alert(await res.text()); else {
      reset();
      alert('Inserted');
    }
  }
  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-3 max-w-xl">
      <div>
        <label className="block text-sm mb-1">name</label>
        <input className="border px-3 py-2 rounded w-full" {...register('name', { required: true })} />
      </div>
      <div>
        <label className="block text-sm mb-1">text</label>
        <textarea className="border px-3 py-2 rounded w-full" rows={4} {...register('text', { required: true })} />
      </div>
      <div>
        <label className="block text-sm mb-1">tags（逗号分隔）</label>
        <input className="border px-3 py-2 rounded w-full" placeholder="a,b,c" {...register('tags')} />
      </div>
      <button type="submit" className="px-3 py-2 rounded bg-black text-white">插入</button>
    </form>
  );
}


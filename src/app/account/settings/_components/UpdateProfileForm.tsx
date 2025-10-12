"use client";

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import { useRouter } from 'next/navigation';

const schema = z.object({
	name: z.string().min(1, '请输入姓名').max(64, '姓名过长'),
});

type FormValues = z.infer<typeof schema>;

interface UpdateProfileFormProps {
	initialName?: string | null;
}

export default function UpdateProfileForm({ initialName }: UpdateProfileFormProps) {
	const router = useRouter();
	const [submitting, setSubmitting] = useState(false);
	const { register, handleSubmit, formState: { errors } } = useForm<FormValues>({ 
		resolver: zodResolver(schema),
		defaultValues: {
			name: initialName || '',
		}
	});

	const onSubmit = async (values: FormValues) => {
		setSubmitting(true);
		try {
			const res = await fetch('/api/account/update-profile', {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify(values),
			});
			if (!res.ok) {
				const data = await res.json().catch(() => ({}));
				alert(data.error || '修改失败');
				return;
			}
			alert('资料已更新');
			router.refresh();
		} finally {
			setSubmitting(false);
		}
	};

	return (
		<form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
			<div>
				<label className="block text-sm font-medium mb-1">姓名</label>
				<input 
					type="text" 
					className="w-full border rounded px-3 py-2" 
					{...register('name')} 
				/>
				{errors.name && <p className="text-red-600 text-sm mt-1">{errors.name.message}</p>}
			</div>
			<button type="submit" disabled={submitting} className="bg-black text-white rounded px-4 py-2 disabled:opacity-60">
				{submitting ? '提交中...' : '更新资料'}
			</button>
		</form>
	);
}

"use client";

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';

const schema = z.object({
	oldPassword: z.string().min(8, '至少 8 位'),
	newPassword: z.string().min(8, '至少 8 位'),
});

type FormValues = z.infer<typeof schema>;

export default function ChangePasswordForm() {
	const [submitting, setSubmitting] = useState(false);
	const { register, handleSubmit, formState: { errors }, reset } = useForm<FormValues>({ resolver: zodResolver(schema) });

	const onSubmit = async (values: FormValues) => {
		setSubmitting(true);
		try {
			const res = await fetch('/api/account/change-password', {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify(values),
			});
			if (!res.ok) {
				const data = await res.json().catch(() => ({}));
				alert(data.error || '修改失败');
				return;
			}
			reset();
			alert('密码已更新');
		} finally {
			setSubmitting(false);
		}
	};

	return (
		<form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
			<div>
				<label className="block text-sm font-medium mb-1">旧密码</label>
				<input type="password" className="w-full border rounded px-3 py-2" {...register('oldPassword')} />
				{errors.oldPassword && <p className="text-red-600 text-sm mt-1">{errors.oldPassword.message}</p>}
			</div>
			<div>
				<label className="block text-sm font-medium mb-1">新密码</label>
				<input type="password" className="w-full border rounded px-3 py-2" {...register('newPassword')} />
				{errors.newPassword && <p className="text-red-600 text-sm mt-1">{errors.newPassword.message}</p>}
			</div>
			<button type="submit" disabled={submitting} className="bg-black text-white rounded px-4 py-2 disabled:opacity-60">
				{submitting ? '提交中...' : '更新密码'}
			</button>
		</form>
	);
}

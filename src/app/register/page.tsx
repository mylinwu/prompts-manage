"use client";

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import { useRouter } from 'next/navigation';
import { signIn } from 'next-auth/react';

const schema = z.object({
	name: z.string().min(1, '请输入姓名').max(64),
	email: z.string().email('邮箱格式不正确'),
	password: z.string().min(8, '至少 8 位'),
});

type FormValues = z.infer<typeof schema>;

export default function RegisterPage() {
	const router = useRouter();
	const [loading, setLoading] = useState(false);
	const { register, handleSubmit, formState: { errors } } = useForm<FormValues>({ resolver: zodResolver(schema) });

	const onSubmit = async (values: FormValues) => {
		setLoading(true);
		try {
			const res = await fetch('/api/auth/register', {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify(values),
			});
			if (!res.ok) {
				const data = await res.json().catch(() => ({}));
				alert(data.error || '注册失败');
				return;
			}
			await signIn('credentials', { email: values.email, password: values.password, redirect: false });
			router.push('/account/settings');
		} finally {
			setLoading(false);
		}
	};

	return (
		<div className="max-w-md mx-auto py-10">
			<h1 className="text-2xl font-semibold mb-6">注册</h1>
			<form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
				<div>
					<label className="block text-sm font-medium mb-1">姓名</label>
					<input className="w-full border rounded px-3 py-2" {...register('name')} />
					{errors.name && <p className="text-red-600 text-sm mt-1">{errors.name.message}</p>}
				</div>
				<div>
					<label className="block text-sm font-medium mb-1">邮箱</label>
					<input type="email" className="w-full border rounded px-3 py-2" {...register('email')} />
					{errors.email && <p className="text-red-600 text-sm mt-1">{errors.email.message}</p>}
				</div>
				<div>
					<label className="block text-sm font-medium mb-1">密码</label>
					<input type="password" className="w-full border rounded px-3 py-2" {...register('password')} />
					{errors.password && <p className="text-red-600 text-sm mt-1">{errors.password.message}</p>}
				</div>
				<button type="submit" disabled={loading} className="bg-black text-white rounded px-4 py-2 disabled:opacity-60 w-full">
					{loading ? '提交中...' : '注册'}
				</button>
			</form>
			<div className="mt-6 text-center">
				<p className="text-sm text-gray-600">
					已有账号？{' '}
					<a href="/login" className="text-blue-600 hover:underline">
						立即登录
					</a>
				</p>
			</div>
		</div>
	);
}

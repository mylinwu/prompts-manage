"use client";

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import { useRouter } from 'next/navigation';
import { signIn } from 'next-auth/react';
import { useAlert } from '@/components/AlertProvider';
import api from '@/lib/api-client';

const schema = z.object({
	name: z.string().min(1, '请输入姓名').max(64),
	email: z.string().email('邮箱格式不正确'),
	password: z.string().min(8, '至少 8 位'),
});

type FormValues = z.infer<typeof schema>;

export default function RegisterPage() {
	const router = useRouter();
	const { showAlert } = useAlert();
	const [loading, setLoading] = useState(false);
	const { register, handleSubmit, formState: { errors } } = useForm<FormValues>({ resolver: zodResolver(schema) });

	const onSubmit = async (values: FormValues) => {
		setLoading(true);
		try {
			await api.post('/auth/register', values);
			await signIn('credentials', { email: values.email, password: values.password, redirect: false });
			router.push('/account/settings');
		} catch (error) {
			// 错误已由 api-client 处理
		} finally {
			setLoading(false);
		}
	};

	return (
		<div className="max-w-md mx-auto px-4 md:px-0 py-6 md:py-10">
			<h1 className="text-xl md:text-2xl font-semibold mb-4 md:mb-6">注册</h1>
			<form onSubmit={handleSubmit(onSubmit)} className="space-y-3 md:space-y-4">
				<div>
					<label className="block text-xs md:text-sm font-medium mb-1">姓名</label>
					<input className="w-full border rounded px-3 py-2 text-sm md:text-base" {...register('name')} />
					{errors.name && <p className="text-red-600 text-xs md:text-sm mt-1">{errors.name.message}</p>}
				</div>
				<div>
					<label className="block text-xs md:text-sm font-medium mb-1">邮箱</label>
					<input type="email" className="w-full border rounded px-3 py-2 text-sm md:text-base" {...register('email')} />
					{errors.email && <p className="text-red-600 text-xs md:text-sm mt-1">{errors.email.message}</p>}
				</div>
				<div>
					<label className="block text-xs md:text-sm font-medium mb-1">密码</label>
					<input type="password" className="w-full border rounded px-3 py-2 text-sm md:text-base" {...register('password')} />
					{errors.password && <p className="text-red-600 text-xs md:text-sm mt-1">{errors.password.message}</p>}
				</div>
				<button type="submit" disabled={loading} className="bg-black text-white rounded px-4 py-2 disabled:opacity-60 w-full text-sm md:text-base">
					{loading ? '提交中...' : '注册'}
				</button>
			</form>
			<div className="mt-4 md:mt-6 text-center">
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

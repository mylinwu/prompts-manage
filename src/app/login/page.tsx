"use client";

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import { signIn } from 'next-auth/react';
import { useRouter } from 'next/navigation';

const schema = z.object({
	email: z.string().email(),
	password: z.string().min(8),
});

type FormValues = z.infer<typeof schema>;

const googleEnabled = process.env.NEXT_PUBLIC_AUTH_GOOGLE_ENABLED === 'true' || process.env.AUTH_GOOGLE_ENABLED === 'true';
const githubEnabled = process.env.NEXT_PUBLIC_AUTH_GITHUB_ENABLED === 'true' || process.env.AUTH_GITHUB_ENABLED === 'true';

export default function LoginPage() {
	const router = useRouter();
	const [loading, setLoading] = useState(false);
	const { register, handleSubmit, formState: { errors } } = useForm<FormValues>({ resolver: zodResolver(schema) });

	const onSubmit = async (values: FormValues) => {
		setLoading(true);
		const res = await signIn('credentials', { email: values.email, password: values.password, redirect: false });
		setLoading(false);
		if (res?.error) {
			alert(res.error);
			return;
		}
		router.push('/account/settings');
	};

	return (
		<div className="max-w-md mx-auto px-4 md:px-0 py-6 md:py-10">
			<h1 className="text-xl md:text-2xl font-semibold mb-4 md:mb-6">登录</h1>
			<form onSubmit={handleSubmit(onSubmit)} className="space-y-3 md:space-y-4">
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
					{loading ? '登录中...' : '登录'}
				</button>
			</form>
			<div className="my-4 md:my-6 h-px bg-gray-200" />
			<div className="space-y-2 md:space-y-3">
				{googleEnabled && (
					<button onClick={() => signIn('google')} className="w-full border rounded px-4 py-2 text-sm md:text-base">使用 Google 登录</button>
				)}
				{githubEnabled && (
					<button onClick={() => signIn('github')} className="w-full border rounded px-4 py-2 text-sm md:text-base">使用 GitHub 登录</button>
				)}
			</div>
			<div className="mt-4 md:mt-6 text-center">
				<p className="text-sm text-gray-600">
					还没有账号？{' '}
					<a href="/register" className="text-blue-600 hover:underline">
						立即注册
					</a>
				</p>
			</div>
		</div>
	);
}

"use client";

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import { useRouter } from 'next/navigation';
import { useAlert } from '@/components/AlertProvider';
import api from '@/lib/api-client';

const schema = z.object({
	name: z.string().min(1, '请输入姓名').max(64, '姓名过长'),
});

type FormValues = z.infer<typeof schema>;

interface UpdateProfileFormProps {
	initialName?: string | null;
}

export default function UpdateProfileForm({ initialName }: UpdateProfileFormProps) {
	const router = useRouter();
	const { showAlert } = useAlert();
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
			await api.post('/account/update-profile', values);
			showAlert({ description: '资料已更新' });
			router.refresh();
		} catch (error) {
			// 错误已由 api-client 处理
		} finally {
			setSubmitting(false);
		}
	};

	return (
		<form onSubmit={handleSubmit(onSubmit)} className="space-y-3 md:space-y-4">
			<div>
				<label className="block text-xs md:text-sm font-medium mb-1">姓名</label>
				<input 
					type="text" 
					className="w-full border rounded px-3 py-2 text-sm md:text-base" 
					{...register('name')} 
				/>
				{errors.name && <p className="text-red-600 text-xs md:text-sm mt-1">{errors.name.message}</p>}
			</div>
			<button type="submit" disabled={submitting} className="bg-black text-white rounded px-4 py-2 disabled:opacity-60 text-sm md:text-base">
				{submitting ? '提交中...' : '更新资料'}
			</button>
		</form>
	);
}

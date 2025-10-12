import { redirect } from 'next/navigation';
import { getAuthSession } from '@/lib/auth';
import ChangePasswordForm from './_components/ChangePasswordForm';
import UpdateProfileForm from './_components/UpdateProfileForm';

export default async function SettingsPage() {
	const session = await getAuthSession();
	if (!session) redirect('/login');

	return (
		<div className="max-w-2xl mx-auto px-4 md:px-0 py-6 md:py-10">
			<h1 className="text-xl md:text-2xl font-semibold mb-4 md:mb-6">账户设置</h1>
			
			{/* 用户信息展示 */}
			<div className="mb-6 md:mb-8 p-3 md:p-4 bg-gray-50 rounded-lg">
				<h2 className="text-xs md:text-sm font-medium text-gray-500 mb-2">当前账户信息</h2>
				<div className="space-y-1">
					<p className="text-xs md:text-sm"><span className="font-medium">邮箱：</span>{session.user?.email}</p>
					<p className="text-xs md:text-sm"><span className="font-medium">姓名：</span>{session.user?.name || '未设置'}</p>
				</div>
			</div>

			{/* 更新资料表单 */}
			<div className="mb-6 md:mb-8">
				<h2 className="text-base md:text-lg font-semibold mb-3 md:mb-4">更新资料</h2>
				<UpdateProfileForm initialName={session.user?.name} />
			</div>

			{/* 修改密码表单 */}
			<div>
				<h2 className="text-base md:text-lg font-semibold mb-3 md:mb-4">修改密码</h2>
				<ChangePasswordForm />
			</div>
		</div>
	);
}

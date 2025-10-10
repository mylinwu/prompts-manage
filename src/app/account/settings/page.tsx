import { redirect } from 'next/navigation';
import { getAuthSession } from '@/lib/auth';
import ChangePasswordForm from './_components/ChangePasswordForm';

export default async function SettingsPage() {
	const session = await getAuthSession();
	if (!session) redirect('/login');

	return (
		<div className="max-w-md mx-auto py-10">
			<h1 className="text-2xl font-semibold mb-6">Account Settings</h1>
			<div className="mb-6">
				<p className="text-sm text-gray-600">Signed in as {session.user?.email}</p>
			</div>
			<ChangePasswordForm />
		</div>
	);
}

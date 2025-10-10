"use client";

import { signOut, useSession } from 'next-auth/react';

export default function AuthNav() {
	const { data } = useSession();
	if (!data?.user) return null;
	return (
		<button onClick={() => signOut()} className="text-sm text-gray-700">退出</button>
	);
}

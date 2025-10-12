"use client";

import { signOut, useSession } from 'next-auth/react';
import { Popover, PopoverTrigger, PopoverContent } from '@/components/ui/popover';
import Link from 'next/link';

export default function AuthNav() {
	const { data } = useSession();
	if (!data?.user) return null;
	
	return (
		<Popover>
			<PopoverTrigger asChild>
				<button className="flex items-center justify-center w-7 h-7 md:w-8 md:h-8 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 text-white hover:from-blue-600 hover:to-purple-700 transition-all">
					<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="md:w-[18px] md:h-[18px]">
						<path d="M19 21v-2a4 4 0 0 0-4-4H9a4 4 0 0 0-4 4v2" />
						<circle cx="12" cy="7" r="4" />
					</svg>
				</button>
			</PopoverTrigger>
			<PopoverContent align="end" className="w-48 p-2">
				<div className="flex flex-col gap-1">
					<Link 
						href="/account/settings" 
						className="px-3 py-2 text-sm rounded-md hover:bg-slate-100 transition-colors"
					>
						我的
					</Link>
					<button 
						onClick={() => signOut()} 
						className="px-3 py-2 text-sm text-left rounded-md hover:bg-slate-100 transition-colors"
					>
						退出
					</button>
				</div>
			</PopoverContent>
		</Popover>
	);
}

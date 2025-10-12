"use client";

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { cn } from '@/lib/utils';

export default function Navigation() {
	const pathname = usePathname();
	
	const navItems = [
		{ href: '/prompts', label: '我的提示词' },
		{ href: '/prompts/market', label: '提示词市场' },
	];
	
	return (
		<nav className="flex items-center gap-3 md:gap-6 text-xs md:text-sm">
			<Link 
				href="/" 
				className="font-semibold text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 transition-all whitespace-nowrap"
			>
				<span className="hidden sm:inline">提示词管理</span>
				<span className="sm:hidden">提示词</span>
			</Link>
			{navItems.map((item) => {
				let isActive = false;
				if (item.href === '/prompts') {
					isActive = pathname === '/prompts' || (pathname?.startsWith('/prompts/') && !pathname?.startsWith('/prompts/market'));
				} else if (item.href === '/prompts/market') {
					isActive = pathname === '/prompts/market' || pathname?.startsWith('/prompts/market/');
				} else {
					isActive = pathname === item.href || pathname?.startsWith(item.href + '/');
				}
				return (
					<Link
						key={item.href}
						href={item.href}
						className={cn(
							"hover:text-slate-900 transition-colors relative whitespace-nowrap",
							isActive 
								? "text-blue-600 font-medium" 
								: "text-slate-600"
						)}
					>
						<span>{item.label}</span>
						{isActive && (
							<span className="absolute -bottom-[14px] md:-bottom-[14px] left-0 right-0 h-0.5 bg-gradient-to-r from-blue-600 to-purple-600" />
						)}
					</Link>
				);
			})}
		</nav>
	);
}

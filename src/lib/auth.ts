import type { NextAuthOptions } from 'next-auth';
import CredentialsProvider from 'next-auth/providers/credentials';
import GoogleProvider from 'next-auth/providers/google';
import GitHubProvider from 'next-auth/providers/github';
import { MongoDBAdapter } from '@auth/mongodb-adapter';
import clientPromise from '@/lib/mongodb-client';
import { getCollection } from '@/lib/db';
import { compare } from 'bcryptjs';
import { getServerSession } from 'next-auth';

declare module 'next-auth' {
	interface Session {
		user: {
			id: string;
		} & DefaultSession['user'];
	}
}

import type { DefaultSession } from 'next-auth';

export const authOptions: NextAuthOptions = {
	adapter: MongoDBAdapter(clientPromise, { databaseName: process.env.MONGODB_DB }),
	secret: process.env.NEXTAUTH_SECRET,
	session: { strategy: 'jwt' },
	providers: [
		CredentialsProvider({
			name: 'Credentials',
			credentials: {
				email: { label: 'Email', type: 'email' },
				password: { label: 'Password', type: 'password' },
			},
			async authorize(credentials) {
				if (!credentials?.email || !credentials?.password) return null;
				const users = await getCollection<any>('users');
				const user = await users.findOne({ email: credentials.email });
				if (!user || !user.password) return null;
				const ok = await compare(credentials.password, user.password);
				if (!ok) return null;
				return { id: String(user._id), email: user.email, name: user.name ?? null, image: user.image ?? null };
			},
		}),
		...(process.env.AUTH_GOOGLE_ENABLED === 'true'
			? [
				GoogleProvider({
					clientId: process.env.GOOGLE_CLIENT_ID || '',
					clientSecret: process.env.GOOGLE_CLIENT_SECRET || '',
				}),
			]
			: []),
		...(process.env.AUTH_GITHUB_ENABLED === 'true'
			? [
				GitHubProvider({
					clientId: process.env.GITHUB_CLIENT_ID || '',
					clientSecret: process.env.GITHUB_CLIENT_SECRET || '',
				}),
			]
			: []),
	],
	callbacks: {
		async session({ session, token }) {
			if (session.user && token.sub) session.user.id = token.sub;
			return session;
		},
	},
};

export function getAuthSession() {
	return getServerSession(authOptions);
}

import { getAuthSession } from '@/lib/auth';
import { redirect } from 'next/navigation';
import { PromptsPageClient } from './_components/PromptsPageClient';

export default async function PromptsPage() {
  const session = await getAuthSession();

  if (!session?.user) {
    redirect('/login?callbackUrl=/prompts');
  }

  return <PromptsPageClient />;
}


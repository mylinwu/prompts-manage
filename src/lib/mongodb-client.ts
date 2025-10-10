import client from '@/lib/mongodb';

const clientPromise: Promise<typeof client> = (async () => {
	await client.connect();
	return client;
})();

export default clientPromise;

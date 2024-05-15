import { createClient } from 'redis';

const client = createClient({
    url: process.env.REDIS_URL, // This URL is set in your environment variables
    tls: process.env.NODE_ENV === 'production' ? {} : undefined, // Enable TLS in production. Needs the private URL and make sure it starts with rediss
});

client.on('error', (err) => console.error('Redis Client Error', err));
client.connect();

export default client;
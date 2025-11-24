import { Redis } from '@upstash/redis';

class RedisClient {
  private static instance: RedisClient;
  private client: Redis | null = null;

  private constructor() {
    this.initializeClient();
  }

  public static getInstance(): RedisClient {
    if (!RedisClient.instance) {
      RedisClient.instance = new RedisClient();
    }
    return RedisClient.instance;
  }

  private initializeClient(): void {
    try {
      const url = process.env.UPSTASH_REDIS_REST_URL;
      const token = process.env.UPSTASH_REDIS_REST_TOKEN;

      if (!url || !token) {
        throw new Error('Upstash Redis credentials not found in environment variables');
      }

      this.client = new Redis({
        url,
        token,
      });

      console.log('Upstash Redis: Client initialized successfully');
    } catch (error) {
      console.error('Upstash Redis: Failed to initialize client', error);
      throw error;
    }
  }

  public getClient(): Redis {
    if (!this.client) {
      throw new Error('Upstash Redis client not initialized');
    }

    return this.client;
  }

  public async ping(): Promise<boolean> {
    try {
      const client = this.getClient();
      const result = await client.ping();
      return result === 'PONG';
    } catch (error) {
      console.error('Upstash Redis ping failed:', error);
      return false;
    }
  }
}

export const redisClient = RedisClient.getInstance();
export default redisClient;

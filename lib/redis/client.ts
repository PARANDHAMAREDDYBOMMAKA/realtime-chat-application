import { createClient, RedisClientType } from 'redis';

class RedisClient {
  private static instance: RedisClient;
  private client: RedisClientType | null = null;
  private isConnecting = false;
  private connectionPromise: Promise<void> | null = null;

  private constructor() {}

  public static getInstance(): RedisClient {
    if (!RedisClient.instance) {
      RedisClient.instance = new RedisClient();
    }
    return RedisClient.instance;
  }

  private async initializeClient(): Promise<void> {
    if (this.client?.isOpen) {
      return;
    }

    if (this.isConnecting && this.connectionPromise) {
      return this.connectionPromise;
    }

    this.isConnecting = true;
    this.connectionPromise = (async () => {
      try {
        const redisConfig = {
          username: process.env.REDIS_USERNAME || 'default',
          password: process.env.REDIS_PASSWORD,
          socket: {
            host: process.env.REDIS_HOST,
            port: parseInt(process.env.REDIS_PORT || '16688'),
            reconnectStrategy: (retries: number) => {
              if (retries > 10) {
                console.error('Redis: Max reconnection attempts reached');
                return new Error('Max reconnection attempts reached');
              }
              const delay = Math.min(retries * 100, 3000);
              console.log(`Redis: Reconnecting in ${delay}ms (attempt ${retries})`);
              return delay;
            },
          },
        };

        this.client = createClient(redisConfig) as RedisClientType;

        this.client.on('error', (err) => {
          console.error('Redis Client Error:', err);
        });

        this.client.on('connect', () => {
          console.log('Redis: Connected successfully');
        });

        this.client.on('ready', () => {
          console.log('Redis: Client ready');
        });

        this.client.on('reconnecting', () => {
          console.log('Redis: Reconnecting...');
        });

        this.client.on('end', () => {
          console.log('Redis: Connection closed');
        });

        await this.client.connect();
      } catch (error) {
        console.error('Redis: Failed to initialize client', error);
        this.client = null;
        throw error;
      } finally {
        this.isConnecting = false;
        this.connectionPromise = null;
      }
    })();

    return this.connectionPromise;
  }

  public async getClient(): Promise<RedisClientType> {
    if (!this.client || !this.client.isOpen) {
      await this.initializeClient();
    }

    if (!this.client) {
      throw new Error('Redis client not initialized');
    }

    return this.client;
  }

  public async disconnect(): Promise<void> {
    if (this.client?.isOpen) {
      await this.client.quit();
      this.client = null;
    }
  }

  public async ping(): Promise<boolean> {
    try {
      const client = await this.getClient();
      const result = await client.ping();
      return result === 'PONG';
    } catch (error) {
      console.error('Redis ping failed:', error);
      return false;
    }
  }
}

export const redisClient = RedisClient.getInstance();
export default redisClient;

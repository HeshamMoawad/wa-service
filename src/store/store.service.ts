import { Injectable, Inject } from '@nestjs/common';
import { CACHE_MANAGER } from '@nestjs/cache-manager';
import { Cache } from 'cache-manager';
import { RedisStore } from 'cache-manager-redis-store'; // Import the RedisStore type
import { InjectRedis } from '@nestjs-modules/ioredis';
import Redis from 'ioredis';



@Injectable()
export class StoreService {
    constructor(@InjectRedis() private cacheManager: Redis) {}

    async get(key: string): Promise<any> {
        return this.cacheManager.get(key);
    }
    
    async set(key: string, value: any, ttl?: number): Promise<string> {
        return this.cacheManager.set(key, value);

    }
    
    async del(key: string): Promise<number> {
        return this.cacheManager.del(key);
    }
    
    async delKeys(pattern: string = '*'): Promise<number> {
        return this.cacheManager.del(pattern);
    }
    
    async keys(pattern: string = '*'): Promise<string[]> {
        const redisClient = this.cacheManager
        
        if (typeof redisClient.keys === 'function') {
          return redisClient.keys(pattern);
        }
        
        throw new Error('Keys method not available on Redis client');
    }


    async keysWithValues(pattern: string = '*'): Promise<Record<string, any>> {
        const keys = await this.keys(pattern);
        const result: Record<string, any> = {};
        
        await Promise.all(
          keys.map(async (key) => {
            result[key] = await this.get(key);
          })
        );
        
        return result;
      }
        
    async ttl(key: string) {
        return this.cacheManager.ttl(key);
    }
    async clear() {
        return this.cacheManager.flushdb();
    }
}

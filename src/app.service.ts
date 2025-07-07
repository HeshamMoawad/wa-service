// app.service.ts
import { Injectable } from '@nestjs/common';

@Injectable()
export class AppService {
  // constructor(@Inject(CACHE_MANAGER) private cacheManager: Cache) {}

  // async onModuleInit() {
  //   try {
  //     // Verify store type
  //     const stores = this.cacheManager.stores;
  //     const store = stores[0];
  //     console.log('Store type:', store.constructor.name);
      
  //     // Get the actual Redis client
  //     const redisClient = (store as any).getClient();
  //     console.log('Redis client:', redisClient?.constructor?.name);
      
  //     // Test connection
  //     await this.cacheManager.set('connection_test', 'success', 10);
  //     const result = await this.cacheManager.get('connection_test');
  //     console.log('Connection test result:', result);
  //   } catch (error) {
  //     console.error('Redis connection failed:', error);
  //   }
  // }
}
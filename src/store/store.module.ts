import { Module } from '@nestjs/common';
import { StoreService } from './store.service';
import { CacheModule } from '@nestjs/cache-manager';
import { getMilliseconds } from '../utils/converter';
import  {redisStore} from 'cache-manager-redis-store';
import { RedisModule } from '@nestjs-modules/ioredis';


@Module({
    imports:[
        // CacheModule.register({
        //     max: 1000,
        //     ttl:getMilliseconds(1000),
        //     isGlobal:true,
        //     store:redisStore,
        //     isCacheableValue: () => {
        //         console.log('Redis connection check during initialization');
        //         return true;
        //       },
        //     // This will be called when the store is ready
        //     onReady: (client: any) => {
        //     console.log('Redis client ready');
        //     client.on('error', (err: any) => {
        //         console.error('Redis error:', err);
        //     });
        //     client.on('connect', () => {
        //         console.log('Redis connected successfully');
        //     });
        //     client.on('ready', () => {
        //         console.log('Redis ready for commands');
        //     });
        //     client.on('end', () => {
        //         console.log('Redis connection ended');
        //     });
        //     },
        
        //   }),
        RedisModule.forRoot({
            type:"single",
            url:"redis://localhost:6379/0",
        }),
      
    ],
    providers: [StoreService],
    exports: [StoreService],
})
export class StoreModule {}

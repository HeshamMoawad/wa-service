import { Module } from '@nestjs/common';
import { StoreService } from './store.service';
import { CacheModule } from '@nestjs/cache-manager';
import { getMilliseconds } from '../utils/converter';
import  {redisStore} from 'cache-manager-redis-store';
import { RedisModule } from '@nestjs-modules/ioredis';
import config from '../config/configurations';

@Module({
    imports:[
        RedisModule.forRoot({
            type:"single",
            url:`redis://${config().redis.host}:${config().redis.port}/0`,
        }),
      
    ],
    providers: [StoreService],
    exports: [StoreService],
})
export class StoreModule {}

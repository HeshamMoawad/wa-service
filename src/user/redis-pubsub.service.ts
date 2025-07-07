// redis-pubsub.service.ts
import { Injectable } from '@nestjs/common';
import Redis from 'ioredis';

@Injectable()
export class RedisPubSubService {
  private publisher: Redis;
  private subscriber: Redis;

  constructor() {
    this.publisher = new Redis();
    this.subscriber = new Redis();
    
    // Subscribe to user channels as needed
  }

  async publishToUser(userId: string, message: any) {
    await this.publisher.publish(`user:${userId}`, JSON.stringify(message));
  }

  subscribeToUser(userId: string, callback: (message: any) => void) {
    this.subscriber.subscribe(`user:${userId}`);
    this.subscriber.on('message', (channel, message) => {
      if (channel === `user:${userId}`) {
        callback(JSON.parse(message));
      }
    });
  }
}
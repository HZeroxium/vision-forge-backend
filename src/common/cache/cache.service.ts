// common/cache/cache.service.ts

import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as Redis from 'ioredis';
import { AppLoggerService } from '../logger/logger.service';

@Injectable()
export class CacheService {
  private redisClient: Redis.Redis;

  constructor(
    private readonly configService: ConfigService,
    private readonly logger: AppLoggerService,
  ) {
    this.redisClient = new Redis.default({
      host: this.configService.get<string>('redis.host'),
      port: this.configService.get<number>('redis.port'),
    });
    this.redisClient.on('error', (err) =>
      this.logger.error('Redis error', err.message),
    );
  }

  async getCache(key: string): Promise<string | null> {
    return await this.redisClient.get(key);
  }

  async setCache(key: string, value: string, ttl?: number) {
    await this.redisClient.set(
      key,
      value,
      'EX',
      ttl || this.configService.get<number>('redis.ttl')!,
    );
  }

  async deleteCache(key: string) {
    await this.redisClient.del(key);
  }
}

// common/cache/cache.service.ts

import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as Redis from 'ioredis';
import { AppLoggerService } from '../logger/logger.service';

@Injectable()
export class CacheService {
  private redisClient: Redis.Redis | null = null;
  private readonly redisEnabled: boolean;
  constructor(
    private readonly configService: ConfigService,
    private readonly logger: AppLoggerService,
  ) {
    this.redisEnabled = this.configService.get<boolean>('redis.enabled', false);

    this.logger.debug(`Redis enabled: ${this.redisEnabled}`);

    if (this.redisEnabled) {
      this.redisClient = new Redis.default({
        host: this.configService.get<string>('redis.host'),
        port: this.configService.get<number>('redis.port'),
      });

      this.redisClient.on('error', (err) =>
        this.logger.error('Redis error', err.message),
      );

      this.logger.log('✅ Redis caching enabled');
    } else {
      this.logger.warn('⚠ Redis caching is disabled');
    }
  }

  async getCache(key: string): Promise<string | null> {
    if (!this.redisEnabled || !this.redisClient) return null;
    return await this.redisClient.get(key);
  }

  async setCache(key: string, value: string, ttl?: number) {
    if (!this.redisEnabled || !this.redisClient) return;
    await this.redisClient.set(
      key,
      value,
      'EX',
      ttl || this.configService.get<number>('redis.ttl')!,
    );
  }

  async deleteCache(key: string) {
    if (!this.redisEnabled || !this.redisClient) return;
    await this.redisClient.del(key);
  }
}

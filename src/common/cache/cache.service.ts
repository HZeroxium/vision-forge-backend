// common/cache/cache.service.ts

import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as Redis from 'ioredis';
import { AppLoggerService } from '../logger/logger.service';

// Define cache types
export enum CacheType {
  DATA = 'data', // Standard cache for APIs (findAll, findOne)
  AUTH = 'auth', // Cache for authentication data
  JOB = 'job', // Cache for job processing
}

@Injectable()
export class CacheService {
  private redisClient: Redis.Redis | null = null;
  private readonly redisEnabled: boolean;
  private readonly dataCacheEnabled: boolean;
  private readonly authCacheEnabled: boolean;
  private readonly jobCacheEnabled: boolean;

  constructor(
    private readonly configService: ConfigService,
    private readonly logger: AppLoggerService,
  ) {
    this.redisEnabled = this.configService.get<boolean>('redis.enabled', false);

    // Read configuration for each cache type
    this.dataCacheEnabled = this.configService.get<boolean>(
      'redis.dataCache.enabled',
      false,
    );
    this.authCacheEnabled = this.configService.get<boolean>(
      'redis.authCache.enabled',
      true,
    );
    this.jobCacheEnabled = this.configService.get<boolean>(
      'redis.jobCache.enabled',
      true,
    );

    this.logger.debug(`Redis enabled: ${this.redisEnabled}`);
    this.logger.debug(`Data cache enabled: ${this.dataCacheEnabled}`);
    this.logger.debug(`Auth cache enabled: ${this.authCacheEnabled}`);
    this.logger.debug(`Job cache enabled: ${this.jobCacheEnabled}`);

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

  /**
   * Check if a cache type is enabled
   */
  private isCacheTypeEnabled(type: CacheType): boolean {
    if (!this.redisEnabled) return false;

    switch (type) {
      case CacheType.DATA:
        return this.dataCacheEnabled;
      case CacheType.AUTH:
        return this.authCacheEnabled;
      case CacheType.JOB:
        return this.jobCacheEnabled;
      default:
        return false;
    }
  }

  /**
   * Get value from cache if the cache type is enabled
   */
  async getCache(
    key: string,
    type: CacheType = CacheType.DATA,
  ): Promise<string | null> {
    if (!this.isCacheTypeEnabled(type) || !this.redisClient) {
      return null;
    }

    const value = await this.redisClient.get(key);
    if (value) {
      this.logger.debug(`Cache hit for key: ${key} [type: ${type}]`);
    }
    return value;
  }

  /**
   * Store value in cache if the cache type is enabled
   */
  async setCache(
    key: string,
    value: string,
    ttl?: number,
    type: CacheType = CacheType.DATA,
  ): Promise<void> {
    if (!this.isCacheTypeEnabled(type) || !this.redisClient) {
      return;
    }

    await this.redisClient.set(
      key,
      value,
      'EX',
      ttl || this.configService.get<number>('redis.ttl')!,
    );

    this.logger.debug(
      `Cache set for key: ${key} [type: ${type}] with TTL: ${ttl || this.configService.get<number>('redis.ttl')!}s`,
    );
  }

  /**
   * Delete value from cache
   */
  async deleteCache(key: string): Promise<void> {
    if (!this.redisEnabled || !this.redisClient) return;
    await this.redisClient.del(key);
    this.logger.debug(`Cache deleted for key: ${key}`);
  }

  /**
   * Dedicated method for Auth Cache
   */
  async getAuthCache(key: string): Promise<string | null> {
    return this.getCache(key, CacheType.AUTH);
  }

  async setAuthCache(key: string, value: string, ttl?: number): Promise<void> {
    return this.setCache(key, value, ttl, CacheType.AUTH);
  }

  /**
   * Dedicated method for Job Cache
   */
  async getJobCache(key: string): Promise<string | null> {
    return this.getCache(key, CacheType.JOB);
  }

  async setJobCache(key: string, value: string, ttl?: number): Promise<void> {
    return this.setCache(key, value, ttl, CacheType.JOB);
  }
}

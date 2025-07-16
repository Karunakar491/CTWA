import { Pool } from 'pg';
import { MongoClient, Db } from 'mongodb';
import { createClient, RedisClientType } from 'redis';
import { Client } from '@elastic/elasticsearch';
import { logger } from '../utils/logger';

// PostgreSQL connection
let pgPool: Pool;

// MongoDB connection
let mongoClient: MongoClient;
let mongoDb: Db;

// Redis connection
let redisClient: RedisClientType;

// Elasticsearch connection
let elasticsearchClient: Client;

export async function connectDatabases(): Promise<void> {
  try {
    // Connect to PostgreSQL
    pgPool = new Pool({
      connectionString: process.env.DATABASE_URL,
      max: 20,
      idleTimeoutMillis: 30000,
      connectionTimeoutMillis: 2000,
    });

    await pgPool.query('SELECT NOW()');
    logger.info('✅ PostgreSQL connected successfully');

    // Connect to MongoDB
    mongoClient = new MongoClient(process.env.MONGODB_URL!);
    await mongoClient.connect();
    mongoDb = mongoClient.db();
    logger.info('✅ MongoDB connected successfully');

    // Connect to Redis
    redisClient = createClient({
      url: process.env.REDIS_URL,
    });

    redisClient.on('error', (err) => {
      logger.error('Redis Client Error:', err);
    });

    await redisClient.connect();
    logger.info('✅ Redis connected successfully');

    // Connect to Elasticsearch
    elasticsearchClient = new Client({
      node: process.env.ELASTICSEARCH_URL,
    });

    await elasticsearchClient.ping();
    logger.info('✅ Elasticsearch connected successfully');

  } catch (error) {
    logger.error('Database connection failed:', error);
    throw error;
  }
}

export function getPostgresPool(): Pool {
  if (!pgPool) {
    throw new Error('PostgreSQL pool not initialized');
  }
  return pgPool;
}

export function getMongoDb(): Db {
  if (!mongoDb) {
    throw new Error('MongoDB not initialized');
  }
  return mongoDb;
}

export function getRedisClient(): RedisClientType {
  if (!redisClient) {
    throw new Error('Redis client not initialized');
  }
  return redisClient;
}

export function getElasticsearchClient(): Client {
  if (!elasticsearchClient) {
    throw new Error('Elasticsearch client not initialized');
  }
  return elasticsearchClient;
}

export async function closeDatabases(): Promise<void> {
  try {
    if (pgPool) {
      await pgPool.end();
      logger.info('PostgreSQL connection closed');
    }

    if (mongoClient) {
      await mongoClient.close();
      logger.info('MongoDB connection closed');
    }

    if (redisClient) {
      await redisClient.quit();
      logger.info('Redis connection closed');
    }

    if (elasticsearchClient) {
      await elasticsearchClient.close();
      logger.info('Elasticsearch connection closed');
    }
  } catch (error) {
    logger.error('Error closing database connections:', error);
  }
}
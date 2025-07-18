/**
 * Configuration service for Meta API credentials
 * Loads credentials from properties file
 */

import fs from 'fs';
import path from 'path';
import { logger } from '../utils/logger';

export interface MetaApiConfig {
  accessToken: string;
  wabaId: string;
  phoneNumberId: string;
  apiVersion: string;
  accountName?: string;
}

export class MetaConfigService {
  private configPath: string;
  private configs: Record<string, MetaApiConfig> = {};
  private activeConfig: string = 'default';

  constructor(configPath?: string) {
    this.configPath = configPath || path.join(process.cwd(), 'config', 'meta-api.json');
    this.loadConfig();
  }

  /**
   * Load configuration from file
   */
  private loadConfig(): void {
    try {
      if (fs.existsSync(this.configPath)) {
        const configData = fs.readFileSync(this.configPath, 'utf-8');
        this.configs = JSON.parse(configData);
        logger.info('Meta API configuration loaded successfully');
      } else {
        // Create default config file if it doesn't exist
        this.configs = {
          default: {
            accessToken: process.env.META_ACCESS_TOKEN || '',
            wabaId: process.env.META_WABA_ID || '',
            phoneNumberId: process.env.META_PHONE_NUMBER_ID || '',
            apiVersion: process.env.META_API_VERSION || 'v18.0',
            accountName: 'Default Account'
          }
        };
        this.saveConfig();
        logger.info('Created default Meta API configuration file');
      }
    } catch (error) {
      logger.error('Failed to load Meta API configuration', { error });
      throw new Error('Failed to load Meta API configuration');
    }
  }

  /**
   * Save configuration to file
   */
  private saveConfig(): void {
    try {
      const dirPath = path.dirname(this.configPath);
      if (!fs.existsSync(dirPath)) {
        fs.mkdirSync(dirPath, { recursive: true });
      }
      fs.writeFileSync(this.configPath, JSON.stringify(this.configs, null, 2));
      logger.info('Meta API configuration saved successfully');
    } catch (error) {
      logger.error('Failed to save Meta API configuration', { error });
      throw new Error('Failed to save Meta API configuration');
    }
  }

  /**
   * Get active configuration
   */
  getConfig(): MetaApiConfig {
    return this.configs[this.activeConfig] || this.configs.default;
  }

  /**
   * Get all available configurations
   */
  getAllConfigs(): Record<string, MetaApiConfig> {
    return this.configs;
  }

  /**
   * Update configuration
   */
  updateConfig(name: string, config: Partial<MetaApiConfig>): MetaApiConfig {
    if (!this.configs[name]) {
      throw new Error(`Configuration '${name}' not found`);
    }

    this.configs[name] = {
      ...this.configs[name],
      ...config
    };

    this.saveConfig();
    return this.configs[name];
  }

  /**
   * Add new configuration
   */
  addConfig(name: string, config: MetaApiConfig): MetaApiConfig {
    if (this.configs[name]) {
      throw new Error(`Configuration '${name}' already exists`);
    }

    this.configs[name] = config;
    this.saveConfig();
    return config;
  }

  /**
   * Set active configuration
   */
  setActiveConfig(name: string): MetaApiConfig {
    if (!this.configs[name]) {
      throw new Error(`Configuration '${name}' not found`);
    }

    this.activeConfig = name;
    return this.configs[name];
  }

  /**
   * Get active configuration name
   */
  getActiveConfigName(): string {
    return this.activeConfig;
  }

  /**
   * Delete configuration
   */
  deleteConfig(name: string): void {
    if (name === 'default') {
      throw new Error('Cannot delete default configuration');
    }

    if (!this.configs[name]) {
      throw new Error(`Configuration '${name}' not found`);
    }

    if (this.activeConfig === name) {
      this.activeConfig = 'default';
    }

    delete this.configs[name];
    this.saveConfig();
  }
}

// Export singleton instance
export const metaConfigService = new MetaConfigService();
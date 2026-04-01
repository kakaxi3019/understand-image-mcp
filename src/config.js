import fs from 'fs';
import path from 'path';
import os from 'os';

export const CONFIG_DIR = '.config';
export const CONFIG_SUBDIR = 'understand-image';
export const CONFIG_FILE = 'config.json';

export const DEFAULTS = {
  baseUrl: 'https://api.modelscope.cn/v1',
  model: 'qwen-vl-max',
  apiKey: ''
};

export function getConfigDir() {
  return path.join(os.homedir(), CONFIG_DIR, CONFIG_SUBDIR);
}

export function getConfigPath() {
  return path.join(getConfigDir(), CONFIG_FILE);
}

export function getDefaultConfig() {
  return {
    baseUrl: process.env.UNDERSTAND_IMAGE_BASE_URL || DEFAULTS.baseUrl,
    apiKey: process.env.UNDERSTAND_IMAGE_API_KEY || DEFAULTS.apiKey,
    model: process.env.UNDERSTAND_IMAGE_MODEL || DEFAULTS.model
  };
}

export function loadConfig() {
  const configPath = getConfigPath();

  try {
    const data = fs.readFileSync(configPath, 'utf-8');
    const userConfig = JSON.parse(data);
    return {
      baseUrl: process.env.UNDERSTAND_IMAGE_BASE_URL || userConfig.baseUrl || DEFAULTS.baseUrl,
      apiKey: process.env.UNDERSTAND_IMAGE_API_KEY || userConfig.apiKey || '',
      model: process.env.UNDERSTAND_IMAGE_MODEL || userConfig.model || DEFAULTS.model
    };
  } catch {
    return getDefaultConfig();
  }
}

export function loadFullConfig() {
  // env > user config > local config > defaults
  const userConfig = loadConfig();

  const localConfigPath = path.join(process.cwd(), 'config.json');
  try {
    const localConfig = JSON.parse(fs.readFileSync(localConfigPath, 'utf-8'));
    return {
      baseUrl: userConfig.baseUrl || localConfig.baseUrl || DEFAULTS.baseUrl,
      apiKey: userConfig.apiKey || localConfig.apiKey || '',
      model: userConfig.model || localConfig.model || DEFAULTS.model
    };
  } catch {
    return userConfig;
  }
}

export function saveConfig(config) {
  const configDir = getConfigDir();
  if (!fs.existsSync(configDir)) {
    fs.mkdirSync(configDir, { recursive: true });
  }
  const configPath = getConfigPath();
  fs.writeFileSync(configPath, JSON.stringify(config, null, 2), 'utf-8');
}

export function ensureConfigDir() {
  const configDir = getConfigDir();
  if (!fs.existsSync(configDir)) {
    fs.mkdirSync(configDir, { recursive: true });
  }
  return configDir;
}

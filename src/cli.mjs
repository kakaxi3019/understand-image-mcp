#!/usr/bin/env node

import { spawn } from 'child_process';
import readline from 'readline';
import { loadConfig, saveConfig, getConfigPath, getDefaultConfig, ensureConfigDir, DEFAULTS } from './config.js';

const COMMANDS = {
  SETUP: 'setup',
  CONFIG: 'config',
  HELP: 'help'
};

function createRL() {
  return readline.createInterface({
    input: process.stdin,
    output: process.stdout
  });
}

const askQuestion = (rl, question) => rl.question(question);

async function setup() {
  const rl = createRL();
  const existingConfig = loadConfig();
  const configPath = getConfigPath();
  ensureConfigDir();

  console.log('\n=== understand-image-mcp 配置向导 ===\n');
  console.log('支持 OpenAI 协议的所有平台：OpenAI、Azure、Ollama、LM Studio、本地模型等\n');

  const hasExisting = existingConfig.baseUrl !== DEFAULTS.baseUrl || existingConfig.apiKey || existingConfig.model !== DEFAULTS.model;

  if (hasExisting) {
    console.log(`当前配置已存在于: ${configPath}`);
    console.log(`  Base URL: ${existingConfig.baseUrl}`);
    console.log(`  API Key:  ${existingConfig.apiKey ? existingConfig.apiKey.substring(0, 8) + '...' : '(无，部分本地模型不需要)'}`);
    console.log(`  Model:    ${existingConfig.model}\n`);

    const overwrite = await askQuestion(rl, '是否修改现有配置？ (y/N): ');
    if (overwrite.toLowerCase() !== 'y') {
      console.log('取消配置。');
      rl.close();
      return;
    }
  }

  console.log('\n请输入以下配置信息：\n');

  // Base URL
  let baseUrl = '';
  while (!baseUrl || baseUrl.trim() === '') {
    baseUrl = await askQuestion(rl, `Base URL${hasExisting ? ` [当前: ${existingConfig.baseUrl}]` : ''}: `);
    if (!baseUrl && hasExisting) {
      baseUrl = existingConfig.baseUrl;
    }
    if (!baseUrl.trim()) {
      console.log('Base URL 不能为空\n');
    }
  }

  // API Key (optional for local models)
  const apiKeyPrompt = hasExisting && existingConfig.apiKey
    ? ` [当前: ${existingConfig.apiKey.substring(0, 8)}...], 直接回车保持不变，空值也可用于本地模型`
    : ' (可选，本地模型可留空)';
  const apiKey = await askQuestion(rl, `API Key${apiKeyPrompt}: `);
  const finalApiKey = apiKey.trim() || existingConfig.apiKey || '';

  // Model
  let model = '';
  while (!model || model.trim() === '') {
    model = await askQuestion(rl, `Model${hasExisting ? ` [当前: ${existingConfig.model}]` : ''}: `);
    if (!model && hasExisting) {
      model = existingConfig.model;
    }
    if (!model.trim()) {
      console.log('Model 不能为空\n');
    }
  }

  const config = {
    baseUrl: baseUrl.trim(),
    apiKey: finalApiKey,
    model: model.trim()
  };

  saveConfig(config);

  console.log('\n✓ 配置已保存到:', configPath);
  console.log('\n现在可以运行以下命令启动 MCP 服务器：');
  console.log('  npx understand-image-mcp\n');

  rl.close();
}

async function showConfig() {
  const config = loadConfig();
  const configPath = getConfigPath();

  console.log('\n=== understand-image-mcp 当前配置 ===\n');
  console.log(`配置文件: ${configPath}`);
  console.log(`Base URL: ${config.baseUrl}`);
  console.log(`API Key:  ${config.apiKey ? config.apiKey.substring(0, 8) + '...' : '(无，部分本地模型不需要)'}`);
  console.log(`Model:    ${config.model}`);
  console.log('');
}

async function modifyConfig(args) {
  if (args.set) {
    const [key, value] = args.set.split('=');
    if (key && value) {
      if (['apiKey', 'baseUrl', 'model'].includes(key)) {
        const config = loadConfig();
        config[key] = value;
        saveConfig(config);
        console.log(`✓ 已修改 ${key} = ${value}`);
      } else {
        console.log(`无效的配置项: ${key}`);
        console.log('有效的配置项: apiKey, baseUrl, model');
      }
    } else {
      console.log('用法: config --set key=value');
    }
  } else {
    showConfig();
  }
}

async function startServer() {
  const config = loadConfig();

  if (config.apiKey) {
    process.env.UNDERSTAND_IMAGE_API_KEY = config.apiKey;
  }
  if (config.baseUrl) {
    process.env.UNDERSTAND_IMAGE_BASE_URL = config.baseUrl;
  }
  if (config.model) {
    process.env.UNDERSTAND_IMAGE_MODEL = config.model;
  }

  const serverPath = new URL('./server.js', import.meta.url).pathname;

  const child = spawn('node', [serverPath], {
    cwd: process.cwd(),
    stdio: 'inherit'
  });

  child.on('exit', (code) => {
    process.exit(code);
  });
}

async function main() {
  const args = process.argv.slice(2);
  const command = args[0];

  switch (command) {
    case COMMANDS.SETUP:
      await setup();
      break;

    case COMMANDS.CONFIG:
      await modifyConfig({
        set: args.find(arg => arg.startsWith('--set='))?.replace('--set=', '')
      });
      break;

    case COMMANDS.HELP:
      console.log(`
understand-image-mcp - 图像理解 MCP 服务器

用法:
  npx understand-image-mcp [command]

命令:
  setup     首次配置或修改配置
  config    查看当前配置
  help      显示帮助信息

示例:
  npx understand-image-mcp setup
  npx understand-image-mcp config
  npx understand-image-mcp config --set apiKey=new_key
  npx understand-image-mcp
`);
      break;

    default:
      if (!command) {
        await startServer();
      } else {
        console.log(`未知命令: ${command}`);
        console.log('运行 "npx understand-image-mcp help" 查看帮助');
      }
  }
}

main().catch(console.error);

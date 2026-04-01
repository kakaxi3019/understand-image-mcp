import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import { CallToolRequestSchema, ListToolsRequestSchema } from '@modelcontextprotocol/sdk/types.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import OpenAI from 'openai';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { loadFullConfig } from './config.js';
import { getMimeType, TOOL_NAME } from './utils.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const config = loadFullConfig();

if (!config.baseUrl) {
  console.error('Error: baseUrl is not configured. Please run "npx understand-image-mcp setup" to configure.');
  process.exit(1);
}

if (!config.model) {
  console.error('Error: model is not configured. Please run "npx understand-image-mcp setup" to configure.');
  process.exit(1);
}

const client = new OpenAI({
  baseURL: config.baseUrl,
  apiKey: config.apiKey || 'placeholder-for-local-models'
});

const DEFAULT_PROMPT = `请详细描述这张图片的所有内容，包括：
- 图片中的文字内容（如有）
- 主要物体/人物的外观、位置、动作
- 背景环境
- 颜色、光线、氛围
- 物体之间的关系
- 任何其他值得注意的细节`;

function imageToBase64(imagePath) {
  const fullPath = path.isAbsolute(imagePath)
    ? imagePath
    : path.join(process.cwd(), imagePath);

  const imageBuffer = fs.readFileSync(fullPath);
  const mimeType = getMimeType(fullPath);
  return `data:${mimeType};base64,${imageBuffer.toString('base64')}`;
}

const server = new Server(
  { name: 'understand-image', version: '1.0.0' },
  { capabilities: { tools: {} } }
);

server.setRequestHandler(ListToolsRequestSchema, async () => {
  return {
    tools: [{
      name: TOOL_NAME,
      description: 'Analyze and describe the content of an image using AI vision models',
      inputSchema: {
        type: 'object',
        properties: {
          image_source: {
            type: 'string',
            description: 'Path to a local image file or URL of an image'
          },
          prompt: {
            type: 'string',
            description: 'Custom prompt for image analysis (optional, uses detailed default prompt if not provided)'
          }
        },
        required: ['image_source']
      }
    }]
  };
});

server.setRequestHandler(CallToolRequestSchema, async (request) => {
  const { name, arguments: args } = request.params;

  if (name !== TOOL_NAME) {
    return {
      content: [{ type: 'text', text: `Unknown tool: ${name}` }],
      isError: true
    };
  }

  try {
    const { image_source, prompt } = args;
    const analysisPrompt = prompt || DEFAULT_PROMPT;

    let imageUrl;
    if (image_source.startsWith('http://') || image_source.startsWith('https://')) {
      imageUrl = image_source;
    } else {
      imageUrl = imageToBase64(image_source);
    }

    const response = await client.chat.completions.create({
      model: config.model,
      messages: [{
        role: 'user',
        content: [
          { type: 'text', text: analysisPrompt },
          { type: 'image_url', image_url: { url: imageUrl } }
        ]
      }],
      max_tokens: 2000
    });

    const description = response.choices[0]?.message?.content || 'No description generated';

    return { content: [{ type: 'text', text: description }] };
  } catch (error) {
    return {
      content: [{ type: 'text', text: `Error analyzing image: ${error.message}` }],
      isError: true
    };
  }
});

async function main() {
  const transport = new StdioServerTransport();
  await server.connect(transport);
  console.error('understand_image MCP server started');
}

main().catch(console.error);

# understand-image-mcp

通过用户配置的**视觉大模型**对图片进行识别分析的 MCP 服务器。支持 OpenAI 协议的各种视觉模型 API。

## 工作原理

```
用户 → Claude Code → understand-image-mcp → 视觉大模型 API → 返回分析结果
```

## 快速开始

### 1. 配置 API

```bash
npx understand-image-mcp setup
```

按提示配置视觉模型（Base URL、API Key、Model）。此配置保存在 `~/.config/understand-image/config.json`，全局生效。

### 2. 连接 Claude Code

**方式一：使用 npx（未克隆仓库）**

项目级配置 — 在项目目录创建 `.mcp.json`：
```json
{
  "mcpServers": {
    "understand_image": {
      "command": "npx",
      "args": ["understand-image-mcp"]
    }
  }
}
```

全局配置 — 在 `~/.claude.json` 的 `mcpServers` 节点中添加：
```json
{
  "mcpServers": {
    "understand_image": {
      "command": "npx",
      "args": ["understand-image-mcp"]
    }
  }
}
```

**方式二：使用源码（克隆仓库后）**

```bash
git clone https://github.com/kakaxi3019/understand-image-mcp.git
cd understand-image-mcp
npm install
```

项目级配置 — 在项目目录创建 `.mcp.json`：
```json
{
  "mcpServers": {
    "understand_image": {
      "command": "node",
      "args": ["/path/to/understand-image-mcp/src/server.js"]
    }
  }
}
```

全局配置 — 在 `~/.claude.json` 的 `mcpServers` 节点中添加：
```json
{
  "mcpServers": {
    "understand_image": {
      "command": "node",
      "args": ["/path/to/understand-image-mcp/src/server.js"]
    }
  }
}
```

配置好后，**Claude Code 会自动启动 MCP**，无需手动运行。

### 3. 使用

让 Claude Code 分析图片：

```
用户：帮我看看 images/screenshot.png 有什么问题
Claude Code：（调用 MCP 分析图片）这张截图显示...
```

## 支持的图片

- 本地路径：`/path/to/image.jpg`
- 网络 URL：`https://example.com/image.jpg`
- 格式：JPEG, PNG, WebP, GIF, BMP

## 支持的视觉模型

| 服务商 | Base URL | 说明 |
|--------|----------|------|
| **ModelScope** | `https://api.modelscope.cn/v1` | 阿里云，**每日免费额度**，推荐 |
| Ollama | `http://localhost:11434/v1` | 本地运行，免费，需安装 Ollama |
| LM Studio | `http://localhost:1234/v1` | 本地运行，免费，需安装 LM Studio |
| OpenAI | `https://api.openai.com/v1` | 需要 API Key |
| Azure | `https://xxx.openai.azure.com` | 企业级，需要 API Key |

### ModelScope 快速获取 API Key

1. 注册 https://modelscope.cn
2. 获取 API Key：https://modelscope.cn/user-center/m API-Key
3. 推荐模型：`Qwen/Qwen3-VL-235B-A22B-Instruct`

## 命令

```bash
npx understand-image-mcp setup    # 配置 API
npx understand-image-mcp config   # 查看配置
```

> 注意：通过 Claude Code 使用时，MCP 会自动启动，无需手动运行 `npx understand-image-mcp`。

## 开发者命令（源码方式）

如果克隆了仓库，可以手动运行：

```bash
node src/cli.mjs setup    # 配置 API
node src/cli.mjs           # 运行 MCP（仅调试用）
```

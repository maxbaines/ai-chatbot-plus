<a href="https://chat.vercel.ai/">
  <h1 align="center">Chatbot+</h1>
</a>

<p align="center">
    An AI chatbot application built with Next.js and the AI SDK, featuring model selection, prompt management, MCP integration, and enhanced chat functionality.
</p>

<p align="center">
  <a href="#features"><strong>Features</strong></a> ·
  <a href="#model-providers"><strong>Model Providers</strong></a> ·
  <a href="#deploy-your-own"><strong>Deploy Your Own</strong></a> ·
  <a href="#running-locally"><strong>Running locally</strong></a>
</p>
<br/>

## Features

- **Model Picker**

  - Support for multiple AI providers
  - Provider-organized interface with capability indicators
  - Runtime model switching

- **Prompt Library**

  - Prompt management and templates
  - Custom prompt creation
  - Categorized prompt organization

- **MCP Client**

  - Model Context Protocol integration
  - External tool and data source connections
  - Plugin architecture

- **Artifacts**

  - Added pglite Artifact for postgres sql, in the browser similar to pyodide
  - Better writing document with wysiwyg and / command

- **Wide Mode**

  - Prose-optimized layout for long-form content
  - Toggle between compact and wide views
  - Enhanced typography

- **Input History**

  - Navigate previous inputs with Shift + Arrow keys
  - Persistent history across sessions
  - Auto-completion suggestions

- **Command Palette**
  - Quick access via Ctrl/Cmd + K
  - Context-aware commands
  - Keyboard shortcuts

## Technical Stack

- [Next.js](https://nextjs.org) App Router
  - React Server Components and Server Actions
  - File-based routing
- [AI SDK](https://sdk.vercel.ai/docs)
  - Unified API for text generation and tool calls
  - Streaming responses
  - Multiple provider support
- [shadcn/ui](https://ui.shadcn.com)
  - Component library built on Radix UI
  - Tailwind CSS styling
- **Data Layer**
  - PostgreSQL with Drizzle ORM
  - File storage with Vercel Blob
  - User authentication with Auth.js
- **Additional Features**
  - Multimodal input with file attachments
  - Artifact creation (code, documents, images, spreadsheets)
  - Message voting and feedback
  - Real-time streaming

## Model Providers

Supports multiple AI providers through the AI SDK:

- **xAI** - Grok models
- **OpenAI** - GPT-4, GPT-3.5 Turbo
- **Anthropic** - Claude 3.5 Sonnet, Claude 3 Opus, Claude 3 Haiku
- **Google** - Gemini Pro, Gemini Pro Vision
- **Groq** - Llama, Mixtral, Gemma models
- **Mistral** - Mistral Large, Medium, Small
- **Vercel** - V0 model
- **TogetherAI** - Open-source models

## Deploy Your Own

Deploy to Vercel:

[![Deploy with Vercel](https://vercel.com/button)](https://vercel.com/new/clone?repository-url=https%3A%2F%2Fgithub.com%2Fmaxbaines%2Fai-chatbot-plus.git)

## Running locally

Set up environment variables from `.env.example`:

1. Install Vercel CLI: `npm i -g vercel`
2. Link local instance: `vercel link`
3. Download environment variables: `vercel env pull`

```bash
pnpm install
pnpm dev
```

Application runs on [localhost:3000](http://localhost:3000).

## Keyboard Shortcuts

- `Ctrl/Cmd + K` - Command palette
- `Shift + ↑/↓` - Input history navigation
- `Tab` or `→` - Accept suggestion
- `Ctrl/Cmd + N` - New chat
- `Escape` - Clear suggestions

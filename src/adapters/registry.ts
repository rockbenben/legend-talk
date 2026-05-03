import type { LLMAdapter } from '../types';
import { OpenAICompatibleAdapter } from './openai-compatible';
import { AnthropicAdapter } from './anthropic';

const adapters: LLMAdapter[] = [
  // ── Overseas ──
  new OpenAICompatibleAdapter('openai', 'OpenAI', 'https://api.openai.com/v1', [
    { id: 'gpt-5.5-pro', name: 'GPT-5.5 Pro' },
    { id: 'gpt-5.5', name: 'GPT-5.5' },
    { id: 'gpt-5.4', name: 'GPT-5.4' },
    { id: 'gpt-5.4-mini', name: 'GPT-5.4 Mini' },
    { id: 'gpt-5.4-nano', name: 'GPT-5.4 Nano' },
  ], {
    docsUrl: 'https://platform.openai.com/docs/api-reference/chat',
    apiKeyUrl: 'https://platform.openai.com/api-keys',
    thinkingStyle: 'reasoning_effort',
    group: 'international',
  }),

  new AnthropicAdapter(),

  new OpenAICompatibleAdapter(
    'gemini',
    'Google Gemini',
    'https://generativelanguage.googleapis.com/v1beta/openai',
    [
      { id: 'gemini-3.1-pro-preview', name: 'Gemini 3.1 Pro' },
      { id: 'gemini-3-flash-preview', name: 'Gemini 3 Flash' },
      { id: 'gemini-3.1-flash-lite-preview', name: 'Gemini 3.1 Flash Lite' },
      { id: 'gemini-2.5-pro', name: 'Gemini 2.5 Pro' },
      { id: 'gemini-2.5-flash', name: 'Gemini 2.5 Flash' },
      { id: 'gemini-2.5-flash-lite', name: 'Gemini 2.5 Flash Lite' },
    ],
    {
      docsUrl: 'https://ai.google.dev/gemini-api/docs/openai',
      apiKeyUrl: 'https://aistudio.google.com/apikey',
      thinkingStyle: 'reasoning_effort',
      group: 'international',
    },
  ),

  new OpenAICompatibleAdapter(
    'xai',
    'xAI Grok',
    'https://api.x.ai/v1',
    [
      { id: 'grok-4.3', name: 'Grok 4.3' },
      { id: 'grok-4.20-0309-reasoning', name: 'Grok 4.20 Reasoning' },
      { id: 'grok-4.20-0309-non-reasoning', name: 'Grok 4.20', thinking: false },
      { id: 'grok-4.20-multi-agent-0309', name: 'Grok 4.20 Multi-Agent' },
    ],
    {
      docsUrl: 'https://docs.x.ai/docs/api-reference',
      apiKeyUrl: 'https://console.x.ai',
      thinkingStyle: 'reasoning_effort',
      group: 'international',
    },
  ),

  new OpenAICompatibleAdapter(
    'mistral',
    'Mistral',
    'https://api.mistral.ai/v1',
    [
      { id: 'mistral-large-latest', name: 'Mistral Large' },
      { id: 'mistral-medium-latest', name: 'Mistral Medium' },
      { id: 'mistral-small-latest', name: 'Mistral Small' },
      { id: 'magistral-medium-latest', name: 'Magistral Medium (reasoning)' },
      { id: 'magistral-small-latest', name: 'Magistral Small (reasoning)' },
      { id: 'codestral-latest', name: 'Codestral' },
      { id: 'ministral-8b-latest', name: 'Ministral 8B' },
      { id: 'ministral-3b-latest', name: 'Ministral 3B' },
    ],
    {
      docsUrl: 'https://docs.mistral.ai/api/',
      apiKeyUrl: 'https://console.mistral.ai/api-keys',
      group: 'international',
    },
  ),

  new OpenAICompatibleAdapter(
    'cohere',
    'Cohere',
    'https://api.cohere.ai/compatibility/v1',
    [
      { id: 'command-a-03-2025', name: 'Command A' },
      { id: 'command-a-reasoning-08-2025', name: 'Command A Reasoning' },
      { id: 'command-r-plus-08-2024', name: 'Command R+' },
      { id: 'command-r-08-2024', name: 'Command R' },
      { id: 'command-r7b-12-2024', name: 'Command R7B' },
    ],
    {
      docsUrl: 'https://docs.cohere.com/docs/compatibility-api',
      apiKeyUrl: 'https://dashboard.cohere.com/api-keys',
      group: 'international',
    },
  ),

  // ── China ──
  new OpenAICompatibleAdapter('deepseek', 'DeepSeek', 'https://api.deepseek.com', [
    { id: 'deepseek-v4-flash', name: 'DeepSeek V4 Flash' },
    { id: 'deepseek-v4-pro', name: 'DeepSeek V4 Pro' },
  ], {
    docsUrl: 'https://api-docs.deepseek.com/zh-cn/',
    apiKeyUrl: 'https://platform.deepseek.com/api_keys',
    group: 'china',
  }),

  new OpenAICompatibleAdapter(
    'moonshot',
    'Moonshot / Kimi',
    'https://api.moonshot.cn/v1',
    [
      { id: 'kimi-k2.6', name: 'Kimi K2.6' },
      { id: 'kimi-k2.5', name: 'Kimi K2.5' },
      { id: 'kimi-k2-0905-preview', name: 'Kimi K2' },
      { id: 'kimi-thinking-preview', name: 'Kimi Thinking' },
      { id: 'kimi-latest', name: 'Kimi Latest' },
      { id: 'moonshot-v1-auto', name: 'Moonshot V1 Auto' },
      { id: 'moonshot-v1-128k', name: 'Moonshot V1 128K' },
    ],
    {
      docsUrl: 'https://platform.kimi.com/docs',
      apiKeyUrl: 'https://platform.kimi.com/console/api-keys',
      group: 'china',
    },
  ),

  new OpenAICompatibleAdapter(
    'zhipu',
    '智谱 GLM',
    'https://open.bigmodel.cn/api/paas/v4',
    [
      { id: 'glm-5.1', name: 'GLM-5.1' },
      { id: 'glm-5', name: 'GLM-5' },
      { id: 'glm-5-turbo', name: 'GLM-5 Turbo' },
      { id: 'glm-4.7', name: 'GLM-4.7' },
      { id: 'glm-4.7-flashx', name: 'GLM-4.7 FlashX' },
      { id: 'glm-4.7-flash', name: 'GLM-4.7 Flash (free)' },
      { id: 'glm-4.6', name: 'GLM-4.6' },
      { id: 'glm-4.5-air', name: 'GLM-4.5 Air' },
      { id: 'glm-4.5-airx', name: 'GLM-4.5 AirX' },
      { id: 'glm-4-long', name: 'GLM-4 Long (1M ctx)' },
    ],
    {
      docsUrl: 'https://open.bigmodel.cn/dev/api',
      apiKeyUrl: 'https://open.bigmodel.cn/usercenter/apikeys',
      thinkingStyle: 'thinking_type',
      group: 'china',
    },
  ),

  new OpenAICompatibleAdapter(
    'minimax',
    'MiniMax',
    'https://api.minimax.io/v1',
    [
      { id: 'MiniMax-M2.7', name: 'MiniMax M2.7' },
    ],
    {
      docsUrl: 'https://platform.minimax.io/docs/api-reference/text-chat',
      apiKeyUrl: 'https://platform.minimax.io/user-center/basic-information/interface-key',
      group: 'china',
    },
  ),

  new OpenAICompatibleAdapter(
    'hunyuan',
    '腾讯混元',
    'https://api.hunyuan.cloud.tencent.com/v1',
    [
      { id: 'hunyuan-turbos-latest', name: 'Hunyuan TurboS' },
      { id: 'hunyuan-t1-latest', name: 'Hunyuan T1 (reasoning)' },
      { id: 'hunyuan-lite', name: 'Hunyuan Lite (free)' },
    ],
    {
      docsUrl: 'https://cloud.tencent.com/document/product/1729/111007',
      apiKeyUrl: 'https://console.cloud.tencent.com/hunyuan/api-key',
      group: 'china',
    },
  ),

  new OpenAICompatibleAdapter(
    'qianfan',
    '百度千帆',
    'https://qianfan.baidubce.com/v2',
    [
      { id: 'ernie-5.0', name: 'ERNIE 5.0' },
      { id: 'ernie-x1.1', name: 'ERNIE X1.1 (reasoning)' },
      { id: 'ernie-x1-turbo-32k', name: 'ERNIE X1 Turbo (reasoning)' },
      { id: 'ernie-4.5-turbo-128k', name: 'ERNIE 4.5 Turbo 128K' },
      { id: 'ernie-4.5-turbo-32k', name: 'ERNIE 4.5 Turbo 32K' },
      { id: 'ernie-4.5-8k', name: 'ERNIE 4.5 8K' },
      { id: 'ernie-speed-pro-128k', name: 'ERNIE Speed Pro 128K' },
      { id: 'ernie-lite-pro-128k', name: 'ERNIE Lite Pro 128K' },
    ],
    {
      docsUrl: 'https://cloud.baidu.com/doc/qianfan/s/wmh4sv6ya',
      apiKeyUrl: 'https://console.bce.baidu.com/iam/#/iam/apikey/list',
      group: 'china',
    },
  ),

  new OpenAICompatibleAdapter(
    'volcengine',
    '字节方舟 Coding Plan',
    'https://ark.cn-beijing.volces.com/api/coding/v3',
    [
      { id: 'doubao-seed-2.0-code', name: 'Doubao Seed 2.0 Code' },
      { id: 'doubao-seed-2.0-pro', name: 'Doubao Seed 2.0 Pro' },
      { id: 'doubao-seed-2.0-lite', name: 'Doubao Seed 2.0 Lite' },
      { id: 'doubao-seed-code', name: 'Doubao Seed Code' },
      { id: 'kimi-k2.5', name: 'Kimi K2.5' },
      { id: 'kimi-k2-thinking', name: 'Kimi K2 Thinking' },
      { id: 'glm-4.7', name: 'GLM-4.7' },
      { id: 'deepseek-v4', name: 'DeepSeek V4' },
      { id: 'minimax-m2.5', name: 'MiniMax M2.5' },
    ],
    {
      docsUrl: 'https://www.volcengine.com/docs/82379/1928261',
      apiKeyUrl: 'https://console.volcengine.com/ark/region:ark+cn-beijing/apiKey',
      group: 'china',
    },
  ),

  new OpenAICompatibleAdapter(
    'alibaba',
    '阿里百炼 Coding Plan',
    'https://coding.dashscope.aliyuncs.com/v1',
    [
      { id: 'qwen3.6-max-preview', name: 'Qwen 3.6 Max (preview)' },
      { id: 'qwen3.6-plus', name: 'Qwen 3.6 Plus' },
      { id: 'qwen3.6-flash', name: 'Qwen 3.6 Flash' },
      { id: 'qwen3.5-plus', name: 'Qwen 3.5 Plus' },
      { id: 'qwen3-max-2026-01-23', name: 'Qwen3 Max' },
      { id: 'qwen3-coder-plus', name: 'Qwen3 Coder Plus' },
      { id: 'qwen3-coder-next', name: 'Qwen3 Coder Next' },
      { id: 'kimi-k2.5', name: 'Kimi K2.5' },
      { id: 'glm-5', name: 'GLM-5' },
      { id: 'glm-4.7', name: 'GLM-4.7' },
      { id: 'MiniMax-M2.5', name: 'MiniMax M2.5' },
    ],
    {
      docsUrl: 'https://help.aliyun.com/zh/model-studio/other-tools-coding-plan',
      apiKeyUrl: 'https://bailian.console.aliyun.com/cn-beijing#/efm/coding-plan-detail',
      thinkingStyle: 'enable_thinking',
      group: 'china',
    },
  ),

  // ── Aggregators & hosting ──
  new OpenAICompatibleAdapter(
    'openrouter',
    'OpenRouter',
    'https://openrouter.ai/api/v1',
    [
      { id: 'anthropic/claude-opus-4.7', name: 'Claude Opus 4.7' },
      { id: 'anthropic/claude-sonnet-4.6', name: 'Claude Sonnet 4.6' },
      { id: 'deepseek/deepseek-v4-pro', name: 'DeepSeek V4 Pro' },
      { id: 'deepseek/deepseek-v4-flash', name: 'DeepSeek V4 Flash' },
      { id: 'google/gemini-3.1-pro-preview', name: 'Gemini 3.1 Pro' },
      { id: 'google/gemini-3.1-flash-lite-preview', name: 'Gemini 3.1 Flash Lite' },
      { id: 'google/gemini-2.5-flash', name: 'Gemini 2.5 Flash' },
      { id: 'google/gemini-2.5-flash-lite', name: 'Gemini 2.5 Flash Lite' },
      { id: 'minimax/minimax-m2.7', name: 'MiniMax M2.7' },
      { id: 'x-ai/grok-4.3', name: 'Grok 4.3' },
      { id: 'x-ai/grok-4.20', name: 'Grok 4.20' },
      { id: 'xiaomi/mimo-v2-pro-20260318', name: 'Xiaomi MiMo V2 Pro' },
    ],
    {
      docsUrl: 'https://openrouter.ai/models',
      apiKeyUrl: 'https://openrouter.ai/settings/keys',
      thinkingStyle: 'reasoning_effort',
      group: 'aggregator',
    },
  ),

  new OpenAICompatibleAdapter(
    'siliconflow',
    'SiliconFlow',
    'https://api.siliconflow.cn/v1',
    [
      { id: 'deepseek-ai/DeepSeek-V4', name: 'DeepSeek V4' },
      { id: 'deepseek-ai/DeepSeek-R1', name: 'DeepSeek R1' },
      { id: 'Pro/deepseek-ai/DeepSeek-V4', name: 'DeepSeek V4 Pro' },
      { id: 'Qwen/Qwen3.5-397B-A17B', name: 'Qwen3.5 397B' },
      { id: 'Qwen/Qwen3.5-122B-A10B', name: 'Qwen3.5 122B' },
      { id: 'Pro/moonshotai/Kimi-K2.5', name: 'Kimi K2.5 Pro' },
      { id: 'Pro/zai-org/GLM-5.1', name: 'GLM-5.1 Pro' },
      { id: 'Pro/zai-org/GLM-4.7', name: 'GLM-4.7 Pro' },
      { id: 'Pro/MiniMaxAI/MiniMax-M2.5', name: 'MiniMax M2.5 Pro' },
    ],
    {
      docsUrl: 'https://docs.siliconflow.cn/api-reference/chat-completions/chat-completions',
      apiKeyUrl: 'https://cloud.siliconflow.cn/me/account/ak',
      group: 'aggregator',
    },
  ),

  new OpenAICompatibleAdapter(
    'groq',
    'Groq',
    'https://api.groq.com/openai/v1',
    [
      { id: 'llama-3.3-70b-versatile', name: 'Llama 3.3 70B', thinking: false },
      { id: 'llama-3.1-8b-instant', name: 'Llama 3.1 8B Instant', thinking: false },
      { id: 'openai/gpt-oss-120b', name: 'GPT OSS 120B' },
      { id: 'openai/gpt-oss-20b', name: 'GPT OSS 20B' },
      { id: 'groq/compound', name: 'Groq Compound' },
      { id: 'groq/compound-mini', name: 'Groq Compound Mini' },
      { id: 'qwen/qwen3-32b', name: 'Qwen3 32B (preview)' },
      { id: 'meta-llama/llama-4-scout-17b-16e-instruct', name: 'Llama 4 Scout (preview)', thinking: false },
    ],
    {
      docsUrl: 'https://console.groq.com/docs/models',
      apiKeyUrl: 'https://console.groq.com/keys',
      thinkingStyle: 'reasoning_effort',
      group: 'aggregator',
    },
  ),

  new OpenAICompatibleAdapter(
    'cerebras',
    'Cerebras',
    'https://api.cerebras.ai/v1',
    [
      { id: 'llama3.1-8b', name: 'Llama 3.1 8B', thinking: false },
      { id: 'gpt-oss-120b', name: 'GPT OSS 120B' },
      { id: 'qwen-3-235b-a22b-instruct-2507', name: 'Qwen3 235B (preview)' },
      { id: 'zai-glm-4.7', name: 'GLM-4.7 (preview)' },
    ],
    {
      docsUrl: 'https://inference-docs.cerebras.ai/models/overview',
      apiKeyUrl: 'https://cloud.cerebras.ai',
      thinkingStyle: 'reasoning_effort',
      group: 'aggregator',
    },
  ),

  new OpenAICompatibleAdapter(
    'together',
    'Together AI',
    'https://api.together.xyz/v1',
    [
      { id: 'deepseek-ai/DeepSeek-V4', name: 'DeepSeek V4', thinking: false },
      { id: 'deepseek-ai/DeepSeek-R1', name: 'DeepSeek R1' },
      { id: 'meta-llama/Llama-3.3-70B-Instruct-Turbo', name: 'Llama 3.3 70B', thinking: false },
      { id: 'Qwen/Qwen3.5-397B-A17B', name: 'Qwen3.5 397B' },
      { id: 'Qwen/Qwen3.5-9B', name: 'Qwen3.5 9B' },
      { id: 'Qwen/Qwen3-Coder-Next', name: 'Qwen3 Coder Next' },
      { id: 'moonshotai/Kimi-K2.5', name: 'Kimi K2.5' },
      { id: 'MiniMaxAI/MiniMax-M2.7', name: 'MiniMax M2.7' },
      { id: 'MiniMaxAI/MiniMax-M2.5', name: 'MiniMax M2.5' },
      { id: 'zai-org/GLM-5.1', name: 'GLM-5.1' },
      { id: 'zai-org/GLM-5', name: 'GLM-5' },
      { id: 'openai/gpt-oss-120b', name: 'GPT OSS 120B' },
      { id: 'google/gemma-4-31B-it', name: 'Gemma 4 31B', thinking: false },
    ],
    {
      docsUrl: 'https://docs.together.ai/reference/chat-completions-1',
      apiKeyUrl: 'https://api.together.xyz/settings/api-keys',
      thinkingStyle: 'reasoning_effort',
      group: 'aggregator',
    },
  ),

  new OpenAICompatibleAdapter(
    'fireworks',
    'Fireworks AI',
    'https://api.fireworks.ai/inference/v1',
    [
      { id: 'accounts/fireworks/models/deepseek-v4', name: 'DeepSeek V4', thinking: false },
      { id: 'accounts/fireworks/models/deepseek-r1', name: 'DeepSeek R1' },
      { id: 'accounts/fireworks/models/llama-v3p1-405b-instruct', name: 'Llama 3.1 405B', thinking: false },
      { id: 'accounts/fireworks/models/llama-v3p1-70b-instruct', name: 'Llama 3.1 70B', thinking: false },
      { id: 'accounts/fireworks/models/qwen3-235b-a22b-instruct-2507', name: 'Qwen3 235B Instruct' },
      { id: 'accounts/fireworks/models/qwen3-30b-a3b-instruct-2507', name: 'Qwen3 30B' },
      { id: 'accounts/fireworks/models/qwen2p5-72b-instruct', name: 'Qwen2.5 72B', thinking: false },
      { id: 'accounts/fireworks/models/mistral-large-3-fp8', name: 'Mistral Large 3', thinking: false },
    ],
    {
      docsUrl: 'https://docs.fireworks.ai/api-reference/post-chatcompletions',
      apiKeyUrl: 'https://fireworks.ai/account/api-keys',
      thinkingStyle: 'reasoning_effort',
      group: 'aggregator',
    },
  ),

  new OpenAICompatibleAdapter(
    'perplexity',
    'Perplexity',
    'https://api.perplexity.ai',
    [
      { id: 'sonar', name: 'Sonar', thinking: false },
      { id: 'sonar-pro', name: 'Sonar Pro (search)', thinking: false },
      { id: 'sonar-reasoning-pro', name: 'Sonar Reasoning Pro' },
      { id: 'sonar-deep-research', name: 'Sonar Deep Research' },
    ],
    {
      docsUrl: 'https://docs.perplexity.ai/api-reference/chat-completions-post',
      apiKeyUrl: 'https://www.perplexity.ai/settings/api',
      thinkingStyle: 'reasoning_effort',
      group: 'aggregator',
    },
  ),

  new OpenAICompatibleAdapter(
    'nvidia',
    'NVIDIA NIM',
    'https://integrate.api.nvidia.com/v1',
    [
      { id: 'nvidia/llama-3.3-nemotron-super-49b-v1', name: 'Llama 3.3 Nemotron Super 49B' },
      { id: 'nvidia/llama-3.1-nemotron-ultra-253b-v1', name: 'Llama 3.1 Nemotron Ultra 253B' },
      { id: 'deepseek-ai/deepseek-r1', name: 'DeepSeek R1' },
      { id: 'deepseek-ai/deepseek-v4', name: 'DeepSeek V4', thinking: false },
      { id: 'meta/llama-3.3-70b-instruct', name: 'Llama 3.3 70B', thinking: false },
      { id: 'meta/llama-4-maverick-17b-128e-instruct', name: 'Llama 4 Maverick 17B', thinking: false },
      { id: 'qwen/qwen2.5-coder-32b-instruct', name: 'Qwen2.5 Coder 32B', thinking: false },
      { id: 'qwen/qwq-32b', name: 'QwQ 32B' },
    ],
    {
      docsUrl: 'https://docs.api.nvidia.com/nim/reference/llm-apis',
      apiKeyUrl: 'https://build.nvidia.com/settings/api-keys',
      thinkingStyle: 'reasoning_effort',
      group: 'aggregator',
    },
  ),

  // Auth: GitHub PAT with `models:read` scope (fine-grained recommended).
  new OpenAICompatibleAdapter(
    'github',
    'GitHub Models',
    'https://models.github.ai/inference',
    [
      // Low tier — most generous free limits (15 RPM / 150 RPD).
      // thinking:false on non-reasoning models so the provider's reasoning_effort isn't sent.
      { id: 'openai/gpt-4.1-mini', name: 'GPT-4.1 Mini', thinking: false },
      { id: 'openai/gpt-4o-mini', name: 'GPT-4o Mini', thinking: false },
      { id: 'openai/gpt-4.1-nano', name: 'GPT-4.1 Nano', thinking: false },
      { id: 'mistral-ai/mistral-small-2503', name: 'Mistral Small 3.1', thinking: false },
      { id: 'mistral-ai/mistral-medium-2505', name: 'Mistral Medium 3', thinking: false },
      { id: 'microsoft/phi-4', name: 'Phi-4', thinking: false },
      { id: 'microsoft/phi-4-reasoning', name: 'Phi-4 Reasoning', thinking: false },
      { id: 'microsoft/phi-4-mini-reasoning', name: 'Phi-4 Mini Reasoning', thinking: false },
      { id: 'mistral-ai/codestral-2501', name: 'Codestral', thinking: false },
      // High tier (10 RPM / 50 RPD)
      { id: 'openai/gpt-4.1', name: 'GPT-4.1', thinking: false },
      { id: 'openai/gpt-4o', name: 'GPT-4o', thinking: false },
      { id: 'meta/llama-3.3-70b-instruct', name: 'Llama 3.3 70B', thinking: false },
      { id: 'meta/llama-4-maverick-17b-128e-instruct-fp8', name: 'Llama 4 Maverick', thinking: false },
      { id: 'meta/llama-4-scout-17b-16e-instruct', name: 'Llama 4 Scout', thinking: false },
      { id: 'cohere/cohere-command-r-plus-08-2024', name: 'Command R+', thinking: false },
      // Custom tier — gpt-5 / o-series accept reasoning_effort. R1/Phi reasoning/Grok do their own thing.
      { id: 'openai/gpt-5', name: 'GPT-5' },
      { id: 'openai/gpt-5-mini', name: 'GPT-5 Mini' },
      { id: 'openai/gpt-5-nano', name: 'GPT-5 Nano' },
      { id: 'openai/o3-mini', name: 'o3 Mini (reasoning)' },
      { id: 'openai/o4-mini', name: 'o4 Mini (reasoning)' },
      { id: 'deepseek/deepseek-r1', name: 'DeepSeek R1 (reasoning)', thinking: false },
      { id: 'xai/grok-3-mini', name: 'Grok 3 Mini', thinking: false },
    ],
    {
      docsUrl: 'https://github.com/marketplace?type=models',
      apiKeyUrl: 'https://github.com/settings/personal-access-tokens',
      thinkingStyle: 'reasoning_effort',
      group: 'aggregator',
    },
  ),

  // ── Custom ──
  new OpenAICompatibleAdapter(
    'custom',
    'Custom (OpenAI Compatible)',
    '',
    [],
    { group: 'custom' },
  ),
];

export const PROVIDER_GROUPS: Array<{ id: string; labelKey: string }> = [
  { id: 'international', labelKey: 'settings.providerGroupInternational' },
  { id: 'china', labelKey: 'settings.providerGroupChina' },
  { id: 'aggregator', labelKey: 'settings.providerGroupAggregator' },
  { id: 'custom', labelKey: 'settings.providerGroupCustom' },
];

export function getAllAdapters(): LLMAdapter[] {
  return adapters;
}

export function getAdapter(id: string): LLMAdapter | undefined {
  return adapters.find((a) => a.id === id);
}

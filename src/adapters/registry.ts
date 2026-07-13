import type { LLMAdapter } from '../types';
import { OpenAICompatibleAdapter } from './openai-compatible';
import { AnthropicAdapter } from './anthropic';

const adapters: LLMAdapter[] = [
  // ── Overseas ──
  // GPT-5.6 家族(/terra/luna)是当前旗舰;5.6 无 mini 变体,luna 即低成本高并发档。
  // GPT-5.x 全系为推理模型且 server 默认开(medium),故用 reasoning_effort_none:
  // off 态发显式 "none" 而不是省略。
  new OpenAICompatibleAdapter('openai', 'OpenAI', 'https://api.openai.com/v1', [
    { id: 'gpt-5.6', name: 'GPT-5.6' },
    { id: 'gpt-5.6-terra', name: 'GPT-5.6 Terra' },
    { id: 'gpt-5.6-luna', name: 'GPT-5.6 Luna' },
    { id: 'gpt-5.5', name: 'GPT-5.5' },
    { id: 'gpt-5.4-mini', name: 'GPT-5.4 Mini' },
  ], {
    docsUrl: 'https://developers.openai.com/api/docs/guides/text',
    apiKeyUrl: 'https://platform.openai.com/api-keys',
    thinkingStyle: 'reasoning_effort_none',
    group: 'international',
  }),

  new AnthropicAdapter(),

  new OpenAICompatibleAdapter(
    'gemini',
    'Google Gemini',
    'https://generativelanguage.googleapis.com/v1beta/openai',
    [
      { id: 'gemini-3.1-pro-preview', name: 'Gemini 3.1 Pro' },
      { id: 'gemini-3.5-flash', name: 'Gemini 3.5 Flash' },
      { id: 'gemini-3.1-flash-lite', name: 'Gemini 3.1 Flash Lite' },
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
      { id: 'grok-4.5', name: 'Grok 4.5' },
      { id: 'grok-4.3', name: 'Grok 4.3' },
      // 4.20 系列是 thinking-intrinsic/non-reasoning SKU,无 reasoning_effort 参数
      // → thinking:false 让映射器完全省略。
      { id: 'grok-4.20-0309-reasoning', name: 'Grok 4.20 Reasoning', thinking: false },
      { id: 'grok-4.20-0309-non-reasoning', name: 'Grok 4.20', thinking: false },
      { id: 'grok-4.20-multi-agent-0309', name: 'Grok 4.20 Multi-Agent', thinking: false },
    ],
    {
      docsUrl: 'https://docs.x.ai/developers/models',
      apiKeyUrl: 'https://console.x.ai',
      // xAI reasoning_effort 仅 low/high 两档(medium 会 400),off 发显式 none。
      thinkingStyle: 'reasoning_effort_low_high',
      group: 'international',
    },
  ),

  new OpenAICompatibleAdapter(
    'mistral',
    'Mistral',
    'https://api.mistral.ai/v1',
    [
      // 除 medium-3-5 外一律用 -latest 别名:Mistral 可调用的 API id 是日期版
      // (mistral-small-2603 等),纯版本号写法(mistral-small-4)不可调用。
      // Magistral 线已废弃(magistral-medium-2509 于 2026-07-31 退役),移除。
      { id: 'mistral-medium-3-5', name: 'Mistral Medium 3.5' },
      { id: 'mistral-small-latest', name: 'Mistral Small 4' },
      { id: 'mistral-large-latest', name: 'Mistral Large 3' },
      { id: 'ministral-14b-latest', name: 'Ministral 3 14B' },
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
      { id: 'command-a-plus-05-2026', name: 'Command A Plus' },
      { id: 'command-a-03-2025', name: 'Command A' },
      { id: 'command-a-reasoning-08-2025', name: 'Command A Reasoning' },
    ],
    {
      docsUrl: 'https://docs.cohere.com/docs/compatibility-api',
      apiKeyUrl: 'https://dashboard.cohere.com/api-keys',
      group: 'international',
    },
  ),

  // ── China ──
  // DeepSeek V4 的思考开关 server 默认 enabled(api-docs.deepseek.com thinking_mode)
  // → thinking_type 让 off 态发显式 disabled,否则每条消息都默默烧推理 token。
  new OpenAICompatibleAdapter('deepseek', 'DeepSeek', 'https://api.deepseek.com', [
    { id: 'deepseek-v4-flash', name: 'DeepSeek V4 Flash' },
    { id: 'deepseek-v4-pro', name: 'DeepSeek V4 Pro' },
  ], {
    docsUrl: 'https://api-docs.deepseek.com/zh-cn/',
    apiKeyUrl: 'https://platform.deepseek.com/api_keys',
    thinkingStyle: 'thinking_type',
    group: 'china',
  }),

  new OpenAICompatibleAdapter(
    'moonshot',
    'Moonshot / Kimi',
    'https://api.moonshot.cn/v1',
    [
      // K2.6 通过扁平 thinking:{type} 切换思考,server 默认开 → off 发显式 disabled。
      // K2.5 / kimi-latest 不支持参数切换 thinking → thinking:false 省略参数。
      { id: 'kimi-k2.6', name: 'Kimi K2.6' },
      { id: 'kimi-k2.5', name: 'Kimi K2.5', thinking: false },
      { id: 'kimi-latest', name: 'Kimi Latest', thinking: false },
    ],
    {
      docsUrl: 'https://platform.kimi.com/docs',
      apiKeyUrl: 'https://platform.kimi.com/console/api-keys',
      thinkingStyle: 'thinking_type',
      group: 'china',
    },
  ),

  new OpenAICompatibleAdapter(
    'mimo',
    '小米 MiMo',
    'https://api.xiaomimimo.com/v1',
    [
      // Thinking via binary `thinking: {type: 'enabled'|'disabled'}` (thinking_type style).
      { id: 'mimo-v2.5', name: 'MiMo V2.5' },
      { id: 'mimo-v2.5-pro', name: 'MiMo V2.5 Pro' },
    ],
    {
      docsUrl: 'https://platform.xiaomimimo.com/docs/zh-CN/api/chat/openai-api',
      apiKeyUrl: 'https://platform.xiaomimimo.com/#/console/api-keys',
      thinkingStyle: 'thinking_type',
      group: 'china',
    },
  ),

  new OpenAICompatibleAdapter(
    'zhipu',
    '智谱 GLM',
    'https://open.bigmodel.cn/api/paas/v4',
    [
      { id: 'glm-5.2', name: 'GLM-5.2' },
      { id: 'glm-5.1', name: 'GLM-5.1' },
      { id: 'glm-5', name: 'GLM-5' },
      { id: 'glm-5-turbo', name: 'GLM-5 Turbo' },
      { id: 'glm-4.7', name: 'GLM-4.7' },
      { id: 'glm-4.7-flashx', name: 'GLM-4.7 FlashX', thinking: false },
      { id: 'glm-4.6', name: 'GLM-4.6' },
      { id: 'glm-4.5-air', name: 'GLM-4.5 Air', thinking: false },
      { id: 'glm-4.5-airx', name: 'GLM-4.5 AirX', thinking: false },
      { id: 'glm-4-long', name: 'GLM-4 Long (1M ctx)', thinking: false },
      { id: 'glm-4.7-flash', name: 'GLM-4.7 Flash (free)', thinking: false },
      { id: 'glm-4-flashx-250414', name: 'GLM-4 FlashX', thinking: false },
      { id: 'glm-4-flash-250414', name: 'GLM-4 Flash', thinking: false },
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
      // M3 引入真开关 thinking:{type:"adaptive"|"disabled"},server 默认 adaptive(开)
      // → thinking_adaptive 让 off 态发显式 disabled。M2.x 推理是 intrinsic、无
      // toggle 参数 → thinking:false 完全省略。
      { id: 'MiniMax-M3', name: 'MiniMax M3' },
      { id: 'MiniMax-M2.7', name: 'MiniMax M2.7', thinking: false },
      { id: 'MiniMax-M2.7-highspeed', name: 'MiniMax M2.7 High-Speed', thinking: false },
      { id: 'MiniMax-M2.5', name: 'MiniMax M2.5', thinking: false },
    ],
    {
      docsUrl: 'https://platform.minimax.io/docs/api-reference/text-chat',
      apiKeyUrl: 'https://platform.minimax.io/user-center/basic-information/interface-key',
      thinkingStyle: 'thinking_adaptive',
      group: 'china',
    },
  ),

  new OpenAICompatibleAdapter(
    'hunyuan',
    '腾讯混元',
    'https://api.hunyuan.cloud.tencent.com/v1',
    [
      // 旧版文生文模型(turbos/t1/2.0-thinking/2.0-instruct/lite)已于 2026-06-22
      // 整体下线(公告 cloud.tencent.com/announce/detail/2301),legacy 端点仅剩
      // a13b 在售;混元平台正迁往 TokenHub,不再新增模型。
      { id: 'hunyuan-a13b', name: 'Hunyuan A13B' },
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
      { id: 'ernie-5.1', name: 'ERNIE 5.1' },
      { id: 'ernie-5.0', name: 'ERNIE 5.0' },
      { id: 'ernie-5.0-thinking-latest', name: 'ERNIE 5.0 Thinking (reasoning)' },
      // X1.1 是文心深度推理线,reasoning 内生(无 thinking 开关参数)。
      { id: 'ernie-x1.1', name: 'ERNIE X1.1 (reasoning)' },
      { id: 'ernie-4.5-turbo-128k', name: 'ERNIE 4.5 Turbo 128K' },
      { id: 'ernie-4.5-turbo-32k', name: 'ERNIE 4.5 Turbo 32K' },
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
      // 无 thinking:false 的条目 = 上游可控 reasoning SKU:on 发 reasoning_effort,
      // off 经 OpenRouter 统一参数发 reasoning:{enabled:false}(否则默认开思考的
      // 上游——Claude adaptive / DeepSeek / M3——每条消息默默烧推理 token)。
      // 打 thinking:false 的是无统一 reasoning 开关的 SKU,两态都省略参数。
      { id: 'anthropic/claude-opus-4.8', name: 'Claude Opus 4.8' },
      { id: 'anthropic/claude-sonnet-5', name: 'Claude Sonnet 5' },
      { id: 'deepseek/deepseek-v4-pro', name: 'DeepSeek V4 Pro' },
      { id: 'deepseek/deepseek-v4-flash', name: 'DeepSeek V4 Flash' },
      { id: 'google/gemini-3.5-flash', name: 'Gemini 3.5 Flash' },
      { id: 'google/gemini-3.1-pro-preview', name: 'Gemini 3.1 Pro', thinking: false },
      { id: 'openai/gpt-5.4-mini', name: 'GPT-5.4 Mini' },
      { id: 'minimax/minimax-m3', name: 'MiniMax M3' },
      { id: 'moonshotai/kimi-k2.6', name: 'Kimi K2.6' },
      { id: 'x-ai/grok-4.5', name: 'Grok 4.5', thinking: false },
      { id: 'xiaomi/mimo-v2-pro-20260318', name: 'Xiaomi MiMo V2 Pro', thinking: false },
    ],
    {
      docsUrl: 'https://openrouter.ai/models',
      apiKeyUrl: 'https://openrouter.ai/settings/keys',
      thinkingStyle: 'reasoning_effort_openrouter',
      group: 'aggregator',
    },
  ),

  new OpenAICompatibleAdapter(
    'siliconflow',
    'SiliconFlow',
    'https://api.siliconflow.cn/v1',
    [
      { id: 'deepseek-ai/DeepSeek-V4-Flash', name: 'DeepSeek V4 Flash' },
      { id: 'deepseek-ai/DeepSeek-V4-Pro', name: 'DeepSeek V4 Pro' },
      { id: 'moonshotai/Kimi-K2.6', name: 'Kimi K2.6' },
      // org 前缀是 MiniMaxAI(非 minimax),小写前缀会 404。
      { id: 'MiniMaxAI/MiniMax-M2.5', name: 'MiniMax M2.5' },
      { id: 'zai-org/GLM-5.2', name: 'GLM-5.2' },
      { id: 'zai-org/GLM-5.1', name: 'GLM-5.1' },
      { id: 'zai-org/GLM-4.7', name: 'GLM-4.7' },
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
      // reasoning_effort 留空(thinking:false)— NVIDIA NIM 对 DeepSeek 思考用的是
      // chat_template_kwargs 嵌套而非顶层 reasoning_effort(参 web-tools nvidia 实现),
      // legend-talk 这套适配器没实现该协议,故全部标 false 避免发不被接受的参数。
      { id: 'deepseek-ai/deepseek-v4-flash', name: 'DeepSeek V4 Flash', thinking: false },
      { id: 'deepseek-ai/deepseek-v4-pro', name: 'DeepSeek V4 Pro', thinking: false },
      { id: 'z-ai/glm-5.2', name: 'GLM-5.2', thinking: false },
      { id: 'openai/gpt-oss-120b', name: 'GPT OSS 120B', thinking: false },
      { id: 'google/gemma-4-31b-it', name: 'Gemma 4 31B', thinking: false },
      { id: 'nvidia/nemotron-3-super-120b-a12b', name: 'Nemotron 3 Super 120B', thinking: false },
      { id: 'meta/llama-3.3-70b-instruct', name: 'Llama 3.3 70B', thinking: false },
      { id: 'meta/llama-3.1-8b-instruct', name: 'Llama 3.1 8B', thinking: false },
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

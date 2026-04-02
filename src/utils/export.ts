import type { Conversation } from '../types';

const ANALYSIS_LABELS: Record<string, string> = {
  '__summarize__': 'Summary',
};

function resolveName(msg: { role: string; characterId?: string }, characterNames: Record<string, string>): string {
  if (msg.role === 'user') return 'You';
  if (msg.characterId?.startsWith('__')) return ANALYSIS_LABELS[msg.characterId] || 'Analysis';
  return msg.characterId ? (characterNames[msg.characterId] || msg.characterId) : 'Unknown';
}

export function exportAsMarkdown(
  conversation: Conversation,
  characterNames: Record<string, string>,
  displayTitle: string,
): string {
  let md = `# ${displayTitle}\n\n`;

  for (const msg of conversation.messages) {
    const name = resolveName(msg, characterNames);
    if (msg.characterId?.startsWith('__')) {
      // Analysis block — use heading
      md += `### ${name}\n\n${msg.content}\n\n`;
    } else {
      md += `**${name}:** ${msg.content}\n\n`;
    }
  }

  return md;
}

export function exportAsJSON(
  conversation: Conversation,
  characterNames: Record<string, string>,
  displayTitle: string,
): string {
  return JSON.stringify({
    title: displayTitle,
    messages: conversation.messages.map((msg) => [
      resolveName(msg, characterNames),
      msg.content,
    ]),
  }, null, 2);
}

/** Export full internal format (for import/backup) */
export function exportAsJSONFull(conversation: Conversation): string {
  return JSON.stringify(conversation, null, 2);
}

export function importFromJSON(json: string): Conversation {
  const parsed = JSON.parse(json);
  if (!parsed.id || !parsed.messages || !parsed.type) {
    throw new Error('Invalid conversation format');
  }
  return parsed as Conversation;
}

export function downloadFile(content: string, filename: string, mimeType: string) {
  const blob = new Blob([content], { type: mimeType });
  downloadBlob(blob, filename);
}

function downloadBlob(blob: Blob, filename: string) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}

/**
 * Generate share card via external API.
 * mode 'zip' → POST /api/generate → downloads .zip
 * mode 'long' → POST /api/generate-long → downloads .png
 */
export async function generateShareCard(
  endpoint: string,
  conversation: Conversation,
  characterNames: Record<string, string>,
  displayTitle: string,
  mode: 'zip' | 'long',
  signal?: AbortSignal,
): Promise<void> {
  const messages = conversation.messages.map((msg) => [
    resolveName(msg, characterNames),
    msg.content,
  ]);

  const apiPath = mode === 'zip' ? '/api/generate' : '/api/generate-long';
  let base = endpoint.replace(/\/+$/, '');
  if (base && !/^https?:\/\//i.test(base)) base = (base.includes('localhost') || base.includes('127.0.0.1') ? 'http://' : 'https://') + base;
  const url = base + apiPath;

  const response = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ data: { title: displayTitle, messages }, config: {} }),
    signal,
  });

  if (!response.ok) throw new Error(`HTTP ${response.status}`);

  const blob = await response.blob();
  const ext = mode === 'zip' ? 'zip' : 'png';
  downloadBlob(blob, `${displayTitle}.${ext}`);
}

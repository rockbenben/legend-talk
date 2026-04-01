import type { Conversation } from '../types';

export function exportAsMarkdown(
  conversation: Conversation,
  characterNames: Record<string, string>,
): string {
  const names = conversation.characters
    .map((id) => characterNames[id] || id)
    .join(', ');
  const title =
    conversation.type === 'single'
      ? `Conversation with ${names}`
      : `Roundtable: ${names}`;

  let md = `# ${title}\n\n`;
  md += `*${new Date(conversation.createdAt).toLocaleString()}*\n\n---\n\n`;

  for (const msg of conversation.messages) {
    if (msg.role === 'user') {
      md += `**You:** ${msg.content}\n\n`;
    } else {
      const analysisLabels: Record<string, string> = { '__summarize__': 'Summary', '__proscons__': 'Pro/Con Analysis', '__matrix__': 'Decision Matrix' };
      const name = msg.characterId?.startsWith('__') ? (analysisLabels[msg.characterId] || 'Analysis') : (msg.characterId ? (characterNames[msg.characterId] || msg.characterId) : 'Summary');
      md += `**${name}:** ${msg.content}\n\n`;
    }
  }

  return md;
}

export function exportAsJSON(conversation: Conversation): string {
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
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}

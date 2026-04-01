import type { Conversation } from '../types';

const ANALYSIS_LABELS: Record<string, string> = {
  '__summarize__': 'Summary', '__proscons__': 'Pro/Con Analysis', '__matrix__': 'Decision Matrix',
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
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}

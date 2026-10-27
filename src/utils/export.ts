import type { Conversation } from '../types';
import i18n from '../i18n';

/**
 * The role labels the export writes — the SAME labels the transcript shows on
 * the bubbles. Two reasons, not one:
 *
 * 1. Consistency. The screen calls the moderator 主持人; an export that calls
 *    it "Moderator" reads like a different document, and the character names
 *    around it ARE localized — so the file ends up half Chinese, half English.
 * 2. The chair must not be "You". An export is a file you hand to someone
 *    else; in that file "You" means the reader, not the person who convened
 *    the table.
 */
function roleLabel(characterId: string): string {
  switch (characterId) {
    case '__summarize__': return i18n.t('chat.summarize');
    case '__moderator__': return i18n.t('moderator.name');
    case '__focus__': return i18n.t('roundtable.focus');
    default: return i18n.t('common.unknown');
  }
}

function resolveName(msg: { role: string; characterId?: string }, characterNames: Record<string, string>): string {
  if (msg.role === 'user') return i18n.t('chat.theChair');
  if (msg.characterId?.startsWith('__')) return roleLabel(msg.characterId);
  return msg.characterId ? (characterNames[msg.characterId] || msg.characterId) : i18n.t('common.unknown');
}

export function exportAsMarkdown(
  conversation: Conversation,
  characterNames: Record<string, string>,
  displayTitle: string,
): string {
  let md = `# ${displayTitle}\n\n`;

  for (const msg of conversation.messages) {
    if (!msg.content.trim()) continue; // skip empty messages
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
    messages: conversation.messages.filter((msg) => msg.content.trim()).map((msg) => [
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
  if (
    typeof parsed?.id !== 'string' ||
    !Array.isArray(parsed.messages) ||
    (parsed.type !== 'single' && parsed.type !== 'roundtable')
  ) {
    throw new Error('Invalid conversation format');
  }
  return parsed as Conversation;
}

export function downloadFile(content: string, filename: string, mimeType: string) {
  const blob = new Blob([content], { type: mimeType });
  downloadBlob(blob, filename);
}

/**
 * A filename the filesystem will actually accept.
 *
 * Windows rejects < > : " / \ | ? * and drops a trailing dot or space. The
 * title is user text — a topic like "AI 会取代人类吗?" asks for a name the
 * system cannot create, and the download lands under some mangled name that
 * no longer matches the title.
 */
export function safeFileName(name: string): string {
  const cleaned = name
    .replace(/[<>:"/\\|?*\u0000-\u001f]/g, '_')
    .replace(/[. ]+$/g, '')
    .trim();
  if (!cleaned) return i18n.t('chat.untitled');
  // Truncate the BASE name only. The extension is what tells the OS what the
  // file is — cutting it off leaves a file nothing opens as Markdown/JSON, and
  // the name stops matching the title.
  const dot = cleaned.lastIndexOf('.');
  const hasExt = dot > 0;                 // a leading dot is not an extension
  const base = hasExt ? cleaned.slice(0, dot) : cleaned;
  const ext = hasExt ? cleaned.slice(dot) : '';
  // Code-point-safe truncation — .slice() on UTF-16 units can split an emoji
  // and leave a lone surrogate (renders as �).
  const points = [...base];
  if (points.length <= 100) return cleaned;
  return `${points.slice(0, 99).join('')}…${ext}`;
}

function downloadBlob(blob: Blob, filename: string) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = safeFileName(filename);
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
  const messages = conversation.messages.filter((msg) => msg.content.trim()).map((msg) => [
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

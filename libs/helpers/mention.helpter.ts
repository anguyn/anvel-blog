export interface MentionData {
  userId: string;
  username: string;
  position: number;
}

/**
 * Extract mentions from content
 * Only extracts valid @username patterns
 */
export function extractMentions(content: string): MentionData[] {
  const mentions: MentionData[] = [];

  const mentionRegex = /@([a-zA-Z0-9_]{2,30})\b/g;
  let match;

  while ((match = mentionRegex.exec(content)) !== null) {
    mentions.push({
      userId: '',
      username: match[1],
      position: match.index,
    });
  }

  return mentions;
}

export function isValidMention(username: string): boolean {
  const usernameRegex = /^[a-zA-Z0-9_]{2,30}$/;
  return usernameRegex.test(username);
}

export async function parseMentionsWithUserData(
  content: string,
  userLookup: Map<string, string>,
): Promise<MentionData[]> {
  const mentions = extractMentions(content);

  return mentions
    .filter(m => userLookup.has(m.username))
    .map(m => ({
      ...m,
      userId: userLookup.get(m.username)!,
    }));
}

/**
 * Highlight mentions in content for display
 */
export function highlightMentions(
  content: string,
  mentions: Array<{ username: string; position: number }>,
  renderMention: (username: string) => React.ReactNode,
): React.ReactNode[] {
  if (!mentions || mentions.length === 0) return [content];

  const parts: React.ReactNode[] = [];
  let lastIndex = 0;

  const sortedMentions = [...mentions].sort((a, b) => a.position - b.position);

  sortedMentions.forEach((mention, idx) => {
    if (mention.position > lastIndex) {
      parts.push(content.slice(lastIndex, mention.position));
    }

    parts.push(renderMention(mention.username));

    lastIndex = mention.position + mention.username.length + 1; // +1 for @
  });

  if (lastIndex < content.length) {
    parts.push(content.slice(lastIndex));
  }

  return parts;
}

/**
 * Resolve mentions before submitting comment
 */
export async function resolveMentions(
  content: string,
  postId: string,
): Promise<MentionData[]> {
  const rawMentions = extractMentions(content);

  if (rawMentions.length === 0) {
    return [];
  }

  try {
    const uniqueUsernames = [...new Set(rawMentions.map(m => m.username))];

    const response = await fetch(`/api/users/resolve`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        usernames: uniqueUsernames,
        postId,
      }),
    });

    if (!response.ok) {
      throw new Error('Failed to resolve mentions');
    }

    const { users } = await response.json();

    const userMap = new Map(
      users.map((u: any) => [u.username.toLowerCase(), u.id]),
    );

    return rawMentions
      .filter(m => userMap.has(m.username.toLowerCase()))
      .map(m => {
        const userId = userMap.get(m.username.toLowerCase());
        return {
          userId: userId as string,
          username: m.username,
          position: m.position,
        };
      });
  } catch (error) {
    console.error('Error resolving mentions:', error);
    return [];
  }
}

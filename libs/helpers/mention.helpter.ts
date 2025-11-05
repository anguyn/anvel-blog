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

  // Match @username pattern (alphanumeric + underscore, 2-30 chars)
  const mentionRegex = /@([a-zA-Z0-9_]{2,30})\b/g;
  let match;

  while ((match = mentionRegex.exec(content)) !== null) {
    mentions.push({
      userId: '', // Will be populated from API response
      username: match[1],
      position: match.index,
    });
  }

  return mentions;
}

/**
 * Validate mention format
 */
export function isValidMention(username: string): boolean {
  // Username must be 2-30 chars, alphanumeric + underscore
  const usernameRegex = /^[a-zA-Z0-9_]{2,30}$/;
  return usernameRegex.test(username);
}

/**
 * Parse content and convert mentions to user IDs
 * This should be called after getting user data from API
 */
export async function parseMentionsWithUserData(
  content: string,
  userLookup: Map<string, string>, // username -> userId
): Promise<MentionData[]> {
  const mentions = extractMentions(content);

  // Filter to only include mentions where we have user data
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

  // Sort mentions by position
  const sortedMentions = [...mentions].sort((a, b) => a.position - b.position);

  sortedMentions.forEach((mention, idx) => {
    // Add text before mention
    if (mention.position > lastIndex) {
      parts.push(content.slice(lastIndex, mention.position));
    }

    // Add mention
    parts.push(renderMention(mention.username));

    lastIndex = mention.position + mention.username.length + 1; // +1 for @
  });

  // Add remaining text
  if (lastIndex < content.length) {
    parts.push(content.slice(lastIndex));
  }

  return parts;
}

/**
 * Resolve mentions before submitting comment
 * Fetches user IDs for mentioned usernames
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
    // Get unique usernames
    const uniqueUsernames = [...new Set(rawMentions.map(m => m.username))];

    // Fetch user data for these usernames
    const response = await fetch(`/api/users/resolve`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        usernames: uniqueUsernames,
        postId, // For context/permission checking
      }),
    });

    if (!response.ok) {
      throw new Error('Failed to resolve mentions');
    }

    const { users } = await response.json();

    // Create username -> userId map (use lowercase for case-insensitive matching)
    const userMap = new Map(
      users.map((u: any) => [u.username.toLowerCase(), u.id]),
    );

    // Return only valid mentions with user IDs
    return rawMentions
      .filter(m => userMap.has(m.username.toLowerCase()))
      .map(m => {
        const userId = userMap.get(m.username.toLowerCase());
        return {
          userId: userId as string, // Type assertion since we filtered above
          username: m.username,
          position: m.position,
        };
      });
  } catch (error) {
    console.error('Error resolving mentions:', error);
    return [];
  }
}

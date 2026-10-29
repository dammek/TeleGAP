/**
 * Formats an ISO date timestamp into a human-readable 'Last Active' status string.
 * Examples: 'Active just now', 'Active 12m ago', 'Active 2h ago', 'Active yesterday', 'Active 3d ago'
 */
export function formatLastActive(dateString?: string | null): { text: string; isRecent: boolean; isOnline: boolean } {
  if (!dateString) {
    return { text: 'Active recently', isRecent: true, isOnline: false };
  }

  try {
    const past = new Date(dateString).getTime();
    const now = Date.now();
    const diffMs = Math.max(0, now - past);
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMins / 60);
    const diffDays = Math.floor(diffHours / 24);

    if (diffMins < 5) {
      return { text: 'Active just now', isRecent: true, isOnline: true };
    }
    if (diffMins < 60) {
      return { text: `Active ${diffMins}m ago`, isRecent: true, isOnline: false };
    }
    if (diffHours < 24) {
      return { text: `Active ${diffHours}h ago`, isRecent: true, isOnline: false };
    }
    if (diffDays === 1) {
      return { text: 'Active yesterday', isRecent: false, isOnline: false };
    }
    if (diffDays < 30) {
      return { text: `Active ${diffDays}d ago`, isRecent: false, isOnline: false };
    }
    return { text: 'Active recently', isRecent: false, isOnline: false };
  } catch {
    return { text: 'Active recently', isRecent: false, isOnline: false };
  }
}

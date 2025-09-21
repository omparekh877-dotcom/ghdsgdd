export type InboxNotification = {
  id: string;
  type: 'production' | 'inventory' | 'recipe' | 'info';
  title: string;
  message: string;
  link?: string;
  createdAt: string;
  read: boolean;
};

async function http<T>(url: string, options?: RequestInit): Promise<T> {
  // Normalize relative URLs to absolute so fetch failures in some proxy setups are reduced
  const fullUrl = url.startsWith('http') ? url : `${window.location.origin}${url}`;

  try {
    // If fetch is not available in this environment (some injected scripts can overwrite), fallback to XHR
    if (typeof fetch !== 'function') {
      return await new Promise<T>((resolve, reject) => {
        try {
          const xhr = new XMLHttpRequest();
          xhr.open(options?.method || 'GET', fullUrl, true);
          (xhr as any).responseType = 'text';
          const headers = { 'Content-Type': 'application/json', ...(options && (options.headers as any)) };
          Object.keys(headers).forEach((k) => xhr.setRequestHeader(k, (headers as any)[k]));

          xhr.onload = () => {
            if (xhr.status >= 200 && xhr.status < 300) {
              const text = xhr.responseText;
              try {
                resolve(text ? (JSON.parse(text) as T) : ({} as T));
              } catch (e) {
                resolve({} as T);
              }
            } else {
              reject(new Error(`HTTP ${xhr.status}: ${xhr.responseText || ''}`));
            }
          };

          xhr.onerror = () => reject(new Error('Network error'));
          xhr.send(options?.body as any);
        } catch (e) {
          reject(e);
        }
      });
    }

    const res = await fetch(fullUrl, {
      headers: { 'Content-Type': 'application/json' },
      ...options,
    });

    if (!res.ok) {
      const text = await res.text().catch(() => '');
      throw new Error(`HTTP ${res.status}: ${text}`);
    }

    // Try to parse JSON, but guard against empty responses
    const text = await res.text();
    return text ? (JSON.parse(text) as T) : ({} as T);
  } catch (err: any) {
    // Annotate TypeError from fetch to provide clearer actionable logs
    if (err instanceof TypeError && /failed to fetch/i.test(err.message)) {
      // In preview environments this is expected when the internal proxy or backend isn't available.
      // Avoid noisy errors; callers should handle and degrade gracefully.
      console.debug('Network fetch failure (suppressed):', fullUrl);
      throw new Error('Network error: failed to reach the server.');
    }

    throw err instanceof Error ? err : new Error('Network error');
  }
}

export const notificationsApi = {
  async create(input: Omit<InboxNotification, 'id' | 'createdAt' | 'read'>) {
    try {
      return await http<InboxNotification>('/api/notifications', {
        method: 'POST',
        body: JSON.stringify(input),
      });
    } catch (e) {
      console.debug('Notifications: create failed (ignored)', e);
      return undefined as any;
    }
  },
  async list(unread?: boolean) {
    try {
      const q = unread ? '?unread=true' : '';
      return await http<InboxNotification[]>(`/api/notifications${q}`);
    } catch (e) {
      console.warn('Notifications: list failed, returning empty array', e);
      return [];
    }
  },
  async markRead(id: string, read: boolean) {
    try {
      return await http<InboxNotification>(`/api/notifications/${encodeURIComponent(id)}`, {
        method: 'PATCH',
        body: JSON.stringify({ read }),
      });
    } catch (e) {
      console.warn('Notifications: markRead failed (ignored)', e);
      return Promise.resolve({} as any);
    }
  },
  async markAllRead() {
    try {
      return await http<{ success: true }>(`/api/notifications/mark-all-read`, {
        method: 'POST',
      });
    } catch (e) {
      console.warn('Notifications: markAllRead failed (ignored)', e);
      return { success: true } as any;
    }
  },
};

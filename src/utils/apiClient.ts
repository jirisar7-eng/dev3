export const apiFetch = async (input: RequestInfo | URL, init?: RequestInit): Promise<Response> => {
  const response = await fetch(input, init);
  if (response.status === 401) {
    const url = typeof input === 'string' ? input : ('url' in input ? input.url : input.toString());
    // Do not trigger global logout for login or MFA endpoints
    if (!url.includes('/api/auth/login') && !url.includes('/api/auth/2fa/verify') && !url.includes('/api/auth/mfa/verify')) {
      if (typeof window !== 'undefined') {
        window.dispatchEvent(new CustomEvent('auth_401_error'));
      }
    }
  }
  return response;
};

export const safeJsonResponse = async <T = any>(
  response: Response
): Promise<T | null> => {
  const contentType = response.headers.get('content-type') || '';

  if (!contentType.toLowerCase().includes('application/json')) {
    return null;
  }

  try {
    return (await response.json()) as T;
  } catch {
    return null;
  }
};


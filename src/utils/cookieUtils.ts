export const getClearCookieOptions = (isPendingMfa = false) => ({
  path: '/',
  domain: process.env.COOKIE_DOMAIN || undefined,
  secure: isPendingMfa ? process.env.NODE_ENV === 'production' : true,
  sameSite: (isPendingMfa ? 'lax' : (process.env.NODE_ENV === 'production' ? 'lax' : 'none')) as any,
});

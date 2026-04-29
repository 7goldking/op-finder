// Заглушка для совместимости — base44 больше не используется
export const appParams = {
  appId: null, token: null,
  fromUrl: typeof window !== 'undefined' ? window.location.href : '',
  appBaseUrl: typeof window !== 'undefined' ? window.location.origin : '',
};

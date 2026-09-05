const configuredUrl=process.env.NEXT_PUBLIC_APP_URL?.trim().replace(/\/$/,'');
export const APP_URL=configuredUrl||'https://zorx.online';

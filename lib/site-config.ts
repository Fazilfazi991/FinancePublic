export const SITE_CONFIG = {
  name: "ZeroDebt",
  url: "https://zerodebt.life",
  supportEmail: process.env.NEXT_PUBLIC_SUPPORT_EMAIL?.trim() || null,
} as const;

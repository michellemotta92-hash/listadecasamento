import { SiteConfig } from '@/types';
import { appConfig } from '@/lib/config';
import { demoStore } from './demo-store';
import { api } from '@/lib/api';

export async function getSiteConfig(): Promise<SiteConfig> {
  if (appConfig.isDemoMode) {
    return demoStore.getSiteConfig();
  }
  return api.get<SiteConfig>('/site-config');
}

export async function updateSiteConfig(config: Partial<SiteConfig>): Promise<void> {
  if (appConfig.isDemoMode) {
    demoStore.updateSiteConfig(config);
    return;
  }
  await api.patch('/site-config', config);
}

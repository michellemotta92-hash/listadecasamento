import { appConfig } from '@/lib/config';
import { api } from '@/lib/api';

const blobStore = new Map<string, string>();

export async function uploadImage(file: File, path: string): Promise<string> {
  if (appConfig.isDemoMode) {
    const url = URL.createObjectURL(file);
    blobStore.set(path, url);
    return url;
  }

  const result = await api.upload('/upload', file);
  return result.url;
}

export async function deleteImage(path: string): Promise<void> {
  if (appConfig.isDemoMode) {
    const url = blobStore.get(path);
    if (url) URL.revokeObjectURL(url);
    blobStore.delete(path);
    return;
  }
  // Server handles cleanup
}

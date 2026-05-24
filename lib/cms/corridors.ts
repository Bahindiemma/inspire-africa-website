import { strapiFetch, isStrapiAvailable } from '@/lib/strapi';
import { CORRIDOR_SECTORS as STATIC_CORRIDORS } from '@/lib/site';

export interface CorridorCms {
  country: string;
  displayName: string;
  sectors: string;
  order?: number;
}

export async function getCorridors(): Promise<CorridorCms[]> {
  if (!isStrapiAvailable()) {
    return STATIC_CORRIDORS.map((c, i) => ({
      country: c.country,
      displayName: c.country,
      sectors: c.sectors,
      order: i + 1,
    }));
  }
  try {
    const { data } = await strapiFetch<CorridorCms[]>(
      '/corridors?sort=order:asc&pagination[pageSize]=50',
      { revalidate: 300, tags: ['corridor'] }
    );
    return data;
  } catch {
    return STATIC_CORRIDORS.map((c, i) => ({
      country: c.country,
      displayName: c.country,
      sectors: c.sectors,
      order: i + 1,
    }));
  }
}

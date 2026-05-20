import { SITE } from "./site";

export interface JoinLinkOptions {
  source: string;
  medium?: string;
  campaign?: string;
}

export function joinUrl({ source, medium = "website", campaign = "join_community" }: JoinLinkOptions): string {
  const url = new URL(SITE.community.baseUrl);
  url.searchParams.set("autojoin", "1");
  url.searchParams.set("utm_source", source);
  url.searchParams.set("utm_medium", medium);
  url.searchParams.set("utm_campaign", campaign);
  return url.toString();
}

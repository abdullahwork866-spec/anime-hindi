import { Stream, ProviderContext } from "../types";
/** Rank lawful upstream stream records that include audio-language metadata. */
export function rankHindiAudio<T extends { audioLanguages?: string[]; tags?: string[]; tag?: string }>(items: T[]): T[] {
  const hasHindi = (item: T) => [...(item.audioLanguages || []), ...(item.tags || []), item.tag || ""]
    .map((x) => String(x).toLowerCase())
    .some((x) => x === "hi" || x === "hindi" || x.includes("hindi") || x.includes("hi-audio"));
  return [...items].sort((a, b) => Number(hasHindi(b)) - Number(hasHindi(a)));
}
export const getStream = async function ({ link }: {
  link: string; type: string; signal?: AbortSignal; providerContext: ProviderContext; isDownload?: boolean;
}): Promise<Stream[]> {
  // This provider discovers anime and official/info links. It does not scrape
  // unauthorized stream hosts or torrent indexes, so it intentionally returns no streams.
  void link;
  return [];
};

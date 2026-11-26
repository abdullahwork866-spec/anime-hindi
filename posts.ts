import { Post, ProviderContext } from "../types";

const ANILIST_API = "https://graphql.anilist.co";
const QUERY = `
query ($page: Int, $perPage: Int, $sort: [MediaSort], $search: String, $genre: String, $status: MediaStatus) {
  Page(page: $page, perPage: $perPage) {
    media(type: ANIME, isAdult: false, sort: $sort, search: $search, genre: $genre, status: $status) {
      id title { romaji english native } coverImage { large } format seasonYear episodes siteUrl
    }
  }
}`;
const GENRE_BY_FILTER: Record<string, string> = {
  ACTION: "Action", ADVENTURE: "Adventure", COMEDY: "Comedy",
  FANTASY: "Fantasy", ROMANCE: "Romance", SCIFI: "Sci-Fi",
};
function displayTitle(media: any): string {
  return media?.title?.english || media?.title?.romaji || media?.title?.native || "Untitled anime";
}
function mapMedia(media: any): Post {
  const year = media?.seasonYear ? ` (${media.seasonYear})` : "";
  const ep = media?.episodes ? ` • ${media.episodes} eps` : "";
  return { title: `${displayTitle(media)}${year}${ep}`, link: `anilist:${media.id}`, image: media?.coverImage?.large || "", tag: media?.format || "Anime" };
}
async function requestAniList(variables: Record<string, unknown>, providerContext: ProviderContext, signal?: AbortSignal) {
  const response = await providerContext.axios.post(ANILIST_API, { query: QUERY, variables }, {
    headers: { ...providerContext.commonHeaders, "Content-Type": "application/json" }, signal, timeout: 15000,
  });
  if (response.data?.errors?.length) throw new Error(response.data.errors.map((e: any) => e.message).join("; "));
  return response.data?.data?.Page?.media || [];
}
export const getPosts = async function ({ filter, page, signal, providerContext }: {
  filter: string; page: number; providerValue: string; signal: AbortSignal; providerContext: ProviderContext;
}): Promise<Post[]> {
  const normalized = String(filter || "TRENDING").toUpperCase();
  const sort = normalized === "POPULAR" ? ["POPULARITY_DESC"] : ["TRENDING_DESC"];
  const status = normalized === "AIRING" ? "RELEASING" : undefined;
  const genre = GENRE_BY_FILTER[normalized];
  const media = await requestAniList({ page: Math.max(1, page || 1), perPage: 20, sort, ...(status ? { status } : {}), ...(genre ? { genre } : {}) }, providerContext, signal);
  return media.map(mapMedia);
};
export const getSearchPosts = async function ({ searchQuery, page, signal, providerContext }: {
  searchQuery: string; page: number; providerValue: string; signal: AbortSignal; providerContext: ProviderContext;
}): Promise<Post[]> {
  // Search official anime metadata. Adding "Hindi dubbed" to a search is useful for
  // discovery, but AniList does not confirm audio-language availability.
  const media = await requestAniList({ page: Math.max(1, page || 1), perPage: 20, sort: ["SEARCH_MATCH"], search: searchQuery.trim() }, providerContext, signal);
  return media.map(mapMedia);
};

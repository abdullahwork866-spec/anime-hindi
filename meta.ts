import { Info, ProviderContext } from "../types";
const ANILIST_API = "https://graphql.anilist.co";
const META_QUERY = `
query ($id: Int) { Media(id: $id, type: ANIME) {
  id title { romaji english native } coverImage { large extraLarge }
  description(asHtml: false) episodes format status genres averageScore seasonYear siteUrl
  externalLinks { site url } trailer { site id }
} }`;
function getId(link: string): number | null {
  const match = String(link || "").match(/(?:anilist:|\/anime\/)(\d+)/i);
  return match ? Number(match[1]) : null;
}
export const getMeta = async function ({ link, providerContext }: { link: string; providerContext: ProviderContext }): Promise<Info> {
  const id = getId(link);
  if (!id) throw new Error("Unsupported anime link. Expected an AniList ID.");
  const response = await providerContext.axios.post(ANILIST_API, { query: META_QUERY, variables: { id } }, {
    headers: { ...providerContext.commonHeaders, "Content-Type": "application/json" }, timeout: 15000,
  });
  const media = response.data?.data?.Media;
  if (!media) throw new Error("Anime metadata was not found.");
  const title = media.title?.english || media.title?.romaji || media.title?.native || "Anime";
  const external = (media.externalLinks || []).filter((x: any) => x?.url);
  const directLinks: { title: string; link: string; type: "series" }[] = [
    { title: "AniList details", link: media.siteUrl, type: "series" },
    ...external.map((x: any) => ({ title: x.site || "External link", link: x.url, type: "series" as const })),
  ].filter((x) => !!x.link);
  if (media.trailer?.site === "YouTube" && media.trailer?.id) directLinks.push({ title: "Trailer", link: `https://www.youtube.com/watch?v=${media.trailer.id}`, type: "series" });
  const synopsis = String(media.description || "No synopsis available.").replace(/<[^>]*>/g, "").replace(/\s+/g, " ").trim();
  return {
    title, synopsis: `${synopsis}\n\nHindi audio/dub availability is not verified by AniList. Check official external links for regional audio options.`,
    image: media.coverImage?.extraLarge || media.coverImage?.large || "", imdbId: "", type: "series",
    tags: [...(media.genres || []), media.format, media.seasonYear ? String(media.seasonYear) : ""].filter(Boolean),
    rating: media.averageScore ? `${media.averageScore / 10}/10 AniList score` : undefined,
    linkList: [{ title: "Official / information links", quality: "External", directLinks }], webUrl: media.siteUrl,
  };
};

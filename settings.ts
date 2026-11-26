import { ProviderContext, SettingsField } from "../types";
export const getSettingsSchema = async function ({ providerContext }: { providerContext: ProviderContext }): Promise<SettingsField[]> {
  return [
    { key: "preferHindiAudio", type: "toggle", label: "Prefer Hindi audio", description: "A language-ranking helper prioritizes Hindi-tagged or multi-audio items when a lawful upstream source supplies language metadata.", defaultValue: true },
    { key: "showExternalLinks", type: "toggle", label: "Show external links", description: "Display AniList and external publisher/platform links in anime details.", defaultValue: true },
  ];
};

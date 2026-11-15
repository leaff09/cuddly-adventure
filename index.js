(() => {
  const unpatches = [];

  function stripProfileEffect(profile) {
    if (!profile || typeof profile !== "object") return profile;
    if ("profileEffect" in profile) profile.profileEffect = null;
    if ("profileEffectId" in profile) profile.profileEffectId = null;
    return profile;
  }

  return {
    default: {
      start() {
        const { lookupModule, filters } = valenced.modules.finders;
        const { after, instead } = valenced.patcher;

        // 1. Masquer toutes les décorations d'avatar
        const decoRes = lookupModule(filters.withProps("getAvatarDecorationURL"));
        const decoMod = decoRes ? decoRes["0"] : null;

        if (decoMod && typeof decoMod.getAvatarDecorationURL === "function") {
          unpatches.push(instead(decoMod, "getAvatarDecorationURL", () => null));
        }

        // 2. Masquer tous les effets de profil (animations plein écran / guirlandes)
        const profileStoreRes = lookupModule(filters.withProps("getUserProfile"));
        const UserProfileStore = profileStoreRes ? profileStoreRes["0"] : null;

        if (UserProfileStore) {
          if (typeof UserProfileStore.getUserProfile === "function") {
            unpatches.push(
              after(UserProfileStore, "getUserProfile", (_, res) => stripProfileEffect(res))
            );
          }
          if (typeof UserProfileStore.getGuildMemberProfile === "function") {
            unpatches.push(
              after(UserProfileStore, "getGuildMemberProfile", (_, res) => stripProfileEffect(res))
            );
          }
        }
      },
      stop() {
        while (unpatches.length) {
          const unpatch = unpatches.pop();
          if (typeof unpatch === "function") {
            try {
              unpatch();
            } catch {}
          }
        }
      }
    }
  };
})()

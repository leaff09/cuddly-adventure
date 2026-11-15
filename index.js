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
        const { getModules, filters } = valenced.modules.finders;
        const { after, instead } = valenced.patcher;

        // 1. Masquer les décorations d'avatar dès que le module est chargé
        unpatches.push(
          getModules(filters.withProps("getAvatarDecorationURL"), (decoMod) => {
            if (decoMod && typeof decoMod.getAvatarDecorationURL === "function") {
              unpatches.push(instead(decoMod, "getAvatarDecorationURL", () => null));
            }
          })
        );

        // 2. Masquer les effets de profil dès que UserProfileStore est chargé
        unpatches.push(
          getModules(filters.withProps("getUserProfile"), (UserProfileStore) => {
            if (!UserProfileStore) return;
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
          })
        );
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

(() => {
  const unpatches = [];

  function stripDecoration(obj) {
    if (!obj || typeof obj !== "object") return obj;
    if (obj.avatarDecoration !== undefined) obj.avatarDecoration = null;
    if (obj.avatarDecorationData !== undefined) obj.avatarDecorationData = null;
    return obj;
  }

  return {
    start() {
      const { lookupModule, filters } = valenced.modules.finders;
      const { after, instead } = valenced.patcher;

      // 1. Trouver UserStore via ses méthodes propres
      const userStoreMod = lookupModule(filters.withProps("getUser", "getCurrentUser"));
      const UserStore = userStoreMod?.[0];

      if (UserStore) {
        unpatches.push(after("getUser", UserStore, (_, res) => stripDecoration(res)));
        unpatches.push(after("getCurrentUser", UserStore, (_, res) => stripDecoration(res)));
        if (UserStore.getUsers) {
          unpatches.push(after("getUsers", UserStore, (_, res) => {
            if (res) Object.values(res).forEach(stripDecoration);
            return res;
          }));
        }
      }

      // 2. Trouver GuildMemberStore (décorations par serveur)
      const memberStoreMod = lookupModule(filters.withProps("getMember", "getTrueMember"));
      const GuildMemberStore = memberStoreMod?.[0];

      if (GuildMemberStore) {
        unpatches.push(after("getMember", GuildMemberStore, (_, res) => stripDecoration(res)));
        unpatches.push(after("getTrueMember", GuildMemberStore, (_, res) => stripDecoration(res)));
      }

      // 3. Bloquer la génération des URLs de décoration d'avatar
      const decoUtilsMod = lookupModule(filters.withProps("getAvatarDecorationURL"));
      const AvatarDecoUtils = decoUtilsMod?.[0];

      if (AvatarDecoUtils) {
        unpatches.push(instead("getAvatarDecorationURL", AvatarDecoUtils, () => null));
      }
    },
    stop() {
      while (unpatches.length) {
        const unpatch = unpatches.pop();
        if (typeof unpatch === "function") unpatch();
      }
    }
  };
})()

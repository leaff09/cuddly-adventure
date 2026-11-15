(() => {
  const unpatches = [];

  function stripDecoration(obj) {
    if (!obj || typeof obj !== "object") return obj;
    if ("avatarDecoration" in obj) obj.avatarDecoration = null;
    if ("avatarDecorationData" in obj) obj.avatarDecorationData = null;
    return obj;
  }

  return {
    start() {
      const { findByStoreName, findByProps } = valenced.modules.finders;
      const { after, instead } = valenced.patcher;

      // 1. Nettoyer UserStore (profils globaux)
      const UserStore = findByStoreName("UserStore");
      if (UserStore) {
        if (UserStore.getUser) {
          unpatches.push(after("getUser", UserStore, (_, res) => stripDecoration(res)));
        }
        if (UserStore.getCurrentUser) {
          unpatches.push(after("getCurrentUser", UserStore, (_, res) => stripDecoration(res)));
        }
        if (UserStore.getUsers) {
          unpatches.push(after("getUsers", UserStore, (_, res) => {
            if (res) Object.values(res).forEach(stripDecoration);
            return res;
          }));
        }
      }

      // 2. Nettoyer GuildMemberStore (décorations spécifiques par serveur)
      const GuildMemberStore = findByStoreName("GuildMemberStore");
      if (GuildMemberStore) {
        if (GuildMemberStore.getMember) {
          unpatches.push(after("getMember", GuildMemberStore, (_, res) => stripDecoration(res)));
        }
        if (GuildMemberStore.getTrueMember) {
          unpatches.push(after("getTrueMember", GuildMemberStore, (_, res) => stripDecoration(res)));
        }
      }

      // 3. Bloquer le resolver d'URL des décorations d'avatar
      const AvatarDecoUtils = findByProps("getAvatarDecorationURL");
      if (AvatarDecoUtils && AvatarDecoUtils.getAvatarDecorationURL) {
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

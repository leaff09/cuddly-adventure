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
      const { lookupModule, filters } = valenced.modules.finders;
      const { after, instead } = valenced.patcher;

      // 1. Bloquer getAvatarDecorationURL et makeSource
      const decoRes = lookupModule(filters.withProps("getAvatarDecorationURL"));
      const decoMod = decoRes ? decoRes["0"] : null;

      if (decoMod) {
        if (typeof decoMod.getAvatarDecorationURL === "function") {
          unpatches.push(instead(decoMod, "getAvatarDecorationURL", () => null));
        }
        if (typeof decoMod.makeSource === "function") {
          unpatches.push(
            instead(decoMod, "makeSource", (args, orig) => {
              const url = args ? args["0"] : null;
              if (typeof url === "string" && url.includes("avatar-decoration")) {
                return null;
              }
              return orig.apply(this, args);
            })
          );
        }
      }

      // 2. Nettoyer UserStore (profils globaux)
      const userStoreRes = lookupModule(filters.withProps("getUser", "getCurrentUser"));
      const UserStore = userStoreRes ? userStoreRes["0"] : null;

      if (UserStore) {
        if (typeof UserStore.getUser === "function") {
          unpatches.push(after(UserStore, "getUser", (_, res) => stripDecoration(res)));
        }
        if (typeof UserStore.getCurrentUser === "function") {
          unpatches.push(after(UserStore, "getCurrentUser", (_, res) => stripDecoration(res)));
        }
        if (typeof UserStore.getUsers === "function") {
          unpatches.push(
            after(UserStore, "getUsers", (_, res) => {
              if (res && typeof res === "object") {
                Object.values(res).forEach(stripDecoration);
              }
              return res;
            })
          );
        }
      }

      // 3. Nettoyer GuildMemberStore (décorations par serveur)
      const memberStoreRes = lookupModule(filters.withProps("getMember", "getTrueMember"));
      const GuildMemberStore = memberStoreRes ? memberStoreRes["0"] : null;

      if (GuildMemberStore) {
        if (typeof GuildMemberStore.getMember === "function") {
          unpatches.push(after(GuildMemberStore, "getMember", (_, res) => stripDecoration(res)));
        }
        if (typeof GuildMemberStore.getTrueMember === "function") {
          unpatches.push(after(GuildMemberStore, "getTrueMember", (_, res) => stripDecoration(res)));
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
  };
})()

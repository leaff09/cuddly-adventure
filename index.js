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
      const { getModules, filters } = valenced.modules.finders;
      const { after, instead } = valenced.patcher;

      // 1. Bloquer getAvatarDecorationURL et makeSource (si URL de décoration)
      unpatches.push(
        getModules(filters.withProps("getAvatarDecorationURL"), (mod) => {
          if (!mod) return;

          if (typeof mod.getAvatarDecorationURL === "function") {
            unpatches.push(instead(mod, "getAvatarDecorationURL", () => null));
          }

          if (typeof mod.makeSource === "function") {
            unpatches.push(
              instead(mod, "makeSource", (args, orig) => {
                const url = args?.[0];
                if (typeof url === "string" && url.includes("avatar-decoration")) {
                  return null;
                }
                return orig(...args);
              })
            );
          }
        })
      );

      // 2. Nettoyer UserStore (profils globaux)
      unpatches.push(
        getModules(filters.withProps("getUser", "getCurrentUser"), (store) => {
          if (!store) return;

          if (typeof store.getUser === "function") {
            unpatches.push(after(store, "getUser", (_, res) => stripDecoration(res)));
          }
          if (typeof store.getCurrentUser === "function") {
            unpatches.push(after(store, "getCurrentUser", (_, res) => stripDecoration(res)));
          }
          if (typeof store.getUsers === "function") {
            unpatches.push(
              after(store, "getUsers", (_, res) => {
                if (res && typeof res === "object") {
                  Object.values(res).forEach(stripDecoration);
                }
                return res;
              })
            );
          }
        })
      );

      // 3. Nettoyer GuildMemberStore (décorations spécifiques par serveur)
      unpatches.push(
        getModules(filters.withProps("getMember", "getTrueMember"), (store) => {
          if (!store) return;

          if (typeof store.getMember === "function") {
            unpatches.push(after(store, "getMember", (_, res) => stripDecoration(res)));
          }
          if (typeof store.getTrueMember === "function") {
            unpatches.push(after(store, "getTrueMember", (_, res) => stripDecoration(res)));
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
  };
})()

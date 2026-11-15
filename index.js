(() => {
  const unpatches = [];

  function isDecorationUrl(source) {
    if (!source) return false;
    const uri = typeof source === "string" ? source : source.uri;
    return typeof uri === "string" && uri.includes("avatar-decoration");
  }

  function stripUser(user) {
    if (!user || typeof user !== "object") return user;
    if ("avatarDecoration" in user) user.avatarDecoration = null;
    if ("avatarDecorationData" in user) user.avatarDecorationData = null;
    return user;
  }

  return {
    start() {
      const api = globalThis.valenced || valenced;
      const { getModules, filters } = api.modules.finders;
      const { before, after } = api.patcher;
      let hookedCount = 0;

      // 1. Bloquer les URLs d'images React Native contenant "avatar-decoration"
      unpatches.push(
        getModules(filters.withProps("resolveAssetSource"), (mod) => {
          const RNImage = mod?.default ?? mod;
          if (RNImage?.render) {
            hookedCount++;
            unpatches.push(
              before("render", RNImage, (args) => {
                if (args && isDecorationUrl(args.source)) {
                  args = { ...args, source: null };
                }
              })
            );
          }
        })
      );

      // 2. Bloquer FastImage (décorations animées APNG/WebP)
      unpatches.push(
        getModules(filters.withProps("preload", "clearMemoryCache"), (mod) => {
          const FastImage = mod?.default ?? mod;
          if (FastImage?.render) {
            hookedCount++;
            unpatches.push(
              before("render", FastImage, (args) => {
                if (args && isDecorationUrl(args.source)) {
                  args = { ...args, source: null };
                }
              })
            );
          }
        })
      );

      // 3. Nettoyer UserStore à la volée
      unpatches.push(
        getModules(filters.withProps("getUser", "getCurrentUser"), (mod) => {
          const store = mod?.default ?? mod;
          if (!store) return;
          const target = typeof store.getUser === "function" ? store : Object.getPrototypeOf(store);
          if (target?.getUser) {
            hookedCount++;
            unpatches.push(after("getUser", target, (_, res) => stripUser(res)));
          }
          if (target?.getCurrentUser) {
            unpatches.push(after("getCurrentUser", target, (_, res) => stripUser(res)));
          }
        })
      );

      console.log(`[NoDecorations] Démarré avec succès (${hookedCount} hooks actifs)`);
    },
    stop() {
      while (unpatches.length) {
        const fn = unpatches.pop();
        if (typeof fn === "function") {
          try { fn(); } catch {}
        }
      }
    }
  };
})()
                                 

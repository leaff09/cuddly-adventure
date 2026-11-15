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
      try {
        const root = typeof valenced !== "undefined" ? valenced : globalThis.valenced;
        console.log("[NoDeco] Clés racine valenced :", root ? Object.keys(root) : "undefined");
        if (root?.api) {
          console.log("[NoDeco] Clés valenced.api :", Object.keys(root.api));
        }

        // Détecter automatiquement où se trouvent modules et patcher (root ou root.api)
        const api = root?.modules ? root : root?.api;
        if (!api || !api.modules || !api.patcher) {
          console.log("[NoDeco] API modules/patcher introuvable, structure :", JSON.stringify(Object.keys(root || {})));
          return;
        }

        const finders = api.modules.finders || api.modules;
        console.log("[NoDeco] Clés finders :", Object.keys(finders));

        const getModules = finders.getModules;
        const filters = finders.filters;
        const { before, after } = api.patcher;

        if (!getModules || !filters) {
          console.log("[NoDeco] getModules ou filters manquant");
          return;
        }

        let count = 0;

        // 1. Bloquer les URLs d'images React Native contenant "avatar-decoration"
        unpatches.push(
          getModules(filters.withProps("resolveAssetSource"), (mod) => {
            const RNImage = mod?.default ?? mod;
            if (RNImage?.render) {
              count++;
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

        // 2. Bloquer FastImage
        unpatches.push(
          getModules(filters.withProps("preload", "clearMemoryCache"), (mod) => {
            const FastImage = mod?.default ?? mod;
            if (FastImage?.render) {
              count++;
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

        // 3. Nettoyer UserStore
        unpatches.push(
          getModules(filters.withProps("getUser", "getCurrentUser"), (mod) => {
            const store = mod?.default ?? mod;
            if (!store) return;
            const target = typeof store.getUser === "function" ? store : Object.getPrototypeOf(store);
            if (target?.getUser) {
              count++;
              unpatches.push(after("getUser", target, (_, res) => stripUser(res)));
            }
            if (target?.getCurrentUser) {
              unpatches.push(after("getCurrentUser", target, (_, res) => stripUser(res)));
            }
          })
        );

        console.log("[NoDeco] Hooks installés :", count);
      } catch (err) {
        console.error("[NoDeco] Erreur capturée :", err?.message || err, err?.stack);
      }
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

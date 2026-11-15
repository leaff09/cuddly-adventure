(() => {
  const unpatches = [];

  function isDecorationUrl(source) {
    if (!source) return false;
    const uri = typeof source === "string" ? source : source.uri;
    return typeof uri === "string" && uri.includes("avatar-decoration-presets");
  }

  return {
    start() {
      const { getModules, filters } = valenced.modules.finders;
      const { before, instead } = valenced.patcher;

      // 1. Intercepter React Native Image (render / resolveAssetSource)
      unpatches.push(
        getModules(filters.withProps("resolveAssetSource"), (mod) => {
          const RNImage = mod?.default ?? mod;
          if (!RNImage) return;

          if (RNImage.render) {
            unpatches.push(
              before("render", RNImage, (args) => {
                if (args[0] && isDecorationUrl(args[0].source)) {
                  args[0] = { ...args[0], source: null };
                }
              })
            );
          }

          if (RNImage.resolveAssetSource) {
            unpatches.push(
              instead("resolveAssetSource", RNImage, (args, orig) => {
                if (isDecorationUrl(args[0])) return null;
                return orig(...args);
              })
            );
          }
        })
      );

      // 2. Intercepter FastImage (souvent utilisé par Discord Mobile pour les avatars/décorations)
      unpatches.push(
        getModules(filters.withProps("preload", "clearMemoryCache"), (mod) => {
          const FastImage = mod?.default ?? mod;
          if (!FastImage) return;

          if (FastImage.render) {
            unpatches.push(
              before("render", FastImage, (args) => {
                if (args[0] && isDecorationUrl(args[0].source)) {
                  args[0] = { ...args[0], source: null };
                }
              })
            );
          }
        })
      );

      // 3. Intercepter les constructeurs d'URL d'assets Discord
      unpatches.push(
        getModules(filters.withProps("getAvatarDecorationURL"), (mod) => {
          const utils = mod?.default ?? mod;
          if (utils?.getAvatarDecorationURL) {
            unpatches.push(instead("getAvatarDecorationURL", utils, () => null));
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

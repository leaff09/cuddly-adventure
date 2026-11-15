(() => {
  const unpatches = [];

  return {
    default: {
      start() {
        const { lookupModule, filters } = valenced.modules.finders;
        const { instead } = valenced.patcher;

        // Bloquer UNIQUEMENT la génération d'URL des décorations d'avatar
        const decoRes = lookupModule(filters.withProps("getAvatarDecorationURL"));
        const decoMod = decoRes ? decoRes["0"] : null;

        if (decoMod && typeof decoMod.getAvatarDecorationURL === "function") {
          unpatches.push(instead(decoMod, "getAvatarDecorationURL", () => null));
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

(() => {
  const { lookupModule, lookupModules, filters } = valenced.modules.finders;
  const { after, before, instead } = valenced.patcher;

  function strip(u) {
    if (!u || typeof u !== "object") return u;
    if (u.avatarDecoration !== undefined) u.avatarDecoration = null;
    if (u.avatarDecorationData !== undefined) u.avatarDecorationData = null;
    return u;
  }

  // 1. Nettoyer UserStore (via valenced.discord.common ou lookupModule)
  const UserStore = valenced.discord.common?.UserStore || lookupModule(filters.withProps("getUser", "getCurrentUser"));
  if (UserStore) {
    if (UserStore.getUser) after("getUser", UserStore, (_, res) => strip(res));
    if (UserStore.getCurrentUser) after("getCurrentUser", UserStore, (_, res) => strip(res));
  }

  // 2. Bloquer getAvatarDecorationURL (confirmé trouvé avec decoFound: true)
  const decoMod = lookupModule(filters.withProps("getAvatarDecorationURL"));
  if (decoMod?.getAvatarDecorationURL) {
    instead("getAvatarDecorationURL", decoMod, () => null);
  }

  // 3. Bloquer React.createElement quand une image pointe vers avatar-decoration
  if (valenced.react?.createElement) {
    before("createElement", valenced.react, (args) => {
      const props = args[1];
      if (!props || typeof props !== "object") return;
      const uri = typeof props.source === "string" ? props.source : props.source?.uri;
      if (typeof uri === "string" && uri.includes("avatar-decoration")) {
        props.source = null;
        props.style = { width: 0, height: 0, opacity: 0 };
      }
    });
  }

  return "Patch appliqué avec succès !";
})()

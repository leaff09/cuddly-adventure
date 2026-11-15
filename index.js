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
      const { getModules, filters } = valenced.modules.finders;
      const { after, instead } = valenced.patcher;

      // 1. Intercept UserStore (handles both own properties and prototype methods)
      unpatches.push(
        getModules(filters.withProps("getUser", "getCurrentUser"), (mod) => {
          const store = mod?.default ?? mod;
          if (!store) return;

          const target = typeof store.getUser === "function" ? store : Object.getPrototypeOf(store);
          if (target?.getUser) {
            unpatches.push(after("getUser", target, (_, res) => stripDecoration(res)));
          }
          if (target?.getCurrentUser) {
            unpatches.push(after("getCurrentUser", target, (_, res) => stripDecoration(res)));
          }
          if (target?.getUsers) {
            unpatches.push(after("getUsers", target, (_, res) => {
              if (res && typeof res === "object") {
                Object.values(res).forEach(stripDecoration);
              }
              return res;
            }));
          }
        })
      );

      // 2. Intercept GuildMemberStore (server-specific decorations)
      unpatches.push(
        getModules(filters.withProps("getMember", "getTrueMember"), (mod) => {
          const store = mod?.default ?? mod;
          if (!store) return;

          const target = typeof store.getMember === "function" ? store : Object.getPrototypeOf(store);
          if (target?.getMember) {
            unpatches.push(after("getMember", target, (_, res) => stripDecoration(res)));
          }
          if (target?.getTrueMember) {
            unpatches.push(after("getTrueMember", target, (_, res) => stripDecoration(res)));
          }
        })
      );

      // 3. Block Avatar Decoration URL builders & hooks
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

(() => {
  let unpatchGetUser;
  let unpatchGetCurrentUser;

  function stripDecoration(user) {
    if (!user) return user;
    if (user.avatarDecoration !== undefined) {
      user.avatarDecoration = null;
    }
    if (user.avatarDecorationData !== undefined) {
      user.avatarDecorationData = null;
    }
    return user;
  }

  return {
    start() {
      const UserStore = valenced.modules.finders.findByStoreName("UserStore");
      if (!UserStore) return;

      if (UserStore.getUser) {
        unpatchGetUser = valenced.patcher.after("getUser", UserStore, (_, res) => stripDecoration(res));
      }
      if (UserStore.getCurrentUser) {
        unpatchGetCurrentUser = valenced.patcher.after("getCurrentUser", UserStore, (_, res) => stripDecoration(res));
      }
    },
    stop() {
      if (unpatchGetUser) unpatchGetUser();
      if (unpatchGetCurrentUser) unpatchGetCurrentUser();
    }
  };
})()

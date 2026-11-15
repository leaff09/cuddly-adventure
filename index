const { findByStoreName } = vendetta.metro;
const { after } = vendetta.patcher;

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

export default {
  onLoad() {
    const UserStore = findByStoreName("UserStore");
    if (!UserStore) return;

    if (UserStore.getUser) {
      unpatchGetUser = after("getUser", UserStore, (_, res) => stripDecoration(res));
    }
    if (UserStore.getCurrentUser) {
      unpatchGetCurrentUser = after("getCurrentUser", UserStore, (_, res) => stripDecoration(res));
    }
  },
  onUnload() {
    if (unpatchGetUser) unpatchGetUser();
    if (unpatchGetCurrentUser) unpatchGetCurrentUser();
  }
};

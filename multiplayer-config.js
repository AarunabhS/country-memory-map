const hostedFriendsApi = 'https://country-memory-friends.arunabh007.chatgpt.site';
const hostedFriendsSite = 'https://www.arunabhosom.com/country-memory-map/?game=multiplayer';
const localFriendsApis = new Set([
  'http://127.0.0.1:8787',
  'http://localhost:8787',
  'http://[::1]:8787'
]);
const requestedFriendsApi = String(window.COUNTRY_MEMORY_FRIENDS_API_OVERRIDE || '').replace(/\/+$/, '');
const localFriendsHost = ['127.0.0.1', 'localhost', '[::1]'].includes(location.hostname);
const localFriendsApi = localFriendsHost && localFriendsApis.has(requestedFriendsApi) ? requestedFriendsApi : null;

// Shareable rooms always use the public persistent database. Developers can opt
// into a loopback service explicitly without making device-only rooms by accident.
window.FRIENDS_API = localFriendsApi || hostedFriendsApi;
window.FRIENDS_API_FALLBACK = localFriendsApi ? hostedFriendsApi : null;
window.FRIENDS_SHARE_URL = localFriendsApi ? null : hostedFriendsSite;
const defaultCountryMemoryFlags = Object.freeze({
  PLAYER_PROFILES_ENABLED: true,
  PLAYER_STATS_ENABLED: true,
  REMOTE_PROFILE_SYNC_ENABLED: false,
  ANSWER_FEEDBACK_ENABLED: true
});
window.COUNTRY_MEMORY_FLAGS = Object.freeze({
  ...defaultCountryMemoryFlags,
  ...(window.COUNTRY_MEMORY_FLAG_OVERRIDES || {})
});

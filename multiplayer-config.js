const hostedFriendsApi = 'https://country-memory-friends.arunabh007.chatgpt.site';
const localFriendsApi = 'http://127.0.0.1:8787';
const localFriendsHost = ['127.0.0.1', 'localhost', '[::1]'].includes(location.hostname);
window.FRIENDS_API = localFriendsHost ? localFriendsApi : hostedFriendsApi;
window.FRIENDS_API_FALLBACK = localFriendsHost ? hostedFriendsApi : null;
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

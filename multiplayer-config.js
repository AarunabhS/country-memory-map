window.FRIENDS_API = ['127.0.0.1','localhost'].includes(location.hostname)
  ? 'http://127.0.0.1:8787' : 'https://country-memory-friends.arunabh007.chatgpt.site';
const defaultCountryMemoryFlags = Object.freeze({
  PLAYER_PROFILES_ENABLED: true,
  PLAYER_STATS_ENABLED: true,
  ANSWER_FEEDBACK_ENABLED: true
});
window.COUNTRY_MEMORY_FLAGS = Object.freeze({
  ...defaultCountryMemoryFlags,
  ...(window.COUNTRY_MEMORY_FLAG_OVERRIDES || {})
});

// Backend service URLs, sourced from environment variables (.env.local).
// See .env.example for the required variable names.

export const BACKEND_URLS = {
  DB_CHAT: process.env.NEXT_PUBLIC_DB_CHAT_URL,
  SUMMARIZER: process.env.NEXT_PUBLIC_SUMMARIZER_URL,
  FLOWCHART: process.env.NEXT_PUBLIC_FLOWCHART_URL,
  COURSE_GUIDANCE: process.env.NEXT_PUBLIC_COURSE_GUIDANCE_URL,
  PERSONA_FLOW: process.env.NEXT_PUBLIC_PERSONA_FLOW_URL,
  MAIN_APP: process.env.NEXT_PUBLIC_MAIN_APP_URL,
};

// Warn at load time about any missing URLs so failures are easy to trace
// back to a missing .env.local entry instead of a confusing fetch error.
if (process.env.NODE_ENV !== 'production') {
  const missing = Object.entries(BACKEND_URLS)
    .filter(([, url]) => !url)
    .map(([key]) => `NEXT_PUBLIC_${key}_URL`);
  if (missing.length > 0) {
    console.warn(
      `[backend_urls] Missing environment variables: ${missing.join(', ')}. ` +
        'Copy .env.example to .env.local and fill in the values.'
    );
  }
}

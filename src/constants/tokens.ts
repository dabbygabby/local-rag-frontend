/**
 * Token limits for the RAG system
 * 
 * These constants reflect the backend capabilities after the recent update.
 * The Groq gpt-oss-120b model now supports significantly higher token limits.
 */

/** Maximum tokens the model can emit in a single completion */
export const MAX_COMPLETION_TOKENS = 65_536;

/** Maximum total tokens in the prompt + completion window */
export const MAX_TOTAL_TOKENS = 131_072;

/** Minimum tokens allowed for completions */
export const MIN_COMPLETION_TOKENS = 1;

/** Default step size for token sliders */
export const TOKEN_STEP_SIZE = 256;

/** Default token values */
export const DEFAULT_MAX_TOKENS = 1000;

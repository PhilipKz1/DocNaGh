/**
 * Hard ceiling on how long a request's upload link can stay alive, measured
 * from when the request was created (not from "now" on each extension - see
 * extendRequestExpiry). Was 14 days; tightened to 7 to reduce how long a
 * live, unguessable upload link exists for, while still covering realistic
 * delays (a weekend, travel to another facility, a records office only open
 * certain days). The actual default a patient gets is much shorter -
 * DOCUMENT_REQUEST_LINK_TTL_HOURS (72h) - this only bounds how far a
 * provider can manually extend it.
 */
export const MAX_REQUEST_LIFETIME_DAYS = 7;

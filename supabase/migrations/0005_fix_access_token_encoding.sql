-- requests.access_token's default used encode(..., 'base64url'), which
-- this project's Postgres version doesn't support ("unrecognized encoding:
-- base64url") - it errored on every attempt to create a request. Hex is
-- universally supported, fully URL-safe with no padding/character
-- translation needed, and equally unguessable (32 random bytes either
-- way). Nothing in the app assumes the token's specific format - it's
-- just looked up by exact string match - so this is a safe drop-in swap.
alter table requests
  alter column access_token set default encode(gen_random_bytes(32), 'hex');

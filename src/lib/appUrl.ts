/**
 * The app's own public URL, used to build every link that leaves the
 * server: invite emails, password-reset emails, patient upload links, and
 * upload-received notifications. On Vercel production this throws instead
 * of silently falling back to localhost - a broken invite link landing in
 * a real clinic's inbox is a far worse failure than a loud error in the
 * logs the moment it happens. (This is exactly what went out to
 * philip.kelli@outlook.com before NEXT_PUBLIC_APP_URL was set correctly.)
 */
export function getAppUrl(): string {
  const url = process.env.NEXT_PUBLIC_APP_URL;

  if (process.env.VERCEL_ENV === "production") {
    if (!url || !url.startsWith("https://") || url.includes("localhost")) {
      throw new Error(
        `NEXT_PUBLIC_APP_URL is misconfigured in production: "${url ?? "(unset)"}". Fix it in Vercel's Environment Variables and redeploy.`
      );
    }
  }

  return url ?? "http://localhost:3000";
}

export async function redirectSystemPath({
  path,
}: {
  path: string;
  initial: boolean;
}) {
  try {
    if (path.includes("sso-callback") || path.includes("oauth")) {
      return "/(auth)/sso-callback";
    }
    return path;
  } catch {
    return "/";
  }
}

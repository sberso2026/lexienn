export type AuthBootState = "checking" | "local_guest" | "authenticated" | "unauthenticated";

export type AppBootResolution = {
  auth: AuthBootState;
  showSignIn: boolean;
};

/**
 * Lexienn is local-first; dictionary/translator work without cloud sign-in.
 * Sign-in would only apply to future cloud-sync features, not app startup.
 */
export function resolveAppBootState(): AppBootResolution {
  if (typeof window === "undefined") {
    return { auth: "checking", showSignIn: false };
  }

  return { auth: "local_guest", showSignIn: false };
}

export function shouldRenderSignInPanel(resolution: AppBootResolution): boolean {
  return resolution.showSignIn && resolution.auth === "unauthenticated";
}

export function isAppBootChecking(resolution: AppBootResolution): boolean {
  return resolution.auth === "checking";
}

export const HOME_ROUTE = "/dictionary";

/**
 * Ensures only one microphone capture session is active at a time
 * across Conversation Person A/B and other voice inputs.
 */
type MicSessionOwner = {
  ownerId: string;
  release: () => void;
};

let activeOwner: MicSessionOwner | null = null;

export function getActiveMicSessionOwnerId(): string | null {
  return activeOwner?.ownerId ?? null;
}

export function isMicSessionOwnedBy(ownerId: string): boolean {
  return activeOwner?.ownerId === ownerId;
}

/**
 * Acquire exclusive mic ownership. If another owner holds the mic,
 * its release() is invoked first (must stop tracks/recognition).
 */
export function acquireMicSession(ownerId: string, release: () => void): void {
  if (activeOwner && activeOwner.ownerId !== ownerId) {
    try {
      activeOwner.release();
    } catch {
      // ignore release failures from prior owner
    }
  }
  activeOwner = { ownerId, release };
}

export function releaseMicSession(ownerId: string): void {
  if (activeOwner?.ownerId === ownerId) {
    activeOwner = null;
  }
}

/** Test helper */
export function __resetMicSessionCoordinatorForTests(): void {
  activeOwner = null;
}

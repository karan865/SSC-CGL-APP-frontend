/**
 * Provides a clean, lightweight guest identity for personalized tracking
 * without requiring a heavy authentication system.
 */
let memoryGuestId = 'guest_aspirant_cgl';

export const getGuestId = (): string => {
  return memoryGuestId;
};

export const setGuestId = (newId: string): void => {
  if (newId && newId.trim()) {
    memoryGuestId = newId.trim();
  }
};

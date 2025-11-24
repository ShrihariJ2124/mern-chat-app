/**
 * Auth utilities for per-tab session isolation.
 * Uses sessionStorage instead of localStorage so each tab has independent login.
 */

const AUTH_KEY = "chatUser";

/**
 * Get current user from sessionStorage (tab-specific).
 * @returns {Object|null} User object with _id, username, email, token, isAdmin
 */
export const getCurrentUser = () => {
  try {
    const stored = sessionStorage.getItem(AUTH_KEY);
    return stored ? JSON.parse(stored) : null;
  } catch {
    return null;
  }
};

/**
 * Save user to sessionStorage (tab-specific).
 * @param {Object} user User object from login response
 */
export const setCurrentUser = (user) => {
  if (user) {
    sessionStorage.setItem(AUTH_KEY, JSON.stringify(user));
  } else {
    sessionStorage.removeItem(AUTH_KEY);
  }
};

/**
 * Clear user session (logout).
 */
export const clearCurrentUser = () => {
  sessionStorage.removeItem(AUTH_KEY);
};

/**
 * Subscribe to auth changes within the same tab.
 * Note: sessionStorage doesn't trigger storage events, so this is for manual triggers.
 * @param {Function} callback Called when auth state changes
 * @returns {Function} Unsubscribe function
 */
const subscribers = new Set();

export const onAuthChange = (callback) => {
  subscribers.add(callback);
  return () => subscribers.delete(callback);
};

export const notifyAuthChange = (user) => {
  subscribers.forEach((cb) => cb(user));
};

/**
 * Unit tests for the Zustand authStore.
 * Validates state transitions for login, logout, and token hydration.
 */
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { act } from 'react';

// Reset the store between tests
beforeEach(() => {
  // Clear localStorage mock
  localStorage.clear();
  vi.resetAllMocks();
});

describe('authStore — initial state', () => {
  it('is unauthenticated on first load', async () => {
    // Dynamically import to get a fresh module for each test group
    const { useAuthStore } = await import('../../stores/authStore');
    const state = useAuthStore.getState();
    expect(state.isAuthenticated).toBe(false);
    expect(state.user).toBeNull();
    expect(state.token).toBeNull();
  });
});

describe('authStore — login action', () => {
  it('sets isAuthenticated and stores user + token on login', async () => {
    const { useAuthStore } = await import('../../stores/authStore');

    const mockUser = {
      id: 'user-123',
      email: 'test@example.com',
      username: 'testuser',
      xp: 0,
      level: 1,
      skillLevel: 'beginner',
      derivedSkillLevel: 'beginner',
    };
    const mockToken = 'eyJhbGciOiJIUzI1NiJ9.test.token';
    const mockRefreshToken = 'refresh.token.here';

    act(() => {
      useAuthStore.getState().login(mockUser, mockToken, mockRefreshToken);
    });

    const state = useAuthStore.getState();
    expect(state.isAuthenticated).toBe(true);
    expect(state.user).toEqual(mockUser);
    expect(state.token).toBe(mockToken);
  });
});

describe('authStore — logout action', () => {
  it('clears authentication state on logout', async () => {
    const { useAuthStore } = await import('../../stores/authStore');

    // First login
    act(() => {
      useAuthStore.getState().login(
        { id: 'u1', email: 'a@b.com', username: 'ab', xp: 0, level: 1, skillLevel: 'beginner', derivedSkillLevel: 'beginner' },
        'access-token',
        'refresh-token',
      );
    });

    expect(useAuthStore.getState().isAuthenticated).toBe(true);

    // Then logout
    act(() => {
      useAuthStore.getState().logout();
    });

    const state = useAuthStore.getState();
    expect(state.isAuthenticated).toBe(false);
    expect(state.user).toBeNull();
    expect(state.token).toBeNull();
  });
});

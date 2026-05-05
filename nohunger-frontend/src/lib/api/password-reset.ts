/**
 * Password Reset API functions
 * Handles forgot password and password reset flows
 */
import { apiFetch } from './client';

const BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api';

export interface ForgotPasswordResponse {
  message: string;
  resetToken?: string; // Only in development
  resetLink?: string; // Only in development
  expiresIn?: string;
  allowDirectReset?: boolean; // Flag to indicate password can be set immediately
}

export interface VerifyTokenResponse {
  message: string;
  userId: string;
  email: string;
}

export interface ResetPasswordResponse {
  message: string;
}

/**
 * Request password reset (forgot password flow)
 * @param email - User's email address
 * @param securityQuestion - User's security question
 * @param securityAnswer - User's security answer
 * @returns Response with reset link information
 */
export async function requestPasswordReset(
  email: string,
  securityQuestion: string,
  securityAnswer: string
): Promise<ForgotPasswordResponse | null> {
  try {
    const response = await apiFetch<ForgotPasswordResponse>(`${BASE_URL}/auth/forgot-password`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, securityQuestion, securityAnswer }),
    });
    return response;
  } catch (error) {
    console.error('Password reset request failed:', error);
    throw error;
  }
}

/**
 * Verify a password reset token before allowing password change
 * @param token - Reset token from URL
 * @returns Response with user info if token is valid
 */
export async function verifyResetToken(token: string): Promise<VerifyTokenResponse | null> {
  try {
    const response = await apiFetch<VerifyTokenResponse>(
      `${BASE_URL}/auth/verify-reset-token`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token }),
      }
    );
    return response;
  } catch (error) {
    console.error('Token verification failed:', error);
    throw error;
  }
}

/**
 * Reset password with new password and token
 * @param token - Reset token
 * @param password - New password
 * @param confirmPassword - Confirmation of new password
 * @returns Response confirming password reset
 */
export async function resetPassword(
  token: string,
  password: string,
  confirmPassword: string
): Promise<ResetPasswordResponse | null> {
  try {
    const response = await apiFetch<ResetPasswordResponse>(`${BASE_URL}/auth/reset-password`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        token,
        password,
        confirmPassword,
      }),
    });
    return response;
  } catch (error) {
    console.error('Password reset failed:', error);
    throw error;
  }
}

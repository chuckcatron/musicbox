'use client';

import {
  createContext,
  useEffect,
  useState,
  useCallback,
  type ReactNode,
} from 'react';
import {
  signIn,
  signUp,
  signOut,
  getCurrentUser,
  fetchAuthSession,
  confirmSignUp,
} from 'aws-amplify/auth';
import { configureCognito } from '@/lib/cognito';

interface AuthUser {
  userId: string;
  email: string;
}

interface AuthContextType {
  user: AuthUser | null;
  isLoading: boolean;
  signIn: (email: string, password: string) => Promise<void>;
  signUp: (email: string, password: string) => Promise<{ requiresConfirmation: boolean }>;
  confirmSignUp: (email: string, code: string) => Promise<void>;
  signOut: () => Promise<void>;
  getAccessToken: () => Promise<string | null>;
}

export const AuthContext = createContext<AuthContextType | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    configureCognito();
    checkUser();
  }, []);

  async function checkUser() {
    try {
      const currentUser = await getCurrentUser();
      const session = await fetchAuthSession();
      const idToken = session.tokens?.idToken;

      if (currentUser && idToken) {
        setUser({
          userId: currentUser.userId,
          email: idToken.payload.email as string,
        });
      }
    } catch {
      setUser(null);
    } finally {
      setIsLoading(false);
    }
  }

  const handleSignIn = async (email: string, password: string) => {
    const result = await signIn({ username: email, password });

    if (result.isSignedIn) {
      await checkUser();
    } else if (result.nextStep.signInStep === 'CONFIRM_SIGN_UP') {
      throw new Error('CONFIRM_SIGN_UP_REQUIRED');
    }
  };

  const handleSignUp = async (email: string, password: string) => {
    const result = await signUp({
      username: email,
      password,
      options: {
        userAttributes: {
          email,
        },
      },
    });

    return {
      requiresConfirmation: !result.isSignUpComplete,
    };
  };

  const handleConfirmSignUp = async (email: string, code: string) => {
    await confirmSignUp({ username: email, confirmationCode: code });
  };

  const handleSignOut = async () => {
    await signOut();
    setUser(null);
  };

  const getAccessToken = useCallback(async (): Promise<string | null> => {
    try {
      const session = await fetchAuthSession();
      return session.tokens?.idToken?.toString() || null;
    } catch {
      return null;
    }
  }, []);

  return (
    <AuthContext.Provider
      value={{
        user,
        isLoading,
        signIn: handleSignIn,
        signUp: handleSignUp,
        confirmSignUp: handleConfirmSignUp,
        signOut: handleSignOut,
        getAccessToken,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

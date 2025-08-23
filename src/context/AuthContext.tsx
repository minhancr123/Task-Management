"use client";
import { Profile, signIn, signOut, signUp, updateProfile } from "@/lib/auth";
import { supabase } from "@/lib/supabase";
import { User } from "@supabase/supabase-js";
import { createContext, useEffect, useState, useCallback, useMemo } from "react";

export type AuthContextType = {
  user: User | null;
  profile: Profile | null;
  loading: boolean;
  signUp: (email: string, password: string, fullname: string) => Promise<any>;
  signIn: (email: string, password: string) => Promise<any>;
  signOut: () => Promise<any>;
  updateProfile: (profileData: Partial<Profile>) => Promise<any>;
};

export const AuthContext = createContext<AuthContextType | null>(null);

export default function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState<boolean>(true);

  // Memoized fetch profile function to prevent unnecessary re-renders
  const fetchProfile = useCallback(async (userId: string) => {
    try {
      const {
        data: { user: currentUser },
      } = await supabase.auth.getUser();

      if (!currentUser) {
        setProfile(null);
        return;
      }

      const { data, error } = await supabase
        .from("profiles")
        .select("*")
        .eq("id", userId)
        .single();

      if (error) throw error;
      setProfile(data);
    } catch (err) {
      console.error("Error fetching profile:", err);
      setProfile(null);
    }
  }, []);

  useEffect(() => {
    let isMounted = true; // Prevent state updates if component unmounts

    const getInitSession = async () => {
      try {
        const {
          data: { session },
          error,
        } = await supabase.auth.getSession();

        if (error) throw error;

        if (isMounted) {
          setUser(session?.user || null);
          if (session?.user) {
            await fetchProfile(session.user.id);
          }
        }
      } catch (err) {
        console.error("Error getting session:", err);
        if (isMounted) {
          setUser(null);
          setProfile(null);
        }
      } finally {
        if (isMounted) {
          setLoading(false); // luôn chạy dù thành công hay lỗi
        }
      }
    };

    getInitSession();

    // Listen for auth state changes
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (_event, session) => {
      try {
        if (isMounted) {
          setUser(session?.user || null);
          if (session?.user) {
            await fetchProfile(session.user.id);
          } else {
            setProfile(null);
          }
        }
      } catch (err) {
        console.error("Error handling auth state change:", err);
        if (isMounted) {
          setProfile(null);
        }
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    });

    return () => {
      isMounted = false;
      subscription.unsubscribe();
    };
  }, [fetchProfile]);

  // Memoized update profile handler
  const handleUpdateProfile = useCallback(async (profileData: Partial<Profile>) => {
    if (!user) return { error: { message: "User not authenticated" } };

    const result = await updateProfile(user.id, profileData);
    if (result.data) {
      setProfile(result.data);
    }
    return result;
  }, [user]);

  // Memoize context value to prevent unnecessary re-renders
  const value: AuthContextType = useMemo(() => ({
    user,
    profile,
    loading,
    signIn,
    signUp,
    signOut,
    updateProfile: handleUpdateProfile,
  }), [user, profile, loading, handleUpdateProfile]);

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

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

  // Simplified fetchProfile: no extra auth.getUser round-trip
  const fetchProfile = useCallback(async (userId: string) => {
    try {
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
    let isMounted = true;

    const getInitSession = async () => {
      try {
        const { data: { session }, error } = await supabase.auth.getSession();
        if (error) throw error;
        if (!isMounted) return;
        setUser(session?.user || null);
        // Do not block UI while fetching profile
        setLoading(false);
        if (session?.user) {
          fetchProfile(session.user.id); // fire & forget
        } else {
          setProfile(null);
        }
      } catch (err) {
        console.error("Error getting session:", err);
        if (isMounted) {
          setUser(null);
          setProfile(null);
          setLoading(false);
        }
      }
    };

    getInitSession();

    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (_event, session) => {
      if (!isMounted) return;
      setUser(session?.user || null);
      // Release loading immediately, profile fetch async
      setLoading(false);
      if (session?.user) {
        fetchProfile(session.user.id);
      } else {
        setProfile(null);
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

"use client";
import { Profile, signIn, signOut, signUp, updateProfile } from "@/lib/auth";
import { supabase } from "@/lib/supabase";
import { User } from "@supabase/supabase-js";
import { createContext, useEffect, useState } from "react";

export type AuthContextType = {
  user: User | null;
  profile: Profile | null;
  loading: boolean;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  signUp: (email: string, password: string, fullname: string) => Promise<any>;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  signIn: (email: string, password: string) => Promise<any>;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  signOut: () => Promise<any>;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  updateProfile: (profileData: Partial<Profile>) => Promise<any>;
};

export const AuthContext = createContext<AuthContextType | null>(null);

export default function AuthProvider({ children }: { children: React.ReactNode }) {

const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState<boolean>(true);

  useEffect(() => {
    const getInitSession = async () => {
      const {
        data: { session },
      } = await supabase.auth.getSession();
      setUser(session?.user || null);
      if (session?.user) {
        await fetchProfile(session.user.id);
      }
      setLoading(false);
    };

    getInitSession();

    //Listen for auth state changes
    const {data : {subscription}} = supabase.auth.onAuthStateChange(async (event , session) =>{
        setUser(session?.user || null);
        if(session?.user){
          await fetchProfile(session.user.id);
        }
        else{
          setProfile(null);
        }

        setLoading(false);

      })
      return () => subscription.unsubscribe();
    }, []);

  const fetchProfile = async (userId: string) => {
    try {
      const { data, error } = await supabase
        .from("profiles")
        .select("*")
        .eq("id", userId)
        .single();

      if (error) throw error;
      setProfile(data as Profile);
    } catch (error) {
      console.error("Error fetching profile:", error);
      setProfile(null);
    }
  };

  const handleUpdateProfile = async (profileData: Partial<Profile>) => {
    if (!user) return { error: { message: "User not authenticated" } };
    
    const result = await updateProfile(user.id, profileData);
    if (result.data) {
      setProfile(result.data);
    }
    return result;
  };

  const value = { user, profile, loading, signIn, signUp, signOut, updateProfile: handleUpdateProfile };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;

}
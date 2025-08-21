import { supabase } from "./supabase"
export interface Profile {
    id: string
    email: string | null
    full_name: string | null
    avatar_url: string | null
    phone: string | null
    location: string | null
    bio: string | null
    role: "user" | "admin"
    created_at: string
    updated_at: string
}


export const signUp  = async(email : string , password : string , fullname :string) => 
{
    try {
        const {data , error} = await supabase.auth.signUp({
        email,
        password,
        options :{
            data : {
                full_name : fullname
            }
        }
    })
    console.log(data, error);
    return {data, error};
    } catch (error) {
        console.error("Error during sign up:", error);
        return { error: { message: "An unexpected error occurred. Please try again later." } };
        
    }
    
}


export const signIn = async(email : string , password : string) => 
{
    const {data , error} = await supabase.auth.signInWithPassword({
        email,
        password
    })

    return {data, error};
}

export const  signOut = async()=>
{
    const {error} = await supabase.auth.signOut();
    console.log("Sign out error:", error);
    return {error};
}

export const getCurrentUser = async() => 
{
    const {data : {user} ,error} = await supabase.auth.getUser();
    return {user , error};
}

export const updateProfile = async(userId: string, profileData: Partial<Profile>) => {
    try {
        const { data, error } = await supabase
            .from("profiles")
            .update({
                full_name: profileData.full_name,
                phone: profileData.phone,
                location: profileData.location,
                bio: profileData.bio,
                avatar_url: profileData.avatar_url,
                updated_at: new Date().toISOString()
            })
            .eq("id", userId)
            .select()
            .single();

        if (error) throw error;
        return { data, error: null };
    } catch (error) {
        console.error("Error updating profile:", error);
        return { data: null, error };
    }
}




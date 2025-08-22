import { supabase } from "@/lib/supabase";
import { useRouter } from "next/navigation";
import { useEffect } from "react";

export function useAuthDirect(){
    const router = useRouter();

    useEffect(() => {
        const checkSession = async () => {

            const {data : {session}} = await supabase.auth.getSession();
            if(!session){
                router.replace("/auth");
                return;
            }

            const now = Math.floor(Date.now() / 1000); // giây

            if(session.expires_at && session.expires_at < now){
                await supabase.auth.signOut();
                router.replace("/auth");
                return;
            }
        }
        checkSession();
    }, [router]);
}
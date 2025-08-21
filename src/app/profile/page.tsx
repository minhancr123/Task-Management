"use client";
import { useAuth } from "@/hooks/use-auth";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useState, useRef } from "react";
import { toast } from "sonner";
import { ArrowLeft, Upload, Camera } from "lucide-react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";

const profileSchema = z.object({
  full_name: z.string().min(1, "Name is required"),
});

type ProfileFormData = z.infer<typeof profileSchema>;

export default function ProfilePage() {
  const { user, profile, updateProfile } = useAuth();
  const [loading, setLoading] = useState(false);
  const [avatarLoading, setAvatarLoading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const router = useRouter();

  const form = useForm<ProfileFormData>({
    resolver: zodResolver(profileSchema),
    defaultValues: {
      full_name: profile?.full_name || "",
    },
  });

  const onSubmit = async (data: ProfileFormData) => {
    setLoading(true);
    try {
      const result = await updateProfile(data);
      if (result.error) {
        toast.error("Error updating profile: " + result.error.message);
      } else {
        toast.success("Profile updated successfully!");
      }
    } catch (error) {
      toast.error("An error occurred while updating profile");
    } finally {
      setLoading(false);
    }
  };

  const handleAvatarClick = () => {
    fileInputRef.current?.click();
  };

  const handleAvatarChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file || !user) return;

    // Validate file type
    if (!file.type.startsWith('image/')) {
      toast.error("Please select an image file");
      return;
    }

    // Validate file size (2MB)
    if (file.size > 2 * 1024 * 1024) {
      toast.error("File size must be less than 2MB");
      return;
    }

    setAvatarLoading(true);
    try {
      // Convert file to base64 for demo purposes
      // In production, you should set up Supabase Storage bucket first
      const reader = new FileReader();
      reader.onload = async (e) => {
        const base64 = e.target?.result as string;
        
        const result = await updateProfile({ 
          full_name: profile?.full_name || "",
          avatar_url: base64 
        });
        
        if (result.error) {
          toast.error("Error updating avatar: " + result.error.message);
        } else {
          toast.success("Avatar updated successfully!");
        }
        setAvatarLoading(false);
      };
      
      reader.onerror = () => {
        toast.error("Error reading file");
        setAvatarLoading(false);
      };
      
      reader.readAsDataURL(file);
    } catch (error) {
      console.error("Avatar update error:", error);
      toast.error("An error occurred while updating avatar");
      setAvatarLoading(false);
    }
  };

  const handleBackToHome = () => {
    router.push("/");
  };

  if (!user) {
    return (
      <div className="container mx-auto py-8">
        <Card>
          <CardContent className="p-8 text-center">
            <p>Please log in to view your profile.</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="container mx-auto py-4 sm:py-8 max-w-2xl px-4 sm:px-6">
      {/* Back to Home Button */}
      <div className="mb-4 sm:mb-6">
        <Button variant="outline" onClick={handleBackToHome} className="flex items-center gap-2 w-full sm:w-auto">
          <ArrowLeft className="h-4 w-4" />
          Back to Home
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-xl sm:text-2xl">My Profile</CardTitle>
          <CardDescription className="text-sm sm:text-base">
            Manage your personal information and account settings.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4 sm:space-y-6">
          {/* Avatar Section */}
          <div className="flex flex-col sm:flex-row items-center sm:items-start space-y-4 sm:space-y-0 sm:space-x-4">
            <div className="relative">
              <Avatar className="h-16 w-16 sm:h-20 sm:w-20 cursor-pointer" onClick={handleAvatarClick}>
                <AvatarImage src={profile?.avatar_url || ""} />
                <AvatarFallback className="text-base sm:text-lg">
                  {profile?.full_name?.charAt(0)?.toUpperCase() || "U"}
                </AvatarFallback>
              </Avatar>
              {avatarLoading && (
                <div className="absolute inset-0 bg-black bg-opacity-50 rounded-full flex items-center justify-center">
                  <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-white"></div>
                </div>
              )}
            </div>
            <div className="space-y-2 text-center sm:text-left">
              <Button variant="outline" size="sm" onClick={handleAvatarClick} disabled={avatarLoading} className="w-full sm:w-auto">
                <Camera className="h-4 w-4 mr-2" />
                {avatarLoading ? "Updating..." : "Change Avatar"}
              </Button>
              <p className="text-xs sm:text-sm text-muted-foreground">
                JPG, PNG or GIF. Max 2MB.
              </p>
            </div>
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              onChange={handleAvatarChange}
              className="hidden"
            />
          </div>

          <Separator />

          {/* Profile Form */}
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
              <FormField
                control={form.control}
                name="full_name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Full Name</FormLabel>
                    <FormControl>
                      <Input placeholder="Enter your full name" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <Separator />

              <div className="flex justify-end">
                <Button type="submit" disabled={loading} className="w-full sm:w-auto">
                  {loading ? "Updating..." : "Update Profile"}
                </Button>
              </div>
            </form>
          </Form>

          <Separator />

          {/* Account Information */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold">Account Information</h3>
            <div className="grid grid-cols-1 gap-4">
              <div>
                <Label className="text-sm font-medium">Email</Label>
                <p className="text-sm text-muted-foreground">{user.email}</p>
              </div>
              <div>
                <Label className="text-sm font-medium">Account Created</Label>
                <p className="text-sm text-muted-foreground">
                  {profile?.created_at ? new Date(profile.created_at).toLocaleDateString('en-US') : "N/A"}
                </p>
              </div>
              <div>
                <Label className="text-sm font-medium">Role</Label>
                <p className="text-sm text-muted-foreground capitalize">
                  {profile?.role || "User"}
                </p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

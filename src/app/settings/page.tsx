"use client";
import { useAuth } from "@/hooks/use-auth";
import { useTheme } from "@/hooks/use-theme";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useState, useEffect } from "react";
import { toast } from "sonner";
import { ArrowLeft, Moon, Sun, Bell, Lock, Trash2 } from "lucide-react";
import { useRouter } from "next/navigation";

interface SettingsData {
  theme: "light" | "dark" | "system";
  notifications: {
    email: boolean;
    push: boolean;
    taskReminders: boolean;
    weeklyDigest: boolean;
  };
  privacy: {
    profileVisible: boolean;
    activityVisible: boolean;
  };
  language: string;
}

export default function SettingsPage() {
  const { user, signOut } = useAuth();
  const { theme, setTheme } = useTheme();
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [settings, setSettings] = useState<SettingsData>({
    theme: "system",
    notifications: {
      email: true,
      push: false,
      taskReminders: true,
      weeklyDigest: false,
    },
    privacy: {
      profileVisible: true,
      activityVisible: false,
    },
    language: "en",
  });

  useEffect(() => {
    // Load settings from localStorage
    const savedSettings = localStorage.getItem('userSettings');
    if (savedSettings) {
      setSettings(JSON.parse(savedSettings));
    }
  }, []);

  const saveSettings = (newSettings: SettingsData) => {
    setSettings(newSettings);
    localStorage.setItem('userSettings', JSON.stringify(newSettings));
    toast.success("Settings saved successfully!");
  };

  const handleThemeChange = (newTheme: "light" | "dark" | "system") => {
    const newSettings = { ...settings, theme: newTheme };
    setSettings(newSettings);
    localStorage.setItem('userSettings', JSON.stringify(newSettings));
    
    // Use theme context to apply theme globally
    setTheme(newTheme);
    toast.success("Theme updated successfully!");
  };

  const handleNotificationChange = (key: keyof SettingsData['notifications'], value: boolean) => {
    const newSettings = {
      ...settings,
      notifications: {
        ...settings.notifications,
        [key]: value,
      },
    };
    saveSettings(newSettings);
  };

  const handlePrivacyChange = (key: keyof SettingsData['privacy'], value: boolean) => {
    const newSettings = {
      ...settings,
      privacy: {
        ...settings.privacy,
        [key]: value,
      },
    };
    saveSettings(newSettings);
  };

  const handleLanguageChange = (language: string) => {
    const newSettings = { ...settings, language };
    saveSettings(newSettings);
  };

  const handleDeleteAccount = async () => {
    if (window.confirm("Are you sure you want to delete your account? This action cannot be undone.")) {
      setLoading(true);
      try {
        // In a real app, you would call an API to delete the account
        toast.error("Account deletion is not implemented in this demo");
      } catch (error) {
        toast.error("Error deleting account");
      } finally {
        setLoading(false);
      }
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
            <p>Please log in to access settings.</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="container mx-auto py-8 max-w-2xl">
      {/* Back to Home Button */}
      <div className="mb-6">
        <Button variant="outline" onClick={handleBackToHome} className="flex items-center gap-2">
          <ArrowLeft className="h-4 w-4" />
          Back to Home
        </Button>
      </div>

      <div className="space-y-6">
        {/* Appearance Settings */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Sun className="h-5 w-5" />
              Appearance
            </CardTitle>
            <CardDescription>
              Customize how the application looks and feels.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label className="text-base">Theme</Label>
                <div className="text-sm text-muted-foreground">
                  Choose your preferred theme
                </div>
              </div>
              <Select value={theme} onValueChange={handleThemeChange}>
                <SelectTrigger className="w-32">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="light">Light</SelectItem>
                  <SelectItem value="dark">Dark</SelectItem>
                  <SelectItem value="system">System</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <Separator />

            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label className="text-base">Language</Label>
                <div className="text-sm text-muted-foreground">
                  Select your preferred language
                </div>
              </div>
              <Select value={settings.language} onValueChange={handleLanguageChange}>
                <SelectTrigger className="w-32">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="en">English</SelectItem>
                  <SelectItem value="vi">Tiếng Việt</SelectItem>
                  <SelectItem value="es">Español</SelectItem>
                  <SelectItem value="fr">Français</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </CardContent>
        </Card>

        {/* Notification Settings */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Bell className="h-5 w-5" />
              Notifications
            </CardTitle>
            <CardDescription>
              Manage your notification preferences.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label className="text-base">Email Notifications</Label>
                <div className="text-sm text-muted-foreground">
                  Receive notifications via email
                </div>
              </div>
              <Switch
                checked={settings.notifications.email}
                onCheckedChange={(checked: boolean) => handleNotificationChange('email', checked)}
              />
            </div>

            <Separator />

            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label className="text-base">Push Notifications</Label>
                <div className="text-sm text-muted-foreground">
                  Receive push notifications in browser
                </div>
              </div>
              <Switch
                checked={settings.notifications.push}
                onCheckedChange={(checked: boolean) => handleNotificationChange('push', checked)}
              />
            </div>

            <Separator />

            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label className="text-base">Task Reminders</Label>
                <div className="text-sm text-muted-foreground">
                  Get reminded about upcoming tasks
                </div>
              </div>
              <Switch
                checked={settings.notifications.taskReminders}
                onCheckedChange={(checked: boolean) => handleNotificationChange('taskReminders', checked)}
              />
            </div>

            <Separator />

            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label className="text-base">Weekly Digest</Label>
                <div className="text-sm text-muted-foreground">
                  Receive weekly summary of your tasks
                </div>
              </div>
              <Switch
                checked={settings.notifications.weeklyDigest}
                onCheckedChange={(checked: boolean) => handleNotificationChange('weeklyDigest', checked)}
              />
            </div>
          </CardContent>
        </Card>

        {/* Privacy Settings */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Lock className="h-5 w-5" />
              Privacy
            </CardTitle>
            <CardDescription>
              Control your privacy and data sharing preferences.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label className="text-base">Profile Visibility</Label>
                <div className="text-sm text-muted-foreground">
                  Make your profile visible to other users
                </div>
              </div>
              <Switch
                checked={settings.privacy.profileVisible}
                onCheckedChange={(checked: boolean) => handlePrivacyChange('profileVisible', checked)}
              />
            </div>

            <Separator />

            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label className="text-base">Activity Visibility</Label>
                <div className="text-sm text-muted-foreground">
                  Show your activity status to others
                </div>
              </div>
              <Switch
                checked={settings.privacy.activityVisible}
                onCheckedChange={(checked: boolean) => handlePrivacyChange('activityVisible', checked)}
              />
            </div>
          </CardContent>
        </Card>

        {/* Danger Zone */}
        <Card className="border-destructive">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-destructive">
              <Trash2 className="h-5 w-5" />
              Danger Zone
            </CardTitle>
            <CardDescription>
              Irreversible and destructive actions.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label className="text-base">Delete Account</Label>
                <div className="text-sm text-muted-foreground">
                  Permanently delete your account and all data
                </div>
              </div>
              <Button 
                variant="destructive" 
                onClick={handleDeleteAccount}
                disabled={loading}
              >
                {loading ? "Deleting..." : "Delete Account"}
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

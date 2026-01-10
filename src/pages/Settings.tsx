import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { useToast } from "@/hooks/use-toast";
import { Database, CheckCircle, AlertCircle, Loader2, User, Bell, Upload, Lock, Eye, EyeOff } from "lucide-react";
import { StrategyImportModal } from "@/components/settings/StrategyImportModal";

const Settings = () => {
  const { user, signOut } = useAuth();
  const { toast } = useToast();
  const [strategyCount, setStrategyCount] = useState<number | null>(null);
  const [seeding, setSeeding] = useState(false);
  const [importModalOpen, setImportModalOpen] = useState(false);
  const [loading, setLoading] = useState(true);
  const [profile, setProfile] = useState({
    full_name: "",
    email: "",
    title: "",
  });
  const [savingProfile, setSavingProfile] = useState(false);
  const [passwords, setPasswords] = useState({
    newPassword: "",
    confirmPassword: "",
  });
  const [showPasswords, setShowPasswords] = useState({
    new: false,
    confirm: false,
  });
  const [savingPassword, setSavingPassword] = useState(false);

  useEffect(() => {
    fetchData();
  }, [user]);

  const fetchData = async () => {
    try {
      // Fetch strategy count
      const { count, error: countError } = await supabase
        .from("strategies")
        .select("*", { count: "exact", head: true });

      if (!countError) setStrategyCount(count || 0);

      // Fetch profile
      if (user) {
        const { data: profileData } = await supabase
          .from("profiles")
          .select("full_name, email, title")
          .eq("user_id", user.id)
          .maybeSingle();

        if (profileData) {
          setProfile({
            full_name: profileData.full_name || "",
            email: profileData.email || user.email || "",
            title: profileData.title || "",
          });
        } else {
          setProfile({
            full_name: "",
            email: user.email || "",
            title: "",
          });
        }
      }
    } catch (error) {
      console.error("Error fetching data:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleSeedStrategies = async () => {
    setSeeding(true);
    try {
      const { data, error } = await supabase.functions.invoke("seed-strategies");

      if (error) throw error;

      if (data.success) {
        toast({
          title: "Strategies seeded",
          description: data.message,
        });
        fetchData();
      } else {
        toast({
          title: "Already seeded",
          description: data.message,
          variant: "default",
        });
      }
    } catch (error: any) {
      console.error("Error seeding strategies:", error);
      toast({
        title: "Error",
        description: error.message || "Failed to seed strategies",
        variant: "destructive",
      });
    } finally {
      setSeeding(false);
    }
  };

  const handleSaveProfile = async () => {
    if (!user) return;
    setSavingProfile(true);
    
    try {
      const { error } = await supabase
        .from("profiles")
        .upsert({
          user_id: user.id,
          full_name: profile.full_name,
          email: profile.email,
          title: profile.title,
          updated_at: new Date().toISOString(),
        }, { onConflict: "user_id" });

      if (error) throw error;

      toast({ title: "Profile updated" });
    } catch (error) {
      console.error("Error saving profile:", error);
      toast({
        title: "Error",
        description: "Failed to save profile",
        variant: "destructive",
      });
    } finally {
      setSavingProfile(false);
    }
  };

  const handleSignOut = async () => {
    await signOut();
  };

  const handleChangePassword = async () => {
    if (!passwords.newPassword || !passwords.confirmPassword) {
      toast({
        title: "Error",
        description: "Please fill in both password fields",
        variant: "destructive",
      });
      return;
    }

    if (passwords.newPassword.length < 6) {
      toast({
        title: "Error",
        description: "Password must be at least 6 characters",
        variant: "destructive",
      });
      return;
    }

    if (passwords.newPassword !== passwords.confirmPassword) {
      toast({
        title: "Error",
        description: "Passwords do not match",
        variant: "destructive",
      });
      return;
    }

    setSavingPassword(true);
    try {
      const { error } = await supabase.auth.updateUser({
        password: passwords.newPassword,
      });

      if (error) throw error;

      toast({ title: "Password updated successfully" });
      setPasswords({ newPassword: "", confirmPassword: "" });
    } catch (error: any) {
      console.error("Error changing password:", error);
      toast({
        title: "Error",
        description: error.message || "Failed to change password",
        variant: "destructive",
      });
    } finally {
      setSavingPassword(false);
    }
  };

  return (
    <DashboardLayout>
      <div className="space-y-6 max-w-2xl">
        <div>
          <h1 className="font-display text-2xl font-bold text-foreground">Settings</h1>
          <p className="text-muted-foreground font-body">
            Manage your account and application settings
          </p>
        </div>

        {/* Profile Section */}
        <Card className="shadow-soft">
          <CardHeader>
            <CardTitle className="font-display flex items-center gap-2">
              <User className="h-5 w-5 text-eiduk-blue" />
              Profile
            </CardTitle>
            <CardDescription>
              Your account information
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="fullName">Full Name</Label>
              <Input
                id="fullName"
                value={profile.full_name}
                onChange={(e) => setProfile({ ...profile, full_name: e.target.value })}
                placeholder="Enter your full name"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="title">Professional Title / Credentials</Label>
              <Input
                id="title"
                value={profile.title}
                onChange={(e) => setProfile({ ...profile, title: e.target.value })}
                placeholder="e.g., CPA, CFP, MSCTA"
              />
              <p className="text-xs text-muted-foreground">Displayed on reports and client documents</p>
            </div>
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                value={profile.email}
                onChange={(e) => setProfile({ ...profile, email: e.target.value })}
                disabled
                className="bg-muted"
              />
              <p className="text-xs text-muted-foreground">Email cannot be changed here</p>
            </div>
            <Button onClick={handleSaveProfile} disabled={savingProfile}>
              {savingProfile && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
              Save Changes
            </Button>

            <Separator className="my-6" />

            {/* Change Password Section */}
            <div className="space-y-4">
              <div className="flex items-center gap-2">
                <Lock className="h-4 w-4 text-muted-foreground" />
                <h3 className="font-medium">Change Password</h3>
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="newPassword">New Password</Label>
                <div className="relative">
                  <Input
                    id="newPassword"
                    type={showPasswords.new ? "text" : "password"}
                    value={passwords.newPassword}
                    onChange={(e) => setPasswords({ ...passwords, newPassword: e.target.value })}
                    placeholder="Enter new password"
                  />
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    className="absolute right-0 top-0 h-full px-3 hover:bg-transparent"
                    onClick={() => setShowPasswords({ ...showPasswords, new: !showPasswords.new })}
                  >
                    {showPasswords.new ? (
                      <EyeOff className="h-4 w-4 text-muted-foreground" />
                    ) : (
                      <Eye className="h-4 w-4 text-muted-foreground" />
                    )}
                  </Button>
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="confirmPassword">Confirm New Password</Label>
                <div className="relative">
                  <Input
                    id="confirmPassword"
                    type={showPasswords.confirm ? "text" : "password"}
                    value={passwords.confirmPassword}
                    onChange={(e) => setPasswords({ ...passwords, confirmPassword: e.target.value })}
                    placeholder="Confirm new password"
                  />
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    className="absolute right-0 top-0 h-full px-3 hover:bg-transparent"
                    onClick={() => setShowPasswords({ ...showPasswords, confirm: !showPasswords.confirm })}
                  >
                    {showPasswords.confirm ? (
                      <EyeOff className="h-4 w-4 text-muted-foreground" />
                    ) : (
                      <Eye className="h-4 w-4 text-muted-foreground" />
                    )}
                  </Button>
                </div>
              </div>

              <Button onClick={handleChangePassword} disabled={savingPassword} variant="secondary">
                {savingPassword && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                Update Password
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Notifications Section - Placeholder */}
        <Card className="shadow-soft">
          <CardHeader>
            <CardTitle className="font-display flex items-center gap-2">
              <Bell className="h-5 w-5 text-eiduk-blue" />
              Notifications
            </CardTitle>
            <CardDescription>
              Configure how you receive notifications
            </CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-muted-foreground text-sm">
              Notification preferences coming soon.
            </p>
          </CardContent>
        </Card>

        {/* Strategy Database Section */}
        <Card className="shadow-soft">
          <CardHeader>
            <CardTitle className="font-display flex items-center gap-2">
              <Database className="h-5 w-5 text-eiduk-blue" />
              Strategy Database
            </CardTitle>
            <CardDescription>
              Manage your tax strategy database
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center gap-3 p-4 rounded-lg bg-muted/50">
              {loading ? (
                <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
              ) : strategyCount && strategyCount > 0 ? (
                <CheckCircle className="h-5 w-5 text-success" />
              ) : (
                <AlertCircle className="h-5 w-5 text-warning" />
              )}
              <div>
                <p className="font-medium">
                  {loading
                    ? "Loading..."
                    : strategyCount && strategyCount > 0
                    ? `${strategyCount} strategies loaded`
                    : "No strategies loaded"}
                </p>
                <p className="text-sm text-muted-foreground">
                  {strategyCount && strategyCount > 0
                    ? "Your strategy database is ready"
                    : "Import strategies to get started"}
                </p>
              </div>
            </div>

            <div className="flex gap-2">
              <Button
                variant="outline"
                onClick={() => setImportModalOpen(true)}
              >
                <Upload className="h-4 w-4 mr-2" />
                Import / Update from CSV
              </Button>
            </div>
          </CardContent>
        </Card>

        <StrategyImportModal
          open={importModalOpen}
          onOpenChange={setImportModalOpen}
          onImportComplete={fetchData}
        />

        {/* Sign Out */}
        <Separator />
        <div className="flex justify-end">
          <Button variant="outline" onClick={handleSignOut}>
            Sign Out
          </Button>
        </div>
      </div>
    </DashboardLayout>
  );
};

export default Settings;

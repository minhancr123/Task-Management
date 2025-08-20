import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { signUp } from "@/lib/auth";
import { Label } from "@radix-ui/react-label";
import { Eye, EyeOff, Loader2 } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner"
export type SignUpFormProps = {
  onToggleMode: () => void;
}
export default function SignUpForm({ onToggleMode }: SignUpFormProps) {
    const [fullName, setFullName] = useState("");
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [showPassword, setShowPassword] = useState(false);
    const [confirmPassword, setConfirmPassword] = useState("");
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsLoading(true); 

        if (password !== confirmPassword) {
            setError("Passwords do not match");
            setIsLoading(false);
            return;
        }

        if (password.length < 6) {
            setError("Password must be at least 6 characters")
            setIsLoading(false)
            return
        }
        const {error} = await signUp(email, password, fullName);

        if (error) {
            setError(error.message);
            setIsLoading(false);
        }
        else{
            setIsLoading(false)
            setError(null);
            toast.success("Account created successfully!");
        }
    }
    return (
        <Card  className="w-full max-w-md">
            <CardHeader className="space-y-1">
                <CardTitle className="text-lg font-medium text-center">Create an Account</CardTitle>
                <CardDescription className="text-center">Sign up to start managing your tasks</CardDescription>
            </CardHeader>
            <CardContent>
                <form onSubmit={handleSubmit} className="space-y-4">
                    {error && <Alert className="text-red-500 bg-red-200 border-red-100">
                      <AlertDescription>{error}</AlertDescription>
                    </Alert>}
                    <div className="space-y-2 space-x-2">
                        <Label htmlFor="FullName">Full Name</Label>
                        <div className="relative">
                            <Input id="FullName" placeholder="Enter your full name" type="text" className="w-full" onChange={(e) => setFullName(e.target.value) } ></Input>
                        </div>
                    </div>
                    <div className="space-y-2">
                        <Label htmlFor="email">Email</Label>
                        <Input
                        id="email"
                        type="email"
                        placeholder="Enter your email"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        required
                        />
                    </div>        

                     <div className="space-y-2">
                        <Label htmlFor="password">Password</Label>
                        <div className="relative">
                        <Input
                            id="password"
                            type={showPassword ? "text" : "password"}
                            placeholder="Enter a password"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            required
                        />
                        <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-gray-200"
                            onClick={() => setShowPassword(!showPassword)}
                        >
                            {showPassword ? (
                            <EyeOff className="h-2 w-2 text-gray-400" />
                            ) : (
                            <Eye className="h-2 w-2 text-gray-400" />
                            )}
                        </Button>
                        </div>
                    </div>
                     <div className="space-y-2">
                        <Label htmlFor="confirmPassword">Confirm Password</Label>
                        <Input
                        id="confirmPassword"
                        type="password"
                        placeholder="Confirm your password"
                        value={confirmPassword}
                        onChange={(e) => setConfirmPassword(e.target.value)}
                        required
                        />
                    </div>
                    <div className="w-fit mx-auto">
                        <Button variant="outline" type="submit" disabled={isLoading}>
                            {isLoading && <Loader2 className="h-4 w-4 animate-spin mr-2"></Loader2>}
                            Create Account
                        </Button>
                    </div>

                    <div className="text-center text-sm">
                        <span className="text-gray-600">Already have an account? </span>
                        <Button variant="link" className="p-0 text-blue-600 hover:underline" onClick={() => onToggleMode()}>
                            Sign In
                        </Button>
                    </div>
                </form>
            </CardContent>
        </Card>
    );
}
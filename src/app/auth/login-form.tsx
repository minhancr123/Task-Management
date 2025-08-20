"use client";
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useAuth } from '@/hooks/use-auth';
import { Eye, EyeOff, Loader2 } from 'lucide-react';
import React, { useState } from 'react'
import { toast } from 'sonner';
import { useRouter } from 'next/navigation';
export type LoginFormProps = {
  onToggleMode  : () => void;
}
export const LoginForm = ({ onToggleMode }: LoginFormProps) => {
  const { signIn } = useAuth();
  const [email ,setEmail] = useState("");
  const [password ,setPassword] = useState("");
  const [showPassword , setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();
  const handleSubmit = async(e : React.FormEvent) => {
      e.preventDefault();
      setLoading(true);
      const result = await signIn(email, password);
      if (result.error) {
          setError(result.error.message);
          toast.error(result.error.message);
      }
      else {
          setError(null);
          toast.success("Logged in successfully!");
          router.push("/");
      }
      setLoading(false);
  }
  return (
      <Card className='w-full max-w-md'>
          <CardHeader className='space-y-1'>
              <CardTitle className='text-lg font-medium text-center'>Welcome back</CardTitle>
              <CardDescription className='text-center'>Sign in to your account to continue</CardDescription>
          </CardHeader>

          <CardContent className='space-x-4'>
              <form onSubmit={handleSubmit}>
                {error && (<Alert className='text-red-500 bg-red-200 border-red-100'>
                  <AlertDescription>{error}</AlertDescription>
                </Alert>)}
                
                <div className='space-y-2 space-x-2 py-2'>
                  <Label htmlFor="email">Email</Label>
                  <div className='relative'>
                    <Input id='email' value={email} onChange={(e) => setEmail(e.target.value)} />
                  </div>
                </div>

                <div className='space-y-2 space-x-2 py-2'>
                  <Label htmlFor="password">Password</Label>
                  <div className='relative'>
                    <Input id='password' type={showPassword ? 'text' : 'password'} value={password} onChange={(e) => setPassword(e.target.value)} required />
                    <Button variant="ghost" type='button' size="sm" className='absolute right-0 top-0 px-3 py-2 h-full hover:bg-gray-200 ' onClick={() => setShowPassword(!showPassword)}>
                      {showPassword ? <EyeOff className='h-2 w-2 text-gray-400' ></EyeOff> : <Eye className='h-2 w-2 text-gray-400'></Eye>}
                    </Button>
                  </div>
                </div>

                <div className='w-fit mx-auto'>
                  <Button type='submit' variant="outline" size="lg" className=' mt-3' disabled={loading}>
                  {loading && <Loader2 className='mr-2 h-4 w-4 animate-spin' ></Loader2>}
                    Sign In
                  </Button>
                </div>

                <div className='text-center text-sm'>
                  <span className='text-gray-600'>Don't have an account? </span>
                  <Button variant="link" className='p-0 text-blue-600 hover:underline' onClick={() => onToggleMode()}>
                    Sign Up
                  </Button>
                </div>
              </form>

          </CardContent>
      </Card>
  )
}

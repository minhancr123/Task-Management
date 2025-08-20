"use client"
import React, { useState } from 'react'
import { LoginForm } from './login-form'
import SignUpForm from './signup-form';
import { useAuthDirect } from '@/ context/AuthDirectContext';

export default function AuthPage() {
    useAuthDirect();
    const [isLoginMode, setIsLoginMode] = useState(true);
  return (
    <section className="min-h-screen w-screen flex items-center justify-center">
      {isLoginMode ? (
        <LoginForm onToggleMode={() => setIsLoginMode(false)} />
      ) : (
        <SignUpForm onToggleMode={() => setIsLoginMode(true)} />
      )}
    </section>
  )
}

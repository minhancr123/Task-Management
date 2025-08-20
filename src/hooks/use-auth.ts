"use client"
import { AuthContext } from "@/ context/AuthContext";
import { useContext } from "react";


export function useAuth() {
  const context = useContext(AuthContext);
  if (context === null) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}

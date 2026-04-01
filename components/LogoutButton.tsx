// components/LogoutButton.tsx
"use client"
import { useRouter } from "next/navigation"
// import { useState } from "react"
import AlertWithDialogue from "./reusables/AlertWithDialogue"
import apiClient from "@/lib/api-client"


export default function LogoutButton() {
  const router = useRouter()
  // const [loading, setLoading] = useState(false)

  const handleLogout = async () => {
    try {
      // await fetch("/api/auth/logout", { method: "POST" })
      const response = await apiClient.post("/auth/logout");
      console.log(response)
      router.push("/login")
    } catch (error: unknown ) {
      console.error("Logout failed", error)
    } 

  }

  return (
    <AlertWithDialogue
      buttonText="Logout"
      buttonVariant="outline"
      confirmText="Yes"
      cancelText="No"
      title="Logout"
      message="Are you sure you want to logout?"
      confirmFunction={handleLogout}
    />
  )
}
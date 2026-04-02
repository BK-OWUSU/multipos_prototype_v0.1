"use client"
import { useRouter } from "next/navigation"
import AlertWithDialogue from "./reusables/AlertWithDialogue"
import { useAuthStore } from "@/store/useAuthStore"


export default function LogoutButton() {
  const router = useRouter()
  const logout = useAuthStore((state)=> state.logout)
  const handleLogout = async () => {
    try {
      await logout()
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
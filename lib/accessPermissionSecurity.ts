import { User } from "@/types/auth";

export default function hasAccess(user: User | null, key: string): boolean { 
    if (!user) return false;

    // Full access (OWNER / SUPER ADMIN)
    if (user?.role?.access.includes("*")) return true;

    // Check specific access key
    return user?.role?.access.includes(key);
}
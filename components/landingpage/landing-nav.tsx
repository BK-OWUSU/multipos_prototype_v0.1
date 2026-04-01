import Image from "next/image";
import Link from "next/link";
import { Button } from "@/components/ui/button";

export default function LandingPageNavBar() {
  return (
    <div className="flex justify-between items-center sm:px-20 px-5 w-full border-2 shadow-md">
      <Link href="/" className="flex items-center gap-2">
         <Image src="/logo-trans.png" alt="Logo" width={60} height={60} />
      </Link>

      <div className="flex items-center gap-2">
        <Link href="/login">
          <Button
            variant="outline"
            className="text-blue-700 px-4 py-2 cursor-pointer border-blue-700 hover:bg-blue-500 hover:text-white"
          >
            Login
          </Button>
        </Link>

        <Link href="/signup">
          <Button
            variant="default"
            className="bg-blue-700 text-white px-4 cursor-pointer py-2 hover:bg-blue-500"
          >
            Sign Up
          </Button>
        </Link>
      </div>
    </div>
  )
}

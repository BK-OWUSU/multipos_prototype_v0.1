import { SignupForm } from "./signup-form"
import Image from "next/image"
import Link from "next/link"

export default function Page() {
  return (
        <div className="flex min-h-svh flex-col items-center justify-center gap-6 bg-muted p-6 md:p-10">
      <div className="flex w-full max-w-sm flex-col gap-6">
        <Link href="/login" className="flex items-center gap-2 self-center font-medium">
          <div className="flex size-6 items-center justify-center rounded-md bg-primary text-primary-foreground">
            <Image src="/logo-trans.png" alt="Logo" width={20} height={20} />
          </div>
          multiPOS
        </Link>
        <SignupForm />
      </div>
    </div>
  )
}



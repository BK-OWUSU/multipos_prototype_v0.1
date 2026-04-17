"use client"
import { cn } from "@/lib/utils"
import {Field,FieldDescription,FieldGroup,FieldSeparator} from "@/components/ui/field"
import { useRouter } from "next/navigation"
import { FormInput } from "../../components/reusables/FormInput"
import { useForm, SubmitHandler, FormProvider } from "react-hook-form"
// import Link from "next/link"
import { loginSchema, LoginSchema } from "@/schema/auth.schema"
import { zodResolver } from "@hookform/resolvers/zod"
import { useAuthStore } from "@/store/useAuthStore"
import { LoginResponse } from "@/types/auth"
import CustomButton from "@/components/reusables/CustomButton"
import { LogIn } from "lucide-react";



export function LoginForm({className,...props}: React.ComponentProps<"form">) {
  const login  = useAuthStore((state)=> state.login);
  const router = useRouter();
  const forms = useForm<LoginSchema>({
    resolver: zodResolver(loginSchema)
  });
  const {handleSubmit, setError, formState:{isSubmitting, errors}} = forms
  const onSubmit: SubmitHandler<LoginSchema> = async(data) => {
      const response = await login(data) as LoginResponse;
      console.log("Response Here")
      console.log(response)
      //handle unverified user
      if (response.isVerified === false && response.redirectTo) {
        router.push(response.redirectTo);
        return;
      } 
      
      //handle first time users who to need reset their password
      if (response.requiresPasswordChange && response.redirectTo) {
        router.push(response.redirectTo);
        return;
      }


      //Successful login with single business → redirect to dashboard
      if(response.success && response.redirectTo) {
        router.push(`/${response.redirectTo}/dashboard`);
        return;
      }
      
      //Multiple businesses → redirect to business selection page
      if(response.success && response.multipleBusinesses) {
        return;
      }
      //Handle errors
      if(response.error) {
        setError("root", {message: response.error})
      }
  }

  return (
    <FormProvider {...forms} >
    <form  onSubmit={handleSubmit(onSubmit)}  className={cn("flex flex-col gap-6", className)} {...props} >
      <FieldGroup>
        <div className="flex flex-col items-center gap-1 text-center">
          <h1 className="text-2xl font-bold">Welcome Back</h1>
          <p className="text-sm text-balance text-muted-foreground">
            Enter your email below to login to your account
          </p>
        </div>
        <FormInput name="email" type="email" placeholder="Enter email"/>
        <FormInput name="password" type="password" placeholder="Enter password"/>
        <Field>
          <CustomButton 
            type="submit" 
            text="Login" 
            isLoading={isSubmitting} 
            className="w-full"
            icon={<LogIn className="w-4 h-4" />}
          />
        </Field>
        {errors.root && <p className="text-red-500 text-center">{errors.root.message}</p>}
        <FieldSeparator>Need an Account</FieldSeparator>
        <Field>
          <FieldDescription className="text-center">
            Don&apos;t have an account?{" "}
            <a href="/signup" className="underline underline-offset-4">
              Sign up
            </a>
          </FieldDescription>
        </Field>
      </FieldGroup>
    </form>
    </FormProvider>
  )
}

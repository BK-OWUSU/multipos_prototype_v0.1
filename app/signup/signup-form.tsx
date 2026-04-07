"use client"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import {Card,CardContent,CardHeader,CardTitle} from "@/components/ui/card"
import {Field,FieldDescription,FieldGroup,FieldContent} from "@/components/ui/field"
import { SignUpFormSchema, signupSchema } from "@/types/auth.schema"
import { Checkbox } from "@/components/ui/checkbox"
import {SubmitHandler, useForm, FormProvider } from "react-hook-form"
import {zodResolver} from "@hookform/resolvers/zod";
import { FormInput } from "../reusables/FormInput"
import { useRouter } from "next/navigation"
import { useAuthStore } from "@/store/useAuthStore"
import { SignUpResponse } from "@/types/auth"

export function SignupForm({ ...props }: React.ComponentProps<typeof Card>) {
  const router = useRouter();
  const signup = useAuthStore((state)=> state.signup)
  //Declaring forms Component from react use form hook 
  const forms = useForm<SignUpFormSchema>({
          resolver: zodResolver(signupSchema)
        });
  //Destructuring forms component      
  const {
    handleSubmit,
    setError,
    setValue,
    formState: {errors, isSubmitting}
  } = forms;
 
  //Onsubmit function to handle submit
  const onSubmit: SubmitHandler<SignUpFormSchema> = async(data) => {
    const response = await signup(data) as SignUpResponse;
    if (response.success && response.message && response.redirectTo) {
        router.push(response.redirectTo);
        return;
      }

    //Handle errors
       if(response.error && response.status == 401 || 500) {
         setError("root", {message: response.error})
       }  
  }
  return (
    <Card {...props}>
      <CardHeader className="text-center">  
        <CardTitle>Create Your Free MultiPOS Account</CardTitle>
      </CardHeader>
      <CardContent>
      <FormProvider {...forms}>
        <form onSubmit={handleSubmit(onSubmit)}>
          <FieldGroup>
             <FormInput name="businessName" type="text" placeholder="Enter business name"/>
             <FormInput name="firstName" type="text" placeholder="Enter firstname"/>
             <FormInput name="lastName" type="text" placeholder="Enter lastname"/>
             <FormInput name="email" type="text" placeholder="Enter your email"/>
             <FormInput name="password" type="password" placeholder="Enter your password" hintText="Must be at least 8 characters long."/>
             <FormInput name="confirmPassword" type="password" placeholder="confirm your password"/>
              <FieldGroup className="mx-auto">
                <Field orientation="horizontal">
                  <Checkbox id="terms-checkbox-desc" name="terms-checkbox-desc"
                    className="border-black size-4.5"
                    onCheckedChange={(checked) => setValue("termsAgreement", checked as boolean)}
                  />
                  <FieldContent>
                    <FieldDescription>
                      I agree to MultiPos <a href="">Terms of Use</a> and have read and acknowledged <a href="">Privacy Policy</a> 
                    </FieldDescription>
                  </FieldContent>
                </Field>
                  {errors.termsAgreement && <FieldDescription className="text-destructive">{errors.termsAgreement?.message}</FieldDescription>}
                </FieldGroup>
              <FieldGroup>
              <Field>
                <Button type="submit" disabled = {isSubmitting} className="p-5">{isSubmitting ? "Loading..." : "Create Account"}</Button>
                {errors.root && <p className="text-red-500">{errors.root?.message}</p>}
                <FieldDescription className="px-6 text-center flex justify-between">
                   <span>Already have an account?</span> <Link href="/login">Sign in</Link>
                </FieldDescription>
              </Field>
              </FieldGroup> 
          </FieldGroup>
        </form>
        </FormProvider>
      </CardContent>
    </Card>
  )
}

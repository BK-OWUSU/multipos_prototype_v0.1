"use client"
import { cn } from "@/lib/utils";
import { RefreshCwIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import {Card,CardContent,CardDescription,CardFooter,CardHeader,CardTitle} from "@/components/ui/card";
import {Field,FieldDescription,FieldLabel} from "@/components/ui/field";
import {InputOTP,InputOTPGroup,InputOTPSeparator,InputOTPSlot} from "@/components/ui/input-otp";
import { useForm, FormProvider, Controller, SubmitHandler } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod";
import { otpSchema, OTPFormSchema } from "@/types/auth.schema";
import { useRouter } from "next/navigation";
import { useState, useEffect } from "react";
import { useAuthStore } from "@/store/useAuthStore";
import { OTPResponse } from "@/types/auth";

export function InputOTPForm() {
  const {verifyOtp, resendOtp, user} = useAuthStore();
  const email = user?.email;
  const [countdown, setCountdown] = useState(60)
  const canResend = countdown === 0;
  const router = useRouter();

  const otpForm = useForm<OTPFormSchema>({
    resolver: zodResolver(otpSchema),
    defaultValues: {pin : ""}
  })
  const {
    handleSubmit, 
    setError,
    formState: {errors}
  } = otpForm;

  const onSubmit: SubmitHandler<OTPFormSchema> = async(data) => {
    const response = await verifyOtp({pin: data.pin}) as OTPResponse;
     //Successful
       if(response.success && response.businessesSlug) {
        router.push(`/${response.businessesSlug}/dashboard`);
        return;
      }
      if(response.error && !response.success) {
        setError("pin", {message: response.error})
      }
  }

  // Countdown timer for resend button
  useEffect(() => {
    if (countdown <= 0) return;
    
    const timer = setTimeout(() => {
      setCountdown((prev) => prev - 1);
    }, 1000);
    return () => clearTimeout(timer);
  }, [countdown]);
  
  const handleResendOtpCode = async() => {
    if (!canResend) return;
    const response = await resendOtp();
      console.log("Resend OTP response: ", response);
      setCountdown(60); 
       if(response.success && response.message) {
        console.log("success message: ", response.message)
        return;
      }
      //Error
      if(response.error && !response.success) {
        setError("pin", {message: response.error})
      }
  //   try {
  //   const response  = await apiClient.post("/auth/resend-otp");
  //   console.log("Resend OTP response: ", response);
  //   // 3. Restart the 60s clock
  //   // alert("New code sent!");
  // } catch (error: unknown) {
  //   if (error instanceof AxiosError) {
  //     const response = error.response?.data;
  //     setError("pin", { message: response?.error || "Failed to resend. Try again." });
  //     console.log(response?.error || "Failed to resend. Try again.");
  //   } else {
  //     console.log("Something went wrong. Try again.");
  //     setError("pin", { message: "Something went wrong. Try again." });
  //   }
  // }
  }

  return (
    <Card className="mx-auto max-w-md">
      {/* Form Provider */}
      <FormProvider {...otpForm}>
        <form onSubmit={handleSubmit(onSubmit)}>
          <CardHeader>
            <CardTitle>Verify your login</CardTitle>
            <CardDescription>
              Enter the verification code we sent to your email address:
              <span className="font-medium">{email || "your email"}</span>.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Field>
              <div className="flex items-center justify-between">
                <FieldLabel htmlFor="otp-verification">
                  Verification code
                </FieldLabel>
                <Button 
                  variant="outline" 
                  size="xs" 
                  onClick={handleResendOtpCode}
                  disabled={!canResend} // This is critical
                  className={!canResend ? "opacity-50 cursor-not-allowed" : ""}
                  >
                  <RefreshCwIcon className={cn("mr-2 h-3 w-3", !canResend && "animate-spin-slow")} />
                  {canResend ? "Resend Code" : `Wait ${countdown}s`}
                </Button>
              </div>
              {/* UseForm Hook Controller to update for fields */}
              <Controller
                control={otpForm.control}
                name="pin"
                render={({field})=> (
                  <InputOTP 
                    maxLength={6} 
                    id="otp-verification"
                    value={field.value}
                    onChange={field.onChange} 
                    required
                    >
                    <InputOTPGroup className="*:data-[slot=input-otp-slot]:h-12 *:data-[slot=input-otp-slot]:w-11 *:data-[slot=input-otp-slot]:text-xl">
                      <InputOTPSlot index={0} />
                      <InputOTPSlot index={1} />
                      <InputOTPSlot index={2} />
                    </InputOTPGroup>
                    <InputOTPSeparator className="mx-2" />
                    <InputOTPGroup className="*:data-[slot=input-otp-slot]:h-12 *:data-[slot=input-otp-slot]:w-11 *:data-[slot=input-otp-slot]:text-xl">
                      <InputOTPSlot index={3} />
                      <InputOTPSlot index={4} />
                      <InputOTPSlot index={5} />
                    </InputOTPGroup>
                  </InputOTP>
                )} 
              />
              {/* End of Controller */}
              {/* ERROR */}
              {errors.pin && (<FieldDescription className="text-destructive text-sm mt-2">{errors.pin.message}</FieldDescription>)}
              {/* ERROR */}
              <FieldDescription>
                <a href="#">I no longer have access to this email address.</a>
              </FieldDescription>
            </Field>
          </CardContent>
          <CardFooter>
            <Field>
              <Button type="submit" className="w-full">
                Verify
              </Button>
              <div className="text-sm text-muted-foreground">
                Having trouble signing in?{" "}
                <a
                  href="#"
                  className="underline underline-offset-4 transition-colors hover:text-primary"
                >
                  Contact support
                </a>
              </div>
            </Field>
          </CardFooter>
          </form>
      </FormProvider>
      {/* End of form Provider */}
    </Card>
  )
}

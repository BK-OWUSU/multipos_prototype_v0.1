"use client"

import { useState } from "react"; // Added for visibility state
import { useFormContext } from "react-hook-form";
import { Field, FieldLabel, FieldDescription } from "@/components/ui/field"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Eye, EyeOff } from "lucide-react"; // Icons for the toggle
import { Button } from "@/components/ui/button";

interface FormInputProps {
  name: string;
  label?: string;
  type?: string;
  placeholder?: string;
  hintText?: string;
  textArea?: boolean;
  disabled? : boolean;
}

export function FormInput({ name, label, type = "text", placeholder, hintText, textArea = false, disabled = false }: FormInputProps) {
  const { register, formState: { errors } } = useFormContext();
  const error = errors[name];

  // 1. Local state to manage visibility
  const [showPassword, setShowPassword] = useState(false);

  // 2. Determine the actual type to pass to the Input element
  const isPassword = type === "password";
  const inputType = isPassword ? (showPassword ? "text" : "password") : type;

  return (
    <Field>
      {label && <FieldLabel htmlFor={name}>{label}</FieldLabel>}
      
      {textArea ? (
        <Textarea
          {...register(name)}
          id={name}
          placeholder={placeholder}
          className={error ? "border-destructive" : ""}
        />
      ) : (
        /* 3. Wrap Input in a relative container to position the button */
        <div className="relative">
          <Input
            {...register(name)}
            id={name}
            type={inputType}
            placeholder={placeholder}
            className={`${error ? "border-destructive" : ""} ${isPassword ? "pr-10" : ""}`}
            disabled = {disabled}
          />
          
          {/* 4. Only show the toggle if the original type passed was "password" */}
          {isPassword && (
            <Button
              type="button" // Critical: prevents form submission
              variant="ghost"
              size="sm"
              className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent text-gray-400 hover:text-gray-600"
              onClick={() => setShowPassword(!showPassword)}
            >
              {showPassword ? (
                <EyeOff className="h-8 w-8" aria-hidden="true" />
              ) : (
                <Eye className="h-8 w-8" aria-hidden="true" />
              )}
              <span className="sr-only">
                {showPassword ? "Hide password" : "Show password"}
              </span>
            </Button>
          )}
        </div>
      )}

      {error ? (
        <FieldDescription className="text-destructive text-xs font-medium mt-1">
          {error.message as string}
        </FieldDescription>
      ) : (
        hintText && <FieldDescription className="text-xs font-medium mt-1">{hintText}</FieldDescription>
      )}
    </Field>
  );
}
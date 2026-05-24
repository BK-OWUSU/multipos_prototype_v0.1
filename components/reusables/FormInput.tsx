"use client"

import { useState } from "react";
import { useFormContext, Controller } from "react-hook-form";
import { Field, FieldLabel, FieldDescription } from "@/components/ui/field"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Eye, EyeOff } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"

// Type structure for the select dropdown options
interface SelectOption {
  id:    string;
  name:  string;
  label?: string;
  value?: string;
}

interface FormInputProps {
  name: string;
  label?: string;
  className?: string;
  labelClassName?: string;
  type?: string;
  placeholder?: string;
  hintText?: string;
  textArea?: boolean;
  select?: boolean;
  selectDefaultValue?: string;
  options?: SelectOption[]; 
  disabled?: boolean;
}

export function FormInput({
  name,
  label,
  labelClassName,
  className,
  type = "text",
  placeholder,
  hintText,
  textArea = false,
  select = false,
  selectDefaultValue,
  options = [],
  disabled = false
}: FormInputProps) {
  const { register, control, formState: { errors } } = useFormContext();
  const error = errors[name];

  const [showPassword, setShowPassword] = useState(false);

  const isPassword = type === "password";
  const inputType = isPassword ? (showPassword ? "text" : "password") : type;

  return (
    <Field>
      {label && <FieldLabel className={labelClassName} htmlFor={name}>{label}</FieldLabel>}
      
      {/* 1. SELECT COMPONENT RENDERING */}
      {select ? (
        <Controller
          control={control}
          name={name}
          render={({ field }) => (
            <Select 
              onValueChange={field.onChange ?? "none"} 
              value={field.value} 
              disabled={disabled}
              
            >
              <SelectTrigger 
                id={name}
                className={error ? "border-destructive focus:ring-destructive" : ""}
              >
                <SelectValue placeholder={placeholder || "Select an option"} />
              </SelectTrigger>
              <SelectContent>
                {selectDefaultValue && <SelectItem value="none">{selectDefaultValue}</SelectItem>}
                {options.map((option) => (
                  <SelectItem key={option.id} value={option.id}>
                    {option.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          )}
        />
      ) : textArea ? (
        /* 2. TEXTAREA RENDERING */
        <Textarea
          {...register(name)}
          id={name}
          placeholder={placeholder}
          className={`${className} ${error ? "border-destructive" : ""}`}
          disabled={disabled}
        />
      ) : (
        /* 3. INPUT / PASSWORD RENDERING */
        <div className="relative">
          <Input
            {...register(name)}
            id={name}
            type={inputType}
            placeholder={placeholder}
            className={`${className} ${error ? "border-destructive" : ""} ${isPassword ? "pr-10" : ""}`}
            disabled={disabled}
          />
          
          {isPassword && (
            <Button
              type="button"
              variant="ghost"
              size="sm"
              className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent text-gray-400 hover:text-gray-600"
              onClick={() => setShowPassword(!showPassword)}
            >
              {showPassword ? (
                <EyeOff className="h-4 w-4" aria-hidden="true" /> // Adjusted to h-4 w-4 standard layout size
              ) : (
                <Eye className="h-4 w-4" aria-hidden="true" />
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

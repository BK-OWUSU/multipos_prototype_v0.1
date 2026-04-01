"use client"

import { useFormContext } from "react-hook-form";
import {Field,FieldLabel, FieldDescription} from "@/components/ui/field"
import { Input } from "@/components/ui/input"

interface FormInputProps {
  name: string;
  label?: string;
  type?: string;
  placeholder?: string;
  hintText?: string,
}

export function FormInput({name, label, type = "text", placeholder, hintText}: FormInputProps)  {
const {register, formState: {errors}} = useFormContext();
const error = errors[name];
  return (
   <Field>
      {label && <FieldLabel htmlFor={name}>{label}</FieldLabel>}
      <Input 
        {...register(name)} 
        id={name} 
        type={type} 
        placeholder={placeholder} 
        className={error ? "border-destructive" : ""}
      />
      {error 
      ?
        <FieldDescription className="text-destructive text-xs font-medium mt-1">{error.message as string}</FieldDescription>
      :
        <FieldDescription className="text-xs font-medium mt-1">{hintText}</FieldDescription>
      }
    </Field>
  )
}

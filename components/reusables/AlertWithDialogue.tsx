"use client"

import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog"
import { AlertWithDiagProps } from "@/types/types"
import CustomButton from "./CustomButton"

export default function AlertWithDialogue({
    buttonText,
    title, 
    message,
    cancelText,
    confirmText, 
    cancelFunction, 
    confirmFunction, 
    buttonVariant,
    customVariant,
    className,
}: AlertWithDiagProps) {
  return (
    <div>
        <AlertDialog>
            <AlertDialogTrigger asChild>
                <CustomButton className={className} customVariant={customVariant} text={buttonText}  variant={buttonVariant ?? "default"}/>
            </AlertDialogTrigger>
            <AlertDialogContent>
                <AlertDialogHeader>
                {title && <AlertDialogTitle>{title}</AlertDialogTitle>}
                {message && <AlertDialogDescription>{message}</AlertDialogDescription>}
                </AlertDialogHeader>
                <AlertDialogFooter>
                {cancelText && <AlertDialogCancel onClick={cancelFunction}>{cancelText}</AlertDialogCancel>}
                <AlertDialogAction onClick={confirmFunction}>{confirmText}</AlertDialogAction>
            </AlertDialogFooter>
            </AlertDialogContent>
        </AlertDialog> 
    </div>
  )
}

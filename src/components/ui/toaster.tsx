"use client"

import { useToast } from "@/hooks/use-toast"
import { CircleAlert, CircleCheck } from "lucide-react"
import {
  Toast,
  ToastClose,
  ToastDescription,
  ToastProvider,
  ToastTitle,
  ToastViewport,
} from "@/components/ui/toast"

export function Toaster() {
  const { toasts } = useToast()

  return (
    <ToastProvider>
      {toasts.map(function ({ id, title, description, action, ...props }) {
        const StatusIcon = props.variant === "destructive" ? CircleAlert : CircleCheck

        return (
          <Toast key={id} {...props}>
            <StatusIcon className="toast-status-icon h-5 w-5 shrink-0" aria-hidden="true" />
            <div className="grid gap-1">
              {title && <ToastTitle>{title}</ToastTitle>}
              {description && (
                <ToastDescription>{description}</ToastDescription>
              )}
            </div>
            {action}
            <ToastClose />
          </Toast>
        )
      })}
      <ToastViewport />
    </ToastProvider>
  )
}

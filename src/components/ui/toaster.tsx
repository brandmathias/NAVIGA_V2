"use client"

import { useToast, type ToastTone } from "@/hooks/use-toast"
import { CircleAlert, CircleCheck, ClipboardCheck, Info, LoaderCircle, MessageCircle } from "lucide-react"
import {
  Toast,
  ToastClose,
  ToastDescription,
  ToastProvider,
  ToastTitle,
  ToastViewport,
} from "@/components/ui/toast"

function resolveToastTone(tone: ToastTone | undefined, variant: string | null | undefined): ToastTone {
  if (tone) return tone
  return variant === "destructive" ? "error" : "success"
}

const toastIcons = {
  success: CircleCheck,
  error: CircleAlert,
  info: Info,
  processing: LoaderCircle,
  copy: ClipboardCheck,
  message: MessageCircle,
}

export function Toaster() {
  const { toasts } = useToast()

  return (
    <ToastProvider>
      {toasts.map(function ({ id, title, description, action, tone, ...props }) {
        const resolvedTone = resolveToastTone(tone, props.variant)
        const StatusIcon = toastIcons[resolvedTone]

        return (
          <Toast key={id} {...props} data-tone={resolvedTone}>
            <span className="toast-status-icon" aria-hidden="true">
              <StatusIcon className={resolvedTone === "processing" ? "h-4 w-4 animate-spin" : "h-4 w-4"} strokeWidth={2.25} />
            </span>
            <div className="toast-content">
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

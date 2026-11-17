import { useEffect, useState } from "react"

export type ToastKind = 'success' | 'error' | 'warning' | 'info'

export type Toast = {
    id: number,
    kind: ToastKind,
    message: string
}

const DURATION = 4000

let toasts: Toast[] = []
let nextId = 1

const listeners = new Set<(current: Toast[]) => void>()

function publish(): void {
    listeners.forEach(listener => listener(toasts))
}

export function dismissToast(id: number): void {
    toasts = toasts.filter(item => item.id !== id)
    publish()
}

function show(kind: ToastKind, message: string): void {
    const id = nextId++

    toasts = [...toasts, { id, kind, message }]
    publish()
    setTimeout(() => dismissToast(id), DURATION)
}

export const toast = {
    success: (message: string) => show('success', message),
    error: (message: string) => show('error', message),
    warning: (message: string) => show('warning', message),
    info: (message: string) => show('info', message)
}

export function useToasts(): Toast[] {
    const [current, setCurrent] = useState(toasts)

    useEffect(() => {
        listeners.add(setCurrent)
        setCurrent(toasts)

        return () => {
            listeners.delete(setCurrent)
        }
    }, [])

    return current
}

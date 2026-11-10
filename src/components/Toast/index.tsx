import { dismissToast, useToasts } from "./store"

import "./Toast.css"

export default function Toaster() {
    const toasts = useToasts()

    if (toasts.length === 0) {
        return null
    }

    return (
        <div className="toaster">
            {toasts.map(item => (
                <div key={item.id} className={`toast-card toast-${item.kind}`}>
                    <span className="toast-message">{item.message}</span>
                    <button type="button" className="toast-close" onClick={() => dismissToast(item.id)} aria-label="Fermer">×</button>
                </div>
            ))}
        </div>
    )
}

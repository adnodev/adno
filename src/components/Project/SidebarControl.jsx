import { useEffect, useRef, useState } from "react"

import { FontAwesomeIcon } from "@fortawesome/react-fontawesome"
import { faTableColumns, faCheck } from "@fortawesome/free-solid-svg-icons"

const MODES = [
    { name: 'expanded', label: 'visualizer.sidebar_expanded' },
    { name: 'collapsed', label: 'visualizer.sidebar_collapsed' },
    { name: 'hover', label: 'visualizer.sidebar_hover' }
]

export function SidebarControl({ mode, setMode, translate }) {
    const [open, setOpen] = useState(false)
    const rootRef = useRef(null)

    useEffect(() => {
        if (!open) {
            return
        }

        const close = (event) => {
            if (!rootRef.current || !rootRef.current.contains(event.target)) {
                setOpen(false)
            }
        }

        const escape = (event) => {
            if (event.key === 'Escape') {
                setOpen(false)
            }
        }

        document.addEventListener('pointerdown', close)
        document.addEventListener('keydown', escape)

        return () => {
            document.removeEventListener('pointerdown', close)
            document.removeEventListener('keydown', escape)
        }
    }, [open])

    return (
        <div className="sidebar-control" ref={rootRef}>
            <button type="button"
                className="sidebar-control-btn"
                aria-haspopup="menu"
                aria-expanded={open}
                aria-label={translate('visualizer.sidebar_control')}
                onClick={() => setOpen(!open)}>
                <FontAwesomeIcon icon={faTableColumns} />
            </button>

            {open &&
                <div className="sidebar-menu" role="menu">
                    <p className="sidebar-menu-title">{translate('visualizer.sidebar_control')}</p>

                    {MODES.map(item =>
                        <button type="button"
                            key={item.name}
                            role="menuitemradio"
                            aria-checked={mode === item.name}
                            className="sidebar-menu-item"
                            onClick={() => {
                                setMode(item.name)
                                setOpen(false)
                            }}>
                            <span className="sidebar-menu-mark">
                                {mode === item.name && <FontAwesomeIcon icon={faCheck} />}
                            </span>
                            {translate(item.label)}
                        </button>
                    )}
                </div>
            }
        </div>
    )
}

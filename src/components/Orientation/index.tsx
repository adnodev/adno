import { useEffect, useRef, useState, type KeyboardEvent } from "react"

import { normalizeAngle } from "../../Utils/orientation"
import type { Target } from "../../Utils/targets"
import { AngleInput } from "./AngleInput"
import { InheritToggle } from "./InheritToggle"
import { OrientationDial } from "./OrientationDial"
import { RotatedZonePreview } from "./RotatedZonePreview"

type Translate = (key: string, options?: Record<string, unknown>) => string

type OrientationActions = {
    setRotation(groupId: string, degrees: number | null): void,
    previewRotation(degrees: number): void,
    endPreview(): void
}

type Draft = {
    base: number | null,
    degrees: number
}

type Props = {
    groupId: string,
    rotation: number | null,
    defaultRotation: number | undefined,
    target: Target | null,
    actions: OrientationActions,
    translate: Translate
}

export function OrientationPopover({ groupId, rotation, defaultRotation, target, actions, translate }: Props) {
    const [open, setOpen] = useState(false)
    const rootRef = useRef<HTMLDivElement>(null)

    useEffect(() => {
        if (!open) {
            return
        }

        const closeOnOutsidePress = (event: PointerEvent) => {
            if (rootRef.current && !rootRef.current.contains(event.target as Node)) {
                setOpen(false)
            }
        }

        document.addEventListener('pointerdown', closeOnOutsidePress, true)

        return () => document.removeEventListener('pointerdown', closeOnOutsidePress, true)
    }, [open])

    const [draft, setDraft] = useState<Draft | null>(null)

    const inheritsProjectDefault = rotation === null
    const projectDefaultRotation = normalizeAngle(defaultRotation || 0)

    const storedRotation = inheritsProjectDefault ? projectDefaultRotation : Math.round(rotation)
    const draftIsCurrent = draft !== null && draft.base === rotation
    const rotationShown = draftIsCurrent ? draft.degrees : storedRotation

    useEffect(() => {
        if (open) {
            actions.previewRotation(rotationShown)
        }
    }, [open, rotationShown])

    useEffect(() => {
        if (!open) {
            return
        }

        return () => actions.endPreview()
    }, [open])

    const label = inheritsProjectDefault ? translate('editor.orientation_inherit_value', { degrees: projectDefaultRotation }) : `${rotationShown}°`
    
    const buttonClass = inheritsProjectDefault ? 'btn btn-xs zone-group-angle zone-group-angle--inherited' : 'btn btn-xs zone-group-angle'

    const toggleOpen = () => {
        setOpen(!open)
    }

    const closeOnEscape = (event: KeyboardEvent<HTMLDivElement>) => {
        if (event.key === 'Escape') {
            setOpen(false)
        }
    }

    const showDraft = (degrees: number) => {
        setDraft({
            base: rotation,
            degrees
        })
    }

    const commitRotation = (degrees: number) => {
        showDraft(degrees)
        actions.setRotation(groupId, degrees)
    }

    const toggleInherited = () => {
        const ownRotation = inheritsProjectDefault ? projectDefaultRotation : null

        actions.setRotation(groupId, ownRotation)
    }

    return (
        <div ref={rootRef} className="orientation-root">
            <div className="tooltip tooltip-bottom z-50" data-tip={translate('annotation.orientation')}>
                <button type="button"
                    className={buttonClass}
                    aria-haspopup="dialog"
                    aria-expanded={open}
                    onClick={toggleOpen}>
                    {label}
                </button>
            </div>

            {open &&
                <div className="orientation-popover" role="dialog" onKeyDown={closeOnEscape}>
                    <InheritToggle
                        checked={inheritsProjectDefault}
                        label={translate('editor.orientation_inherit')}
                        onToggle={toggleInherited} />

                    <div className="orientation-popover-row">
                        <OrientationDial
                            value={rotationShown}
                            disabled={inheritsProjectDefault}
                            label={translate('editor.orientation_dial')}
                            onPreview={showDraft}
                            onCommit={commitRotation} />

                        <RotatedZonePreview target={target} degrees={rotationShown} />
                    </div>

                    <div className="orientation-popover-row">
                        <AngleInput
                            value={storedRotation}
                            disabled={inheritsProjectDefault}
                            label={translate('editor.orientation_degrees')}
                            onCommit={commitRotation} />
                        <span>°</span>
                    </div>

                    <p className="orientation-hint">{translate('editor.orientation_free_hint')}</p>
                </div>
            }
        </div>
    )
}

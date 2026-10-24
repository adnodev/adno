import type { FocusEvent, KeyboardEvent } from "react"

import { normalizeAngle } from "../../Utils/orientation"
import { FINE_STEP, SNAP_STEP, VERTICAL_ARROW_DIRECTIONS, stepAngle } from "./dial"

type Props = {
    value: number,
    disabled: boolean,
    label: string,
    onCommit(degrees: number): void
}

export function AngleInput({ value, disabled, label, onCommit }: Props) {
    const commitTyped = (input: HTMLInputElement) => {
        const typed = parseInt(input.value, 10)

        if (isNaN(typed)) {
            input.value = String(value)
            return
        }

        onCommit(normalizeAngle(typed))
    }

    const commitOnBlur = (event: FocusEvent<HTMLInputElement>) => {
        commitTyped(event.currentTarget)
    }

    const commitOnKeys = (event: KeyboardEvent<HTMLInputElement>) => {
        const direction = VERTICAL_ARROW_DIRECTIONS[event.key]

        if (event.key === 'Enter') {
            commitTyped(event.currentTarget)
            return
        }

        if (direction === undefined) {
            return
        }

        event.preventDefault()
        onCommit(stepAngle(value, direction * (event.shiftKey ? SNAP_STEP : FINE_STEP)))
    }

    return (
        <input type="number"
            key={value}
            className="input input-xs input-bordered orientation-angle-input"
            inputMode="numeric"
            aria-label={label}
            disabled={disabled}
            defaultValue={value}
            onBlur={commitOnBlur}
            onKeyDown={commitOnKeys} />
    )
}

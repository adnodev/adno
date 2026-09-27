import { CONTENT_POSITIONS } from "../../Utils/project"

import "./ContentPositionPicker.css"

export function ContentPositionPicker({ position, onChange, translate }) {
    const current = position || 'left'

    return (
        <div className="position-picker">
            {CONTENT_POSITIONS.map(value =>
                <button key={value}
                    type="button"
                    className={value === current ? "position-option position-option--selected" : "position-option"}
                    onClick={() => onChange(value)}>
                    <span className={`position-preview position-preview--${value}`}>
                        <span className="position-preview-margin" />
                    </span>
                    <span className="position-option-label">{translate('project.settings.content_position_' + value)}</span>
                </button>
            )}
        </div>
    )
}

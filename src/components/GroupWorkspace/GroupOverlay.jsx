const CORNERS = ["tl", "tr", "bl", "br"]

export function GroupOverlay({ letter, color, count, translate }) {
    return (
        <div className="group-overlay">
            <span className="group-overlay-badge" style={{ background: color }}>
                {translate('editor.group_label', { letter, count })}
            </span>

            {count > 1 &&
                <div className="group-overlay-frame" style={{ borderColor: color }}>
                    {CORNERS.map(corner =>
                        <span key={corner}
                            className={`group-overlay-corner group-overlay-corner--${corner}`}
                            style={{ borderColor: color }} />
                    )}
                </div>
            }
        </div>
    )
}

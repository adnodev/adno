const CORNERS = ["tl", "tr", "bl", "br"]

export function GroupBadge({ letter, color, count, translate, className }) {
    return (
        <span className={["group-badge", className].filter(Boolean).join(" ")} style={{ background: color }}>
            {translate('editor.group_label', { letter, zones: count })}
        </span>
    )
}

export function GroupOverlay({ letter, color, count, translate }) {
    return (
        <div className="group-overlay">
            <GroupBadge letter={letter}
                color={color}
                count={count}
                translate={translate}
                className="group-overlay-badge" />

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

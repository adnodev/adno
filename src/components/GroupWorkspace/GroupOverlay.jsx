const CORNERS = ["tl", "tr", "bl", "br"]

export function GroupBadge({ letter, color, count, translate, className }) {
    return (
        <span className={["group-badge", className].filter(Boolean).join(" ")} style={{ background: color }}>
            {translate('editor.group_label', { letter, zones: count })}
        </span>
    )
}

export function GroupMark({ letter, count, className }) {
    return (
        <span className={["group-mark", className].filter(Boolean).join(" ")}>
            {letter}<sup>{count}</sup>
        </span>
    )
}

export function GroupLegend({ groups, activeGroupId, translate }) {
    return (
        <div className="group-legend">
            {groups.map(group =>
                <GroupBadge key={group.id}
                    letter={group.letter}
                    color={group.color}
                    count={group.targets.length}
                    translate={translate}
                    className={group.id === activeGroupId ? "group-legend-item group-legend-item--active" : "group-legend-item"} />
            )}
        </div>
    )
}

export function GroupOverlay({ letter, count, showMark }) {
    return (
        <div className="group-overlay">
            {showMark &&
                <GroupMark letter={letter}
                    count={count}
                    className="group-overlay-mark" />
            }

            {count > 1 &&
                <div className="group-overlay-frame">
                    {CORNERS.map(corner =>
                        <span key={corner}
                            className={`group-overlay-corner group-overlay-corner--${corner}`} />
                    )}
                </div>
            }
        </div>
    )
}

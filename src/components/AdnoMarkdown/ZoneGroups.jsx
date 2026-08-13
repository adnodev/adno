import { FontAwesomeIcon } from "@fortawesome/react-fontawesome"
import { faCrosshairs, faPlus, faTrash } from "@fortawesome/free-solid-svg-icons"

import { deriveGroups, groupColor, groupLetter, groupRotation } from "../../Utils/groups"
import { getGroupCutout } from "../../Utils/cutout"
import { getTargets } from "../../Utils/targets"
import { ZonePreview } from "./ZonePreview"

const QUARTER_TURNS = [0, 90, 180, 270]

function withDraft(groups, draftGroupId) {
    if (!draftGroupId || groups.some(group => group.id === draftGroupId)) {
        return groups
    }

    return [...groups, {
        id: draftGroupId,
        letter: groupLetter(groups.length),
        color: groupColor(groups.length),
        targets: []
    }]
}

function ZoneGroupCard({ group, annotation, total, selectedTargetIndex, pickZone, removeZone, addZone, setRotation, captureRotation, setCutout, translate }) {
    const rotation = groupRotation(annotation, group.id)
    const cutout = getGroupCutout(annotation, group.id)
    const isFreeAngle = rotation !== null && !QUARTER_TURNS.includes(rotation)

    return (
        <div className="zone-group" style={{ borderLeftColor: group.color }}>
            <div className="zone-group-head">
                <span className="zone-group-badge" style={{ background: group.color }}>{group.letter}</span>
                <span className="zone-group-count">&middot;&nbsp;{group.targets.length}</span>

                <select className="select select-xs zone-group-rotation"
                    value={rotation === null ? '' : String(rotation)}
                    onChange={event => setRotation(group.id, event.target.value === '' ? null : Number(event.target.value))}>
                    <option value="">{translate('editor.orientation_inherit')}</option>
                    {QUARTER_TURNS.map(degrees => <option key={degrees} value={degrees}>{degrees}&deg;</option>)}
                    {isFreeAngle && <option value={rotation}>{rotation}&deg;</option>}
                </select>

                <button type="button"
                    className="btn btn-xs"
                    aria-label={translate('editor.orientation_capture')}
                    onClick={() => captureRotation(group.id)}>
                    <FontAwesomeIcon icon={faCrosshairs} />
                </button>

                <label className="zone-group-cutout">
                    <input type="checkbox"
                        className="toggle toggle-xs"
                        checked={cutout}
                        onChange={() => setCutout(group.id, !cutout)} />
                    <span>{translate('editor.cutout')}</span>
                </label>
            </div>

            <div className="zone-list">
                {group.targets.map(({ target, index }) =>
                    <div className={index === selectedTargetIndex ? "zone-row zone-row--current" : "zone-row"}
                        key={`zone-${index}`}
                        onClick={() => pickZone(index)}>
                        <ZonePreview target={target} />
                        <button type="button"
                            className="btn btn-xs btn-outline btn-error"
                            disabled={total < 2}
                            onClick={event => {
                                event.stopPropagation()
                                removeZone(index)
                            }}>
                            <div className="tooltip tooltip-left z-50" data-tip={translate('annotation.delete_zone')}>
                                <FontAwesomeIcon icon={faTrash} />
                            </div>
                        </button>
                    </div>
                )}

                <button type="button"
                    className="zone-row zone-row--add"
                    aria-label={translate('annotation.add_zone')}
                    onClick={() => addZone(group.id)}>
                    <FontAwesomeIcon icon={faPlus} />
                </button>
            </div>
        </div>
    )
}

export function ZoneGroups({ annotation, draftGroupId, selectedTargetIndex, pickZone, removeZone, addGroup, addZone, setRotation, captureRotation, setCutout, translate }) {
    const groups = withDraft(deriveGroups(annotation), draftGroupId)
    const total = getTargets(annotation).length

    return (
        <div className="zone-groups">
            {groups.map(group =>
                <ZoneGroupCard key={group.id}
                    group={group}
                    annotation={annotation}
                    total={total}
                    selectedTargetIndex={selectedTargetIndex}
                    pickZone={pickZone}
                    removeZone={removeZone}
                    addZone={addZone}
                    setRotation={setRotation}
                    captureRotation={captureRotation}
                    setCutout={setCutout}
                    translate={translate} />
            )}

            <button type="button" className="btn btn-sm btn-outline zone-group-add" onClick={() => addGroup()}>
                <FontAwesomeIcon icon={faPlus} /> &nbsp; {translate('editor.add_group')}
            </button>
        </div>
    )
}

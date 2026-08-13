import { FontAwesomeIcon } from "@fortawesome/react-fontawesome"
import { faCrosshairs, faGripVertical, faPlus, faTrash } from "@fortawesome/free-solid-svg-icons"

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

function dragSource(node) {
    const chip = node.closest('[data-zone-index]')

    if (chip) {
        return { kind: 'zone', index: Number(chip.getAttribute('data-zone-index')) }
    }

    const grip = node.closest('[data-group-grip]')

    return grip ? { kind: 'group', id: grip.getAttribute('data-group-grip') } : null
}

function dropTarget(node) {
    const chip = node.closest('[data-zone-index]')

    if (chip) {
        return {
            kind: 'zone',
            index: Number(chip.getAttribute('data-zone-index')),
            groupId: chip.getAttribute('data-zone-group')
        }
    }

    const card = node.closest('[data-group-id]')

    return card ? { kind: 'group', id: card.getAttribute('data-group-id') } : null
}

function orderWith(groups, movedId, beforeId) {
    return groups
        .map(group => group.id)
        .filter(id => id !== movedId)
        .flatMap(id => id === beforeId ? [movedId, id] : [id])
}

function applyDrop(source, spot, groups, moveZone, orderGroups) {
    if (source.kind === 'group') {
        const before = spot.kind === 'group' ? spot.id : spot.groupId

        if (before && before !== source.id) {
            orderGroups(orderWith(groups, source.id, before))
        }

        return
    }

    if (spot.kind === 'zone') {
        moveZone(source.index, spot.index, spot.groupId)
        return
    }

    const group = groups.find(item => item.id === spot.id)
    const tail = group && group.targets.length > 0
        ? group.targets[group.targets.length - 1].index + 1
        : source.index

    moveZone(source.index, tail, spot.id)
}

function ZoneGroupCard({ group, annotation, total, selectedTargetIndex, pickZone, removeZone, addZone, setRotation, captureRotation, setCutout, translate }) {
    const rotation = groupRotation(annotation, group.id)
    const cutout = getGroupCutout(annotation, group.id)
    const isFreeAngle = rotation !== null && !QUARTER_TURNS.includes(rotation)

    return (
        <div className="zone-group" data-group-id={group.id} style={{ borderLeftColor: group.color }}>
            <div className="zone-group-head">
                <span className="zone-group-grip"
                    draggable="true"
                    data-group-grip={group.id}
                    aria-label={translate('editor.move_group')}>
                    <FontAwesomeIcon icon={faGripVertical} />
                </span>

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
                        draggable="true"
                        data-zone-index={index}
                        data-zone-group={group.id}
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

export function ZoneGroups({ annotation, draftGroupId, selectedTargetIndex, pickZone, removeZone, addGroup, addZone, moveZone, orderGroups, setRotation, captureRotation, setCutout, translate }) {
    const groups = withDraft(deriveGroups(annotation), draftGroupId)
    const total = getTargets(annotation).length

    const startDrag = (event) => {
        const source = dragSource(event.target)

        if (!source) {
            event.preventDefault()
            return
        }

        event.dataTransfer.effectAllowed = 'move'
        event.dataTransfer.setData('text/plain', JSON.stringify(source))
    }

    const allowDrop = (event) => {
        if (dropTarget(event.target)) {
            event.preventDefault()
            event.dataTransfer.dropEffect = 'move'
        }
    }

    const handleDrop = (event) => {
        const spot = dropTarget(event.target)
        const raw = event.dataTransfer.getData('text/plain')

        if (!spot || !raw) {
            return
        }

        event.preventDefault()
        applyDrop(JSON.parse(raw), spot, groups, moveZone, orderGroups)
    }

    return (
        <div className="zone-groups"
            onDragStart={startDrag}
            onDragOver={allowDrop}
            onDrop={handleDrop}>

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

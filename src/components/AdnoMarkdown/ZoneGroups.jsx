import { useState } from "react"

import { FontAwesomeIcon } from "@fortawesome/react-fontawesome"
import { faCheck, faCopy, faCrosshairs, faPlus, faTrash } from "@fortawesome/free-solid-svg-icons"

import { copyToClipboard } from "../../Utils/clipboard"
import { deriveGroups, groupColor, groupLetter, groupRotation } from "../../Utils/groups"
import { getGroupCutout } from "../../Utils/cutout"
import { imageApiUrl } from "../../Utils/imageApi"
import { QUARTER_TURNS } from "../../Utils/orientation"
import { getTargets } from "../../Utils/targets"
import { ZonePreview } from "./ZonePreview"

function withDraft(groups, draftGroupId, palette) {
    if (!draftGroupId || groups.some(group => group.id === draftGroupId)) {
        return groups
    }

    return [...groups, {
        id: draftGroupId,
        letter: groupLetter(groups.length),
        color: groupColor(groups.length, palette),
        targets: []
    }]
}

function dragSource(node) {
    const chip = node.closest('[data-zone-index]')

    return chip ? { kind: 'zone', index: Number(chip.getAttribute('data-zone-index')) } : null
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

function applyDrop(source, spot, moveZone, regroupZone) {
    if (spot.kind === 'zone') {
        moveZone(source.index, spot.index, spot.groupId)
        return
    }

    regroupZone(source.index, spot.id)
}

function ZoneGroupCard({ group, annotation, images, total, selectedTargetIndex, actions, translate }) {
    const [copiedZone, setCopiedZone] = useState(null)

    const rotation = groupRotation(annotation, group.id)
    const cutout = getGroupCutout(annotation, group.id)
    const isFreeAngle = rotation !== null && !QUARTER_TURNS.includes(rotation)

    const copyZoneUrl = (url, index) => {
        copyToClipboard(url)
        setCopiedZone(index)
        setTimeout(() => setCopiedZone(null), 2000)
    }

    return (
        <div className="zone-group" data-group-id={group.id} style={{ borderLeftColor: group.color }}>
            <div className="zone-group-head">
                <span className="zone-group-badge" style={{ background: group.color }}>{group.letter}</span>
                <span className="zone-group-count">&middot;&nbsp;{group.targets.length}</span>

                <span className="zone-group-actions">
                    <div className="tooltip tooltip-bottom z-50" data-tip={translate('annotation.orientation')}>
                        <select className="select select-xs zone-group-rotation"
                            value={rotation === null ? '' : String(rotation)}
                            onChange={event => actions.setRotation(group.id, event.target.value === '' ? null : Number(event.target.value))}>
                            <option value="">{translate('editor.orientation_inherit')}</option>
                            {QUARTER_TURNS.map(degrees => <option key={degrees} value={degrees}>{degrees}&deg;</option>)}
                            {isFreeAngle && <option value={rotation}>{rotation}&deg;</option>}
                        </select>
                    </div>

                    <button type="button"
                        className="btn btn-xs"
                        aria-label={translate('editor.orientation_capture')}
                        onClick={() => actions.captureRotation(group.id)}>
                        <div className="tooltip tooltip-bottom z-50" data-tip={translate('editor.orientation_capture')}>
                            <FontAwesomeIcon icon={faCrosshairs} />
                        </div>
                    </button>

                    <label className="zone-group-cutout">
                        <input type="checkbox"
                            className="toggle toggle-xs"
                            checked={cutout}
                            onChange={() => actions.setCutout(group.id, !cutout)} />
                        <span>{translate('editor.cutout')}</span>
                    </label>
                </span>
            </div>

            <div className="zone-list">
                {group.targets.map(({ target, index }) => {
                    const url = imageApiUrl(target, images || [], rotation)

                    return <div className={index === selectedTargetIndex ? "zone-row zone-row--current" : "zone-row"}
                        key={`zone-${index}`}
                        draggable="true"
                        data-zone-index={index}
                        data-zone-group={group.id}
                        onClick={() => actions.pickZone(index)}>
                        <ZonePreview target={target} />

                        {url &&
                            <button type="button"
                                className="btn btn-xs btn-outline"
                                onClick={event => {
                                    event.stopPropagation()
                                    copyZoneUrl(url, index)
                                }}>
                                <div className="tooltip tooltip-left z-50" data-tip={translate('annotation.copy_zone_url')}>
                                    <FontAwesomeIcon icon={copiedZone === index ? faCheck : faCopy} />
                                </div>
                            </button>
                        }

                        <button type="button"
                            className="btn btn-xs btn-outline btn-error"
                            disabled={total < 2}
                            onClick={event => {
                                event.stopPropagation()
                                actions.removeZone(index)
                            }}>
                            <div className="tooltip tooltip-left z-50" data-tip={translate('annotation.delete_zone')}>
                                <FontAwesomeIcon icon={faTrash} />
                            </div>
                        </button>
                    </div>
                })}

                <button type="button"
                    className="zone-row zone-row--add"
                    aria-label={translate('annotation.add_zone')}
                    onClick={() => actions.addZone(group.id)}>
                    <FontAwesomeIcon icon={faPlus} />
                </button>
            </div>
        </div>
    )
}

export function ZoneGroups({ annotation, groupColors, images, draftGroupId, selectedTargetIndex, pickZone, removeZone, addGroup, addZone, moveZone, regroupZone, setRotation, captureRotation, setCutout, translate }) {
    const groups = withDraft(deriveGroups(annotation, groupColors), draftGroupId, groupColors)
    const total = getTargets(annotation).length
    const actions = { pickZone, removeZone, addZone, setRotation, captureRotation, setCutout }

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
        applyDrop(JSON.parse(raw), spot, moveZone, regroupZone)
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
                    images={images}
                    total={total}
                    selectedTargetIndex={selectedTargetIndex}
                    actions={actions}
                    translate={translate} />
            )}

            <button type="button" className="btn btn-sm btn-outline zone-group-add" onClick={() => addGroup()}>
                <FontAwesomeIcon icon={faPlus} /> &nbsp; {translate('editor.add_group')}
            </button>
        </div>
    )
}

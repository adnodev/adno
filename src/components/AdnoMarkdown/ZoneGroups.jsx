import { Fragment, useState } from "react"

import { FontAwesomeIcon } from "@fortawesome/react-fontawesome"
import { faCheck, faCopy, faPlus, faTrash, faTriangleExclamation } from "@fortawesome/free-solid-svg-icons"

import { copyToClipboard } from "../../Utils/clipboard"
import { MAX_GROUPS, deriveGroups, groupColor, groupLetter, groupRotation } from "../../Utils/groups"
import { getGroupCutout } from "../../Utils/cutout"
import { imageApiUrl } from "../../Utils/imageApi"
import { getTargets } from "../../Utils/targets"
import { OrientationPopover } from "../Orientation"
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

function degradedNotice(link, translate) {
    if (!link.degraded) {
        return null
    }

    if (link.applied === 0) {
        return translate('annotation.copy_zone_url_unrotated', { requested: link.requested })
    }

    return translate('annotation.copy_zone_url_rounded', { requested: link.requested, applied: link.applied })
}

function CopyZoneButton({ link, copied, onCopy, translate }) {
    const buttonClass = link.degraded ? 'btn btn-xs btn-outline btn-warning' : 'btn btn-xs btn-outline'
    const idleIcon = link.degraded ? faTriangleExclamation : faCopy
    const icon = copied ? faCheck : idleIcon

    return (
        <button type="button" className={buttonClass} onClick={onCopy}>
            <div className="tooltip tooltip-left z-50" data-tip={translate('annotation.copy_zone_url')}>
                <FontAwesomeIcon icon={icon} />
            </div>
        </button>
    )
}

function ZoneGroupCard({ group, annotation, images, total, selectedTargetIndex, defaultRotation, actions, translate }) {
    const [copiedZone, setCopiedZone] = useState(null)

    const rotation = groupRotation(annotation, group.id)
    const cutout = getGroupCutout(annotation, group.id)
    const firstTarget = group.targets[0]?.target ?? null

    const copyZoneUrl = (url, index) => {
        copyToClipboard(url)
        setCopiedZone(index)
        setTimeout(() => setCopiedZone(null), 4000)
    }

    return (
        <div className="zone-group" data-group-id={group.id} style={{ borderLeftColor: group.color }}>
            <div className="zone-group-head">
                <span className="zone-group-badge" style={{ background: group.color }}>{group.letter}</span>
                <span className="zone-group-count">&middot;&nbsp;{group.targets.length}</span>

                <span className="zone-group-actions">
                    <OrientationPopover
                        groupId={group.id}
                        rotation={rotation}
                        defaultRotation={defaultRotation}
                        target={firstTarget}
                        actions={actions}
                        translate={translate} />

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
                    const link = imageApiUrl(target, images || [], rotation)
                    const notice = copiedZone === index && link ? degradedNotice(link, translate) : null

                    return <Fragment key={`zone-${index}`}>
                        <div className={index === selectedTargetIndex ? "zone-row zone-row--current" : "zone-row"}
                            draggable="true"
                            data-zone-index={index}
                            data-zone-group={group.id}
                            onClick={() => actions.pickZone(index)}>
                            <ZonePreview target={target} />

                            {link &&
                                <CopyZoneButton
                                    link={link}
                                    copied={copiedZone === index}
                                    onCopy={event => {
                                        event.stopPropagation()
                                        copyZoneUrl(link.url, index)
                                    }}
                                    translate={translate} />
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

                        {notice && <p className="zone-notice">{notice}</p>}
                    </Fragment>
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

export function ZoneGroups({ annotation, groupColors, images, draftGroupId, selectedTargetIndex, defaultRotation, pickZone, removeZone, addGroup, addZone, moveZone, regroupZone, setRotation, previewRotation, endPreview, setCutout, translate }) {

    const groups = withDraft(deriveGroups(annotation, groupColors), draftGroupId, groupColors)
    const total = getTargets(annotation).length

    const actions = { pickZone, removeZone, addZone, setRotation, previewRotation, endPreview, setCutout }

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
                    defaultRotation={defaultRotation}
                    actions={actions}
                    translate={translate} />
            )}

            {groups.length < MAX_GROUPS &&
                <button type="button" className="btn btn-sm btn-outline zone-group-add" onClick={() => addGroup()}>
                    <FontAwesomeIcon icon={faPlus} /> &nbsp; {translate('editor.add_group')}
                </button>
            }
        </div>
    )
}

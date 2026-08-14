import { Component } from "react"

import { applyGroupColors, groupBox, groupRotation } from "../../Utils/groups"
import { imageIndexForSource, imageTileSource, projectImages } from "../../Utils/images"
import { toShadow } from "../../Utils/targets"

import { GroupOverlay } from "./GroupOverlay"

const TILE_CACHE = 40
const FRAME_PADDING = 0.08

class GroupPanel extends Component {
    componentDidMount() {
        const images = projectImages(this.props.project)
        const first = this.props.group.targets[0]
        const index = imageIndexForSource(images, first ? first.target.source : null)

        this.viewer = OpenSeadragon({
            id: this.props.elementId,
            tileSources: imageTileSource(images[index]),
            crossOriginPolicy: 'Anonymous',
            showNavigationControl: false,
            maxImageCacheCount: TILE_CACHE
        })

        this.annotorious = OpenSeadragon.Annotorious(this.viewer, {
            readOnly: true,
            disableEditor: true,
            disableSelect: true
        })

        this.viewer.addOnceHandler('open', this.frameGroup)
        this.viewer.addHandler('after-resize', this.frameGroup)
    }

    componentDidUpdate(prevProps) {
        if (prevProps.annotation !== this.props.annotation || prevProps.group !== this.props.group) {
            this.frameGroup()
        }
    }

    componentWillUnmount() {
        cancelAnimationFrame(this._paintFrame)
        this.annotorious.destroy()
        this.viewer.destroy()
    }

    frameGroup = () => {
        const { annotation, group } = this.props
        const box = groupBox(annotation, group.id)

        if (!this.viewer || !this.viewer.isOpen() || !box) {
            return
        }

        this.annotorious.setAnnotations(group.targets.map(entry =>
            toShadow(annotation, entry.target, entry.index)))

        const marginX = box.width * FRAME_PADDING
        const marginY = box.height * FRAME_PADDING
        const viewport = this.viewer.viewport

        viewport.setRotation(groupRotation(annotation, group.id) || 0, true)
        viewport.fitBounds(viewport.imageToViewportRectangle(
            box.x - marginX,
            box.y - marginY,
            box.width + marginX * 2,
            box.height + marginY * 2
        ), true)

        cancelAnimationFrame(this._paintFrame)
        this._paintFrame = requestAnimationFrame(() =>
            applyGroupColors(this.viewer.element, annotation))
    }

    render() {
        return (
            <div className="group-panel">
                <div id={this.props.elementId} className="group-panel-body"></div>
                <GroupOverlay
                    letter={this.props.group.letter}
                    color={this.props.group.color}
                    count={this.props.group.targets.length}
                    translate={this.props.translate} />
            </div>
        )
    }
}

export default GroupPanel

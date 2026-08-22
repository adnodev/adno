import { Component } from "react"

import { applyGroupColors } from "../../Utils/groups"
import { CROSS_ORIGIN, frameGroup } from "../../Utils/viewport"
import { imageIndexForSource, imageTileSource, projectImages } from "../../Utils/images"

import { GroupOverlay } from "./GroupOverlay"

const TILE_CACHE = 40

class GroupPanel extends Component {
    componentDidMount() {
        const images = projectImages(this.props.project)
        const first = this.props.group.targets[0]
        const index = imageIndexForSource(images, first ? first.target.source : null)

        this.viewer = OpenSeadragon({
            id: this.props.elementId,
            tileSources: imageTileSource(images[index]),
            crossOriginPolicy: this.props.crossOriginPolicy ?? CROSS_ORIGIN,
            showNavigationControl: false,
            maxImageCacheCount: TILE_CACHE
        })

        this.annotorious = OpenSeadragon.Annotorious(this.viewer, {
            readOnly: true,
            disableEditor: true,
            disableSelect: true
        })

        this.viewer.addOnceHandler('open', this.refresh)
        this.viewer.addHandler('after-resize', this.refresh)
    }

    componentDidUpdate(prevProps) {
        if (prevProps.annotation !== this.props.annotation || prevProps.group !== this.props.group) {
            this.refresh()
        }
    }

    componentWillUnmount() {
        cancelAnimationFrame(this._paintFrame)
        this.annotorious.destroy()
        this.viewer.destroy()
    }

    refresh = () => {
        const { annotation, group } = this.props

        if (!frameGroup(this.viewer, this.annotorious, annotation, group.id)) {
            return
        }

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

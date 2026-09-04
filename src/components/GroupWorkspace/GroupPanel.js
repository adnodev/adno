import { Component } from "react"

import { scheduleGroupColors } from "../../Utils/groups"
import { frameGroup, mountReadOnlyViewer } from "../../Utils/viewport"
import { imageIndexForSource, imageTileSource, projectImages } from "../../Utils/images"

import { GroupOverlay } from "./GroupOverlay"

class GroupPanel extends Component {
    componentDidMount() {
        const images = projectImages(this.props.project)
        const first = this.props.group.targets[0]
        const index = imageIndexForSource(images, first?.target.source)

        const { viewer, annotorious } = mountReadOnlyViewer(this.props.elementId, imageTileSource(images[index]), this.props.crossOriginPolicy, {
            disableSelect: true
        })

        this.viewer = viewer
        this.annotorious = annotorious

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

        this._paintFrame = scheduleGroupColors(this._paintFrame, this.viewer.element, annotation)
    }

    render() {
        return (
            <div className="group-panel" style={{ gridArea: this.props.area }}>
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

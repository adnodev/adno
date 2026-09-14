import { Component } from "react"

import { frameGroup, mountReadOnlyViewer } from "../../Utils/viewport"
import { imageIndexForSource, imageTileSource, projectImages } from "../../Utils/images"
import { annotationShapes } from "../../Utils/utils"

import { GroupOverlay } from "./GroupOverlay"

class GroupPanel extends Component {
    componentDidMount() {
        const images = projectImages(this.props.project)
        const first = this.props.group.targets[0]
        const index = imageIndexForSource(images, first?.target.source)

        const { viewer, annotorious } = mountReadOnlyViewer(this.props.elementId, imageTileSource(images[index]), this.props.crossOriginPolicy, {
            disableSelect: true,
            formatters: () => this.props.styles
        })

        this.viewer = viewer
        this.annotorious = annotorious

        this.viewer.addOnceHandler('open', this.reframe)
        this.viewer.addHandler('after-resize', this.reframe)
    }

    componentDidUpdate(prevProps) {
        if (prevProps.annotation !== this.props.annotation || prevProps.group.id !== this.props.group.id) {
            this.frame(this.props.transition)
        } else if (prevProps.outlinesVisible !== this.props.outlinesVisible) {
            this.applyOutlines()
        }
    }

    componentWillUnmount() {
        cancelAnimationFrame(this._outlinesFrame)
        this.annotorious.destroy()
        this.viewer.destroy()
    }

    frame = (transition) => {
        frameGroup(this.viewer, this.annotorious, this.props.annotation, this.props.group.id, {
            defaultRotation: this.props.defaultRotation,
            transition
        })

        cancelAnimationFrame(this._outlinesFrame)
        this._outlinesFrame = requestAnimationFrame(this.applyOutlines)
    }

    reframe = () => this.frame()

    applyOutlines = () => {
        annotationShapes(this.viewer.element).forEach(shape =>
            [...shape.children].forEach(part => part.classList.toggle('a9s-annotation--hidden', !this.props.outlinesVisible)))
    }

    render() {
        return (
            <div className="group-panel" style={{ gridArea: this.props.area }}>
                <div id={this.props.elementId} className="group-panel-body"></div>
                <GroupOverlay
                    letter={this.props.group.letter}
                    count={this.props.group.targets.length}
                    showMark={this.props.outlinesVisible} />
            </div>
        )
    }
}

export default GroupPanel

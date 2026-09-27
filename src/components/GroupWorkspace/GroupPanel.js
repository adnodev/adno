import { Component } from "react"

import { followContainer, frameGroup, mountReadOnlyViewer } from "../../Utils/viewport"
import { imageIndexForSource, imageTileSource, projectImages } from "../../Utils/images"
import { annotationShapes } from "../../Utils/utils"

import { GroupOverlay } from "./GroupOverlay"

const REVEAL_TIMEOUT = 400

class GroupPanel extends Component {
    constructor(props) {
        super(props)
        this.state = { ready: false }
    }

    componentDidMount() {
        const images = projectImages(this.props.project)
        const first = this.props.group.targets[0]
        const index = imageIndexForSource(images, first?.target.source)

        const { viewer, annotorious } = mountReadOnlyViewer(this.props.elementId, imageTileSource(images[index]), this.props.crossOriginPolicy, {
            disableSelect: true,
            formatters: () => this.props.styles
        }, { autoResize: false })

        this.viewer = viewer
        this.annotorious = annotorious

        this.viewer.addOnceHandler('open', this.reframe)
        this.viewer.addOnceHandler('tile-drawn', this.reveal)
        this._unfollow = followContainer(this.viewer, this.reframe)

        this._revealTimer = setTimeout(this.reveal, REVEAL_TIMEOUT)
    }

    componentDidUpdate(prevProps) {
        if (prevProps.annotation !== this.props.annotation || prevProps.group.id !== this.props.group.id) {
            this.frame(this.props.transition)
        } else if (prevProps.outlinesVisible !== this.props.outlinesVisible) {
            this.applyOutlines()
        }
    }

    componentWillUnmount() {
        clearTimeout(this._revealTimer)
        cancelAnimationFrame(this._outlinesFrame)
        this._unfollow()
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

    reveal = () => {
        clearTimeout(this._revealTimer)

        if (this.state.ready) {
            return
        }

        this.setState({ ready: true })
    }

    applyOutlines = () => {
        annotationShapes(this.viewer.element).forEach(shape =>
            [...shape.children].forEach(part => part.classList.toggle('a9s-annotation--hidden', !this.props.outlinesVisible)))
    }

    render() {
        return (
            <div className={this.state.ready ? "group-panel group-panel--ready" : "group-panel"} style={{ gridArea: this.props.area }}>
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

import { Component } from "react"

import { withTranslation } from "react-i18next"

import { frameGroup, mountReadOnlyViewer } from "../../Utils/viewport"
import { imageIndexForSource, imageTileSource, projectImages } from "../../Utils/images"

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

        this.viewer.addOnceHandler('open', this.refresh)
        this.viewer.addHandler('after-resize', this.refresh)
    }

    componentDidUpdate(prevProps) {
        if (prevProps.annotation !== this.props.annotation || prevProps.group !== this.props.group) {
            this.refresh()
        }
    }

    componentWillUnmount() {
        this.annotorious.destroy()
        this.viewer.destroy()
    }

    refresh = () => {
        frameGroup(this.viewer, this.annotorious, this.props.annotation, this.props.group.id, { defaultRotation: this.props.defaultRotation })
    }

    render() {
        return (
            <div className="group-panel" style={{ gridArea: this.props.area }}>
                <div id={this.props.elementId} className="group-panel-body"></div>
                <GroupOverlay
                    letter={this.props.group.letter}
                    count={this.props.group.targets.length}
                    translate={this.props.t} />
            </div>
        )
    }
}

export default withTranslation()(GroupPanel)

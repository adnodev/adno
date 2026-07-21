import { Component, createRef } from "react";

import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faCropSimple, faDownLeftAndUpRightToCenter, faMinus, faUpDown, faUpRightAndDownLeftFromCenter } from "@fortawesome/free-solid-svg-icons";

import { withTranslation } from "react-i18next";

import { annotationImageBox } from "../../Utils/cutout";
import { getAnnotationRotation } from "../../Utils/orientation";

import "./CutoutView.css";

const TILE_CACHE = 40;
const FRAME_PADDING = 0.06;

const SIZES = [
    { name: 'default', icon: faDownLeftAndUpRightToCenter, label: 'annotation.cutout_size_default' },
    { name: 'tall', icon: faUpDown, label: 'annotation.cutout_size_tall' },
    { name: 'full', icon: faUpRightAndDownLeftFromCenter, label: 'annotation.cutout_size_full' }
];

class CutoutView extends Component {
    constructor(props) {
        super(props);
        this.panelRef = createRef();
        this.drag = null;
    }

    componentDidMount() {
        const project = this.props.project;

        this.viewer = OpenSeadragon({
            id: 'cutout-osd',
            tileSources: project.manifest_url
                ? [project.manifest_url]
                : { type: 'image', url: project.img_url },
            crossOriginPolicy: 'Anonymous',
            showNavigationControl: false,
            maxImageCacheCount: TILE_CACHE
        });

        this.annotorious = OpenSeadragon.Annotorious(this.viewer, {
            readOnly: true,
            disableEditor: true,
            formatters: () => this.props.styles
        });

        this.viewer.addOnceHandler('open', this.frameAnnotation);
        this.viewer.addHandler('after-resize', this.frameAnnotation);
    }

    componentDidUpdate(prevProps) {
        if (prevProps.annotation.id !== this.props.annotation.id) {
            this.frameAnnotation();
        }
    }

    componentWillUnmount() {
        this.annotorious.destroy();
        this.viewer.destroy();
    }

    frameAnnotation = () => {
        const box = annotationImageBox(this.props.annotation);

        if (!this.viewer || !this.viewer.isOpen() || !box) {
            return;
        }

        this.annotorious.setAnnotations([this.props.annotation]);

        const marginX = box.width * FRAME_PADDING;
        const marginY = box.height * FRAME_PADDING;
        const viewport = this.viewer.viewport;

        viewport.setRotation(getAnnotationRotation(this.props.annotation) || 0, true);
        viewport.fitBounds(viewport.imageToViewportRectangle(
            box.x - marginX,
            box.y - marginY,
            box.width + marginX * 2,
            box.height + marginY * 2
        ), true);
    }

    dragSpot = (event) => {
        const { grabX, grabY, width, height, frame } = this.drag;

        return {
            left: Math.min(Math.max(event.clientX - grabX - frame.left, 0), frame.width - width),
            top: Math.min(Math.max(event.clientY - grabY - frame.top, 0), frame.height - height)
        };
    }

    startDrag = (event) => {
        if (event.target.closest('.cutout-btn')) {
            return;
        }

        const panel = this.panelRef.current;
        const box = panel.getBoundingClientRect();
        const frame = panel.parentElement.getBoundingClientRect();

        this.drag = {
            grabX: event.clientX - box.left,
            grabY: event.clientY - box.top,
            width: box.width,
            height: box.height,
            frame
        };

        event.currentTarget.setPointerCapture(event.pointerId);
    }

    moveDrag = (event) => {
        if (!this.drag) {
            return;
        }

        const spot = this.dragSpot(event);
        const panel = this.panelRef.current;

        panel.style.left = `${spot.left}px`;
        panel.style.top = `${spot.top}px`;
        panel.style.bottom = 'auto';
    }

    endDrag = (event) => {
        if (!this.drag) {
            return;
        }

        const spot = this.dragSpot(event);

        this.drag = null;
        event.currentTarget.releasePointerCapture(event.pointerId);
        this.props.setView({ ...this.props.view, position: spot });
    }

    resize = (size) => {
        this.props.setView({ ...this.props.view, size, position: null });
    }

    render() {
        const rotation = getAnnotationRotation(this.props.annotation);
        const { minimized, size, position } = this.props.view;

        const classes = ["cutout-panel", `cutout-panel--${size}`];

        if (minimized) {
            classes.push("cutout-panel--minimized");
        }

        return (
            <>
                <div ref={this.panelRef}
                    className={classes.join(" ")}
                    style={position ? { left: `${position.left}px`, top: `${position.top}px`, bottom: 'auto' } : null}>

                    <div className="cutout-bar"
                        onPointerDown={this.startDrag}
                        onPointerMove={this.moveDrag}
                        onPointerUp={this.endDrag}
                        onPointerCancel={this.endDrag}>

                        <span className="cutout-title">
                            {rotation
                                ? this.props.t('annotation.cutout_rotated', { degrees: rotation })
                                : this.props.t('annotation.cutout_title')}
                        </span>

                        {SIZES.map(preset => (
                            <button type="button"
                                key={preset.name}
                                className={size === preset.name ? "cutout-btn cutout-btn--current" : "cutout-btn"}
                                aria-label={this.props.t(preset.label)}
                                onClick={() => this.resize(preset.name)}>
                                <FontAwesomeIcon icon={preset.icon} size="lg" />
                            </button>
                        ))}

                        <button type="button"
                            className="cutout-btn cutout-btn--minimize"
                            aria-label={this.props.t('annotation.cutout_minimize')}
                            onClick={() => this.props.setView({ ...this.props.view, minimized: true })}>
                            <FontAwesomeIcon icon={faMinus} size="lg" />
                        </button>
                    </div>

                    <div id="cutout-osd" className="cutout-body"></div>
                </div>

                {minimized &&
                    <button type="button"
                        className="cutout-pill"
                        aria-label={this.props.t('annotation.cutout_expand')}
                        onClick={() => this.props.setView({ ...this.props.view, minimized: false })}>
                        <FontAwesomeIcon icon={faCropSimple} size="lg" />
                    </button>
                }
            </>
        )
    }
}

export default withTranslation()(CutoutView);

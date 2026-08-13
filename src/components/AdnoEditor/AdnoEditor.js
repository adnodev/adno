import { Component } from "react";
import { withRouter } from "react-router";

// Import FontAwesome for all icons
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faCheckCircle } from "@fortawesome/free-solid-svg-icons";

// Import SweetAlert
import Swal from "sweetalert2";

// Import CSS
import "./AdnoEditor.css";

// Add translations
import { withTranslation } from "react-i18next";
import { projectDB } from "../../services/db";
import { computeNavigatorInfo } from "../../Utils/utils";
import { applyAnnotationView, watchViewerResize } from "../../Utils/viewport";
import { preserveTargetRotation } from "../../Utils/orientation";
import { buildTargetId, preserveTargetId, targetGroupId } from "../../Utils/groups";
import { imageTileSource, projectImages } from "../../Utils/images";
import { addTarget, getTargets, parseShadowId, replaceTargetAt, targetsOnImage, toShadow, toShadowAnnotations } from "../../Utils/targets";
import AdnoNavigator from '../AdnoNavigator/AdnoNavigator';
import { ImageFilmstrip } from '../ImageFilmstrip/ImageFilmstrip';

class AdnoEditor extends Component {
    constructor(props) {
        super(props);
        this.state = {
            isMovingItem: false,
            pending: null,
            imageRatio: null,
            navigatorLayout: null,
            viewerReady: false,
        }
        this._openToken = 0
    }

    componentDidMount() {
        const selectedProject = this.props.selectedProject;

        if (!selectedProject || !selectedProject.id) {
            return;
        }

        const tileSources = imageTileSource(projectImages(selectedProject)[this.props.currentImageIndex || 0])

        OpenSeadragon.setString("Tooltips.FullPage", this.props.t('editor.fullpage'));
        OpenSeadragon.setString("Tooltips.Home", this.props.t('editor.home'));
        OpenSeadragon.setString("Tooltips.ZoomIn", this.props.t('editor.zoom_in'));
        OpenSeadragon.setString("Tooltips.ZoomOut", this.props.t('editor.zoom_out'));
        OpenSeadragon.setString("Tooltips.NextPage", this.props.t('editor.next_page'));
        OpenSeadragon.setString("Tooltips.PreviousPage", this.props.t('editor.previous_page'));
        OpenSeadragon.setString("Tooltips.RotateLeft", this.props.t('editor.rotate_left'));
        OpenSeadragon.setString("Tooltips.RotateRight", this.props.t('editor.rotate_right'));
        OpenSeadragon.setString("Tooltips.Flip", this.props.t('editor.flip'));

        this.openSeadragon = OpenSeadragon({
            id: 'openseadragon1',
            tileSources: tileSources,
            prefixUrl: 'https://cdn.jsdelivr.net/gh/Benomrans/openseadragon-icons@main/images/',
            // Enable rotation
            toolbar: "toolbar-osd",
            showRotationControl: true,
            showFullPageControl: false,
        });

        if (this.props.onViewerReady) {
            this.props.onViewerReady(this.openSeadragon)
        }

        this.openSeadragon.addOnceHandler('open', () => {
            this.refreshNavigator()
            this.syncShadows()
        });

        this.AdnoAnnotorious = OpenSeadragon.Annotorious(this.openSeadragon, {
            locale: 'auto',
            drawOnSingleClick: true,
            allowEmpty: true,
            disableEditor: true
        });

        this.unwatchResize = watchViewerResize(this.openSeadragon, this.AdnoAnnotorious)

        this.syncShadows()

        Annotorious.SelectorPack(this.AdnoAnnotorious);
        Annotorious.BetterPolygon(this.AdnoAnnotorious);
        Annotorious.Toolbar(this.AdnoAnnotorious, document.getElementById('toolbar-container'));

        // Event triggered by using saveSelected annotorious function
        this.AdnoAnnotorious.on('createAnnotation', (newAnnotation) => {
            const image = this.images()[this.props.currentImageIndex]
            const pending = this.props.pendingZone
            const pendingId = pending ? pending.annotationId : null
            const host = pendingId ? this.props.annotations.find(anno => anno.id === pendingId) : null
            const siblings = getTargets(host)
            const groupId = (pending && pending.groupId) || targetGroupId(siblings[siblings.length - 1])
            const target = {
                ...newAnnotation.target,
                ...(image ? { source: image.source } : {}),
                id: buildTargetId(groupId, pendingId || newAnnotation.id)
            }
            const created = { ...newAnnotation, target }

            const annotations = pendingId
                ? this.props.annotations.map(anno => anno.id === pendingId ? addTarget(anno, target) : anno)
                : [...this.props.annotations, created]

            projectDB.updateAnnotations(selectedProject.id, annotations)
                .then(() => {
                    this.props.updateAnnos(annotations)

                    if (!pendingId) {
                        this.props.changeSelectedAnno(created, 0)
                        return
                    }

                    const extended = annotations.find(anno => anno.id === pendingId)

                    this.props.endPendingZone()
                    this.props.changeSelectedAnno(extended, getTargets(extended).length - 1)
                })
        });

        // Event triggered when drawing a new shape
        this.AdnoAnnotorious.on('createSelection', (annotation) => {
            this.AdnoAnnotorious.saveSelected()
        })

        this.AdnoAnnotorious.on('clickAnnotation', (clicked) => {
            const pending = this.state.pending

            if (!pending) {
                return
            }

            const selected = this.AdnoAnnotorious.getSelected()

            if (!selected || selected.id === clicked.id) {
                return
            }

            const { id, index } = parseShadowId(selected.id)

            if (id !== pending.id) {
                return
            }

            const target = getTargets(pending.annotation)[index]

            this.AdnoAnnotorious.addAnnotation(toShadow(pending.annotation, target, index))
        })

        // Event triggered when user click on an annotation
        this.AdnoAnnotorious.on('selectAnnotation', (shadow) => {
            const { id, index } = parseShadowId(shadow.id)
            const annotation = this.props.annotations.find(anno => anno.id === id)

            if (this.state.pending && this.state.pending.id !== id) {
                this.syncShadows()
                this.savePending()
            }

            this.scrollToCard(id)
            this.props.changeSelectedAnno(annotation || shadow, index)
        })

        // Event triggered when resizing an annotation shape
        this.AdnoAnnotorious.on('changeSelectionTarget', this.applyTargetEdit);
    }

    componentWillUnmount() {
        this.unwatchResize?.()
    }

    images = () => projectImages(this.props.selectedProject)

    currentAnnotations = () => {
        const pending = this.state.pending

        if (!pending) {
            return this.props.annotations
        }

        return this.props.annotations.map(anno => anno.id === pending.id ? pending.annotation : anno)
    }

    refreshNavigator = () => {
        const info = computeNavigatorInfo(this.openSeadragon)

        if (info) {
            this.setState({ ...info, viewerReady: true })
        }
    }

    syncShadows = () => {
        const shadows = toShadowAnnotations(this.currentAnnotations(), this.images(), this.props.currentImageIndex)
        const signature = JSON.stringify(shadows.map(shadow => [shadow.id, shadow.target]))

        if (signature === this._shadowSignature) {
            return
        }

        this._shadowSignature = signature

        this.AdnoAnnotorious.setAnnotations(shadows)
    }

    openImage = (index) => {
        const image = this.images()[index]

        if (!image) {
            return
        }

        const token = ++this._openToken

        this.openSeadragon.addOnceHandler('open', () => {
            if (token !== this._openToken) {
                return
            }

            this.refreshNavigator()
            this.syncShadows()
        })

        this.openSeadragon.open(imageTileSource(image))
    }

    scrollToCard = (id) => {
        const container = document.getElementById("annotations_list")
        const el = document.getElementById(`anno_edit_card_${id}`)

        if (container && el) {
            container.scrollTo({
                top: el.offsetTop - container.clientHeight / 2 + el.clientHeight / 2,
                behavior: "smooth"
            })
        }
    }

    changeAnno = (annotation) => {
        if (!annotation) {
            return
        }

        const onImage = targetsOnImage(annotation, this.images(), this.props.currentImageIndex)
        const wanted = onImage.find(item => item.index === this.props.selectedTargetIndex)
        const picked = wanted || onImage[0]

        if (!picked) {
            return
        }

        const shadow = toShadow(annotation, picked.target, picked.index)

        this.AdnoAnnotorious.selectAnnotation(shadow.id)

        applyAnnotationView(this.openSeadragon, this.AdnoAnnotorious, shadow, {
            defaultRotation: this.props.defaultRotation,
            transition: this.props.rotationTransition
        })

        this.scrollToCard(annotation.id)
    }

    applyTargetEdit = (newTarget) => {
        const current = this.AdnoAnnotorious.getSelected()

        if (!current) {
            return
        }

        const { id, index } = parseShadowId(current.id)
        const pending = this.state.pending
        const base = pending && pending.id === id
            ? pending.annotation
            : this.props.annotations.find(anno => anno.id === id)

        if (!base) {
            return
        }

        const previous = getTargets(base)[index]
        const target = preserveTargetId(previous, preserveTargetRotation(previous, newTarget))

        this.setState({
            isMovingItem: true,
            pending: { id, annotation: replaceTargetAt(base, index, target) }
        })
    }

    savePending = () => {
        const pending = this.state.pending

        if (!pending) {
            return Promise.resolve(false)
        }

        const newAnnos = this.currentAnnotations()

        this.props.updateAnnos(newAnnos)
        this.setState({ isMovingItem: false, pending: null })

        return projectDB.updateAnnotations(this.props.match.params.id, newAnnos).then(() => true)
    }

    validateMove = () => {
        this.savePending().then(saved => {
            if (!saved) {
                return
            }

            Swal.fire({
                title: this.props.t('modal.annotation_moved'),
                showCancelButton: false,
                showConfirmButton: true,
                confirmButtonText: 'OK',
                icon: 'success'
            })
        })
    }

    componentDidUpdate(prevProps) {
        if (prevProps.currentImageIndex !== this.props.currentImageIndex) {
            this.openImage(this.props.currentImageIndex)
            return
        }

        const rebuilt = prevProps.annotations !== this.props.annotations

        if (rebuilt) {
            this.syncShadows()
        }

        const selectionChanged = prevProps.selectedAnno !== this.props.selectedAnno
            || prevProps.selectedTargetIndex !== this.props.selectedTargetIndex

        if (rebuilt || selectionChanged) {
            this.changeAnno(this.props.selectedAnno)
        }
    }


    render() {
        return <>
            <div className="editor-stage">
                <div className="editor-viewer">
                    {this.props.pendingZone &&
                        <div className="pending-zone">
                            <span>{this.props.t('editor.add_zone_hint')}</span>
                            <button className="btn btn-xs" onClick={() => this.props.endPendingZone()}>
                                {this.props.t('editor.add_zone_cancel')}
                            </button>
                        </div>
                    }
                    <div id="openseadragon1">
                        <div id="toolbar-container"></div>
                        <div id="toolbar-osd"></div>
                    </div>
                    {this.state.viewerReady && (
                        <AdnoNavigator
                            viewer={this.openSeadragon}
                            imageRatio={this.state.imageRatio}
                            layout={this.state.navigatorLayout}
                            imgUrl={this.state.navigatorImgUrl}
                        />
                    )}
                    {
                        this.state.isMovingItem &&
                        <button className="btn btn-lg move-btn" onClick={() => this.validateMove()}>
                            <div className="tooltip tooltip-bottom z-50" data-tip={this.props.t('editor.approve_changes')}>
                                <FontAwesomeIcon icon={faCheckCircle} /> {this.props.t('editor.approve_changes')}
                            </div>
                        </button>
                    }
                </div>
                <ImageFilmstrip
                    images={this.images()}
                    annotations={this.props.annotations}
                    currentIndex={this.props.currentImageIndex}
                    changeImage={this.props.changeImage}
                    translate={this.props.t}
                />
            </div>
        </>
    }
}

export default withTranslation()(withRouter(AdnoEditor))
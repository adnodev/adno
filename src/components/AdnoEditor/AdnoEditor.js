import { Component } from "react";
import { withRouter } from "react-router";

import "./AdnoEditor.css";

import { withTranslation } from "react-i18next";
import { projectDB } from "../../services/db";
import { computeNavigatorInfo } from "../../Utils/utils";
import { hideWorkspace, isInsideAnnotation, revealAnnotation, showWorkspace, watchViewerResize } from "../../Utils/viewport"
import { preserveTargetRotation } from "../../Utils/orientation"
import { activeGroupId, buildTargetId, deriveGroups, preserveTargetId, scheduleGroupColors, targetGroupId } from "../../Utils/groups"
import { imageTileSource, projectImages } from "../../Utils/images"
import { rememberImageApi } from "../../Utils/imageApi"
import { addTarget, getTargets, parseShadowId, pickTargetOnImage, replaceTargetAt, toShadow, toShadowAnnotations } from "../../Utils/targets"
import AdnoNavigator from '../AdnoNavigator/AdnoNavigator';
import { ImageFilmstrip } from "../ImageFilmstrip/ImageFilmstrip"
import { GroupBadge } from "../GroupWorkspace/GroupOverlay"

class AdnoEditor extends Component {
    constructor(props) {
        super(props);
        this.state = {
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

        this.openSeadragon.gestureSettingsMouse.clickToZoom = false

        if (this.props.onViewerReady) {
            this.props.onViewerReady(this.openSeadragon)
        }

        this.openSeadragon.addOnceHandler('open', () => {
            this.refreshNavigator()
            this.syncShadows()
        });

        this.openSeadragon.addHandler('open', () => {
            const image = this.images()[this.props.currentImageIndex]

            rememberImageApi(image && image.source, this.openSeadragon.world.getItemAt(0)?.source)
        });

        this.openSeadragon.addHandler('canvas-click', (event) => {
            const { clientX, clientY } = event.originalEvent
            const shape = document.elementFromPoint(clientX, clientY)?.closest('.a9s-annotation')
            const selected = this.props.selectedAnno

            this._clickedShadowId = shape ? shape.getAttribute('data-id') : null
            this._clickInside = Boolean(selected) && isInsideAnnotation(this.openSeadragon, selected.id, event.position)

            if (!event.quick || shape || !selected || this.props.pendingZone) {
                return
            }

            if (this._clickInside) {
                setTimeout(() => this.changeAnno(this.props.selectedAnno))
            } else {
                this.props.changeSelectedAnno(null)
            }
        });

        this.AdnoAnnotorious = OpenSeadragon.Annotorious(this.openSeadragon, {
            locale: 'auto',
            drawOnSingleClick: true,
            allowEmpty: true,
            disableEditor: true,
            disableSelect: true
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
            const editing = !pending && this.props.editingAnnotation ? this.props.selectedAnno : null
            const pendingId = pending ? pending.annotationId : (editing ? editing.id : null)
            const host = pendingId ? this.props.annotations.find(anno => anno.id === pendingId) : null
            const siblings = getTargets(host)
            const hostSelected = host && this.props.selectedAnno && host.id === this.props.selectedAnno.id
            const groupId = (pending && pending.groupId)
                || (hostSelected
                    ? activeGroupId(this.props.selectedAnno, this.props.selectedTargetIndex)
                    : targetGroupId(siblings[siblings.length - 1]))
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
            const clicked = this._clickedShadowId
            const isolated = getTargets(this.props.selectedAnno).length > 1

            if (!clicked && isolated && this._clickInside) {
                this.changeAnno(this.props.selectedAnno)
                return
            }

            const { id, index } = parseShadowId(clicked || shadow.id)
            const annotation = this.props.annotations.find(anno => anno.id === id)
            const current = this.props.selectedAnno

            if (current && id === current.id && index === this.props.selectedTargetIndex) {
                this.changeAnno(current)
                return
            }

            if (this.state.pending && this.state.pending.id !== id) {
                this.syncShadows()
                this.savePending()
            }

            this.scrollToCard(id)
            this.props.changeSelectedAnno(annotation || shadow, index)
        })

        // Event triggered when resizing an annotation shape
        this.AdnoAnnotorious.on('changeSelectionTarget', this.applyTargetEdit)

        document.addEventListener('pointerup', this.commitPending, true)
    }

    componentWillUnmount() {
        document.removeEventListener('pointerup', this.commitPending, true)
        this.unwatchResize?.()
        cancelAnimationFrame(this._paintFrame)
        cancelAnimationFrame(this._navFrame)
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

    shadowsOf = (annotations) => toShadowAnnotations(annotations, this.images(), this.props.currentImageIndex)

    signatureOf = (shadows) => JSON.stringify(shadows.map(shadow => [shadow.id, shadow.target]))

    syncShadows = () => {
        const shadows = this.shadowsOf(this.currentAnnotations())
        const signature = this.signatureOf(shadows)

        if (signature === this._shadowSignature) {
            return false
        }

        this._shadowSignature = signature

        this.AdnoAnnotorious.setAnnotations(shadows)
        this.paintGroups()

        return true
    }

    paintGroups = () => {
        this._paintFrame = scheduleGroupColors(this._paintFrame, this.openSeadragon.element, this.props.selectedAnno, this.props.groupColors)
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

        hideWorkspace(this.openSeadragon)
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
            this.AdnoAnnotorious.cancelSelected()
            hideWorkspace(this.openSeadragon)
            this.paintGroups()
            return
        }

        const picked = pickTargetOnImage(annotation, this.images(), this.props.currentImageIndex, this.props.selectedTargetIndex)

        if (!picked) {
            return
        }

        const shadow = toShadow(annotation, picked.target, picked.index)

        this.AdnoAnnotorious.selectAnnotation(shadow.id)

        this.AdnoAnnotorious._app.current.annotationLayer.selectedShape?.mouseTracker?.setTracking(false)

        revealAnnotation(this.openSeadragon, shadow.id)

        if (getTargets(annotation).length > 1) {
            showWorkspace(this.openSeadragon, shadow.id)
        } else {
            hideWorkspace(this.openSeadragon)
        }

        this.scrollToCard(annotation.id)
        this.paintGroups()
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
            pending: { id, annotation: replaceTargetAt(base, index, target) }
        })
    }

    commitPending = () => {
        setTimeout(this.savePending)
    }

    savePending = () => {
        const pending = this.state.pending

        if (!pending) {
            return Promise.resolve(false)
        }

        const newAnnos = this.currentAnnotations()

        this._shadowSignature = this.signatureOf(this.shadowsOf(newAnnos))
        this.props.updateAnnos(newAnnos)
        this.setState({ pending: null })

        return projectDB.updateAnnotations(this.props.match.params.id, newAnnos).then(() => true)
    }

    componentDidUpdate(prevProps) {
        if (prevProps.currentImageIndex !== this.props.currentImageIndex) {
            this.openImage(this.props.currentImageIndex)
            return
        }

        const rebuilt = prevProps.annotations !== this.props.annotations
        const redrawn = rebuilt && this.syncShadows()

        const selectionChanged = (prevProps.selectedAnno && prevProps.selectedAnno.id) !== (this.props.selectedAnno && this.props.selectedAnno.id)
            || prevProps.selectedTargetIndex !== this.props.selectedTargetIndex

        if (redrawn || selectionChanged) {
            this.changeAnno(this.props.selectedAnno)
        } else if (rebuilt && getTargets(this.props.selectedAnno).length > 1) {
            showWorkspace(this.openSeadragon, this.props.selectedAnno.id)
        }
    }


    activeGroup = () => {
        const groups = deriveGroups(this.props.selectedAnno, this.props.groupColors)

        if (groups.length < 2) {
            return null
        }

        const id = activeGroupId(this.props.selectedAnno, this.props.selectedTargetIndex)

        return groups.find(group => group.id === id) || null
    }

    render() {
        const group = this.activeGroup()

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
                    <div id="openseadragon1" className={this.props.pendingZone ? "drawing" : ""}>
                        <div id="toolbar-container"></div>
                        <div id="toolbar-osd"></div>
                    </div>
                    {group &&
                        <GroupBadge className="editor-group-badge"
                            letter={group.letter}
                            color={group.color}
                            count={group.targets.length}
                            translate={this.props.t} />
                    }
                    {this.state.viewerReady && (
                        <AdnoNavigator
                            viewer={this.openSeadragon}
                            imageRatio={this.state.imageRatio}
                            layout={this.state.navigatorLayout}
                            imgUrl={this.state.navigatorImgUrl}
                        />
                    )}
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
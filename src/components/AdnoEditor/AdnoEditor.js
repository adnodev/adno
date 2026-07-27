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
import { imageTileSource, projectImages } from "../../Utils/images";
import { getTargets, parseShadowId, replaceTargetAt, targetsOnImage, toShadow, toShadowAnnotations } from "../../Utils/targets";
import AdnoNavigator from '../AdnoNavigator/AdnoNavigator';
import { ImageFilmstrip } from '../ImageFilmstrip/ImageFilmstrip';

class AdnoEditor extends Component {
    constructor(props) {
        super(props);
        this.state = {
            isMovingItem: false,
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
            const created = image
                ? { ...newAnnotation, target: { ...newAnnotation.target, source: image.source } }
                : newAnnotation
            const annotations = [...this.props.annotations, created]

            projectDB.updateAnnotations(selectedProject.id, annotations)
                .then(() => {
                    this.props.updateAnnos(annotations)

                    this.props.openRichEditor(created)
                })
        });

        // Event triggered when drawing a new shape
        this.AdnoAnnotorious.on('createSelection', (annotation) => {
            this.AdnoAnnotorious.saveSelected()
        })

        // Event triggered when user click on an annotation
        this.AdnoAnnotorious.on('selectAnnotation', (shadow) => {
            const { id } = parseShadowId(shadow.id)
            const annotation = this.props.annotations.find(anno => anno.id === id)

            this.scrollToCard(id)
            this.props.openRichEditor(annotation || shadow)
        })

        // Event triggered when resizing an annotation shape
        this.AdnoAnnotorious.on('changeSelectionTarget', (newTarget) => {
            this.setState({ isMovingItem: true })

            const selected = this.state.selected ? { ...this.state.selected } : this.AdnoAnnotorious.getSelected();
            selected.target = newTarget

            this.setState({ selected })
        });
    }

    componentWillUnmount() {
        this.unwatchResize?.()
    }

    images = () => projectImages(this.props.selectedProject)

    refreshNavigator = () => {
        const info = computeNavigatorInfo(this.openSeadragon)

        if (info) {
            this.setState({ ...info, viewerReady: true })
        }
    }

    syncShadows = () => {
        this.AdnoAnnotorious.setAnnotations(toShadowAnnotations(this.props.annotations, this.images(), this.props.currentImageIndex))
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
        const [onImage] = targetsOnImage(annotation, this.images(), this.props.currentImageIndex)

        if (!onImage) {
            return
        }

        const shadow = toShadow(annotation, onImage.target, onImage.index)

        this.setState({ selected: shadow })

        this.AdnoAnnotorious.selectAnnotation(shadow.id)

        applyAnnotationView(this.openSeadragon, this.AdnoAnnotorious, shadow, {
            defaultRotation: this.props.defaultRotation,
            transition: this.props.rotationTransition
        })

        this.scrollToCard(annotation.id)
    }

    validateMove = () => {
        const projectId = this.props.match.params.id

        const selected = this.state.selected;
        const { id, index } = parseShadowId(selected.id)

        const newAnnos = this.props.annotations.map(anno => {
            if (anno.id !== id) {
                return anno
            }

            return replaceTargetAt(anno, index, preserveTargetRotation(getTargets(anno)[index], selected.target))
        });

        projectDB.updateAnnotations(projectId, newAnnos)
            .then(() => {
                this.props.updateAnnos(newAnnos)

                this.setState({ isMovingItem: false })

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

        if (prevProps.selectedAnno !== this.props.selectedAnno) {
            this.changeAnno(this.props.selectedAnno)
            this.setState({ isMovingItem: false })
        }

        if (prevProps.annotations !== this.props.annotations) {
            this.syncShadows()

            if (this.props.selectedAnno) {
                this.changeAnno(this.props.selectedAnno)
            }
        }
    }


    render() {
        return <>
            <div style={{ position: 'relative', width: '100%', height: 'calc(100vh - 58px)' }}>
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
                <ImageFilmstrip
                    images={this.images()}
                    annotations={this.props.annotations}
                    currentIndex={this.props.currentImageIndex}
                    changeImage={this.props.changeImage}
                    translate={this.props.t}
                />
            </div>
            {
                this.state.isMovingItem &&
                <button className="btn btn-lg move-btn" onClick={() => this.validateMove()}>
                    <div className="tooltip tooltip-bottom z-50" data-tip={this.props.t('editor.approve_changes')}>
                        <FontAwesomeIcon icon={faCheckCircle} /> {this.props.t('editor.approve_changes')}
                    </div>
                </button>
            }
        </>
    }
}

export default withTranslation()(withRouter(AdnoEditor))
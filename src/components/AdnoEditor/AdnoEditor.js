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

class AdnoEditor extends Component {
    constructor(props) {
        super(props);
        this.state = {
            isMovingItem: false
        }
    }

    componentDidMount() {
        const id = this.props.match.params.id

        projectDB.exists(id)
            .then(async optProject => {
                if (!optProject)
                    this.props.history.push("/")
                else {
                    let selected_project = { ...optProject }
                    let tileSources = {
                        type: 'image',
                        url: selected_project.img_url
                    }

                    if (selected_project.manifest_url) {
                        tileSources = [
                            selected_project.manifest_url
                        ]
                    }

                    OpenSeadragon.setString("Tooltips.FullPage", this.props.t('editor.fullpage'));
                    OpenSeadragon.setString("Tooltips.Home", this.props.t('editor.home'));
                    OpenSeadragon.setString("Tooltips.ZoomIn", this.props.t('editor.zoom_in'));
                    OpenSeadragon.setString("Tooltips.ZoomOut", this.props.t('editor.zoom_out'));
                    OpenSeadragon.setString("Tooltips.NextPage", this.props.t('editor.next_page'));
                    OpenSeadragon.setString("Tooltips.PreviousPage", this.props.t('editor.previous_page'));
                    OpenSeadragon.setString("Tooltips.RotateLeft", this.props.t('editor.rotate_left'));
                    OpenSeadragon.setString("Tooltips.RotateRight", this.props.t('editor.rotate_right'));
                    OpenSeadragon.setString("Tooltips.Flip", this.props.t('editor.flip'));


                    this.AdnoAnnotorious = OpenSeadragon.Annotorious(OpenSeadragon({
                        id: 'openseadragon1',
                        tileSources: tileSources,
                        prefixUrl: 'https://cdn.jsdelivr.net/gh/Benomrans/openseadragon-icons@main/images/',
                        // Enable rotation
                        toolbar: "toolbar-osd",
                        showRotationControl: this.props.rotation,
                        showFullPageControl: false,
                    }), {
                        locale: 'auto',
                        drawOnSingleClick: true,
                        allowEmpty: true,
                        disableEditor: true
                    });

                    const annos = this.props.annotations

                    // Generate dataURI and load annotations into Annotorious
                    const dataURI = "data:application/json;base64," + btoa(unescape(encodeURIComponent(JSON.stringify(annos))));
                    this.AdnoAnnotorious.loadAnnotations(dataURI)

                    Annotorious.SelectorPack(this.AdnoAnnotorious);
                    Annotorious.BetterPolygon(this.AdnoAnnotorious);
                    Annotorious.Toolbar(this.AdnoAnnotorious, document.getElementById('toolbar-container'));


                    // Event triggered by using saveSelected annotorious function
                    this.AdnoAnnotorious.on('createAnnotation', (newAnnotation) => {
                        const annotations = [...this.props.annotations] || []
                        annotations.push(newAnnotation)


                        projectDB.updateAnnotations(selected_project.id, annotations)
                            .then(() => {
                                this.props.updateAnnos(annotations)

                                this.props.openRichEditor(newAnnotation)
                            })
                    });

                    // Event triggered when drawing a new shape
                    this.AdnoAnnotorious.on('createSelection', (annotation) => {
                        this.AdnoAnnotorious.saveSelected()
                    })

                    // Event triggered when user click on an annotation
                    this.AdnoAnnotorious.on('selectAnnotation', (annotation) => {
                        document.getElementById(`anno_edit_card_${annotation.id}`).scrollIntoView({ behavior: "smooth", block: "center", inline: "nearest" });
                        this.props.openRichEditor(annotation)
                    })


                    // Event triggered when resizing an annotation shape
                    this.AdnoAnnotorious.on('changeSelectionTarget', (newTarget) => {
                        this.setState({ isMovingItem: true })

                        const selected = this.state.selected ? { ...this.state.selected } : this.AdnoAnnotorious.getSelected();
                        selected.target = newTarget

                        this.setState({ selected })
                    });
                }
            })
    }

    changeAnno = (annotation) => {
        // If the user edits the annotation from the modal, update the current selected annotation in the state
        this.setState({ selected: annotation })

        this.AdnoAnnotorious.selectAnnotation(annotation.id)
        this.AdnoAnnotorious.fitBounds(annotation.id)

        if (annotation.id && document.getElementById(`anno_edit_card_${annotation.id}`)) {
            document.getElementById(`anno_edit_card_${annotation.id}`).scrollIntoView({ behavior: "smooth", block: "center", inline: "nearest" });
        }
    }

    validateMove = () => {
        const projectId = this.props.match.params.id

        const selected = this.state.selected;

        const annotations = this.props.annotations.map(anno => JSON.parse(JSON.stringify(anno)))
        const newAnnos = annotations.map(anno => {
            if (anno.id === selected.id) {
                anno.target = selected.target
            }
            return anno;
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
        // If the user clicks the target button on the annotation card it'll trigger this method     
        if (prevProps.selectedAnno !== this.props.selectedAnno) {
            this.changeAnno(this.props.selectedAnno)
            this.setState({ isMovingItem: false })
        }

        if (prevProps.annotations !== this.props.annotations) {
            // First, we update the annotations's list to the Annotorious component 
            this.AdnoAnnotorious.setAnnotations(this.props.annotations);

            // Then, we focus on the current selected annotation
            if (this.props.selectedAnno) {
                this.changeAnno(this.props.selectedAnno)
            }
        }
    }


    render() {
        return (
            <div>
                <div id="openseadragon1">
                    <div id="toolbar-container"></div>
                    <div id="toolbar-osd"></div>
                </div>
                {
                    this.state.isMovingItem &&
                    <button className="btn btn-lg move-btn" onClick={() => this.validateMove()}>
                        <div className="tooltip tooltip-bottom z-50" data-tip={this.props.t('editor.approve_changes')}>
                            <FontAwesomeIcon icon={faCheckCircle} /> {this.props.t('editor.approve_changes')}
                        </div>
                    </button>
                }
            </div>
        )
    }
}

export default withTranslation()(withRouter(AdnoEditor))
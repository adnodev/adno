import { Component } from "react";
import { withRouter } from "react-router";

// Import FontAwesome for all icons
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faCheckCircle } from "@fortawesome/free-solid-svg-icons";

// Import SweetAlert
import Swal from "sweetalert2";

// Import utils
import { checkIfProjectExists, createDate, insertInLS } from "../../Utils/utils";

// Import CSS
import "./AdnoEditor.css";

// Add translations
import { withTranslation } from "react-i18next";

class AdnoEditor extends Component {
    constructor(props) {
        super(props);
        this.state = {
            isMovingItem: false
        }
    }

    componentDidMount() {
        // First of all, verify if the url ID param matches to an real project in the localStorage
        // If not, then redirect the user to the HomePage
        if (!this.props.match.params.id || !checkIfProjectExists(this.props.match.params.id)) {
            this.props.history.push("/")
        } else {
            let selected_project = JSON.parse(localStorage.getItem(this.props.match.params.id))

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


            // Find annotations from the localStorage in JSON format
            // var annos = localStorage.getItem(`${selected_project.id}_annotations`)
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

                // Update the last update date for the selected project
                selected_project.last_update = createDate()
                insertInLS(selected_project.id, JSON.stringify(selected_project))

                // Update annotations linked to the selected project in the localStorage
                insertInLS(`${selected_project.id}_annotations`, JSON.stringify(annotations))

                this.props.updateAnnos(annotations)

                this.props.openRichEditor(newAnnotation)
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
        const selected_project = JSON.parse(localStorage.getItem(this.props.match.params.id))

        const selected = this.state.selected;

        const annotations = this.props.annotations.map(anno => JSON.parse(JSON.stringify(anno)))
        const newAnnos = annotations.map(anno => {
            if (anno.id === selected.id) {
                anno.target = selected.target
            }
            return anno;
        });

        insertInLS(`${selected_project.id}_annotations`, JSON.stringify(newAnnos))
        this.props.updateAnnos(newAnnos)

        this.setState({ isMovingItem: false })

        Swal.fire({
            title: this.props.t('modal.annotation_moved'),
            showCancelButton: false,
            showConfirmButton: true,
            confirmButtonText: 'OK',
            icon: 'success'
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
import { Component } from "react";
import { withRouter } from "react-router";

// Import utils
import { checkIfProjectExists, createDate, insertInLS } from "../../Utils/utils";

// Import CSS
import "./AdnoEditor.css";

class AdnoEditor extends Component {
    constructor(props) {
        super(props);
    }

    componentDidMount() {
        // First of all, verify if the url ID param matches to an real project in the localStorage
        // If not, then redirect the user to the HomePage
        if (!this.props.match.params.id || !checkIfProjectExists(this.props.match.params.id)) {
            this.props.history.push("/")
        } else {
            let selected_project = JSON.parse(localStorage.getItem(this.props.match.params.id))

            let tileSources;

            if (selected_project.manifest_url) {

                tileSources = [
                    selected_project.manifest_url
                ]

            } else {
                tileSources = {
                    type: 'image',
                    url: selected_project.img_url
                }
            }


            this.AdnoAnnotorious = OpenSeadragon.Annotorious(OpenSeadragon({
                id: 'openseadragon1',
                tileSources: tileSources,
                prefixUrl: 'https://openseadragon.github.io/openseadragon/images/'
            }), {
                locale: 'auto',
                drawOnSingleClick: true,
                allowEmpty: true,
                disableEditor: true
            });

            // Find annotations from the localStorage in JSON format
            var annos = localStorage.getItem(`${selected_project.id}_annotations`)

            // Generate dataURI and load annotations into Annotorious
            const dataURI = "data:application/json;base64," + btoa(unescape(encodeURIComponent(annos)));
            this.AdnoAnnotorious.loadAnnotations(dataURI)

            Annotorious.SelectorPack(this.AdnoAnnotorious);
            Annotorious.BetterPolygon(this.AdnoAnnotorious);
            Annotorious.Toolbar(this.AdnoAnnotorious, document.getElementById('toolbar-container'));


            // Event triggered by using saveSelected annotorious function
            this.AdnoAnnotorious.on('createAnnotation', (newAnnotation) => {
                var annotations = [...this.props.annotations] || []
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
                const selected = this.AdnoAnnotorious.getSelected();
                selected.target = newTarget

                var annotations = this.props.annotations
                var newAnnos = annotations.map(anno => {
                    if (anno.id === selected.id) {
                        anno = selected
                    }
                    return anno;
                })

                insertInLS(`${selected_project.id}_annotations`, JSON.stringify(newAnnos))
                this.props.updateAnnos(newAnnos)
            });
        }
    }

    changeAnno = (annotation) => {
        this.AdnoAnnotorious.selectAnnotation(annotation.id)
        this.AdnoAnnotorious.fitBounds(annotation.id)

        if (annotation.id && document.getElementById(`anno_edit_card_${annotation.id}`)) {
            document.getElementById(`anno_edit_card_${annotation.id}`).scrollIntoView({ behavior: "smooth", block: "center", inline: "nearest" });
        }

    }

    componentDidUpdate(prevProps) {
        // If the user clicks the target button on the annotation card it'll trigger this method     
        if (prevProps.selectedAnno !== this.props.selectedAnno) {
            this.changeAnno(this.props.selectedAnno)
        }

        if (this.props.annotations !== prevProps.annotations) {
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
                <div id="toolbar-container"></div>
                <div id="openseadragon1"></div>
            </div>
        )
    }
}

export default withRouter(AdnoEditor)
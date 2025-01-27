import { Component } from "react";
import { withRouter } from "react-router-dom";

// Import SweetAlert
import Swal from "sweetalert2";

// Import utils
import { checkIfProjectExists } from "../../Utils/utils";

// Import libraries
// import "/libraries/openseadragon/openseadragon-annotorious.min.js";

// Imports CSS
import "./AdnoViewer.css";

class AdnoViewer extends Component {
    constructor(props) {
        super(props);
        this.state = {
            annotations: [],
            selectedProject: {},
            editedMode: false
        }
    }

    componentDidMount() {

        if (!checkIfProjectExists(this.props.match.params.id)) {
            this.props.history.push("/")
        }
        // Find annotations from the localStorage in JSON format
        var annos = localStorage.getItem(`${this.props.match.params.id}_annotations`)
        var actualProj = localStorage.getItem(this.props.match.params.id)



        // Check if there is at least one annotation
        if (annos && JSON.parse(annos).length > 0) {


            var newAnnos =
                (
                    JSON.parse(annos).map(annotation => {
                        var newAnno = annotation;
                        newAnno.body = annotation.body.filter(annoBody => annoBody.type !== "AdnoRichText");

                        return newAnno
                    })
                )

            this.setState({ annotations: JSON.parse(annos), selectedProject: JSON.parse(actualProj) })


            // Create the dataURI linked to the annotations



            try {
                const dataURI = "data:application/json;base64," + btoa(unescape(encodeURIComponent(JSON.stringify(newAnnos))));

                // Create and display an annona storyboard 
                document.getElementById("image_iiif").innerHTML = '<iiif-storyboard  styling="toggleoverlay: true; tts:false;" annotationurl="' + dataURI + '"></iiif-storyboard>';
            } catch (error) {
                Swal.fire({
                    title: this.props.t('errors.unknown_characters'),
                    showCancelButton: false,
                    confirmButtonText: 'Ok',
                    icon: 'error',
                })
                    .then((result) => {
                        if (result.isConfirmed) {
                            this.props.history.push("/")
                        }
                    })
            }



        } else {
            if (checkIfProjectExists(this.props.match.params.id) && JSON.parse(localStorage.getItem(this.props.match.params.id)).manifest_url) {
                OpenSeadragon({
                    id: 'image_iiif',
                    tileSources: [JSON.parse(localStorage.getItem(this.props.match.params.id)).manifest_url],
                    prefixUrl: 'https://cdn.jsdelivr.net/gh/Benomrans/openseadragon-icons@main/images/'
                });
            } else {
                OpenSeadragon({
                    id: 'image_iiif',
                    tileSources: {
                        type: 'image',
                        url: checkIfProjectExists(this.props.match.params.id) && JSON.parse(localStorage.getItem(this.props.match.params.id)).img_url
                    },
                    prefixUrl: 'https://cdn.jsdelivr.net/gh/Benomrans/openseadragon-icons@main/images/'
                });
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
        }

    }

    render() {
        return (
            <div className="adno-viewer">

                {
                    this.state.annotations.length >= 1 ?
                        <div id="image_iiif_annotations"></div>
                        :
                        <div id="image_iiif"></div>
                }
            </div>
        )
    }
}

export default withTranslation()(withRouter(AdnoViewer))
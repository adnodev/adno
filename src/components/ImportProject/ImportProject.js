import { Component } from "react";
import { withRouter } from "react-router";

// Import FontAwesome and icons
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faCancel, faCheck, faCheckCircle, faUpload } from "@fortawesome/free-solid-svg-icons";

// Import popup alerts
import Swal from "sweetalert2";

// Import utils
import { importProjectJsonFile } from "../../../Utils/utils";

// Import CSS
import "./ImportProject.css";

class ImportProject extends Component {
    constructor(props) {
        super(props);
        this.state = {
            isimporting: false,
            loadedProject: "",
            labelImportValue: "Importer un projet"
        }
    }


    // Function to cancel import
    cancelImport = () => {
        this.setState({ isimporting: false, labelImportValue: "Importer un projet" })
        document.getElementById("selectFiles_1").value = ""
    }

    loadImportedProj = (event) => {
        if (this.state.loadedProject && this.state.loadedProject.type === "application/json") {
            // Call function to load the project
            importProjectJsonFile(event, this.state.loadedProject, this.cancelImport)
        } else {
            Swal.fire({
                title: 'Impossible de lire ce type de fichier !',
                showCancelButton: false,
                showConfirmButton: true,
                confirmButtonText: 'OK',
                icon: 'error',
            })
            .then((result) => {
                if (result.isConfirmed) {
                    this.cancelImport()
                }
            })
        }
    }

    render() {
        return (
            <div className={this.state.isimporting ? "importing_project" : "import_project"}    >

                <div className="tooltip" data-tip="Importer un projet">
                    <label className="btn btn-md btn-secondar" id="label-upload" htmlFor="selectFiles_1"> <FontAwesomeIcon icon={faUpload} /> {this.state.labelImportValue}</label>
                </div>

                <input accept="application/json" type="file" id="selectFiles_1" onChange={(e) => {
                    this.setState({ isimporting: true, loadedProject: e.target.files[0] })
                    // this.setState({ labelImportValue: "Fichier selectionné : " + e.target.files[0].name })
                    this.setState({ labelImportValue: "1 Fichier selectionné"})
                }} />

                {
                    this.state.isimporting &&
                    <div className="import-btns">
                        <div className="tooltip" data-tip="Valider l'importation">
                            <button className="btn btn-md btn-success" disabled={!this.state.isimporting} onClick={(event) => {this.loadImportedProj(event)}}><FontAwesomeIcon icon={faCheckCircle} /></button>
                        </div>

                        <div className="tooltip" data-tip="Annuler l'importation">
                            <button className="btn btn-md btn-error" disabled={!this.state.isimporting} onClick={() => this.cancelImport()}><FontAwesomeIcon icon={faCancel} /></button>
                        </div>
                    </div>
                }


            </div>
        )
    }
}

export default withRouter(ImportProject)
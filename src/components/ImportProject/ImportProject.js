import { Component } from "react";
import { withRouter } from "react-router";

// Import FontAwesome and icons
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faCancel, faCheckCircle, faUpload } from "@fortawesome/free-solid-svg-icons";

// Import popup alerts
import Swal from "sweetalert2";

// Import utils
import { importProjectJsonFile } from "../../Utils/utils";

// Import CSS
import "./ImportProject.css";

// Add translations
import { withTranslation } from "react-i18next";

class ImportProject extends Component {
    constructor(props) {
        super(props);
        this.state = {
            isimporting: false,
            loadedProject: "",
            labelImportValue: this.props.t('import.import_project')
        }
    }


    // Function to cancel import
    cancelImport = () => {
        this.setState({ isimporting: false, labelImportValue: this.props.t('import.import_project') })
        document.getElementById("selectFiles_1").value = ""
    }

    loadImportedProj = (event) => {
        if (this.state.loadedProject && this.state.loadedProject.type === "application/json") {
            // Call function to load the project
            importProjectJsonFile(event, this.state.loadedProject, this.cancelImport, this.props.t('errors.wrong_file'), this.props)
        } else {
            Swal.fire({
                title: this.props.t('errors.unable_reading_file'),
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
            <div className={this.state.isimporting ? "importing_project" : "create_project_2"}  >

                <div className="tooltip" data-tip={this.props.t('import.import_project')}>
                    <label className="btn btn-md btn-secondar" id="label-upload" htmlFor="selectFiles_1"> <FontAwesomeIcon icon={faUpload} /> {this.state.labelImportValue}</label>
                </div>

                <input accept="application/json" type="file" id="selectFiles_1" onChange={(e) => {
                    this.setState({ isimporting: true, loadedProject: e.target.files[0] })
                    this.setState({ labelImportValue: this.props.t('files.one_selected')})
                }} />

                {
                    this.state.isimporting &&
                    <div className="import-btns">
                        <div className="tooltip" data-tip={this.props.t('import.validate')}>
                            <button className="btn btn-md btn-success" disabled={!this.state.isimporting} onClick={(event) => {this.loadImportedProj(event)}}><FontAwesomeIcon icon={faCheckCircle} /></button>
                        </div>

                        <div className="tooltip" data-tip={this.props.t('import.cancel')}>
                            <button className="btn btn-md btn-error" disabled={!this.state.isimporting} onClick={() => this.cancelImport()}><FontAwesomeIcon icon={faCancel} /></button>
                        </div>
                    </div>
                }


            </div>
        )
    }
}

export default withTranslation()(withRouter(ImportProject));
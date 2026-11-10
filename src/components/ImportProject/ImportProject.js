import { Component } from "react";
import { withRouter } from "react-router";

import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faUpload } from "@fortawesome/free-solid-svg-icons";

import { importProjectJsonFile } from "../../Utils/utils";
import { toast } from "../Toast/store"

import "./ImportProject.css";

// Add translations
import { withTranslation } from "react-i18next";

class ImportProject extends Component {
    openEditor = (projectId) => {
        this.props.history.push(`/project/${projectId}/edit`)
    }

    importFile = (event) => {
        const [file] = event.target.files

        if (file && file.type === "application/json") {
            importProjectJsonFile(file, this.props.t('errors.wrong_file'), this.openEditor)
        } else {
            toast.error(this.props.t('errors.unable_reading_file'))
        }

        event.target.value = ""
    }

    render() {
        return (
            <div className="create_project_2">
                <div className="tooltip" data-tip={this.props.t('import.import_project')}>
                    <label className="btn btn-md btn-secondar" id="label-upload" htmlFor="selectFiles_1">
                        <FontAwesomeIcon icon={faUpload} /> {this.props.t('import.import_project')}
                    </label>
                </div>

                <input accept="application/json" type="file" id="selectFiles_1" onChange={this.importFile} />
            </div>
        )
    }
}

export default withTranslation()(withRouter(ImportProject));
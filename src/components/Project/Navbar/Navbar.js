import { faDownload, faFile, faFilePen, faHome } from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { Component } from "react";
import { withRouter } from "react-router";
import { Link } from "react-router-dom";
import { createExportProjectJsonFile } from "../../../Utils/utils";

class Navbar extends Component{
    constructor(props){
        super(props);
    }

    render(){
        return(
            <div className="navbar bg-neutral text-neutral-content">

            <Link to={"/"} className="btn btn-ghost normal-case"> <FontAwesomeIcon icon={faHome} /> </Link>
           
            {
                this.props.selectedProject && this.props.selectedProject.id &&
                <a id={"download_btn_" + this.props.selectedProject.id} href={createExportProjectJsonFile(this.props.selectedProject.id)} download={this.props.selectedProject.title + ".json"} className="btn btn-md"> <FontAwesomeIcon icon={faDownload} /> </a>
            }

            <button onClick={() => this.props.showProjectMetadatas()} className="btn btn-md"><FontAwesomeIcon icon={this.props.editMode ? faFilePen : faFile} /></button>


            <p>{this.props.selectedProject.title} {this.props.selectedProject.autor && `(${this.props.selectedProject.autor})`} </p>

            {
                process.env.ADNO_MODE === "FULL" &&
                <div className="dl_toggle">

                    <label className="cursor-pointer label label-toggle">
                        <label>Mode édition</label>
                        <input type="checkbox" className="toggle toggle-lg toggle-success" value={this.props.editMode}
                            onChange={() => {
                                if (this.props.editMode) {
                                    this.props.history.push(`/project/${this.props.match.params.id}/view`)
                                } else {
                                    this.props.history.push(`/project/${this.props.match.params.id}/edit`)
                                }
                            }
                            }
                            checked={this.props.editMode} />
                    </label>


                </div>
            }

        </div>
        )
    }
}

export default withRouter(Navbar);
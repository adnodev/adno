import { faSave } from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { Component } from "react";
import Swal from "sweetalert2";
import "./ProjectSettings.css"

class ProjectSettings extends Component {
    constructor(props){
        super(props);
        this.state = {
            settings: {...this.props.settings},
        }
    }

    updateProjectSettings = (e) => {
        e.preventDefault()

        this.props.updateSettings(this.state.settings)
        this.props.closeSettings()

        Swal.fire({
            title: "Paramètres mis à jour avec succés !",
            showCancelButton: false,
            confirmButtonText: 'Ok',
            icon: 'success',
        })
    }

    render() {
        return (
            <div className="project-metadatas-backdrop">
                <form className="project-metadatas-container" onSubmit={(e) => {this.updateProjectSettings(e)}}>


                    <div className="card-actions justify-end closeBtnMetadatas">
                        <button type="button" className="btn btn-square btn-sm" onClick={() => this.props.closeSettings()}>
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" /></svg>
                        </button>
                    </div>


                    <div className="project-metadatas">

                        <label className="label">
                            <span className="label-text">Délai entre 2 annotations (en secondes)</span>
                        </label>
                        <input type="number" placeholder="2" className="input input-bordered w-full max-w-xs" value={this.state.settings.delay} onChange={(e) => this.setState({settings: {...this.state.settings, delay: e.target.value}})} />

                        <label className="label">
                            <span className="label-text">Navigateur d'ensemble</span>
                        </label>
                        <input type="checkbox" className="toggle toggle-success toggle-navigator" checked={this.state.settings.showNavigator} onChange={() => this.setState({settings: {...this.state.settings, showNavigator: !this.state.settings.showNavigator}})}/>


                        <label className="label">
                            <span className="label-text">Afficher barre outils en mode plein écran</span>
                        </label>
                        <input type="checkbox" className="toggle toggle-success toggle-toolsbar" checked={this.state.settings.toolsbarOnFs} onChange={() => this.setState({settings: {...this.state.settings, toolsbarOnFs: !this.state.settings.toolsbarOnFs}})}/>

                        <label className="label">
                            <span className="label-text">Afficher la sibedar des annotations</span>
                        </label>
                        <input type="checkbox" className="toggle toggle-success toggle-toolsbar" checked={this.state.settings.sidebarEnabled} onChange={() => this.setState({settings: {...this.state.settings, sidebarEnabled: !this.state.settings.sidebarEnabled}})}/>


                        <label className="label">
                            <span className="label-text">Toujours commencer la lecture automatique à la première annotation</span>
                        </label>
                        <input type="checkbox" className="toggle toggle-success toggle-toolsbar" checked={this.state.settings.startbyfirstanno} onChange={() => this.setState({settings: {...this.state.settings, startbyfirstanno: !this.state.settings.startbyfirstanno}})}/>


                        <div className="metadata-editor-btns">
                             <button type="submit" className="btn" ><FontAwesomeIcon icon={faSave} />  Enregistrer </button>
                        </div>
                    </div>
                </form>
            </div>
        )
    }
}
export default ProjectSettings;
import { Component } from "react";
import AnnotationCards from "../AdnoEditor/AnnotationCards/AnnotationCards";
import ViewerAnnotationCards from "../AdnoViewer/ViewerAnnotationCards/ViewerAnnotationCards";

// Import CSS
import "./SidebarAnnotations.css"

class SidebarAnnotations extends Component {
    render() {

        return (
            <div id="mySidebar" 
            className={
                (this.props.sidebarStatus && this.props.editingMode) || (this.props.sidebarStatus && this.props.metadatasModal) ?
                 "sidebar-opened-w-modal" 
                 : this.props.sidebarStatus && !this.props.editingMode ? 
                 "sidebar-opened" 
                 : "sidebar"}>
                {
                    this.props.editingMode ?
                        <AnnotationCards updateProject={(updatedProject) => this.props.updateProject(updatedProject)} selectedProject={this.props.selectedProject} openRichEditor={(annotation) => { this.props.openRichEditor(annotation) }} annotations={this.props.annotations} updateAnnos={(updated_annos) => this.props.updateAnnos(updated_annos)} />
                        :
                        <ViewerAnnotationCards editingMode={this.props.editingMode} annotations={this.props.annotations} selectedProject={this.props.selectedProject} />
                }
            </div>
        )
    }
}
export default SidebarAnnotations;
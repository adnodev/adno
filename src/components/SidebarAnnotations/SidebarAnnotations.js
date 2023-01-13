import { Component } from "react";
import AnnotationCards from "../AdnoEditor/AnnotationCards/AnnotationCards";
import ViewerAnnotationCards from "../AdnoViewer/ViewerAnnotationCards/ViewerAnnotationCards";

// Import CSS
import "./SidebarAnnotations.css"

class SidebarAnnotations extends Component {
    render() {
        return (
            <div
                className="sidebar-opened-w-modal">
                {
                    this.props.editingMode ?
                        <AnnotationCards updateProject={(updatedProject) => this.props.updateProject(updatedProject)} selectedProject={this.props.selectedProject} openRichEditor={(annotation) => { this.props.openRichEditor(annotation) }} annotations={this.props.annotations} updateAnnos={(updated_annos) => this.props.updateAnnos(updated_annos)} />
                        :
                        <ViewerAnnotationCards selectedAnno={this.props.selectedAnno} changeSelectedAnno={(newSelectedAnno) => this.props.changeSelectedAnno(newSelectedAnno)} editingMode={this.props.editingMode} annotations={this.props.annotations} selectedProject={this.props.selectedProject} openFullAnnotationView={(annotation) => { this.props.openFullAnnotationView(annotation) }}/>
                }
            </div>
        )
    }
}
export default SidebarAnnotations;
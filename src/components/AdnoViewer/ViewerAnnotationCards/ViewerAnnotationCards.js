import { Component } from 'react';
import { withRouter } from "react-router";

// Import CSS
import "./ViewerAnnotationCards.css";

// Import Components
import OneCardView from './OneCardView/OneCardView';
import { buildTagsList } from '../../../Utils/utils';
import ReactSelect from 'react-select';
import { withTranslation } from 'react-i18next';

class ViewerAnnotationCards extends Component {
    constructor(props) {
        super(props)

        // this.state = {
        //     selectedTags: this.readTagsUserPreferences()
        // }
    }

    // getAllAnnotationsTags = () => {
    //     const tags = this.props.annotations
    //         .flatMap(annotation => buildTagsList(annotation))
    //         .map(tag => tag.value);

    //     return [...new Set(tags)].map(tag => ({ value: tag, label: tag }))
    // }

    // readTagsUserPreferences = () => {
    //     const userPreferences = this.props.selectedProject.user_preferences

    //     let tags = []
    //     if (userPreferences)
    //         tags = userPreferences.tags.map(tag => ({ value: tag, label: tag }))

    //     return tags
    // }

    // handleAnnotationsTags = newTags => {
    //     const { selectedProject } = this.props
    //     const newProject = {
    //         ...selectedProject,
    //         user_preferences: {
    //             tags: newTags.map(tag => tag.value)
    //         }
    //     }
    //     this.props.updateProject(newProject)
    //     insertInLS(newProject.id, JSON.stringify(newProject))

    //     this.setState({ selectedTags: newTags }, () => {
    //         this.props.changeSelectedTags(newTags)
    //     })
    // }

    render() {
        const annotationWithTags = this.props.annotations
            .map(annotation => ({
                ...annotation,
                tags: buildTagsList(annotation).map(tag => tag.value)
            }))

        // const tags = this.getAllAnnotationsTags()

        return (
            <div className="annotations_list">
                {/* {tags.length > 0 && <ReactSelect
                    isMulti
                    name="tags"
                    options={tags}
                    value={this.state.selectedTags}
                    onChange={this.handleAnnotationsTags}
                    placeholder={this.props.t('annotation.tags_list')}
                    className="basic-multi-select mb-2 custom-react-select"
                    classNamePrefix="select"
                />} */}
                {
                    annotationWithTags
                        // .filter(annotation => this.state.selectedTags.length === 0 ? true : annotation.tags.find(tag => this.state.selectedTags.map(tag => tag.value).includes(tag)))
                        .map((annotation, index) => {
                            return (
                                <div id={`anno_card_${annotation.id}`} key={`viewer_anno_${index}`} className={this.props.selectedAnno && this.props.selectedAnno.id === annotation.id ? "anno-card selectedAnno shadow" : "anno-card shadow"}>
                                    <OneCardView openFullAnnotationView={(annotation) => this.props.openFullAnnotationView(annotation)} project={this.props.selectedProject} annotation={annotation} clickOnTarget={() => this.props.changeSelectedAnno(annotation)} selectedAnno={this.props.selectedAnno} />
                                </div>
                            )
                        })}
            </div>
        )
    }
}
export default withTranslation()(withRouter(ViewerAnnotationCards))
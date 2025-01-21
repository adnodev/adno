import { Component } from 'react';

// Import FontAwesome
import { faCheckCircle, faSave, faTrash } from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";

import Select from 'react-select/creatable';

// Import Markdown editor
import { insertInLS } from '../../Utils/utils';

// Import CSS
import '@toast-ui/editor/dist/toastui-editor.css';

// import { Editor } from '@toast-ui/react-editor';


import Editor from '@toast-ui/editor';

import '@toast-ui/editor/dist/i18n/fr-fr';
import '@toast-ui/editor/dist/i18n/es-es';

import { withTranslation } from 'react-i18next';
import Swal from 'sweetalert2';

const locale = navigator.language;

const AUDIO_TYPES = [
    'audio/mpeg',
    'audio/ogg',
    'audio/wav',
    'audio/aac',
    'audio/webm',
    'audio/mp4',
    'audio/flac',
    'audio/opus',
];

class AdnoMdEditor extends Component {
    constructor(props) {
        super(props);
        this.state = {
            isDeleting: false,
            selectedTags: this.computeSelectedTags(),
            audioTrack: this.getAudioBody(),
            audioCreator: this.getCreatorFromBody(),
            markdown: [],
            tab: 'editor',
            existingTags: this.computeExistingTags()
        }
    }

    computeSelectedTags = () => {
        return (this.props.selectedAnnotation.body && this.props.selectedAnnotation.body.length > 0 &&
            this.props.selectedAnnotation.body.filter(anno => anno.purpose === "tagging").map(i => i.value) || [])
            .map(label => ({ label, value: label }))
    }

    computeExistingTags = () => {
        return this.props.annotations.reduce((acc, anno) => [...acc,
        ...anno.body?.filter(a => a.purpose === 'tagging').map(i => i.value)
        ], []).map(label => ({ label, value: label }))
    }

    componentDidMount() {
        this.editor = new Editor({
            el: document.querySelector('#editor'),
            initialValue: this.getAnnoBody(),
            previewStyle: "vertical",
            height: "600px",
            initialEditType: "wysiwyg",
            usageStatistics: false,
            placeholder: this.props.t("editor.placeholder"),
            hideModeSwitch: false,
            language: locale,
            toolbarItems: [[
                "heading",
                "italic",
                "bold",
                "ul",
                "link",
                "image",
            ]]
        })
    }

    saveMD = () => {
        let annos = [...this.props.annotations];
        let currentSelectedAnno = { ...this.props.selectedAnnotation };

        let md = this.editor.getMarkdown();

        // Check if something has been wrote down
        let html = this.editor.getMarkdown() ? this.editor.getHTML() : "";

        let newTextBody = {
            "type": "TextualBody",
            "value": md,
            "purpose": "commenting"
        }

        let HTMLBody = {
            "type": "HTMLBody",
            "value": html,
            "purpose": "commenting"
        }

        const audioElement = document.getElementById('audioTag');

        let audioBody;
        if (audioElement) {
            const format = AUDIO_TYPES.find(format => audioElement.canPlayType(format) === 'probably' ||
                audioElement.canPlayType(format) === 'maybe')

            audioBody = {
                type: 'SpecificResource',
                purpose: 'linking',
                source: {
                    id: this.state.audioTrack,
                    creator: this.state.audioCreator,
                    type: "Audio",
                    format
                },
            }
        }

        let tags = this.state.selectedTags.map(({ label }) => {
            return (
                {
                    "type": "TextualBody",
                    "value": label,
                    "purpose": "tagging"
                }
            )
        })

        let newBody = [newTextBody, HTMLBody, ...tags]
        currentSelectedAnno.body = newBody;

        if (audioBody) {
            currentSelectedAnno.body = [...newBody, audioBody];
        }

        if (annos.find(anno => anno.id === currentSelectedAnno.id)) {
            const idx = annos.findIndex(anno => anno.id === currentSelectedAnno.id);
            annos[idx] = currentSelectedAnno;
        } else {
            Swal.fire({
                title: this.props.t('errors.error_found'),
                showCancelButton: false,
                confirmButtonText: 'Ok',
                icon: 'warning',
            }).then((result) => {
                if (result.isConfirmed) {
                    this.props.closeMdEditor()
                }
            })
        }

        insertInLS(`${this.props.selectedProjectId}_annotations`, JSON.stringify(annos))
        this.props.updateAnnos(annos)

        document.getElementById(`anno_edit_card_${this.props.selectedAnnotation.id}`)?.scrollIntoView({ behavior: "smooth", block: "center", inline: "nearest" });

        this.props.closeMdEditor()
    }

    getAudioBody = () => {
        if (Array.isArray(this.props.selectedAnnotation.body) && this.props.selectedAnnotation.body.length > 0) {
            const resource = this.props.selectedAnnotation.body
                .find(body => body.type === "SpecificResource")
            if (resource)
                return resource.source?.id
        } else {
            return ""
        }
    }

    getCreatorFromBody = () => {
        if (Array.isArray(this.props.selectedAnnotation.body) && this.props.selectedAnnotation.body.length > 0) {
            const resource = this.props.selectedAnnotation.body
                .find(body => body.type === "SpecificResource")
            if (resource)
                return resource.source?.creator
        } else {
            return ""
        }
    }

    getAnnoBody = () => {
        if (Array.isArray(this.props.selectedAnnotation.body) && this.props.selectedAnnotation.body.length > 0) {
            return this.props.selectedAnnotation.body.filter(annobody => annobody.type === "TextualBody" && annobody.purpose === "commenting")[0] ? this.props.selectedAnnotation.body.filter(annobody => annobody.type === "TextualBody" && annobody.purpose === "commenting")[0].value : ""
        } else {
            return ""
        }
    }

    deleteAnnotation = () => {
        this.setState({ isDeleting: false })

        var annotationID = this.props.selectedAnnotation.id
        var annos = [...this.props.annotations];

        if (annos.find(anno => anno.id === annotationID)) {
            annos = annos.filter(annotation => annotation.id !== annotationID)

            // Update the localStorage without the removed item
            insertInLS(`${this.props.selectedProjectId}_annotations`, JSON.stringify(annos.filter(annotation => annotation.id != annotationID)))

            // Update the state of the main component
            this.props.updateAnnos(annos)

            // Close the editor window
            this.props.closeMdEditor()
        } else {
            Swal.fire({
                title: this.props.t('errors.error_found'),
                showCancelButton: false,
                confirmButtonText: 'Ok',
                icon: 'warning',
            }).then((result) => {
                if (result.isConfirmed) {
                    // Close the editor window
                    this.props.closeMdEditor()
                }
            })
        }
    }

    render() {
        const { tab } = this.state;

        return (
            <div className="card w-full max-w-4xl bg-base-100 shadow-xl rich-card-editor">
                <div className="card-body">
                    <button type="button" className="btn btn-square btn-sm" onClick={() => this.props.closeMdEditor()}
                        style={{
                            position: 'absolute',
                            top: 12,
                            right: 12
                        }}>
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" /></svg>
                    </button>
                    <div className="flex justify-center mt-5 mb-8 items-center" style={{ width: '100%' }}>
                        <TabSelector tab={this.state.tab} setTab={tab => this.setState({ tab })} translate={this.props.t} />
                    </div>

                    <div id="editor" style={{ display: tab === 'editor' ? 'block' : 'none' }}></div>

                    {tab === 'tags' && <div style={{ height: '600px' }}>
                        <div className="editor-tags">
                            <Select
                                isMulti
                                name="tags"
                                value={this.state.selectedTags}
                                options={this.state.existingTags}
                                onChange={selectedTags => this.setState({ selectedTags })}
                                components={{ NoOptionsMessage: () => <NoOptionsMessage t={this.props.t} /> }}
                                className="basic-multi-select"
                                classNamePrefix="select"
                                placeHolder={this.props.t('editor.md_add_tag')}
                            />
                            {/* <TagsInput
                                value={this.state.selectedTags}
                                onChange={(tags) => this.setState({ selectedTags: tags })}
                                placeHolder={this.props.t('editor.md_add_tag')}
                            /> */}
                            <div className="label font-medium">
                                <span className="label-text">{this.props.t('tags_infos')}</span>
                            </div>
                        </div>
                    </div>}

                    {tab === 'audio' &&
                        <div style={{ height: '600px' }}>
                            <label className="form-control w-full">
                                <div className="label font-medium">
                                    <span className="label-text" style={{ color: '#000' }}>{this.props.t('editor.audio_track')}</span>
                                </div>
                                <input type="text"
                                    className="input input-bordered w-full grow"
                                    id="track"
                                    onChange={e => this.setState({ audioTrack: e.target.value })}
                                    value={this.state.audioTrack} />
                            </label>

                            {this.state.audioTrack && <figure className="mt-2 flex" style={{
                                justifyContent: 'flex-start'
                            }}>
                                <audio controls src={this.state.audioTrack} id="audioTag"></audio>
                            </figure>}

                            <label className="form-control w-full mt-4">
                                <div className="label font-medium">
                                    <span className="label-text" style={{ color: '#000' }}>{this.props.t('editor.audio_creator')}</span>
                                </div>
                                <input type="text"
                                    className="input input-bordered w-full grow"
                                    id="track"
                                    onChange={e => this.setState({ audioCreator: e.target.value })}
                                    value={this.state.audioCreator} />
                            </label>
                        </div>
                    }

                    <div className="rich-card-editor-btns">
                        {!this.state.isDeleting && <button className="btn btn-error ml-1 mr-1" onClick={() => this.setState({ isDeleting: true })}> <FontAwesomeIcon icon={faTrash} /> &nbsp; {this.props.t('editor.md_delete')} </button>}
                        {this.state.isDeleting && <button className="btn btn-success" onClick={() => this.deleteAnnotation()}> <FontAwesomeIcon icon={faCheckCircle} /> &nbsp;  {this.props.t('editor.md_delete_confirm')} </button>}
                        <button className="btn ml-1 mr-1" onClick={() => this.saveMD()}><FontAwesomeIcon icon={faSave} /> &nbsp; {this.props.t('editor.md_save')} </button>
                    </div>
                </div>
            </div >

        )
    }
}

function TabSelector({ tab, setTab, translate }) {

    return <div className="flex">
        <button type="button"
            className="btn btn-outline"
            style={{ borderBottom: tab === 'editor' ? '4px solid #000' : '1px solid', borderRadius: 0 }}
            onClick={() => setTab('editor')}>{translate('editor.tabs.editor')}</button>
        <button type="button"
            className="btn btn-outline"
            style={{ borderBottom: tab === 'tags' ? '4px solid #000' : '1px solid', borderLeft: 0, borderRight: 0, borderRadius: 0 }}
            onClick={() => setTab('tags')}>{translate('editor.tabs.tags')}</button>
        <button type="button"
            className="btn btn-outline"
            style={{ borderBottom: tab === 'audio' ? '4px solid #000' : '1px solid', borderRadius: 0 }}
            onClick={() => setTab('audio')}>{translate('editor.tabs.audio')}</button>
    </div>
}

const NoOptionsMessage = ({ t }) => {
    return (
        <span className='flex items-center justify-center py-2'>{t('editor.empty_list')}</span>
    );
};

export default withTranslation()(AdnoMdEditor);

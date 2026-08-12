import { Component, createRef } from 'react';

// Import FontAwesome
import { faCrosshairs, faSave, faTrash } from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";

import Select from 'react-select/creatable';

// Import CSS
import '@toast-ui/editor/dist/toastui-editor.css';

// import { Editor } from '@toast-ui/react-editor';


import Editor from '@toast-ui/editor';

import '@toast-ui/editor/dist/i18n/fr-fr';
import '@toast-ui/editor/dist/i18n/es-es';

import { withTranslation } from 'react-i18next';
import Swal from 'sweetalert2';
import { projectDB } from '../../services/db';
import { getAnnotationRotation, normalizeAngle, withAnnotationRotation } from '../../Utils/orientation';
import { getAnnotationCutout, withAnnotationCutout } from '../../Utils/cutout';
import { getTargets, removeTargetAt } from '../../Utils/targets';
import { ZonePreview } from './ZonePreview';

const locale = navigator.language;

const QUARTER_TURNS = [0, 90, 180, 270];

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

const TABS = [
    { name: 'editor', label: 'editor.tabs.editor', hint: 'editor.editor_hint' },
    { name: 'zones', label: 'editor.tabs.zones', hint: 'editor.zones_hint' },
    { name: 'tags', label: 'editor.tabs.tags', hint: 'tags_infos' },
    { name: 'audio', label: 'editor.tabs.audio', hint: 'editor.audio_hint' }
]

class AdnoMdEditor extends Component {
    constructor(props) {
        super(props);
        this.state = {
            selectedTags: this.computeSelectedTags(),
            audioTrack: this.getAudioBody(),
            audioCreator: this.getCreatorFromBody(),
            markdown: [],
            tab: 'editor',
            existingTags: this.computeExistingTags(),
            rotation: getAnnotationRotation(this.props.selectedAnnotation),
            cutout: getAnnotationCutout(this.props.selectedAnnotation)
        }

        this.panelRef = createRef()
        this.drag = null
    }

    dragSpot = (event) => {
        const { grabX, grabY, width, height } = this.drag

        return {
            left: Math.min(Math.max(event.clientX - grabX, 0), window.innerWidth - width),
            top: Math.min(Math.max(event.clientY - grabY, 0), window.innerHeight - height)
        }
    }

    startDrag = (event) => {
        if (event.target.closest('button')) {
            return
        }

        const box = this.panelRef.current.getBoundingClientRect()

        this.drag = {
            grabX: event.clientX - box.left,
            grabY: event.clientY - box.top,
            width: box.width,
            height: box.height
        }

        event.currentTarget.setPointerCapture(event.pointerId)
    }

    moveDrag = (event) => {
        if (!this.drag) {
            return
        }

        const spot = this.dragSpot(event)
        const panel = this.panelRef.current

        panel.style.left = `${spot.left}px`
        panel.style.top = `${spot.top}px`
    }

    endDrag = (event) => {
        if (!this.drag) {
            return
        }

        this.drag = null
        event.currentTarget.releasePointerCapture(event.pointerId)
    }

    captureCurrentRotation = () => {
        const current = this.props.getViewerRotation && this.props.getViewerRotation()

        if (current === null || current === undefined) {
            return
        }

        this.setState({ rotation: normalizeAngle(Math.round(current)) })
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
            height: "100%",
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

        currentSelectedAnno = withAnnotationRotation(currentSelectedAnno, this.state.rotation)
        currentSelectedAnno = withAnnotationCutout(currentSelectedAnno, this.state.cutout)

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

        projectDB.updateAnnotations(this.props.selectedProjectId, annos)
            .then(() => {
                this.props.updateAnnos(annos)
            })

        const container = document.getElementById("annotations_list");
        const el = document.getElementById(`anno_edit_card_${this.props.selectedAnnotation.id}`);
        if (container && el) {
            container.scrollTo({
                top: el.offsetTop - container.clientHeight / 2 + el.clientHeight / 2,
                behavior: "smooth"
            });
        }

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

    removeZone = (index) => {
        const selected = this.props.selectedAnnotation
        const annotations = this.props.annotations.map(anno =>
            anno.id === selected.id ? removeTargetAt(anno, index) : anno)

        projectDB.updateAnnotations(this.props.selectedProjectId, annotations)
            .then(() => {
                this.props.updateAnnos(annotations)
            })
    }

    render() {
        const { tab } = this.state
        const zones = getTargets(this.props.selectedAnnotation)
        const current = TABS.find(item => item.name === tab)

        return (
            <div ref={this.panelRef} className="card bg-base-100 shadow-xl rich-card-editor">
                <div className="card-body">

                    <div className="rich-card-bar"
                        onPointerDown={this.startDrag}
                        onPointerMove={this.moveDrag}
                        onPointerUp={this.endDrag}
                        onPointerCancel={this.endDrag}>

                        {TABS.map(item =>
                            <button type="button"
                                key={item.name}
                                className={tab === item.name ? "rich-card-tab rich-card-tab--current" : "rich-card-tab"}
                                onClick={() => this.setState({ tab: item.name })}>
                                {this.props.t(item.label)}
                            </button>
                        )}

                        <div className="rich-card-actions">
                            <button type="button" className="btn btn-sm" onClick={() => this.saveMD()}>
                                <FontAwesomeIcon icon={faSave} /> &nbsp; {this.props.t('editor.md_save')}
                            </button>
                            <button type="button"
                                className="btn btn-square btn-sm"
                                aria-label={this.props.t('buttons.close')}
                                onClick={() => this.props.closeMdEditor()}>
                                <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" /></svg>
                            </button>
                        </div>
                    </div>

                    <div className="rich-card-hint">{this.props.t(current.hint)}</div>

                    <div className="rich-card-pane">
                        <div id="editor" style={{ display: tab === 'editor' ? 'block' : 'none' }}></div>

                        {tab === 'editor' &&
                            <OrientationPicker
                                rotation={this.state.rotation}
                                setRotation={rotation => this.setState({ rotation })}
                                capture={() => this.captureCurrentRotation()}
                                cutout={this.state.cutout}
                                setCutout={cutout => this.setState({ cutout })}
                                translate={this.props.t} />
                        }

                        {tab === 'zones' &&
                            <div className="zone-list">
                                {zones.map((target, index) =>
                                    <div className="zone-row" key={`zone-${index}`}
                                        onClick={() => this.props.changeSelectedAnno(this.props.selectedAnnotation, index)}>
                                        <ZonePreview target={target} />
                                        <button type="button"
                                            className="btn btn-sm btn-outline btn-error"
                                            disabled={zones.length < 2}
                                            onClick={event => {
                                                event.stopPropagation()
                                                this.removeZone(index)
                                            }}>
                                            <div className="tooltip tooltip-left z-50" data-tip={this.props.t('annotation.delete_zone')}>
                                                <FontAwesomeIcon icon={faTrash} />
                                            </div>
                                        </button>
                                    </div>
                                )}
                            </div>
                        }

                        {tab === 'tags' &&
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
                            </div>
                        }

                        {tab === 'audio' &&
                            <>
                                <label className="form-control w-full">
                                    <div className="label font-medium">
                                        <span className="label-text">{this.props.t('editor.audio_track')}</span>
                                    </div>
                                    <input type="text"
                                        className="input input-bordered w-full grow"
                                        id="track"
                                        onChange={e => this.setState({ audioTrack: e.target.value })}
                                        value={this.state.audioTrack} />
                                </label>

                                {this.state.audioTrack &&
                                    <figure className="mt-2 flex" style={{ justifyContent: 'flex-start' }}>
                                        <audio controls src={this.state.audioTrack} id="audioTag"></audio>
                                    </figure>
                                }

                                <label className="form-control w-full mt-4">
                                    <div className="label font-medium">
                                        <span className="label-text">{this.props.t('editor.audio_creator')}</span>
                                    </div>
                                    <input type="text"
                                        className="input input-bordered w-full grow"
                                        id="creator"
                                        onChange={e => this.setState({ audioCreator: e.target.value })}
                                        value={this.state.audioCreator} />
                                </label>
                            </>
                        }
                    </div>
                </div>
            </div>
        )
    }
}

function OrientationPicker({ rotation, setRotation, capture, cutout, setCutout, translate }) {
    const isFreeAngle = rotation !== null && !QUARTER_TURNS.includes(rotation)

    return <div className="editor-orientation mt-4">
        <div className="label font-medium">
            <span className="label-text">{translate('editor.orientation')}</span>
        </div>
        <div className="flex items-center gap-2 flex-wrap mb-2">
            <button type="button"
                className={rotation === null ? "btn btn-sm" : "btn btn-sm btn-outline"}
                onClick={() => setRotation(null)}>
                {translate('editor.orientation_inherit')}
            </button>
            {QUARTER_TURNS.map(degrees => (
                <button type="button"
                    key={degrees}
                    className={rotation === degrees ? "btn btn-sm" : "btn btn-sm btn-outline"}
                    onClick={() => setRotation(degrees)}>
                    {degrees}&deg;
                </button>
            ))}
            <button type="button"
                className={isFreeAngle ? "btn btn-sm" : "btn btn-sm btn-outline"}
                onClick={() => capture()}>
                <FontAwesomeIcon icon={faCrosshairs} /> &nbsp; {translate('editor.orientation_capture')}
                {isFreeAngle && <>&nbsp; ({rotation}&deg;)</>}
            </button>
        </div>

        <label className="cursor-pointer flex items-center gap-2">
            <input type="checkbox"
                className="toggle toggle-sm"
                checked={cutout}
                onChange={() => setCutout(!cutout)} />
            <span className="label-text">{translate('editor.cutout')}</span>
        </label>
        <div className="label">
            <span className="label-text-alt">{translate('editor.cutout_hint')}</span>
        </div>
    </div>
}


const NoOptionsMessage = ({ t }) => {
    return (
        <span className='flex items-center justify-center py-2'>{t('editor.empty_list')}</span>
    );
};

export default withTranslation()(AdnoMdEditor);

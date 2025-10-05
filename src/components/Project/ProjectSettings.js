import { Component } from "react";

// Import FontAwesome
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faSave } from "@fortawesome/free-solid-svg-icons";

// Import SweetAlert
import Swal from "sweetalert2";

// Import CSS 
import "./ProjectSettings.css";

// Add translations
import { withTranslation } from "react-i18next";

import ReactSelect from 'react-select/creatable';
import { buildTagsList } from "../../Utils/utils";

const PARAMETERS_BY_TAB = {
    'viewer': ['showNavigator', 'rotation', 'showOutlines', 'showEyes', 'toolsbarOnFs', 'sidebarEnabled', 'displayToolbar', 'showCurrentAnnotation'],
    'navigation': ['delay', 'shouldAutoPlayAnnotations', 'startbyfirstanno', 'tags', 'soundMode'],
    'annotation': ['outlineWidth', 'outlineColor', 'outlineColorFocus'],
}

class ProjectSettings extends Component {
    constructor(props) {
        super(props);
        this.state = {
            settings: { ...this.props.settings },
            tab: 'viewer'
        }
    }

    updateProjectSettings = (e) => {
        e.preventDefault()

        this.props.updateSettings(this.state.settings)
        this.props.closeSettings()

        Swal.fire({
            title: this.props.t('modal.settings_updated_success'),
            showCancelButton: false,
            confirmButtonText: 'Ok',
            icon: 'success',
        })
    }

    getAllAnnotationsTags = () => {
        const tags = this.props.annotations
            .flatMap(annotation => buildTagsList(annotation))
            .map(tag => tag.value);

        return [...new Set(tags)].map(tag => ({ value: tag, label: tag }))
    }

    render() {
        const tags = this.getAllAnnotationsTags()

        const soundsMode = [{
            label: this.props.t('project.settings.no_sound'),
            value: 'no_sound'
        },
        {
            label: this.props.t('project.settings.no_spatialization'),
            value: 'no_spatialization'
        },
        {
            label: this.props.t('project.settings.spatialization'),
            value: 'spatialization'
        }]

        return (
            <div className="project-metadatas-backdrop">
                <form className="project-metadatas-container" onSubmit={(e) => { this.updateProjectSettings(e) }} style={{ position: 'relative' }}>
                    <button type="button" className="btn btn-square btn-sm" onClick={() => this.props.closeSettings()}
                        style={{
                            position: 'absolute',
                            top: 12,
                            right: 12
                        }}>
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" /></svg>
                    </button>
                    <div className="flex justify-center mt-5 mb-8 items-center" style={{ width: '75%' }}>
                        <TabSelector tab={this.state.tab} setTab={tab => this.setState({ tab })} translate={this.props.t} />
                    </div>

                    <div className={`project-metadatas ${this.state.tab === 'viewer' ? 'propject-metadatas--grid' : ''}`}>
                        {PARAMETERS_BY_TAB[this.state.tab].includes('tags') && <>
                            <label className="form-control w-full mt-4">
                                <div className="label font-medium">
                                    <span className="label-text">{this.props.t('project.settings.tags')}</span>
                                </div>
                                <ReactSelect
                                    isMulti
                                    isClearable
                                    name="tags"
                                    options={tags}
                                    value={(this.state.settings?.tags || []).map(tag => ({ label: tag, value: tag }))}
                                    onChange={newTags => this.setState({ settings: { ...this.state.settings, tags: newTags.map(tag => tag.value) } })}
                                    placeholder={this.props.t('annotation.tags_list')}
                                    noOptionsMessage={() => this.props.t('annotation.empty_tags_list')}
                                    className="basic-multi-select mb-2 custom-react-select max-w-4xl"
                                    classNamePrefix="select"
                                />
                            </label>
                        </>}

                        {PARAMETERS_BY_TAB[this.state.tab].includes('delay') && <>
                            <label className="form-control w-full mt-4">
                                <div className="label font-medium">
                                    <span className="label-text">{this.props.t('project.settings.delay')}</span>
                                </div>
                                <input type="number" placeholder="2" className="input input-bordered w-60" value={this.state.settings.delay}
                                    onChange={(e) => this.setState({ settings: { ...this.state.settings, delay: e.target.value } })} />
                            </label>
                        </>}

                        {PARAMETERS_BY_TAB[this.state.tab].includes('outlineWidth') && <>
                            <label className="form-control w-full mt-4">
                                <div className="label font-medium">
                                    <span className="label-text">{this.props.t('project.settings.outline_width')}</span>
                                </div>
                                <select size="5" className="input input-bordered h-fit w-full max-w-4xl font-mono outline-select" defaultValue={this.state.settings.outlineWidth}
                                    onChange={(e) => this.setState({ settings: { ...this.state.settings, outlineWidth: e.target.value } })}>
                                    <option value="outline-1px" className="outline-1px">1px</option>
                                    <option value="outline-2px" className="outline-2px">2px</option>
                                    <option value="outline-3px" className="outline-3px">3px</option>
                                    <option value="outline-5px" className="outline-5px">5px</option>
                                    <option value="outline-8px" className="outline-8px">8px</option>
                                </select>
                            </label>
                        </>}

                        {PARAMETERS_BY_TAB[this.state.tab].includes('outlineColor') && <>
                            <label className="form-control w-full mt-4">
                                <div className="label font-medium">
                                    <span className="label-text">{this.props.t('project.settings.outline_color')}</span>
                                </div>
                                <div className="flex space-x-4 bg-gray-100 w-fit rounded-lg">
                                    <input type="radio" name="color" value="outline-white"
                                        className="h-4 w-4 p-4 border-8 border-slate-200 checked:border-slate-800 radio bg-white checked:bg-white rounded-lg cursor-pointer"
                                        checked={!this.state.settings.outlineColor || (this.state.settings.outlineColor === "outline-white")} onChange={(e) => this.setState({ settings: { ...this.state.settings, outlineColor: e.target.value } })}
                                    />
                                    <input type="radio" name="color" value="outline-red"
                                        className="h-4 w-4 p-4 border-8 border-slate-200 checked:border-slate-800 radio bg-red-500 checked:bg-red-500 rounded-lg cursor-pointer"
                                        checked={this.state.settings.outlineColor === "outline-red"}
                                        onChange={(e) => this.setState({ settings: { ...this.state.settings, outlineColor: e.target.value } })}
                                    />
                                    <input type="radio" name="color" value="outline-orange"
                                        className="h-4 w-4 p-4 border-8 border-slate-200 checked:border-slate-800 radio radio bg-amber-500 checked:bg-amber-500 rounded-lg cursor-pointer"
                                        checked={this.state.settings.outlineColor === "outline-orange"} onChange={(e) => this.setState({ settings: { ...this.state.settings, outlineColor: e.target.value } })}
                                    />
                                    <input type="radio" name="color" value="outline-yellow"
                                        className="h-4 w-4 p-4 border-8 border-slate-200 checked:border-slate-800 radio radio bg-yellow-300 checked:bg-yellow-300 rounded-lg cursor-pointer"
                                        checked={this.state.settings.outlineColor === "outline-yellow"} onChange={(e) => this.setState({ settings: { ...this.state.settings, outlineColor: e.target.value } })}
                                    />
                                    <input type="radio" name="color" value="outline-green"
                                        className="h-4 w-4 p-4 border-8 border-slate-200 checked:border-slate-800 radio radio bg-lime-500 checked:bg-lime-500 rounded-lg cursor-pointer"
                                        checked={this.state.settings.outlineColor === "outline-green"} onChange={(e) => this.setState({ settings: { ...this.state.settings, outlineColor: e.target.value } })}
                                    />
                                    <input type="radio" name="color" value="outline-blue"
                                        className="h-4 w-4 p-4 border-8 border-slate-200 checked:border-slate-800 radio bg-blue-400 checked:bg-blue-400 rounded-lg cursor-pointer"
                                        checked={this.state.settings.outlineColor === "outline-blue"} onChange={(e) => this.setState({ settings: { ...this.state.settings, outlineColor: e.target.value } })}
                                    />
                                    <input type="radio" name="color" value="outline-violet"
                                        className="h-4 w-4 p-4 border-8 border-slate-200 checked:border-slate-800 radio bg-violet-500 checked:bg-violet-500 rounded-lg cursor-pointer"
                                        checked={this.state.settings.outlineColor === "outline-violet"} onChange={(e) => this.setState({ settings: { ...this.state.settings, outlineColor: e.target.value } })}
                                    />
                                    <input type="radio" name="color" value="outline-black"
                                        className="h-4 w-4 p-4 border-8 border-slate-200 checked:border-slate-800 radio bg-black checked:bg-black rounded-lg cursor-pointer"
                                        checked={this.state.settings.outlineColor === "outline-black"} onChange={(e) => this.setState({ settings: { ...this.state.settings, outlineColor: e.target.value } })}
                                    />
                                </div>
                            </label>
                        </>}

                        {PARAMETERS_BY_TAB[this.state.tab].includes('outlineColorFocus') && <>
                            <label className="form-control w-full mt-4">
                                <div className="label font-medium">
                                    <span className="label-text">{this.props.t('project.settings.outline_focus')}</span>
                                </div>
                                <div className="flex space-x-4 bg-gray-100 w-fit rounded-lg">
                                    <input type="radio" name="focus" value="outline-focus-white"
                                        className="h-4 w-4 p-4 border-8 border-slate-200 checked:border-slate-800 radio bg-white checked:bg-white rounded-lg cursor-pointer"
                                        checked={this.state.settings.outlineColorFocus === "outline-focus-white"} onChange={(e) => this.setState({ settings: { ...this.state.settings, outlineColorFocus: e.target.value } })}
                                    />
                                    <input type="radio" name="focus" value="outline-focus-red"
                                        className="h-4 w-4 p-4 border-8 border-slate-200 checked:border-slate-800 radio bg-red-500 checked:bg-red-500 rounded-lg cursor-pointer"
                                        checked={this.state.settings.outlineColorFocus === "outline-focus-red"}
                                        onChange={(e) => this.setState({ settings: { ...this.state.settings, outlineColorFocus: e.target.value } })}
                                    />
                                    <input type="radio" name="focus" value="outline-focus-orange"
                                        className="h-4 w-4 p-4 border-8 border-slate-200 checked:border-slate-800 radio radio bg-amber-500 checked:bg-amber-500 rounded-lg cursor-pointer"
                                        checked={this.state.settings.outlineColorFocus === "outline-focus-orange"} onChange={(e) => this.setState({ settings: { ...this.state.settings, outlineColorFocus: e.target.value } })}
                                    />
                                    <input type="radio" name="focus" value="outline-focus-yellow"
                                        className="h-4 w-4 p-4 border-8 border-slate-200 checked:border-slate-800 radio radio bg-yellow-300 checked:bg-yellow-300 rounded-lg cursor-pointer"
                                        checked={!this.state.settings.outlineColorFocus || (this.state.settings.outlineColorFocus === "outline-focus-yellow")} onChange={(e) => this.setState({ settings: { ...this.state.settings, outlineColorFocus: e.target.value } })}
                                    />
                                    <input type="radio" name="focus" value="outline-focus-green"
                                        className="h-4 w-4 p-4 border-8 border-slate-200 checked:border-slate-800 radio radio bg-lime-500 checked:bg-lime-500 rounded-lg cursor-pointer"
                                        checked={this.state.settings.outlineColorFocus === "outline-focus-green"} onChange={(e) => this.setState({ settings: { ...this.state.settings, outlineColorFocus: e.target.value } })}
                                    />
                                    <input type="radio" name="focus" value="outline-focus-blue"
                                        className="h-4 w-4 p-4 border-8 border-slate-200 checked:border-slate-800 radio bg-blue-400 checked:bg-blue-400 rounded-lg cursor-pointer"
                                        checked={this.state.settings.outlineColorFocus === "outline-focus-blue"} onChange={(e) => this.setState({ settings: { ...this.state.settings, outlineColorFocus: e.target.value } })}
                                    />
                                    <input type="radio" name="focus" value="outline-focus-violet"
                                        className="h-4 w-4 p-4 border-8 border-slate-200 checked:border-slate-800 radio bg-violet-500 checked:bg-violet-500 rounded-lg cursor-pointer"
                                        checked={this.state.settings.outlineColorFocus === "outline-focus-violet"} onChange={(e) => this.setState({ settings: { ...this.state.settings, outlineColorFocus: e.target.value } })}
                                    />
                                    <input type="radio" name="focus" value="outline-focus-black"
                                        className="h-4 w-4 p-4 border-8 border-slate-200 checked:border-slate-800 radio bg-black checked:bg-black rounded-lg cursor-pointer"
                                        checked={this.state.settings.outlineColorFocus === "outline-focus-black"} onChange={(e) => this.setState({ settings: { ...this.state.settings, outlineColorFocus: e.target.value } })}
                                    />
                                </div>
                            </label>
                        </>}

                        {PARAMETERS_BY_TAB[this.state.tab].includes('startbyfirstanno') && <>
                            <label className="form-control w-full mt-4">
                                <div className="label font-medium">
                                    <span className="label-text">{this.props.t('project.settings.begin_first_anno')}</span>
                                </div>
                                <input type="checkbox" className="toggle toggle-toolsbar" checked={this.state.settings.startbyfirstanno}
                                    onChange={() => this.setState({ settings: { ...this.state.settings, startbyfirstanno: !this.state.settings.startbyfirstanno } })} />
                            </label>
                        </>}

                        {PARAMETERS_BY_TAB[this.state.tab].includes('shouldAutoPlayAnnotations') && <>
                            <label className="form-control w-full mt-4">
                                <div className="label font-medium">
                                    <span className="label-text">{this.props.t('project.settings.should_auto_play_annotations')}</span>
                                </div>
                                <input type="checkbox" className="toggle toggle-toolsbar" checked={this.state.settings.shouldAutoPlayAnnotations}
                                    onChange={() => this.setState({ settings: { ...this.state.settings, shouldAutoPlayAnnotations: !this.state.settings.shouldAutoPlayAnnotations } })} />
                            </label>
                        </>}

                        {PARAMETERS_BY_TAB[this.state.tab].includes('showNavigator') && <>
                            <label className="form-control w-full mt-4">
                                <div className="label font-medium">
                                    <span className="label-text">{this.props.t('project.settings.navigator')}</span>
                                </div>
                                <input type="checkbox" className="toggle toggle-navigator" checked={this.state.settings.showNavigator}
                                    onChange={() => this.setState({ settings: { ...this.state.settings, showNavigator: !this.state.settings.showNavigator } })} />
                            </label>
                        </>}

                        {PARAMETERS_BY_TAB[this.state.tab].includes('displayToolbar') && <>
                            <label className="form-control w-full mt-4">
                                <div className="label font-medium">
                                    <span className="label-text">{this.props.t('project.settings.toolsbar')}</span>
                                </div>
                                <input type="checkbox" className="toggle toggle-toolsbar" checked={this.state.settings.displayToolbar}
                                    onChange={() => this.setState({ settings: { ...this.state.settings, displayToolbar: !this.state.settings.displayToolbar } })} />
                            </label>
                        </>}

                        {PARAMETERS_BY_TAB[this.state.tab].includes('showOutlines') && <>
                            <label className="form-control w-full mt-4">
                                <div className="label font-medium">
                                    <span className="label-text">{this.props.t('project.settings.show_outlines')}</span>
                                </div>
                                <input type="checkbox" className="toggle toggle-navigator"
                                    checked={this.state.settings.showOutlines}
                                    onChange={() => this.setState({
                                        settings: {
                                            ...this.state.settings,
                                            showOutlines: !this.state.settings.showOutlines
                                        }
                                    })} />
                            </label>
                        </>}

                        {PARAMETERS_BY_TAB[this.state.tab].includes('toolsbarOnFs') && <>
                            <label className="form-control w-full mt-4">
                                <div className="label font-medium">
                                    <span className="label-text">{this.props.t('project.settings.fullscreen')}</span>
                                </div>
                                <input type="checkbox" className="toggle toggle-toolsbar" checked={this.state.settings.toolsbarOnFs}
                                    onChange={() => this.setState({ settings: { ...this.state.settings, toolsbarOnFs: !this.state.settings.toolsbarOnFs } })} />
                            </label>
                        </>}
                        
                        {PARAMETERS_BY_TAB[this.state.tab].includes('showCurrentAnnotation') && <>
                            <label className="form-control w-full mt-4">
                                <div className="label font-medium">
                                    <span className="label-text">{this.props.t('project.settings.show_only_current_annotation')}</span>
                                </div>
                                <input type="checkbox" className="toggle toggle-navigator"
                                    checked={this.state.settings.showCurrentAnnotation}
                                    onChange={() => this.setState({
                                        settings: {
                                            ...this.state.settings,
                                            showCurrentAnnotation: !this.state.settings.showCurrentAnnotation
                                        }
                                    })} />
                            </label>
                        </>}

                        {PARAMETERS_BY_TAB[this.state.tab].includes('showEyes') && <>
                            <label className="form-control w-full mt-4">
                                <div className="label font-medium">
                                    <span className="label-text">{this.props.t('project.settings.show_eyes')}</span>
                                </div>
                                <input type="checkbox" className="toggle toggle-navigator"
                                    checked={this.state.settings.showEyes}
                                    onChange={() => this.setState({
                                        settings: {
                                            ...this.state.settings,
                                            showEyes: !this.state.settings.showEyes
                                        }
                                    })} />
                            </label>
                        </>}

                        {PARAMETERS_BY_TAB[this.state.tab].includes('soundMode') && <>
                            <label className="form-control w-full mt-4">
                                <div className="label font-medium">
                                    <span className="label-text">{this.props.t('project.settings.annotation_sound')}</span>
                                </div>
                                <ReactSelect
                                    name="sound_mode"
                                    options={soundsMode}
                                    value={soundsMode.find(f => f.value === this.state.settings?.soundMode)}
                                    defaultValue={soundsMode.find(f => f.value === 'no_sound')}
                                    onChange={soundMode => this.setState({ settings: { ...this.state.settings, soundMode: soundMode?.value } })}
                                    placeholder={this.props.t('project.settings.annotation_sound')}
                                    className="basic-multi-select custom-react-select max-w-4xl"
                                    classNamePrefix="select"
                                />
                            </label>
                        </>}


                        {PARAMETERS_BY_TAB[this.state.tab].includes('sidebarEnabled') && <>
                            <label className="form-control w-full mt-4">
                                <div className="label font-medium">
                                    <span className="label-text">{this.props.t('project.settings.annos_nav')}</span>
                                </div>
                                <input type="checkbox" className="toggle toggle-toolsbar" checked={this.state.settings.sidebarEnabled}
                                    onChange={() => this.setState({ settings: { ...this.state.settings, sidebarEnabled: !this.state.settings.sidebarEnabled } })} />
                            </label>
                        </>}

                        {PARAMETERS_BY_TAB[this.state.tab].includes('rotation') && <>
                            <label className="form-control w-full mt-4">
                                <div className="label font-medium">
                                    <span className="label-text">{this.props.t('project.settings.enable_rota')}</span>
                                </div>
                                <input type="checkbox" className="toggle toggle-toolsbar" checked={this.state.settings.rotation}
                                    onChange={() => this.setState({ settings: { ...this.state.settings, rotation: !this.state.settings.rotation } })} />
                            </label>
                        </>}
                    </div>

                    <div className="metadata-editor-btns">
                        <button type="submit" className="btn" ><FontAwesomeIcon icon={faSave} className="mr-2" />  &nbsp; {this.props.t('project.settings.save')} </button>
                    </div>
                </form >
            </div >
        )
    }
}

function TabSelector({ tab, setTab, translate }) {

    return <div className="flex">
        <button type="button"
            className="btn btn-outline"
            style={{ borderBottom: tab === 'viewer' ? '4px solid #000' : '1px solid', borderRadius: 0 }}
            onClick={() => setTab('viewer')}>{translate('project.settings.visualization')}</button>
        <button type="button"
            className="btn btn-outline"
            style={{ borderBottom: tab === 'navigation' ? '4px solid #000' : '1px solid', borderLeft: 0, borderRight: 0, borderRadius: 0 }}
            onClick={() => setTab('navigation')}>{translate('project.settings.navigation')}</button>
        <button type="button"
            className="btn btn-outline"
            style={{ borderBottom: tab === 'annotation' ? '4px solid #000' : '1px solid', borderRadius: 0 }}
            onClick={() => setTab('annotation')}>{translate('project.settings.annotation')}</button>
    </div>
}

export default withTranslation()(ProjectSettings);

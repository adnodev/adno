import { withTranslation } from "react-i18next";

import ReactSelect from 'react-select';

function CustomProjectSettings({ t, settings, setSettings }) {

    const soundsMode = [{
        label: t('project.settings.no_sound'),
        value: 'no_sound'
    },
    {
        label: t('project.settings.no_spatialization'),
        value: 'no_spatialization'
    },
    {
        label: t('project.settings.spatialization'),
        value: 'spatialization'
    }]

    const handleColor = (name, newColor) => {
        setSettings({ ...settings, [name]: settings[name] !== newColor ? newColor : false })
    }

    return <>
        <label className="label">
            <span className="label-text">{t('project.settings.delay')}</span>
        </label>
        <input type="number" placeholder="2" className="input input-bordered w-full" value={settings.delay}
            onChange={(e) => setSettings({ ...settings, delay: e.target.value })} />


        <label className="label">
            <span className="label-text">{t('project.settings.outline_width')}</span>
        </label>
        <select size="5" className="input input-bordered h-fit w-full font-mono outline-select" defaultValue={settings.outlineWidth}
            onChange={(e) => setSettings({ ...settings, outlineWidth: e.target.value })}>
            <option value="outline-1px" className="outline-1px">1px</option>
            <option value="outline-2px" className="outline-2px">2px</option>
            <option value="outline-3px" className="outline-3px">3px</option>
            <option value="outline-5px" className="outline-5px">5px</option>
            <option value="outline-8px" className="outline-8px">8px</option>
        </select>

        <label className="label">
            <span className="label-text">{t('project.settings.outline_color')}</span>
        </label>
        <div className="m-2 flex space-x-4 bg-gray-100 w-fit p-4 rounded-lg">
            <input type="radio" name="color" value="outline-white"
                className="h-4 w-4 p-4 border-8 border-slate-200 checked:border-slate-800 radio bg-white checked:bg-white rounded-lg cursor-pointer"
                checked={settings.outlineColor === "outline-white"}
                onChange={() => { }}
                onClick={e => handleColor('outlineColor', e.target.value)}
            />
            <input type="radio" name="color" value="outline-red"
                className="h-4 w-4 p-4 border-8 border-slate-200 checked:border-slate-800 radio bg-red-500 checked:bg-red-500 rounded-lg cursor-pointer"
                checked={settings.outlineColor === "outline-red"}
                onChange={() => { }}
                onClick={e => handleColor('outlineColor', e.target.value)}
            />
            <input type="radio" name="color" value="outline-orange"
                className="h-4 w-4 p-4 border-8 border-slate-200 checked:border-slate-800 radio radio bg-amber-500 checked:bg-amber-500 rounded-lg cursor-pointer"
                checked={settings.outlineColor === "outline-orange"} onChange={() => { }}
                onClick={e => handleColor('outlineColor', e.target.value)}
            />
            <input type="radio" name="color" value="outline-yellow"
                className="h-4 w-4 p-4 border-8 border-slate-200 checked:border-slate-800 radio radio bg-yellow-300 checked:bg-yellow-300 rounded-lg cursor-pointer"
                checked={settings.outlineColor === "outline-yellow"} onChange={() => { }}
                onClick={e => handleColor('outlineColor', e.target.value)}
            />
            <input type="radio" name="color" value="outline-green"
                className="h-4 w-4 p-4 border-8 border-slate-200 checked:border-slate-800 radio radio bg-lime-500 checked:bg-lime-500 rounded-lg cursor-pointer"
                checked={settings.outlineColor === "outline-green"} onChange={() => { }}
                onClick={e => handleColor('outlineColor', e.target.value)}
            />
            <input type="radio" name="color" value="outline-blue"
                className="h-4 w-4 p-4 border-8 border-slate-200 checked:border-slate-800 radio bg-blue-400 checked:bg-blue-400 rounded-lg cursor-pointer"
                checked={settings.outlineColor === "outline-blue"} onChange={() => { }}
                onClick={e => handleColor('outlineColor', e.target.value)}
            />
            <input type="radio" name="color" value="outline-violet"
                className="h-4 w-4 p-4 border-8 border-slate-200 checked:border-slate-800 radio bg-violet-500 checked:bg-violet-500 rounded-lg cursor-pointer"
                checked={settings.outlineColor === "outline-violet"} onChange={() => { }}
                onClick={e => handleColor('outlineColor', e.target.value)}
            />
            <input type="radio" name="color" value="outline-black"
                className="h-4 w-4 p-4 border-8 border-slate-200 checked:border-slate-800 radio bg-black checked:bg-black rounded-lg cursor-pointer"
                checked={settings.outlineColor === "outline-black"} onChange={() => { }}
                onClick={e => handleColor('outlineColor', e.target.value)}
            />
        </div>

        <label className="label">
            <span className="label-text">{t('project.settings.outline_focus')}</span>
        </label>
        <div className="m-2 flex space-x-4 bg-gray-100 w-fit p-4 rounded-lg">
            <input type="radio" name="focus" value="outline-focus-white"
                className="h-4 w-4 p-4 border-8 border-slate-200 checked:border-slate-800 radio bg-white checked:bg-white rounded-lg cursor-pointer"
                checked={settings.outlineColorFocus === "outline-focus-white"}
                onChange={() => { }}
                onClick={e => handleColor('outlineColorFocus', e.target.value)}
            />
            <input type="radio" name="focus" value="outline-focus-red"
                className="h-4 w-4 p-4 border-8 border-slate-200 checked:border-slate-800 radio bg-red-500 checked:bg-red-500 rounded-lg cursor-pointer"
                checked={settings.outlineColorFocus === "outline-focus-red"}
                onChange={() => { }}
                onClick={e => handleColor('outlineColorFocus', e.target.value)}
            />
            <input type="radio" name="focus" value="outline-focus-orange"
                className="h-4 w-4 p-4 border-8 border-slate-200 checked:border-slate-800 radio radio bg-amber-500 checked:bg-amber-500 rounded-lg cursor-pointer"
                checked={settings.outlineColorFocus === "outline-focus-orange"}
                onChange={() => { }}
                onClick={e => handleColor('outlineColorFocus', e.target.value)}
            />
            <input type="radio" name="focus" value="outline-focus-yellow"
                className="h-4 w-4 p-4 border-8 border-slate-200 checked:border-slate-800 radio radio bg-yellow-300 checked:bg-yellow-300 rounded-lg cursor-pointer"
                checked={settings.outlineColorFocus === "outline-focus-yellow"}
                onChange={() => { }}
                onClick={e => handleColor('outlineColorFocus', e.target.value)}
            />
            <input type="radio" name="focus" value="outline-focus-green"
                className="h-4 w-4 p-4 border-8 border-slate-200 checked:border-slate-800 radio radio bg-lime-500 checked:bg-lime-500 rounded-lg cursor-pointer"
                checked={settings.outlineColorFocus === "outline-focus-green"}
                onChange={() => { }}
                onClick={e => handleColor('outlineColorFocus', e.target.value)}
            />
            <input type="radio" name="focus" value="outline-focus-blue"
                className="h-4 w-4 p-4 border-8 border-slate-200 checked:border-slate-800 radio bg-blue-400 checked:bg-blue-400 rounded-lg cursor-pointer"
                checked={settings.outlineColorFocus === "outline-focus-blue"}
                onChange={() => { }}
                onClick={e => handleColor('outlineColorFocus', e.target.value)}
            />
            <input type="radio" name="focus" value="outline-focus-violet"
                className="h-4 w-4 p-4 border-8 border-slate-200 checked:border-slate-800 radio bg-violet-500 checked:bg-violet-500 rounded-lg cursor-pointer"
                checked={settings.outlineColorFocus === "outline-focus-violet"}
                onChange={() => { }}
                onClick={e => handleColor('outlineColorFocus', e.target.value)}
            />
            <input type="radio" name="focus" value="outline-focus-black"
                className="h-4 w-4 p-4 border-8 border-slate-200 checked:border-slate-800 radio bg-black checked:bg-black rounded-lg cursor-pointer"
                checked={settings.outlineColorFocus === "outline-focus-black"}
                onChange={() => { }}
                onClick={e => handleColor('outlineColorFocus', e.target.value)}
            />
        </div>

        <label className="label">
            <span className="label-text">{t('project.settings.begin_first_anno')}</span>
        </label>
        <input type="checkbox" className="toggle toggle-toolsbar" checked={settings.startbyfirstanno}
            onChange={() => setSettings({ ...settings, startbyfirstanno: !settings.startbyfirstanno })} />


        <label className="label">
            <span className="label-text">{t('project.settings.should_auto_play_annotations')}</span>
        </label>
        <input type="checkbox" className="toggle toggle-toolsbar" checked={settings.shouldAutoPlayAnnotations}
            onChange={() => setSettings({ ...settings, shouldAutoPlayAnnotations: !settings.shouldAutoPlayAnnotations })} />


        <label className="label" >
            <span className="label-text">{t('project.settings.navigator')}</span>
        </label>
        <input type="checkbox" className="toggle toggle-navigator" checked={settings.showNavigator}
            onChange={() => setSettings({ ...settings, showNavigator: !settings.showNavigator })} />

        <label className="label">
            <span className="label-text">
                {t('project.settings.show_outlines')}
            </span>
        </label>
        <input type="checkbox" className="toggle toggle-navigator"
            checked={settings.showOutlines}
            onChange={() => setSettings({
                ...settings,
                showOutlines: !settings.showOutlines
            })} />

        <label className="label">
            <span className="label-text">
                {t('project.settings.show_only_current_annotation')}
            </span>
        </label>
        <input type="checkbox" className="toggle toggle-navigator"
            checked={settings.showCurrentAnnotation}
            onChange={() => setSettings({
                ...settings,
                showCurrentAnnotation: !settings.showCurrentAnnotation
            })} />

        <label className="label">
            <span className="label-text">
                {t('project.settings.show_eyes')}
            </span>
        </label>
        <input type="checkbox" className="toggle toggle-navigator"
            checked={settings.showEyes}
            onChange={() => setSettings({
                ...settings,
                showEyes: !settings.showEyes
            })} />

        <label className="label">
            <span className="label-text">{t('project.settings.annotation_sound')}</span>
        </label>
        <ReactSelect
            name="sound_mode"
            options={soundsMode}
            value={soundsMode.find(f => f.value === settings?.soundMode)}
            defaultValue={soundsMode.find(f => f.value === 'no_sound')}
            onChange={soundMode => setSettings({ ...settings, soundMode: soundMode?.value })}
            placeholder={t('project.settings.annotation_sound')}
            className="basic-multi-select mb-2 custom-react-select"
            classNamePrefix="select"
        />

        <label className="label">
            <span className="label-text">{t('project.settings.toolsbar')}</span>
        </label>
        <input type="checkbox" className="toggle toggle-toolsbar" checked={settings.displayToolbar}
            onChange={() => setSettings({ ...settings, displayToolbar: !settings.displayToolbar })} />

        <label className="label">
            <span className="label-text">{t('project.settings.anno_bounds')}</span>
        </label>
        <input type="checkbox" className="toggle toggle-toolsbar" checked={settings.annoBounds}
            onChange={() => setSettings({ ...settings, annoBounds: !settings.annoBounds })} />


        <label className="label">
            <span className="label-text">{t('project.settings.fullscreen')}</span>
        </label>
        <input type="checkbox" className="toggle toggle-toolsbar" checked={settings.toolsbarOnFs}
            onChange={() => setSettings({ ...settings, toolsbarOnFs: !settings.toolsbarOnFs })} />


        <label className="label">
            <span className="label-text">{t('project.settings.enable_rota')}</span>
        </label>
        <input type="checkbox" className="toggle toggle-toolsbar" checked={settings.rotation}
            onChange={() => setSettings({ ...settings, rotation: !settings.rotation })} />

    </>
}

export default withTranslation()(CustomProjectSettings)

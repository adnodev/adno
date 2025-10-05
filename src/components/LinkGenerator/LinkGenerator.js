import './LinkGenerator.css'
import { useEffect, useState } from "react"
import { withTranslation } from "react-i18next"

import { defaultProjectSettings } from '../../Utils/utils';
import CustomProjectSettings from './CustomProjectSettings';
import CopyButton from './CopyButton';

function LinkGenerator({ t }) {

    const [generatedURL, setGeneratedURL] = useState()
    const [url, setURL] = useState("https://static.emf.fr/adno/annotations.json")
    const [settings, setSettings] = useState(defaultProjectSettings())

    useEffect(() => {
        generateURL()
    }, [settings, url])

    const appendBooleanParam = (params, name, value) => {
        if (value)
            params.searchParams.append(name, value)
    }

    const generateURL = () => {
        const params = new URL("https://fo.bar");

        appendBooleanParam(params, "delay", settings.delay)
        appendBooleanParam(params, "navigator", settings.showNavigator)
        appendBooleanParam(params, "toolbarsfs", settings.toolsbarOnFs)
        appendBooleanParam(params, "anno_bounds", settings.annoBounds)

        appendBooleanParam(params, "startbyfirstanno", settings.startbyfirstanno)
        appendBooleanParam(params, "should_auto_play_annotations", settings.shouldAutoPlayAnnotations)
        appendBooleanParam(params, "rotation", settings.rotation)
        appendBooleanParam(params, "outlineWidth", settings.outlineWidth)
        appendBooleanParam(params, "outlineColor", settings.outlineColor)
        appendBooleanParam(params, "outlineColorFocus", settings.outlineColorFocus)
        appendBooleanParam(params, "show_outlines", settings.showOutlines)
        appendBooleanParam(params, "show_only_current_annotation", settings.showCurrentAnnotation)
        appendBooleanParam(params, "show_eyes", settings.showEyes)
        appendBooleanParam(params, "toolbar", settings.displayToolbar)

        if (settings.soundMode !== 'no_sound')
            appendBooleanParam(params, "sound_mode", settings.soundMode)

        setGeneratedURL(`/#/embed?url=${encodeURIComponent(url)}&${params.href.split('?').slice(1)}`)
    }

    return <div className="link-generator p-5">
        <h1>{t('link.h1')}</h1>
        <div className='flex gap-2'>
            <div className='flex-1'>
                <h2>Informations</h2>
                <label className="form-control w-full">
                    <div className="label">
                        <span className="label-text">{t('link.url')}</span>
                    </div>
                    <input type="text"
                        className="input input-bordered w-full"
                        value={url}
                        placeholder='https:// ...'
                        onChange={e => setURL(e.target.value)} />
                </label>

                <CustomProjectSettings
                    settings={settings}
                    setSettings={setSettings}
                />
            </div>
            <div className='flex-1 flex flex-col gap-2'>
                <h2>{t('link.preview')}</h2>
                <div className="mockup-code">
                    <pre>
                        {generatedURL}
                    </pre>
                </div>
                <CopyButton value={generatedURL} />
            </div>
        </div>
    </div>
}

export default withTranslation()(LinkGenerator)
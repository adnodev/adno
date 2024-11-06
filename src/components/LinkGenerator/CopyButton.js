import { useState } from "react";
import { withTranslation } from "react-i18next";

export default withTranslation()(function CopyButton({ value, t }) {
    const [copyIconName, setCopyIconName] = useState('fas fa-copy')

    const unsecuredCopyToClipboard = (text) => {
        const textArea = document.createElement('textarea');
        textArea.value = text;
        document.body.appendChild(textArea);
        textArea.focus();
        textArea.select();
        try {
            document.execCommand('copy');
        } catch (err) {
            console.error('Unable to copy to clipboard', err);
        }
        document.body.removeChild(textArea);
    };

    const copy = (value) => {
        if (window.isSecureContext && navigator.clipboard) {
            navigator.clipboard.writeText(value);
        } else {
            unsecuredCopyToClipboard(value);
        }

        setCopyIconName('fas fa-check')

        setTimeout(() => {
            setCopyIconName('fas fa-copy')
        }, 2000);
    };

    return <button
        type="button"
        className="btn btn-success"
        onClick={() => copy(value)}
    >
        {t('link.generate')} <i className={`${copyIconName} m-2`} />
    </button>
})
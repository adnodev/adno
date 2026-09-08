import { useState } from "react";
import { withTranslation } from "react-i18next";

import { copyToClipboard } from "../../Utils/clipboard";

export default withTranslation()(function CopyButton({ value, t }) {
    const [copyIconName, setCopyIconName] = useState('fas fa-copy')

    const copy = (value) => {
        copyToClipboard(value)

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
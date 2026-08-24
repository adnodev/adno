import { useState, useEffect } from "react";
import { createExportProjectJsonFile } from "../../Utils/utils";

export function DownloadLink({ selectedProject, translate }) {
    const [href, setHref] = useState("");

    useEffect(() => {
        if (!selectedProject) return

        let url = null
        let released = false

        createExportProjectJsonFile(selectedProject.id).then(created => {
            url = created

            if (released) {
                URL.revokeObjectURL(created)
                return
            }

            setHref(created)
        })

        return () => {
            released = true

            if (url) {
                URL.revokeObjectURL(url)
            }
        }
    }, [selectedProject])

    return (
        <a
            id={"download_btn_" + selectedProject.id}
            href={href}
            download={selectedProject.title + ".json"}
            title={translate('navbar.download_project')}
        >
            Adno
        </a>
    );
}
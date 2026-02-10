import { useState, useEffect } from "react";
import { createExportProjectJsonFile } from "../../Utils/utils";

export function DownloadLink({ selectedProject, translate }) {
    const [href, setHref] = useState("");

    useEffect(() => {
        if (!selectedProject) return;

        createExportProjectJsonFile(selectedProject.id).then(url => {
            setHref(url);
        });
    }, [selectedProject]);

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
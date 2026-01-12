import { faDownload, faExternalLink } from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { forwardRef, useEffect, useRef } from "react";
import { DownloadLink } from "./DownloadLink";

export const ExporterModal = forwardRef(({ translate, selectedProject, exportIIIF }, ref) => {

    useEffect(() => {
        const handleEscape = (e) => {
            if (e.key === 'Escape' && ref.current?.checked) {
                closeModal();
            }
        };

        document.addEventListener('keydown', handleEscape);

        return () => {
            document.removeEventListener('keydown', handleEscape);
        };
    }, []);

    const closeModal = () => ref.current.checked = false

    return <>
        <input type="checkbox" ref={ref} className="modal-toggle" />
        <div className="modal">
            <div className="modal-box" style={{ "color": "initial" }}>
                <button className="btn btn-square btn-sm"
                    onClick={closeModal}
                    style={{
                        position: 'absolute',
                        top: 12,
                        right: 12
                    }}>
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                    </svg>
                </button>
                <h3 className="font-bold text-lg">{translate('navbar.share_project')}</h3>
                <p className="py-4">{translate('navbar.share_project_desc1')}</p>
                <p className="pb-4">{translate('navbar.share_project_desc2')}</p>
                <p className="pb-4">{translate('navbar.share_project_desc3')}
                    <a className="adno-link" href="https://adno.app/" target="_blank">
                        <FontAwesomeIcon icon={faExternalLink} size="lg" /></a>
                </p>
                <p className="my-3 text-center font-bold">{translate('navbar.export_project_to')}</p>
                <div className="flex gap-3 justify-center items-center">
                    <label className="btn btn-success">
                        {selectedProject &&
                            selectedProject.id &&
                            <DownloadLink selectedProject={selectedProject} translate={translate} />
                        }
                    </label>
                    ou
                    <label className="btn btn-success" onClick={() => {
                        exportIIIF()
                            .then(manifest => generateInputFilesView(manifest, selectedProject))
                    }
                    }>
                        {translate('navbar.export_project_to_iiif')}<span className="badge badge-md ms-2">BETA</span>
                    </label>
                </div>
                <a id="downloadAnchorElem" className="hidden"></a>
            </div>
        </div >
    </>
})

function generateInputFilesView(manifest, selectedProject) {
    const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(manifest, null, 4));
    const elt = document.getElementById('downloadAnchorElem');
    elt.setAttribute("href", dataStr);
    elt.setAttribute("download", `${selectedProject.title}.json`);
    elt.click();
}

export function Exporter({ translate, selectedProject, separatedModal, btn, ...props }) {

    const ref = useRef()

    const exportIIIF = () => {
        return props.exportIIIF()
            .then(manifest => generateInputFilesView(manifest, selectedProject))
    }

    return <>
        {btn ? btn :
            <div className="tooltip tooltip-bottom z-50" data-tip={translate('navbar.download_project')}>
                <button className="btn navbar-button btn-neutral">
                    <label htmlFor="my-modal" style={{ "background": "none", "border": "none" }} onClick={() => {
                        ref.current?.click()
                    }}>
                        <FontAwesomeIcon icon={faDownload} size="xl" /> </label>
                </button>
            </div>}

        {!separatedModal && <ExporterModal
            translate={translate}
            selectedProject={selectedProject}
            exportIIIF={exportIIIF}
            ref={ref} />}
    </>
}
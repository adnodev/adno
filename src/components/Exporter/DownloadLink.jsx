import { createExportProjectJsonFile } from "../../Utils/utils"

export function DownloadLink({ selectedProject, translate }) {
    const download = (event) => {
        event.preventDefault()

        createExportProjectJsonFile(selectedProject.id).then(url => {
            const link = document.createElement("a")

            link.href = url
            link.download = selectedProject.title + ".json"

            document.body.appendChild(link)
            link.click()
            document.body.removeChild(link)

            setTimeout(() => URL.revokeObjectURL(url))
        })
    }

    return (
        <a
            id={"download_btn_" + selectedProject.id}
            href="#"
            onClick={download}
            title={translate('navbar.download_project')}
        >
            Adno
        </a>
    )
}

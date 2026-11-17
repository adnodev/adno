import { projectDB } from "../../services/db"
import { exportBase, toWADMCollection } from "../../services/format"

export function DownloadLink({ selectedProject, translate }) {
    const download = (event) => {
        event.preventDefault()

        projectDB.get(selectedProject.id).then(project => {
            const collection = toWADMCollection(project, { base: exportBase() })
            const blob = new Blob([JSON.stringify(collection, null, 2)], { type: "application/json" })
            const url = URL.createObjectURL(blob)
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
            Adno (WADM Collection)
        </a>
    )
}

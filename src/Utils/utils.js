import Swal from "sweetalert2";
import edjsHTML from "editorjs-html";
import TurndownService from "turndown"

// Function to insert something in the localStorage.
// Will return an alert if the localStorage is full
export function insertInLS(itemName, itemValue) {
  try {
    localStorage.setItem(itemName, itemValue);
  } catch (e) {
    console.log("err name ", e.name);
    if (e.name === 'QuotaExceededError') {
      alert('Quota exceeded!');
    }
  }
}

// Function to generate a random UUID such as b9930ecc-6a18-43f5-8a09-93eb6262f590
export function generateUUID() {
  var dt = new Date().getTime();
  var uuid = 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function (c) {
    var r = (dt + Math.random() * 16) % 16 | 0;
    dt = Math.floor(dt / 16);
    return (c == 'x' ? r : (r & 0x3 | 0x8)).toString(16);
  });
  return uuid;
}

// Function to create an IIIF example
// You have to set a title, description and the manifest URL in order to generate your example
export function generateExamplePainting(title, description, manifest_url) {

  if (!localStorage.getItem("adno_projects")) {
    insertInLS("adno_projects", JSON.stringify([]))
  }
  let projects = JSON.parse(localStorage.getItem("adno_projects"))

  var projectID = generateUUID()

  var project = {
    "id": projectID,
    "title": title,
    "description": description,
    "creation_date": createDate(),
    "last_update": createDate(),
    "manifest_url": manifest_url,
    "settings": defaultProjectSettings()
  }

  // Create and store the new project in the localStorage
  insertInLS(projectID, JSON.stringify(project))

  // Add new project 
  projects.push(projectID)
  insertInLS("adno_projects", JSON.stringify(projects))

  // Create annotations object
  insertInLS(`${projectID}_annotations`, JSON.stringify([]))

  Swal.fire({
    title: `Tableau ${title} ajouté aux projets avec succès`,
    showCancelButton: false,
    confirmButtonText: 'Ok',
    icon: 'success',
  })
    .then((result) => {
      if (result.isConfirmed) {
        window.location.href = "/"
      }
    })
}



export function findInfoJsonFromManifest(url) {
  return fetch(url)
    .then(rep => rep.json())
    .then(result => {
      var resultLink = ""

      for (let index = 0; index < 7; index++) {
        resultLink += result.sequences[0].canvases[0].images[0].resource["@id"].split("/")[index]

        if (index === 0) {
          resultLink += "//"
        } else {
          resultLink += "/"
        }

      }

      resultLink += "info.json"


      return resultLink;
    })
}


export const checkIfProjectExists = (id) => {
  return localStorage.getItem(id) ? true : false;
}

export const stripHtml = (html) => {
  let tmp = document.createElement("DIV");
  tmp.innerHTML = html;
  return tmp.textContent || tmp.innerText || "";
}

export const isValidUrl = (url) => {
  try {
    new URL(url);
  } catch (e) {
    console.error(e);
    return false;
  }
  return true;
};

export const get_url_extension = (url) => {
  return url.split(/[#?]/)[0].split('.').pop().trim();
}

export const buildTagsList = (annotation) => {
  var tags = Array.isArray(annotation.body) ? annotation.body.filter(anno_body => anno_body.purpose === "tagging") : []

  return tags

  // return tags && tags.length > 0 && tags.reduce((previousValue, currentValue) => previousValue + " " + currentValue.value, "[TAGS] ")
}

export const buildJsonProjectWithManifest = (id, title, desc, manifest) => {
  return {
    "id": id,
    "title": title,
    "description": desc,
    "creation_date": createDate(),
    "last_update": createDate(),
    "manifest_url": manifest,
    "editor": "",
    "creator": "",
    "settings": defaultProjectSettings()
  }
}

export const buildJsonProjectWithImg = (id, title, desc, img) => {
  return {
    "id": id,
    "title": title,
    "description": desc,
    "creation_date": createDate(),
    "last_update": createDate(),
    "img_url": img,
    "editor": "",
    "creator": "",
    "settings": defaultProjectSettings()
  }
}

export const buildProjectAdnoFormat = (title, description, manifest) => {
  return (
    {
      "@context": "http://www.w3.org/ns/anno.jsonld",
      "id": generateUUID(),
      "type": "AnnotationCollection",
      "title": title,
      "description": description,
      "date": createDate(),
      "modified": createDate(),
      "source": manifest,
      "editor": "",
      "creator": "",
      "format": "Adno",
      "total": 0,
      "first": {
        "id": "http://example.org/page1",
        "type": "AnnotationPage",
        "startIndex": 0,
        "items": []
      },
      "settings": defaultProjectSettings()
    }
  )
}

export const createExportProjectJsonFile = (projectID) => {

  // Get project from localStorage
  var project = JSON.parse(localStorage.getItem(projectID))

  // Then, get all annotations
  var annotations = JSON.parse(localStorage.getItem(projectID + "_annotations"))

  var finalProject =
  {

    "@context": "http://www.w3.org/ns/anno.jsonld",
    "id": project.id,
    "type": "AnnotationCollection",
    "title": project.title,
    "description": project.description,
    "creator": project.creator || "",
    "editor": project.editor || "",
    "rights": project.rights || "",
    "date": project.creation_date,
    "modified": project.last_update,
    "source": project.manifest_url ? project.manifest_url : project.img_url,
    "format": "Adno",
    "total": annotations && annotations.length ? annotations.length : 0,
    "first": {
      "id": "page1",
      "type": "AnnotationPage",
      "startIndex": 0,
      "items": annotations && annotations.length > 0 ? annotations : [],
    },
    "adno_settings": getProjectSettings(project.id) || defaultProjectSettings()
  }
  return URL.createObjectURL(new Blob([JSON.stringify(finalProject)], { type: "text/plain" }));
}


export const importProjectJsonFile = (event, loadedProject, cancelImport, errorTitle) => {
  event.preventDefault()

  let fr = new FileReader();

  fr.readAsText(loadedProject)

  fr.onload = function (e) {
    let imported_project = JSON.parse(e.target.result)

    if (imported_project.hasOwnProperty("@context")
      && imported_project.hasOwnProperty("date")
      && imported_project.hasOwnProperty("id")
      && imported_project.hasOwnProperty("title")
      && imported_project.hasOwnProperty("type")
      && imported_project.hasOwnProperty("modified")
      && imported_project.hasOwnProperty("source")
      && imported_project.hasOwnProperty("description")
      && imported_project.hasOwnProperty("total")
    ) {

      // Generate a new ID and new last_update
      imported_project.modified = createDate()
      imported_project.id = generateUUID()

      let projects = JSON.parse(localStorage.getItem("adno_projects"))
      projects.push(imported_project.id)

      let proj = {
        "id": imported_project.id,
        "title": imported_project.title,
        "description": imported_project.description,
        "creation_date": imported_project.date,
        "last_update": imported_project.modified,
        // "manifest_url": imported_project.source,
        "creator": imported_project.creator || "",
        "editor": imported_project.editor || "",
        "rights": imported_project.rights || "",
        "settings": imported_project.adno_settings || defaultProjectSettings()
      }

      let importedURL = imported_project.source

      if (get_url_extension(importedURL) === "png" || get_url_extension(importedURL) === "jpg" || get_url_extension(importedURL) === "jpeg") {
        proj.img_url = imported_project.source
      } else {
        proj.manifest_url = imported_project.source
      }

      let annos = imported_project.total !== 0 ? imported_project.first.items : []

      insertInLS("adno_projects", JSON.stringify(projects))
      insertInLS(proj.id + "_annotations", JSON.stringify(annos))
      insertInLS(proj.id, JSON.stringify(proj))

      // If the project uses an old version migrate the annotations
      //migrateAnnotations(proj.id)

      window.location.reload()

    }
    else {
      Swal.fire({
        title: errorTitle,
        showCancelButton: false,
        showConfirmButton: true,
        confirmButtonText: 'OK',
        icon: 'error',
      }).then((result) => {
        if (result.isConfirmed) {
          cancelImport()
        }
      })
    }

  }
}


export function checkProjectAttributes(imported_project) {
  return imported_project.hasOwnProperty('id') && imported_project.hasOwnProperty('title') && imported_project.hasOwnProperty('description') && imported_project.hasOwnProperty('creation_date') && imported_project.hasOwnProperty('last_update') && imported_project.hasOwnProperty('manifest_url')
}

export function duplicateProject(projectID) {
  const project = JSON.parse(localStorage.getItem(projectID))
  const project_annos = JSON.parse(localStorage.getItem(`${projectID}_annotations`)) || []

  const target = {};

  Object.assign(target, project);

  target.title += " (copie)"
  target.id = generateUUID()
  target.last_update = createDate()
  target.creation_date = createDate()

  insertInLS(target.id, JSON.stringify(target))
  insertInLS(`${target.id}_annotations`, JSON.stringify(project_annos))

  var projects = JSON.parse(localStorage.getItem("adno_projects"))
  projects.push(target.id)
  insertInLS("adno_projects", JSON.stringify(projects))
}

export function createDate() {
  return new Date().toISOString().slice(0, 10);
}

export function deleteProject(idProject) {
  // First, remove all the annotations linked to the selected projet
  localStorage.removeItem(idProject + "_annotations")

  // Then , delete the projet 
  localStorage.removeItem(idProject)

  // Finaly, remove the project id from the adno projects list
  let projects = JSON.parse(localStorage.getItem("adno_projects"))

  let newProjectsList = projects.filter(id_p => id_p !== idProject)

  insertInLS("adno_projects", JSON.stringify(newProjectsList))
}

export function getAllProjectsFromLS() {
  var projects = []
  var allProjectsID = JSON.parse(localStorage.getItem("adno_projects"))
  allProjectsID && allProjectsID.length > 0 && allProjectsID.map(projectID => {
    projects.push(JSON.parse(localStorage.getItem(projectID)))
  })
  return projects;
}

// Set default settings for any ADNO project
export function defaultProjectSettings() {
  return {
    delay: 5,
    showNavigator: true,
    toolsbarOnFs: true,
    sidebarEnabled: true,
    startbyfirstanno: false,
    rotation: false,
    displayToolbar: true
  }
}


// Get all the settings linked to a project
// By default settings is an empty object
export function getProjectSettings(projectID) {
  return localStorage.getItem(projectID) && JSON.parse(localStorage.getItem(projectID)).settings ? JSON.parse(localStorage.getItem(projectID)).settings : defaultProjectSettings()
}

export function migrateAnnotations(projectID) {

  const edjsParser = edjsHTML();
  const turndownService = new TurndownService()

  try {
    const annotations = JSON.parse(localStorage.getItem(`${projectID}_annotations`))

    annotations.forEach(anno => {

      let newBody = anno.body.filter(anno_body => anno_body.type !== "AdnoHtmlBody" && anno_body.type !== "AdnoRichText" && !(anno_body.type === "TextualBody" && anno_body.purpose === "commenting"))

      if (anno.body.length > 0) {

        if (anno.body.find(anno_body => anno_body.type === "AdnoRichText")) {


          let annoRichText = anno.body.find(anno_body => anno_body.type === "AdnoRichText").value

          let htmlBody = ""
          let allMarkdown = ""

          annoRichText.forEach(block => {
            var blockHTML = edjsParser.parseBlock(block);

            htmlBody += blockHTML;

            var markdown = turndownService.turndown(blockHTML)

            // add markdown and a line break
            allMarkdown += markdown + "\n";
          })


          newBody.push(
            {
              "type": "TextualBody",
              "value": allMarkdown,
              "purpose": "commenting"
            },
            {
              "type": "HTMLBody",
              "value": htmlBody,
              "purpose": "commenting"
            })

          // Update the localstorage

          annotations.filter(annotation => annotation.id === anno.id)[0].body = newBody

          insertInLS(`${projectID}_annotations`, JSON.stringify(annotations))

        }
      }

    })

  } catch (error) {
    console.error("Erreur détectée ", error);
  }
}


export function checkOldVersion() {
  let isOldVersion = false

  var projectsID = JSON.parse(localStorage.getItem("adno_projects"))

  projectsID?.forEach(projectID => {
    let projectAnnotations = JSON.parse(localStorage.getItem(`${projectID}_annotations`))

    projectAnnotations?.forEach(annotation => {
      if (annotation.body.find(annoBody => annoBody.type === "AdnoRichText")) {



        // Traitement 

        Swal.fire({
          title: "Un ou plusieurs projets ont été fait avec une version obsolète d’Adno",
          showCancelButton: false,
          showConfirmButton: true,
          confirmButtonText: 'Mettre à jour vers la dernière version',
          icon: 'warning',
        }).then((result) => {
          if (result.isConfirmed) {

            projectsID.forEach(projectID => {
              migrateAnnotations(projectID)
            })

            Swal.fire("Félicitations, vos projets ADNO sont à jour ! ", '', 'success')


          }
        })

        return
      }
    })
  })

}
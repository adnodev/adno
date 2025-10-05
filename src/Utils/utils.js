import Swal from "sweetalert2";
import edjsHTML from "editorjs-html";
import TurndownService from "turndown"
import { readProjectFromIIIFFormat } from '../components/AdnoUrls/manageUrls'

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
  if (url.includes('?url=https'))
    return get_url_extension(url.split(/[#?]/)[1].replace('url=', ''));
  else
    return url.split(/[#?]/)[0].split('.').pop().trim();
}

export const buildTagsList = (annotation) => {
  return Array.isArray(annotation.body) ? annotation.body.filter(anno_body => anno_body.purpose === "tagging") : []
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


export const importProjectJsonFile = (event, loadedProject, cancelImport, errorTitle, props) => {
  event.preventDefault()

  let fr = new FileReader();

  fr.readAsText(loadedProject)

  fr.onload = function (e) {
    let imported_project = JSON.parse(e.target.result)

    if (imported_project.metadata && imported_project.metadata.find(meta => meta.label.en?.includes('adno_settings'))) {
      return readProjectFromIIIFFormat(props, imported_project, props.t)
    }

    if (imported_project.hasOwnProperty("@context")
      && imported_project.hasOwnProperty("date")
      && imported_project.hasOwnProperty("id")
      && (imported_project.hasOwnProperty("title") || imported_project.hasOwnProperty("label"))
      && imported_project.hasOwnProperty("type")
      && imported_project.hasOwnProperty("modified")
      && imported_project.hasOwnProperty("source")
      && imported_project.hasOwnProperty("total")
    ) {

      // Generate a new ID and new last_update
      imported_project.modified = createDate()
      imported_project.id = generateUUID()

      let projects = JSON.parse(localStorage.getItem("adno_projects"))
      projects.push(imported_project.id)

      let proj = {
        "id": imported_project.id,
        "title": imported_project.title || imported_project.label,
        "description": imported_project.description || "",
        "creation_date": imported_project.date,
        "last_update": imported_project.modified,
        "creator": imported_project.creator || "",
        "editor": imported_project.editor || "",
        "rights": imported_project.rights || "",
        "settings": imported_project.adno_settings || defaultProjectSettings(),
      }

      let importedURL = imported_project.source
      const isIpfsUrl = importedURL.startsWith(process.env.IPFS_GATEWAY);

      if (get_url_extension(importedURL) === "png" || get_url_extension(importedURL) === "jpg" || get_url_extension(importedURL) === "jpeg" || isIpfsUrl) {
        proj.img_url = imported_project.source
      } else {
        proj.manifest_url = imported_project.source
      }

      let annos = imported_project.total !== 0 ? imported_project.first.items : []

      insertInLS("adno_projects", JSON.stringify(projects))
      insertInLS(proj.id + "_annotations", JSON.stringify(annos))
      insertInLS(proj.id, JSON.stringify(proj))


      annos?.forEach(annotation => {
        if (annotation.body.find(annoBody => annoBody.type === "TextualBody") && !annotation.body.find(annoBody => annoBody.type === "HTMLBody")) {
          migrateTextBody(proj.id, annotation)
        }
      })

      window.location.reload()

    } else {
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

export function duplicateProject(projectID, duplicate_name_copy) {
  const project = JSON.parse(localStorage.getItem(projectID))
  const project_annos = JSON.parse(localStorage.getItem(`${projectID}_annotations`)) || []

  const target = {};

  Object.assign(target, project);

  target.title = `${target.title} (${duplicate_name_copy})`
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
  return new Date().toISOString();
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

export function diffProjectSettings(a, b) {
  const diff = {};
  const keys = new Set([...Object.keys(a), ...Object.keys(b)]);

  for (const key of keys) {
    const valA = a[key];
    const valB = b[key];

    if (Array.isArray(valA) && Array.isArray(valB)) {
      if (JSON.stringify(valA) !== JSON.stringify(valB)) {
        diff[key] = valB
      }
    } else if (valA !== valB) {
      diff[key] = valB
    }
  }

  return diff;
}

// Set default settings for any ADNO project
export function defaultProjectSettings() {
  return {
    delay: 5,
    showNavigator: true,
    toolsbarOnFs: true,
    sidebarEnabled: true,
    startbyfirstanno: false,
    shouldAutoPlayAnnotations: false,
    rotation: false,
    displayToolbar: true,
    tags: [],
    outlineWidth: "outline-1px",
    outlineColor: "outline-white",
    outlineColorFocus: "outline-focus-yellow",
    showOutlines: true,
    showEyes: false,
    soundMode: 'no_sound',
    showCurrentAnnotation: false
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

export function migrateTextBody(projectID, annotation) {

  const newBody = annotation.body

  newBody.push({
    "type": "HTMLBody",
    "value": `<p>${annotation.body.filter(annobody => annobody.type === "TextualBody")[0].value}</p>`,
    "purpose": "commenting"
  })

  // Update the localstorage
  let projectAnnotations = JSON.parse(localStorage.getItem(`${projectID}_annotations`))
  projectAnnotations.filter(anno => anno.id === annotation.id)[0].body = newBody

  insertInLS(`${projectID}_annotations`, JSON.stringify(projectAnnotations))
}

export function checkOldVersion(t) {
  const projectsID = JSON.parse(localStorage.getItem("adno_projects"))

  projectsID?.forEach(projectID => {
    let projectAnnotations = JSON.parse(localStorage.getItem(`${projectID}_annotations`))

    projectAnnotations?.forEach(annotation => {
      if (annotation.body && annotation.body.find(annoBody => annoBody.type === "TextualBody") && !annotation.body.find(annoBody => annoBody.type === "HTMLBody")) {
        migrateTextBody(projectID, annotation)
      }


      if (annotation.body && annotation.body.find(annoBody => annoBody.type === "AdnoRichText")) {
        Swal.fire({
          title: t('modal.old_version'),
          showCancelButton: false,
          showConfirmButton: true,
          confirmButtonText: t('modal.update_old_version'),
          icon: 'warning',
        }).then((result) => {
          if (result.isConfirmed) {

            projectsID.forEach(projectID => {
              migrateAnnotations(projectID)
            })

            Swal.fire(t('modal.version_updated'), '', 'success')


          }
        })

        return
      }
    })
  })
}

export async function enhancedFetch(url) {
  try {
    const response = await fetch(url, {
      mode: 'cors'
    });

    return {
      response,
      url
    }
  } catch (error) {
    if (error.name === 'TypeError' && (error.message.includes('Failed to fetch') || // handle Brave/Chrome CORS error
      error.message.includes('NetworkError when attempting to fetch') || // handle firefox CORS error
      error.message.includes('Load failed'))) { // handle safari CORS error
      console.log('CORS error: Could not fetch the image.')

      if (process.env.CORS_SERVER) {
        const newUrl = `${process.env.CORS_SERVER}/?url=${encodeURIComponent(url)}`;
        const response = await fetch(newUrl);

        return {
          response,
          url: newUrl
        }
      } else
        return {
          response: url,
          url
        }
    } else {
      console.log(`An error occurred: ${error.message}`)
    }
  }
}

export function getEye() {
  const SVG_NS = "http://www.w3.org/2000/svg";

  const svg = document.createElementNS(SVG_NS, "svg");
  svg.setAttribute("viewBox", "0 0 1080 1080");
  svg.setAttribute("transform", "")

  const g1 = document.createElementNS(SVG_NS, "g");
  g1.setAttribute("transform", "matrix(1 0 0 1 540 540)");
  g1.setAttribute("id", "c6a526e9-9dab-4148-b63e-bac2caea7bce");

  const rect = document.createElementNS(SVG_NS, "rect");
  rect.setAttribute("style", "stroke: none; stroke-width: 1; stroke-dasharray: none; stroke-linecap: butt; stroke-dashoffset: 0; stroke-linejoin: miter; stroke-miterlimit: 4; fill: rgb(255,255,255); fill-rule: nonzero; opacity: 1; visibility: hidden;");
  rect.setAttribute("vector-effect", "non-scaling-stroke");
  rect.setAttribute("x", "-540");
  rect.setAttribute("y", "-540");
  rect.setAttribute("rx", "0");
  rect.setAttribute("ry", "0");
  rect.setAttribute("width", "1080");
  rect.setAttribute("height", "1080");

  g1.appendChild(rect);
  svg.appendChild(g1);

  const g2 = document.createElementNS(SVG_NS, "g");
  g2.setAttribute("transform", "matrix(1 0 0 1 540 540)");
  g2.setAttribute("id", "05f04bf2-f462-40ad-80b7-1b9374547f70");

  svg.appendChild(g2);

  const g3 = document.createElementNS(SVG_NS, "g");
  g3.setAttribute("transform", "matrix(12.65 0 0 12.65 540 540)");
  g3.setAttribute("id", "2618588e-47a0-410a-8c15-d3a89681704d");

  const circle = document.createElementNS(SVG_NS, "circle");
  circle.setAttribute("style", "stroke: rgb(0,0,0); stroke-width: 0; stroke-dasharray: none; stroke-linecap: butt; stroke-dashoffset: 0; stroke-linejoin: miter; stroke-miterlimit: 4; fill: rgb(0,0,0); fill-rule: nonzero; opacity: 1;");
  circle.setAttribute("vector-effect", "non-scaling-stroke");
  circle.setAttribute("cx", "0");
  circle.setAttribute("cy", "0");
  circle.setAttribute("r", "35");

  g3.appendChild(circle);
  svg.appendChild(g3);

  const g4 = document.createElementNS(SVG_NS, "g");
  g4.setAttribute("transform", "matrix(1 0 0 1 540 540)");

  const g5 = document.createElementNS(SVG_NS, "g");
  g5.setAttribute("style", "");
  g5.setAttribute("vector-effect", "non-scaling-stroke");

  const path1 = document.createElementNS(SVG_NS, "path");
  path1.setAttribute("style", "stroke: none; stroke-width: 1; stroke-dasharray: none; stroke-linecap: butt; stroke-dashoffset: 0; stroke-linejoin: miter; stroke-miterlimit: 4; fill: rgb(255,255,255); fill-rule: nonzero; opacity: 1;");
  path1.setAttribute("vector-effect", "non-scaling-stroke");
  path1.setAttribute("transform", "translate(-221.02, -221.02)");
  path1.setAttribute("d", "M 221.02 341.304 C 171.312 341.304 117.81400000000001 321.864 66.31 285.08399999999995 C 27.808 257.59 4.044 230.351 3.051 229.203 C -1.0169999999999995 224.506 -1.0169999999999995 217.534 3.051 212.836 C 4.0440000000000005 211.69000000000003 27.807000000000002 184.449 66.31 156.955 C 117.815 120.17800000000001 171.313 100.73600000000002 221.02 100.73600000000002 C 270.728 100.73600000000002 324.227 120.17700000000002 375.73 156.955 C 414.232 184.449 437.99600000000004 211.68900000000002 438.98900000000003 212.836 C 443.057 217.53300000000002 443.057 224.50500000000002 438.98900000000003 229.203 C 437.99600000000004 230.349 414.23300000000006 257.59000000000003 375.73 285.084 C 324.227 321.863 270.729 341.304 221.02 341.304 z M 29.638 221.021 C 39.248000000000005 230.82 57.385000000000005 248.051 81.33200000000001 265.092 C 114.162 288.453 165.046 316.304 221.01999999999998 316.304 C 276.99399999999997 316.304 327.87899999999996 288.453 360.70799999999997 265.092 C 384.652 248.05399999999997 402.78999999999996 230.82099999999997 412.402 221.021 C 402.793 211.22199999999998 384.655 193.99099999999999 360.70799999999997 176.95 C 327.87899999999996 153.588 276.99399999999997 125.73799999999999 221.01999999999998 125.73799999999999 C 165.046 125.73799999999999 114.16199999999998 153.588 81.332 176.95 C 57.388 193.988 39.25 211.219 29.638 221.021 z");
  path1.setAttribute("stroke-linecap", "round");
  g5.appendChild(path1);

  const path2 = document.createElementNS(SVG_NS, "path");
  path2.setAttribute("style", "stroke: none; stroke-width: 1; stroke-dasharray: none; stroke-linecap: butt; stroke-dashoffset: 0; stroke-linejoin: miter; stroke-miterlimit: 4; fill: rgb(255,255,255); fill-rule: nonzero; opacity: 1;");
  path2.setAttribute("vector-effect", "non-scaling-stroke");
  path2.setAttribute("transform", "translate(-221.02, -221.02)");
  path2.setAttribute("d", "M 221.02 298.521 C 178.286 298.521 143.52 263.754 143.52 221.02100000000002 C 143.52 178.288 178.286 143.52100000000002 221.02 143.52100000000002 C 239.81400000000002 143.52100000000002 257.944 150.335 272.068 162.709 C 277.26099999999997 167.258 277.78299999999996 175.155 273.234 180.348 C 268.685 185.54100000000003 260.787 186.062 255.59499999999997 181.514 C 246.03099999999998 173.13500000000002 233.75099999999998 168.52100000000002 221.01899999999998 168.52100000000002 C 192.06999999999996 168.52100000000002 168.51899999999998 192.073 168.51899999999998 221.02100000000002 C 168.51899999999998 249.96900000000002 192.06999999999996 273.521 221.01899999999998 273.521 C 249.96899999999997 273.521 273.519 249.96900000000002 273.519 221.02100000000002 C 273.519 214.11800000000002 279.116 208.52100000000002 286.019 208.52100000000002 C 292.922 208.52100000000002 298.519 214.11800000000002 298.519 221.02100000000002 C 298.521 263.754 263.754 298.521 221.02 298.521 z");
  path2.setAttribute("stroke-linecap", "round");
  g5.appendChild(path2);

  const path3 = document.createElementNS(SVG_NS, "path");
  path3.setAttribute("style", "stroke: none; stroke-width: 1; stroke-dasharray: none; stroke-linecap: butt; stroke-dashoffset: 0; stroke-linejoin: miter; stroke-miterlimit: 4; fill: rgb(255,255,255); fill-rule: nonzero; opacity: 1;");
  path3.setAttribute("vector-effect", "non-scaling-stroke");
  path3.setAttribute("transform", "translate(-221.02, -221.02)");
  path3.setAttribute("d", "M 221.02 246.021 C 207.235 246.021 196.02 234.80599999999998 196.02 221.021 C 196.02 207.236 207.235 196.021 221.02 196.021 C 234.806 196.021 246.02 207.236 246.02 221.021 C 246.02 234.80599999999998 234.806 246.021 221.02 246.021 z");
  path3.setAttribute("stroke-linecap", "round");
  g5.appendChild(path3);

  g4.appendChild(g5);
  svg.appendChild(g4);

  return svg
}

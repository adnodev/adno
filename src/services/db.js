import edjsHTML from "editorjs-html";
import TurndownService from "turndown";

class ProjectDB {
  constructor() {
    this.dbName = 'ProjectsDB';
    this.storeName = 'projects';
    this.db = null;
  }

  async init() {
    if (this.db) return this.db;
    return new Promise((resolve, reject) => {
      const request = indexedDB.open(this.dbName, 1);
      request.onerror = () => reject(request.error);
      request.onsuccess = async () => {
        this.db = request.result;

        if (await this.needsMigration()) {
          await this.migrateFromLocalStorage(true);
        }

        resolve(this.db);
      };
      request.onupgradeneeded = (e) => {
        const db = e.target.result;
        if (!db.objectStoreNames.contains(this.storeName)) {
          db.createObjectStore(this.storeName, { keyPath: 'id' });
        }
      };
    });
  }

  async exists(projectId) {
    return this.get(projectId);
  }

  async add(projectId, project) {
    await this.init();
    const tx = this.db.transaction([this.storeName], 'readwrite');
    await tx.objectStore(this.storeName).add({
      ...project,
      id: projectId,
      last_update: new Date().toISOString()
    });
    return project.id;
  }

  async get(id) {
    await this.init();
    const tx = this.db.transaction([this.storeName], 'readonly');
    return new Promise((resolve) => {
      const request = tx.objectStore(this.storeName).get(id);
      request.onsuccess = () => {
        const r = request.result
        if (!r)
          resolve(r)
        else {
          resolve({
            annotations: [],
            ...r
          })
        }
      };
    });
  }

  async getAll() {
    await this.init();
    const tx = this.db.transaction([this.storeName], 'readonly');
    return new Promise((resolve) => {
      const request = tx.objectStore(this.storeName).getAll();
      request.onsuccess = () => resolve(request.result);
    });
  }

  async update(id, updates) {
    await this.init();
    const existing = await this.get(id);
    if (!existing) throw new Error('Project not found');
    const tx = this.db.transaction([this.storeName], 'readwrite');
    const updated = { ...existing, ...updates, id, last_update: new Date().toISOString() };
    await tx.objectStore(this.storeName).put(updated);
    return updated;
  }

  async delete(id) {
    await this.init();
    const tx = this.db.transaction([this.storeName], 'readwrite');
    await tx.objectStore(this.storeName).delete(id);
  }

  async getAnnotations(projectId) {
    const project = await this.get(projectId);
    return project?.annotations || [];
  }

  async updateAnnotations(projectId, annotations) {
    await this.update(projectId, { annotations });
  }

  async duplicate(projectId, duplicateSuffix = 'copy') {
    const project = await this.get(projectId);
    if (!project) throw new Error('Project not found');

    const id = crypto.randomUUID()
    const newProject = {
      ...project,
      id,
      title: `${project.title} (${duplicateSuffix})`,
      creation_date: new Date().toISOString(),
      last_update: new Date().toISOString(),
      annotations: project.annotations || []
    };

    await this.add(id, newProject);
    return newProject;
  }

  async needsMigration() {
    const projectIdsJson = localStorage.getItem('adno_projects');
    if (!projectIdsJson) return false;

    const existingProjects = await this.getAll();
    return existingProjects.length === 0;
  }

  migrateAnnotationBody(anno) {
    const edjsParser = edjsHTML();
    const turndownService = new TurndownService();

    let newBody = anno.body.filter(anno_body =>
      anno_body.type !== "AdnoHtmlBody" &&
      anno_body.type !== "AdnoRichText" &&
      !(anno_body.type === "TextualBody" && anno_body.purpose === "commenting")
    );

    if (anno.body.find(anno_body => anno_body.type === "AdnoRichText")) {
      const annoRichText = anno.body.find(anno_body => anno_body.type === "AdnoRichText").value;

      let htmlBody = "";
      let allMarkdown = "";

      annoRichText.forEach(block => {
        const blockHTML = edjsParser.parseBlock(block);
        htmlBody += blockHTML;
        const markdown = turndownService.turndown(blockHTML);
        allMarkdown += markdown + "\n";
      });

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
        }
      );

      return { ...anno, body: newBody };
    }

    if (anno.body.find(anno_body => anno_body.type === "TextualBody") &&
        !anno.body.find(anno_body => anno_body.type === "HTMLBody")) {
      const textValue = anno.body.find(annobody => annobody.type === "TextualBody").value;
      anno.body.push({
        "type": "HTMLBody",
        "value": `<p>${textValue}</p>`,
        "purpose": "commenting"
      });
    }

    return anno;
  }

  async migrateFromLocalStorage() {
    await this.init();
    console.log("migrateFromLocalStorage")
    const projectIdsJson = localStorage.getItem('adno_projects');
    if (!projectIdsJson) return { migrated: 0, errors: [] };

    const projectIds = JSON.parse(projectIdsJson);
    const errors = [];
    let migrated = 0;

    for (const id of projectIds) {
      try {
        const projectJson = localStorage.getItem(id);
        if (!projectJson) continue;

        const project = JSON.parse(projectJson);

        const annotationsJson = localStorage.getItem(`${id}_annotations`);
        if (annotationsJson) {
          const annotations = JSON.parse(annotationsJson);
          project.annotations = annotations.map(anno => this.migrateAnnotationBody(anno));
        }

        await this.add(project.id, project);
        migrated++;
      } catch (error) {
        errors.push({ id, error: error.message });
      }
    }

    return { migrated, errors };
  }
}

export const projectDB = new ProjectDB();
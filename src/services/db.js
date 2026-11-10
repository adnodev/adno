import edjsHTML from "editorjs-html";
import TurndownService from "turndown";
import { normalizeProject, withContent } from "./format";

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
        const record = request.result

        if (!record) {
          resolve(record)
          return
        }

        const { project, changed } = normalizeProject(record)

        if (changed) {
          this.rewrite(project)
        }

        resolve(project)
      };
    });
  }

  rewrite(project) {
    const tx = this.db.transaction([this.storeName], 'readwrite');
    tx.objectStore(this.storeName).put(project);
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

  convertRichTextBody(anno) {
    const richText = anno.body.find(anno_body => anno_body.type === "AdnoRichText")

    if (!richText) {
      return anno
    }

    const edjsParser = edjsHTML()
    const turndownService = new TurndownService()
    const blocks = richText.value.map(block => edjsParser.parseBlock(block))

    const others = anno.body.filter(anno_body =>
      anno_body.type !== "AdnoHtmlBody" &&
      anno_body.type !== "AdnoRichText" &&
      !(anno_body.type === "TextualBody" && anno_body.purpose === "commenting")
    )

    return withContent(anno, {
      markdown: blocks.map(html => turndownService.turndown(html)).join("\n"),
      html: blocks.join(""),
      others
    })
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
          project.annotations = annotations.map(anno => this.convertRichTextBody(anno));
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
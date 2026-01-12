
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

        // Auto-migrate if needed
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
    console.log('add', projectId, project)
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
    return !!projectIdsJson;
  }

  async migrateFromLocalStorage(removeAfter = true) {
    await this.init();
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

        // Get annotations if they exist
        const annotationsJson = localStorage.getItem(`${id}_annotations`);
        if (annotationsJson) {
          project.annotations = JSON.parse(annotationsJson);
        }

        await this.add(project.id, project);
        migrated++;

        if (removeAfter) {
          localStorage.removeItem(id);
          if (annotationsJson) {
            localStorage.removeItem(`${id}_annotations`);
          }
        }
      } catch (error) {
        errors.push({ id, error: error.message });
      }
    }

    if (removeAfter && errors.length === 0) {
      localStorage.removeItem('adno_projects');
    }

    return { migrated, errors };
  }
}

export const projectDB = new ProjectDB();
import * as ftp from 'basic-ftp';
import { Readable } from 'stream';
import path from 'path';

// Configuration FTP depuis les variables d'environnement
const FTP_CONFIG = {
  host: process.env.FTP_HOST || 'ftp.acge-gabon.com',
  user: process.env.FTP_USER || 'acgeg2647579',
  password: process.env.FTP_PASSWORD || '',
  port: parseInt(process.env.FTP_PORT || '21'),
  secure: process.env.FTP_SECURE === 'true'
};

const UPLOAD_DIR = process.env.UPLOAD_DIR || '/uploads';

export class StorageLWS {
  private client: ftp.Client;

  constructor() {
    this.client = new ftp.Client();
    this.client.ftp.verbose = process.env.NODE_ENV === 'development';
  }

  /**
   * Se connecter au serveur FTP
   */
  private async connect(): Promise<void> {
    try {
      await this.client.access(FTP_CONFIG);
    } catch (error) {
      console.error('Erreur de connexion FTP:', error);
      throw new Error('Impossible de se connecter au serveur FTP');
    }
  }

  /**
   * Se déconnecter du serveur FTP
   */
  private async disconnect(): Promise<void> {
    this.client.close();
  }

  /**
   * Uploader un fichier
   */
  async uploadFile(
    file: Buffer | Readable,
    fileName: string,
    subDir: string = 'documents'
  ): Promise<string> {
    try {
      await this.connect();

      // Créer le chemin complet
      const fullPath = path.posix.join(UPLOAD_DIR, subDir);
      const filePath = path.posix.join(fullPath, fileName);

      // S'assurer que le dossier existe
      await this.ensureDir(fullPath);

      // Convertir Buffer en Stream si nécessaire
      const stream = Buffer.isBuffer(file) 
        ? Readable.from(file) 
        : file;

      // Uploader le fichier
      await this.client.uploadFrom(stream, filePath);

      await this.disconnect();

      // Retourner le chemin relatif du fichier
      return path.posix.join(subDir, fileName);
    } catch (error) {
      await this.disconnect();
      console.error('Erreur upload FTP:', error);
      throw new Error(`Erreur lors de l'upload du fichier: ${error}`);
    }
  }

  /**
   * Télécharger un fichier
   */
  async downloadFile(filePath: string): Promise<Buffer> {
    try {
      await this.connect();

      const fullPath = path.posix.join(UPLOAD_DIR, filePath);
      const chunks: Buffer[] = [];

      // Créer un stream pour recevoir les données
      const writable = new Readable({
        read() {},
      });

      writable.on('data', (chunk) => {
        chunks.push(chunk);
      });

      // Télécharger le fichier
      await this.client.downloadTo(writable, fullPath);

      await this.disconnect();

      return Buffer.concat(chunks);
    } catch (error) {
      await this.disconnect();
      console.error('Erreur download FTP:', error);
      throw new Error(`Erreur lors du téléchargement du fichier: ${error}`);
    }
  }

  /**
   * Supprimer un fichier
   */
  async deleteFile(filePath: string): Promise<void> {
    try {
      await this.connect();

      const fullPath = path.posix.join(UPLOAD_DIR, filePath);
      await this.client.remove(fullPath);

      await this.disconnect();
    } catch (error) {
      await this.disconnect();
      console.error('Erreur suppression FTP:', error);
      throw new Error(`Erreur lors de la suppression du fichier: ${error}`);
    }
  }

  /**
   * Vérifier si un fichier existe
   */
  async fileExists(filePath: string): Promise<boolean> {
    try {
      await this.connect();

      const fullPath = path.posix.join(UPLOAD_DIR, filePath);
      const dir = path.posix.dirname(fullPath);
      const fileName = path.posix.basename(fullPath);

      const files = await this.client.list(dir);
      const exists = files.some(file => file.name === fileName);

      await this.disconnect();

      return exists;
    } catch (error) {
      await this.disconnect();
      console.error('Erreur vérification FTP:', error);
      return false;
    }
  }

  /**
   * Créer un dossier s'il n'existe pas
   */
  private async ensureDir(dirPath: string): Promise<void> {
    try {
      await this.client.ensureDir(dirPath);
    } catch (error) {
      console.error(`Erreur création dossier ${dirPath}:`, error);
      // Ignorer l'erreur si le dossier existe déjà
    }
  }

  /**
   * Lister les fichiers d'un dossier
   */
  async listFiles(dirPath: string = ''): Promise<string[]> {
    try {
      await this.connect();

      const fullPath = path.posix.join(UPLOAD_DIR, dirPath);
      const files = await this.client.list(fullPath);

      await this.disconnect();

      return files
        .filter(file => file.type === 1) // Type 1 = fichier
        .map(file => file.name);
    } catch (error) {
      await this.disconnect();
      console.error('Erreur listing FTP:', error);
      throw new Error(`Erreur lors du listing des fichiers: ${error}`);
    }
  }

  /**
   * Obtenir la taille d'un fichier
   */
  async getFileSize(filePath: string): Promise<number> {
    try {
      await this.connect();

      const fullPath = path.posix.join(UPLOAD_DIR, filePath);
      const size = await this.client.size(fullPath);

      await this.disconnect();

      return size;
    } catch (error) {
      await this.disconnect();
      console.error('Erreur taille FTP:', error);
      throw new Error(`Erreur lors de la récupération de la taille: ${error}`);
    }
  }

  /**
   * Déplacer/Renommer un fichier
   */
  async moveFile(oldPath: string, newPath: string): Promise<void> {
    try {
      await this.connect();

      const fullOldPath = path.posix.join(UPLOAD_DIR, oldPath);
      const fullNewPath = path.posix.join(UPLOAD_DIR, newPath);

      // S'assurer que le dossier de destination existe
      const newDir = path.posix.dirname(fullNewPath);
      await this.ensureDir(newDir);

      // Renommer/déplacer le fichier
      await this.client.rename(fullOldPath, fullNewPath);

      await this.disconnect();
    } catch (error) {
      await this.disconnect();
      console.error('Erreur déplacement FTP:', error);
      throw new Error(`Erreur lors du déplacement du fichier: ${error}`);
    }
  }

  /**
   * Copier un fichier
   */
  async copyFile(sourcePath: string, destPath: string): Promise<void> {
    try {
      // Télécharger le fichier source
      const fileContent = await this.downloadFile(sourcePath);

      // Uploader vers la destination
      const destDir = path.posix.dirname(destPath);
      const destName = path.posix.basename(destPath);
      await this.uploadFile(fileContent, destName, destDir);
    } catch (error) {
      console.error('Erreur copie FTP:', error);
      throw new Error(`Erreur lors de la copie du fichier: ${error}`);
    }
  }
}

// Instance singleton
let storageInstance: StorageLWS | null = null;

export function getStorage(): StorageLWS {
  if (!storageInstance) {
    storageInstance = new StorageLWS();
  }
  return storageInstance;
}

// Helper functions pour une utilisation simplifiée
export const storage = {
  upload: async (file: Buffer | Readable, fileName: string, subDir?: string) => {
    const instance = getStorage();
    return instance.uploadFile(file, fileName, subDir);
  },

  download: async (filePath: string) => {
    const instance = getStorage();
    return instance.downloadFile(filePath);
  },

  delete: async (filePath: string) => {
    const instance = getStorage();
    return instance.deleteFile(filePath);
  },

  exists: async (filePath: string) => {
    const instance = getStorage();
    return instance.fileExists(filePath);
  },

  list: async (dirPath?: string) => {
    const instance = getStorage();
    return instance.listFiles(dirPath);
  },

  size: async (filePath: string) => {
    const instance = getStorage();
    return instance.getFileSize(filePath);
  },

  move: async (oldPath: string, newPath: string) => {
    const instance = getStorage();
    return instance.moveFile(oldPath, newPath);
  },

  copy: async (sourcePath: string, destPath: string) => {
    const instance = getStorage();
    return instance.copyFile(sourcePath, destPath);
  }
};

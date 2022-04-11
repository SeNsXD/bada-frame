import { FileUploadResults } from 'constants/upload';
import { Collection } from 'types/collection';
import { ElectronFile, FileWithCollection } from 'types/upload';
import { runningInBrowser } from 'utils/common';

class ImportService {
    ElectronAPIs: any;
    private allElectronAPIsExist: boolean = false;

    constructor() {
        this.ElectronAPIs = runningInBrowser() && window['ElectronAPIs'];
        this.allElectronAPIsExist = !!this.ElectronAPIs?.exists;
    }

    async showUploadFilesDialog(): Promise<string[]> {
        if (this.allElectronAPIsExist) {
            return this.ElectronAPIs.showUploadFilesDialog();
        }
    }

    async showUploadDirsDialog(): Promise<string[]> {
        if (this.allElectronAPIsExist) {
            return this.ElectronAPIs.showUploadDirsDialog();
        }
    }

    async getPendingUploads() {
        if (this.allElectronAPIsExist) {
            const { files, collectionName } =
                (await this.ElectronAPIs.getPendingUploads()) as {
                    files: ElectronFile[];
                    collectionName: string;
                };
            return {
                files,
                collectionName,
            };
        }
    }

    async setToUploadFiles(
        files: FileWithCollection[],
        collections: Collection[]
    ) {
        if (this.allElectronAPIsExist) {
            let collectionName: string;
            if (collections.length === 1) {
                collectionName = collections[0].name;
            }
            const filePaths = files.map(
                (file) => (file.file as ElectronFile).path
            );
            this.ElectronAPIs.setToUploadFiles(filePaths, collectionName);
        }
    }

    updatePendingUploads(files: FileWithCollection[]) {
        if (this.allElectronAPIsExist) {
            const filePaths = files.map(
                (file) => (file.file as ElectronFile).path
            );
            this.ElectronAPIs.updatePendingUploadsFilePaths(filePaths);
        }
    }

    async getFailedFiles(): Promise<
        {
            file: ElectronFile;
            fileUploadResult: FileUploadResults;
        }[]
    > {
        if (this.allElectronAPIsExist) {
            return await this.ElectronAPIs.getFailedFiles();
        }
    }

    updateFailedFiles(
        files: {
            filePath: string;
            fileUploadResult: number;
        }[]
    ) {
        if (this.allElectronAPIsExist) {
            this.ElectronAPIs.updateFailedFiles(files);
        }
    }
}
export default new ImportService();

import { getToken } from 'utils/common/key';
import { getFileUrl, getThumbnailUrl } from 'utils/common/apiUtil';
import CryptoWorker from 'utils/crypto';
import { generateStreamFromArrayBuffer, convertForPreview } from 'utils/file';
import HTTPService from './HTTPService';
import { File, FILE_TYPE } from './fileService';
import { logError } from 'utils/sentry';

class DownloadManager {
    private fileObjectUrlPromise = new Map<string, Promise<string>>();
    private thumbnailObjectUrlPromise = new Map<number, Promise<string>>();

    public async getPreview(file: File) {
        try {
            const token = getToken();
            if (!token) {
                return null;
            }
            const thumbnailCache = await caches.open('thumbs');
            const cacheResp: Response = await thumbnailCache.match(
                file.id.toString()
            );
            if (cacheResp) {
                return URL.createObjectURL(await cacheResp.blob());
            }
            if (!this.thumbnailObjectUrlPromise.get(file.id)) {
                const downloadPromise = this.downloadThumb(
                    token,
                    thumbnailCache,
                    file
                );
                this.thumbnailObjectUrlPromise.set(file.id, downloadPromise);
            }
            return await this.thumbnailObjectUrlPromise.get(file.id);
        } catch (e) {
            this.thumbnailObjectUrlPromise.delete(file.id);
            logError(e, 'get preview Failed');
            throw e;
        }
    }

    private downloadThumb = async (
        token: string,
        thumbnailCache: Cache,
        file: File
    ) => {
        const thumb = await this.getThumbnail(token, file);
        try {
            await thumbnailCache.put(
                file.id.toString(),
                new Response(new Blob([thumb]))
            );
        } catch (e) {
            // TODO: handle storage full exception.
        }
        return URL.createObjectURL(new Blob([thumb]));
    };

    getThumbnail = async (token: string, file: File) => {
        const resp = await HTTPService.get(
            getThumbnailUrl(file.id),
            null,
            { 'X-Auth-Token': token },
            { responseType: 'arraybuffer' }
        );
        const worker = await new CryptoWorker();
        const decrypted: Uint8Array = await worker.decryptThumbnail(
            new Uint8Array(resp.data),
            await worker.fromB64(file.thumbnail.decryptionHeader),
            file.key
        );
        return decrypted;
    };

    getFile = async (file: File, forPreview = false) => {
        let fileUID: string;
        if (file.metadata.fileType === FILE_TYPE.VIDEO) {
            fileUID = file.id.toString();
        } else {
            fileUID = `${file.id}_forPreview=${forPreview}`;
        }
        try {
            const getFilePromise = async () => {
                const fileStream = await this.downloadFile(file);
                let fileBlob = await new Response(fileStream).blob();
                if (forPreview) {
                    fileBlob = await convertForPreview(file, fileBlob);
                }
                return URL.createObjectURL(fileBlob);
            };
            if (!this.fileObjectUrlPromise.get(fileUID)) {
                this.fileObjectUrlPromise.set(fileUID, getFilePromise());
            }
            return await this.fileObjectUrlPromise.get(fileUID);
        } catch (e) {
            this.fileObjectUrlPromise.delete(fileUID);
            logError(e, 'Failed to get File');
            throw e;
        }
    };

    async downloadFile(file: File) {
        const worker = await new CryptoWorker();
        const token = getToken();
        if (!token) {
            return null;
        }
        if (
            file.metadata.fileType === FILE_TYPE.IMAGE ||
            file.metadata.fileType === FILE_TYPE.LIVE_PHOTO
        ) {
            const resp = await HTTPService.get(
                getFileUrl(file.id),
                null,
                { 'X-Auth-Token': token },
                { responseType: 'arraybuffer' }
            );
            const decrypted: any = await worker.decryptFile(
                new Uint8Array(resp.data),
                await worker.fromB64(file.file.decryptionHeader),
                file.key
            );
            return generateStreamFromArrayBuffer(decrypted);
        }
        const resp = await fetch(getFileUrl(file.id), {
            headers: {
                'X-Auth-Token': token,
            },
        });
        const reader = resp.body.getReader();
        const stream = new ReadableStream({
            async start(controller) {
                const decryptionHeader = await worker.fromB64(
                    file.file.decryptionHeader
                );
                const fileKey = await worker.fromB64(file.key);
                const { pullState, decryptionChunkSize } =
                    await worker.initDecryption(decryptionHeader, fileKey);
                let data = new Uint8Array();
                // The following function handles each data chunk
                function push() {
                    // "done" is a Boolean and value a "Uint8Array"
                    reader.read().then(async ({ done, value }) => {
                        // Is there more data to read?
                        if (!done) {
                            const buffer = new Uint8Array(
                                data.byteLength + value.byteLength
                            );
                            buffer.set(new Uint8Array(data), 0);
                            buffer.set(new Uint8Array(value), data.byteLength);
                            if (buffer.length > decryptionChunkSize) {
                                const fileData = buffer.slice(
                                    0,
                                    decryptionChunkSize
                                );
                                const { decryptedData } =
                                    await worker.decryptChunk(
                                        fileData,
                                        pullState
                                    );
                                controller.enqueue(decryptedData);
                                data = buffer.slice(decryptionChunkSize);
                            } else {
                                data = buffer;
                            }
                            push();
                        } else {
                            if (data) {
                                const { decryptedData } =
                                    await worker.decryptChunk(data, pullState);
                                controller.enqueue(decryptedData);
                                data = null;
                            }
                            controller.close();
                        }
                    });
                }

                push();
            },
        });
        return stream;
    }
}

export default new DownloadManager();

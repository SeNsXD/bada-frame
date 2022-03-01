export const ARCHIVE_SECTION = -1;
export const TRASH_SECTION = -2;
export const ALL_SECTION = 0;

export enum CollectionType {
    folder = 'folder',
    favorites = 'favorites',
    album = 'album',
}

export enum COLLECTION_SORT_BY {
    LATEST_FILE,
    MODIFICATION_TIME,
    NAME,
}

export const COLLECTION_SHARE_DEFAULT_VALID_DURATION =
    10 * 24 * 60 * 60 * 1000 * 1000;
export const COLLECTION_SHARE_DEFAULT_DEVICE_LIMIT = 4;

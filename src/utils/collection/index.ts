import {
    addToCollection,
    Collection,
    CollectionType,
    moveToCollection,
    removeFromCollection,
    restoreToCollection,
} from 'services/collectionService';
import { getSelectedFiles } from 'utils/file';
import { File } from 'services/fileService';
import { CustomError } from 'utils/common/errorUtil';
import { SelectedState } from 'pages/gallery';
import { User } from 'services/userService';
import { getData, LS_KEYS } from 'utils/storage/localStorage';

export enum COLLECTION_OPS_TYPE {
    ADD,
    MOVE,
    REMOVE,
    RESTORE,
}
export async function handleCollectionOps(
    type: COLLECTION_OPS_TYPE,
    setCollectionSelectorView: (value: boolean) => void,
    selected: SelectedState,
    files: File[],
    setActiveCollection: (id: number) => void,
    collection: Collection
) {
    setCollectionSelectorView(false);
    const selectedFiles = getSelectedFiles(selected, files);
    switch (type) {
        case COLLECTION_OPS_TYPE.ADD:
            await addToCollection(collection, selectedFiles);
            break;
        case COLLECTION_OPS_TYPE.MOVE:
            await moveToCollection(
                selected.collectionID,
                collection,
                selectedFiles
            );
            break;
        case COLLECTION_OPS_TYPE.REMOVE:
            await removeFromCollection(collection, selectedFiles);
            break;
        case COLLECTION_OPS_TYPE.RESTORE:
            await restoreToCollection(collection, selectedFiles);
            break;
        default:
            throw Error(CustomError.INVALID_COLLECTION_OPERATION);
    }
    setActiveCollection(collection.id);
}

export function getSelectedCollection(
    collectionID: number,
    collections: Collection[]
) {
    return collections.find((collection) => collection.id === collectionID);
}

export function isSharedCollection(
    collectionID: number,
    collections: Collection[]
) {
    const user: User = getData(LS_KEYS.USER);

    const collection = getSelectedCollection(collectionID, collections);
    if (!collection) {
        return false;
    }
    return collection?.owner.id !== user.id;
}

export function isFavoriteCollection(
    collectionID: number,
    collections: Collection[]
) {
    const collection = getSelectedCollection(collectionID, collections);
    if (!collection) {
        return false;
    } else {
        return collection.type === CollectionType.favorites;
    }
}

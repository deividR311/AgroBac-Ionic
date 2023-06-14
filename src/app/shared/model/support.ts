import { Thumbnail } from './thumbnail';

export class Support {
    description: string;
    requireMetaData: boolean;
    minPictures: number;
    maxPictures: number;
    minWeight: number;
    maxWeight: number;
    maxSizeWidth: number;
    maxSizeHeight: number;
    thumbnails: Array<Thumbnail>;
}

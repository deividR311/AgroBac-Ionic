import { MetaDataFoto } from './metadataFoto';

export class RubroActividad {
    costoEjecutado: number;
    id: number;
    idActividad: number;
    idRubro: number;
    descripcionActividad: string;
    listaMetaDataFoto: Array<MetaDataFoto>;
    constructor() {
        this.id = 0;
        this.idRubro = 0;
    }
}

import { MetaDataFoto } from "./metadataFoto";
import { RubroMetaDataFoto } from "./rubroActividadMetaDataFoto";

export class RubroEntity {
    codigoObligacion: string;
    codigoTipoRubro: number;
    costoEjecutado: number;
    descripcion: string;
    fechaCreacion: Date;
    fechaLimiteAutogestion: Date;
    fechaModificacion: Date;
    id: number;
    idActividadInversion: string;
    listaMetaDataFoto: Array<MetaDataFoto>;
    listaRubroMetaDataFoto: Array<RubroMetaDataFoto>;
    tipoIdentificacion: number;
    numeroIdentificacion: string;
    usuarioCreacion: string;
    usuarioModificacion: string;
    guid: string;
    idCase: string;
    estadoObligacion: number;

    constructor() {
        this.id = 0;
        this.codigoObligacion = '0000';
    }
}

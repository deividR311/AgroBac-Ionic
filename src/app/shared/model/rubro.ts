import { RubroInfraestructura } from './rubroInfrastructura';

export class Rubro {
    codigoObligacion: string;
    codigoTipoRubro: string;
    costoEjecutado: number;
    costoEjectuado: number;
    descripcion: string;
    fechaCreacion: string;
    fechaLimiteAutoGestion: Date;
    fechaModificacion: string;
    id: number;
    idCase: number;
    listaMetaDataFoto: Array<any>;
    listaRubroMetadataFoto: Array<any>;
    tipoIdentificacion: number;
    numeroIdentificacion: string;
    usuarioCreacion: string;
    usuarioModificacion: string;
    rubroInfraestructura: RubroInfraestructura;
    rubro: Rubro;
    guid: string;
    estadoObligacion: number;
}

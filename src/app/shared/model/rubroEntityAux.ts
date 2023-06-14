export class RubroEntityAux {
    id: number;
    codigoObligacion: string;
    codigoTipoRubro: number;
    costoEjecutado: number;
    descripcion: string;
    fechaCreacion: Date;
    fechaLimiteAutogestion: Date;
    fechaModificacion: Date;
    numeroIdentificacion: string;
    usuarioCreacion: string;
    usuarioModificacion: string;
    guid: string;
    idCase: string;

    constructor() {
        this.id = 0;
        this.codigoObligacion = '0000';
    }
}

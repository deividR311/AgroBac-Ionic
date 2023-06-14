import { RubroActividad } from './rubroActividad';
import { RubroEntity } from './rubroEntity';

export class RubroCapitalTrabajo {
    rubro: RubroEntity;
    listaActividades: Array<RubroActividad>;
    constructor() {
        this.rubro = new RubroEntity();
        this.listaActividades = null;
    }
}

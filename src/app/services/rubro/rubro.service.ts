import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { RubroDataLoaded } from 'src/app/shared/core/helpers';
import { Login } from 'src/app/shared/model/login';
import { Obligation } from 'src/app/shared/model/Obligation';
import { RubroCapitalTrabajo } from 'src/app/shared/model/rubroCapitalTrabajo';
import { RubroInfraestructuraAux } from 'src/app/shared/model/rubroInfraestructuraAux';
import { RubroTractores } from 'src/app/shared/model/rubroTractores';
import { environment } from '../../../environments/environment';
import { ResourceService } from '../resource/resource.service';


@Injectable({
    providedIn: 'root'
})
export class RubroService {
    userLogged : Login;

    constructor(private readonly httpClient: HttpClient,
        private readonly resourceService: ResourceService) {
        this.userLogged = new Login();
    }


    InsertarRubroCapitalTrabajo(objectValue: RubroCapitalTrabajo,esDestanqueo?: boolean): Observable<any> {   
        this.userLogged = this.resourceService.GetUser();
        let destanqueo: string = "";  
        if(esDestanqueo != null && esDestanqueo != undefined){
            destanqueo = "?esDestanqueo=true";
        }

        objectValue.rubro.usuarioCreacion = this.userLogged.usuario;
        const headers = this.resourceService.GetTransactionContext();
        const urlService = `${environment.urlService.url}InsertarRubroCapitalTrabajo` + destanqueo;

        return this.httpClient.post(urlService, objectValue, { headers });
    }

    InsertarRubroTractores(objectValue: RubroTractores,esDestanqueo?: boolean): Observable<any> {
        let destanqueo: string = "";  
        if(esDestanqueo != null && esDestanqueo != undefined){
            destanqueo = "?esDestanqueo=true";
        }

        const headers = this.resourceService.GetTransactionContext();
        const urlService = `${environment.urlService.url}InsertarRubroTractores` + destanqueo;

        return this.httpClient.post(urlService, objectValue, { headers });
    }

    InsertarRubroInfraestructura(objectValue: RubroInfraestructuraAux,esDestanqueo?: boolean): Observable<any> {
        let destanqueo: string = "";  
        if(esDestanqueo != null && esDestanqueo != undefined){
            destanqueo = "?esDestanqueo=true";
        }
        const headers = this.resourceService.GetTransactionContext();
        const urlService = `${environment.urlService.url}InsertarRubroInfraestructura` + destanqueo;

        return this.httpClient.post(urlService, objectValue, { headers });
    }

    ConsultarRubroCapitalTrabajo(guid: string, obligacion: string, idCase: number): Observable<any> {
        const headers = this.resourceService.GetTransactionContext();
        const urlService = `${environment.urlService.url}ConsultarRubroCapitalTrabajo?guid=${guid}&CodigoObligacion=${obligacion}&idcase=${idCase}`;
        return this.httpClient.get(urlService, { headers });
    }

    ConsultarRubroTractores(guid: string, obligacion: string, idCase: number): Observable<any> {
        const headers = this.resourceService.GetTransactionContext();
        const urlService = `${environment.urlService.url}ConsultarRubroTractores?guid=${guid}&CodigoObligacion=${obligacion}&idcase=${idCase}`;
        return this.httpClient.get(urlService, { headers });
    }

    ConsultarRubroInfraestructura(guid: string, obligacion: string, idCase: number): Observable<any> {
        const headers = this.resourceService.GetTransactionContext();
		const urlService = `${environment.urlService.url}ConsultarRubroInfraestructura?guid=${guid}&CodigoObligacion=${obligacion}&idcase=${idCase}`;
        return this.httpClient.get(urlService,{ headers });
    }

    ConsultarRubros(idCase: number, obligacion: string): Observable<any> {
        const headers = this.resourceService.GetTransactionContext();
		const urlService = `${environment.urlService.url}ConsultaCantidadRubros?IdCase=${idCase}&CodigoObligacion=${obligacion}`;
        return this.httpClient.get(urlService,{ headers });
    }

    InsertarHostVisitor( objectValue: Obligation ): Observable<any> {
        const headers = this.resourceService.GetTransactionContext();
        const urlService = `${environment.urlService.url}InsertarObligacion`;

        return this.httpClient.post(urlService, objectValue, { headers });
    }

    ConsultarHostVisitor( idCase: number, obligacion: string ): Observable<any> {
        const headers = this.resourceService.GetTransactionContext();
		const urlService = `${environment.urlService.url}ConsultaObligacion?idCase=${idCase}&codigoObligacion=${obligacion}`;
        return this.httpClient.get(urlService,{ headers });
    }
}

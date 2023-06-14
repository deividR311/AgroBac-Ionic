import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { IdentidadPersona } from 'src/app/shared/model/IdentidadPersona';
import { environment } from '../../../environments/environment';
import { PersistenceService } from 'angular-persistence';

@Injectable({
    providedIn: 'root'
})
export class CobisService {
    solicitudProceso = false;
    reintentarSolicitud = false;
    mostrarAutorizaciones = false;
    sinRespuestaServicio = false;
    intentos = null;
    constructor(private readonly httpClient: HttpClient, private readonly persistence: PersistenceService) {
    }

    ConsultarClienteCobis(objectValue: IdentidadPersona): Observable<any> {

        const timeOne = setTimeout(() => {
            this.SolicitudProceso();
        }, 30000);


        const timeTwo = setTimeout(() => {
            clearTimeout(timeOne);
            clearTimeout(timeTwo);
            this.ReintentarSolicitud();

        }, 180000);


        this.solicitudProceso = false;
        this.reintentarSolicitud = false;
        this.persistence.set('solicitudProceso', `${this.solicitudProceso}`);
        this.persistence.set('reintentarSolicitud', `${this.reintentarSolicitud}`);
        const headers = new HttpHeaders({ 'ContextoTransaccional': '{"identificadorTransaccional" : 1,"fecTransaccion": "23-12-2020","codCanalOriginador": "28","codProcesoOriginador" : "28","codFuncionalidadOriginador" : "App Control de Inversion","ipConsumidor" : "172.29.197.43"}', 'Content-Type': 'application/json' });
        let urlService = '';
        if (this.persistence.get('mostrarAutorizaciones') !== undefined) {
            this.mostrarAutorizaciones = JSON.parse(this.persistence.get('mostrarAutorizaciones'));
        } else {
            this.mostrarAutorizaciones = true;
        }
        const intentosGeneracion = this.persistence.get('intentosGeneracion');
        if (intentosGeneracion !== true) {
            if (this.mostrarAutorizaciones) {
                urlService = `${environment.urlService.url}ValidarClienteCobis?register=true&intentos=false`;
            } else {
                urlService = `${environment.urlService.url}ValidarClienteCobis?register=false&intentos=false`;
            }
        } else {
            if (this.mostrarAutorizaciones) {
                urlService = `${environment.urlService.url}ValidarClienteCobis?register=true&intentos=true`;
            } else {
                urlService = `${environment.urlService.url}ValidarClienteCobis?register=false&intentos=true`;
            }
        }
        return this.httpClient.post(urlService, objectValue, { headers });
    }

    SolicitudProceso() {
        this.sinRespuestaServicio = JSON.parse(this.persistence.get('sinRespuestaServicio'));
        if (!this.sinRespuestaServicio) {
            this.solicitudProceso = true;
        } else {
            this.solicitudProceso = false;
        }
        this.persistence.set('solicitudProceso', `${this.solicitudProceso}`);
    }

    ReintentarSolicitud() {
        this.sinRespuestaServicio = JSON.parse(this.persistence.get('sinRespuestaServicio'));
        if (!this.sinRespuestaServicio) {
            this.reintentarSolicitud = true;
        } else {
            this.reintentarSolicitud = false;
        }
        this.persistence.set('reintentarSolicitud', `${this.reintentarSolicitud}`);
    }
}

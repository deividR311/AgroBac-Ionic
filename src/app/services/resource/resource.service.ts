import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Router } from '@angular/router';
import { PersistenceService } from 'angular-persistence';
import { TransactionContext } from 'src/app/shared/model/transactioncontext';
import { ToasterService } from '../toaster/toaster.service';




@Injectable({
    providedIn: 'root'
})
export class ResourceService {
    constructor(private readonly httpClient: HttpClient,
                private readonly persistenceService: PersistenceService,
                private readonly toasterService: ToasterService,
                private readonly router: Router) { }

    async GetResourceValues() {
        return this.httpClient.get('../../../assets/i18n/es.json').toPromise();
    }

    public GetPersistenceValue(key: string): any {
        return this.persistenceService.get(key);
    }

    SetPersistenceValue(key: string, value: any) {
        this.persistenceService.set(key, value);
    }

    ClearPersistence() {
        this.persistenceService.removeAll();
    }

    ClearPersistenceKey(key: string) {
        this.persistenceService.remove(key);
    }

    GetDate() {
        const dateNow = new Date();
        const day = ('0' + dateNow.getDate()).slice(-2);
        const month = ('0' + (dateNow.getMonth() + 1)).slice(-2);
        const year = dateNow.getFullYear();
        return day + '/' + month + '/' + year;
    }

    GetTransactionContext() {
        let auth = '';
        if (typeof(this.persistenceService.get('authorization')) !== 'undefined')
        {
            auth = this.persistenceService.get('authorization');
        }
        const context = new TransactionContext();
        context.identificadorTransaccional = 1;
        context.fecTransaccion = new Date().toISOString();
        context.codCanalOriginador = '28';
        context.codProcesoOriginador = '28';
        context.codFuncionalidadOriginador = 'Control Inversion';
        context.ipConsumidor = '';
        return new HttpHeaders({
            'ContextoTransaccional': JSON.stringify(context),
            'Content-Type': 'application/json',
            'authorization': auth
        });
    }

    CheckPersistence(key: string): boolean {
        return typeof (this.persistenceService.get(key)) !== 'undefined';
    }

    GetUser() {
        const login = this.persistenceService.get('user');
        if (typeof (login) === 'undefined') {
            this.GetResourceValues().then(
                (data) => {
                    this.toasterService.PresentToastMessage(data['mobile.generics.Unauthorized']);
                });
            this.router.navigate(['/login']);
        }
        else {
            if( typeof login === "string")
                return JSON.parse(login);
            else
                return login;
        }
    }

    IsOnline(){
        return this.persistenceService.get('Online') === true 
        || this.persistenceService.get('Online') === undefined;
    }

    IsDevice(){
        return this.persistenceService.get('Celular') === true;
    }

    delay(ms: number) {
        return new Promise( resolve => setTimeout(resolve, ms) );
    }

}

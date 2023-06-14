import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { Login } from 'src/app/shared/model/login';
import { environment } from '../../../environments/environment';
import { ResourceService } from '../resource/resource.service';


@Injectable({
    providedIn: 'root'
})
export class LoginService {
    constructor(private readonly httpClient: HttpClient,
        private readonly resourceService: ResourceService) { }

    Login(objectValue: Login): Observable<any> {
        const headers = this.resourceService.GetTransactionContext();
        const urlService = `${environment.urlService.url}ConsultarLogin?funcionario=true`;
        return this.httpClient.post(urlService, objectValue, { headers });
    }
}

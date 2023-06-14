import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { Photo } from 'src/app/shared/model/Photo';
import { environment } from '../../../environments/environment';
import { ResourceService } from '../resource/resource.service';

@Injectable({
    providedIn: 'root'
})
export class HomeService {
    constructor(private readonly httpClient: HttpClient,
        private readonly resourceService: ResourceService) { }

    SubirFoto(objectValue: Photo): Observable<any> {
        const headers = this.resourceService.GetTransactionContext();
        const urlService = `${environment.urlService.url}GuardarFoto`;
        return this.httpClient.post(urlService, objectValue, { headers });
    }
}

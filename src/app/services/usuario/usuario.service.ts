import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { UsuarioRegistro } from 'src/app/shared/model/usuarioRegistro';
import { environment } from '../../../environments/environment';
import { ResourceService } from '../resource/resource.service';
@Injectable({
  providedIn: 'root',
})
export class UsuarioService {
  constructor(
    private readonly httpClient: HttpClient,
    private readonly resourceService: ResourceService
  ) {}
  public RegistrarUsuario(
    objectValue: UsuarioRegistro,
    option: boolean
  ): Observable<any> {
    const headers = this.resourceService.GetTransactionContext();
    return this.httpClient.post(
      `${environment.urlService.url}RegistrarUsuario?register=` + option,
      objectValue,
      { headers }
    );
  }
}

import { HttpErrorResponse, HttpEvent, HttpHandler, HttpInterceptor, HttpRequest } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Router } from '@angular/router';
import { Observable } from 'rxjs';
import { tap, finalize } from 'rxjs/operators';
import { LoadingService } from 'src/app/services/loading/loading.service';
import { ResourceService } from 'src/app/services/resource/resource.service';
import { ToasterService } from '../../services/toaster/toaster.service';
import { Enumerator } from '../enum/enumerator.enum';
import { interceptorError } from './helpers';

@Injectable()
export class Interceptor implements HttpInterceptor {

    constructor(private readonly toasterService: ToasterService,
                private readonly resourceService: ResourceService,
                private readonly loadingService: LoadingService,
                private readonly router: Router) { }

    intercept(req: HttpRequest<any>, next: HttpHandler): Observable<HttpEvent<any>> {
        const authorization = 'Bearer ' + this.resourceService.GetPersistenceValue('authorization');
        let headers;
        if (typeof(authorization) !== 'undefined' && authorization !== null) {
            headers = {
                Authorization: authorization
            };
        }

        const reqHeader = req.clone({
            setHeaders: headers
        });
        if (req.url.endsWith('ConsultarCliente') || req.url.endsWith('ConsultarRubroTractores?id=4') ||
        req.url.includes('ConsultarParametro')) {
            return next.handle(reqHeader);
        } else {
            if (!this.loadingService.isLoading) {
                this.loadingService.loadingPresent();
            }
            return next.handle(reqHeader).pipe(tap(
                (res: any) => {
                    if (typeof(res?.body?.authorization) !== 'undefined'
                        && res?.body?.authorization !== null){
                        this.resourceService.SetPersistenceValue('authorization', res?.body?.authorization);
                    }
                },
                (err: HttpErrorResponse) => {
                    if (interceptorError()) {
                        if (err.status === Enumerator.HTTP_RESPONSE_UNAUTHORIZED){
                            this.resourceService.GetResourceValues().then(
                                (data) => {
                                    if ( err.error.resultData != null){
                                        this.toasterService.PresentToastMessage(err.error.resultData[0].mensaje);
                                    }else{
                                        if (this.loadingService.isLoading) {
                                            this.loadingService.loadingDismiss();
                                        }
                                        this.toasterService.PresentToastMessage(data['mobile.generics.Unauthorized']);
                                    }
                                }
                            );
                            this.router.navigate(['/login']);
                        }
                        if (err.status === Enumerator.HTTP_RESPONSE_BADREQUEST ||
                            err.status === Enumerator.HTTP_RESPONSE_SERVERERROR
                            || err.status === Enumerator.HTTP_RESPONSE_UNKNOWN){
                            this.resourceService.GetResourceValues().then(
                                (data) => {
                                    if (this.loadingService.isLoading) {
                                        this.loadingService.loadingDismiss();
                                    }
                                    if (req.url.includes('VerificarToken') || req.url.includes('ObtenerToken')
                                    || req.url.includes('ValidarClienteCobis') || req.urlWithParams.includes('ConsultarParametro'))
                                    {
                                        const msg: any = err.error;
                                        if (err.error.responseMessage.includes('Object reference not set to an instance of an object.')){
                                            this.toasterService.PresentToastMessage(data['mobile.generics.incompleteInformation']);
                                        } else {
                                            if (req.url.includes('VerificarToken') === false || !req.url.includes('ObtenerToken') === false) {
                                                this.toasterService.PresentToastMessage(msg.responseMessage);
                                            }
                                        }
                                    }
                                    else {
                                        this.toasterService.PresentToastMessage(
                                            data['mobile.generics.ErrorMessage'] + err?.message);
                                    }
                                }
                            );
                        }
                    }
                }),
                finalize(() => {
                    if (this.loadingService.isLoading) {
                        this.loadingService.loadingDismiss();
                    }
                }));
        }
    }

}

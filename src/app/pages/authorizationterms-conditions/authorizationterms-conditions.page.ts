import { Component, OnInit } from '@angular/core';
import { AuthorizationService } from 'src/app/services/authorization/authorization.service';
import { Enumerator } from 'src/app/shared/enum/enumerator.enum';
import { TerminosCondiciones } from 'src/app/shared/model/termsconditions';
import { HttpResponse } from 'src/app/shared/model/httpresponse';
import { ModalController } from '@ionic/angular';
import { PersistenceService } from 'angular-persistence';
import { Parametro } from 'src/app/shared/model/parametro';

@Component({
  selector: 'app-authorizationterms-conditions',
  templateUrl: './authorizationterms-conditions.page.html',
  styleUrls: ['./authorizationterms-conditions.page.scss'],
})
export class AuthorizationtermsConditionsPage implements OnInit {
  public documentoTerminosCondiones: string;

  constructor(private readonly authorizationservice: AuthorizationService,
              private readonly modalCtrl: ModalController,
              private readonly persistence: PersistenceService) { }

  ngOnInit() {
    this.searchDataTermsConditions();
  }

  searchDataTermsConditions(){
    const terminosCondiciones: TerminosCondiciones = new TerminosCondiciones();
    terminosCondiciones.id = 2;

    this.authorizationservice.TerminosCondiciones(terminosCondiciones).subscribe(
        (data: HttpResponse<Parametro>) => {
          if (data.responseCode === Enumerator.HTTP_RESPONSE_OK){
            if (data.resultData.length > 0) {
              this.documentoTerminosCondiones = data.resultData[0].valor;
            }else {
              this.documentoTerminosCondiones = 'No se encuentra un documento parametrizado';
            }
          }
        },
        (err: any) => {

        }
    );
  }

  closeModalTermsConditions() {
    this.modalCtrl.dismiss();
  }

  acceptTerms() {
    const acceptaterminos = true;
    this.persistence.set('acceptaterminos', `${acceptaterminos}`);
    this.closeModalTermsConditions();
  }
}

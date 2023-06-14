import { HttpResponse } from 'src/app/shared/model/httpresponse';
import { Component, OnInit } from '@angular/core';
import { AuthorizationService } from 'src/app/services/authorization/authorization.service';
import { Enumerator } from 'src/app/shared/enum/enumerator.enum';
import { TerminosCondiciones } from 'src/app/shared/model/termsconditions';
import { ModalController } from '@ionic/angular';
import { PersistenceService } from 'angular-persistence';
import { Parametro } from 'src/app/shared/model/parametro';

@Component({
  selector: 'app-authorization-data-treatment',
  templateUrl: './authorization-data-treatment.page.html',
  styleUrls: ['./authorization-data-treatment.page.scss'],
})
export class AuthorizationDataTreatmentPage implements OnInit {
  public documentoTratamientoDatos: string;
  constructor(private readonly authorizationservice: AuthorizationService,
              private readonly modalCtrl: ModalController,
              private readonly persistence: PersistenceService) { }

  ngOnInit() {
    this.searchDataTreatment();
  }

  searchDataTreatment(){
    const terminosCondiciones: TerminosCondiciones = new TerminosCondiciones();
    terminosCondiciones.id = 1;

    this.authorizationservice.TerminosCondiciones(terminosCondiciones).subscribe(
        (data: HttpResponse<Parametro>) => {
          if (data.responseCode === Enumerator.HTTP_RESPONSE_OK){
            if (data.resultData.length > 0){
              this.documentoTratamientoDatos = data.resultData[0].valor;
            }else{
                  this.documentoTratamientoDatos = 'No se encontro un documento parametrizado';
            }
          }
        },
        (err: any) => {

        }
    );
  }
  closeModalDataTermsConditions(){
    this.modalCtrl.dismiss();
  }

  acceptDataTreament() {
    this.closeModalDataTermsConditions();
    const tratamientodatos = true;
    this.persistence.set('tratamientodatos', `${tratamientodatos}`);
  }

}

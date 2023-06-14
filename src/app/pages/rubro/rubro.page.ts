import { Component, OnInit, ViewChild } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { SQLite } from '@ionic-native/sqlite/ngx';
import { IonToggle, ModalController } from '@ionic/angular';
import { PersistenceService } from 'angular-persistence';
import { ParametroService } from 'src/app/services/Parametro/parametro.service';
import { ResourceService } from 'src/app/services/resource/resource.service';
import { RubroService } from 'src/app/services/rubro/rubro.service';
import { ToasterService } from 'src/app/services/toaster/toaster.service';
import { DatabaseComponent } from 'src/app/shared/components/database/database.component';
import { RejectionReasonComponent } from 'src/app/shared/components/rejection-reason/rejection-reason.component';
import { Catalogs } from 'src/app/shared/core/constants/catalog.enum';
import { manageLocalStorageSavedEventRubro } from 'src/app/shared/core/helpers';
import { Enumerator } from 'src/app/shared/enum/enumerator.enum';
import { CantidadRubros } from 'src/app/shared/model/CantidadRubros';
import { Credit } from 'src/app/shared/model/credit';
import { Obligation } from 'src/app/shared/model/Obligation';
import { ObligacionUpdate } from 'src/app/shared/model/obligationUpdates';
import { Parametro } from 'src/app/shared/model/parametro';

@Component({
  selector: 'app-rubro',
  templateUrl: './rubro.page.html',
  styleUrls: ['./rubro.page.scss'],
})
export class RubroPage implements OnInit {
  @ViewChild(IonToggle) toggle: IonToggle;
  @ViewChild(DatabaseComponent) databaseComponent: DatabaseComponent;

  obligacionesRequiresInternet = false;
  creditsUser: Array<Credit>;

  //host visitor
  hostVisitor: FormGroup;
  tiposDocumento: any;
  isPrincipal: boolean;
  rubroComplete: number;
  hostVisitorDisabled: boolean;
  hostVisitorObject : Obligation;
  cantidadRubros : CantidadRubros;
  hostVisitorId : number = 0;
  obligationState : number;
  obligationActiveState : number = 1;
  obligationStateLoaded : number;
  //

  // obligationUpdates
  obligationUpdate : ObligacionUpdate;
  //

  constructor(
    private readonly resourceService: ResourceService,
    private readonly router: Router,
    private readonly formBuilder: FormBuilder,
    private readonly toasterService: ToasterService,
    private readonly rubroService: RubroService,
    private readonly sqlite: SQLite,
    private readonly persistence: PersistenceService,
    private readonly parametroService: ParametroService,
    private readonly modalCtrl: ModalController
    ) {
    this.tiposDocumento = new Array<Parametro>();
    this.tiposDocumento = this.router.getCurrentNavigation().extras.state;
    
    this.hostVisitorObject = new Obligation;
    this.cantidadRubros = new CantidadRubros;
    this.obligationUpdate = new ObligacionUpdate;
  }

  ngOnInit() {
    this.initForm();
  }

  ionViewWillEnter() {
    this.executeOnlineOrOfflineFunctions();
  }

  executeOnlineOrOfflineFunctions() {
    this.initForm();
    this.GetHeadings();
    this.obligacionesRequiresInternet = false;
    if (this.resourceService.IsOnline()) {
      this.getCantidadRubros();
      this.getObligacionState();
    } else {
      this.getCantidadRubrosOffline();
      this.getObligacionStateOffline();
    }
    this.ConsultarHostVisitor();
  }

  initForm() {
    this.hostVisitor = this.formBuilder.group({
      NombreCompleto: ['', [Validators.required]],
      TipoIdentificacion: [, [Validators.required]],
      NumeroIdentificacion: ['', [Validators.required, Validators.maxLength(10)]],
      Celular: ['', [Validators.required]]
    });
  }

  //regex
  expresionRegular(){
    const regular = /[^a-zA-Z0-9ñÑ\d]/i;
    let valor = null;
    valor = this.hostVisitor.value.NumeroIdentificacion;
    if (valor !== null) {
      valor = valor.substring(0, 10);
      valor = valor.replace(regular, '');
      setTimeout(() => {​​​​​
        this.hostVisitor.controls.NumeroIdentificacion.setValue(valor);
      }​​​​​, 10);
    }
  }

  notNumberRegex() {
    const regular = /[^a-zA-ZñÑ\s]/i;
    let valor = null;
    valor = this.hostVisitor.value.NombreCompleto;
    if (valor !== null) {
      valor = valor.substring(0, 70);
      valor = valor.replace(regular, '');
      setTimeout(() => {​​​​​
        this.hostVisitor.controls.NombreCompleto.setValue(valor);
      }​​​​​, 10);
    }
  }

  onlyNumberRegex() {
    const regular = /[^0-9\d]/i;
    let valor = null;
    valor = this.hostVisitor.value.Celular;
    if (valor !== null) {
      valor = valor.substring(0, 10);
      valor = valor.replace(regular, '');
      setTimeout(() => {​​​​​
        this.hostVisitor.controls.Celular.setValue(valor);
      }​​​​​, 10);
    }
  }
  //

  updateTipoIdentificacion() {
    this.hostVisitor.controls.NumeroIdentificacion.reset();
  }

  GetHeadings() {
    const test1 = this.resourceService.CheckPersistence('obligacion');
    const test2 = this.resourceService.CheckPersistence('credits');
    if ( test1 && test2 ) {
      const obligacion = this.resourceService.GetPersistenceValue('obligacion');
      const credits = JSON.parse(this.resourceService.GetPersistenceValue('credits'));
      this.creditsUser = credits.filter((f: { obligacion: any; }) => f.obligacion === obligacion);
    }
  }

  //host visitor
    // cantidad Rubros
    getCantidadRubros() {
      const { idCase, obligacion } = this.creditsUser[0];
      const request = this.rubroService.ConsultarRubros( idCase, obligacion );

      request.subscribe(
        async (res) => {
          const { resultData } = res;
          this.databaseComponent = new DatabaseComponent(this.sqlite, this.persistence);
          
          this.rubroComplete = resultData[0];
          this.cantidadRubros.IdCase = idCase;
          this.cantidadRubros.CodigoObligacion = obligacion;
          this.cantidadRubros.CantidadRubros = this.rubroComplete;

          const cantidadRubros = await this.databaseComponent.selectDataCantidadRubros(idCase, obligacion);
          if (cantidadRubros.length > 0) {
            this.databaseComponent.deleteDataCantidadRubros(idCase, obligacion);
          }
          this.databaseComponent.insertDataCantidadRubros(this.cantidadRubros);
        }
      )
    }

    async getCantidadRubrosOffline() {
      const { idCase, obligacion } = this.creditsUser[0];
      this.databaseComponent = new DatabaseComponent(this.sqlite, this.persistence);

      const cantidadRubros = await this.databaseComponent.selectDataCantidadRubros(idCase, obligacion);
      this.rubroComplete = cantidadRubros[0]?.CantidadRubros;
      
      if (!this.rubroComplete) {
        this.databaseComponent = new DatabaseComponent(this.sqlite, this.persistence);
        const cantidadRubros = await this.databaseComponent.selectRubros(idCase, obligacion);
        this.rubroComplete = cantidadRubros.length;
      }

      if (this.rubroComplete && this.creditsUser?.length !== this.rubroComplete) {
        this.databaseComponent = new DatabaseComponent(this.sqlite, this.persistence);
        const cantidadRubros = await this.databaseComponent.selectRubros(idCase, obligacion);
        this.rubroComplete = cantidadRubros.length;
      }
    }
    // cantidad Rubros

    // Estado obligacion
    async getObligacionState() {
      const response = this.parametroService.ConsultarParametro(Catalogs.ObligacionState);
      response.subscribe((res) => {
        const { resultData } = res;

        this.obligationState = Number(resultData[0].codigo) === this.obligationActiveState ?
        Number(resultData[0].codigo) : this.obligationActiveState;
        this.databaseComponent = new DatabaseComponent(this.sqlite, this.persistence);
        this.databaseComponent.deleteDataParametro(Catalogs.ObligacionState);
        this.databaseComponent.insertDataParametro(resultData[0], Catalogs.ObligacionState);
      },
      (err) => console.log(err))
    }

    async getObligacionStateOffline() {
      const data = await this.databaseComponent.selectDataParametro(Catalogs.ObligacionState);
      this.obligationState = Number(data[0].codigo) === this.obligationActiveState ?
      Number(data[0].codigo) : this.obligationActiveState;
    }
    //

    // Host Visitor
    ConsultarHostVisitor() {
      const { idCase, obligacion, identificacionCliente, numeroDocumento } = this.creditsUser[0];
      const documentoHostVisitor = numeroDocumento ? numeroDocumento : identificacionCliente;
      
      ( this.resourceService.IsOnline() )
        ? this.getHostVisitor( idCase, obligacion, documentoHostVisitor )
        : this.getHostVisitorOffline( idCase, obligacion, documentoHostVisitor );
    }

    getHostVisitor( idCase: number, obligacion: string, identificacionCliente: string ) {
      const request = this.rubroService.ConsultarHostVisitor(idCase, obligacion);
      request.subscribe(async (res) => {      
        if (res.resultData.length > 0) {
          this.obligationStateLoaded = res.resultData[0].estado;
          const { id, nombreCompleto, tipoIdentificacion, numeroIdentificacion, celular } = res.resultData[0];
          this.hostVisitorId = id;
          this.hostVisitor.patchValue({
            NombreCompleto : nombreCompleto,
            TipoIdentificacion : String(tipoIdentificacion),
            NumeroIdentificacion : numeroIdentificacion,
            Celular : celular
          });
          
          const hostVisitorSavedOffline = await this.saveHostVisitorDataOffline(res.resultData[0], idCase, obligacion);
          
          if (identificacionCliente === numeroIdentificacion && hostVisitorSavedOffline) {
            this.hostVisitorDisabled = true;
            this.toggle.checked = true;
          } else {
            this.hostVisitorDisabled = false;
            this.toggle.checked = false; 
          }  
        } else {
          this.toggle.checked = true;
          setTimeout(() => {
            this.fillHostVisitorData( null, this.toggle?.checked );
          }, 10);
        }
      });
    }

    async saveHostVisitorDataOffline( hostVisitor : Obligation, idCase: number, obligacion: string ) {
      this.databaseComponent = new DatabaseComponent(this.sqlite, this.persistence);
      const hostVisitorData = await this.databaseComponent.selectDataObligacion( idCase, obligacion );

      if (hostVisitorData.length > 0) {
        this.databaseComponent.deleteDataObligacion( idCase, obligacion );
      }
      
      this.databaseComponent.insertDataObligacion(hostVisitor, false);
      const hostVisitorDataAfterSave = await this.databaseComponent.selectDataObligacion( idCase, obligacion );
      return new Promise((resolve) => {
        if (hostVisitorDataAfterSave.length > 0) {
          resolve(true);
        }
      })
    }

    async getHostVisitorOffline( idCase: number, obligacion: string, identificacionCliente: string ) {
      this.databaseComponent = new DatabaseComponent(this.sqlite, this.persistence);
      const hostVisitor = await this.databaseComponent.selectDataObligacion(idCase, obligacion);
      if (hostVisitor.length > 0) {
        const { Id, TipoIdentificacion, NumeroIdentificacion,
        NombreCompleto, Celular, Estado } = hostVisitor[0];
        this.obligationStateLoaded = Estado;
        this.hostVisitorId = Id;
        this.hostVisitor.patchValue({
          NombreCompleto : NombreCompleto,
          TipoIdentificacion : String(TipoIdentificacion),
          NumeroIdentificacion : NumeroIdentificacion,
          Celular : Celular
        });

        if (identificacionCliente === NumeroIdentificacion) {
          this.hostVisitorDisabled = true;
          this.toggle.checked = true;
        } else {
          this.hostVisitorDisabled = false;
          this.toggle.checked = false;
        }
      } else {
        this.toggle.checked = true;
        this.fillHostVisitorData(null, true);
      }
    }

    async fillHostVisitorData( event: any, checked? : boolean ) {
      const { idCase, obligacion, identificacionCliente,
        numeroDocumento, tipoDocumento, nombreCliente } = this.creditsUser[0];
      const documentoHostVisitor = numeroDocumento ? numeroDocumento : identificacionCliente;
      const TipoDocumentoCodigo = this.tiposDocumento.find(
        (documento: { valor: string; }) => documento.valor == tipoDocumento).codigo;

      this.databaseComponent = new DatabaseComponent(this.sqlite, this.persistence);
      const hostVisitorData = await this.databaseComponent.selectDataObligacion( idCase, obligacion );

      if (event?.detail?.checked || checked) {
        this.hostVisitorDisabled = true;

        if (hostVisitorData.length > 0) {
          const { NumeroIdentificacion, Celular } = hostVisitorData[0];
          if (documentoHostVisitor === NumeroIdentificacion) {
            this.hostVisitor.patchValue({
              Celular : Celular
            })
          } else {
            this.hostVisitor.controls.Celular.reset();
          }
        }  
        
        this.hostVisitor.patchValue({
          NombreCompleto : nombreCliente,
          TipoIdentificacion : TipoDocumentoCodigo,
          NumeroIdentificacion : documentoHostVisitor
        })
      } else {
        this.hostVisitorDisabled = false;

        if (hostVisitorData.length > 0) {
          const { NombreCompleto, TipoIdentificacion, NumeroIdentificacion, Celular } = hostVisitorData[0];
          if (documentoHostVisitor !== NumeroIdentificacion) {
            this.hostVisitor.patchValue({
              NombreCompleto : NombreCompleto,
              TipoIdentificacion : String(TipoIdentificacion),
              NumeroIdentificacion : NumeroIdentificacion,
              Celular : Celular
            })
          } else {
            this.hostVisitor.controls.NombreCompleto.reset();
            this.hostVisitor.controls.TipoIdentificacion.reset();
            this.hostVisitor.controls.NumeroIdentificacion.reset();
            this.hostVisitor.controls.Celular.reset();
          }
        } else {
          this.hostVisitor.controls.NombreCompleto.reset();
          this.hostVisitor.controls.TipoIdentificacion.reset();
          this.hostVisitor.controls.NumeroIdentificacion.reset();
          this.hostVisitor.controls.Celular.reset();
        }
      }
    }

    saveHostVisitor() {
      const { idCase, obligacion } = this.creditsUser[0];

      this.hostVisitorObject.id = this.hostVisitorId;
      this.hostVisitorObject.idCase = idCase;
      this.hostVisitorObject.nombreCompleto = this.hostVisitor.value.NombreCompleto;
      this.hostVisitorObject.codigoObligacion = obligacion;
      this.hostVisitorObject.tipoIdentificacion = Number(this.hostVisitor.value.TipoIdentificacion);
      this.hostVisitorObject.numeroIdentificacion = this.hostVisitor.value.NumeroIdentificacion;
      this.hostVisitorObject.estado = this.obligationState;
      this.hostVisitorObject.celular = this.hostVisitor.value.Celular;

      if ( this.obligationStateLoaded === Enumerator.ESTADO_OBLIGACION_RECHAZADO ) {
        this.hostVisitorObject.id = 0;
      }

      ( this.resourceService.IsOnline() )
        ? this.rubroService.InsertarHostVisitor(this.hostVisitorObject).subscribe(
          async (res) => {
            if (res.responseCode === Enumerator.HTTP_RESPONSE_OK) {
              manageLocalStorageSavedEventRubro();
              await this.insertObligationUpdates( idCase, obligacion );
              this.resourceService.GetResourceValues().then(
                (data) => {
                  this.toasterService.PresentToastMessage(data['mobile.generics.Saved']);
                  this.router.navigate(['/credits']);
                }
              );
              this.databaseComponent = new DatabaseComponent(this.sqlite, this.persistence);              
              await this.databaseComponent.deleteRemanagementRubro( idCase, obligacion );
            }
          })
        : this.saveHostVisitorOffline( this.hostVisitorObject, idCase, obligacion );
    }

    async saveHostVisitorOffline( hostVisitor : Obligation, idCase: number, obligacion: string ) {
      this.databaseComponent = new DatabaseComponent(this.sqlite, this.persistence);
      const hostVisitorData = await this.databaseComponent.selectDataObligacion(idCase, obligacion);
      if (hostVisitorData.length > 0) {
        this.databaseComponent.deleteDataObligacion( idCase, obligacion );
      }

      await this.databaseComponent.insertDataObligacion( hostVisitor, true );
      const justHostVisitorSaved = await this.databaseComponent.selectDataObligacion(idCase, obligacion);
      if (justHostVisitorSaved.length > 0) {
        manageLocalStorageSavedEventRubro();
        await this.insertObligationUpdates( idCase, obligacion );
        this.resourceService.GetResourceValues().then(
          (data) => {
            this.toasterService.PresentToastMessage(data['mobile.generics.SavedOffline']);
            this.router.navigate(['/credits']);
          }
        );
      }
    }
    // Host Visitor
  //

  // obligation updates
    async insertObligationUpdates( idCase: number, obligacion: string ) {
      this.databaseComponent = new DatabaseComponent(this.sqlite, this.persistence);
      const obligationUpdates = await this.databaseComponent.selectDataObligationUpdates(idCase, obligacion);
      if (obligationUpdates.length > 0) {
        this.databaseComponent.deleteDataObligationUpdates( idCase, obligacion );
      }

      this.obligationUpdate.IdCase = idCase;
      this.obligationUpdate.CodigoObligacion = obligacion;
      this.obligationUpdate.obligationUpdate = true;

      await this.databaseComponent.insertDataObligationUpdates( this.obligationUpdate );
    }
  //

  CheckHeading(credit: Credit) {
    switch (Number(credit.tipoRubro)) {
      case Enumerator.HEADING_GROUP_THREE:
        this.resourceService.SetPersistenceValue('Heading', JSON.stringify(credit));
        this.router.navigate(['/infraestructure'], { state : this.tiposDocumento });
        break;
      case Enumerator.HEADING_GROUP_TWO:
        this.resourceService.SetPersistenceValue('Heading', JSON.stringify(credit));
        this.router.navigate(['/implements'], { state : this.tiposDocumento });
        break;
      case Enumerator.HEADING_GROUP_ONE:
        this.resourceService.SetPersistenceValue('Heading', JSON.stringify(credit));
        this.router.navigate(['/productive-unit'], { state : this.tiposDocumento });
        break;
      default:
        this.resourceService.GetResourceValues().then(
          (data) => {
            this.toasterService.PresentToastMessage(data['mobile.generics.InvalidHeading']);
          }
        );
    }
  }

  async showRejectionReason() {
    const modal = await this.modalCtrl.create({
      component: RejectionReasonComponent,
      cssClass: 'my-custom-class-adventure',
      componentProps: {
        credit : this.creditsUser[0]
      }
    })

    return await modal.present();
  }

}

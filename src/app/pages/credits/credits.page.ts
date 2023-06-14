import { Component, OnInit, ViewChild } from '@angular/core';
import { Router } from '@angular/router';
import { SQLite } from '@ionic-native/sqlite/ngx';
import { PersistenceService } from 'angular-persistence';
import { BizagiService } from 'src/app/services/bizagi/bizagi.service';
import { LoadingService } from 'src/app/services/loading/loading.service';
import { ResourceService } from 'src/app/services/resource/resource.service';
import { DatabaseComponent } from 'src/app/shared/components/database/database.component';
import { Credit } from 'src/app/shared/model/credit';
import { HttpResponse } from 'src/app/shared/model/httpresponse';
import { ToasterService } from 'src/app/services/toaster/toaster.service';
import { Notification } from 'src/app/shared/model/Notification';
import { AlertController, IonInfiniteScroll, IonRefresher, ModalController } from '@ionic/angular';
import { CobisService } from 'src/app/services/cobis/cobis.service';
import { IdentidadPersona } from 'src/app/shared/model/IdentidadPersona';
import { MensajeSMS } from 'src/app/shared/model/MensajeSMS';
import { CreditSMS } from 'src/app/shared/model/CreditSMS';
import { ImplementsPage } from '../implements/implements.page';
import { ProductiveUnitPage } from '../productive-unit/productive-unit.page';
import { ActividadPage } from '../actividad/actividad.page';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { ParametroService } from 'src/app/services/Parametro/parametro.service';
import { DateAdapter } from '@angular/material/core';
import { RubroService } from 'src/app/services/rubro/rubro.service';
import { InfraestructurePage } from '../infraestructure/infraestructure.page';
import { Catalogs } from 'src/app/shared/core/constants/catalog.enum';
import { Parametro } from 'src/app/shared/model/parametro';
import { Enumerator } from 'src/app/shared/enum/enumerator.enum';
import { forkJoin } from 'rxjs';
import { UnlockingService } from 'src/app/services/unlocking/unlocking.service';
import { Obligation } from 'src/app/shared/model/Obligation';
import { UtilitiesService } from 'src/app/services/utilities/utilities.service';
import { setRubroDataLoaded, setRubroDataLoadedFalse } from 'src/app/shared/core/helpers';
import { RubroPage } from '../rubro/rubro.page';



@Component({
  selector: 'app-credits',
  templateUrl: './credits.page.html',
  styleUrls: ['./credits.page.scss'],
})
export class CreditsPage implements OnInit {
  @ViewChild(DatabaseComponent) databaseComponent: DatabaseComponent;
  @ViewChild(IonInfiniteScroll) infiniteScroll: IonInfiniteScroll;
  @ViewChild(IonRefresher) refresher: IonRefresher;
  creditsUser: Array<Credit>;
  obligacionesRequiresInternet = false;
  rubroCompleto = false;
  listIdCase = Array<any>();
  mensajeAlerta = '';
  mensajeSinConexion = '';
  celular = '';
  obligacionCredits: string;
  creditsNotification: Array<Credit>;
  implementsPage: ImplementsPage;
  productiveUnitPage: ProductiveUnitPage;
  rubroPage: RubroPage;
  activityPage: ActividadPage;
  infrastructurePage: InfraestructurePage;
  tiposDocumento: Array<Parametro>;
  contadorAux = 0;
  mensajedeconexion = 'Lo sentimos, en este momento no podemos procesar su solicitud. Por favor intente más tarde';
  searchObligaciones: FormGroup;
  typeDocument: string;
  numbreDocument: string;
  dataBaseOffline = new DatabaseComponent(this.sqlite, this.persistenceService);

  //paginator variables
  creditsUserPaged: Array<Credit>;
  creditPageNumber : number;
  initialNumber : number = 0;
  finalNumber : number = 0;
  recordCredits : Array<any>;
  isCreditSearch : boolean = false;
  //

  //commercial variables
  iscommercialUser : boolean = false;
  //

  //hostVisitor variables
  hostVisitorObject : Obligation;
  obligationState : number;
  obligationSentState : number = 2;
  //

  constructor(public resourceService: ResourceService,
              private readonly router: Router,
              private readonly bizagiService: BizagiService,
              private readonly cobis: CobisService,
              private readonly persistenceService: PersistenceService,
              private sqlite: SQLite,
              private readonly persistence: PersistenceService,
              private readonly alertController: AlertController,
              private readonly toasterService: ToasterService,
              private readonly formBuilder: FormBuilder,
              private readonly parametroService: ParametroService,
              private readonly rubroService: RubroService,
              private readonly dateAdapter: DateAdapter<Date>,
              private readonly loadingService: LoadingService,
              private unlockingService : UnlockingService,
              private readonly utilitiesService: UtilitiesService,
              private readonly modalCtrl: ModalController
  ) {
    this.listIdCase = new Array<any>();
    this.creditsNotification = new Array<Credit>();
    this.obligacionCredits = '';
    this.hostVisitorObject = new Obligation;
    this.implementsPage = new ImplementsPage(alertController,
      formBuilder, parametroService, persistenceService,
      resourceService, router, rubroService,
      toasterService, sqlite, loadingService, utilitiesService);
    this.infrastructurePage = new InfraestructurePage(
      resourceService, router, toasterService, formBuilder,
      alertController, parametroService, persistenceService,
      rubroService, dateAdapter, sqlite, loadingService);
    this.productiveUnitPage = new ProductiveUnitPage(alertController,
      formBuilder, parametroService, persistenceService, resourceService, router,
      rubroService, toasterService, sqlite, loadingService, utilitiesService);
    this.activityPage = new ActividadPage(resourceService,
      router, toasterService,
      formBuilder, alertController,
      parametroService, persistenceService,
      persistenceService, sqlite, loadingService);
    this.rubroPage = new RubroPage(resourceService, router, formBuilder, toasterService,
      rubroService, sqlite, persistenceService, parametroService, modalCtrl);
    this.registerForm();
    document.addEventListener('backbutton', () => {
        if (this.router.url === '/productive-unit') {
          this.resourceService.ClearPersistenceKey('ListaActividad');
        }
    });
    this.tiposDocumento = new Array<Parametro>();
  }

  ngOnInit() {
    this.executeParameterFunctions();
    if ( this.persistenceService.get('Online') ) {
      this.unlockingService.UploadPendingChanges();
    }

    this.executeCreditFunctions();

    this.unlockingService.eventUpdate.subscribe(
      async (res: any) => {
        await this.excuteFunctionsWhenSavedEvent()
      }
    )
  }

  ionViewWillEnter() {
    this.obligacionesRequiresInternet = false;
    this.excuteFunctionsWhenSavedEvent();
  }

  async excuteFunctionsWhenSavedEvent() {    
    const eventUpdate = localStorage.getItem('savedEvent');
    if ( eventUpdate && this.persistenceService.get('Online') ) {
      localStorage.removeItem('savedEvent');
      (this.iscommercialUser) ? await this.search() : this.executeCreditFunctions();
    }
  }

  executeParameterFunctions() {
    if (this.resourceService.IsOnline()) {
      this.getPaginatorNumber();
      this.searchParametro();
      this.CheckCatalogs();
      this.getObligacionState();
    } else {
      if (this.resourceService.IsDevice()) {
        this.tipoDocOffline();
        this.getPaginatorNumberOffline();
        this.getObligacionStateOffline();
      }
    }
  }

  executeCreditFunctions() {
    this.creditsUser = [];
    this.recordCredits = [];

    if (this.resourceService.IsOnline()) {
      if (this.resourceService.CheckPersistence('rolUsuarioPC') &&
      this.resourceService.GetPersistenceValue('rolUsuarioPC') ===
      Enumerator.ROL_PROFESIONAL_CONTROL_INVERSION) {
        this.GetCredits();
      }
    } else {
      if (this.resourceService.IsDevice()) {
        if (this.resourceService.CheckPersistence('rolUsuarioPC') &&
        this.resourceService.GetPersistenceValue('rolUsuarioPC') ===
        Enumerator.ROL_PROFESIONAL_CONTROL_INVERSION){
          this.GetCreditsOffline(false, '');
        }
      }
    }
  }

  async tipoDocOffline() {
    this.tiposDocumento = await this.dataBaseOffline.selectDataParametro(Catalogs.TipoDocumento);
  }

  async searchParametro() {
    const tipoDoc = this.parametroService.
    ConsultarParametro(Catalogs.TipoDocumento);

    await forkJoin([tipoDoc]).subscribe(
        (res) => {
          this.tiposDocumento = res[0].resultData;
          this.databaseComponent = new DatabaseComponent(this.sqlite, this.persistenceService);
          this.dataBaseOffline.deleteDataParametro(Catalogs.TipoDocumento);
          for (const tipoDocumento of this.tiposDocumento) {
            this.dataBaseOffline.insertDataParametro(tipoDocumento, Catalogs.TipoDocumento);
          }
      }
    );
  }

  registerForm() {
    this.searchObligaciones = this.formBuilder.group({
      TipoIdentificacion: ['', [Validators.required]],
      NumeroIdentificacion: ['', [Validators.required, Validators.maxLength(12)]]
    });
  }
  expresionRegular(){
    const regular = /[^a-zA-Z0-9ñÑ\d]/i;
    let valor = null;
    valor = this.searchObligaciones.value.NumeroIdentificacion;
    if (valor !== null) {
      valor = valor.substring(0, 12);
      valor = valor.replace(regular, '');
      setTimeout(() => {​​​​​
        this.searchObligaciones.controls.NumeroIdentificacion.setValue(valor);
      }​​​​​, 10);
    }
  }
  updateTipoIdentificacion() {
    this.searchObligaciones.controls.NumeroIdentificacion.reset();
  }
  async search(){
    const tipoidentificacion = this.searchObligaciones.controls.TipoIdentificacion.value;
    const numeroIdentificacion = this.searchObligaciones.controls.NumeroIdentificacion.value;
    this.isCreditSearch = true; //Paginator variable

    if (!this.resourceService.IsOnline()) {
      this.GetCreditsOffline(true, numeroIdentificacion);
    }

    if (this.resourceService.GetPersistenceValue('rolUsuarioAC') ===
    Enumerator.ROL_ASESOR_COMERCIAL) {
      this.iscommercialUser = true; //commercial variable
      if (this.resourceService.IsOnline()) {
        this.searchCredits(tipoidentificacion, numeroIdentificacion);
      }
      else {
        this.GetCreditsOffline(true, numeroIdentificacion);
      }
    }
    if (this.resourceService.GetPersistenceValue('rolUsuarioPC') ===
      Enumerator.ROL_PROFESIONAL_CONTROL_INVERSION) {
        this.numbreDocument = numeroIdentificacion;
        this.typeDocument = tipoidentificacion;
    }
  }

  clean(){
    this.searchObligaciones.controls.TipoIdentificacion.reset();
    this.searchObligaciones.controls.NumeroIdentificacion.reset();
    //Paginator variables
    this.isCreditSearch = false;
    this.finalNumber = this.creditPageNumber;
    this.initialNumber = 0;
    if (this.infiniteScroll) this.infiniteScroll.disabled = false;
    if (this.creditsUser && this.creditsUser.length > 0) this.recordCredits = this.creditsUser.slice(0, this.creditPageNumber);
    //
    this.numbreDocument = '';
    this.typeDocument = '';
    // this.GetCredits();
    if (!this.resourceService.IsOnline()) {
      this.GetCreditsOffline(false, '');
      this.obligacionesRequiresInternet = false;
    }
  }

  searchCredits(typeId: string, id: string) {
    this.bizagiService.searchCredits(id, typeId).subscribe(
      async (res: HttpResponse<Credit>) => {
        if (res.resultData.length === 0) { this.creditsUser = []; this.recordCredits = []; }
        if (res.responseMessage !== null && res.responseMessage !== '') {

          if (res.responseMessage.includes('obligaciones asignadas')) {
            this.toasterService.PresentToastMessage(res.responseMessage);
            this.creditsUser = null;
          }
          this.toasterService.PresentToastMessage(res.responseMessage);
        } else {
          this.resourceService.SetPersistenceValue('credits', JSON.stringify(res.resultData));
          if (this.resourceService.IsDevice()) {
            // Inserta informacion de obligaciones en la tabla obligaciones sqlite
            this.obligacionesRequiresInternet = false;
            res.resultData.forEach(obligacion => {
              obligacion.numeroDocumento = id;
            });
            await this.InsertarObligacionesAsociadas(res.resultData, id, true);
          }
          this.creditsNotification = res.resultData;
          this.FilterCredits(res.resultData);
          if (res.responseMessage != null) {
            if (res.responseMessage.includes('Codigo de Rubro')) {
              this.toasterService.PresentToastMessage(res.responseMessage);
            }
          }
          this.GetCreditsForNotification(res.resultData);
        }
      }
    );
  }

  async GetCredits() {
    this.resourceService.ClearPersistenceKey('ListaActividad');
    const user = this.resourceService.GetUser();
    this.loadingService.loadingPresent();
    if (user !== undefined) {
      this.bizagiService.searchCreditsOther(user.usuario).subscribe(
        async (res: HttpResponse<Credit>) => {
          if (res.responseMessage !== null && res.responseMessage !== '') {
            if (res.responseMessage.includes('obligaciones asignadas')) {
              this.toasterService.PresentToastMessage(res.responseMessage);
            }
            this.toasterService.PresentToastMessage(res.responseMessage);
          }else {
            this.resourceService.SetPersistenceValue('credits', JSON.stringify(res.resultData));
            if (this.resourceService.IsDevice()) {
              // Inserta informacion de obligaciones en la tabla obligaciones sqlite
              this.obligacionesRequiresInternet = false;
              res.resultData.forEach(obligacion => {
                obligacion.numeroDocumento = obligacion.identificacionCliente;
              });
              await this.InsertarObligacionesAsociadas(res.resultData, '', false);
            }
            this.creditsNotification = res.resultData;
            await this.FilterCredits(res.resultData);
            if (res.responseMessage != null) {
              if (res.responseMessage.includes('Codigo de Rubro')) {
                this.toasterService.PresentToastMessage(res.responseMessage);
              }
            }
            this.GetCreditsForNotification(res.resultData);
          }
          this.loadingService.loadingDismiss();
        }
      );
    }
  }

  GetCreditsForNotification(res: any[]) {
    const groups = res.reduce((obj: { [x: string]: any[]; }, item: { idCase: string | number; }) => {
      (obj[item.idCase] = obj[item.idCase] || []).push(item);
      return obj;
    }, {});
    const data = Object.keys(groups).map((key) => {
      return { idCase: key, data: groups[key] };
    });
    this.listIdCase = data;
  }

  async SendNotification(obligacion: number, idCase: number) {
    const alert = await this.alertController.create({
      cssClass: 'contenedor-principal',
      header: 'Confirmación',
      message: '<strong>¿Esta seguro que desea enviar para revisión los formularios cargados?</strong>',
      buttons: [
        {
          text: 'Cancelar',
          role: 'cancel',
          handler: () => {
            this.MostrarMensaje('Valide la información cargada y recuerde enviarla nuevamente');
          },
        },
        {
          text: 'Aceptar',
          handler: () => {
            this.SendNotificationService(obligacion, idCase);
          },
        },
      ],
    });
    await alert.present();
  }

  async SendNotificationService(obligacion: number, idCase: number) {
    const notificacion = new Notification();
    if (this.resourceService.IsOnline()) {
      notificacion.codigoObligacion = `${obligacion}`;
      await this.getHostVisitor(obligacion, idCase);
      this.updateHostVisitor();
      for (let i = 0; i < this.listIdCase.length; i++) {
        if (this.listIdCase[i].data[0].obligacion === obligacion) {
          notificacion.idCase = Number(this.listIdCase[i].idCase);
          const isOfficialUser = this.iscommercialUser ? false : true;
          this.bizagiService.SendNotification(notificacion, isOfficialUser).subscribe(
            async (res) => {
              this.recordCredits = [];
              (this.iscommercialUser) ? await this.search() : await this.GetCredits();
              if (res.responseMessage === null && res.resultData[0] === true) {
                this.mensajeAlerta = 'Notificación enviada exitosamente';
                this.GetDataForNotification(obligacion);
                this.databaseComponent = new DatabaseComponent(this.sqlite, this.persistenceService);
                this.databaseComponent.DeleteDataObligacion(obligacion);
                this.databaseComponent.deleteDataObligationUpdates(idCase, `${obligacion}`);
              } else {
                this.mensajeAlerta = res.responseMessage.substring(0, res.responseMessage.length - 2);
              }
              for (let i = 0; i < this.creditsNotification.length; i++) {
                this.obligacionCredits = this.creditsNotification[i].obligacion;
                if (Number(this.obligacionCredits) === obligacion) {
                  this.creditsNotification[i].mensajeValidacionNotificacion = this.mensajeAlerta;
                }
              }
              this.FilterCredits(this.creditsNotification);
            }
          );
        }
      }
    } else {
      this.MostrarMensaje('Señor usuario recuerde que para el envió de su autogestión, debe estar conectado a internet');
    }
  }

  async getHostVisitor( obligacion: any, idCase: number ) {
    const request = this.rubroService.ConsultarHostVisitor(idCase, obligacion);
    return new Promise((resolve) => {
      request.subscribe((res) => {
        if (res.resultData.length > 0) {
          const { id, nombreCompleto, tipoIdentificacion, numeroIdentificacion, celular } = res.resultData[0];
          
          this.hostVisitorObject.id = id;
          this.hostVisitorObject.idCase = idCase;
          this.hostVisitorObject.nombreCompleto = nombreCompleto;
          this.hostVisitorObject.codigoObligacion = obligacion;
          this.hostVisitorObject.tipoIdentificacion = Number(tipoIdentificacion);
          this.hostVisitorObject.numeroIdentificacion = numeroIdentificacion;
          this.hostVisitorObject.estado = this.obligationState;
          this.hostVisitorObject.celular = celular;

          resolve(this.hostVisitorObject);
        }
      })
    })
  }

  updateHostVisitor() {
    this.rubroService.InsertarHostVisitor(this.hostVisitorObject).subscribe(
      (res) => {},
      (err) => {throw err})
  }

  // Estado obligacion
  async getObligacionState() {
    const response = this.parametroService.ConsultarParametro(Catalogs.ObligacionState);
    response.subscribe((res) => {
      const { resultData } = res;
      
      this.obligationState = Number(resultData[1].codigo) === this.obligationSentState ?
      Number(resultData[1].codigo) : this.obligationSentState;
      this.databaseComponent = new DatabaseComponent(this.sqlite, this.persistence);
      this.databaseComponent.deleteDataParametro(Catalogs.ObligacionState);
      this.databaseComponent.insertDataParametro(resultData[1], Catalogs.ObligacionState);
    },
    (err) => console.log(err))
  }

  async getObligacionStateOffline() {
    this.databaseComponent = new DatabaseComponent(this.sqlite, this.persistence);
    const data = await this.databaseComponent.selectDataParametro(Catalogs.ObligacionState);
    this.obligationState = Number(data[1]?.codigo) === this.obligationSentState ?
    Number(data[1]?.codigo) : this.obligationSentState;
  }
  //

  SendNotificationSMS(celular: string, obligacion: any) {
    const datosNotificacion = new MensajeSMS();
    const datosCredit = new CreditSMS();
    datosNotificacion.valDestinatario = celular;
    datosNotificacion.valTexto = 'Banco Agrario informa que los soportes de su inversión fueron remitidos con éxito y la información será validada.';
    datosCredit.mensajeSMS = datosNotificacion;
    this.bizagiService.SendNotificationSMS(datosCredit).subscribe(
      (res) => {
        if (res.resultData[0] === false) {
          for (let i = 0; i < this.creditsNotification.length; i++) {
            this.obligacionCredits = this.creditsNotification[i].obligacion;
            if (Number(this.obligacionCredits) === Number(obligacion)) {
              this.creditsNotification[i].mensajeValidacionNotificacion = 'Se ha producido un error con el envío de los soportes de su inversión, por favor intente más tarde';
            }
          }
          this.FilterCredits(this.creditsNotification);
          this.GetCredits();
        }
        else{
          this.GetCredits();
        }
      }
    );

  }

  GetDataForNotification(obligacion: number) {
    const identidadPersona = new IdentidadPersona();
    const user = this.resourceService.GetUser();
    identidadPersona.valIdentidadPersona = user.usuario;
    identidadPersona.codTipoIdentidadPersona = user.tipoIdentificacion;
    this.persistence.set('mostrarAutorizaciones', false);
    this.cobis.ConsultarClienteCobis(identidadPersona).subscribe(
      res => {
        this.persistence.set('sinRespuestaServicio', false);
        if (res.resultData) {
          this.SendNotificationSMS(res.resultData[0].celular, obligacion);
        }
      }
    );
  }

  async MostrarMensaje(mensaje: string) {
    const alert = await this.alertController.create({
      cssClass: 'contenedor',
      header: 'Información',
      message: '<strong>' + mensaje + '</strong>',
      buttons: [
        {
          text: 'Aceptar',
          handler: () => {
          },
        },
      ],
    });
    await alert.present();
  }

  async FilterCredits(items: Array<Credit>) {
    this.databaseComponent = new DatabaseComponent(this.sqlite, this.persistence);   
    this.loadingService.loadingPresent();
    const lookup = {};
    const result = [];
    const ruros = [];

    //Paginator variables
    this.finalNumber = this.creditPageNumber;
    this.initialNumber = 0;
    if (this.infiniteScroll) this.infiniteScroll.disabled = false;
    if (this.iscommercialUser) this.recordCredits = [];
    //

    for (let item: Credit, i = 0; item = items[i++];) {
      const obj = new Credit();
      
      const name = item.obligacion;
      const rubroCompleto = item.rubroCompleto;
      if (!(name in lookup)) {
        lookup[name] = 1;
        obj.obligacion = name;
        obj.fechaLimiteAutogestion = item.fechaLimiteAutogestion;
        obj.fechaDesembolso = item.fechaDesembolso;
        obj.descripcionRubro = item.descripcionRubro;
        obj.mensajeValidacionNotificacion = item.mensajeValidacionNotificacion;
        obj.identificacionCliente = item.identificacionCliente;
        obj.tipoDocumento = item.tipoDocumento;
        obj.numeroDocumento = item.numeroDocumento;
        obj.fechaRechazo = item.fechaRechazo;
        obj.usuarioRechazo = item.usuarioRechazo;

        (rubroCompleto) ? obj.rubroCompleto = true : obj.rubroCompleto = false;
        
        if (item.idCase) {
          obj.idCase = item.idCase;
        }

        (item.usuarioRechazo && item.fechaRechazo && this.resourceService.IsOnline()) ? obj.state = 'Rechazado' : obj.state = '';
        const obligationUpdates = await this.databaseComponent.selectDataObligationUpdates(obj.idCase, obj.obligacion);
        if (obligationUpdates.length > 0) {
          obj.obligationUpdate = true;
        }
        result.push(obj);
      }
    }
    
    this.creditsUser = result.sort(this.orderObligationList);
    this.recordCredits = result.slice(0, this.creditPageNumber); //Paginator variable
    //Refresh variable
    if (this.refresher && this.recordCredits.length > 0) { this.refresher.complete(); }
    //
    this.loadingService.loadingDismiss();
  }

  orderObligationList( a : Credit, b : Credit ) {
    if (a.state > b.state) return -1;
    if (a.state < b.state) return 1;
    if (a.fechaLimiteAutogestion < b.fechaLimiteAutogestion) return -1;
    if (a.fechaLimiteAutogestion > b.fechaLimiteAutogestion) return 1;
    if (a.rubroCompleto.toString() > b.rubroCompleto.toString()) return -1;
    if (a.rubroCompleto.toString() < b.rubroCompleto.toString()) return 1;
    return 0;
  }

  //refresh function
  async doRefreshCredits( event: any ) {
    if (this.refresher) {
      this.executeParameterFunctions();
      this.executeCreditFunctions();
    }
  }
  //

  //Paginator functions
  async getPaginatorNumberOffline() {
    const data = await this.dataBaseOffline.selectDataParametro(Catalogs.Paginator);
    this.creditPageNumber = Number(data[0].valor);
  }

  async getPaginatorNumber() {
    const response = this.parametroService.ConsultarParametro(Catalogs.Paginator);
    response.subscribe((res) => {
      const { resultData } = res;
      this.creditPageNumber = Number(resultData[0].valor);
      this.databaseComponent = new DatabaseComponent(this.sqlite, this.persistenceService);
      this.dataBaseOffline.deleteDataParametro(Catalogs.Paginator);
      this.dataBaseOffline.insertDataParametro(resultData[0], Catalogs.Paginator);
    },
    (err) => console.log(err))
  }

  loadCreditsPaged(event: any) {
    if (this.infiniteScroll) {
      if (this.recordCredits.length !== this.creditsUser.length) {
        this.finalNumber += this.creditPageNumber;
        this.initialNumber += this.creditPageNumber;
        setTimeout(() => {        
          this.creditsUserPaged = this.creditsUser.slice(this.initialNumber, this.finalNumber);
          this.recordCredits.push(...this.creditsUserPaged);
          this.creditsUserPaged = [];
          this.infiniteScroll.complete();
        }, 2000);
      } else {
        this.infiniteScroll.complete();
        this.infiniteScroll.disabled = true;
      }
    }
  }
  //

  CheckHeading(credit: Credit) {
    this.resourceService.SetPersistenceValue('obligacion', credit.obligacion);
    // if (!credit.state || credit.state === '') {
    //   setRubroDataLoadedFalse();
    // } else {
    //   setRubroDataLoaded();
    // }
    this.router.navigate(['/rubro'], { state : this.tiposDocumento });
  }

  home() {
    this.router.navigate(['/home']);
  }

  async InsertarObligacionesAsociadas(obligaciones: Credit[], numDoc: string, filtro: boolean) {
    this.loadingService.loadingPresent();
    const login = JSON.parse(this.persistenceService.get('user'));
    this.databaseComponent = new DatabaseComponent(this.sqlite, this.persistenceService);

    if (filtro) {
      // Datos almacenados de obligaciones
      const datosDoc = await this.databaseComponent.selectDataObligacionesNumDocumento(numDoc);
      if (datosDoc.length > 0) {
        // Borrar obligaciones
        this.databaseComponent.deleteDataObligaciones(login.usuario);
      }
    }else {
      // Borrar obligaciones
      this.databaseComponent.deleteDataObligaciones(login.usuario);
    }

    // Insertar obligaciones
    for (const obligacion of obligaciones) {
      await this.databaseComponent.insertDataObligaciones(login.usuario, obligacion);
    }
    // Datos almacenados de obligaciones
    const datos = await this.databaseComponent.selectDataObligaciones(login.usuario);
    this.loadingService.loadingDismiss();
  }

  async GetCreditsOffline(filtro: boolean, documento: string) {
    if (this.persistence.get('user') !== undefined) {
      const login = this.persistence.get('user');
      // Obtiene las obligaciones del usuario
      let obligacion: any[];
      this.databaseComponent = new DatabaseComponent(this.sqlite, this.persistenceService);
      if ( typeof login === 'string'){
        if (filtro) {
          obligacion =  await this.databaseComponent.selectDataObligacionesNumDocumento(documento);
        } else {
          obligacion = await this.databaseComponent.selectDataObligaciones(JSON.parse(login).usuario);
        }
      } else {
        if (filtro) {
          obligacion = await this.databaseComponent.selectDataObligacionesNumDocumento(documento);
        } else {
          obligacion = await this.databaseComponent.selectDataObligaciones(login.usuario);
        }
      }
      
      this.FilterCredits(obligacion);
      setTimeout(() => {
        if (this.creditsUser.length === 0) {
          this.obligacionesRequiresInternet = true;
        } else {
          this.obligacionesRequiresInternet = false;
        }
      }, 1000);

      this.resourceService.SetPersistenceValue('credits', JSON.stringify(obligacion));
    }
  }

  async CheckCatalogs() {
    await this.infrastructurePage.GetCatalogs();
    await this.implementsPage.catalogosCantidadFotos();
    await this.productiveUnitPage.consultarParametroActividad();
    await this.productiveUnitPage.catalogosCantidadFotos();
    await this.activityPage.ConsultarCatalogos();
  }

  // reject obligation
  async updateObligationRejected( credit: Credit ) {
    if (this.resourceService.IsOnline()) {
      this.resourceService.SetPersistenceValue('obligacion', credit.obligacion);
      this.uploadRubrosData();
    } else {
      if (this.resourceService.IsDevice()) {
        this.showObligationRejectedOfflineMessage();
      }
    }
  }

  uploadRubrosData() {
    let rubros = [];
    const test1 = this.resourceService.CheckPersistence('obligacion');
    const test2 = this.resourceService.CheckPersistence('credits');
    
    if ( test1 && test2 ) {
      const obligacion = this.resourceService.GetPersistenceValue('obligacion');
      const credits = JSON.parse(this.resourceService.GetPersistenceValue('credits'));
      rubros = credits.filter((f: { obligacion: any; }) => f.obligacion === obligacion);
      this.rubroTypeToRun( rubros, obligacion );
      this.rubroPage.executeOnlineOrOfflineFunctions();
    }
  }

  rubroTypeToRun(rubros : Array<Credit>, obligation: string ) {
    rubros.forEach((rubro) => {
      switch (rubro.tipoRubro) {
        case '1':
        this.resourceService.SetPersistenceValue('Heading', JSON.stringify(rubro));
        this.productiveUnitPage.executeFunctions();
        break;

        case '2':
        setTimeout(() => {
          this.resourceService.SetPersistenceValue('Heading', JSON.stringify(rubro));
          this.implementsPage.executeFunctions();
        }, 500);
        break;

        case '3':
        setTimeout(() => {
          this.resourceService.SetPersistenceValue('Heading', JSON.stringify(rubro));
          this.infrastructurePage.executeFunctions();
        }, 1000);
        break;
      
        default:
        break;
      }
    })

    this.hideUpdateButton( obligation );
  }

  async showObligationRejectedOfflineMessage() {
    const alert = await this.alertController.create({
      cssClass: 'contenedor-principal',
      header: 'Confirmación',
      message: '<strong>Debe cargar los datos de esta obligación devuelta cuando tenga señal de datos para poder acceder a ella</strong>',
      buttons: [
        {
          text: 'Aceptar',
          handler: () => {},
        },
      ],
    });
    await alert.present();
  }

  hideUpdateButton( obligation : string ) {
    document.getElementById(obligation).remove(); 
  }
  //
}

import { Component, OnInit, ViewChild } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { ResourceService } from 'src/app/services/resource/resource.service';
import { ToasterService } from 'src/app/services/toaster/toaster.service';
import { AlertController } from '@ionic/angular';
import { Credit } from 'src/app/shared/model/credit';
import { Thumbnail } from 'src/app/shared/model/thumbnail';
import { Support } from 'src/app/shared/model/support';
import { ParametroService } from 'src/app/services/Parametro/parametro.service';
import { Parametro } from 'src/app/shared/model/parametro';
import { Catalogs } from 'src/app/shared/core/constants/catalog.enum';
import { Enumerator } from 'src/app/shared/enum/enumerator.enum';
import { VerificationDigitComponent } from 'src/app/shared/components/verification-digit/verification-digit.component';
import { RubroActividad } from 'src/app/shared/model/rubroActividad';
import { MetaDataFoto } from 'src/app/shared/model/metadataFoto';
import { RubroCapitalTrabajo } from 'src/app/shared/model/rubroCapitalTrabajo';
import { RubroEntity } from 'src/app/shared/model/rubroEntity';
import { AuxiliarEditaActividad } from 'src/app/shared/model/auxiliarEditaActividad';
import { Photo } from 'src/app/shared/model/Photo';
import { environment } from 'src/environments/environment';
import { forkJoin } from 'rxjs';
import { PersistenceService } from 'angular-persistence';
import { DatabaseComponent } from 'src/app/shared/components/database/database.component';
import { SQLite } from '@ionic-native/sqlite/ngx';
import { EntidadParametroAux } from 'src/app/shared/model/EntidadParametroAux';
import { Guid } from 'guid-typescript';
import { LoadingService } from 'src/app/services/loading/loading.service';
import { RubroDataLoaded } from 'src/app/shared/core/helpers';

@Component({
  selector: 'app-actividad',
  templateUrl: './actividad.page.html',
  styleUrls: ['./actividad.page.scss'],
})
export class ActividadPage implements OnInit {
  @ViewChild(VerificationDigitComponent) verificationDigitComponent: VerificationDigitComponent;
  @ViewChild(DatabaseComponent) databaseComponent: DatabaseComponent;
  credit: Credit;
  activityFormGroup: FormGroup;
  tiposSoportes: Array<Array<Thumbnail>>;
  supportTypeList: Array<Support>;
  supportTypeListAux: Array<MetaDataFoto>;
  executedCostMaxValue: any;
  mensajeboton: false;
  sizesMaxValue: number;
  sizesMinValue: number;
  mensajeAlertaFormulario = false;
  Actividad: Array<Parametro>;
  rubroCapitaltrabajo: RubroCapitalTrabajo;
  rubroCabeza: RubroEntity;
  rubroActividad: RubroActividad;
  listaFotos: Array<MetaDataFoto>;
  listaActividad: Array<RubroActividad>;
  foto: MetaDataFoto;
  heading: any;
  image: string;
  parametroMaximoActividad: Parametro;
  // diabledbuttonActividad = false;
  rubroEdita: RubroActividad;
  auxiliarEditaActividad = new AuxiliarEditaActividad();
  minPhotosSoportesInversion: number;
  maxPhotosSoportesInversion: number;
  minSizePhotosParm: number;
  maxSizePhotosParm: number;
  cantidadMinimaFotos = false;
  formularioValido = false;
  formularioValidoSelect = true;
  dataBaseOffline = new DatabaseComponent(this.sqlite, this.persistence);
  fotoEliminada = false;
  executedCostMaxError = false;
  cantidadTipoActividadError = false;
  decimalValueError : boolean = false;
  executedCostMaxLength : number = 16;

  constructor(
    private readonly resourceService: ResourceService,
    private readonly router: Router,
    private readonly toasterService: ToasterService,
    private readonly formBuilder: FormBuilder,
    private readonly alertController: AlertController,
    private readonly parametroService: ParametroService,
    private readonly persistence: PersistenceService,
    private readonly persistenceService: PersistenceService,
    private readonly sqlite: SQLite,
    private readonly loadingService: LoadingService
  ) {
    this.rubroCabeza = new RubroEntity();
    this.rubroActividad = new RubroActividad();
    this.listaFotos = new Array<MetaDataFoto>();
    this.foto = new MetaDataFoto();
    this.rubroCapitaltrabajo = new RubroCapitalTrabajo();
    this.parametroMaximoActividad = new Parametro();
    this.rubroEdita = new RubroActividad();
  }

  ngOnInit() {
    this.GetHeading();
    this.InitializeForm();
  }

  async ionViewWillEnter() {
    this.listaActividad = new Array<RubroActividad>();
    this.GetHeading();
    this.InitializeForm();
    this.InitializeInfrastructureSupportType();

    if (this.resourceService.IsOnline()) {
      this.ConsultarTipoActividad()
      await this.ConsultarCatalogos();
    } else {
      if (this.resourceService.IsDevice()) {
        this.ConsultarParametroOffline();
        this.getMaximoActividadPorTipoOffline();
        this.catalogosCantidadFotosOffline();
      }
    }
  }

  InitializeForm() {
    this.activityFormGroup = this.formBuilder.group({
      executedCost: [, [Validators.required, Validators.min(0)]],
      Actividad: [, [Validators.required]]
    });
  }

  GetHeading() {
    // Invalid Heading
    if (!this.resourceService.CheckPersistence('Heading')) {
      this.resourceService.GetResourceValues().then((data) => {
        this.toasterService.PresentToastMessage(
          data['mobile.generics.InvalidHeading']
        );
      });
      this.router.navigate(['/actividad']);
    } else {
      this.credit = JSON.parse(
        this.resourceService.GetPersistenceValue('Heading')
      );
    }
  }

  InitializeInfrastructureSupportType() {
    this.supportTypeList = [
      {
        description: 'Soportes Inversión',
        minPictures: this.minPhotosSoportesInversion,
        maxPictures: this.maxPhotosSoportesInversion,
        maxSizeHeight: 1080,
        maxSizeWidth: 1920,
        maxWeight: this.maxSizePhotosParm,
        minWeight: this.minSizePhotosParm,
        requireMetaData: false,
        thumbnails: [],
      }
    ];
    this.supportTypeListAux = [];
  }

  async HandleMedia(event: Thumbnail, index: number) {
     // Validamos el formato de la imagen JPG
    if (await this.ValidarformatoImagen(event.src)) {
      if (await this.CheckImageSize(event.src, index)) {
        this.supportTypeList[index].thumbnails.push({
          id: event.id,
          src: event.src,
          photoBase64: event.photoBase64,
          metadata: event.metadata
        });
      }
    }


    if (this.supportTypeList[0].thumbnails.length >= this.minPhotosSoportesInversion) {
      this.cantidadMinimaFotos = true;
    } else {
      this.cantidadMinimaFotos = false;
    }
  }

  ConsultarParametro() {
    this.parametroService
      .ConsultarParametro(Catalogs.ActividadInversion)
      .subscribe(
        async (res) => {
          this.Actividad = res.resultData;
          // Se inserta esta informacion en tablas locales
          if (this.resourceService.IsDevice()) {
            this.databaseComponent = new DatabaseComponent(this.sqlite, this.persistenceService);
            await this.dataBaseOffline.deleteDataParametro(Catalogs.ActividadInversion);
            for (const parametro of this.Actividad) {
              this.dataBaseOffline.insertDataParametro(parametro, Catalogs.ActividadInversion);
            }
            const datos = await this.dataBaseOffline.selectDataParametro(Catalogs.ActividadInversion);
          }
        },
        (err) => { }
      );
  }

  async DeleteMedia(x: number, y: number) {
    const alert = await this.alertController.create({
      cssClass: 'contenedor-principal',
      header: 'Confirmación',
      message: '<strong>¿Está seguro que desea eliminar esta foto? </strong>' +
              '<p class="alertmsg">RECUERDE QUE LOS CAMBIOS SOLO SE APLICARÁN UNA VEZ DE CLICK EN EL BOTÓN GUARDAR DE ESTE FORMULARIO</p>',
      buttons: [
        {
          text: 'Cancelar',
          role: 'cancel',
          handler: () => { },
        },
        {
          text: 'Aceptar',
          handler: () => {
            var o = this.supportTypeList[x].thumbnails[y].metadata;
            this.supportTypeList[x].thumbnails.splice(y, 1);
            if(o !== undefined && o != null)
            {
              o.id = -1;
              o.tipo = 0;
              this.supportTypeListAux.push(o);
            }

            if (this.supportTypeList[0].thumbnails.length === 0) {
               this.cantidadMinimaFotos = false;
            }
            this.ExecutedCostChange( true );
          },
        },
      ],
    });
    await alert.present();
  }

  accion(v) {
    this.mensajeboton = v;
  }

  ExecutedCostChange( photoDeleted? : boolean ) {
    this.verificationDigitComponent = new VerificationDigitComponent();
    this.activityFormGroup.controls.executedCost.setValue(
      this.verificationDigitComponent.InputChange(
        this.activityFormGroup.controls.executedCost.value));
        this.CheckExecutedCostValue();

    (!photoDeleted && this.activityFormGroup.controls.executedCost.value.includes(',') || this.activityFormGroup.controls.executedCost.value.includes('.'))
    ? this.decimalValueError = true : this.decimalValueError = false;

    this.checkExecutedCostLength();
  }

  ExecutedCostBlur() {
    this.CheckExecutedCostValue();
    this.verificationDigitComponent = new VerificationDigitComponent();
      this.activityFormGroup.controls.executedCost.setValue(
        this.verificationDigitComponent.InputBlur(
          this.activityFormGroup.controls.executedCost.value));
    if (this.activityFormGroup.controls.executedCost.value !== '' &&
      this.activityFormGroup.controls.executedCost.value !== null &&
      this.activityFormGroup.controls['executedCost'].valid) {
      this.formularioValido = true;
    } else {
      this.formularioValido = false;
    }

    const decimalExecutedCost = `${this.activityFormGroup.controls.executedCost.value.charAt(0)}${this.activityFormGroup.controls.executedCost.value.charAt(1)}`;
    const afterDecimal = `${this.activityFormGroup.controls.executedCost.value.charAt(2)}`;
    setTimeout(() => {
      (decimalExecutedCost === '$0' && afterDecimal !== '') ? this.decimalValueError = true : this.decimalValueError = false;
    }, 10);

    this.checkExecutedCostLength();
  }

  checkExecutedCostLength() {
    (!this.executedCostMaxError && this.activityFormGroup.controls.executedCost?.value.length > 16)
    ? this.executedCostMaxLength = this.activityFormGroup.controls.executedCost.value.length
    : this.executedCostMaxLength = 16;
  }

  ExecutedCostFocus() {
    this.verificationDigitComponent = new VerificationDigitComponent();
    this.activityFormGroup.controls.executedCost.setValue(
      this.verificationDigitComponent.InputFocus(
        this.activityFormGroup.controls.executedCost.value));
        this.CheckExecutedCostValue();
  }

  async Save() {
    /* Obtenemos actividad para guardar */
    await this.obtenerActividad();
    this.router.navigate(['/productive-unit']);
  }

  Cancel() {
    this.router.navigate(['/productive-unit']);
  }

  async obtenerActividad() {
    this.verificationDigitComponent = new VerificationDigitComponent();
    const rubroActividad = new RubroActividad();
    rubroActividad.costoEjecutado = Number(this.verificationDigitComponent.InputFocus(
      this.activityFormGroup.controls.executedCost.value));
    rubroActividad.idRubro = 0;
    rubroActividad.idActividad = this.activityFormGroup.controls.Actividad.value;
    rubroActividad.listaMetaDataFoto = await this.GetMediaForm();

    if (this.auxiliarEditaActividad.estado) {
      /* Agregamos la actividad a la lista de actividades */
      this.listaActividad.push(rubroActividad);
    } else {
      this.listaActividad[this.auxiliarEditaActividad.indiceEdita].costoEjecutado =
        rubroActividad.costoEjecutado;
      this.listaActividad[this.auxiliarEditaActividad.indiceEdita].idActividad =
        rubroActividad.idActividad;
      this.listaActividad[this.auxiliarEditaActividad.indiceEdita].listaMetaDataFoto =
        await this.GetMediaForm();
    }

    /* componente padre con el compontene hijo y mostrar la
    nueva actividad en formulario de productive-unit */
    this.resourceService.SetPersistenceValue('ListaActividad', JSON.stringify(this.listaActividad));
  }

  async ValidarChecPersitence() {
    if (this.resourceService.CheckPersistence('ListaActividad')) {
      this.listaActividad = JSON.parse(this.resourceService.GetPersistenceValue('ListaActividad'));
    }

    if (this.resourceService.CheckPersistence('RegisterOrUpdate')) {
      this.auxiliarEditaActividad = JSON.parse(this.resourceService.GetPersistenceValue('RegisterOrUpdate'));

      if (this.auxiliarEditaActividad.estado === false) {
        /*Validamos edicion de actividad*/
        if (this.resourceService.CheckPersistence('ActividadEdita')) {
          this.rubroEdita = JSON.parse(this.resourceService.GetPersistenceValue('ActividadEdita'));
          this.verificationDigitComponent = new VerificationDigitComponent();
          this.activityFormGroup.controls.executedCost.setValue(
            this.verificationDigitComponent.InputBlur(this.rubroEdita.costoEjecutado)
          );

          const isActiveActivity = this.Actividad.find(({ id }) => id == Number(this.rubroEdita.idActividad));

          if (isActiveActivity) {
            this.activityFormGroup.controls.Actividad.setValue(this.rubroEdita.idActividad.toString());
            this.activityFormGroup.controls.Actividad.updateValueAndValidity();
          }

          if (this.activityFormGroup.controls.Actividad.value !== null) {
            this.formularioValidoSelect = true;
          } else {
            this.formularioValidoSelect = false;
          }

          if (this.activityFormGroup.controls.executedCost.value !== '' &&
            this.activityFormGroup.controls.executedCost.value !== null) {
            this.formularioValido = true;
          } else {
            this.formularioValido = false;
          }

          let photos;
          photos = [];
          photos.push(this.rubroEdita.listaMetaDataFoto);
          this.FillPhotos(photos);
        }
      }
    }

    if (this.loadingService.isLoading){
      this.loadingService.loadingDismiss();
    }
  }

  async getMaximoActividadPorTipo() {
    await this.parametroService.ConsultarParametro(Enumerator.MAX_ACTIVIDAD_POR_TIPO)
      .toPromise(
      ).then(
        async (res) => {
          this.parametroMaximoActividad = res.resultData[0];
          // Se guarda esta informacion en tablas locales
          if (this.resourceService.IsDevice()) {
            this.databaseComponent = new DatabaseComponent(this.sqlite, this.persistenceService);
            await this.dataBaseOffline.deleteDataParametro(Enumerator.MAX_ACTIVIDAD_POR_TIPO);
            this.dataBaseOffline.insertDataParametro
              (this.parametroMaximoActividad, Enumerator.MAX_ACTIVIDAD_POR_TIPO);
            const datos = await this.dataBaseOffline.selectDataParametro(Enumerator.MAX_ACTIVIDAD_POR_TIPO);
          }
        }
      );
  }

  validarCantidadDeActividades(event: any) {  
    const maximoPorActividad = this.parametroMaximoActividad.valor;
    const actividadSel = event;
    const agregaActividad = JSON.parse(this.resourceService.GetPersistenceValue('RegisterOrUpdate')).estado;
    let actividadModificar = null;

    if (!agregaActividad){
      actividadModificar = JSON.parse(this.resourceService.GetPersistenceValue('ActividadEdita'));
    }

    let totalPorActividad = 0;
    
    this.listaActividad.forEach(actividad => {
      if (Number(actividad.idActividad) === Number(actividadSel) && actividad.id >= 0) {
        totalPorActividad = totalPorActividad + 1;
      }
    });    

    if (maximoPorActividad) {
      if (Number(totalPorActividad) >= Number(maximoPorActividad)
        && agregaActividad) {
        this.mostrarMensajeAlertaActividadMaximaPorTipo();
        this.activityFormGroup.controls.Actividad.reset();
        this.cantidadTipoActividadError = true;
      }
      else if (Number(totalPorActividad) >= Number(maximoPorActividad)
      && !agregaActividad && Number(actividadModificar.idActividad) !== Number(actividadSel)){
        this.mostrarMensajeAlertaActividadMaximaPorTipo();
        this.activityFormGroup.controls.Actividad.reset();
        this.cantidadTipoActividadError = true;
      }
      else {
        this.cantidadTipoActividadError = false;
      }
    }

    if (this.activityFormGroup.controls.Actividad.value !== null) {
      this.formularioValidoSelect = true;
    } else {
      this.formularioValidoSelect = false;
    }
  }

  async mostrarMensajeAlertaActividadMaximaPorTipo() {
    const alert = await this.alertController.create({
      cssClass: 'contenedor-principal',
      header: 'Información',
      message: '<strong>Por cada uno de los tipos de inversión, se podrá agregar máximo ' +
        this.parametroMaximoActividad.valor.toString() + '</strong>',
      buttons: [
        {
          text: 'Aceptar'
        }
      ]
    });
    await alert.present();
  }

  async GetMediaForm(): Promise<Array<MetaDataFoto>> {
    const mediaList: Array<MetaDataFoto> = [];

    for (const support of this.supportTypeList[0].thumbnails) {
      const nombre = await this.UploadMedia(support);
      // Si es una insercion id=0, caso contrario su respectivo valor
      if (support.id === undefined || support.id === null) {
        support.id = 0;
      }

      if (typeof (support.metadata) === 'undefined') {
        support.metadata = {
          altitud: '',
          fechaHora: new Date().toISOString(),
          nombreArchivo: '',
          ubicacion: '',
          base64: support.photoBase64,
          lugar: '',
          id: 0,
          tipo: 0
        };
      }
      //rejection functionality
      // if (RubroDataLoaded()) {
      //   support.metadata.id = 0;
      // }
      //

      support.metadata.nombreArchivo = nombre;
      support.metadata.tipo = Enumerator.ID_SUPPORTS_BILLS_PHOTO;
      mediaList.push(support.metadata);
    }
    for (var support of this.supportTypeListAux) {
      mediaList.push(support);
    }
    return mediaList;
  }

  async UploadMedia(media: Thumbnail, nombreArchivo = null) {
    // Guid enviado localmente
    const photo = new Photo();
    if (nombreArchivo !== null && nombreArchivo !== undefined) {
      const indice = nombreArchivo.indexOf('.jpeg');
      if (indice != 0) {
        photo.guid = nombreArchivo.substring(0, indice);
      }
      else{
        photo.guid = Guid.create().toString();
      }
    } else {
      photo.guid = Guid.create().toString();
    }
    photo.photoBase64 = media.photoBase64;
    /*if (this.Online) {
      await this.homeService.SubirFoto(photo).toPromise().then(
        (res: HttpResponse<string>) => {
        }
      );
    }*/
    return photo.guid + '.jpeg';
  }

  FillPhotos(media) {
    if (media[0] !== null)
    {
      for (const photo of media[0]) {
        const thumbnail: Thumbnail = {
          id: photo.id,
          metadata: photo,
          photoBase64: photo.base64,
          src: `${environment.urlStorage.url}${photo.nombreArchivo}`
        };
        if (thumbnail.metadata.id >= 0) {
          this.supportTypeList[0].thumbnails.push(thumbnail);
        }
        else {
          // Asignamos fotos eliminadas para que no las muetre y las tenga en cuenta al eliminar
          this.supportTypeListAux.push(thumbnail.metadata);
        }
      }
      const arregloEliminadas = media.filter(m => m.tipo === 0);
      for (const photo of arregloEliminadas) {
        this.supportTypeListAux.push(photo);
      }
    }

    if (this.supportTypeList[0].thumbnails.length >= this.minPhotosSoportesInversion) {
      this.cantidadMinimaFotos = true;
    } else {
      this.cantidadMinimaFotos = false;
    }
    this.ExecutedCostBlur();
  }

  replaceBase64(listaMetaDataFoto) {
    for (const elementMetaDataFoto of listaMetaDataFoto) {
      elementMetaDataFoto.base64 = '';
    }
    return listaMetaDataFoto;
  }

  async ConsultarCatalogos() {
    this.InitializeInfrastructureSupportType();
    // metodos incroporados
    const maxActividadTipo = this.parametroService.
    ConsultarParametro(Enumerator.MAX_ACTIVIDAD_POR_TIPO);
    const minPhotosSoportesInversion = this.parametroService.
      ConsultarParametro(Enumerator.MIN_PHOTOS_CAPITAL_INVESTMENT_SUPPORT);
    const maxPhotosSoportesInversion = this.parametroService.
      ConsultarParametro(Enumerator.MAX_PHOTOS_CAPITAL_INVESTMENT_SUPPORT);
    const minSizePhotosParm = this.parametroService.
      ConsultarParametro(Enumerator.MIN_SIZE_PHOTOS_CAPITAL);
    const maxSizePhotosParm = this.parametroService.
      ConsultarParametro(Enumerator.MAX_SIZE_PHOTOS_CAPITAL);
    const executedCostParm = this.parametroService.
      ConsultarParametro(Enumerator.CAPITAL_EXECUTED_COST);



    await forkJoin([minPhotosSoportesInversion, maxPhotosSoportesInversion, minSizePhotosParm,
      maxSizePhotosParm, executedCostParm, maxActividadTipo]).subscribe(
        (res) => {
          this.minPhotosSoportesInversion = Number(res[0]?.resultData[0].valor);
          this.dataBaseOffline.insertDataParametro(res[0].resultData[0],
             Enumerator.MIN_PHOTOS_CAPITAL_INVESTMENT_SUPPORT);
          this.maxPhotosSoportesInversion = Number(res[1]?.resultData[0].valor);
          this.dataBaseOffline.insertDataParametro(res[1].resultData[0],
             Enumerator.MAX_PHOTOS_CAPITAL_INVESTMENT_SUPPORT);
          this.minSizePhotosParm = Number(res[2]?.resultData[0].valor);
          this.dataBaseOffline.insertDataParametro(res[2].resultData[0], Enumerator.MIN_SIZE_PHOTOS_CAPITAL);
          this.maxSizePhotosParm = Number(res[3]?.resultData[0].valor);
          this.dataBaseOffline.insertDataParametro(res[3].resultData[0], Enumerator.MAX_SIZE_PHOTOS_CAPITAL);
          this.executedCostMaxValue = Number(res[4]?.resultData[0].valor);
          this.dataBaseOffline.insertDataParametro(res[4].resultData[0], Enumerator.CAPITAL_EXECUTED_COST);
          this.parametroMaximoActividad = res[5]?.resultData[0];
          this.dataBaseOffline.insertDataParametro(res[5].resultData[0], Enumerator.MAX_ACTIVIDAD_POR_TIPO);
          this.updateValues();
          if (this.resourceService.IsDevice()) {
            // Se guarda esta informacion en tablas locales
            this.sqlLite(res);
          }
        }
      );
  }

  updateValues() {
    this.supportTypeList[0].minPictures = this.minPhotosSoportesInversion;
    this.supportTypeList[0].maxPictures = this.maxPhotosSoportesInversion;
    this.supportTypeList[0].maxWeight = this.maxSizePhotosParm;
    this.supportTypeList[0].minWeight = this.minSizePhotosParm;
    this.ValidarChecPersitence();
  }

  async ConsultarParametroOffline() {
    // Consulta informacion del tipo de parametro
    this.databaseComponent = new DatabaseComponent(this.sqlite, this.persistenceService);
    this.Actividad = await this.dataBaseOffline.selectDataParametro(Catalogs.ActividadInversion);
  }

  async getMaximoActividadPorTipoOffline() {
    // Consulta informacion del tipo de parametro
    this.databaseComponent = new DatabaseComponent(this.sqlite, this.persistenceService);
    const parametroMaximoActividad =
      await this.dataBaseOffline.selectDataParametro(Enumerator.MAX_ACTIVIDAD_POR_TIPO);
    this.parametroMaximoActividad = parametroMaximoActividad[0];
  }

  sqlLite(res) {
    if (this.resourceService.IsDevice()) {
      const arregloEnumerator = [];
      arregloEnumerator.push(Enumerator.MIN_PHOTOS_CAPITAL_INVESTMENT_SUPPORT);
      arregloEnumerator.push(Enumerator.MAX_PHOTOS_CAPITAL_INVESTMENT_SUPPORT);
      arregloEnumerator.push(Enumerator.MIN_SIZE_PHOTOS_CAPITAL);
      arregloEnumerator.push(Enumerator.MAX_SIZE_PHOTOS_CAPITAL);
      arregloEnumerator.push(Enumerator.CAPITAL_EXECUTED_COST);
      arregloEnumerator.push(Enumerator.MAX_ACTIVIDAD_POR_TIPO);
      const arregloParametros = [];
      for (let i = 0; i < res.length; i++) {
        const entidadResultados = new EntidadParametroAux();
        entidadResultados.parametro = res[i]?.resultData[0];
        entidadResultados.idBusqueda = arregloEnumerator[i];
        arregloParametros.push(entidadResultados);
      }
      this.deleteParametrosSQLite(arregloParametros);
    }
  }

  async deleteParametrosSQLite(arregloParametros) {
    // Borra la informacion asociados a parametros de fotos
    this.databaseComponent = new DatabaseComponent(this.sqlite, this.persistenceService);
    for (const parametro of arregloParametros) {
      await this.dataBaseOffline.deleteDataParametro
        (parametro.idBusqueda);
    }
    this.insertParametrosSQLite(arregloParametros);
  }

  async insertParametrosSQLite(arregloParametros) {
    // Inserta informacion de parametros de fotos
    this.databaseComponent = new DatabaseComponent(this.sqlite, this.persistenceService);
    for (const parametro of arregloParametros) {
      this.dataBaseOffline.insertDataParametro
        (parametro.parametro, parametro.idBusqueda);
    }
    const datosConsultados = [];
    for (const parametro of arregloParametros) {
      // informacion de la table parametro de parametros de fotos
      const datos = await this.dataBaseOffline.selectDataParametro(parametro.idBusqueda);
      datosConsultados.push(datos);
    }
  }

  async catalogosCantidadFotosOffline() {
    const minPhotosSoporteInverion = await this.dataBaseOffline.selectDataParametro
      (Enumerator.MIN_PHOTOS_CAPITAL_INVESTMENT_SUPPORT);
    // Dejar esta instancia en este punto o databaseComponent sera indefinido
    this.databaseComponent = new DatabaseComponent(this.sqlite, this.persistenceService);
    const maxPhotosSoporteInverion = await this.dataBaseOffline.selectDataParametro
      (Enumerator.MAX_PHOTOS_CAPITAL_INVESTMENT_SUPPORT);
    const minSizePhotosParm = await this.dataBaseOffline.selectDataParametro
      (Enumerator.MIN_SIZE_PHOTOS_CAPITAL);
    const maxSizePhotosParm = await this.dataBaseOffline.selectDataParametro
      (Enumerator.MAX_SIZE_PHOTOS_CAPITAL);
    const executedCostParm = await this.dataBaseOffline.selectDataParametro
      (Enumerator.CAPITAL_EXECUTED_COST);
    this.minPhotosSoportesInversion = minPhotosSoporteInverion[0].valor;
    this.maxPhotosSoportesInversion = maxPhotosSoporteInverion[0].valor;
    this.minSizePhotosParm = minSizePhotosParm[0].valor;
    this.maxSizePhotosParm = maxSizePhotosParm[0].valor;
    this.executedCostMaxValue = executedCostParm[0].valor;
    this.updateValues();
  }

  async ValidarformatoImagen(support): Promise<boolean> {
    if (!support.includes('/9j/')) {
      const alert = await this.alertController.create({
        cssClass: 'contenedor-principal',
        header: 'Confirmación',
        message: '<strong>La imagen no cumple con el formato correcto.</strong>',
        buttons: [
          {
            text: 'Aceptar',
            handler: () => { }
          }
        ]
      });

      await alert.present();
      return false;
    }

    return true;
  }

  async CheckImageSize(base64: string, index: number) {
    const num = 1000;
    // Check file size from base64 string in Kbytes
    const size = ((base64.length * (3 / 4)) / num);

    if (size <= (this.maxSizePhotosParm * num) &&
      size >= (this.minSizePhotosParm * num))
      {
        return true;
      }
      else {
        const alert = await this.alertController.create({
          cssClass: 'contenedor-principal',
          header: 'Confirmación',
          message: `<strong>Únicamente se permiten imágenes que pesen menos de
          ${this.maxSizePhotosParm} Mb y más de ${this.minSizePhotosParm}
           Mb</strong>`,
          buttons: [
            {
              text: 'Aceptar',
              handler: () => {
              }
            }
          ]
        });
        await alert.present();
      }
  }

  ConsultarTipoActividad(){
    this.parametroService.ConsultarParametro(Enumerator.ID_ACTIVIDAD)
      .subscribe(
        async (res) => {
          this.Actividad = res.resultData;
        }
      );
  }

  CheckExecutedCostValue() {
    if (this.activityFormGroup.controls.executedCost.value === '0' || 
    this.activityFormGroup.controls.executedCost.value === '$0'){
          this.cantidadMinimaFotos = true;
    }
    else {
      if (this.supportTypeList[0].thumbnails.length >=
        this.supportTypeList[0].minPictures &&
        this.supportTypeList[0].thumbnails.length <=
        this.supportTypeList[0].maxPictures)
      {
        this.cantidadMinimaFotos = true;
      }
      else {
        this.cantidadMinimaFotos = false;
      }
    }
    // //Validamos Valor Máximo
    const executedCostInput = this.verificationDigitComponent.InputFocus(
      this.activityFormGroup.controls.executedCost.value);
      this.executedCostMaxError = Number(executedCostInput) > this.executedCostMaxValue;
  }
}

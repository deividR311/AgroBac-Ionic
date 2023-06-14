import { Component, OnInit, ViewChild } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { ResourceService } from 'src/app/services/resource/resource.service';
import { ToasterService } from 'src/app/services/toaster/toaster.service';
import { Credit } from 'src/app/shared/model/credit';
import { Support } from 'src/app/shared/model/support';
import { Thumbnail } from 'src/app/shared/model/thumbnail';
import { AlertController } from '@ionic/angular';
import { VerificationDigitComponent } from 'src/app/shared/components/verification-digit/verification-digit.component';
import { RubroService } from 'src/app/services/rubro/rubro.service';
import { Enumerator } from 'src/app/shared/enum/enumerator.enum';
import { RubroEntity } from 'src/app/shared/model/rubroEntity';
import { Rubro } from 'src/app/shared/model/rubro';
import { RubroTractores } from 'src/app/shared/model/rubroTractores';
import { MetaDataFoto } from 'src/app/shared/model/metadataFoto';
import { Login } from 'src/app/shared/model/login';
import { HttpResponse } from 'src/app/shared/model/httpresponse';
import { Photo } from 'src/app/shared/model/Photo';
import { environment } from 'src/environments/environment';
import { ParametroService } from 'src/app/services/Parametro/parametro.service';
import { Parametro } from 'src/app/shared/model/parametro';
import { PersistenceService } from 'angular-persistence';
import { LoadingService } from 'src/app/services/loading/loading.service';
import { DatabaseComponent } from 'src/app/shared/components/database/database.component';
import { SQLite } from '@ionic-native/sqlite/ngx';
import { forkJoin } from 'rxjs';
import { EntidadParametroAux } from 'src/app/shared/model/EntidadParametroAux';
import { EntidadMetadataAux } from 'src/app/shared/model/EntidadMetadataAux';
import { Guid } from 'guid-typescript';
import { UtilitiesService } from 'src/app/services/utilities/utilities.service';
import { getDocumentTypeRubro } from 'src/app/shared/core/helpers';
import { RemanagementRubro } from 'src/app/shared/model/RemanagementRubro';

@Component({
  selector: 'app-implements',
  templateUrl: './implements.page.html',
  styleUrls: ['./implements.page.scss'],
})
export class ImplementsPage implements OnInit {
  @ViewChild(VerificationDigitComponent) verificationDigitComponent: VerificationDigitComponent;
  @ViewChild(DatabaseComponent) databaseComponent: DatabaseComponent;
  credit: Credit;
  implementsFormGroup: FormGroup;
  tiposSoportes: Array<Array<Thumbnail>>;
  supportTypeList: Array<Support>;
  supportTypeListAux: Array<MetaDataFoto>;
  executedCostMaxValue: any;
  rubroTractores: RubroTractores;
  rubro: Rubro;
  foto: MetaDataFoto;
  listaFotos: Array<MetaDataFoto>;
  rubroEntity: RubroEntity;
  parametroType: Array<Parametro>;
  setExecutedCostBlur = false;
  obligacionesRequiresInternet = false;
  minPhotosMaquinariaAdquirida: number;
  maxPhotosMaquinariaAdquirida: number;
  minPhotosPlacaIdentificacionMaquinaria: number;
  maxPhotosPlacaIdentificacionMaquinaria: number;
  minPhotosFacturaDian: number;
  maxPhotosFacturaDian: number;
  minSizePhotosParm: number;
  maxSizePhotosParm: number;
  cantidadMinimaFotos = false;
  formularioValido = false;
  idAux = 0;
  databaseOffline = new DatabaseComponent(this.sqlite,this.persistenceService);
  executedCostMaxError = false;

  documentType : number;
  tiposDocumento: any;

  // cssClass
  alertCssClassName : string = 'contenedor-principal';
  alertHeader : string = 'Confirmación';

  maquinariaRubroType : number = 2;
  executedCostMaxLength : number = 16;
  executedCostValueError : boolean = false;

  constructor(
    private readonly alertController: AlertController,
    private readonly formBuilder: FormBuilder,
    private readonly parametroService: ParametroService,
    private readonly persistenceService: PersistenceService,
    private readonly resourceService: ResourceService,
    private readonly router: Router,
    private readonly rubroService: RubroService,
    private readonly toasterService: ToasterService,
    private readonly sqlite: SQLite,
    private readonly loadingService: LoadingService,
    private readonly utilitiesService: UtilitiesService
  ) {
    this.rubroTractores = new RubroTractores();
    this.rubroEntity = new RubroEntity();
    this.rubro = new Rubro();
    this.foto = new MetaDataFoto();
    this.listaFotos = new Array<MetaDataFoto>();
  }

  ngOnInit() {
    this.InitializeForm();
    this.getHeading();
    
    this.tiposDocumento = this.router.getCurrentNavigation().extras.state;
  }

  async ionViewWillEnter() {
    this.executeFunctions();
  }

  async executeFunctions() {
    this.InitializeForm();
    this.getHeading();
    this.InitializeMachinerySupportType();
    this.obligacionesRequiresInternet = false;
    // Logica segun si el usuario se encuentra con internet o no
    if (this.resourceService.IsOnline()) {
      // this.menuComponent.ConsultarMenu();
      await this.consultarParametroGetId();
      await this.consultarRubroTractores();
      await this.catalogosCantidadFotos();
    } else {
      if (this.resourceService.IsDevice()) {
        // this.menuComponent.ConsultarMenuOffline();
        await this.consultarParametroGetIdOffline();
        await this.consultarRubroTractoresOffline();
        await this.catalogosCantidadFotosOffline();
      }
    }
  }

  InitializeForm() {
    this.implementsFormGroup = this.formBuilder.group({
      executedCost: [, [Validators.required, Validators.min(0)],
      ],
    });
  }

  InitializeMachinerySupportType() {
    this.supportTypeList = [
      {
        description: 'Maquinaria adquirida',
        minPictures: this.minPhotosMaquinariaAdquirida,
        maxPictures: this.maxPhotosMaquinariaAdquirida,
        maxSizeHeight: 1080,
        maxSizeWidth: 1920,
        maxWeight: this.maxSizePhotosParm,
        minWeight: this.minSizePhotosParm,
        requireMetaData: true,
        thumbnails: [],
      },
      {
        description: 'Placa de identificación de la maquinaria',
        minPictures: this.minPhotosPlacaIdentificacionMaquinaria,
        maxPictures: this.maxPhotosPlacaIdentificacionMaquinaria,
        maxSizeHeight: 1080,
        maxSizeWidth: 1920,
        maxWeight: this.maxSizePhotosParm,
        minWeight: this.minSizePhotosParm,
        requireMetaData: true,
        thumbnails: [],
      },
      {
        description:
          'Factura de maquinaria o del registro de importación expedido por la DIAN',
        minPictures: this.minPhotosFacturaDian,
        maxPictures: this.maxPhotosFacturaDian,
        maxSizeHeight: 1080,
        maxSizeWidth: 1920,
        maxWeight: this.maxSizePhotosParm,
        minWeight: this.minSizePhotosParm,
        requireMetaData: false,
        thumbnails: [],
      },
    ];
    this.supportTypeListAux = [];
  }

  getHeading() {
    // Invalid Heading
    if (!this.resourceService.CheckPersistence('Heading')) {
      this.resourceService.GetResourceValues().then((data) => {
        this.toasterService.PresentToastMessage(
          data['mobile.generics.InvalidHeading']
        );
      });
      this.router.navigate(['/credits']);
    } else {
      this.credit = JSON.parse(this.resourceService.GetPersistenceValue('Heading'));
    }
  }

  cargarFormulario(rubro: Array<Rubro>)
  {
    if (rubro.length > 0) {
      this.implementsFormGroup.controls.executedCost.setValue(rubro[0].rubro.costoEjecutado);
    }
  }

  async save() {
    this.loadingService.loadingPresent();
    const rubro = await this.consultaRubroTractoresForm();
    this.rubroTractores.Rubro = rubro;
    this.rubroTractores.Rubro.fechaLimiteAutoGestion = this.credit.fechaLimiteAutogestion;
    this.rubroTractores.Rubro.numeroIdentificacion = this.credit.numeroDocumento ? this.credit.numeroDocumento : this.credit.identificacionCliente;
    this.rubroTractores.Rubro.tipoIdentificacion = getDocumentTypeRubro( this.tiposDocumento, this.credit );
    this.rubroTractores.Rubro.codigoTipoRubro = Enumerator.CODIGO_MAQUINARIA_EQUIPOS.toString();
    
    if (this.resourceService.IsOnline()) {
      // Se agrego un segundo parametro de entrada al servicio, para redireccionar o no a la pantalla rubro
      // True, redirecciona a rubro. False, se mantiene en la pantalla principal (logica de destanqueo)
      this.insertarRubroServicio(this.rubroTractores, true);
    } else {
      // El segundo parametro "false", indica que se ha gurdado offline y se debe hacer destanqueo
      await this.insertarRubro(this.rubroTractores.Rubro, false);
      this.resourceService.GetResourceValues().then(
        (data) => {
          this.loadingService.loadingDismiss();
          this.toasterService.PresentToastMessage(data['mobile.generics.SavedOffline']);
          this.router.navigate(['/rubro']);
        }
      );
    }
  }

  async consultaRubroTractoresForm(): Promise<Rubro> {
    const rubro: Rubro = new Rubro();
    const user: Login = this.resourceService.GetUser();
    rubro.codigoObligacion = this.credit.obligacion;
    rubro.numeroIdentificacion = user.usuario;
    rubro.descripcion = this.credit.descripcionRubro;
    rubro.codigoTipoRubro = this.credit.codigoRubro;
    rubro.fechaCreacion = new Date().toISOString();
    rubro.fechaModificacion = new Date().toISOString();
    rubro.usuarioCreacion = user.usuario;
    rubro.usuarioModificacion = user.usuario;
    rubro.idCase = this.credit.idCase;
    rubro.guid = this.credit.guidRubro;
    rubro.id = this.idAux;
    rubro.fechaLimiteAutoGestion = this.credit.fechaLimiteAutogestion;
    rubro.costoEjecutado = this.implementsFormGroup.controls.executedCost.value.toString().replace('$', '');
    rubro.listaMetaDataFoto = await this.getMediaForm();
    rubro.estadoObligacion = this.rubroEntity?.estadoObligacion;

    // rejection history
    this.databaseComponent = new DatabaseComponent(this.sqlite, this.persistenceService);
    const response = await this.databaseComponent.selectRemanagementRubro( this.credit.idCase, this.credit.obligacion, this.maquinariaRubroType );

    if (rubro.estadoObligacion === Enumerator.ESTADO_OBLIGACION_RECHAZADO && response.length === 0) {
      rubro.id = 0;
      rubro.listaMetaDataFoto = rubro.listaMetaDataFoto.filter((image) => image.id != -1);
      rubro.listaMetaDataFoto.forEach((image) => {
        image.id = 0;
        image.nombreArchivo = Guid.create().toString() + '.jpeg'
      })
      let RemanagementrubroMaquinaria : RemanagementRubro = new RemanagementRubro();
      RemanagementrubroMaquinaria.id = null;
      RemanagementrubroMaquinaria.idCase = this.credit.idCase;
      RemanagementrubroMaquinaria.codigoObligacion = this.credit.obligacion;
      RemanagementrubroMaquinaria.tipoRubro = this.maquinariaRubroType;
      this.databaseComponent = new DatabaseComponent(this.sqlite, this.persistenceService);
      this.databaseComponent.insertRemanagementRubro( RemanagementrubroMaquinaria );
    }
    //

    return rubro;
  }

  async getMediaForm(): Promise<Array<MetaDataFoto>> {

    const mediaList: Array<MetaDataFoto> = [];  

    for (const support of this.supportTypeList[0].thumbnails) {
      const nombre = await this.uploadMedia(support);
      // El id debe ir en 0 si es un registro nuevo
      if (support.metadata.id === undefined || support.metadata.id === null) {
        support.metadata.id = 0;
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

      support.metadata.nombreArchivo = nombre;
      support.metadata.tipo = Enumerator.ID_MACHINERY;
      mediaList.push(support.metadata);
    }

    for (const support of this.supportTypeList[1].thumbnails) {
      const nombre = await this.uploadMedia(support);
      // El id debe ir en 0 si es un registro nuevo
      if (support.metadata.id === undefined || support.metadata.id === null) {
        support.metadata.id = 0;
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
      support.metadata.nombreArchivo = nombre;
      support.metadata.tipo = Enumerator.ID_MACHINERY_PLATE;
      mediaList.push(support.metadata);
    }

    for (const support of this.supportTypeList[2].thumbnails) {
      const nombre = await this.uploadMedia(support);
      // El id debe ir en 0 si es un registro nuevo
      // Como este tipo de foto no tiene metadata no se puede acceder a esta propiedad
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
      } else {
        //rejection functionality
        // if (RubroDataLoaded() && support.metadata) {
        //   support.metadata.id = 0;
        // }
        //
      }
      support.metadata.nombreArchivo = nombre;
      support.metadata.tipo = Enumerator.DIAN_PURCHASE_INVOICE;
      mediaList.push(support.metadata);
    }
    for(var support of this.supportTypeListAux){
      mediaList.push(support);
    }
    return mediaList;
  }

  async uploadMedia(media: Thumbnail, nombreArchivo = null) {
    // Guid enviado localmente
    const photo = new Photo();
    if (nombreArchivo !== null && nombreArchivo !== undefined) {
      const indice = nombreArchivo.indexOf('.jpeg');
      if (indice !== 0) {
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

  async handleMedia(event: Thumbnail, index: number) {


    if (await this.utilitiesService.validarformatoImagen(event.src) &&
    await this.utilitiesService.checkImageSize(event.src, index, this.maxSizePhotosParm, this.minSizePhotosParm)) {
      this.supportTypeList[index].thumbnails.push({
        id: event.id,
        src: event.src,
        photoBase64: event.photoBase64,
        metadata: event.metadata
      });
    }


    if (this.supportTypeList[0].thumbnails.length >= this.minPhotosMaquinariaAdquirida) {
      this.cantidadMinimaFotos = true;
    } else {
      this.cantidadMinimaFotos = false;
    }
    this.validarBotonGuardar();
  }

  async deleteMedia(x: number, y: number) {
    const alert = await this.alertController.create({
      cssClass: this.alertCssClassName,
      header: this.alertHeader,
      message: '<strong>¿Está seguro que desea eliminar esta foto? </strong>' +
              '<p class="alertmsg">RECUERDE QUE LOS CAMBIOS SOLO SE APLICARÁN UNA VEZ DE CLICK EN EL BOTÓN GUARDAR DE ESTE FORMULARIO</p>',
      buttons: [
        {
          text: 'Cancelar',
          role: 'cancel'
        },
        {
          text: 'Aceptar',
          handler: () => {
            let o = this.supportTypeList[x].thumbnails[y].metadata;
            this.supportTypeList[x].thumbnails.splice(y, 1);
            if (o !== undefined && o != null) {
              o.id = -1;
			        o.tipo = 0;
              this.supportTypeListAux.push(o);
            }
            this.validarBotonGuardar();
          },
        },
      ],
    });
    await alert.present();
  }

  executedCostChange() {
    this.verificationDigitComponent = new VerificationDigitComponent();
    this.implementsFormGroup.controls.executedCost.setValue(
      this.verificationDigitComponent.InputChange(
        this.implementsFormGroup.controls.executedCost.value));
    if (this.setExecutedCostBlur) {
      this.executedCostBlur();
      this.setExecutedCostBlur = false;
    }

    (this.implementsFormGroup.controls.executedCost.value && (this.implementsFormGroup.controls.executedCost.value.includes(',') || this.implementsFormGroup.controls.executedCost.value.includes('.')))
    ? this.executedCostValueError = true : this.executedCostValueError = false;

    this.CheckExecutedCostValue();
    this.checkExecutedCostLength();
  }

  executedCostBlur() {
    this.verificationDigitComponent = new VerificationDigitComponent();
    this.implementsFormGroup.controls.executedCost.setValue(
      this.verificationDigitComponent.InputBlur(
        this.implementsFormGroup.controls.executedCost.value));
    if (this.implementsFormGroup.controls.executedCost.value !== '$0' &&
    this.implementsFormGroup.controls.executedCost.value !== '') {
      this.formularioValido = true;
    } else {
      this.formularioValido = false;
    }

    if (this.implementsFormGroup.controls.executedCost.value) {
      const decimalExecutedCost = `${this.implementsFormGroup.controls.executedCost.value.charAt(0)}${this.implementsFormGroup.controls.executedCost.value.charAt(1)}`;
      const afterDecimal = `${this.implementsFormGroup.controls.executedCost.value.charAt(2)}`;
      setTimeout(() => {
        (decimalExecutedCost === '$0' && afterDecimal !== '') ? this.executedCostValueError = true : this.executedCostValueError = false;
      }, 100);
    }

    this.CheckExecutedCostValue();
    this.checkExecutedCostLength();
  }

  checkExecutedCostLength() {
    (!this.executedCostMaxError && this.implementsFormGroup.controls.executedCost?.value.length > 16)
    ? this.executedCostMaxLength = this.implementsFormGroup.controls.executedCost.value.length
    : this.executedCostMaxLength = 16;
  }

  executedCostFocus() {
    this.verificationDigitComponent = new VerificationDigitComponent();
    this.implementsFormGroup.controls.executedCost.setValue(
      this.verificationDigitComponent.InputFocus(
        this.implementsFormGroup.controls.executedCost.value));
  }

  consultarRubroTractores() {
    const { guidRubro, obligacion, idCase } = this.credit;
    this.rubroService.ConsultarRubroTractores(guidRubro, obligacion, idCase)
      .subscribe(
        async (res) => {
          if (res.resultData !== null) {
            this.rubroEntity = res.resultData[0].rubro;
            this.idAux = this.rubroEntity.id;
            this.implementsFormGroup.controls.executedCost.setValue(this.rubroEntity.costoEjecutado);
            this.setExecutedCostBlur = true;
            const photos = res.resultData[0].rubro.listaMetaDataFoto;
            res.resultData[0].rubro.guid = this.credit.guidRubro;
            if (this.resourceService.IsDevice()) {
              // Inserta datos del rubro en sqlite
              // Parametro en true porque ya esta info esta guardada en la base de datos
              this.insertarRubro(res.resultData[0].rubro, true);
            }
            if (photos !== null) {
              this.fillPhotos(photos);
              this.validarBotonGuardar();
            }
          } else {
            this.idAux = 0;
          }
        }
      );
  }

  fillPhotos(media) {
    for (const photo of media.filter(m => m.tipo === Enumerator.ID_MACHINERY)) {
      const thumbnail: Thumbnail = {
        id: photo.id,
        metadata: photo,
        src: `${environment.urlStorage.url}${photo.nombreArchivo}`,
        photoBase64: photo.base64
      };
      if (this.resourceService.IsOnline()){
        thumbnail.src = `${environment.urlStorage.url}${photo.nombreArchivo}`;
      } else {
        thumbnail.src = photo.base64;
      }
      this.supportTypeList[0].thumbnails.push(thumbnail);
    }

    for (const photo of media.filter(m => m.tipo === Enumerator.ID_MACHINERY_PLATE)) {
      const thumbnail: Thumbnail = {
        id: photo.nombreArchivo, 'metadata': photo,
        src: `${environment.urlStorage.url}${photo.nombreArchivo}`,
        photoBase64: photo.base64
      };
      if (this.resourceService.IsOnline()){
        thumbnail.src = `${environment.urlStorage.url}${photo.nombreArchivo}`;
      } else {
        thumbnail.src = photo.base64;
      }
      this.supportTypeList[1].thumbnails.push(thumbnail);
    }

    for (const photo of media.filter(m => m.tipo === Enumerator.DIAN_PURCHASE_INVOICE)) {
      const thumbnail: Thumbnail = {
        id: photo.nombreArchivo, 'metadata': photo,
        src: `${environment.urlStorage.url}${photo.nombreArchivo}`,
        photoBase64: photo.base64
      };
      if (this.resourceService.IsOnline()){
        thumbnail.src = `${environment.urlStorage.url}${photo.nombreArchivo}`;
      } else {
        thumbnail.src = photo.base64;
      }
      this.supportTypeList[2].thumbnails.push(thumbnail);
    }
    const arregloEliminadas = media.filter((m: { tipo: number; }) => m.tipo === 0);
    for (const photo of arregloEliminadas) {
      this.supportTypeListAux.push(photo);
    }
    this.validarBotonGuardar();
  }

  replaceBase64(listaMetaDataFoto) {
    for (const elementMetaDataFoto of listaMetaDataFoto) {
      elementMetaDataFoto.base64 = '';
    }
    return listaMetaDataFoto;
  }

  consultarParametroGetId() {​​
    this.parametroService.ConsultarParametro(Enumerator.RUBRO_TYPE)
      .subscribe(
        async (res) => {​​
          this.parametroType =  res.resultData;
          // Insercion de esta info en la tabla de sqlite
          if (this.resourceService.IsDevice()) {
            // Borra la informacion asociada a este parametro
            this.databaseComponent = new DatabaseComponent(this.sqlite, this.persistenceService);
            await this.databaseOffline.deleteDataParametro(Enumerator.RUBRO_TYPE);
            // Inserta informacion del parametro
            for (const parametro of this.parametroType) {
              this.databaseOffline.insertDataParametro(parametro, Enumerator.RUBRO_TYPE);
            }
          }
        }​​​​
      );
  }

  async insertarRubro(rubro: Rubro, rubroGuardado: boolean) {

    this.databaseComponent = new DatabaseComponent(this.sqlite, this.persistenceService);
    // Rubro
    let datosRubro = await this.databaseOffline.selectDataRubro(rubro.guid, rubro.codigoObligacion);
    if (datosRubro.length > 0){
      await this.databaseOffline.deleteDataRubro(rubro.guid, rubro.codigoObligacion);
    }

    if (!rubro.estadoObligacion) {
      rubro.estadoObligacion = 0;
    }

    await this.databaseOffline.insertDataRubro(rubro, rubroGuardado, Enumerator.CODIGO_MAQUINARIA_EQUIPOS);

    // Check table rubro
    datosRubro = await this.databaseOffline.selectDataRubro(rubro.guid, rubro.codigoObligacion);

    // Metadata
    let datosMetadata = await this.databaseOffline.
      selectDataMetaDataFoto(rubro.guid, rubro.codigoObligacion);
    if (datosMetadata.length > 0) {
      await this.databaseOffline.deleteDataMetaDataFoto(rubro.guid, rubro.codigoObligacion);
    }

    const arregloMetadata = [];
    if (rubro.listaMetaDataFoto !== null) {
      for (const metadata of rubro.listaMetaDataFoto) {
        const entidadResultados = new EntidadMetadataAux();
        if (metadata.id === null || metadata.id === undefined) {
          metadata.id = 0;
        }
        entidadResultados.identificadorActividad = null;
        entidadResultados.metadata = metadata;
        arregloMetadata.push(entidadResultados);
      }

      for (const metadata of arregloMetadata) {
        await this.databaseOffline.
          insertDataMetaDataFoto(rubro.guid, metadata, rubro.codigoObligacion);
      }
    }
  }

  async consultarParametroGetIdOffline() {
    // Check rubro type
    this.databaseComponent = new DatabaseComponent(this.sqlite, this.persistenceService);
    this.parametroType = await this.databaseOffline.selectDataParametro(Enumerator.RUBRO_TYPE);
  }

  async consultarRubroTractoresOffline() {
    if (this.persistenceService.get('user') !== undefined) {

      // Rubro
      this.databaseComponent = new DatabaseComponent(this.sqlite, this.persistenceService);
      const datosRubro = await this.databaseOffline.
        selectDataRubro(this.credit.guidRubro, this.credit.obligacion);
      this.rubroEntity = datosRubro[0];

      if (this.rubroEntity !== undefined) {
        this.implementsFormGroup.controls.executedCost.setValue(this.rubroEntity.costoEjecutado);
        this.setExecutedCostBlur = true;
        this.idAux = this.rubroEntity.id;
        // Metadata
        this.databaseComponent = new DatabaseComponent(this.sqlite, this.persistenceService);
        const datosMetadataRubro =
          await this.databaseOffline.selectDataMetaDataFoto(this.credit.guidRubro, this.credit.obligacion);
        this.rubroEntity.listaMetaDataFoto = datosMetadataRubro;

        // Graficar imagenes
        const photos = this.rubroEntity.listaMetaDataFoto;
        this.fillPhotos(photos);
      }
    }
  }

  catalogosCantidadFotos() {
    const minPhotosMaquinariaAdquirida = this.parametroService.
      ConsultarParametro(Enumerator.MIN_PHOTOS_MACHINERY_MACHINERY_ACQUIRED);
    const maxPhotosMaquinariaAdquirida = this.parametroService.
      ConsultarParametro(Enumerator.MAX_PHOTOS_MACHINERY_MACHINERY_ACQUIRED);
    const minPhotosPlacaIdentificacionMaquinaria = this.parametroService.
      ConsultarParametro(Enumerator.MIN_PHOTOS_MACHINERY_MACHINERY_PLATE);
    const maxPhotosPlacaIdentificacionMaquinaria = this.parametroService.
      ConsultarParametro(Enumerator.MAX_PHOTOS_MACHINERY_MACHINERY_PLATE);
    const minPhotosFacturaDian = this.parametroService.
      ConsultarParametro(Enumerator.MIN_PHOTOS_MACHINERY_DIAN_INVOICE);
    const maxPhotosFacturaDian = this.parametroService.
      ConsultarParametro(Enumerator.MAX_PHOTOS_MACHINERY_DIAN_INVOICE);
    const minSizePhotosParm = this.parametroService.
      ConsultarParametro(Enumerator.MIN_SIZE_PHOTOS_MACHINERY);
    const maxSizePhotosParm = this.parametroService.
      ConsultarParametro(Enumerator.MAX_SIZE_PHOTOS_MACHINERY);
    const executedCostParm = this.parametroService.
      ConsultarParametro(Enumerator.MACHINERY_EXECUTED_COST);
    forkJoin([minPhotosMaquinariaAdquirida, maxPhotosMaquinariaAdquirida,
      minPhotosPlacaIdentificacionMaquinaria, maxPhotosPlacaIdentificacionMaquinaria,
      minPhotosFacturaDian, maxPhotosFacturaDian, minSizePhotosParm,
      maxSizePhotosParm, executedCostParm]).subscribe(
        async (res) => {
          this.minPhotosMaquinariaAdquirida = Number(res[0]?.resultData[0].valor);
          this.maxPhotosMaquinariaAdquirida = Number(res[1]?.resultData[0].valor);
          this.minPhotosPlacaIdentificacionMaquinaria = Number(res[2]?.resultData[0].valor);
          this.maxPhotosPlacaIdentificacionMaquinaria = Number(res[3]?.resultData[0].valor);
          this.minPhotosFacturaDian = Number(res[4]?.resultData[0].valor);
          this.maxPhotosFacturaDian = Number(res[5]?.resultData[0].valor);
          this.minSizePhotosParm = Number(res[6]?.resultData[0].valor);
          this.maxSizePhotosParm = Number(res[7]?.resultData[0].valor);
          this.executedCostMaxValue = Number(res[8]?.resultData[0].valor);
          this.updateValues();
          if (this.resourceService.IsDevice()) {
            // Guarda estos parametros en tablas locales
            this.sqlLite(res);
          }
        }
      );
  }

  updateValues() {
    if (this.supportTypeList !== undefined) {
    this.supportTypeList[0].maxPictures = this.maxPhotosMaquinariaAdquirida;
    this.supportTypeList[0].minPictures = this.minPhotosMaquinariaAdquirida;
    this.supportTypeList[0].maxWeight = this.maxSizePhotosParm;
    this.supportTypeList[0].minWeight = this.minSizePhotosParm;

    this.supportTypeList[1].maxPictures = this.maxPhotosPlacaIdentificacionMaquinaria;
    this.supportTypeList[1].minPictures = this.minPhotosPlacaIdentificacionMaquinaria;
    this.supportTypeList[1].maxWeight = this.maxSizePhotosParm;
    this.supportTypeList[1].minWeight = this.minSizePhotosParm;

    this.supportTypeList[2].maxPictures = this.maxPhotosFacturaDian;
    this.supportTypeList[2].minPictures = this.minPhotosFacturaDian;
    this.supportTypeList[2].maxWeight = this.maxSizePhotosParm;
    this.supportTypeList[2].minWeight = this.minSizePhotosParm;
    this.validarBotonGuardar();
    }
  }

  async deleteParametrosSQLite(arregloParametros) {
    // Borra la informacion asociados a parametros de fotos
    this.databaseComponent = new DatabaseComponent(this.sqlite, this.persistenceService);
    for (const parametro of arregloParametros) {
      await this.databaseOffline.deleteDataParametro(parametro.idBusqueda);
    }
    this.insertParametrosSQLite(arregloParametros);
  }

  async insertParametrosSQLite(arregloParametros) {
    // Inserta informacion de parametros de fotos
    this.databaseComponent = new DatabaseComponent(this.sqlite, this.persistenceService);
    for (const parametro of arregloParametros) {
      this.databaseOffline.insertDataParametro
        (parametro.parametro, parametro.idBusqueda);
    }
    const datosConsultados = [];
    for (const parametro of arregloParametros) {
      // informacion de la table parametro de parametros de fotos
      const datos = await this.databaseOffline.selectDataParametro(parametro.idBusqueda);
      datosConsultados.push(datos);
    }
  }

  async catalogosCantidadFotosOffline() {
    // Consulta los catalogos offline
    const minPhotosMaquinariaAdquirida = await this.databaseOffline.selectDataParametro(
      Enumerator.MIN_PHOTOS_MACHINERY_MACHINERY_ACQUIRED);
    // Dejar esta instancia en este punto o databaseComponent sera indefinido
    this.databaseComponent = new DatabaseComponent(this.sqlite, this.persistenceService);
    const maxPhotosMaquinariaAdquirida = await this.databaseOffline.selectDataParametro(
      Enumerator.MAX_PHOTOS_MACHINERY_MACHINERY_ACQUIRED);
    const minPhotosPlacaIdentificacionMaquinaria = await this.databaseOffline.selectDataParametro(
      Enumerator.MIN_PHOTOS_MACHINERY_MACHINERY_PLATE);
    const maxPhotosPlacaIdentificacionMaquinaria = await this.databaseOffline.selectDataParametro(
      Enumerator.MAX_PHOTOS_MACHINERY_MACHINERY_PLATE);
    const minPhotosFacturaDian = await this.databaseOffline.selectDataParametro(
      Enumerator.MIN_PHOTOS_MACHINERY_DIAN_INVOICE);
    const maxPhotosFacturaDian = await this.databaseOffline.selectDataParametro(
      Enumerator.MAX_PHOTOS_MACHINERY_DIAN_INVOICE);
    const minSizePhotosParm = await this.databaseOffline.selectDataParametro(
      Enumerator.MIN_SIZE_PHOTOS_MACHINERY);
    const maxSizePhotosParm = await this.databaseOffline.selectDataParametro(
      Enumerator.MAX_SIZE_PHOTOS_MACHINERY);
    const executedCostParm = await this.databaseOffline.selectDataParametro(
      Enumerator.MACHINERY_EXECUTED_COST);
    this.minPhotosMaquinariaAdquirida = minPhotosMaquinariaAdquirida[0].valor;
    this.maxPhotosMaquinariaAdquirida = maxPhotosMaquinariaAdquirida[0].valor;
    this.minPhotosPlacaIdentificacionMaquinaria = minPhotosPlacaIdentificacionMaquinaria[0].valor;
    this.maxPhotosPlacaIdentificacionMaquinaria = maxPhotosPlacaIdentificacionMaquinaria[0].valor;
    this.minPhotosFacturaDian = minPhotosFacturaDian[0].valor;
    this.maxPhotosFacturaDian = maxPhotosFacturaDian[0].valor;
    this.minSizePhotosParm = minSizePhotosParm[0].valor;
    this.maxSizePhotosParm = maxSizePhotosParm[0].valor;
    this.executedCostMaxValue = executedCostParm[0].valor;
    this.updateValues();
  }

  sqlLite(res) {
    if (this.resourceService.IsDevice()) {
      const arregloEnumerator = [];
      arregloEnumerator.push(Enumerator.MIN_PHOTOS_MACHINERY_MACHINERY_ACQUIRED);
      arregloEnumerator.push(Enumerator.MAX_PHOTOS_MACHINERY_MACHINERY_ACQUIRED);
      arregloEnumerator.push(Enumerator.MIN_PHOTOS_MACHINERY_MACHINERY_PLATE);
      arregloEnumerator.push(Enumerator.MAX_PHOTOS_MACHINERY_MACHINERY_PLATE);
      arregloEnumerator.push(Enumerator.MIN_PHOTOS_MACHINERY_DIAN_INVOICE);
      arregloEnumerator.push(Enumerator.MAX_PHOTOS_MACHINERY_DIAN_INVOICE);
      arregloEnumerator.push(Enumerator.MIN_SIZE_PHOTOS_MACHINERY);
      arregloEnumerator.push(Enumerator.MAX_SIZE_PHOTOS_MACHINERY);
      arregloEnumerator.push(Enumerator.MACHINERY_EXECUTED_COST);
      const arregloParametros = [];
      for (let  i = 0; i < res.length; i++) {
        const entidadResultados = new EntidadParametroAux();
        entidadResultados.parametro = res[i]?.resultData[0];
        entidadResultados.idBusqueda  = arregloEnumerator[i];
        arregloParametros.push(entidadResultados);
      }
      this.deleteParametrosSQLite(arregloParametros);
    }
  }

  validarBotonGuardar() {
    // Validaciones para deshabilitar boton guardar por cantidad de imagenes
    let cantidadFotosMaquinaria = false;
    if (this.supportTypeList[0].thumbnails.length >= this.minPhotosMaquinariaAdquirida) {
      cantidadFotosMaquinaria = true;
    }

    let cantidadFotosPlaca = false;
    if (this.supportTypeList[1].thumbnails.length >= this.minPhotosPlacaIdentificacionMaquinaria) {
      cantidadFotosPlaca = true;
    }

    let facturaDian = false;
    if (this.supportTypeList[2].thumbnails.length >= this.minPhotosFacturaDian) {
      facturaDian = true;
    }

    if (cantidadFotosMaquinaria && cantidadFotosPlaca && facturaDian) {
      this.cantidadMinimaFotos = true;
    } else {
      this.cantidadMinimaFotos = false;
    }
  }

  async insertarRubroServicio(rubroTractores, navegacion) {
    this.rubroService.InsertarRubroTractores(rubroTractores).subscribe(
      async (res: HttpResponse<any>) => {
        if (res.responseCode === Enumerator.HTTP_RESPONSE_OK) {
          this.resourceService.GetResourceValues().then(
            async (data) => {
              this.toasterService.PresentToastMessage(data['mobile.generics.Saved']);
              // Cuando se inserta se debe volver a actualizar toda la informacion del rubro
              rubroTractores.Rubro = res.resultData[0].rubro;
              await this.insertarRubro(rubroTractores.Rubro, true);
              if (navegacion) {
                this.router.navigate(['/rubro']);
              }
            }
          );
        }
      }
    );
  }

  CheckExecutedCostValue() {
    // //Validamos Valor Máximo
    const executedCostInput = this.verificationDigitComponent.InputFocus(
      this.implementsFormGroup.controls.executedCost.value);
    this.executedCostMaxError = Number(executedCostInput) > this.executedCostMaxValue;
  }
}

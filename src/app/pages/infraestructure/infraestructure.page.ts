import { Component, OnInit, ViewChild } from '@angular/core';
import { FormBuilder, FormControl, FormGroup, Validators } from '@angular/forms';
import { DateAdapter } from '@angular/material/core';
import { Router } from '@angular/router';
import { AlertController } from '@ionic/angular';
import { PersistenceService } from 'angular-persistence';
import { forkJoin } from 'rxjs';
import { ParametroService } from 'src/app/services/Parametro/parametro.service';
import { ResourceService } from 'src/app/services/resource/resource.service';
import { RubroService } from 'src/app/services/rubro/rubro.service';
import { ToasterService } from 'src/app/services/toaster/toaster.service';
import { VerificationDigitComponent } from 'src/app/shared/components/verification-digit/verification-digit.component';
import { Enumerator } from 'src/app/shared/enum/enumerator.enum';
import { HttpResponse } from 'src/app/shared/model/httpresponse';
import { Login } from 'src/app/shared/model/login';
import { MetaDataFoto } from 'src/app/shared/model/metadataFoto';
import { Parametro } from 'src/app/shared/model/parametro';
import { Photo } from 'src/app/shared/model/Photo';
import { Rubro } from 'src/app/shared/model/rubro';
import { RubroInfraestructuraAux } from 'src/app/shared/model/rubroInfraestructuraAux';
import { RubroInfraestructura } from 'src/app/shared/model/rubroInfrastructura';
import { Support } from 'src/app/shared/model/support';
import { Thumbnail } from 'src/app/shared/model/thumbnail';
import { environment } from 'src/environments/environment';
import { Guid } from 'guid-typescript';
import { SQLite } from '@ionic-native/sqlite/ngx';
import { DatabaseComponent } from 'src/app/shared/components/database/database.component';
import { EntidadMetadataAux } from 'src/app/shared/model/EntidadMetadataAux';
import { LoadingService } from 'src/app/services/loading/loading.service';
import { getDocumentTypeRubro } from 'src/app/shared/core/helpers';
import { RemanagementRubro } from 'src/app/shared/model/RemanagementRubro';


@Component({
  selector: 'app-infraestructure',
  templateUrl: './infraestructure.page.html',
  styleUrls: ['./infraestructure.page.scss'],
})
export class InfraestructurePage implements OnInit {
  @ViewChild(DatabaseComponent) databaseComponent: DatabaseComponent;

  heading: any;
  infrastructureFormGroup: FormGroup;
  infrastructureTypeList: Array<Parametro>;
  infrastructureTypeFormGroup: FormGroup;
  supportTypeList: Array<Support>;
  supportTypeListAux: Array<MetaDataFoto>;
  minDate: Date;
  maxDate: Date;
  circumference: boolean;
  lengthOrWidth: boolean;
  executedCostMaxValue: any;
  currency: string;
  verificationDigitComponent: VerificationDigitComponent;
  minPhotosReservoirTank: number;
  maxPhotosReservoirTank: number;
  minPhotosCorralBarn: number;
  maxPhotosCorralBarn: number;
  minSizePhotos: number;
  maxSizePhotos: number;
  parametroType: Array<Parametro>;
  idAux = 0;
  validarfecha = false;
  cantidadMinimaFotosReservoirTank = false;
  cantidadMaximaFotosReservoirTank = false;
  cantidadMinimaFotosCorralBarn = false;
  cantidadMaximaFotosCorralBarn = false;
  cantidadMinGeneral = false;
  cantidadMaxGeneral = false;
  dataBaseOffline = new DatabaseComponent(this.sqlite, this.persistence);
  executedCostMaxError = false;

  documentType : number;
  tiposDocumento: any;
  obligationState : number;

  infraestructuraRubroType : number = 3;
  decimalComparmentValueError : boolean = false;
  executedCostValueError : boolean = false;
  decimalLengthError : boolean = false;
  decimalWidthError : boolean = false;
  decimalDeepError : boolean = false;
  executedCostMaxLength : number = 16;

  constructor(private readonly resourceService: ResourceService,
    private readonly router: Router, private readonly toasterService: ToasterService,
    private readonly formBuilder: FormBuilder,
    private readonly alertController: AlertController,
    private readonly parametroService: ParametroService,
    private readonly persistence: PersistenceService,
    private readonly rubroService: RubroService,
    private readonly dateAdapter: DateAdapter<Date>,
    private readonly sqlite: SQLite,
    private readonly loadingService: LoadingService) {
    this.dateAdapter.setLocale('en-GB');
    this.databaseComponent = new DatabaseComponent(this.sqlite, this.persistence);
  }

  ngOnInit() {
    this.InitializeForm();
    this.InitializeInfrastructureTypeForm();
    this.InitializeInfrastructureSupportType();
    this.GetHeading();
    this.tiposDocumento = this.router.getCurrentNavigation().extras.state;
  }

  ionViewWillEnter() {
    this.executeFunctions();
  }

  executeFunctions() {
    this.InitializeForm();
    this.InitializeInfrastructureTypeForm();
    this.InitializeInfrastructureSupportType();
    this.GetHeading();
    // Logica segun si el usuario se encuentra con internet o no
    if (this.resourceService.IsOnline()) {
      this.GetCatalogs();
      this.loadingService.loadingPresent();
      const { guidRubro, obligacion, idCase } = this.heading;
      this.rubroService.ConsultarRubroInfraestructura(guidRubro, obligacion, idCase).subscribe(
        (res: any) => {
          this.loadingService.loadingPresent();
          if (res !== null && res !== undefined) {
            this.ConsultarParametroGetId();
            if (this.resourceService.IsDevice()) {
              // Inserta datos del rubro en sqlite
              // Parametro en true porque ya esta info esta guardada en la base de datos
              if (res.resultData !== null) {
                this.obligationState = res.resultData[0].rubro.estadoObligacion;
                let rubro = new Rubro();
                rubro = res.resultData[0].rubro;
                if (res.resultData[0].rubroInfraestructura !== undefined) {
                  rubro.rubroInfraestructura = res.resultData[0].rubroInfraestructura;
                }
                this.insertarRubroInfraestructuraOffLine(rubro, true);
              }
            }
            this.FillForm(res.resultData);
          } else {
            this.idAux = 0;
          }
        }
      );
    } else {
      if (this.resourceService.IsDevice()) {
        this.GetCatalogsOffline();
        this.ConsultarParametroGetIdOffline();
        this.FillFormOffline();
      }
    }
  }

  GetHeading() {
    // Invalid Heading
    if (!this.resourceService.CheckPersistence('Heading')) {
      this.resourceService.GetResourceValues().then(
        (data) => {
          this.toasterService.PresentToastMessage(data['mobile.generics.InvalidHeading']);
        }
      );
    }
    else {
      this.heading = JSON.parse(this.resourceService.GetPersistenceValue('Heading'));
    }
  }

  InitializeForm() {
    this.infrastructureFormGroup = this.formBuilder.group({
      landName: ['', [Validators.required, Validators.maxLength(50)]],
      executionInitDate: ['', [Validators.required]],
      executionEndDate: ['', [Validators.required]],
      executedCost: [, [Validators.required, Validators.min(0)]],
      infrastructureType: ['',]
    });
    this.minDate = new Date(2019, 12, 1);
    this.maxDate = new Date(new Date().getFullYear(), new Date().getMonth(), new Date().getDate()
    );
    this.landName();
    this.onValueChanges();
  }
  onValueChanges(): void {
    this.infrastructureFormGroup.valueChanges.subscribe(val => {
      if (val.executionInitDate > val.executionEndDate) {
        this.validarfecha = false;
      } else {
        this.validarfecha = true;
      }
    });
  }

  numberCompartmentsOnChange() {
    const decimalComparmentValue = `${this.infrastructureTypeFormGroup.controls.numberCompartments.value.charAt(0)}`;
    const afterDecimal = `${this.infrastructureTypeFormGroup.controls.numberCompartments.value.charAt(1)}`;
    (this.infrastructureTypeFormGroup.controls.numberCompartments.value.includes(',') ||
    this.infrastructureTypeFormGroup.controls.numberCompartments.value.includes('.') ||
    (decimalComparmentValue === '0' && afterDecimal !== ''))
    ? this.decimalComparmentValueError = true : this.decimalComparmentValueError = false;
  }

  numberCompartmentsBlur() {
    const decimalComparmentValue = `${this.infrastructureTypeFormGroup.controls.numberCompartments.value.charAt(0)}`;
    const afterDecimal = `${this.infrastructureTypeFormGroup.controls.numberCompartments.value.charAt(1)}`;

    setTimeout(() => {
      (this.infrastructureTypeFormGroup.controls.numberCompartments.value.includes(',') ||
      this.infrastructureTypeFormGroup.controls.numberCompartments.value.includes('.') ||
      (decimalComparmentValue === '0' && afterDecimal !== ''))
      ? this.decimalComparmentValueError = true : this.decimalComparmentValueError = false;
    }, 10);
  }

  landName() {
    let valor = null;
    valor = this.infrastructureFormGroup.value.landName;
    valor = valor.substring(0, 50);
  }
  InitializeInfrastructureTypeForm() {
    this.infrastructureTypeFormGroup = this.formBuilder.group({
      numberCompartments: [, [Validators.required, Validators.max(50), Validators.min(0)]],
      length: [, [Validators.required, Validators.max(100)]],
      width: [, [Validators.required, Validators.max(100)]],
      circumference: [, [Validators.required, Validators.max(100), Validators.min(2)]],
      height: [, [Validators.required, Validators.max(100), Validators.min(2)]],
      deep: [, [Validators.required, Validators.max(100)]],
      calculation: []
    });
    this.infrastructureTypeFormGroup.updateValueAndValidity();
  }

  async GetCatalogs() {
    await this.InitializeInfrastructureParams();
    await this.InitializeInfrastructureTypeList();
  }

  GetCatalogsOffline() {
    this.InitializeInfrastructureParamsOffLine();
    this.InitializeInfrastructureTypeListOffLine();
  }


  InitializeInfrastructureTypeList() {
    this.parametroService.ConsultarParametro(Enumerator.INFRASTRUCTURETYPE_CATALOG).subscribe(
      async (res: HttpResponse<Parametro>) => {
        this.infrastructureTypeList = res.resultData;
        for (const infrastructureType of res.resultData) {
          const parms = await this.dataBaseOffline.selectDataParametro(Enumerator.INFRASTRUCTURETYPE_CATALOG);
          if (parms.length < res.resultData.length) {
            this.dataBaseOffline.insertDataParametro(infrastructureType, Enumerator.INFRASTRUCTURETYPE_CATALOG);
          }
        }
      }
    );
  }

  async InitializeInfrastructureTypeListOffLine() {
    // Check rubro type
    this.databaseComponent = new DatabaseComponent(this.sqlite, this.persistence);
    this.infrastructureTypeList = await
      this.dataBaseOffline.selectDataParametro(Enumerator.INFRASTRUCTURETYPE_CATALOG);
  }


  InitializeInfrastructureSupportType() {
    this.supportTypeList = [
      {
        description: 'Fotografía de la inversión',
        minPictures: 0,
        maxPictures: 0,
        maxSizeHeight: 1080,
        maxSizeWidth: 1024,
        maxWeight: this.maxSizePhotos,
        minWeight: this.minSizePhotos,
        requireMetaData: true,
        thumbnails: []
      },
      {
        description: 'Soportes contratos y facturas',
        minPictures: 0,
        maxPictures: 0,
        maxSizeHeight: 1080,
        maxSizeWidth: 1024,
        maxWeight: this.maxSizePhotos,
        minWeight: this.minSizePhotos,
        requireMetaData: false,
        thumbnails: []
      }
    ];
    this.supportTypeListAux = [];
  }

  InitializeInfrastructureParams() {
    const executedCostParm = this.parametroService.
      ConsultarParametro(Enumerator.INFRASTRUCTURE_EXECUTED_COST);
    const minPhotosReservoirTankParm = this.parametroService.
      ConsultarParametro(Enumerator.MIN_PHOTOS_INFRASTRUCTURETYPE_RESERVOIR_TANK);
    const maxPhotosReservoirTankParm = this.parametroService.
      ConsultarParametro(Enumerator.MAX_PHOTOS_INFRASTRUCTURETYPE_RESERVOIR_TANK);
    const minPhotosCorralBarnParm = this.parametroService.
      ConsultarParametro(Enumerator.MIN_PHOTOS_INFRASTRUCTURETYPE_CORRAL_BARN);
    const maxPhotosCorralBarnParm = this.parametroService.
      ConsultarParametro(Enumerator.MAX_PHOTOS_INFRASTRUCTURETYPE_CORRAL_BARN);
    const minSizePhotosParm = this.parametroService.
      ConsultarParametro(Enumerator.MIN_SIZE_PHOTOS_INFRASTRUCTURE);
    const maxSizePhotosParm = this.parametroService.
      ConsultarParametro(Enumerator.MAX_SIZE_PHOTOS_INFRASTRUCTURE);
    const infrastructureTypeList = this.parametroService.
      ConsultarParametro(Enumerator.INFRASTRUCTURETYPE_CATALOG);

    forkJoin([executedCostParm, minPhotosReservoirTankParm,
      maxPhotosReservoirTankParm, minPhotosCorralBarnParm,
      maxPhotosCorralBarnParm, minSizePhotosParm,
      maxSizePhotosParm, infrastructureTypeList]).subscribe(
        (res) => {
          this.executedCostMaxValue = Number(res[0]?.resultData[0].valor);
          this.dataBaseOffline.insertDataParametro(res[0].resultData[0], Enumerator.INFRASTRUCTURE_EXECUTED_COST);
          this.minPhotosReservoirTank = Number(res[1]?.resultData[0].valor);
          this.dataBaseOffline.insertDataParametro(res[1].resultData[0], Enumerator.MIN_PHOTOS_INFRASTRUCTURETYPE_RESERVOIR_TANK);
          this.maxPhotosReservoirTank = Number(res[2]?.resultData[0].valor);
          this.dataBaseOffline.insertDataParametro(res[2].resultData[0], Enumerator.MAX_PHOTOS_INFRASTRUCTURETYPE_RESERVOIR_TANK);
          this.minPhotosCorralBarn = Number(res[3]?.resultData[0].valor);
          this.dataBaseOffline.insertDataParametro(res[3].resultData[0], Enumerator.MIN_PHOTOS_INFRASTRUCTURETYPE_CORRAL_BARN);
          this.maxPhotosCorralBarn = Number(res[4]?.resultData[0].valor);
          this.dataBaseOffline.insertDataParametro(res[4].resultData[0], Enumerator.MAX_PHOTOS_INFRASTRUCTURETYPE_CORRAL_BARN);
          this.minSizePhotos = Number(res[5]?.resultData[0].valor);
          this.dataBaseOffline.insertDataParametro(res[5].resultData[0], Enumerator.MIN_SIZE_PHOTOS_INFRASTRUCTURE);
          this.maxSizePhotos = Number(res[6]?.resultData[0].valor);
          this.dataBaseOffline.insertDataParametro(res[6].resultData[0], Enumerator.MAX_SIZE_PHOTOS_INFRASTRUCTURE);
          this.infrastructureTypeList = res[7]?.resultData;
        }
      );
  }

  async InitializeInfrastructureParamsOffLine() {
    // call
    this.dataBaseOffline = new DatabaseComponent(this.sqlite, this.persistence);

    this.databaseComponent = new DatabaseComponent(this.sqlite, this.persistence);
    const executedCostParm = await
      this.dataBaseOffline.selectDataParametro(Enumerator.INFRASTRUCTURE_EXECUTED_COST);
    const minPhotosReservoirTankParm = await
      this.dataBaseOffline.selectDataParametro(Enumerator.MIN_PHOTOS_INFRASTRUCTURETYPE_RESERVOIR_TANK);
    const maxPhotosReservoirTankParm = await
      this.dataBaseOffline.selectDataParametro(Enumerator.MAX_PHOTOS_INFRASTRUCTURETYPE_RESERVOIR_TANK);
    const minPhotosCorralBarnParm = await
      this.dataBaseOffline.selectDataParametro(Enumerator.MIN_PHOTOS_INFRASTRUCTURETYPE_CORRAL_BARN);
    const maxPhotosCorralBarnParm = await
      this.dataBaseOffline.selectDataParametro(Enumerator.MAX_PHOTOS_INFRASTRUCTURETYPE_CORRAL_BARN);
    const minSizePhotosParm = await
      this.dataBaseOffline.selectDataParametro(Enumerator.MIN_SIZE_PHOTOS_INFRASTRUCTURE);
    const maxSizePhotosParm = await
      this.dataBaseOffline.selectDataParametro(Enumerator.MAX_SIZE_PHOTOS_INFRASTRUCTURE);

    forkJoin([executedCostParm, minPhotosReservoirTankParm,
      maxPhotosReservoirTankParm, minPhotosCorralBarnParm,
      maxPhotosCorralBarnParm, minSizePhotosParm,
      maxSizePhotosParm]).subscribe(
        (res) => {
          this.executedCostMaxValue = Number(res[0]?.valor);
          this.minPhotosReservoirTank = Number(res[1]?.valor);
          this.maxPhotosReservoirTank = Number(res[2]?.valor);
          this.minPhotosCorralBarn = Number(res[3]?.valor);
          this.maxPhotosCorralBarn = Number(res[4]?.valor);
          this.minSizePhotos = Number(res[5]?.valor);
          this.maxSizePhotos = Number(res[6]?.valor);
        }
      );
  }


  ExecutedCostChange() {
    if (this.infrastructureFormGroup.controls.executedCost.value !== '$0') {
      this.infrastructureFormGroup.controls.infrastructureType.setValidators([Validators.required]);
    }
    else {
      this.infrastructureFormGroup.controls.infrastructureType.setValidators([]);
    }
    this.infrastructureFormGroup.controls.infrastructureType.updateValueAndValidity();

    this.verificationDigitComponent = new VerificationDigitComponent();
    this.infrastructureFormGroup.controls.executedCost.setValue(
      this.verificationDigitComponent.InputChange(
        this.infrastructureFormGroup.controls.executedCost.value));

    (this.infrastructureFormGroup.controls.executedCost.value && (this.infrastructureFormGroup.controls.executedCost.value.includes(',') || this.infrastructureFormGroup.controls.executedCost.value.includes('.')))
    ? this.executedCostValueError = true : this.executedCostValueError = false;

    this.CheckExecutedCostValue();
    this.checkExecutedCostLength();
  }

  InfrastructureTypeChange() {
    this.InitializeInfrastructureTypeForm();
    const optionSelected = this.infrastructureFormGroup.controls.infrastructureType.value;

    if (optionSelected !== '') {
      switch (Number(optionSelected)) {
        case Enumerator.INFRASTRUCTURETYPE_RESERVOIR_TANK:
          this.supportTypeList[0].minPictures = this.minPhotosReservoirTank;
          this.supportTypeList[0].maxPictures = this.maxPhotosReservoirTank;
          this.supportTypeList[1].minPictures = this.minPhotosReservoirTank;
          this.supportTypeList[1].maxPictures = this.maxPhotosReservoirTank;
          break;

        case Enumerator.INFRASTRUCTURETYPE_CORRAL_BARN:
          this.supportTypeList[0].minPictures = this.minPhotosCorralBarn;
          this.supportTypeList[0].maxPictures = this.maxPhotosCorralBarn;
          this.supportTypeList[1].minPictures = this.minPhotosCorralBarn;
          this.supportTypeList[1].maxPictures = this.maxPhotosCorralBarn;
          break;

        default:
          break;
      }
    }
  }

  async DeleteMedia(x: number, y: number) {
    const alert = await this.alertController.create({
      cssClass: 'contenedor-principal',
      header: 'Confirmación',
      message: '<strong>¿Está seguro que desea eliminar esta foto? </strong> ' +
              '<p class="alertmsg">RECUERDE QUE LOS CAMBIOS SOLO SE APLICARÁN UNA VEZ DE CLICK EN EL BOTÓN GUARDAR DE ESTE FORMULARIO</p>',
      buttons: [
        {
          text: 'Cancelar',
          role: 'cancel',
          handler: () => { }
        }, {
          text: 'Aceptar',
          handler: () => {
            var o = this.supportTypeList[x].thumbnails[y].metadata;
            this.supportTypeList[x].thumbnails.splice(y, 1);
            if (o !== undefined && o != null) {
              o.id = -1;
			        o.tipo = 0;
              this.supportTypeListAux.push(o);
            }

            if (this.supportTypeList[0].thumbnails.length === 0) {
              this.cantidadMinGeneral = false;
            }

            if (this.supportTypeList[1].thumbnails.length === 0) {
              this.cantidadMinGeneral = false;
            }
          }
        }
      ]
    });
    await alert.present();
  }

  async HandleMedia(event: Thumbnail, index: number) {
    const optionSelected = this.infrastructureFormGroup.controls.infrastructureType.value;

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

    // Validamos minimo de imagenes
    if (optionSelected !== '') {
      switch (Number(optionSelected)) {
        case Enumerator.INFRASTRUCTURETYPE_RESERVOIR_TANK:

          // cantidad fotos
          if (this.supportTypeList[0].thumbnails.length >= this.minPhotosReservoirTank &&
            this.supportTypeList[1].thumbnails.length >= this.minPhotosReservoirTank) {
            this.cantidadMinimaFotosReservoirTank = true;
            this.cantidadMinGeneral = true;
          } else {
            this.cantidadMinimaFotosReservoirTank = false;
            this.cantidadMinGeneral = false;
          }

          break;

        case Enumerator.INFRASTRUCTURETYPE_CORRAL_BARN:
          // cantidad fotos
          if (this.supportTypeList[0].thumbnails.length >= this.minPhotosCorralBarn &&
            this.supportTypeList[1].thumbnails.length >= this.minPhotosCorralBarn) {
            this.cantidadMinimaFotosCorralBarn = true;
            this.cantidadMinGeneral = true;
          } else {
            this.cantidadMinimaFotosCorralBarn = false;
            this.cantidadMinGeneral = false;
          }

          break;
      }
    }
  }

  LengthOrWidthChange() {
    if (Number(this.infrastructureFormGroup.controls.infrastructureType.value) ===
      Enumerator.INFRASTRUCTURETYPE_RESERVOIR_TANK ||
      Number(this.infrastructureFormGroup.controls.infrastructureType.value) ===
      Enumerator.INFRASTRUCTURETYPE_CORRAL_BARN) {
      if ((this.infrastructureTypeFormGroup.controls.length.value === '' ||
        this.infrastructureTypeFormGroup.controls.length.value === null ||
        this.infrastructureTypeFormGroup.controls.length.value === 0) &&
        (this.infrastructureTypeFormGroup.controls.width.value === '' ||
          this.infrastructureTypeFormGroup.controls.width.value === null ||
          this.infrastructureTypeFormGroup.controls.width.value === 0)) {
        this.circumference = false;
        this.infrastructureTypeFormGroup.controls.circumference.setValidators
          ([Validators.required, Validators.max(100), Validators.min(2)]);
      }
      else {

        if (Number(this.infrastructureFormGroup.controls.infrastructureType.value) ===
          Enumerator.INFRASTRUCTURETYPE_RESERVOIR_TANK) {
          this.infrastructureTypeFormGroup.controls.height.setValidators
            ([]);
          this.infrastructureTypeFormGroup.controls.height.setErrors(null);
          this.infrastructureTypeFormGroup.controls.numberCompartments.setValidators([]);
          this.infrastructureTypeFormGroup.controls.numberCompartments.setErrors(null);
        }

        if (Number(this.infrastructureFormGroup.controls.infrastructureType.value) ===
          Enumerator.INFRASTRUCTURETYPE_CORRAL_BARN) {
          this.infrastructureTypeFormGroup.controls.height.setValidators
            ([Validators.required, Validators.max(100), Validators.min(2),Validators.pattern('\\d*')]);
          this.infrastructureTypeFormGroup.controls.numberCompartments.setValidators
            ([Validators.required, Validators.max(50), Validators.min(0),Validators.pattern('\\d*')]);
          this.infrastructureTypeFormGroup.controls.deep.setValidators
            ([]);
          this.infrastructureTypeFormGroup.controls.deep.setErrors(null);
        }


        this.infrastructureTypeFormGroup.controls.circumference.setValidators([]);
        this.infrastructureTypeFormGroup.controls.circumference.setValue(0);
        this.circumference = true;
      }

      (this.infrastructureTypeFormGroup.controls.length.value < 0.1) ? this.decimalLengthError = true : this.decimalLengthError = false;
      (this.infrastructureTypeFormGroup.controls.width.value < 0.1) ? this.decimalWidthError = true : this.decimalWidthError = false;
    }
    this.infrastructureTypeFormGroup.updateValueAndValidity();
  }

  deepOnChange() {
    if (Number(this.infrastructureFormGroup.controls.infrastructureType.value) ===
    Enumerator.INFRASTRUCTURETYPE_RESERVOIR_TANK) {
      this.infrastructureTypeFormGroup.controls.deep.setValidators([Validators.required, Validators.max(100)]);
      (this.infrastructureTypeFormGroup.controls.deep.value < 0.1) ? this.decimalDeepError = true : this.decimalDeepError = false;
    }
  }

  CircumferenceChange() {
    if (Number(this.infrastructureFormGroup.controls.infrastructureType.value) ===
      Enumerator.INFRASTRUCTURETYPE_RESERVOIR_TANK ||
      Number(this.infrastructureFormGroup.controls.infrastructureType.value) ===
      Enumerator.INFRASTRUCTURETYPE_CORRAL_BARN) {
      if (this.infrastructureTypeFormGroup.controls.circumference.value === '' ||
        this.infrastructureTypeFormGroup.controls.circumference.value === null ||
        this.infrastructureTypeFormGroup.controls.circumference.value === 0) {
        this.lengthOrWidth = false;
        this.infrastructureTypeFormGroup.controls.length.setValidators
          ([Validators.required, Validators.max(100)]);
        this.infrastructureTypeFormGroup.controls.width.setValidators
          ([Validators.required, Validators.max(100)]);
          this.LengthOrWidthChange();
      }
      else {
        this.infrastructureTypeFormGroup.controls.length.setValidators([]);
        this.infrastructureTypeFormGroup.controls.width.setValidators([]);
        this.infrastructureTypeFormGroup.controls.length.setValue(0);
        this.infrastructureTypeFormGroup.controls.width.setValue(0);
        this.lengthOrWidth = true;
        setTimeout(() => {
          this.decimalLengthError = false;
          this.decimalWidthError = false;
        }, 20);
      }
      if (Number(this.infrastructureFormGroup.controls.infrastructureType.value) ===
        Enumerator.INFRASTRUCTURETYPE_RESERVOIR_TANK) {
        this.infrastructureTypeFormGroup.controls.deep.setValidators
          ([Validators.required, Validators.max(100)]);
        this.infrastructureTypeFormGroup.controls.height.setValidators
          ([]);
        this.infrastructureTypeFormGroup.controls.height.setErrors(null);
        this.infrastructureTypeFormGroup.controls.numberCompartments.setValidators([]);
        this.infrastructureTypeFormGroup.controls.numberCompartments.setErrors(null);
      }

      if (Number(this.infrastructureFormGroup.controls.infrastructureType.value) ===
        Enumerator.INFRASTRUCTURETYPE_CORRAL_BARN) {
        this.infrastructureTypeFormGroup.controls.height.setValidators
          ([Validators.required, Validators.max(100), Validators.min(2),Validators.pattern('\\d*')]);
        this.infrastructureTypeFormGroup.controls.numberCompartments.setValidators
          ([Validators.required, Validators.max(50), Validators.min(0),Validators.pattern('\\d*')]);
        this.infrastructureTypeFormGroup.controls.deep.setValidators
          ([]);
        this.infrastructureTypeFormGroup.controls.deep.setErrors(null);
      }
    }
    this.infrastructureTypeFormGroup.updateValueAndValidity();
  }

  Calculation() {
    if (!this.circumference && !this.lengthOrWidth) {
      this.infrastructureTypeFormGroup.controls.calculation.setValue(0);
    }
    if (Number(this.infrastructureFormGroup.controls.infrastructureType.value) ===
      Enumerator.INFRASTRUCTURETYPE_RESERVOIR_TANK) {
      if (this.circumference) {
        if (
          (this.infrastructureTypeFormGroup.controls.length.value !== '' &&
            this.infrastructureTypeFormGroup.controls.length.value !== null) &&
          (this.infrastructureTypeFormGroup.controls.width.value !== '' &&
            this.infrastructureTypeFormGroup.controls.width.value !== null) &&
          (this.infrastructureTypeFormGroup.controls.deep.value !== '' &&
            this.infrastructureTypeFormGroup.controls.deep.value !== null)
        ) {
          const l = this.infrastructureTypeFormGroup.controls.length.value;
          const w = this.infrastructureTypeFormGroup.controls.width.value;
          const d = this.infrastructureTypeFormGroup.controls.deep.value;
          this.infrastructureTypeFormGroup.controls.calculation.setValue((l * w * d).toFixed(2));
        }
        else {
          this.infrastructureTypeFormGroup.controls.calculation.setValue(0);
        }
      }
      if (this.lengthOrWidth) {
        if (
          (this.infrastructureTypeFormGroup.controls.circumference.value !== '' &&
            this.infrastructureTypeFormGroup.controls.circumference.value !== null) &&
          (this.infrastructureTypeFormGroup.controls.deep.value !== '' &&
            this.infrastructureTypeFormGroup.controls.deep.value !== null)
        ) {
          const c = this.infrastructureTypeFormGroup.controls.circumference.value;
          const d = this.infrastructureTypeFormGroup.controls.deep.value;
          this.infrastructureTypeFormGroup.controls.calculation.setValue((c * d).toFixed(2));
        }
        else {
          this.infrastructureTypeFormGroup.controls.calculation.setValue(0);
        }
      }
    }
    if (Number(this.infrastructureFormGroup.controls.infrastructureType.value) ===
      Enumerator.INFRASTRUCTURETYPE_CORRAL_BARN) {
      if (this.circumference) {
        if (
          (this.infrastructureTypeFormGroup.controls.length.value !== '' &&
            this.infrastructureTypeFormGroup.controls.length.value !== null) &&
          (this.infrastructureTypeFormGroup.controls.width.value !== '' &&
            this.infrastructureTypeFormGroup.controls.width.value !== null) &&
          (this.infrastructureTypeFormGroup.controls.height.value !== '' &&
            this.infrastructureTypeFormGroup.controls.height.value !== null)
        ) {
          const l = this.infrastructureTypeFormGroup.controls.length.value;
          const w = this.infrastructureTypeFormGroup.controls.width.value;
          const d = this.infrastructureTypeFormGroup.controls.height.value;
          this.infrastructureTypeFormGroup.controls.calculation.setValue((l * w).toFixed(2));
        }
        else {
          this.infrastructureTypeFormGroup.controls.calculation.setValue(0);
        }
      }
      if (this.lengthOrWidth) {
        if (
          (this.infrastructureTypeFormGroup.controls.circumference.value !== '' &&
            this.infrastructureTypeFormGroup.controls.circumference.value !== null) &&
          (this.infrastructureTypeFormGroup.controls.height.value !== '' &&
            this.infrastructureTypeFormGroup.controls.height.value !== null)
        ) {
          const c = this.infrastructureTypeFormGroup.controls.circumference.value;
          const d = this.infrastructureTypeFormGroup.controls.height.value;
          this.infrastructureTypeFormGroup.controls.calculation.setValue((c * d).toFixed(2));
        }
        else {
          this.infrastructureTypeFormGroup.controls.calculation.setValue(0);
        }
      }
    }
    this.infrastructureTypeFormGroup.updateValueAndValidity();
  }

  async InsertarRubroInfraestructura(rubroAux: RubroInfraestructuraAux, navegacion) {
    this.rubroService.InsertarRubroInfraestructura(rubroAux).subscribe(
       (res: HttpResponse<any>) => {
        if (res.responseCode === Enumerator.HTTP_RESPONSE_OK) {
          let rubroOffline = res.resultData[0].rubro;
          rubroOffline.rubroInfraestructura = res.resultData[0].rubroInfraestructura;
          this.insertarRubroInfraestructuraOffLine(rubroOffline, false);
          this.resourceService.GetResourceValues().then(
            (data) => {
              this.toasterService.PresentToastMessage(data['mobile.generics.Saved']);
              if (navegacion) {
                this.router.navigate(['/rubro']);
              }
            }
          );
        }
      }
    );
  }

  async OnSubmit() {
    this.loadingService.loadingPresent();
    const rubro = await this.GetInfrastructureForm();
    let rubroOffline = new Rubro();
    rubroOffline = rubro.rubro;
    rubroOffline.rubroInfraestructura = rubro.rubroInfraestructura;
    const rubroAux = new RubroInfraestructuraAux();
    rubroAux.Rubro = rubro.rubro;
    rubroAux.RubroInfraestructura = rubro.rubroInfraestructura;

    if (this.parametroType.length > 0) {
      rubroAux.Rubro.codigoTipoRubro = this.parametroType.find(parametro =>
        parametro.codigo.toString() === rubroAux.Rubro.codigoTipoRubro.toString()).id.toString();
    }

    // mode en linea
    if (this.resourceService.IsOnline()) {
      // Se agrego un segundo parametro de entrada al servicio, para redireccionar o no a la pantalla rubro
      // True, redirecciona a rubro. False, se mantiene en la pantalla principal (logica de destanqueo)
      await this.InsertarRubroInfraestructura(rubroAux, true);
    } else {
      // El segundo parametro "false", indica que se ha gurdado offline y se debe hacer destanqueo
      // modo fuera de linea
      await this.insertarRubroInfraestructuraOffLine(rubroOffline, false);
      this.resourceService.GetResourceValues().then(
        (data) => {
          this.loadingService.loadingDismiss();
          this.toasterService.PresentToastMessage(data['mobile.generics.SavedOffline']);
          this.router.navigate(['/rubro']);
        }
      );
    }
  }


  async insertarRubroInfraestructuraOffLine(rubro: Rubro, rubroGuardado: boolean) {
    rubro.guid = this.heading.guidRubro;
    rubro.codigoObligacion = this.heading.obligacion;

    this.databaseComponent = new DatabaseComponent(this.sqlite, this.persistence);
    // Rubro
    let datosRubro = await this.dataBaseOffline.selectDataRubro(rubro.guid, rubro.codigoObligacion);
    if (datosRubro.length > 0) {
      await this.dataBaseOffline.deleteDataRubro(rubro.guid, rubro.codigoObligacion);
    }

    if (!rubro.estadoObligacion) {
      rubro.estadoObligacion = 0;
    }

    await this.dataBaseOffline.insertDataRubro(rubro, rubroGuardado, Enumerator.CODIGO_INFRASTRUCTURA);
    // Check table rubro
    datosRubro = await this.dataBaseOffline.selectDataRubro(rubro.guid, rubro.codigoObligacion);

    // Metadata
    let datosMetadata = await this.dataBaseOffline.
      selectDataMetaDataFoto(rubro.guid, rubro.codigoObligacion);
    if (datosMetadata.length > 0) {
      await this.dataBaseOffline.deleteDataMetaDataFoto(rubro.guid, rubro.codigoObligacion);
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
        await this.dataBaseOffline.
          insertDataMetaDataFoto(rubro.guid, metadata, rubro.codigoObligacion);
      }

      this.cantidadMinGeneral = true;
    }

    // Check table metadata
    datosMetadata = await this.dataBaseOffline.selectDataMetaDataFoto(rubro.guid, rubro.codigoObligacion);

    // Insertamos infraestructura
    let datosRubroInfraestructura = await this.dataBaseOffline.selectDataRubroInfraestructura(rubro.id);
    if (datosRubroInfraestructura.length > 0) {
      await this.dataBaseOffline.deleteDataRubroInfraestructura(rubro.id);
    }

    // insertamos datos rubro infraestructura
    await this.dataBaseOffline.insertDataRubroInfraestructura(rubro.rubroInfraestructura);

    // Check table rubro infraestructura
    datosRubroInfraestructura = await this.dataBaseOffline.selectDataRubroInfraestructura(rubro.id);

  }

  async GetInfrastructureForm(): Promise<Rubro> {
    const rubroInfraestructura: Rubro = new Rubro();
    const user: Login = this.resourceService.GetUser();

    rubroInfraestructura.rubro = new Rubro();
    rubroInfraestructura.rubroInfraestructura = new RubroInfraestructura();
    rubroInfraestructura.rubro.tipoIdentificacion = getDocumentTypeRubro( this.tiposDocumento, this.heading );
    rubroInfraestructura.rubro.codigoObligacion = this.heading.obligacion;
    rubroInfraestructura.rubro.numeroIdentificacion = this.heading.numeroDocumento ? this.heading.numeroDocumento : this.heading.identificacionCliente;
    rubroInfraestructura.rubro.descripcion = this.heading.descripcionRubro;
    rubroInfraestructura.rubro.codigoTipoRubro = this.heading.codigoRubro;
    rubroInfraestructura.rubro.fechaCreacion = new Date().toISOString();
    rubroInfraestructura.rubro.fechaModificacion = new Date().toISOString();
    rubroInfraestructura.rubro.usuarioCreacion = user.usuario;
    rubroInfraestructura.rubro.usuarioModificacion = user.usuario;
    rubroInfraestructura.rubro.idCase = this.heading.idCase;
    rubroInfraestructura.rubro.id = this.idAux;
    rubroInfraestructura.rubro.guid = this.heading.guidRubro;
    rubroInfraestructura.rubro.fechaLimiteAutoGestion = this.heading.fechaLimiteAutogestion;

    rubroInfraestructura.rubroInfraestructura.nombrePredioObjInversion =
      this.infrastructureFormGroup.controls.landName.value;
    rubroInfraestructura.rubroInfraestructura.fechaInicioEjecucion =
      this.infrastructureFormGroup.controls.executionInitDate.value;
    rubroInfraestructura.rubroInfraestructura.fechaFinEjecucion =
      this.infrastructureFormGroup.controls.executionEndDate.value;
    rubroInfraestructura.rubroInfraestructura.idRubro = this.idAux;
    rubroInfraestructura.rubro.costoEjecutado =
      this.infrastructureFormGroup.controls.executedCost.value.toString().replace('$', '');

    if (this.infrastructureFormGroup.controls.infrastructureType.value !== '') {
      rubroInfraestructura.rubroInfraestructura.idTipoInfraestructura =
        this.infrastructureFormGroup.controls.infrastructureType.value;

      // Largo y Ancho
      if (this.infrastructureTypeFormGroup.controls.length.value > 0
        || this.infrastructureTypeFormGroup.controls.width.value > 0) {
        rubroInfraestructura.rubroInfraestructura.largo =
          this.infrastructureTypeFormGroup.controls.length.value;
        rubroInfraestructura.rubroInfraestructura.ancho =
          this.infrastructureTypeFormGroup.controls.width.value;
      }

      // Circunferencia
      if (this.infrastructureTypeFormGroup.controls.circumference.value > 0) {
        rubroInfraestructura.rubroInfraestructura.circunferencia =
          this.infrastructureTypeFormGroup.controls.circumference.value;
      }

      // Altura o Profundidad

      if (Number(this.infrastructureFormGroup.controls.infrastructureType.value) ===
        Enumerator.INFRASTRUCTURETYPE_RESERVOIR_TANK) {
        rubroInfraestructura.rubroInfraestructura.profundidad =
          this.infrastructureTypeFormGroup.controls.deep.value;
      }

      if (Number(this.infrastructureFormGroup.controls.infrastructureType.value) ===
        Enumerator.INFRASTRUCTURETYPE_CORRAL_BARN) {
        rubroInfraestructura.rubroInfraestructura.numeroDivisiones =
          this.infrastructureTypeFormGroup.controls.numberCompartments.value;
        rubroInfraestructura.rubroInfraestructura.altura =
          this.infrastructureTypeFormGroup.controls.height.value;
      }

      rubroInfraestructura.rubroInfraestructura.calculoArea =
        this.infrastructureTypeFormGroup.controls.calculation.value;
    }

    // Get Media
    rubroInfraestructura.rubro.listaMetaDataFoto = await this.GetMediaForm();

    // rejection history
    this.databaseComponent = new DatabaseComponent(this.sqlite, this.persistence);
    const response = await this.databaseComponent.selectRemanagementRubro( this.heading.idCase, this.heading.obligacion, this.infraestructuraRubroType );
    
    if ( this.obligationState === Enumerator.ESTADO_OBLIGACION_RECHAZADO && response.length === 0 ) {
      rubroInfraestructura.rubro.id = 0;
      rubroInfraestructura.rubroInfraestructura.idRubro = 0;
      rubroInfraestructura.rubro.listaMetaDataFoto = rubroInfraestructura.rubro.listaMetaDataFoto.filter((image) => image.id != -1);
      rubroInfraestructura.rubro.listaMetaDataFoto.forEach((image) => {
        image.id = 0;
        image.nombreArchivo = Guid.create().toString() + '.jpeg'
      })
      let RemanagementrubroInfraestructura : RemanagementRubro = new RemanagementRubro();
      RemanagementrubroInfraestructura.id = null;
      RemanagementrubroInfraestructura.idCase = this.heading.idCase;
      RemanagementrubroInfraestructura.codigoObligacion = this.heading.obligacion;
      RemanagementrubroInfraestructura.tipoRubro = this.infraestructuraRubroType;
      this.databaseComponent = new DatabaseComponent(this.sqlite, this.persistence);
      this.databaseComponent.insertRemanagementRubro( RemanagementrubroInfraestructura );
    }
    //

    return rubroInfraestructura;
  }

  ExecutedCostBlur() {
    this.verificationDigitComponent = new VerificationDigitComponent();
    this.infrastructureFormGroup.controls.executedCost.setValue(
      this.verificationDigitComponent.InputBlur(
        this.infrastructureFormGroup.controls.executedCost.value));

    if (this.infrastructureFormGroup.controls.executedCost.value) {
      const decimalExecutedCost = `${this.infrastructureFormGroup.controls.executedCost.value.charAt(0)}${this.infrastructureFormGroup.controls.executedCost.value.charAt(1)}`;
      const afterDecimal = `${this.infrastructureFormGroup.controls.executedCost.value.charAt(2)}`;
      setTimeout(() => {
        (decimalExecutedCost === '$0' && afterDecimal !== '') ? this.executedCostValueError = true : this.executedCostValueError = false;
      }, 100);
    }

    this.CheckExecutedCostValue();
    this.checkExecutedCostLength();
  }

  checkExecutedCostLength() {
    (!this.executedCostMaxError && this.infrastructureFormGroup.controls.executedCost?.value.length > 16)
    ? this.executedCostMaxLength = this.infrastructureFormGroup.controls.executedCost.value.length
    : this.executedCostMaxLength = 16;
  }

  ExecutedCostFocus() {
    this.verificationDigitComponent = new VerificationDigitComponent();
    this.infrastructureFormGroup.controls.executedCost.setValue(
      this.verificationDigitComponent.InputFocus(
        this.infrastructureFormGroup.controls.executedCost.value));
  }

  FillForm(rubro: Array<Rubro>) {
    this.loadingService.loadingPresent();
    if (rubro !== null) {
      if (rubro.length > 0) {
        // Formulario Infraestructura
        if (rubro[0].rubroInfraestructura !== null) {
          this.infrastructureFormGroup.controls.landName.
            setValue(rubro[0].rubroInfraestructura.nombrePredioObjInversion);
          this.infrastructureFormGroup.controls.executionInitDate.
            setValue(rubro[0].rubroInfraestructura.fechaInicioEjecucion);
          this.infrastructureFormGroup.controls.executionEndDate.
            setValue(rubro[0].rubroInfraestructura.fechaFinEjecucion);

          if (rubro[0].rubro !== null) {
            this.idAux = rubro[0].rubro.id;
            this.ExecutedCostFocus();
            this.infrastructureFormGroup.controls.executedCost.setValue(rubro[0].rubro.costoEjecutado);
            this.ExecutedCostChange();
            this.ExecutedCostBlur();
          }

          this.infrastructureFormGroup.controls.infrastructureType.
            setValue(rubro[0].rubroInfraestructura.idTipoInfraestructura.toString());
          this.InfrastructureTypeChange();


          // Formulario Tipo Infraestructura
          if (rubro[0].rubroInfraestructura.largo > 0
            || rubro[0].rubroInfraestructura.ancho > 0) {
            this.infrastructureTypeFormGroup.controls.length.setValue(rubro[0].rubroInfraestructura.largo);
            this.infrastructureTypeFormGroup.controls.width.setValue(rubro[0].rubroInfraestructura.ancho);

          }

          if (rubro[0].rubroInfraestructura.circunferencia > 0) {
            this.infrastructureTypeFormGroup.controls.circumference.
              setValue(rubro[0].rubroInfraestructura.circunferencia);

          }

          if (Number(this.infrastructureFormGroup.controls.infrastructureType.value) ===
            Enumerator.INFRASTRUCTURETYPE_RESERVOIR_TANK) {
            this.infrastructureTypeFormGroup.controls.deep.
              setValue(rubro[0].rubroInfraestructura.profundidad);
          }

          if (Number(this.infrastructureFormGroup.controls.infrastructureType.value) ===
            Enumerator.INFRASTRUCTURETYPE_CORRAL_BARN) {
            this.infrastructureTypeFormGroup.controls.numberCompartments.
              setValue(rubro[0].rubroInfraestructura.numeroDivisiones);
            this.infrastructureTypeFormGroup.controls.height.setValue(rubro[0].rubroInfraestructura.altura);
          }

          this.infrastructureTypeFormGroup.controls.calculation.
            setValue(rubro[0].rubroInfraestructura.calculoArea);
        }
        const photos = rubro[0].rubro.listaMetaDataFoto;
        this.FillPhotos(photos);


        this.LengthOrWidthChange();
        this.CircumferenceChange();
        this.Calculation();
        this.infrastructureFormGroup.updateValueAndValidity();
        this.infrastructureTypeFormGroup.updateValueAndValidity();
        if (this.loadingService.isLoading) {
          this.loadingService.loadingDismiss();
        }
      }
    }
  }

  async GetMediaForm(): Promise<Array<MetaDataFoto>> {
    const mediaList: Array<MetaDataFoto> = [];

    for (const support of this.supportTypeList[0].thumbnails) {
      const nombre = await this.UploadMedia(support);
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
      support.metadata.tipo = Enumerator.ID_SUPPORTS_INVESTMENT_PHOTO;
      mediaList.push(support.metadata);
    }

    for (const support of this.supportTypeList[1].thumbnails) {
      const nombre = await this.UploadMedia(support);
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
      support.metadata.tipo = Enumerator.ID_SUPPORTS_BILLS_PHOTO;
      mediaList.push(support.metadata);
    }
    for (var support of this.supportTypeListAux) {
      mediaList.push(support);
    }
    return mediaList;
  }

  async UploadMedia(media: Thumbnail) {
    const photo: Photo = {
      guid: media.metadata != null && media.metadata !== undefined &&
        media.metadata.nombreArchivo != null && media.metadata.nombreArchivo !== undefined ? 
        media.metadata.nombreArchivo : Guid.create().toString() + '.jpeg',
      photoBase64: media.photoBase64
    };

    if(photo.guid == 'Nombre Archivo'){
      photo.guid = Guid.create().toString() + '.jpeg'
    }
      
    return photo.guid;
  }

  FillPhotos(media) {
    if (media !== null) {
      for (const photo of media.filter(m => m.tipo === Enumerator.ID_SUPPORTS_INVESTMENT_PHOTO)) {
        const thumbnail: Thumbnail = {
          id: photo.id,
          metadata: photo,
          src: `${environment.urlStorage.url}${photo.nombreArchivo}`,
          photoBase64: photo.base64
        };
        //Offline
        if (!this.resourceService.IsOnline()) {
          thumbnail.src = thumbnail.photoBase64;
        }
        this.supportTypeList[0].thumbnails.push(thumbnail);
      }

      for (const photo of media.filter(m => m.tipo === Enumerator.ID_SUPPORTS_BILLS_PHOTO)) {
        const thumbnail: Thumbnail = {
          id: photo.nombreArchivo, 'metadata': photo,
          src: `${environment.urlStorage.url}${photo.nombreArchivo}`,
          photoBase64: photo.base64
        };
        //Offline
        if (!this.resourceService.IsOnline()) {
          thumbnail.src = thumbnail.photoBase64;
        }
        this.supportTypeList[1].thumbnails.push(thumbnail);
      }
      const arregloEliminadas = media.filter(m => m.tipo === 0);
      for (const photo of arregloEliminadas) {
        this.supportTypeListAux.push(photo);
      }
      this.cantidadMinGeneral = true;
    }
  }


  ConsultarParametroGetId() {

    this.parametroService.ConsultarParametro(Enumerator.RUBRO_TYPE)
      .subscribe(
        (res) => {
          this.parametroType = res.resultData;
        },
        (err) => { }
      );
  }

  async ConsultarParametroGetIdOffline() {
    // Check rubro type
    this.databaseComponent = new DatabaseComponent(this.sqlite, this.persistence);
    this.parametroType = await
      this.dataBaseOffline.selectDataParametro(Enumerator.RUBRO_TYPE);
  }

  async ValidarformatoImagen(support: string): Promise<boolean> {
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
    // Check file size from base64 string in Kbytes
    const size = ((base64.length * (3 / 4)) / 1000);

    if (size <= (this.maxSizePhotos * 1000) &&
      size >= (this.minSizePhotos * 1000)) {
      return true;
    }
    else {
      const alert = await this.alertController.create({
        cssClass: 'contenedor-principal',
        header: 'Confirmación',
        message: `<strong>Únicamente se permiten imágenes que pesen menos de
          ${this.maxSizePhotos} Mb y más de ${this.minSizePhotos}
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

  DateChange(event: any, initial: boolean) {
    if (initial) {
      const initialDate = new Date(event.value);
      const finalDate = new Date(this.infrastructureFormGroup.controls['executionEndDate'].value);
      this.validarfecha = initialDate <= finalDate;
    }
    else {
      const initialDate = new Date(this.infrastructureFormGroup.controls['executionInitDate'].value);
      const finalDate = new Date(event.value);
      this.validarfecha = initialDate <= finalDate;
    }
  }

  async FillFormOffline() {
    const heading = await this.dataBaseOffline.selectDataRubro(this.heading.guidRubro, this.heading.obligacion);

    if (heading.length > 0) {
      const detail = await this.dataBaseOffline.selectDataRubroInfraestructura(heading[0].id);
      if (detail.length > 0) {

        this.infrastructureFormGroup.controls.landName.
          setValue(detail[0].nombrePredioObjInversion);
        this.infrastructureFormGroup.controls.executionInitDate.
          setValue(new Date(detail[0].fechaInicioEjecucion).toISOString());
        this.infrastructureFormGroup.controls.executionEndDate.
          setValue(new Date(detail[0].fechaFinEjecucion).toISOString());


        this.idAux = heading[0].id
        this.obligationState = heading[0].estadoObligacion;
        this.ExecutedCostFocus();
        this.infrastructureFormGroup.controls.executedCost.setValue(heading[0].costoEjecutado);
        this.ExecutedCostChange();
        this.ExecutedCostBlur();

        this.infrastructureFormGroup.controls.infrastructureType.
          setValue(detail[0].idTipoInfraestructura.toString());
        this.InfrastructureTypeChange();

        if (detail[0].largo > 0
          || detail[0].ancho > 0) {
          this.infrastructureTypeFormGroup.controls.length.setValue(detail[0].largo);
          this.infrastructureTypeFormGroup.controls.width.setValue(detail[0].ancho);
        }

        if (detail[0].circunferencia > 0) {
          this.infrastructureTypeFormGroup.controls.circumference.
            setValue(detail[0].circunferencia);
        }

        if (Number(this.infrastructureFormGroup.controls.infrastructureType.value) ===
          Enumerator.INFRASTRUCTURETYPE_RESERVOIR_TANK) {
          this.infrastructureTypeFormGroup.controls.deep.
            setValue(detail[0].profundidad);
        }

        if (Number(this.infrastructureFormGroup.controls.infrastructureType.value) ===
          Enumerator.INFRASTRUCTURETYPE_CORRAL_BARN) {
          this.infrastructureTypeFormGroup.controls.numberCompartments.
            setValue(detail[0].numeroDivisiones);
          this.infrastructureTypeFormGroup.controls.height.setValue(detail[0].altura);
        }

        this.infrastructureTypeFormGroup.controls.calculation.
          setValue(detail[0].calculoArea);


        const photos = await this.dataBaseOffline.selectDataMetaDataFoto(this.heading.guidRubro, this.heading.obligacion);

        if (photos.length > 0) {
          this.FillPhotos(photos);
        }

        this.LengthOrWidthChange();
        this.CircumferenceChange();
        this.Calculation();
        this.infrastructureFormGroup.updateValueAndValidity();
        this.infrastructureTypeFormGroup.updateValueAndValidity();
        if (this.loadingService.isLoading) {
          this.loadingService.loadingDismiss();
        }
      }

    }
  }

  CheckExecutedCostValue() {
    // //Validamos Valor Máximo
    const executedCostInput = this.verificationDigitComponent.InputFocus(
      this.infrastructureFormGroup.controls.executedCost.value);
    this.executedCostMaxError = Number(executedCostInput) > this.executedCostMaxValue;
  }
}

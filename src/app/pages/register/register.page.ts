import { Component, OnInit, ViewChild } from '@angular/core';
import { FormGroup, FormBuilder, Validators } from '@angular/forms';
import { TranslateService } from '@ngx-translate/core';
import { Router } from '@angular/router';
import { VerificationDigitComponent } from 'src/app/shared/components/verification-digit/verification-digit.component';

import { ModalController } from '@ionic/angular';

import { ParametroService } from 'src/app/services/Parametro/parametro.service';
import { Catalogs } from 'src/app/shared/core/constants/catalog.enum';
import { Parametro } from 'src/app/shared/model/parametro';
import { IdentificationType } from 'src/app/shared/core/constants/identification-type.enum';
import { AuthorizationDataTreatmentPage } from '../authorization-data-treatment/authorization-data-treatment.page';
import { AuthorizationtermsConditionsPage } from '../authorizationterms-conditions/authorizationterms-conditions.page';
import { CobisService } from 'src/app/services/cobis/cobis.service';
import { IdentidadPersona } from 'src/app/shared/model/IdentidadPersona';
import { PersistenceService } from 'angular-persistence';
import { ToasterService } from 'src/app/services/toaster/toaster.service';
import { VerifyToken } from 'src/app/shared/model/verifyToken';
import { Usuario } from 'src/app/shared/model/usuario';
import { ResourceService } from 'src/app/services/resource/resource.service';

@Component({
  selector: 'app-register',
  templateUrl: './register.page.html',
  styleUrls: ['./register.page.scss'],
})

export class RegisterPage implements OnInit {
  @ViewChild(VerificationDigitComponent) verificationDigitComponent: VerificationDigitComponent;
  @ViewChild(AuthorizationtermsConditionsPage)
    authorizationTermsConditionsPage: AuthorizationtermsConditionsPage;
  @ViewChild(AuthorizationDataTreatmentPage) authorizationDataTreatmentPage: AuthorizationDataTreatmentPage;

  registerFormulario: FormGroup;
  digitoVerificacion = '';
  tipoDocumento: Array<Parametro>;
  mensajePasaporte = false;
  checkedTerminos = false;
  checkedDatos = false;
  mensajeAlertaFormulario = false;
  mensajeAlertaAutorizaciones = false;
  solicitudProceso = false;
  reintentarSolicitud = false;
  servicioFail = false;
  noService = false;
  sinRespuestaServicio = false;
  contador = 0;
  mostrarAutorizaciones = false;
  intervalId = null;
  intervalIdAux = null;
  checkedAutorizaTerms = false;
  checkedDataTreatment = false;
  responde = false;
  contadorAux = 0;
  bandera = false;
  mensajedeconexion = 'Lo sentimos, en este momento no podemos procesar su solicitud. Por favor intente más tarde';
  constructor(private readonly persistence: PersistenceService,
              private readonly formBuilder: FormBuilder, public translate: TranslateService,
              private readonly router: Router, private readonly parametroService: ParametroService,
              private readonly modalCtrl: ModalController, private readonly cobisService: CobisService,
              private readonly toasterService: ToasterService,
              private readonly resourceService: ResourceService) {
    this.translate.addLangs(['es', 'en']);
    this.translate.setDefaultLang('es');
    this.registerForm();
    this.ConsultarParametro();
  }

  ngOnInit() {
  }

  ionViewWillEnter() {
    this.persistence.set("intentosGeneracion",false);
    if (this.persistence.get('mostrarAutorizaciones') !== undefined) {
      this.mostrarAutorizaciones = JSON.parse(this.persistence.get('mostrarAutorizaciones'));
    } else {
      this.mostrarAutorizaciones = true;
    }
    this.registerFormulario.controls.NumeroIdentificacion.reset();
    this.registerFormulario.controls.DigitoVerificacion.reset();
    this.registerFormulario.controls.TipoIdentificacion.reset();
    this.establecerValoresDefault();
    this.inicializarValoresDefault();
    this.intervalTratamiento();
    this.intervalTerminos();
  }

  registerForm() {
    this.registerFormulario = this.formBuilder.group({
      TipoIdentificacion: ['', [Validators.required]],
      NumeroIdentificacion: ['', [Validators.required, Validators.maxLength(12)]],
      DigitoVerificacion: [''],
      terminosCondiciones: [false],
      tratamientoDatos: [false],
    });
  }

  calcularDigitoVerificacion(nit) {
    this.expresionRegular();
    if (this.registerFormulario.controls.TipoIdentificacion.value === IdentificationType.N) {
      if (nit.length <= 9){
        this.verificationDigitComponent = new VerificationDigitComponent();
        this.digitoVerificacion = this.verificationDigitComponent.calcularDigitoVerificacion(nit);
        this.registerFormulario.controls.DigitoVerificacion.setValue(this.digitoVerificacion);
      } else {
        let numeroDocumento = this.registerFormulario.controls.NumeroIdentificacion.value;
        numeroDocumento = numeroDocumento.substr(0, (numeroDocumento.length - 1));
        this.registerFormulario.controls.NumeroIdentificacion.setValue(numeroDocumento);
      }
    }
  }

  ConsultarParametro() {
    this.parametroService.ConsultarParametro(Catalogs.TipoDocumento).subscribe(
      res => {
        this.tipoDocumento = res.resultData;
      }, err => {
        
        if (err.name === 'HttpErrorResponse') {
          this.contadorAux = this.contadorAux + 1;
          if (this.contadorAux < 5) {
            setTimeout(() => {​​​​​
              this.ConsultarParametro();
            }​​​​​, 10000);
          }else{
          this.toasterService.PresentToastMessage(this.mensajedeconexion);
          }
        }
      });
  }

  cambioTipoIdentificacion() {
    this.registerFormulario.controls.NumeroIdentificacion.reset();
    this.registerFormulario.controls.DigitoVerificacion.reset();

    if (this.registerFormulario.controls.TipoIdentificacion.value === IdentificationType.PA) {
      this.mensajePasaporte = true;
    } else {
      this.mensajePasaporte = false;
    }
  }

  validarTerminosCondiciones(event) {
    if (!event && this.checkedAutorizaTerms)  {
      this.checkedAutorizaTerms = false;
      this.persistence.set('acceptaterminos', undefined);
    }

    if (!this.checkedAutorizaTerms) {

      if (!this.checkedTerminos) {
        this.registerFormulario.controls.terminosCondiciones.setValue(true);
        this.checkedTerminos = true;
      } else {
        this.registerFormulario.controls.terminosCondiciones.setValue(false);
        this.checkedTerminos = false;
        this.intervalTerminos();
      }
      this.validacionCampos();
    }
  }

  validarTratamientoDatos(event) {
    if (!event && this.checkedDataTreatment)  {
      this.checkedDataTreatment = false;
      this.persistence.set('tratamientodatos', undefined);
    }

    if (!this.checkedDataTreatment) {

      if (!this.checkedDatos) {
        this.registerFormulario.controls.tratamientoDatos.setValue(true);
        this.checkedDatos = true;
      } else {
        this.registerFormulario.controls.tratamientoDatos.setValue(false);
        this.checkedDatos = false;
        this.intervalTratamiento();
      }
      this.validacionCampos();
    }
  }

  validacionCampos() {
    if (!this.checkedTerminos || !this.checkedDatos) {
      this.mensajeAlertaAutorizaciones = true;
    } else {
      this.mensajeAlertaAutorizaciones = false;
    }

    if (this.registerFormulario.valid) {
      this.mensajeAlertaFormulario = false;
    } else {
      this.mensajeAlertaFormulario = true;
    }

    if (this.registerFormulario.valid && !this.mensajeAlertaAutorizaciones) {
      this.mensajePasaporte = false;
      this.consultarClienteCobis();
    }

    if (!this.mostrarAutorizaciones) {
      this.consultarClienteCobis();
    }
  }

  terminosCondiciones() {
    if (this.checkedTerminos){
      this.setAceptTerms(false);

    }
    this.showModalTermConditions();
  }

  tratamientoDatos() {
    if (this.checkedDataTreatment){
      this.setAceptDataTreament(false);

    }
    this.showModalDataTermsConditions();
  }

  loguin() {
    this.router.navigate(['/login']);
  }

  private async showModalTermConditions(){
    const modalTermsConditions = await this.modalCtrl.create({
      component: AuthorizationtermsConditionsPage,
      componentProps: {
      }
    });

    modalTermsConditions.present();
  }

  private async showModalDataTermsConditions(){

    const modalDataTerms = await this.modalCtrl.create({
      component: AuthorizationDataTreatmentPage,
      componentProps: {
      }
    });

    modalDataTerms.present();
  }

  closeModalTermsConditions(){
    this.modalCtrl.dismiss();
  }

  closeModaltermsConditions(){
    this.modalCtrl.dismiss();
  }

  consultarClienteCobis() {
    const identidadPersona: IdentidadPersona = new IdentidadPersona();
    if (this.registerFormulario.controls.TipoIdentificacion.value === IdentificationType.N) {
      identidadPersona.valIdentidadPersona = this.registerFormulario.controls.NumeroIdentificacion.value +
        this.registerFormulario.controls.DigitoVerificacion.value;
    } else {
      identidadPersona.valIdentidadPersona = this.registerFormulario.controls.NumeroIdentificacion.value;
    }
    identidadPersona.codTipoIdentidadPersona = this.registerFormulario.controls.TipoIdentificacion.value;
    identidadPersona.valNumeroEnte = 0;
    identidadPersona.valTipoIdentidadPersona = '';
    this.setInterval();
    if (this.registerFormulario.valid) {
      this.serviceConsultarClienteCobis(identidadPersona);
      this.persistence.set('identidadToken', `${JSON.stringify(identidadPersona)}`);
    }
  }
  expresionRegular(){
    const regular = /[^a-zA-Z0-9ñÑ\d]/i;
    let valor = null;
    valor = this.registerFormulario.value.NumeroIdentificacion;
    valor = valor.substring(0, 12);
    valor = valor.replace(regular, '');
    setTimeout(() => {​​​​​
      this.registerFormulario.controls.NumeroIdentificacion.setValue(valor);
    }​​​​​, 10);
  }
  setInterval() {
    const intervalId = setInterval(() => {
      if (!this.sinRespuestaServicio) {
        if (this.contador === 0) {
          this.solicitudProceso = JSON.parse(this.persistence.get('solicitudProceso'));
        } else {
          this.solicitudProceso = false;
        }
        this.reintentarSolicitud = JSON.parse(this.persistence.get('reintentarSolicitud'));
        if (this.solicitudProceso && this.reintentarSolicitud && this.contador === 0) {
          clearInterval(intervalId);
          this.resendService();
        }
        if (this.reintentarSolicitud && this.contador === 1) {
          this.bandera = false;
          this.toasterService.PresentToastMessage(this.mensajedeconexion);
          this.establecerValoresDefault();
          clearInterval(intervalId);
        }
      } else {
        this.establecerValoresDefault();
        clearInterval(intervalId);
      }
    }, 1000);
  }
  serviceConsultarClienteCobis(identidadPersona) {
    this.cobisService.ConsultarClienteCobis(identidadPersona).subscribe(
      res => {
        this.establecerValoresDefault();
        this.sinRespuestaServicio = true;
        this.persistence.set('sinRespuestaServicio', `${this.sinRespuestaServicio}`);
        if (res.responseMessage.includes('El usuario no se encuentra registrado en la aplicación')) {
          this.toasterService.PresentToastMessage(res.responseMessage);
          this.router.navigate(['/login']);
        } else {
          if (res.responseMessage.includes('OK')) {
            this.completarEntidad(
              identidadPersona.valIdentidadPersona, res.resultData[0].email, res.resultData[0].celular);
            this.persistence.set('bearer', `${res.resultData[0].bearer}`);
            this.router.navigate(['/token']);
            this.ClearForm();
          } else {
            this.toasterService.PresentToastMessage(res.responseMessage);
          }
        }
      },
      (err: any) => {
        if (err.name === 'HttpErrorResponse' && err.status === 0) {
          this.toasterService.PresentToastMessage(this.mensajedeconexion);
        }
        this.establecerValoresDefault();
      }
    );
  }

  resendService() {
    if (this.contador === 0) {
      this.contador = this.contador + 1;
    }
    this.solicitudProceso = false;
    this.reintentarSolicitud = false;
    this.persistence.set('solicitudProceso', `${this.solicitudProceso}`);
    this.persistence.set('reintentarSolicitud', `${this.reintentarSolicitud}`);
    if (this.contador === 1) {
      this.bandera = true;
      this.consultarClienteCobis();
    }
  }

  establecerValoresDefault() {
    this.solicitudProceso = false;
    this.reintentarSolicitud = false;
    this.persistence.set('solicitudProceso', `${this.solicitudProceso}`);
    this.persistence.set('reintentarSolicitud', `${this.reintentarSolicitud}`);
  }

  inicializarValoresDefault() {
    this.mensajePasaporte = false;
    this.checkedTerminos = false;
    this.checkedDatos = false;
    this.mensajeAlertaFormulario = false;
    this.mensajeAlertaAutorizaciones = false;
    this.solicitudProceso = false;
    this.reintentarSolicitud = false;
    this.servicioFail = false;
    this.noService = false;
    this.contador = 0;
    this.sinRespuestaServicio = false;
    this.persistence.set('sinRespuestaServicio', `${this.sinRespuestaServicio}`);
  }

  completarEntidad(identificacion, email, celular) {
    const verifyTokenEntidad = new VerifyToken();
    verifyTokenEntidad.Usuario = identificacion;
    verifyTokenEntidad.Correo = email; // cambiar por email (etapa de pruebas)
    verifyTokenEntidad.Aplicacion = 'Control_Inversion';
    verifyTokenEntidad.Transaccion = '1';
    verifyTokenEntidad.codigo = '0';
    verifyTokenEntidad.vigenciaToken = 10;
    verifyTokenEntidad.intentosFallidos = 3;
    verifyTokenEntidad.intentosGeneracion = 2;
    verifyTokenEntidad.Estado = false;
    verifyTokenEntidad.LlaveSecreta = null;
    verifyTokenEntidad.Error = null;
    verifyTokenEntidad.FechaCreacion = new Date();
    verifyTokenEntidad.Bloqueo = 0;
    verifyTokenEntidad.ConteoGeneracion = 0;
    verifyTokenEntidad.TiempoBloqueo = 1;
    this.persistence.set('entidadRegistro', `${JSON.stringify(verifyTokenEntidad)}`);

    const userRegister = new Usuario();
    userRegister.Id = 0;
    userRegister.TipoIdentificacion = this.selectTypeIdentification(
      this.registerFormulario.controls.TipoIdentificacion.value);
    userRegister.NumeroIdentificacion = this.registerFormulario.controls.NumeroIdentificacion.value;
    userRegister.DigitoVerificacion = this.registerFormulario.controls.DigitoVerificacion.value;
    userRegister.AutorizaTerminos = true;
    userRegister.AutorizaDatos = true;
    userRegister.Bloqueo = false;
    userRegister.FechaBloqueo = new Date();
    userRegister.IntentosAcceso = 2;
    userRegister.UsuarioCreacion = this.registerFormulario.controls.NumeroIdentificacion.value;
    userRegister.FechaCreacion = new Date();
    userRegister.UsuarioModificacion = this.registerFormulario.controls.NumeroIdentificacion.value;
    userRegister.Contrasena = '';
    userRegister.FechaModificacion = new Date();
    userRegister.Email = email; // cambiar por email (etapa de pruebas)
    userRegister.NumeroCelular = celular;
    userRegister.TiempoBloqueo = '1';
    this.persistence.set('userRegister', `${JSON.stringify(userRegister)}`);
  }

  home() {
    this.router.navigate(['/home']);
  }

  intervalTratamiento() {
    this.intervalIdAux = setInterval(() => {

      if (this.persistence.get('tratamientodatos') !== undefined &&
        this.registerFormulario.controls.tratamientoDatos.value === false) {
        const result = JSON.parse(this.persistence.get('tratamientodatos'));
        if (result) {
          this.setAceptDataTreament(result);
          this.checkedDataTreatment = true;
        }
      }
    }, 1000);
  }

  intervalTerminos() {
      this.intervalId = setInterval(() => {

        if (this.persistence.get('acceptaterminos') !== undefined &&
            this.registerFormulario.controls.terminosCondiciones.value === false) {
          const result = JSON.parse(this.persistence.get('acceptaterminos'));
          if (result) {
            this.setAceptTerms(result);
            this.checkedAutorizaTerms = true;
          }
        }
    }, 1000);
  }

  setAceptTerms(accepta: boolean){
    this.registerFormulario.controls.terminosCondiciones.setValue(accepta);
    this.checkedTerminos = accepta;
    if (accepta){
      clearInterval(this.intervalId);
    }
  }

  setAceptDataTreament(accepta: boolean) {
    this.registerFormulario.controls.tratamientoDatos.setValue(accepta);
    this.checkedDatos = accepta;
    if (accepta){
      clearInterval(this.intervalIdAux);
    }
  }

  selectTypeIdentification(tipoIdentificacion){
    switch (tipoIdentificacion){
      case IdentificationType.CC:
        return 1;
      case IdentificationType.CE:
        return 2;
      case IdentificationType.N:
        return 3;
      case IdentificationType.NI:
        return 4;
      case IdentificationType.PA:
        return 5;
      case IdentificationType.RC:
        return 6;
      default:
        return 7;
    }
  }
  ClearForm(){
    this.registerFormulario.controls.terminosCondiciones.reset();
    this.registerFormulario.controls.tratamientoDatos.reset();
  }
}

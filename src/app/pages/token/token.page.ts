import { Component, OnInit } from '@angular/core';
import { FormGroup, FormBuilder, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { AlertController } from '@ionic/angular';
import { PersistenceService } from 'angular-persistence';
import { CobisService } from 'src/app/services/cobis/cobis.service';
import { ParametroService } from 'src/app/services/Parametro/parametro.service';
import { ResourceService } from 'src/app/services/resource/resource.service';
import { ToasterService } from 'src/app/services/toaster/toaster.service';
import { TokenService } from 'src/app/services/token/token.service';
import { Enumerator } from 'src/app/shared/enum/enumerator.enum';
import { IdentidadPersona } from 'src/app/shared/model/IdentidadPersona';
import { Parametro } from 'src/app/shared/model/parametro';
import { VerifyToken } from 'src/app/shared/model/verifyToken';

@Component({
  selector: 'app-token',
  templateUrl: './token.page.html',
  styleUrls: ['./token.page.scss'],
})
export class TokenPage implements OnInit {
  registerFormulario: FormGroup;
  parametroIntentos: Parametro;
  intentosFallidos = 0;
  constructor(private readonly formBuilder: FormBuilder,
              private readonly persistence: PersistenceService,
              private readonly tokenService: TokenService,
              private readonly router: Router,
              private readonly toasterService: ToasterService,
              private readonly cobisService: CobisService,
              private readonly parametroService: ParametroService,
              private readonly alertController: AlertController,
              private readonly resourceService: ResourceService) {
  }

  registrarFormulario(){
    this.registerFormulario = this.formBuilder.group({
      token: ['', [Validators.required, Validators.maxLength(6) ]],
    });
  }

  ngOnInit() {
    this.registrarFormulario();
    this.resourceService.ClearPersistenceKey('intentosFallidos');
  }

  ionViewWillEnter() {
    this.consultarParametroToken();
  }

  consultarParametroToken() {
    this.parametroService.ConsultarParametro(Enumerator.INTENTOS_FALLIDOS_INGRESO_TOKEN)
    .subscribe(
      async (res) => {
        this.parametroIntentos = res.resultData[0];
      },
      (err) => { }
    );
  }

  addmask(){
    const regular = /[^0-9]*/g;
    let valor = null;
    valor = this.registerFormulario.value.token;
    valor = valor.replace(regular, '');
    setTimeout(() => {​​​​​
      this.registerFormulario.controls.token.setValue(valor);
    }​​​​​, 10);
  }

  validarToken() {
    let verifyTokenEntidad = new VerifyToken();
    verifyTokenEntidad = JSON.parse(this.persistence.get('entidadRegistro'));
    verifyTokenEntidad.codigo = this.registerFormulario.controls.token.value;
    const bearer = this.persistence.get('bearer');
    this.tokenService.ValidarToken(verifyTokenEntidad, bearer).subscribe(
      res => {
        if (res.responseMessage.includes('Token verificado exitosamente')){
          this.resourceService.ClearPersistenceKey('intentosFallidos');
          this.router.navigate(['/password']);
        }
      },
      (err: any) => {
        if (err.error.responseMessage.includes('Se ha excedido la cantidad de intentos')){

          if (!this.resourceService.CheckPersistence('intentosFallidos')) {
           this.intentosFallidos = this.intentosFallidos  + 1;
           this.resourceService.SetPersistenceValue('intentosFallidos', this.intentosFallidos);
          }
          else {
            this.intentosFallidos = this.resourceService.GetPersistenceValue('intentosFallidos');
            this.intentosFallidos = this.intentosFallidos + 1;
            this.resourceService.SetPersistenceValue('intentosFallidos', this.intentosFallidos);
          }

          // Evaluamos intentos con el parametrizado
          const cantidadParametrizada = Number(this.parametroIntentos.valor);

          if (this.intentosFallidos === cantidadParametrizada) {
            this.intentosExcedidosAlerta();
            this.resourceService.ClearPersistenceKey('intentosFallidos');
            this.router.navigate(['/register']);
          } else {
            this.intentosFallidoAlerta();
          }
        }

        if (err.error.responseMessage.includes('TOKEN HA EXPIRADO')) {
          this.tokenExpirado();
        }

        if (err.error.responseMessage.includes('TOKEN YA VALIDADO')) {
          this.tokenYaValidado();
        }

        if (err.status === Enumerator.HTTP_RESPONSE_UNAUTHORIZED) {
          // this.toasterService.PresentToastMessage(err.responseMessage);
        }
      }
    );
  }

  async tokenYaValidado() {
    const alert = await this.alertController.create({
      cssClass: 'contenedor-principal',
      message: '<strong>El token ya ha sido validado.</strong>',
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

  async tokenExpirado() {
    const alert = await this.alertController.create({
      cssClass: 'contenedor-principal',
      message: '<strong>El token ya ha expirado.</strong>',
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

  async intentosFallidoAlerta() {
    const alert = await this.alertController.create({
      cssClass: 'contenedor-principal',
      message: '<strong>El token es invalido.</strong>',
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

  async intentosExcedidosAlerta() {
    const alert = await this.alertController.create({
      cssClass: 'contenedor-principal',
      message: '<strong>Se ha excedido la cantidad de intentos</strong>',
      buttons: [
        {
          text: 'Aceptar',
          handler: () => {
            this.router.navigate(['/register']);
          },
        },
      ],
    });
    await alert.present();
  }

  ReenviarToken(resp) {
    this.resourceService.SetPersistenceValue('intentosFallidos', 0);
    this.persistence.set('intentosGeneracion', true);
    let identidadPersona: IdentidadPersona = new IdentidadPersona();
    identidadPersona = JSON.parse(this.persistence.get('identidadToken'));
    this.cobisService.ConsultarClienteCobis(identidadPersona).subscribe(
      res => {
      },
      (err: any) => {
        if (err.error.responseMessage.includes('Se ha excedido la cantidad de intentos')){
          this.router.navigate(['/register']);
          this.toasterService.PresentToastMessage(err.responseMessage);
        }
      }
    );
  }
}

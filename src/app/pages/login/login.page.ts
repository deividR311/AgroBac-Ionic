import { Component, OnInit, ViewChild } from '@angular/core';
import { FormGroup, FormBuilder, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { LoginService } from 'src/app/services/login/login.service';
import { Enumerator } from 'src/app/shared/enum/enumerator.enum';
import { HttpResponse } from 'src/app/shared/model/httpresponse';
import { Login } from 'src/app/shared/model/login';
import { ToasterService } from 'src/app/services/toaster/toaster.service';
import { LoadingService } from 'src/app/services/loading/loading.service';
import { ResourceService } from 'src/app/services/resource/resource.service';
import { ValidatePassword } from 'src/app/shared/core/password.validator';
import { PersistenceService } from 'angular-persistence';
import { IdentificationType } from 'src/app/shared/core/constants/identification-type.enum';
import { Roles } from 'src/app/shared/model/roles';
import { ParametroService } from 'src/app/services/Parametro/parametro.service';
import { forkJoin } from 'rxjs';
import { AlertController } from '@ionic/angular';
import { DatabaseComponent } from 'src/app/shared/components/database/database.component';
import { SQLite } from '@ionic-native/sqlite/ngx';
import { Parametro } from 'src/app/shared/model/parametro';
import { compareRoles } from 'src/app/shared/core/helpers';

@Component({
  selector: 'app-login',
  templateUrl: './login.page.html',
  styleUrls: ['./login.page.scss'],
})
export class LoginPage implements OnInit {
  @ViewChild(DatabaseComponent) databaseComponent: DatabaseComponent;

  rolesAux: Array<Roles>;
  loginFormGroup: FormGroup;
  loginLocal = new Array<Login>();
  rol: Roles;
  dataBaseOffline = new DatabaseComponent(this.sqlite, this.persistence);

  //roles
  commercialRoles : Array<Parametro>;
  professionalControlRoles : Array<Parametro>;
  //

  constructor(private readonly formBuilder: FormBuilder,
              private readonly router: Router,
              private readonly loginService: LoginService,
              private readonly toaster: ToasterService,
              private readonly persistence: PersistenceService,
              private readonly resourceService: ResourceService,
              private readonly parametroService: ParametroService,
              private readonly alertController: AlertController,
              private readonly sqlite: SQLite) {
                this.loginLocal = [];
                this.persistence.set('login',  false);
                this.rol = new Roles();
                this.rolesAux = new Array<Roles>();
  }

  ngOnInit() {
    this.InitializeForm();
    this.resourceService.ClearPersistenceKey('rolUsuarioAC');
    this.resourceService.ClearPersistenceKey('rolUsuarioPC');
  }

  ionViewWillEnter(){
    this.InitializeForm();
  }

  InitializeForm(){
    this.loginFormGroup = this.formBuilder.group({
      userName: ['', [Validators.required, Validators.maxLength(12)]],
      userPassword: ['', [Validators.required, Validators.minLength(5),
      Validators.maxLength(16)]]
    });

    this.consultarParametros();
  }


  OnSubmit() {
    if (!this.loginFormGroup.valid) {
      return;
    }
    this.Login();
    this.ClearForm();
  }

  Login() {
    const login: Login = new Login();
    login.usuario = this.loginFormGroup.controls.userName.value;
    login.contrasena = this.loginFormGroup.controls.userPassword.value;

    if (this.resourceService.IsOnline()) {
      // Consumo de servicio de login
      this.loginServiceMetodo(login);
    } else {
      const insertarLocalStorage = this.validarUsuario(login);
      this.consultarParametros();
      if (!insertarLocalStorage) {
          this.persistence.set('user', login);
          this.persistence.set('login',  true);
          this.resourceService.SetPersistenceValue('user', login);
          this.router.navigate(['/credits']);
      } else {
        this.persistence.set('login',  false);
        this.toaster.PresentToastMessage('Usuario no encontrado');
      }
    }
  }

  SignUp(mostrarAutorizaciones: any){
    this.persistence.set('mostrarAutorizaciones', `${mostrarAutorizaciones}`);
    this.router.navigate(['/register']);
  }

  ClearForm(){
    this.loginFormGroup.controls.userName.reset();
    this.loginFormGroup.controls.userPassword.reset();

  }

  format(){
    const regular = "";
    let valor = null;
    valor = this.loginFormGroup.value.userPassword;
    if (valor !== null) {
      valor = valor.replace(regular, '');
      setTimeout(() => {​​​​​
        this.loginFormGroup.controls.userPassword.setValue(valor);
      }​​​​​, 10);
    }
  }

  expresionRegular(){
    const regular = /[^a-zA-Z0-9ñÑ\d]/i;
    let valor = null;
    valor = this.loginFormGroup.value.userName;
    if (valor !== null) {
      valor = valor.substring(0, 12);
      valor = valor.replace(regular, '');
      setTimeout(() => {​​​​​
        this.loginFormGroup.controls.userName.setValue(valor);
      }​​​​​, 10);
    }
  }

  guardarLocalStorage(user: { contrasena: string; usuario: string; }, tipoIdentificacion: string, roles: any[]) {
    // Guardado en el local storage
    this.loginLocal = [];
    this.loginLocal = JSON.parse(localStorage.getItem('user'));
    if (this.loginLocal === null || this.loginLocal === undefined) {
      this.loginLocal = [];
    }
    const loginUsuarioLocal = new Login();
    loginUsuarioLocal.contrasena = user.contrasena;
    loginUsuarioLocal.usuario = user.usuario;
    loginUsuarioLocal.tipoIdentificacion = tipoIdentificacion;
    loginUsuarioLocal.roles = roles;
    this.loginLocal = new Array<Login>();
    this.loginLocal.push(loginUsuarioLocal);
    localStorage.removeItem('user');
    localStorage.setItem('user', JSON.stringify(this.loginLocal));
  }

  validarUsuario(user: Login) {
    // validacion si el usuario ya ha ingresado a la aplicacion
    let insertarLocalStorage = true;
    this.loginLocal = JSON.parse(localStorage.getItem('user'));
    if (this.loginLocal !== null && this.loginLocal !== undefined) {

      const usuarioEncontrado = this.loginLocal.find(usuario =>
        usuario.contrasena.toString() === user.contrasena.toString()
        && usuario.usuario.toString() === user.usuario.toString());
      if (usuarioEncontrado !== undefined) {
        if (!this.resourceService.IsOnline()) {
          this.validarRolUsuario(usuarioEncontrado.roles);
        }

        insertarLocalStorage = false;
      }
    }
    return insertarLocalStorage;
  }

  loginServiceMetodo(login: Login) {
    this.loginService.Login(login).subscribe(
      (data: HttpResponse<any>) => {
        if (data.responseCode === Enumerator.HTTP_RESPONSE_OK
            && data.resultData.length > 0 && data.resultData[0].error === 'True'){
            this.toaster.PresentToastMessage(data.resultData[0].mensaje);
          }else {
                // Login OK
            data.resultData[0].usuario = login.usuario;
            this.resourceService.SetPersistenceValue('authorization', data.authorization);
            this.resourceService.SetPersistenceValue('user', JSON.stringify(data.resultData[0]));
            this.persistence.set('login',  true);

            // data.resultData[0].roles = this.rolesAux;
            this.resourceService.SetPersistenceValue('roles', data.resultData[0].roles);
            const roles = data.resultData[0].roles;

            if (roles === null) {
              this.alertRol();
            } else {
              login.roles = roles;
              this.validarRolUsuario(roles);
              // Valida si el usuario se encuentra en el local storage
              const insertarLocalStorage = this.validarUsuario(login);
              if (insertarLocalStorage) {
                // Almacena en el local storage
                this.guardarLocalStorage(login, data.resultData[0].tipoIdentificacion,
                  data.resultData[0].roles);
              }
              this.router.navigate(['/credits']);
            }
          }
      },
      (err: any) => {
        // this.toaster.PresentToastMessage(err);
      }
    );
  }

  validarRolUsuario(roles: Array<any>) {
    this.resourceService.ClearPersistenceKey('rolUsuarioAC');
    this.resourceService.ClearPersistenceKey('rolUsuarioPC');

    //roles
    let rolesAsesorComercial = compareRoles( roles, this.commercialRoles, 'codigo' );
    let rolesProfesionalControl = compareRoles( roles, this.professionalControlRoles, 'codigo' );

    if (rolesAsesorComercial.length > 0) {
      this.resourceService.SetPersistenceValue('rolUsuarioAC', Enumerator.ROL_ASESOR_COMERCIAL);
    } else {
      this.resourceService.ClearPersistenceKey('rolUsuarioAC');
    }

    if (rolesProfesionalControl.length > 0) {
      this.resourceService.SetPersistenceValue(
        'rolUsuarioPC', Enumerator.ROL_PROFESIONAL_CONTROL_INVERSION
      );
    } else {
      this.resourceService.ClearPersistenceKey('rolUsuarioPC');
    }

    //validates if user doesn´t have commercial or credit rol
    if (rolesAsesorComercial.length === 0 && rolesProfesionalControl.length === 0){
      this.alertRol();
    }

    //validates if user have both types of roles ( credit and commercial )
    if (rolesAsesorComercial.length > 0 && rolesProfesionalControl.length > 0){
      this.alertRol();
    }
    //
  }

  async alertRol() {
    const alert = await this.alertController.create({
      cssClass: 'contenedor-principal',
      message: 'Señor funcionario comuníquese con el administrador de la aplicación, para validar con que rol debe realizar el ingreso a la aplicación',
      buttons: [
        {
          text: 'Aceptar',
          handler: () => {
            this.router.navigate(['/login']);
          },
        },
      ],
    });
    await alert.present();
  }

  async consultarParametros() {
    if (this.resourceService.IsOnline()) {
      const asesorComercialParm = this.parametroService.ConsultarParametro(
        Enumerator.ROL_ASESOR_COMERCIAL
      );
      const profesionalControlParm = this.parametroService.ConsultarParametro(
        Enumerator.ROL_PROFESIONAL_CONTROL_INVERSION
      );

      forkJoin([asesorComercialParm, profesionalControlParm]).subscribe(
        async (res) => {
          this.databaseComponent = new DatabaseComponent(this.sqlite, this.persistence);

          this.commercialRoles = res[0]?.resultData;
          this.professionalControlRoles = res[1]?.resultData;
          
          this.saveParametersOnSQlite( this.commercialRoles, this.professionalControlRoles );
        }
      );
    } else {
      const asesorComercialParm = await this.dataBaseOffline.selectDataParametro(
        Enumerator.ROL_ASESOR_COMERCIAL
      );

      const profesionalControlParm = await this.dataBaseOffline.selectDataParametro(
        Enumerator.ROL_PROFESIONAL_CONTROL_INVERSION
      );

      this.commercialRoles = asesorComercialParm;
      this.professionalControlRoles = profesionalControlParm;
    }
  }

  async saveParametersOnSQlite( commercialRoles: Parametro[], professionalControlRoles: Parametro[] ) {
    this.dataBaseOffline.deleteDataParametro(Enumerator.ROL_PROFESIONAL_CONTROL_INVERSION);
    this.dataBaseOffline.deleteDataParametro(Enumerator.ROL_ASESOR_COMERCIAL);
    
    commercialRoles.forEach( async rol => await this.dataBaseOffline.insertDataParametro(
      rol, Enumerator.ROL_ASESOR_COMERCIAL
    ));

    professionalControlRoles.forEach( async rol => await this.dataBaseOffline.insertDataParametro(
      rol, Enumerator.ROL_PROFESIONAL_CONTROL_INVERSION
    ));
  }
}

import { Component, OnInit } from '@angular/core';
import { Validators, FormBuilder, FormGroup, FormControl, ValidationErrors } from '@angular/forms';
import { Router } from '@angular/router';
import { ResourceService } from 'src/app/services/resource/resource.service';
import { ToasterService } from 'src/app/services/toaster/toaster.service';
import { UsuarioService } from 'src/app/services/usuario/usuario.service';
import { ValidatePassword } from 'src/app/shared/core/password.validator';
import { Usuario } from 'src/app/shared/model/usuario';


@Component({
  selector: 'app-password',
  templateUrl: './password.page.html',
  styleUrls: ['./password.page.scss'],
})
export class PasswordPage implements OnInit {
  passwordFormGroup: FormGroup;
  userRegister: Usuario;
  option: boolean;

  constructor(private readonly formBuilder: FormBuilder,
              private readonly resourceService: ResourceService,
              private readonly router: Router,
              private readonly userService: UsuarioService,
              private readonly toasterService: ToasterService) {
    this.registrarFormulario();
  }

  ngOnInit() {
    this.GetUser();
    this.GetOption();
  }

  registrarFormulario() {
    this.passwordFormGroup = this.formBuilder.group({
      password: ['', [Validators.required, Validators.pattern('[0-9]{5,8}'), Validators.minLength(5),
      Validators.maxLength(8), ValidatePassword(), this.validatePassword]],
      confirmPassword: ['', [Validators.required, Validators.pattern('[0-9]{5,8}'), Validators.minLength(5),
      Validators.maxLength(8), ValidatePassword(), this.validatePassword]]
    });
  }

  format() {
    const regular = /[^0-9]*/g;
    let valor = null;
    valor = this.passwordFormGroup?.value?.password;
    valor = valor.replace(regular, '');
    setTimeout(() => {
      this.passwordFormGroup?.controls?.password?.setValue(valor);
    }, 10);
  }

  formatConfirm() {
    const regular = /[^0-9]*/g;
    let valor = null;
    valor = this.passwordFormGroup?.value?.confirmPassword;
    valor = valor.replace(regular, '');
    setTimeout(() => {
      this.passwordFormGroup?.controls?.confirmPassword?.setValue(valor);
    }, 10);
  }


  GetUser() {
    const exist = this.resourceService.GetPersistenceValue('userRegister');

    if (typeof (exist) === 'undefined'){
      this.router.navigate(['/login']);
    }else {
      this.userRegister = JSON.parse(this.resourceService.GetPersistenceValue('userRegister'));
    }
  }

  validatePassword(control: FormControl): ValidationErrors {
    const clave = control.value;
    let numeroactual = 0;
    let numeroanterior = 0;
    const array = clave.split('');
    for (let i = 0; i < array.length; i++) {
      numeroactual = array[i];
      if (i !== 0) {
        numeroanterior = array[i - 1];
        if (numeroactual === numeroanterior) {
          return { validatePassword: true };
        }
      }
    }
  }
  OnSubmit() {
    if (!this.passwordFormGroup.valid) {
      return;
    }
    this.SignUp();
    this.ClearForm();
  }

  ClearForm(){
    this.passwordFormGroup.controls.password.reset();
    this.passwordFormGroup.controls.confirmPassword.reset();
  }

  SignUp(){
    const user: Usuario = JSON.parse(this.resourceService.GetPersistenceValue('userRegister'));
    user.Contrasena = this.passwordFormGroup.controls.password.value;
    this.userService.RegistrarUsuario(user, this.option).subscribe(
      (res) => {
        this.resourceService.GetResourceValues().then(
          (data) => {
              this.toasterService.PresentToastMessage(data['mobile.generics.SignUpSucceed']);
          }
      );
      this.router.navigate(['/login']);
      }
    );
  }

  GetOption(){
    const exist = this.resourceService.GetPersistenceValue('mostrarAutorizaciones');

    if (typeof (exist) === 'undefined') {
      this.option = false;
    }else {
      this.option = JSON.parse(this.resourceService.GetPersistenceValue('mostrarAutorizaciones'));
    }
  }
}

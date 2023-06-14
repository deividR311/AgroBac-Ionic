import { Component, ViewChild } from '@angular/core';
import { MenuController, Platform } from '@ionic/angular';
import { SplashScreen } from '@ionic-native/splash-screen/ngx';
import { StatusBar } from '@ionic-native/status-bar/ngx';
import { TranslateService } from '@ngx-translate/core';
import { Title } from '@angular/platform-browser';
import { Network } from '@ionic-native/network/ngx';
import { PersistenceService } from 'angular-persistence';
import { SQLite } from '@ionic-native/sqlite/ngx';
import { DatabaseComponent } from './shared/components/database/database.component';
import { LoginPage } from './pages/login/login.page';
import { RegisterPage } from './pages/register/register.page';
import { TokenPage } from './pages/token/token.page';
import { PasswordPage } from './pages/password/password.page';
import { ResourceService } from './services/resource/resource.service';
import { Menu } from './shared/model/Menu';
import { Router } from '@angular/router';
import { Login } from './shared/model/login';
import { HttpResponse } from './shared/model/httpresponse';
import { LoginService } from './services/login/login.service';
import { Enumerator } from './shared/enum/enumerator.enum';
import { UnlockingService } from './services/unlocking/unlocking.service';
import { setInterceptorError } from './shared/core/helpers';

@Component({
  selector: 'app-root',
  templateUrl: 'app.component.html',
  styleUrls: ['app.component.scss']
})


export class AppComponent {
  @ViewChild(DatabaseComponent) databaseComponent: DatabaseComponent;
  ishide = false;
  offline = false;
  Menu: Array<Menu>;
  
  constructor(
    private readonly titleService: Title,
    private platform: Platform,
    private splashScreen: SplashScreen,
    private statusBar: StatusBar,
    public translate: TranslateService,
    private readonly network: Network,
    private readonly persistence: PersistenceService,
    private sqlite: SQLite,
    private readonly resourceService: ResourceService,
    private readonly router: Router,
    private readonly persistenceService: PersistenceService,
    public menuCtrl: MenuController,
    private login: Login,
    private loginService: LoginService,
    private databaseOffline: DatabaseComponent,
    private unlockingService : UnlockingService) {
    this.initializeApp();
    this.databaseOffline = new DatabaseComponent(sqlite, persistenceService);
    // Logica para detectar si el usuario cuenta con internet
    this.network.onDisconnect().subscribe(() => {
      this.persistence.set('Online', false);
      this.offline = true;
    });

    this.network.onConnect().subscribe(() => {
      if (!this.persistence.get('Online')) {
        this.persistence.set('Online', true);
        this.offline = false;
        if (localStorage.getItem('user') !== null) {
          if (localStorage.getItem('user').length > 0) {
            this.login.usuario = JSON.parse(localStorage.getItem('user'))[0].usuario;
            this.login.tipoIdentificacion = JSON.parse(localStorage.getItem('user'))[0].tipoIdentificacion;
            this.login.contrasena = JSON.parse(localStorage.getItem('user'))[0].contrasena;
            this.GetOnline(login);
          }
        }
      }
    });
  }

  async GetOnline(login)
  {
    if (this.router.url !== '/login' && this.router.url !== '/') {
      this.Consultarlogin(login);
    }
  }

  initializeApp() {
    this.translate.setDefaultLang('es');
    this.titleService.setTitle('Apperos BAC');
    this.platform.ready().then(() => {
      setInterceptorError(); // to show native http response errors when services failed
      this.statusBar.styleDefault();
      this.splashScreen.hide();
      this.persistence.set('Online', navigator.onLine);
      // Si el usuario se encuentra en un dispositivo movil crea la base de datos
      if (this.platform.is('android') || this.platform.is('ios')) {
        this.databaseComponent = new DatabaseComponent(this.sqlite, this.persistence);
        this.databaseComponent.crearDataBase();
        this.persistence.set('Celular', true);
      } else {
        this.persistence.set('Celular', false);
        this.persistence.set('Online', true);
      }
    });
  }

  componentAdded(event) {
    if (event instanceof LoginPage || event instanceof RegisterPage || event instanceof TokenPage
      || event instanceof PasswordPage) {
      this.ishide = true;
    } else {
      this.ishide = false;
      this.ConsultarMenu();
    }
  }

  async ConsultarMenu() {
    const menu = this.resourceService.CheckPersistence('menu');
     this.Menu = [
      {
        id: 0,
        idPadre: 0,
        nombre: 'Cerrar sesión',
        url: '/login',
        estado: true
      }
     ];
  }

  opcionMenu(url) {
    this.persistence.remove('ListaActividad');
    this.router.navigate([url]);
    this.menuCtrl.close();
  }

  async insertMenuLocal() {
    this.databaseComponent = new DatabaseComponent(this.sqlite, this.persistenceService);
    await this.databaseComponent.deleteDataMenu();
    for (const menu of this.Menu) {
      await this.databaseComponent.insertDataMenu(
        menu.idPadre, menu.nombre, menu.url, menu.estado);
    }
  }

  // Modo offline, se toma el menu guardado en la tabla local menu
  async ConsultarMenuOffline() {
    if (this.resourceService.IsDevice()) {
      this.databaseComponent = new DatabaseComponent(this.sqlite, this.persistenceService);
      this.Menu = await this.databaseComponent.selectDataMenu();
      this.resourceService.SetPersistenceValue('menu', JSON.stringify(this.Menu));
    }
  }

  Consultarlogin(login) {
    this.loginService.Login(login).subscribe(
      (data: HttpResponse<any>) => {
        if (data.responseCode === Enumerator.HTTP_RESPONSE_OK) {

          // Login OK
          data.resultData[0].usuario = login.usuario;
          this.resourceService.SetPersistenceValue('authorization', data.authorization);
          this.resourceService.SetPersistenceValue('user', JSON.stringify(data.resultData[0]));
          this.persistence.set('login', true);
          this.unlockingService.UploadPendingChanges();
        }
      },
      (err: any) => {
      }
    );
  }
}
import { EventEmitter, Injectable, ViewChild } from '@angular/core';
import { PersistenceService } from 'angular-persistence';
import { ResourceService } from '../resource/resource.service';
import { DatabaseComponent } from 'src/app/shared/components/database/database.component';
import { SQLite } from '@ionic-native/sqlite/ngx';
import { Enumerator } from 'src/app/shared/enum/enumerator.enum';
import { RubroService } from '../rubro/rubro.service';
import { ToasterService } from '../toaster/toaster.service';
import { RubroInfraestructuraAux } from 'src/app/shared/model/rubroInfraestructuraAux';
import { RubroInfraestructura } from 'src/app/shared/model/rubroInfrastructura';
import { EntidadMetadataAux } from 'src/app/shared/model/EntidadMetadataAux';
import { RubroCapitalTrabajo } from 'src/app/shared/model/rubroCapitalTrabajo';
import { RubroTractores } from 'src/app/shared/model/rubroTractores';
import { setInterceptorError, setInterceptorErrorFalse } from 'src/app/shared/core/helpers';
import { ModalController } from '@ionic/angular';
import { RetryUnlockingFailedComponent } from 'src/app/shared/components/retry-unlocking-failed/retry-unlocking-failed.component';

@Injectable({
    providedIn: 'root'
})

export class UnlockingService {
  @ViewChild(DatabaseComponent) databaseComponent: DatabaseComponent;
  eventUpdate = new EventEmitter<any>();

  //retry
  totalAttempt : number = 0;
  maxAttempt : number = 3;
  typeAttempts : Array<string> = [];
  retryUnlockingCalled : boolean = false;
  startUnlocking : boolean = false;
  //


  constructor(
      private readonly resourceService: ResourceService,
      private sqlite: SQLite,
      private readonly persistence: PersistenceService,
      private databaseOffline: DatabaseComponent,
      private readonly toasterService: ToasterService,
      private readonly rubroService: RubroService,
      private readonly modalCtrl: ModalController
      ) { }
  
  async UploadPendingChanges() {
    this.databaseComponent = new DatabaseComponent(this.sqlite, this.persistence);
    const rubros = await this.databaseOffline.selectDataRubroNoEnviados();
    const hostVisitors = await this.databaseComponent.selectAllDataObligacion( true );

    this.totalAttempt += 1; // retry
    this.startUnlocking = true;

    if (rubros.length > 0) {
      setInterceptorErrorFalse(); // retry
      for (let rubro of rubros) {
        switch (rubro.tipoRubro) {
          case Enumerator.CODIGO_INFRASTRUCTURA:
            const rubroInfraestructura = await this.GetInfrastructureOffline(rubro);
            rubro.codigoTipoRubro = rubro.tipoRubro;
            this.rubroService.InsertarRubroInfraestructura(rubroInfraestructura,true)
            .subscribe(
              (res) => {
                if(res.responseCode === Enumerator.HTTP_RESPONSE_OK) {
                  this.databaseOffline.updateRubroOffline
                  (rubro.guid, rubro.codigoObligacion, res.resultData[0].rubro.id);
                  this.updateRubroInfraestructuraOffline(res);
                  this.updateMetadataFotoOffLine(res);
                } else {
                  this.resourceService.GetResourceValues().then((data) => {
                    this.toasterService.PresentToastMessage(
                      data['mobile.generics.sicronizarError'] + 'Infraestructura'
                    );
                  });
                }
              },
              (err) => {
                if (!this.retryUnlockingCalled && this.startUnlocking) {
                  this.retryUnlocking(true); // retry
                }
              }
            );
            break;
          case Enumerator.CODIGO_CAPITAL_TRABAJO:
            const rubroCapitalTrabajo = await this.GetProductiveUnitOffline(rubro);
            rubro.codigoTipoRubro = rubro.tipoRubro;
            this.rubroService.InsertarRubroCapitalTrabajo(rubroCapitalTrabajo,true)
            .subscribe(
              (res) => {
                if (res.responseCode === Enumerator.HTTP_RESPONSE_OK) {
                  this.databaseOffline.updateRubroOffline
                  (rubro.guid, rubro.codigoObligacion, res.resultData[0].rubro.id);
                  this.updateMetadataFotoOffLine(res);
                  this.updateActividades(res);
                } else {
                  this.resourceService.GetResourceValues().then((data) => {
                    this.toasterService.PresentToastMessage(
                      data['mobile.generics.sicronizarError'] + 'Capital de Trabajo'
                    );
                  });
                }
              },
              (err) => {
                if (!this.retryUnlockingCalled && this.startUnlocking) {
                  this.retryUnlocking(true); // retry
                }
              }
            );
            break;
          case Enumerator.CODIGO_MAQUINARIA_EQUIPOS:
            const rubroMaquinaria = await this.GetImplementsOffline(rubro);
            rubro.codigoTipoRubro = rubro.tipoRubro;
            this.rubroService.InsertarRubroTractores(rubroMaquinaria,true)
            .subscribe(
              (res) => {
                if(res.responseCode === Enumerator.HTTP_RESPONSE_OK) {
                  this.databaseOffline.updateRubroOffline
                  (rubro.guid, rubro.codigoObligacion, res.resultData[0].rubro.id);
                  this.updateMetadataFotoOffLine(res);
                } else {
                  this.resourceService.GetResourceValues().then((data) => {
                    this.toasterService.PresentToastMessage(
                      data['mobile.generics.sicronizarError'] + 'Maquinaria y Equipo'
                    );
                  });
                }
              },
              (err) => {
                if (!this.retryUnlockingCalled && this.startUnlocking) {
                  this.retryUnlocking(true); // retry
                }
              }
            );
            break;
        }
      }
    }

    if (hostVisitors.length > 0) {
      setInterceptorErrorFalse();
      for ( let hostVisitor of hostVisitors ) {
        this.rubroService.InsertarHostVisitor( hostVisitor ).subscribe(
          (res) => {
            if(res.responseCode === Enumerator.HTTP_RESPONSE_OK) {
              this.databaseComponent.deleteDataObligacion(res.resultData[0].idCase, res.resultData[0].codigoObligacion);       
              this.databaseComponent.deleteRemanagementRubro( res.resultData[0].idCase, res.resultData[0].codigoObligacion );
            }
          },
          (err) => {
            if (!this.retryUnlockingCalled && this.startUnlocking) {
              this.retryUnlocking(true); // retry
            }
          }
        )
      }
      
      setTimeout(() => {
        this.eventUpdate.emit(true);
      }, 1000);
    }
  }

  // retry
  retryUnlocking( failedAttempt : boolean = false ) {
    this.retryUnlockingCalled = true;
    if ( failedAttempt && this.totalAttempt < this.maxAttempt ) {
      setTimeout(() => {
      this.UploadPendingChanges();
      this.retryUnlockingCalled = false;
      }, 2000);
    }

    if (this.totalAttempt === 1) {
      this.resourceService.GetResourceValues().then((data) => {
        this.toasterService.PresentToastMessageByTime( data['mobile.generics.retryUnlocking'], 100000);
      });
    }

    if (this.totalAttempt === this.maxAttempt) {
      this.toasterService.hideToastMessage();
      this.retryUnlockingFailed();
      this.totalAttempt = 0;
      this.retryUnlockingCalled = false;
      this.startUnlocking = false;
      setInterceptorError();
    }
  }

  async retryUnlockingFailed() {
    const modal = await this.modalCtrl.create({
      component: RetryUnlockingFailedComponent,
      cssClass: 'my-custom-class-adventure'
    })

    return await modal.present();
  }
  //

  async GetInfrastructureOffline(rubro: any) {
      this.databaseComponent = new DatabaseComponent(this.sqlite, this.persistence);
      const datosRubroInfraestructura = await this.databaseOffline.selectDataRubroInfraestructura(rubro.id);
      const datosMetadataFoto = await this.databaseOffline.selectDataMetaDataFoto
      (rubro.guid, rubro.codigoObligacion);
      let rubroInfraestructuraAux = new RubroInfraestructuraAux();
      rubroInfraestructuraAux.Rubro = rubro;
      rubroInfraestructuraAux.RubroInfraestructura = new RubroInfraestructura();
      if (datosRubroInfraestructura.length > 0) {
        if (datosRubroInfraestructura[0].altura !== null && datosRubroInfraestructura[0].altura !== undefined) {
          rubroInfraestructuraAux.RubroInfraestructura.altura = datosRubroInfraestructura[0].altura;
        }
        if (datosRubroInfraestructura[0].ancho !== null && datosRubroInfraestructura[0].ancho !== undefined) {
          rubroInfraestructuraAux.RubroInfraestructura.ancho = datosRubroInfraestructura[0].ancho;
        }
        if (datosRubroInfraestructura[0].calculoArea !== null &&
            datosRubroInfraestructura[0].calculoArea !== undefined) {
          rubroInfraestructuraAux.RubroInfraestructura.calculoArea = datosRubroInfraestructura[0].calculoArea;
        }
        if (datosRubroInfraestructura[0].circunferencia !== null &&
            datosRubroInfraestructura[0].circunferencia !== undefined) {
          rubroInfraestructuraAux.RubroInfraestructura.circunferencia =
            datosRubroInfraestructura[0].circunferencia;
        }
        if (datosRubroInfraestructura[0].fechaInicioEjecucion !==
            null && datosRubroInfraestructura[0].fechaInicioEjecucion !== undefined) {
          rubroInfraestructuraAux.RubroInfraestructura.fechaInicioEjecucion =
            new Date(datosRubroInfraestructura[0].fechaInicioEjecucion);
        }
        if (datosRubroInfraestructura[0].fechaFinEjecucion !== null &&
            datosRubroInfraestructura[0].fechaFinEjecucion !== undefined) {
          rubroInfraestructuraAux.RubroInfraestructura.fechaFinEjecucion =
            new Date(datosRubroInfraestructura[0].fechaFinEjecucion);
        }
        if (datosRubroInfraestructura[0].idTipoInfraestructura !== null &&
          datosRubroInfraestructura[0].idTipoInfraestructura !== undefined) {
          rubroInfraestructuraAux.RubroInfraestructura.idTipoInfraestructura =
            datosRubroInfraestructura[0].idTipoInfraestructura;
        }
        if (datosRubroInfraestructura[0].largo !== null && datosRubroInfraestructura[0].largo !== undefined) {
          rubroInfraestructuraAux.RubroInfraestructura.largo = datosRubroInfraestructura[0].largo;
        }
        if (datosRubroInfraestructura[0].nombrePredioObjInversion !== null &&
            datosRubroInfraestructura[0].nombrePredioObjInversion !== undefined) {
          rubroInfraestructuraAux.RubroInfraestructura.nombrePredioObjInversion =
            datosRubroInfraestructura[0].nombrePredioObjInversion;
        }
        if (datosRubroInfraestructura[0].numeroDivisiones !== null &&
            datosRubroInfraestructura[0].numeroDivisiones !== undefined) {
          rubroInfraestructuraAux.RubroInfraestructura.numeroDivisiones =
            datosRubroInfraestructura[0].numeroDivisiones;
        }
        if (datosRubroInfraestructura[0].profundidad !== null &&
            datosRubroInfraestructura[0].profundidad !== undefined) {
          rubroInfraestructuraAux.RubroInfraestructura.profundidad = datosRubroInfraestructura[0].profundidad;
        }
  
        //Photos
        rubroInfraestructuraAux.Rubro.listaMetaDataFoto = datosMetadataFoto;
  
        return rubroInfraestructuraAux;
      }
  }

    async updateRubroInfraestructuraOffline(res) {
      this.databaseComponent = new DatabaseComponent(this.sqlite, this.persistence);
      if (res.resultData !== null && res.responseCode === Enumerator.HTTP_RESPONSE_OK) {
        const rubroEntity = res.resultData[0].rubroInfraestructura;
        if (this.resourceService.IsDevice()) {
          await this.databaseOffline.deleteDataRubroInfraestructura(rubroEntity.idRubro);
          await this.databaseOffline.insertDataRubroInfraestructura(rubroEntity);
        }
      }
      else{
        this.resourceService.GetResourceValues().then((data) => {
          this.toasterService.PresentToastMessage(
            data['mobile.generics.sicronizarError'] + 'Infraestructura'
          );
        });
      }
    }

  updateMetadataFotoOffLine(res) {
    if (res.resultData !== null && res.responseCode === Enumerator.HTTP_RESPONSE_OK) {
      this.databaseComponent = new DatabaseComponent(this.sqlite, this.persistence);
      const rubroEntity = res.resultData[0].rubro;
      if (this.resourceService.IsDevice()) {
        this.databaseOffline.deleteDataMetaDataFoto(rubroEntity.guid, rubroEntity.codigoObligacion);
        const arregloMetadata = [];
        if (rubroEntity.listaMetaDataFoto !== null) {
          for (const metadata of rubroEntity.listaMetaDataFoto) {
          const entidadResultados = new EntidadMetadataAux();
          if (metadata.id === null || metadata.id === undefined) {
            metadata.id = 0;
          }
          entidadResultados.identificadorActividad = null;
          entidadResultados.metadata = metadata;
          arregloMetadata.push(entidadResultados);
          }
          for (const metadata of arregloMetadata) {
           this.databaseOffline.
            insertDataMetaDataFoto(rubroEntity.guid, metadata, rubroEntity.codigoObligacion);
          }
        }
      }
    }
    else{
      this.resourceService.GetResourceValues().then((data) => {
        this.toasterService.PresentToastMessage(
          data['mobile.generics.sicronizarError'] + 'Fotografías'
        );
      });
    }
  }

  async GetProductiveUnitOffline(rubro: any) {

    if (rubro.costoEjecutado === null)
    {
      rubro.costoEjecutado = 0;
    }
    this.databaseComponent = new DatabaseComponent(this.sqlite, this.persistence);
    const metadataFoto = await this.databaseOffline.selectDataMetaDataFoto
    (rubro.guid, rubro.codigoObligacion);
    const metadataRubro = metadataFoto.filter(m => m.identificadorActividad === null);
    // const datosActividades = await
    this.databaseOffline.selectDataRubroActividad(rubro.guid, rubro.codigoObligacion);
    const datosActividades = await this.databaseOffline.selectDataRubroActividad
    (rubro.guid, rubro.codigoObligacion);
    let indice = 0;
    for (const actividad of datosActividades) {
      let photo = [];
      photo = metadataFoto.filter(metadata =>
        metadata.identificadorActividad === indice);
      actividad.listaMetaDataFoto = photo;
      indice++;
    }
    const rubroCapitalTrabajo = new RubroCapitalTrabajo();

    rubro.listaMetaDataFoto = metadataRubro;
    rubroCapitalTrabajo.rubro = rubro;
    rubroCapitalTrabajo.listaActividades = datosActividades;
    return rubroCapitalTrabajo;
  }

  updateActividades(res) {
    if (res.resultData !== null && res.responseCode === Enumerator.HTTP_RESPONSE_OK) {
      this.databaseComponent = new DatabaseComponent(this.sqlite, this.persistence);
      const rubroEntity = res.resultData[0].rubro;
      if (this.resourceService.IsDevice()) {
        this.databaseOffline.deleteDataRubroActividad(rubroEntity.guid, rubroEntity.codigoObligacion);
        const listaActividades = res.resultData[0].listaActividades;
        if (listaActividades !== null) {
          for (const actividad of listaActividades) {
            this.databaseOffline.insertDataRubroActividad
            (rubroEntity.guid, actividad, rubroEntity.codigoObligacion);
            for (const fotoActividad of actividad.listaMetaDataFoto)
            {
              const entidadMetadata = new EntidadMetadataAux();
              entidadMetadata.metadata = fotoActividad;
              entidadMetadata.identificadorActividad = listaActividades.indexOf(actividad);
              this.databaseOffline.
                insertDataMetaDataFoto(rubroEntity.guid, entidadMetadata, rubroEntity.codigoObligacion);
            }
          }
        }
      }
    }
    else{
      this.resourceService.GetResourceValues().then((data) => {
        this.toasterService.PresentToastMessage(
          data['mobile.generics.sicronizarError'] + 'Actividades Capital de Trabajo'
        );
      });
    }
  }

  async GetImplementsOffline(rubro: any) {
    this.databaseComponent = new DatabaseComponent(this.sqlite, this.persistence);
    const datosMetadata = await this.databaseComponent.selectDataMetaDataFoto
    (rubro.guid, rubro.codigoObligacion);
    const rubroTractores = new RubroTractores();
    rubroTractores.Rubro = rubro;
    rubroTractores.Rubro.listaMetaDataFoto = datosMetadata;
    return rubroTractores;
  }
}
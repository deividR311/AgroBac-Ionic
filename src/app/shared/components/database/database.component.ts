import { Component, OnInit } from '@angular/core';
import { SQLite, SQLiteObject } from '@ionic-native/sqlite/ngx';
import { PersistenceService } from 'angular-persistence';
import { CantidadRubros } from '../../model/CantidadRubros';
import { Credit } from '../../model/credit';
import { Obligation } from '../../model/Obligation';
import { ObligacionUpdate } from '../../model/obligationUpdates';
import { RemanagementRubro } from '../../model/RemanagementRubro';
import { RubroInfraestructura } from '../../model/rubroInfrastructura';

@Component({
  selector: 'app-database',
  templateUrl: './database.component.html',
  styleUrls: ['./database.component.scss'],
})
export class DatabaseComponent implements OnInit {
  public database: SQLiteObject;
  constructor(private sqlite: SQLite, private readonly persistence: PersistenceService) {
  }

  ngOnInit() {}

  crearDataBase() {
    this.sqlite.create({
      name: 'apperos.db',
      location: 'default'
    }).then(
      async (db) => {
        this.database = db;
        this.persistence.set('Database', this.database);
        await this.createTableMenu();
        await this.createTableObligaciones();
        await this.createTableMetaDataFoto();
        await this.createTableRubro();
        await this.createTableParametro();
        await this.createTableRubroActividad();
        await this.createTableRubroInfraestructura();
        await this.createTableObligacion();
        await this.createTableCantidadRubros();
        await this.createTableObligationUpdates();
        await this.createTableRemanagementRubro();
      }
    ).catch(err => {
      console.log(err);
    });
  }

  // obligation updates
  async createTableObligationUpdates() {
    await this.database.executeSql(
      'CREATE TABLE IF NOT EXISTS obligationUpdates(' +
      'CodigoObligacion VARCHAR(50),' +
      'IdCase INTEGER,' +
      'obligationUpdate BOOLEAN)',
      [])
    .catch(err => {
      console.log(err);
    });
  }

  async insertDataObligationUpdates( obligacionUpdates : ObligacionUpdate ) {
    this.database = this.persistence.get('Database');
    await this.database.executeSql(
      'INSERT INTO obligationUpdates VALUES (?, ? , ?)',
        [ obligacionUpdates.CodigoObligacion, obligacionUpdates.IdCase,
          obligacionUpdates.obligationUpdate])
      .catch(err => {
        console.log(err);
      });
  }

  async deleteDataObligationUpdates( idCase : number, codigoObligacion: string ) {
    this.database = this.persistence.get('Database');
    await this.database.executeSql(
      `DELETE FROM obligationUpdates WHERE IdCase = ${idCase} AND CodigoObligacion = ${codigoObligacion}`
    )
    .catch(err => {
      console.log(err);
    });
  }

  async selectDataObligationUpdates( idCase : number, codigoObligacion: string ) {    
    const query = 'SELECT * FROM obligationUpdates WHERE IdCase = ? AND CodigoObligacion = ?';
    return await this.executeSelectQuery(query,[idCase, codigoObligacion]);
  }
  //

  // HostVisitor
  async createTableCantidadRubros() {
    await this.database.executeSql(
      'CREATE TABLE IF NOT EXISTS cantidadRubros(' +
      'CodigoObligacion VARCHAR(50),' +
      'IdCase INTEGER,' +
      'CantidadRubros INTEGER)',
      [])
    .catch(err => {
      console.log(err);
    });
  }

  async insertDataCantidadRubros( cantidadRubros : CantidadRubros ) {
    this.database = this.persistence.get('Database');
    await this.database.executeSql(
      'INSERT INTO cantidadRubros VALUES (?, ? , ?)',
        [ cantidadRubros.CodigoObligacion, cantidadRubros.IdCase,
          cantidadRubros.CantidadRubros])
      .catch(err => {
        console.log(err);
      });
  }

  async deleteDataCantidadRubros( idCase : number, codigoObligacion: string ) {
    this.database = this.persistence.get('Database');
    await this.database.executeSql(
      `DELETE FROM cantidadRubros WHERE IdCase = ${idCase} AND CodigoObligacion = ${codigoObligacion}`
    )
    .catch(err => {
      console.log(err);
    });
  }

  async selectDataCantidadRubros( idCase : number, codigoObligacion: string ) {    
    const query = 'SELECT * FROM cantidadRubros WHERE IdCase = ? AND CodigoObligacion = ?';
    return await this.executeSelectQuery(query,[idCase, codigoObligacion]);
  }

  async selectRubros( idCase : number, codigoObligacion: string ) {    
    const query = 'SELECT * FROM rubro WHERE idCase = ? AND codigoObligacion = ?';
    return await this.executeSelectQuery(query,[idCase, codigoObligacion]);
  }

  async createTableObligacion() {
    await this.database.executeSql(
      'CREATE TABLE IF NOT EXISTS obligacion(' +
      'Id INTEGER,' +
      'CodigoObligacion VARCHAR(50),' +
      'IdCase INTEGER,' +
      'NombreCompleto VARCHAR(200),' +
      'TipoIdentificacion INTEGER,' +
      'NumeroIdentificacion VARCHAR(12),' +
      'Celular VARCHAR(10),' +
      'Estado INTEGER,' +
      'IsInsert BOOLEAN)',
      [])
    .catch(err => {
      console.log(err);
    });
  }

  async insertDataObligacion( obligacion : Obligation, isInsert : Boolean ) {
    this.database = this.persistence.get('Database');
    
    await this.database.executeSql(
      'INSERT INTO obligacion VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)',
        [ obligacion.id, obligacion.codigoObligacion, obligacion.idCase, obligacion.nombreCompleto,
          obligacion.tipoIdentificacion, obligacion.numeroIdentificacion, obligacion.celular,
          obligacion.estado, isInsert])
      .catch(err => {
        console.log(err);
      });
  }

  async deleteDataObligacion( idCase : number, codigoObligacion: string ) {
    this.database = this.persistence.get('Database');
    await this.database.executeSql(`DELETE FROM obligacion WHERE IdCase = ${idCase} AND CodigoObligacion = ${codigoObligacion}`)
    .catch(err => {
      console.log(err);
    });
  }

  async selectDataObligacion( idCase : number, codigoObligacion: string ) {
    const query = 'SELECT * FROM obligacion WHERE IdCase = ? AND CodigoObligacion = ?';
    return await this.executeSelectQuery(query,[idCase, codigoObligacion]);
  }

  async selectAllDataObligacion( IsInsert : boolean ) {
    const query = 'SELECT * FROM obligacion WHERE IsInsert = ?';
    return await this.executeSelectQuery(query, [IsInsert]);
  }
  //

  // Create table Parametro
  async createTableParametro() {
    await this.database.executeSql(
      'CREATE TABLE IF NOT EXISTS parametro(' +
      'id INTEGER, ' +
      'codigo VARCHAR(100),' +
      'descripcion VARCHAR(100),' +
      'valor VARCHAR(100),' +
      'idBusqueda INTEGER)', [])
    .catch(err => {
      console.log(err);
    });
  }

  // Create table Menu
  async createTableMenu() {
    await this.database.executeSql(
      'CREATE TABLE IF NOT EXISTS Menu(' +
      'id INTEGER PRIMARY KEY AUTOINCREMENT, ' +
      'idPadre INTEGER,' +
      'nombre VARCHAR(100),' +
      'url VARCHAR(250),' +
      'estado BOOLEAN)', [])
    .catch(err => {
      console.log(err);
    });
  }

  // Create table Obligaciones
  async createTableObligaciones() {
    await this.database.executeSql(
      'CREATE TABLE IF NOT EXISTS Obligaciones(' +
      'id INTEGER PRIMARY KEY AUTOINCREMENT, ' +
      'codigoRubro VARCHAR(50), ' +
      'descripcionRubro VARCHAR(50),' +
      'fechaDesembolso VARCHAR(50),' +
      'fechaLimiteAutogestion VARCHAR(50),' +
      'guidRubro VARCHAR(70),' +
      'idCase INTEGER,' +
      'identificacionCliente VARCHAR(12),' +
      'montoDesembolso VARCHAR(20),' +
      'nombreCliente VARCHAR(50),' +
      'obligacion VARCHAR(50),' +
      'tipoDocumento VARCHAR(10),' +
      'tipoRubro VARCHAR(10),' +
      'valorDestino VARCHAR(20),' +
      'numeroDocumento VARCHAR(20),' +
      'ajustesRechazo TEXT,' +
      'state VARCHAR(50),' +
      'fechaRechazo VARCHAR(50),' +
      'usuarioRechazo VARCHAR(50),' +
      'justificacionRechazo TEXT)', [])
      .then(res => console.log(res))
      .catch(err => {
        console.log(err);
      });
  }

  // Create table Rubro
  async createTableRubro() {
    await this.database.executeSql(
      'CREATE TABLE IF NOT EXISTS rubro(' +
      'id INTEGER , ' +
      'codigoObligacion VARCHAR(50),' +
      'codigoTipoRubro INTEGER,' +
      'costoEjecutado INTEGER,' +
      'descripcion VARCHAR(50),' +
      'fechaCreacion VARCHAR(50),' +
      'fechaLimiteAutoGestion VARCHAR(50),' +
      'fechaModificacion VARCHAR(50),' +
      'guid VARCHAR(70),' +
      'idCase INTEGER,' +
      'tipoIdentificacion VARCHAR(12),' +
      'numeroIdentificacion VARCHAR(12),' +
      'usuarioCreacion VARCHAR(12),' +
      'usuarioModificacion VARCHAR(12),' +
      'rubroEnviado BOOLEAN,' +
      'tipoRubro INTEGER,' +
      'estadoObligacion INTEGER)', [])
    .catch(err => {
      console.log(err);
    });
  }

  // Create table MetaDataFoto
  async createTableMetaDataFoto() {
    await this.database.executeSql(
      'CREATE TABLE IF NOT EXISTS metaDataFoto(' +
      'id INTEGER, ' +
      'guid VARCHAR(70),' +
      'codigoObligacion VARCHAR(50),' +
      'identificadorActividad INTEGER,' +
      'altitud VARCHAR(100),' +
      'base64 TEXT,' +
      'fechaHora VARCHAR(50),' +
      'lugar VARCHAR(150),' +
      'nombreArchivo TEXT,' +
      'tipo INTEGER,' +
      'ubicacion TEXT)', [])
    .catch(err => {
      console.log(err);
    });
  }

  // Create table rubroActividad
  async createTableRubroActividad() {
    await this.database.executeSql(
      'CREATE TABLE IF NOT EXISTS rubroActividad(' +
      'id INTEGER, ' +
      'guid VARCHAR(70),' +
      'codigoObligacion VARCHAR(50),' +
      'idActividad INTEGER,' +
      'costoEjecutado INTEGER,' +
      'descripcionActividad VARCHAR(50),' +
      'idRubro INTEGER)', [])
    .catch(err => {
      console.log(err);
    });
  }


  async createTableRubroInfraestructura() {
     await this.database.executeSql(
      'CREATE TABLE IF NOT EXISTS rubroInfraestructura(' +
      'idRubro INTEGER,' +
      'nombrePredioObjInversion VARCHAR(50), ' +
      'fechaInicioEjecucion VARCHAR(50),' +
      'fechaFinEjecucion  VARCHAR(50),' +
      'largo INTEGER,' +
      'ancho INTEGER,' +
      'circunferencia INTEGER, ' +
      'profundidad INTEGER, ' +
      'altura INTEGER, ' +
      'calculoArea INTEGER, ' +
      'idTipoInfraestructura INTEGER,' +
      'numeroDivisiones INTEGER)' , [])
      .catch(err => {

      });
  }

  //
  async createTableRemanagementRubro() {
    await this.database.executeSql(
      'CREATE TABLE IF NOT EXISTS remanagementRubro(' +
      'Id INTEGER,' +
      'CodigoObligacion VARCHAR(50),' +
      'IdCase INTEGER,' +
      'TipoRubro INTEGER)',
      [])
    .catch(err => {
      console.log(err);
    });
  }

  async insertRemanagementRubro( remanagementRubro : RemanagementRubro ) {
    this.database = this.persistence.get('Database');
    
    await this.database.executeSql(
      'INSERT INTO remanagementRubro VALUES (?, ?, ?, ?)',
        [ remanagementRubro.id, remanagementRubro.codigoObligacion, remanagementRubro.idCase,
          remanagementRubro.tipoRubro])
      .catch(err => {
        console.log(err);
      });
  }

  async deleteRemanagementRubro( idCase : number, codigoObligacion: string ) {
    this.database = this.persistence.get('Database');
    await this.database.executeSql(`DELETE FROM remanagementRubro WHERE IdCase = ${idCase} AND CodigoObligacion = ${codigoObligacion}` )
    .catch(err => {
      console.log(err);
    });
  }

  async selectRemanagementRubro( idCase : number, codigoObligacion: string, tipoRubro: number ) {
    const query = 'SELECT * FROM remanagementRubro WHERE IdCase = ? AND CodigoObligacion = ? AND TipoRubro = ?';
    return await this.executeSelectQuery(query,[idCase, codigoObligacion, tipoRubro]);
  }

  async selectRemanagementRubros( idCase : number, codigoObligacion: string ) {
    const query = 'SELECT * FROM remanagementRubro WHERE IdCase = ? AND CodigoObligacion = ?';
    return await this.executeSelectQuery(query,[idCase, codigoObligacion]);
  }
  //

  // Insert data parametro
  async insertDataParametro(parametro, idBusqueda) {
    this.database = this.persistence.get('Database');
    await this.database.executeSql(
      'INSERT INTO parametro VALUES (?, ? , ? , ?, ?)',
        [ parametro.id, parametro.codigo, parametro.descripcion, parametro.valor, idBusqueda])
      .catch(err => {
        console.log(err);
      });
  }

  // Insert data menu
  async insertDataMenu(idPadre, nombre, url, estado) {
    this.database = this.persistence.get('Database');
    await this.database.executeSql(
      'INSERT INTO Menu VALUES (?, ?, ? , ? , ?)',
        [null, idPadre, nombre, url, estado])
      .catch(err => {
        console.log(err);
      });
  }

  // Insert data obligaciones
  async insertDataObligaciones(identificacionCliente, obligacionEntity : Credit) {
    this.database = this.persistence.get('Database');
    await this.database.executeSql(
      'INSERT INTO Obligaciones VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)',
        [null, obligacionEntity.codigoRubro , obligacionEntity.descripcionRubro ,
          obligacionEntity.fechaDesembolso, obligacionEntity.fechaLimiteAutogestion ,
          obligacionEntity.guidRubro, obligacionEntity.idCase, identificacionCliente,
          obligacionEntity.montoDesembolso, obligacionEntity.nombreCliente,
          obligacionEntity.obligacion, obligacionEntity.tipoDocumento,
          obligacionEntity.tipoRubro, obligacionEntity.valorDestino, obligacionEntity.numeroDocumento,
          obligacionEntity.ajustesRechazo, obligacionEntity.state, obligacionEntity.fechaRechazo,
          obligacionEntity.usuarioRechazo, obligacionEntity.justificacionRechazo
          ])
      .catch(err => {
        console.log(err);
      });
  }

  // Insert data rubro
  async insertDataRubro(rubroEntity, rubroEnviado, tipoRubro) {
    this.database = this.persistence.get('Database');
    await this.database.executeSql(
      'INSERT INTO rubro VALUES (?, ? , ? , ? , ? , ? , ? , ? , ? , ? , ? , ? , ? , ? , ?, ?, ?)',
        [rubroEntity.id , rubroEntity.codigoObligacion ,
          rubroEntity.codigoTipoRubro, rubroEntity.costoEjecutado ,
          rubroEntity.descripcion, rubroEntity.fechaCreacion, rubroEntity.fechaLimiteAutoGestion,
          rubroEntity.fechaModificacion, rubroEntity.guid,
          rubroEntity.idCase, rubroEntity.tipoIdentificacion, rubroEntity.numeroIdentificacion,
          rubroEntity.usuarioCreacion, rubroEntity.usuarioModificacion,
          rubroEnviado, tipoRubro, rubroEntity.estadoObligacion])
      .catch(err => {
        console.log(err);
      });
  }

  // Insert data metadatafoto
  async insertDataMetaDataFoto(guid , metadataEntity, codigoObligacion) {
    this.database = this.persistence.get('Database');
    await this.database.executeSql(
      'INSERT INTO metaDataFoto VALUES (?, ? , ?, ? , ? , ? , ? , ? , ? , ? , ? )',
        [metadataEntity.metadata.id , guid,
          codigoObligacion, metadataEntity.identificadorActividad,
          metadataEntity.metadata.altitud, metadataEntity.metadata.base64,
          metadataEntity.metadata.fechaHora, metadataEntity.metadata.lugar,
          metadataEntity.metadata.nombreArchivo ,
          metadataEntity.metadata.tipo , metadataEntity.metadata.ubicacion])
      .catch(err => {
        console.log(err);
      });
  }

  // Insert data actividades
  async insertDataRubroActividad(guid , rubroActividad, codigoObligacion) {
    this.database = this.persistence.get('Database');
    await this.database.executeSql(
      'INSERT INTO rubroActividad VALUES (?, ? , ? , ? , ? , ? , ? )',
        [rubroActividad.id, guid, codigoObligacion
        , rubroActividad.idActividad, rubroActividad.costoEjecutado,
        rubroActividad.descripcionActividad, rubroActividad.idRubro])
      .catch(err => {
        console.log(err);
      });
  }

  async insertDataRubroInfraestructura(rubroInfraestructura: RubroInfraestructura) {
    this.database = this.persistence.get('Database');
    await this.database.executeSql(
      'INSERT INTO rubroInfraestructura VALUES (?, ? , ? , ? , ? , ? , ?,? , ?, ? ,? ,?)' ,
      [ rubroInfraestructura.idRubro,
        rubroInfraestructura.nombrePredioObjInversion,
        rubroInfraestructura.fechaInicioEjecucion,
        rubroInfraestructura.fechaFinEjecucion,
        rubroInfraestructura.largo,
        rubroInfraestructura.ancho,
        rubroInfraestructura.circunferencia,
        rubroInfraestructura.profundidad,
        rubroInfraestructura.altura,
        rubroInfraestructura.calculoArea,
        rubroInfraestructura.idTipoInfraestructura,
        rubroInfraestructura.numeroDivisiones
      ]
    )
    .catch(err => {
      console.log(err);
    });
  }

  async deleteDataRubroInfraestructura(idrubro) {
    this.database = this.persistence.get('Database');
    await this.database.executeSql('DELETE FROM rubroInfraestructura WHERE idRubro = "' + idrubro + '" ')
    .catch(err => {
      console.log(err);
    });
  }

  // Delete
  // Delete data parametro
  async deleteDataParametro(idBusqueda) {
    this.database = this.persistence.get('Database');
    await this.database.executeSql('DELETE FROM parametro WHERE idBusqueda = "' + idBusqueda + '" ')
    .catch(err => {
      console.log(err);
    });
  }

  // Delete data menu
  async deleteDataMenu() {
    this.database = this.persistence.get('Database');
    await this.database.executeSql('DELETE FROM Menu')
    .catch(err => {
      console.log(err);
    });
  }

  // Delete data obligaciones
  async deleteDataObligaciones(identificacionCliente) {
    this.database = this.persistence.get('Database');
    await this.database.executeSql(
      'DELETE FROM Obligaciones WHERE identificacionCliente = "' + identificacionCliente + '"')
      .catch(err => {
        console.log(err);
      });
  }

  // Delete data rubro
  async deleteDataRubro(guid, codigoObligacion) {
    this.database = this.persistence.get('Database');
    await this.database.executeSql(
      'DELETE FROM rubro WHERE guid = "' + guid + '" AND codigoObligacion = "'
      + codigoObligacion + '"')
      .catch(err => {
        console.log(err);
      });
  }

  // Delete data metaDataFoto
  async deleteDataMetaDataFoto(guid, codigoObligacion) {
    this.database = this.persistence.get('Database');
    await this.database.executeSql(
      'DELETE FROM metaDataFoto WHERE guid = "' + guid + '" AND codigoObligacion = "'
      + codigoObligacion + '"')
      .catch(err => {
        console.log(err);
      });
  }

  // Delete data actividades
  async deleteDataRubroActividad(guid, codigoObligacion) {
    this.database = this.persistence.get('Database');
    await this.database.executeSql(
      'DELETE FROM rubroActividad WHERE guid = "' + guid + '" AND codigoObligacion = "'
      + codigoObligacion + '"')
      .catch(err => {
        console.log(err);
      });
  }


  // Select
  // Select data parametr
  async selectDataParametro(idBusqueda) {
    const query = 'SELECT * FROM parametro WHERE idBusqueda = ?';
    return await this.executeSelectQuery(query,[idBusqueda]);
  }

  // Select data menu
  async selectDataMenu() {
    const query = 'SELECT * FROM Menu';
    return await this.executeSelectQuery(query);
  }

  // Select data obligaciones
  async selectDataObligaciones(identificacionCliente) {
    const query = 'SELECT * FROM Obligaciones WHERE identificacionCliente = ?';
    return await this.executeSelectQuery(query, [identificacionCliente]);
  }

  // Select data obligaciones
  async selectDataObligacionesNumDoc(numeroDocumento, identificacionCliente) {
    const query = 'SELECT * FROM Obligaciones WHERE identificacionCliente = ? AND numeroDocumento = ?';
    return await this.executeSelectQuery(query, [identificacionCliente, numeroDocumento]);
  }

    // Select data obligaciones
    async selectDataObligacionesNumDocumento(numeroDocumento) {
      const query = 'SELECT * FROM Obligaciones WHERE numeroDocumento = ?';
      return await this.executeSelectQuery(query, [numeroDocumento]);
    }

  // Select data rubro
  async selectDataRubro(guid, codigoObligacion) {
    const query = 'SELECT * FROM rubro WHERE guid = ? AND codigoObligacion = ?';
    return await this.executeSelectQuery(query,[guid, codigoObligacion]);
  }

  // Select data metadatafoto
  async selectDataMetaDataFoto(guid, codigoObligacion) {
    const query = 'SELECT * FROM metaDataFoto WHERE guid = ? AND codigoObligacion = ?';
    return await this.executeSelectQuery(query,[guid, codigoObligacion]);
  }

  // Select data actividades
  async selectDataRubroActividad(guid, codigoObligacion) {
    const query = 'SELECT * FROM rubroActividad WHERE guid = ? AND codigoObligacion = ?';
    return await this.executeSelectQuery(query,[guid, codigoObligacion]);
  }

  // Select data rubro no enviados
  async selectDataRubroNoEnviados() {
    const query = 'SELECT * FROM rubro WHERE rubroEnviado = ?';
    return await this.executeSelectQuery(query,[false]);
  }

  // Select rubro infraestructura
  async selectDataRubroInfraestructura(idRubro) {
    const query = 'SELECT * FROM rubroInfraestructura WHERE idRubro = ?';
    return await this.executeSelectQuery(query,[idRubro]);
  }

  async executeSelectQuery(query : string, params? : any[]){
      const datos = [];
      this.database = this.persistence.get('Database');
      if (this.database !== undefined)
      {
        await this.database.executeSql(
          query, params)
          .then((data) => {
            if (data.rows.length > 0) {
              for (let i = 0; i < data.rows.length; i++) {
                const prueba = data.rows.item(i);
                datos.push(prueba);
              }
            }
          })
          .catch(err => {
            console.log(err);
          });
      }
      return datos;
  }

  async updateRubroOffline(guid, codigoObligacion, id)
  {
    this.database = this.persistence.get('Database');
    await this.database.executeSql(
      'UPDATE rubro SET rubroEnviado = true, id ='+id+' WHERE guid = "' + guid + '" AND codigoObligacion = "'
      + codigoObligacion + '"')
      .catch(err => {
        console.log(err);
      });
  }

  async DeleteDataObligacion(codigoObligacion){
    this.database = this.persistence.get('Database');

    //Eliminamos Metadata
    await this.database.executeSql(
      'DELETE FROM metaDataFoto WHERE codigoObligacion = "'
      + codigoObligacion + '"')
      .catch(err => {
        console.log(err);
      });

    //Eliminamos Actividades
    await this.database.executeSql(
      'DELETE FROM rubroActividad WHERE codigoObligacion = "'
      + codigoObligacion + '"')
      .catch(err => {
        console.log(err);
      });



    //Eliminamos Rubros
    await this.database.executeSql(
      'DELETE FROM rubro WHERE codigoObligacion = "'
      + codigoObligacion + '"')
      .catch(err => {
        console.log(err);
      });

    //Eliminamos Obligacion
    await this.database.executeSql(
      'DELETE FROM Obligaciones WHERE obligacion = "' + codigoObligacion + '"')
      .catch(err => {
        console.log(err);
      });
  }

}

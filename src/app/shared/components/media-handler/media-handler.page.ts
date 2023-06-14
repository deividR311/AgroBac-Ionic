import { Component, EventEmitter, Input, OnInit, Output } from '@angular/core';
import { Camera } from '@ionic-native/camera/ngx';
import { HomeService } from 'src/app/services/home/home.service';
import { Credit } from '../../model/credit';
import { ToasterService } from 'src/app/services/toaster/toaster.service';
import { Thumbnail } from '../../model/thumbnail';
import { AlertController } from '@ionic/angular';
import exifr from 'exifr';
import { Metadata } from '../../model/metadata';
import { Support } from '../../model/support';
import { Geolocation, Geoposition } from '@ionic-native/geolocation/ngx';
import { MetaDataFoto } from '../../model/metadataFoto';
import { LocationAccuracy } from '@ionic-native/location-accuracy/ngx';
import { AndroidPermissions } from '@ionic-native/android-permissions/ngx';
import { WebView } from '@ionic-native/ionic-webview/ngx';
import { Base64 } from '@ionic-native/base64/ngx';
import { Enumerator } from '../../enum/enumerator.enum';
import { ResourceService } from 'src/app/services/resource/resource.service';
import { File } from '@ionic-native/file/ngx';

@Component({
  selector: 'media-handler',
  templateUrl: './media-handler.page.html',
  styleUrls: ['./media-handler.page.scss'],
})
export class MediaHandlerPage implements OnInit {
  sinPermisos = false;
  image: any;
  output: string;
  datosMetadata = new Metadata();
  emitThumbnail = new Thumbnail();
  kbytes: any;
  latitud: string;
  longitud: string;
  altitud: string;
  @Input() heading: Credit;
  @Input() supportType: Support;
  @Output() result = new EventEmitter<Thumbnail>();

  constructor(private readonly camera: Camera, private readonly homeService: HomeService,
    private readonly toaster: ToasterService, private alertController: AlertController,
    public readonly geolocalition: Geolocation,
    private readonly locationAccuracy: LocationAccuracy,
    private readonly androidPermissions: AndroidPermissions,
    private readonly webview: WebView,
    private readonly base64: Base64,
    private readonly resourceService: ResourceService,
    private file : File) { }



  ngOnInit() {
  }

  /* Media */
  PhotoOrGallery(opcion) {
    this.sinPermisos = false;
    let sourceTypeVariable = opcion ? this.camera.PictureSourceType.CAMERA :
      this.camera.PictureSourceType.PHOTOLIBRARY;
    let qualityTypeVariable = 50;

    if (this.supportType.requireMetaData && opcion) {
      this.checkGPSPermission().then(
        (metadata) => {
          this.getPicture(sourceTypeVariable,qualityTypeVariable,opcion);
        }
      ).catch(
        (err) => {
        }
      );
    }
    if (this.supportType.requireMetaData && !opcion) {
      this.camera.getPicture({
        destinationType: this.camera.DestinationType.FILE_URI,
        sourceType: sourceTypeVariable,
        mediaType: this.camera.MediaType.PICTURE,
        allowEdit: false,
        encodingType: this.camera.EncodingType.JPEG,
        targetHeight: 800,
        targetWidth: 800,
        correctOrientation: true,
        saveToPhotoAlbum: true,
        quality: 50,
      }).then((resultado) => {        
        this.file.resolveLocalFilesystemUrl(resultado).then((file) => {
          const { name, filesystem: {root: { nativeURL }} } = file;
          this.file.readAsDataURL(nativeURL, name ).then((result : any) => {
            const photo: Thumbnail = new Thumbnail();
            photo.photoBase64 = result;
            photo.src = photo.photoBase64;
            photo.id = 0;
            this.getMetadataSupport(photo, opcion);
          }).catch( err => console.log(err) )
        })
      }).catch(error => {
        this.sinPermisos = 
        error === Enumerator.CAMERA_PERMISSION_ERROR;
      });
    }
    if ((!this.supportType.requireMetaData && opcion) ||
    (!this.supportType.requireMetaData && !opcion)) {
      this.getPicture(sourceTypeVariable,qualityTypeVariable,opcion);
    }
  }

  /* Read EXIF Metadata */

  async getMetadata(image) {
    let entidad = null;
    let safeURL = this.webview.convertFileSrc(image.src);
    let img = new Image();
    img.src = safeURL;
    const result = await exifr.gps(img).catch();
    if (result !== undefined) {
      entidad = new MetaDataFoto();
      const existeInfoGPS = await exifr.gps(img);
      let latitud = '';
      let longitud = '';
      if (existeInfoGPS !== undefined)
        {
          if (existeInfoGPS.latitude !== undefined) {
            latitud = this.convertToString(existeInfoGPS.latitude);
          }
    
          if (existeInfoGPS.longitude !== undefined) {
            longitud = this.convertToString(existeInfoGPS.longitude);
          }
    
          entidad.lugar = "";
          entidad.ubicacion = `${latitud},${longitud}`;
          // Fecha, Altitud
          const existeInfoFecha = await exifr.parse(img, { tiff: true, xmp: true });
    
          if (existeInfoFecha.GPSAltitude !== undefined) {
            entidad.altitud = this.convertToString(existeInfoFecha.GPSAltitude);
          }
    
          if (existeInfoFecha.ModifyDate !== undefined) {
            entidad.fechaHora = new Date(this.convertToString(existeInfoFecha.ModifyDate)).toISOString();
          }
        }
    }
    else {
      this.mostrarMensajeAlertaSinMetadata();
    }
    return entidad;
  }

  async mostrarMensajeAlerta(opcion) {
    const alert = await this.alertController.create({
      cssClass: 'contenedor-principal',
      header: 'Información',
      message: '<strong>Recuerde que cada imagen debe ser sobre su inversión y no debe contener imágenes de personas, mayores o menores de edad</strong>',
      buttons: [
        {
          text: 'Aceptar',
          handler: () => {
            this.PhotoOrGallery(opcion);
          },
        }
      ]
    });
    await alert.present();
  }

  async mostrarMensajeAlertaSinMetadata() {
    const alert = await this.alertController.create({
      cssClass: 'contenedor-principal',
      header: 'Información',
      message: '<strong>La(s) foto(s) seleccionada no cuenta con la información requerida, incluir una nueva foto.</strong>',
      buttons: [
        {
          text: 'Aceptar'
        }
      ]
    });
    await alert.present();
  }

  async mostrarMensajeAlertaNoUbicacion() {
    const alert = await this.alertController.create({
      cssClass: 'contenedor-principal',
      header: 'Información',
      message: '<strong>No se pudo obtener la ubicación.</strong>',
      buttons: [
        {
          text: 'Aceptar'
        }
      ]
    });
    await alert.present();
  }

  async getMetadataSupport(thumbnail: Thumbnail, opcion) {
    const image = new Image();
    image.src = thumbnail.photoBase64;
    if (this.supportType.requireMetaData && opcion) {
      await this.checkGPSPermission().then(
        (metadata) => {
          thumbnail.metadata = metadata;
          if (thumbnail.metadata !== null &&
            thumbnail.metadata !== undefined) {
            thumbnail.metadata.base64 = thumbnail.photoBase64;
            thumbnail.metadata.id = 0;
            this.result.emit(thumbnail);
          }
          else {
            this.mostrarMensajeAlertaNoUbicacion();
          }
        }
      );
    }
    if (this.supportType.requireMetaData && !opcion) {
      // debugger;
      const metadata = await this.getMetadata(image);
      
      if (metadata) {
        thumbnail.metadata = metadata;
        thumbnail.photoBase64 = image.src;
        thumbnail.src = image.src;
        thumbnail.metadata.base64 = image.src;
        this.result.emit(thumbnail);
      }
    }
    if ((!this.supportType.requireMetaData && opcion) ||
      (!this.supportType.requireMetaData && !opcion)) {
      this.result.emit(thumbnail);
    }
  }

  convertToString(metadata) {
    if (metadata !== undefined) {
      metadata = metadata.toString();
    }
    return metadata;
  }
  calculateImageSize(base64String) {
    let padding;
    let inBytes;
    let base64StringLength;
    if (base64String.endsWith('==')) { padding = 2; }
    else if (base64String.endsWith('=')) { padding = 1; }
    else { padding = 0; }

    base64StringLength = base64String.length;
    
    inBytes = (base64StringLength / 4) * 3 - padding;
    
    this.kbytes = inBytes / 1000;
    return this.kbytes;
  }
  //Check if application having GPS access permission  
  async checkGPSPermission(): Promise<MetaDataFoto> {
    return await this.androidPermissions.checkPermission(this.androidPermissions.PERMISSION.ACCESS_COARSE_LOCATION).then(
      async (result) => {
        if (result.hasPermission) {
          //If having permission show 'Turn On GPS' dialogue
          return await this.askToTurnOnGPS(true);
        } else {
          //If not having permission ask for permission
          return await this.requestGPSPermission();
        }
      },
      err => {
        this.sinPermisos = true;
        return null;
      }
    );
  }

  async requestGPSPermission(): Promise<MetaDataFoto> {
    return await this.locationAccuracy.canRequest().then(async (canRequest: boolean) => {
      if (canRequest) {
        return null;
      } else {
        //Show 'GPS Permission Request' dialogue
        await this.androidPermissions.requestPermission(this.androidPermissions.PERMISSION.ACCESS_COARSE_LOCATION)
          .then(
            async () => {
              // call method to turn on GPS
              return await this.askToTurnOnGPS(false);
            },
            () => {
              //Show alert if user click on 'No Thanks'
              this.sinPermisos = true;
              return null;
            }
          );
      }
    });
  }
  async askToTurnOnGPS(permission: boolean): Promise<MetaDataFoto> {
    return await this.locationAccuracy.request(this.locationAccuracy.REQUEST_PRIORITY_HIGH_ACCURACY).then(
      async (res) => {
        // When GPS Turned ON call method to get Accurate location coordinates
        const metadata = await this.getLocationCoordinates(permission);
        this.sinPermisos = false;
        return metadata;
      },
      error => {
        return null;
      }
    );
  }
  // Methos to get device accurate coordinates using device GPS
  async getLocationCoordinates(permission: boolean): Promise<MetaDataFoto> {

    return await this.geolocalition.getCurrentPosition(
      { enableHighAccuracy: true, timeout: 30000 }).then(async (resp) => {
      let metadata = new MetaDataFoto();
      metadata.altitud = resp.coords.altitude === null ?
      '' : resp.coords.altitude.toString();
      metadata.fechaHora = new Date().toISOString();
      metadata.ubicacion = `${resp.coords.latitude.toString()},${resp.coords.longitude.toString()}`;
      metadata.nombreArchivo = 'Nombre Archivo';

      return metadata;
    }, (err) => {
    }).catch((error) => {
      return null;
    });
  }

  getPicture(sourceTypeVariable,qualityTypeVariable,opcion)  {
    this.camera.getPicture({
      destinationType: this.camera.DestinationType.DATA_URL,
      sourceType: sourceTypeVariable,
      mediaType: this.camera.MediaType.PICTURE,
      allowEdit: false,
      encodingType: this.camera.EncodingType.JPEG,
      targetHeight: 800,
      targetWidth: 800,
      correctOrientation: true,
      saveToPhotoAlbum: true,
      quality: qualityTypeVariable,
    }).then((resultado) => {
      const photo: Thumbnail = new Thumbnail();
      photo.photoBase64 = 'data:image/jpeg;base64,' + resultado;
      photo.src = photo.photoBase64;
      photo.id = 0;
      this.getMetadataSupport(photo, opcion);
    }).catch(error => {
      this.sinPermisos = error === Enumerator.CAMERA_PERMISSION_ERROR;
    });
  }
  
}



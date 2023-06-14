import { Injectable } from '@angular/core';
import { AlertController } from '@ionic/angular';

@Injectable({
  providedIn: 'root',
})

export class UtilitiesService {

    // cssClass
  alertCssClassName : string = 'contenedor-principal';
  alertHeader : string = 'Confirmación';

  constructor( private readonly alertController: AlertController ) {}

  async validarformatoImagen(support : any): Promise<boolean> {
    if (!support.includes('/9j/')) {
      const alert = await this.alertController.create({
        cssClass: this.alertCssClassName,
        header: this.alertHeader,
        message: '<strong>La imagen no cumple con el formato correcto.</strong>',
        buttons: [
          {
            text: 'Aceptar'
          }
        ]
      });

      await alert.present();
      return false;
    }

    return true;
  }

  async checkImageSize(base64: string, index: number, maxSizePhotosParm: number, minSizePhotosParm: number) {
    // Check file size from base64 string in Kbytes
    const size = ((base64.length * (3 / 4)) / 1000);

    if (size <= (maxSizePhotosParm * 1000) && size >= (minSizePhotosParm * 1000)) {
        return true;
      } else {
        const alert = await this.alertController.create({
          cssClass: this.alertCssClassName,
          header: this.alertHeader,
          message: `<strong>Únicamente se permiten imágenes que pesen menos de
          ${maxSizePhotosParm} Mb y más de ${minSizePhotosParm}
           Mb</strong>`,
          buttons: [
            {
              text: 'Aceptar'
            }
          ]
        });
        await alert.present();
    }
  }
}

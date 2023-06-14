import { Injectable } from "@angular/core";
import { ToastController } from "@ionic/angular";
import { Enumerator } from "src/app/shared/enum/enumerator.enum";


@Injectable({
    providedIn: 'root'
})

export class ToasterService {

    toastDuration : number = Enumerator.TOASTER_DURATION_TIME;

    constructor(private readonly toastController: ToastController){
    }

    async PresentToastMessage(message: string){
        const toast = await this.toastController.create({
            message: message,
            duration: this.toastDuration
        });

        toast.present();
    }

    hideToastMessage() {
        this.toastController.dismiss();
    }

    async PresentToastMessageByTime( message: string, time: number = this.toastDuration ){
        const toast = await this.toastController.create({
            message: message,
            duration: time
        });

        toast.present();
    }
}

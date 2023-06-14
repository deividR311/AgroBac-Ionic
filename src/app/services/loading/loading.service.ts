import { Injectable } from '@angular/core';
import { LoadingController } from '@ionic/angular';

@Injectable({
    providedIn: 'root'
})

export class LoadingService {
    isLoading = false;
    count = 0;
    constructor(private readonly loadingController: LoadingController) {
    }
    async loadingPresent() {
      this.count++;
        this.isLoading = true;
        return await this.loadingController.create({
          message: 'Por favor espere...',
          spinner: 'circles'
        }).then(a => {
          a.present().then(() => {
            if (!this.isLoading) {
              a.dismiss().then(() => {});
            }
          });
        });
      }
      async loadingDismiss() {
        this.count--;
        if (this.count = 1)
        {
          this.isLoading = false;
          return await this.loadingController.dismiss().then(() => {});
        }
      }
}

import { Component, OnInit } from '@angular/core';
import { ModalController } from '@ionic/angular';

@Component({
  selector: 'app-retry-unlocking-failed',
  templateUrl: './retry-unlocking-failed.component.html',
  styleUrls: ['./retry-unlocking-failed.component.scss'],
})
export class RetryUnlockingFailedComponent implements OnInit {

  constructor( private readonly modalCtrl: ModalController ) { }

  ngOnInit() {}

  closeModal() {
    this.modalCtrl.dismiss();
  }
}

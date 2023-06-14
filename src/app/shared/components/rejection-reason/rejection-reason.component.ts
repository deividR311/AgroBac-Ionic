import { Component, Input, OnInit } from '@angular/core';
import { ModalController } from '@ionic/angular';
import { Credit } from '../../model/credit';

@Component({
  selector: 'app-rejection-reason',
  templateUrl: './rejection-reason.component.html',
  styleUrls: ['./rejection-reason.component.scss'],
})
export class RejectionReasonComponent implements OnInit {
  @Input() credit : Credit;

  constructor( private readonly modalCtrl: ModalController ) { }

  ngOnInit() { }

  closeModal() {
    this.modalCtrl.dismiss();
  }

}

import { Component, OnInit, ViewChild } from '@angular/core';
import { AppComponent} from '../../app.component'
import { ResourceService } from 'src/app/services/resource/resource.service';
import { UnlockingService } from 'src/app/services/unlocking/unlocking.service';

@Component({
  selector: 'app-principal',
  templateUrl: './principal.page.html',
  styleUrls: ['./principal.page.scss'],
})
export class PrincipalPage implements OnInit {
  //@ViewChild(AppComponent) appComponent: AppComponent;

  constructor(private readonly resourceService: ResourceService,
    private unlockingService : UnlockingService) {
  }

  ngOnInit() {
    if (this.resourceService.IsOnline()) {
      this.unlockingService.UploadPendingChanges();
    }
  }
}
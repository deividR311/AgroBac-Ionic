import { async, ComponentFixture, TestBed } from '@angular/core/testing';
import { IonicModule } from '@ionic/angular';

import { AuthorizationDataTreatmentPage } from './authorization-data-treatment.page';

describe('AuthorizationDataTreatmentPage', () => {
  let component: AuthorizationDataTreatmentPage;
  let fixture: ComponentFixture<AuthorizationDataTreatmentPage>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ AuthorizationDataTreatmentPage ],
      imports: [IonicModule.forRoot()]
    }).compileComponents();

    fixture = TestBed.createComponent(AuthorizationDataTreatmentPage);
    component = fixture.componentInstance;
    fixture.detectChanges();
  }));

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});

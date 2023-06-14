import { async, ComponentFixture, TestBed } from '@angular/core/testing';
import { IonicModule } from '@ionic/angular';

import { AuthorizationtermsConditionsPage } from './authorizationterms-conditions.page';

describe('AuthorizationtermsConditionsPage', () => {
  let component: AuthorizationtermsConditionsPage;
  let fixture: ComponentFixture<AuthorizationtermsConditionsPage>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ AuthorizationtermsConditionsPage ],
      imports: [IonicModule.forRoot()]
    }).compileComponents();

    fixture = TestBed.createComponent(AuthorizationtermsConditionsPage);
    component = fixture.componentInstance;
    fixture.detectChanges();
  }));

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});

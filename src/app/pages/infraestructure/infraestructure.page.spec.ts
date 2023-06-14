import { async, ComponentFixture, TestBed } from '@angular/core/testing';
import { IonicModule } from '@ionic/angular';

import { InfraestructurePage } from './infraestructure.page';

describe('InfraestructurePage', () => {
  let component: InfraestructurePage;
  let fixture: ComponentFixture<InfraestructurePage>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ InfraestructurePage ],
      imports: [IonicModule.forRoot()]
    }).compileComponents();

    fixture = TestBed.createComponent(InfraestructurePage);
    component = fixture.componentInstance;
    fixture.detectChanges();
  }));

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});

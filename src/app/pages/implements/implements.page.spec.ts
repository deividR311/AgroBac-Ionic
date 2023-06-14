import { async, ComponentFixture, TestBed } from '@angular/core/testing';
import { IonicModule } from '@ionic/angular';

import { ImplementsPage } from './implements.page';

describe('ImplementsPage', () => {
  let component: ImplementsPage;
  let fixture: ComponentFixture<ImplementsPage>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ ImplementsPage ],
      imports: [IonicModule.forRoot()]
    }).compileComponents();

    fixture = TestBed.createComponent(ImplementsPage);
    component = fixture.componentInstance;
    fixture.detectChanges();
  }));

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});

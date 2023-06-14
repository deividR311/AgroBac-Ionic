import { async, ComponentFixture, TestBed } from '@angular/core/testing';
import { IonicModule } from '@ionic/angular';

import { RubroPage } from './rubro.page';

describe('RubroPage', () => {
  let component: RubroPage;
  let fixture: ComponentFixture<RubroPage>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ RubroPage ],
      imports: [IonicModule.forRoot()]
    }).compileComponents();

    fixture = TestBed.createComponent(RubroPage);
    component = fixture.componentInstance;
    fixture.detectChanges();
  }));

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});

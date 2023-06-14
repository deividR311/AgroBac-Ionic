import { async, ComponentFixture, TestBed } from '@angular/core/testing';
import { IonicModule } from '@ionic/angular';

import { ProductiveUnitPage } from './productive-unit.page';

describe('ProductiveUnitPage', () => {
  let component: ProductiveUnitPage;
  let fixture: ComponentFixture<ProductiveUnitPage>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ ProductiveUnitPage ],
      imports: [IonicModule.forRoot()]
    }).compileComponents();

    fixture = TestBed.createComponent(ProductiveUnitPage);
    component = fixture.componentInstance;
    fixture.detectChanges();
  }));

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});

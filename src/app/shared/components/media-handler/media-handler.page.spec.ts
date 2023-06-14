import { async, ComponentFixture, TestBed } from '@angular/core/testing';
import { IonicModule } from '@ionic/angular';

import { MediaHandlerPage } from './media-handler.page';

describe('MediaHandlerPage', () => {
  let component: MediaHandlerPage;
  let fixture: ComponentFixture<MediaHandlerPage>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ MediaHandlerPage ],
      imports: [IonicModule.forRoot()]
    }).compileComponents();

    fixture = TestBed.createComponent(MediaHandlerPage);
    component = fixture.componentInstance;
    fixture.detectChanges();
  }));

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});

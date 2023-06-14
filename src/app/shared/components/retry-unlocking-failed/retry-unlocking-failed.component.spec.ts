import { async, ComponentFixture, TestBed } from '@angular/core/testing';
import { IonicModule } from '@ionic/angular';

import { RetryUnlockingFailedComponent } from './retry-unlocking-failed.component';

describe('RetryUnlockingFailedComponent', () => {
  let component: RetryUnlockingFailedComponent;
  let fixture: ComponentFixture<RetryUnlockingFailedComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ RetryUnlockingFailedComponent ],
      imports: [IonicModule.forRoot()]
    }).compileComponents();

    fixture = TestBed.createComponent(RetryUnlockingFailedComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  }));

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});

import { AbstractControl } from '@angular/forms';

export function ValidatePassword() {      // factory function
    return (control: AbstractControl): { [key: string]: boolean } | null => {
        const value = control.value;
        const regex = new RegExp('^(?!.*(\\w)\\1{1,}).+$');
        if (!regex.test(value)) {
            return { ValidatePassword: true };
        }
        return null;
    };
}

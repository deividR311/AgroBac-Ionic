export class Usuario {
    Id: number;
    TipoIdentificacion: number;
    NumeroIdentificacion: string;
    DigitoVerificacion: string;
    AutorizaTerminos: boolean;
    AutorizaDatos: boolean;
    Bloqueo: boolean;
    FechaBloqueo: Date;
    IntentosAcceso: number;
    UsuarioCreacion: string;
    FechaCreacion: Date;
    UsuarioModificacion: string;
    Contrasena: string;
    FechaModificacion: Date;
    Email: string;
    NumeroCelular: string;
    TiempoBloqueo: string;
}

export class VerifyToken {
    Usuario: string;
    Correo: string;
    Aplicacion: string;
    Transaccion: string;
    codigo: string;
    vigenciaToken: number;
    intentosFallidos: number;
    intentosGeneracion: number;
    Estado: boolean;
    LlaveSecreta: string;
    Error: string;
    FechaCreacion: Date;
    Bloqueo: number;
    ConteoGeneracion: number;
    TiempoBloqueo: number;
}

export class HttpResponse<T> {
    responseCode: number;
    responseMessage: string;
    resultData: Array<T>;
    authorization: string;
}

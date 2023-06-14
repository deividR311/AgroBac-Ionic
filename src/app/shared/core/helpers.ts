export function compareRoles ( rolesOne: Array<any> = [], rolesTwo: Array<any> = [], param: string = '' ) {
    return rolesOne.filter(
        roleOne => rolesTwo.find(
        roleTwo => Number(roleTwo[param]) === Number(roleOne[param])
    ));
}

export function manageLocalStorageSavedEventRubro () {
    localStorage.removeItem('savedEvent');
    localStorage.setItem('savedEvent', 'true');
}

export function setInterceptorError () {
    localStorage.setItem('interceptorError', 'true');
}

export function setInterceptorErrorFalse () {
    localStorage.setItem('interceptorError', 'false');
}

export function interceptorError () {
    const interceptorError = localStorage.getItem('interceptorError');
    return (interceptorError === 'true') ? true : false;
}

export function setRubroDataLoaded () {
    localStorage.setItem('rubroDataLoaded', 'true');
}

export function setRubroDataLoadedFalse () {
    localStorage.setItem('rubroDataLoaded', 'false');
}

export function RubroDataLoaded () {
    const rubroDataLoaded = localStorage.getItem('rubroDataLoaded');
    return (rubroDataLoaded === 'true') ? true : false;
}

export function getDocumentTypeRubro( tiposDocumento : Array<any> = [], creditJson : any ) {
    return tiposDocumento.find(
        (document : any) => document.valor === creditJson.tipoDocumento).codigo;
}
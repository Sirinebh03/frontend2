// environment.ts
export const environment = {
  production: false,
  apiUrl: 'http://localhost:8000' ,// URL de votre backend Laravel
  keycloak: {
    url: 'http://localhost:8080',  // Keycloak server URL
    realm: 'pfe',
    clientId: 'angular'
  }
};
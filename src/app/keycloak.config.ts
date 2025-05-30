// src/app/keycloak.config.ts
import { KeycloakConfig } from 'keycloak-js';

const keycloakConfig: KeycloakConfig = {
  url: 'http://localhost:8080',
  realm: 'pfe',
  clientId: 'angular',
};

export default keycloakConfig;

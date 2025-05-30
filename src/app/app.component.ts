import { Component } from '@angular/core';
import { KeycloakService } from 'keycloak-angular';
import { Router } from '@angular/router';

@Component({
  selector: 'app-root',
  template: '<router-outlet></router-outlet>'
})
export class AppComponent {
  horizontalMenu: boolean;
  darkMode = false;
  menuColorMode = 'light';
  menuColor = 'layout-menu-light';
  themeColor = 'blue';
  layoutColor = 'blue';
  ripple = true;
  inputStyle = 'outlined';

  constructor(
    private keycloakService: KeycloakService,
     private router: Router) {}
}
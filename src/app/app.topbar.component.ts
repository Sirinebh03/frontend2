import { Component } from '@angular/core';
import { AppMainComponent } from './app.main.component';
import { KeycloakService } from 'keycloak-angular';
import { KeycloakProfile } from 'keycloak-js';
export interface ExtendedKeycloakProfile extends KeycloakProfile {
  attributes?: {
    picture?: string[];
    [key: string]: any;
  };
}
@Component({
    selector: 'app-topbar',
    template: `
        <div class="layout-topbar">
            <div class="layout-topbar-wrapper">
                <!-- [1] Partie gauche inchangée -->
                <div class="layout-topbar-left">
                    <div class="layout-topbar-logo-wrapper">
                        <a href="#" class="layout-topbar-logo">
                            <img src="assets/layout/images/logo-mirage@2x.png" alt="mirage-layout" />
                            <span class="app-name">Mirage</span>
                        </a>
                    </div>

                    <a href="#" class="sidebar-menu-button" (click)="appMain.onMenuButtonClick($event)">
                        <i class="pi pi-bars"></i>
                    </a>

                    <a href="#" class="megamenu-mobile-button" (click)="appMain.onMegaMenuMobileButtonClick($event)">
                        <i class="pi pi-align-right megamenu-icon"></i>
                    </a>

                    <a href="#" class="topbar-menu-mobile-button" (click)="appMain.onTopbarMobileMenuButtonClick($event)">
                        <i class="pi pi-ellipsis-v"></i>
                    </a>

                    <div class="layout-megamenu-wrapper">
                        <a class="layout-megamenu-button" href="#" (click)="appMain.onMegaMenuButtonClick($event)">
                            <i class="pi pi-comment"></i>
                            Mega Menu
                        </a>
                        <ul class="layout-megamenu" [ngClass]="{'layout-megamenu-active fadeInDown': appMain.megaMenuActive}"
                            (click)="appMain.onMegaMenuClick($event)">
                            <li [ngClass]="{'active-topmenuitem': activeItem === 1}" (click)="mobileMegaMenuItemClick(1)">
                                <a href="#">JavaServer Faces <i class="pi pi-angle-down"></i></a>
                                <ul>
                                    <li class="active-row ">
                                        <i class="pi pi-circle-on"></i>
                                        <span>
                                            <h5>PrimeFaces</h5>
                                            <span>UI Components for JSF</span>
                                        </span>
                                    </li>
                                    <li>
                                        <i class="pi pi-circle-on"></i>
                                        <span>
                                            <h5>Premium Templates</h5>
                                            <span>UI Components for JSF</span>
                                        </span>
                                    </li>
                                    <li>
                                        <i class="pi pi-circle-on"></i>
                                        <span>
                                            <h5>Extensions</h5>
                                            <span>UI Components for JSF</span>
                                        </span>
                                    </li>
                                </ul>
                            </li>
                            <li [ngClass]="{'active-topmenuitem': activeItem === 2}" (click)="mobileMegaMenuItemClick(2)">
                                <a href="#">Angular <i class="pi pi-angle-down"></i></a>
                                <ul>
                                    <li>
                                        <i class="pi pi-circle-on"></i>
                                        <span>
                                            <h5>PrimeNG</h5>
                                            <span>UI Components for Angular</span>
                                        </span>
                                    </li>
                                    <li>
                                        <i class="pi pi-circle-on"></i>
                                        <span>
                                            <h5>Premium Templates</h5>
                                            <span>UI Components for Angular</span>
                                        </span>
                                    </li>
                                </ul>
                            </li>
                            <li [ngClass]="{'active-topmenuitem': activeItem === 3}" (click)="mobileMegaMenuItemClick(3)">
                                <a href="#">React <i class="pi pi-angle-down"></i></a>
                                <ul>
                                    <li>
                                        <i class="pi pi-circle-on"></i>
                                        <span>
                                            <h5>PrimeReact</h5>
                                            <span>UI Components for React</span>
                                        </span>
                                    </li>
                                    <li class="active-row">
                                        <i class="pi pi-circle-on"></i>
                                        <span>
                                            <h5>Premium Templates</h5>
                                            <span>UI Components for React</span>
                                        </span>
                                    </li>
                                </ul>
                            </li>
                        </ul>
                    </div>
                </div>

                <!-- [2] Partie droite avec intégration Keycloak -->
                <div class="layout-topbar-right fadeInDown">
                    <ul class="layout-topbar-actions">
                        <li #search class="search-item topbar-item" [ngClass]="{'active-topmenuitem': appMain.activeTopbarItem === search}">
                            <a href="#" class="topbar-search-mobile-button" (click)="appMain.onTopbarItemClick($event,search)">
                                <i class="topbar-icon pi pi-search"></i>
                            </a>
                            <ul class="search-item-submenu fadeInDown" (click)="appMain.topbarItemClick = true">
                                <li>
                                    <span class="md-inputfield search-input-wrapper">
                                        <input pInputText placeholder="Search..."/>
                                        <i class="pi pi-search"></i>
                                    </span>
                                </li>
                            </ul>
                        </li>

                        <li #calendar class="topbar-item" [ngClass]="{'active-topmenuitem': appMain.activeTopbarItem === calendar}">
                            <a href="#" (click)="appMain.onTopbarItemClick($event,calendar)">
                                <i class="topbar-icon pi pi-calendar"></i>
                            </a>
                            <ul class="fadeInDown" (click)="appMain.topbarItemClick = true">
                                <li class="layout-submenu-header">
                                    <h1>Calendar</h1>
                                </li>
                                <li class="calendar">
                                    <p-calendar [inline]="true"></p-calendar>
                                </li>
                            </ul>
                        </li>

                        <li #message class="topbar-item" [ngClass]="{'active-topmenuitem': appMain.activeTopbarItem === message}">
                            <a href="#" (click)="appMain.onTopbarItemClick($event,message)">
                                <i class="topbar-icon pi pi-inbox"></i>
                            </a>
                            <ul class="fadeInDown">
                                <li class="layout-submenu-header">
                                    <h1>Messages</h1>
                                    <span>Today, you have new 4 messages</span>
                                </li>
                                <li class="layout-submenu-item">
                                    <img src="assets/layout/images/topbar/avatar-cayla.png" alt="mirage-layout" width="35" />
                                    <div class="menu-text">
                                        <p>Override the digital divide</p>
                                        <span>Cayla Brister</span>
                                    </div>
                                    <i class="pi pi-angle-right"></i>
                                </li>
                                <!-- ... autres messages ... -->
                            </ul>
                        </li>

                        <!-- [3] Menu profil modifié pour Keycloak -->
                        <li #profile class="topbar-item profile-item" [ngClass]="{'active-topmenuitem': appMain.activeTopbarItem === profile}">
                            <a href="#" (click)="appMain.onTopbarItemClick($event,profile)">
                                <span class="profile-image-wrapper">
                                    <img [src]="userProfile?.attributes?.picture?.[0] || 'assets/layout/images/topbar/avatar-eklund.png'" 
                                         alt="profile" />
                                </span>
                                <span class="profile-info-wrapper">
                                    <h3>{{ getUserDisplayName() }}</h3>
                                    <span>{{ userProfile?.email || ' ' }}</span>
                                </span>
                            </a>
                            <ul class="profile-item-submenu fadeInDown">
                                <li class="profile-submenu-header">
                                    <div class="profile">
                                        <img [src]="userProfile?.attributes?.picture?.[0] || 'assets/layout/images/topbar/avatar-eklund.png'" 
                                             alt="profile" width="40" />
                                        <h1>{{ getUserDisplayName() }}</h1>
                                        <span>{{ userProfile?.email || ' ' }}</span>
                                    </div>
                                </li>
								<li>
									<i class="pi pi-list icon icon-1"></i>
									<div class="menu-text">
										<p>Tasks</p>
										<span>3 open issues</span>
									</div>
									<i class="pi pi-angle-right"></i>
								</li>
								<li>
									<i class="pi pi-shopping-cart icon icon-2"></i>
									<div class="menu-text">
										<p>Payments</p>
										<span>24 new</span>
									</div>
									<i class="pi pi-angle-right"></i>
								</li>
								<li>
									<i class="pi pi-users icon icon-3"></i>
									<div class="menu-text">
										<p>Clients</p>
										<span>+80%</span>
									</div>
									<i class="pi pi-angle-right"></i>
								</li>
                                <!-- [4] Bouton de déconnexion ajouté -->
                                <li class="layout-submenu-footer">
                                    <button class="signout-button" (click)="logout()">
                                        <i class="pi pi-sign-out"></i> Déconnexion
                                    </button>
									<button class="buy-mirage-button">Buy Mirage</button>
                                </li>
                            </ul>
                        </li>

                        <li>
                            <a href="#" class="layout-rightpanel-button" (click)="appMain.onRightPanelButtonClick($event)">
                                <i class="pi pi-arrow-left"></i>
                            </a>
                        </li>
                    </ul>
                </div>
            </div>
        </div>
    `
})
export class AppTopBarComponent {

    activeItem: number;
    userProfile: ExtendedKeycloakProfile | null = null;

    constructor(
        public appMain: AppMainComponent,
        private keycloakService: KeycloakService
    ) {
        this.loadUserProfile();
    }

    async loadUserProfile() {
        if (await this.keycloakService.isLoggedIn()) {
            try {
                this.userProfile = await this.keycloakService.loadUserProfile() as ExtendedKeycloakProfile;
            } catch (error) {
                console.error('Erreur lors du chargement du profil', error);
            }
        }
    }

    getProfileImage(): string {
        return this.userProfile?.attributes?.picture?.[0] 
               || 'assets/layout/images/topbar/avatar-eklund.png';
    }

    getUserDisplayName(): string {
        if (this.userProfile) {
            return [this.userProfile.firstName, this.userProfile.lastName]
                .filter(Boolean).join(' ') || this.userProfile.username || 'Utilisateur';
        }
        return 'Utilisateur';
    }

    getUserEmail(): string {
        return this.userProfile?.email || '';
    }

    mobileMegaMenuItemClick(index: number) {
        this.appMain.megaMenuMobileClick = true;
        this.activeItem = this.activeItem === index ? null : index;
    }

    async logout() {
        await this.keycloakService.logout(window.location.origin);
    }
}
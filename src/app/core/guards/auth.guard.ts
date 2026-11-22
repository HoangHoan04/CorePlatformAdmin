import { Injectable } from '@angular/core';
import { CanActivate, Router, RouterStateSnapshot, UrlTree, ActivatedRouteSnapshot } from '@angular/router';
import { AuthService } from '../services/auth.service';

@Injectable({ providedIn: 'root' })
export class AuthGuard implements CanActivate {
  constructor(
    private readonly auth: AuthService,
    private readonly router: Router,
  ) {}

  canActivate(_route: ActivatedRouteSnapshot, state: RouterStateSnapshot): boolean | UrlTree {
    if (this.auth.isLoggedIn) return true;
    this.auth.clearSession();
    return this.router.createUrlTree(['/auth/login'], {
      queryParams: state.url && state.url !== '/' ? { returnUrl: state.url } : {},
    });
  }
}

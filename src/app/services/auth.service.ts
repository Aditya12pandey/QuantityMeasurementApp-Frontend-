import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { BehaviorSubject, Observable, tap } from 'rxjs';
import { Router } from '@angular/router';
import { environment } from '../../environments/environment';
import { AuthResponse, LoginRequest, RegisterRequest } from '../models/auth.model';

@Injectable({ providedIn: 'root' })
export class AuthService {
  private readonly TOKEN_KEY = 'qm_token';
  private readonly USER_KEY = 'qm_user';

  private loggedIn$ = new BehaviorSubject<boolean>(this.hasToken());
  isLoggedIn$ = this.loggedIn$.asObservable();

  constructor(private http: HttpClient, private router: Router) {}

  register(request: RegisterRequest): Observable<any> {
    return this.http.post(`${environment.apiUrl}/auth/register`, request);
  }

  login(request: LoginRequest): Observable<AuthResponse> {
    return this.http.post<AuthResponse>(`${environment.apiUrl}/auth/login`, request).pipe(
      tap(res => {
        sessionStorage.setItem(this.TOKEN_KEY, res.token);
        sessionStorage.setItem(this.USER_KEY, res.username);
        this.loggedIn$.next(true);
      })
    );
  }

  logout(): void {
    sessionStorage.clear(); // Clear EVERYTHING
    this.loggedIn$.next(false);
    this.router.navigate(['/login']).then(() => {
      window.location.reload(); // Hard reset for the next user
    });
  }

  getToken(): string | null {
    return sessionStorage.getItem(this.TOKEN_KEY);
  }

  getUsername(): string | null {
    return sessionStorage.getItem(this.USER_KEY);
  }

  private hasToken(): boolean {
    return !!sessionStorage.getItem(this.TOKEN_KEY);
  }
}

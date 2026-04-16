import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { AuthService } from '../../services/auth.service';

@Component({
  selector: 'app-register',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink],
  templateUrl: './register.component.html',
  styleUrls: ['./register.component.scss']
})
export class RegisterComponent {
  username = '';
  password = '';
  confirmPassword = '';
  errorMsg = '';
  successMsg = '';
  loading = false;

  constructor(private authService: AuthService, private router: Router) {}

  onSubmit(): void {
    if (!this.username.trim() || !this.password.trim()) {
      this.errorMsg = 'All fields are required.';
      return;
    }
    if (this.password !== this.confirmPassword) {
      this.errorMsg = 'Passwords do not match.';
      return;
    }
    this.loading = true;
    this.errorMsg = '';
    this.authService.register({ username: this.username, password: this.password }).subscribe({
      next: (res: any) => {
        this.successMsg = res.message || 'Registered successfully!';
        this.loading = false;
        setTimeout(() => this.router.navigate(['/login']), 1500);
      },
      error: (err) => {
        this.errorMsg = err.error?.error || 'Registration failed.';
        this.loading = false;
      }
    });
  }
}

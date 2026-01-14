import { Component } from '@angular/core';

@Component({
  selector: 'app-server-error',
  templateUrl: './server-error.component.html',
  styleUrl: './server-error.component.scss',
  standalone: false
})
export class ServerErrorComponent {
  
  refresh(): void {
    window.location.reload();
  }
}

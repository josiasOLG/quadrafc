import { CommonModule } from '@angular/common';
import { Component, EventEmitter, Input, OnInit, Output } from '@angular/core';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { ButtonModule } from 'primeng/button';
import { DialogModule } from 'primeng/dialog';
import { FileUploadModule } from 'primeng/fileupload';
import { InputTextModule } from 'primeng/inputtext';
import { finalize } from 'rxjs';

import { AuthService } from '../../../../modules/auth/services/auth.service';
import { UsersService } from '../../../../modules/auth/services/users.service';
import { User } from '../../../schemas/user.schema';
import { GlobalDialogService } from '../../../services/global-dialog.service';

@Component({
  selector: 'app-profile-edit-dialog',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    DialogModule,
    ButtonModule,
    InputTextModule,
    FileUploadModule,
  ],
  templateUrl: './profile-edit-dialog.component.html',
  styleUrls: ['./profile-edit-dialog.component.scss'],
})
export class ProfileEditDialogComponent implements OnInit {
  @Input() visible = false;
  @Output() visibleChange = new EventEmitter<boolean>();
  @Output() dialogClose = new EventEmitter<void>();

  profileForm: FormGroup;
  isLoading = false;
  selectedFile: File | null = null;
  previewUrl: string | null = null;

  constructor(
    private fb: FormBuilder,
    private authService: AuthService,
    private usersService: UsersService,
    private globalDialogService: GlobalDialogService
  ) {
    this.profileForm = this.createForm();
  }

  ngOnInit(): void {
    this.loadUserData();
  }

  private createForm(): FormGroup {
    return this.fb.group({
      nome: ['', [Validators.required, Validators.minLength(2), Validators.maxLength(50)]],
      avatarUrl: [''],
    });
  }

  private loadUserData(): void {
    const currentUser = this.authService.currentUser();
    if (currentUser) {
      this.profileForm.patchValue({
        nome: currentUser.nome,
        avatarUrl: currentUser.avatarUrl,
      });
      this.previewUrl = currentUser.avatarUrl || null;
    }
  }

  onFileSelect(event: any): void {
    const file = event.files[0];
    if (file) {
      // Validação de tamanho (3MB máximo)
      const maxSize = 3 * 1024 * 1024; // 3MB
      if (file.size > maxSize) {
        this.globalDialogService.showError({
          title: 'Arquivo muito grande',
          message: 'A imagem deve ter no máximo 3MB.',
          details: 'Tente redimensionar a imagem ou escolher outro arquivo.',
        });
        return;
      }

      // Validação de tipo
      const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp'];
      if (!allowedTypes.includes(file.type)) {
        this.globalDialogService.showError({
          title: 'Formato inválido',
          message: 'Apenas imagens JPG, PNG, GIF e WEBP são permitidas.',
        });
        return;
      }

      this.selectedFile = file;

      const reader = new FileReader();
      reader.onload = (e: any) => {
        this.previewUrl = e.target.result;
        this.profileForm.patchValue({ avatarUrl: e.target.result });
      };
      reader.readAsDataURL(file);
    }
  }

  onFileRemove(): void {
    this.selectedFile = null;
    this.previewUrl = null;
    this.profileForm.patchValue({ avatarUrl: '' });
  }

  onSubmit(): void {
    if (this.profileForm.valid && !this.isLoading) {
      this.isLoading = true;

      const formData = this.profileForm.value;

      // Atualizar imediatamente no cliente para feedback visual instantâneo
      const currentUser = this.authService.currentUser();
      if (currentUser) {
        const tempUpdatedUser = {
          ...currentUser,
          nome: formData.nome || currentUser.nome,
          avatarUrl: formData.avatarUrl || currentUser.avatarUrl,
        };
        this.authService.setCurrentUser(tempUpdatedUser);
      }

      this.usersService
        .updateProfile(formData)
        .pipe(finalize(() => (this.isLoading = false)))
        .subscribe({
          next: (updatedUser: User) => {
            // Confirmar com dados do backend
            this.authService.setCurrentUser(updatedUser);
            this.globalDialogService.showSuccess({
              title: 'Sucesso',
              message: 'Perfil atualizado com sucesso!',
              duration: 3000,
            });
            this.closeDialog();
          },
          error: (error: any) => {
            // Reverter para dados originais em caso de erro
            if (currentUser) {
              this.authService.setCurrentUser(currentUser);
            }
            this.globalDialogService.showError({
              title: 'Erro',
              message: error.error?.message || 'Erro ao atualizar perfil',
              details: 'Tente novamente ou entre em contato com o suporte.',
            });
          },
        });
    }
  }

  closeDialog(): void {
    this.visible = false;
    this.visibleChange.emit(false);
    this.dialogClose.emit();
    this.resetForm();
  }

  onDialogHide(): void {
    this.closeDialog();
  }

  private resetForm(): void {
    this.profileForm.reset();
    this.selectedFile = null;
    this.previewUrl = null;
    this.loadUserData();
  }

  get isFormValid(): boolean {
    return this.profileForm.valid;
  }

  get nomeControl() {
    return this.profileForm.get('nome');
  }
}

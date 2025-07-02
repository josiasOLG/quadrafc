import { CommonModule } from '@angular/common';
import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { MessageService } from 'primeng/api';
import { ButtonModule } from 'primeng/button';
import { CalendarModule } from 'primeng/calendar';
import { CardModule } from 'primeng/card';
import { DropdownModule } from 'primeng/dropdown';
import { InputMaskModule } from 'primeng/inputmask';
import { InputTextModule } from 'primeng/inputtext';
import { ToastModule } from 'primeng/toast';
import { ToggleButtonModule } from 'primeng/togglebutton';
import { ToolbarModule } from 'primeng/toolbar';

import { User, UserCreateSchema, UserUpdateSchema } from '../../../shared/models/user.model';
import { UserService } from '../../../shared/services/user.service';

@Component({
  selector: 'app-user-form',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    CardModule,
    InputTextModule,
    DropdownModule,
    CalendarModule,
    InputMaskModule,
    ButtonModule,
    ToggleButtonModule,
    ToastModule,
    ToolbarModule,
  ],
  providers: [MessageService],
  templateUrl: './user-form.component.html',
  styleUrls: ['./user-form.component.scss'],
})
export class UserFormComponent implements OnInit {
  userForm: FormGroup;
  isEditMode = false;
  userId: number | null = null;
  loading = false;
  saving = false;

  genderOptions = [
    { label: 'Masculino', value: 'M' },
    { label: 'Feminino', value: 'F' },
    { label: 'Outro', value: 'O' },
  ];

  constructor(
    private fb: FormBuilder,
    private userService: UserService,
    private router: Router,
    private route: ActivatedRoute,
    private messageService: MessageService
  ) {
    this.userForm = this.createForm();
  }

  ngOnInit() {
    this.route.params.subscribe((params) => {
      if (params['id']) {
        this.isEditMode = true;
        this.userId = +params['id'];
        this.loadUser(this.userId);
      }
    });
  }

  createForm(): FormGroup {
    return this.fb.group({
      nome: ['', [Validators.required, Validators.minLength(2)]],
      email: ['', [Validators.required, Validators.email]],
      telefone: ['', [Validators.required, Validators.minLength(10)]],
      dataNascimento: [''],
      genero: [''],
      cep: [''],
      cidade: [''],
      bairro: [''],
      endereco: [''],
      numero: [''],
      complemento: [''],
      ativo: [true],
    });
  }

  loadUser(id: number) {
    this.loading = true;

    this.userService.getUserById(id).subscribe({
      next: (user) => {
        this.populateForm(user);
        this.loading = false;
      },
      error: (error) => {
        console.error('Erro ao carregar usuário:', error);
        this.messageService.add({
          severity: 'error',
          summary: 'Erro',
          detail: 'Erro ao carregar dados do usuário',
        });
        this.loading = false;
        this.router.navigate(['/users']);
      },
    });
  }

  populateForm(user: User) {
    this.userForm.patchValue({
      nome: user.nome,
      email: user.email,
      telefone: user.telefone,
      dataNascimento: user.dataNascimento ? new Date(user.dataNascimento) : null,
      genero: user.genero,
      cep: user.cep,
      cidade: user.cidade,
      bairro: user.bairro,
      endereco: user.endereco,
      numero: user.numero,
      complemento: user.complemento,
      ativo: user.ativo,
    });
  }

  onSubmit() {
    if (this.userForm.valid) {
      this.saving = true;
      const formData = this.userForm.value;

      try {
        if (this.isEditMode) {
          // Validação com Zod para atualização
          const validatedData = UserUpdateSchema.parse({
            ...formData,
            id: this.userId,
          });

          this.userService.updateUser(this.userId!, validatedData).subscribe({
            next: () => {
              this.messageService.add({
                severity: 'success',
                summary: 'Sucesso',
                detail: 'Usuário atualizado com sucesso',
              });
              this.router.navigate(['/users']);
            },
            error: (error) => {
              console.error('Erro ao atualizar usuário:', error);
              this.messageService.add({
                severity: 'error',
                summary: 'Erro',
                detail: 'Erro ao atualizar usuário',
              });
              this.saving = false;
            },
          });
        } else {
          // Validação com Zod para criação
          const validatedData = UserCreateSchema.parse(formData);

          this.userService.createUser(validatedData).subscribe({
            next: () => {
              this.messageService.add({
                severity: 'success',
                summary: 'Sucesso',
                detail: 'Usuário criado com sucesso',
              });
              this.router.navigate(['/users']);
            },
            error: (error) => {
              console.error('Erro ao criar usuário:', error);
              this.messageService.add({
                severity: 'error',
                summary: 'Erro',
                detail: 'Erro ao criar usuário',
              });
              this.saving = false;
            },
          });
        }
      } catch (zodError: any) {
        console.error('Erro de validação:', zodError);
        this.messageService.add({
          severity: 'error',
          summary: 'Erro de Validação',
          detail: 'Dados inválidos. Verifique os campos.',
        });
        this.saving = false;
      }
    } else {
      this.markFormGroupTouched();
      this.messageService.add({
        severity: 'warn',
        summary: 'Atenção',
        detail: 'Preencha todos os campos obrigatórios',
      });
    }
  }

  onCancel() {
    this.router.navigate(['/users']);
  }

  markFormGroupTouched() {
    Object.keys(this.userForm.controls).forEach((key) => {
      const control = this.userForm.get(key);
      control?.markAsTouched();
    });
  }

  isFieldInvalid(fieldName: string): boolean {
    const field = this.userForm.get(fieldName);
    return !!(field && field.invalid && (field.dirty || field.touched));
  }

  getFieldError(fieldName: string): string {
    const field = this.userForm.get(fieldName);
    if (field?.errors) {
      if (field.errors['required']) return `${fieldName} é obrigatório`;
      if (field.errors['email']) return 'Email inválido';
      if (field.errors['minlength'])
        return `${fieldName} deve ter pelo menos ${field.errors['minlength'].requiredLength} caracteres`;
    }
    return '';
  }
}

import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { User } from '../../../shared/schemas/user.schema';
import { HttpService } from '../../../shared/services/http.service';

export interface UpdateProfileDto {
  nome?: string;
  avatarUrl?: string;
}

@Injectable({
  providedIn: 'root',
})
export class UsersService {
  constructor(private httpService: HttpService) {}

  updateProfile(updateData: UpdateProfileDto): Observable<User> {
    return this.httpService.patch<User>('users/profile', updateData);
  }
}

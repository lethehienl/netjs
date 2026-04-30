import { Controller, Post, Body, UnauthorizedException } from '@nestjs/common';
import { AuthService } from './auth.service';
import { LoginDto } from './dto/login.dto'; // Import DTO

@Controller('auth')
export class AuthController {
  constructor(private authService: AuthService) {}

  @Post('login')
  async login(@Body() loginDto: LoginDto) { // Sử dụng LoginDto ở đây
    const user = await this.authService.validateUser(
      loginDto.email, 
      loginDto.password
    );
    if (!user) {
      throw new UnauthorizedException('The credential wasnot correct!');
    }
    
    // Logic trả về token...
    return this.authService.login(user);
  }
}
import { BadRequestException, ConflictException, Injectable, NotFoundException } from '@nestjs/common';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { PrismaService } from 'src/prisma/prisma.service';
import * as bcrypt from 'bcrypt';

@Injectable()
export class UsersService {
  constructor ( private prisma: PrismaService) {}

  async create(createUserDto: CreateUserDto) {
    const existingUser = await this.prisma.user.findUnique({
      where: { email: createUserDto.email},
    });

    if(existingUser) {
      throw new ConflictException("The email was not existed");
    }

    const  salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(createUserDto.password, salt);
    const { password, ...userData } = createUserDto;

    return this.prisma.user.create({
      data: {
        ...createUserDto,
        password: hashedPassword,
      },
      select: { // remove pass
        id: true,
        email: true,
        name: true,
        role: true,
        createdAt: true,
      }
    });

  }

  async findAll() {
    return this.prisma.user.findMany({
      select: { id: true, email: true, name: true, role: true, createdAt: true },
      orderBy: { createdAt: 'desc' }
    });
  }

  async findOne(id: number) {
    const user = await this.prisma.user.findUnique({
      where: { id },
      select: { id: true, email: true, name: true, role: true, createdAt: true }
    });
    if (!user) throw new NotFoundException(`User ID ${id} is not exist`);
    return user;
  }

  async update(id: number, updateUserDto: UpdateUserDto) {
    await this.findOne(id);
    if (updateUserDto.password) {
      const salt = await bcrypt.genSalt(10);
      updateUserDto.password = await bcrypt.hash(updateUserDto.password, salt);
    }

    try {
      return await this.prisma.user.update({
        where: { id },
        data: updateUserDto,
        select: {
          id: true,
          email: true,
          name: true,
          role: true,
          updatedAt: true,
        },
      });
    } catch (error) {
      // Bắt lỗi nếu cập nhật email trùng với người khác
      if (error.code === 'P2002') {
        throw new BadRequestException('Email này đã được sử dụng bởi người khác');
      }
      throw error;
    }
  }

  async remove(id: number) {
    await this.findOne(id);
    return this.prisma.user.delete({where: {id}});

  }

  async findByEmail(email: string) {
    return this.prisma.user.findUnique({ where: { email } });
  }
}

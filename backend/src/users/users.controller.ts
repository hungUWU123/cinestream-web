import { Controller, Get, Patch, Body, UseGuards, Post, UseInterceptors, UploadedFile, BadRequestException } from '@nestjs/common';
import { UsersService, UpdateProfileDto } from './users.service';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { FileInterceptor } from '@nestjs/platform-express';
import { diskStorage } from 'multer';
import { extname } from 'path';

@Controller('users')
@UseGuards(JwtAuthGuard)
export class UsersController {
  constructor(private usersService: UsersService) {}

  @Get('profile')
  getProfile(@CurrentUser('id') userId: string) {
    return this.usersService.findById(userId);
  }

  @Patch('profile')
  updateProfile(@CurrentUser('id') userId: string, @Body() dto: UpdateProfileDto) {
    return this.usersService.updateProfile(userId, dto);
  }

  @Post('profile/avatar')
  @UseInterceptors(
    FileInterceptor('avatar', {
      storage: diskStorage({
        destination: './uploads/avatars',
        filename: (req, file, cb) => {
          const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9);
          const ext = extname(file.originalname);
          // req.user might be attached by JwtAuthGuard, default to a fallback if not present
          const userIdentifier = req.user ? req.user['id'] : 'unknown';
          cb(null, `avatar-${userIdentifier}-${uniqueSuffix}${ext}`);
        },
      }),
      fileFilter: (req, file, cb) => {
        if (!file.mimetype.match(/\/(jpg|jpeg|png|webp)$/)) {
          return cb(new BadRequestException('Chỉ chấp nhận các file ảnh (jpg, jpeg, png, webp)!'), false);
        }
        cb(null, true);
      },
      limits: {
        fileSize: 2 * 1024 * 1024, // 2MB
      },
    }),
  )
  async uploadAvatar(
    @CurrentUser('id') userId: string,
    @UploadedFile() file: any,
  ) {
    if (!file) {
      throw new BadRequestException('Vui lòng chọn file ảnh để tải lên');
    }
    const avatarPath = `/uploads/avatars/${file.filename}`;
    return this.usersService.updateProfile(userId, { avatar: avatarPath });
  }
}

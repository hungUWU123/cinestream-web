import { Module } from '@nestjs/common';
import { AdminController } from './admin.controller';
import { AdminService } from './admin.service';
import { PrismaModule } from '../prisma/prisma.module';
import { OphimModule } from '../ophim/ophim.module';

@Module({
  imports: [PrismaModule, OphimModule],
  controllers: [AdminController],
  providers: [AdminService],
})
export class AdminModule {}

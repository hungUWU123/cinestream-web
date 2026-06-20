import { Module } from '@nestjs/common';
import { HttpModule } from '@nestjs/axios';
import { OphimService } from './ophim.service';
import { OphimController } from './ophim.controller';
import { PrismaModule } from '../prisma/prisma.module';

@Module({
  imports: [HttpModule, PrismaModule],
  controllers: [OphimController],
  providers: [OphimService],
  exports: [OphimService],
})
export class OphimModule {}

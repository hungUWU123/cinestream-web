import { Module } from '@nestjs/common';
import { MoviesController } from './movies.controller';
import { MoviesService } from './movies.service';
import { PrismaModule } from '../prisma/prisma.module';
import { OphimModule } from '../ophim/ophim.module';

@Module({
  imports: [PrismaModule, OphimModule],
  controllers: [MoviesController],
  providers: [MoviesService],
  exports: [MoviesService],
})
export class MoviesModule {}

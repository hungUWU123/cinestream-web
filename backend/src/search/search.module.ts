import { Module } from '@nestjs/common';
import { SearchController } from './search.controller';
import { SearchService } from './search.service';
import { PrismaModule } from '../prisma/prisma.module';
import { OphimModule } from '../ophim/ophim.module';

@Module({
  imports: [PrismaModule, OphimModule],
  controllers: [SearchController],
  providers: [SearchService],
})
export class SearchModule {}

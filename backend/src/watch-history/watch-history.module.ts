import { Module } from '@nestjs/common';
import { WatchHistoryController } from './watch-history.controller';
import { WatchHistoryService } from './watch-history.service';
import { PrismaModule } from '../prisma/prisma.module';

@Module({
  imports: [PrismaModule],
  controllers: [WatchHistoryController],
  providers: [WatchHistoryService],
})
export class WatchHistoryModule {}

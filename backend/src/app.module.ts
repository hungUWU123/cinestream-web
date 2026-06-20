import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { ThrottlerModule } from '@nestjs/throttler';
import { HttpModule } from '@nestjs/axios';
import { PrismaModule } from './prisma/prisma.module';
import { AuthModule } from './auth/auth.module';
import { UsersModule } from './users/users.module';
import { MoviesModule } from './movies/movies.module';
import { EpisodesModule } from './episodes/episodes.module';
import { CommentsModule } from './comments/comments.module';
import { FavoritesModule } from './favorites/favorites.module';
import { WatchHistoryModule } from './watch-history/watch-history.module';
import { SearchModule } from './search/search.module';
import { OphimModule } from './ophim/ophim.module';
import { AdminModule } from './admin/admin.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: '.env',
    }),
    ThrottlerModule.forRootAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (config: ConfigService) => [
        {
          ttl: config.get('THROTTLE_TTL', 60) * 1000,
          limit: config.get('THROTTLE_LIMIT', 100),
        },
      ],
    }),
    HttpModule.register({ timeout: 10000 }),
    PrismaModule,
    AuthModule,
    UsersModule,
    MoviesModule,
    EpisodesModule,
    CommentsModule,
    FavoritesModule,
    WatchHistoryModule,
    SearchModule,
    OphimModule,
    AdminModule,
  ],
})
export class AppModule {}

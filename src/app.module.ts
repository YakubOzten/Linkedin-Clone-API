import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { FeedService } from './feed/services/feed.service';
import { FeedController } from './feed/controllers/feed.controller';
import { FeedModule } from './feed/feed.module';
import { FeedPostEntity } from './feed/models/post.entity';
import { AuthModule } from './auth/auth.module';
import { APP_FILTER } from '@nestjs/core';
import { AllExpectionsFilter } from './core/all-exceptions.filter';
import { ChatModule } from './chat/chat.module';

@Module({
  imports: [
    ConfigModule.forRoot({isGlobal:true}),
    TypeOrmModule.forRoot({
      type:'postgres',
      host: process.env.POSTGRES_HOST,
      port: parseInt(<string>process.env.POSTGRES_PORT),
      username: process.env.POSTGRES_USER,
      password:process.env.POSTGRES_PASSWORD,
      database:process.env.POSTGRES_DATABASE,
      autoLoadEntities:true,
      synchronize:true,
    }),
    FeedModule,
    AuthModule,
    ChatModule,
    
  ],
  controllers: [AppController],
  providers: [AppService,
  { provide:APP_FILTER,
     useClass:AllExpectionsFilter,
  }
  ],
})
export class AppModule {}

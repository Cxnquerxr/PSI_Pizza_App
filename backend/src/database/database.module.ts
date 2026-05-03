import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ConfigService } from '@nestjs/config';

@Module({
  imports: [
    TypeOrmModule.forRootAsync({
      useFactory: (configService: ConfigService) => ({
        type: 'postgres',
        host: configService.get<string>('DB_HOST', 'localhost'),
        port: configService.get<number>('DB_PORT', 5432),
        username: configService.get<string>('DB_USER', 'postgres'),
        password: configService.get<string>('DB_PASSWORD', 'FuwaFuwaTime'),
        database: configService.get<string>('DB_NAME', 'pizzeria'),
        entities: [__dirname + '/../**/*.entity{.ts,.js}'],
        synchronize: false, // Ensure migrations are used, auto-sync is explicitly disabled
      }),
      inject: [ConfigService],
    }),
  ],
})
export class DatabaseModule { }


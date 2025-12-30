import {
  IsString,
  IsNotEmpty,
  IsOptional,
  IsNumber,
  IsPositive,
  MaxLength,
  IsUrl,
} from 'class-validator';

export class CreateFavoriteDto {
  @IsString()
  @IsNotEmpty()
  @MaxLength(200)
  songId: string;

  @IsString()
  @IsNotEmpty()
  @MaxLength(500)
  name: string;

  @IsString()
  @IsNotEmpty()
  @MaxLength(500)
  artist: string;

  @IsString()
  @IsNotEmpty()
  @MaxLength(500)
  album: string;

  @IsOptional()
  @IsString()
  @IsUrl({}, { message: 'artworkUrl must be a valid URL' })
  @MaxLength(2000)
  artworkUrl?: string;

  @IsOptional()
  @IsString()
  @IsUrl({}, { message: 'previewUrl must be a valid URL' })
  @MaxLength(2000)
  previewUrl?: string;

  @IsOptional()
  @IsNumber()
  @IsPositive()
  durationMs?: number;
}

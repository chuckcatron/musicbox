import { IsString, IsNotEmpty, MaxLength } from 'class-validator';

export class SongIdParam {
  @IsString()
  @IsNotEmpty()
  @MaxLength(200)
  songId: string;
}

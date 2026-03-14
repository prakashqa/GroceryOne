import {
  IsNotEmpty,
  IsString,
  IsEmail,
  IsOptional,
  MinLength,
  Matches,
  Length,
} from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class SignupDto {
  @ApiProperty({ example: 'Fresh Mart Groceries', description: 'Business name' })
  @IsNotEmpty()
  @IsString()
  @Length(2, 255)
  businessName: string;

  @ApiProperty({ example: 'Rajesh', description: 'Owner first name' })
  @IsNotEmpty()
  @IsString()
  @Length(1, 100)
  ownerFirstName: string;

  @ApiPropertyOptional({ example: 'Kumar', description: 'Owner last name' })
  @IsOptional()
  @IsString()
  @Length(1, 100)
  ownerLastName?: string;

  @ApiProperty({ example: 'admin@freshmart.com', description: 'Email address' })
  @IsNotEmpty()
  @IsEmail()
  email: string;

  @ApiProperty({ example: '+919876543210', description: 'Phone number' })
  @IsNotEmpty()
  @IsString()
  @Matches(/^\+?[0-9]{10,15}$/, {
    message: 'Phone number must be 10-15 digits, optionally starting with +',
  })
  phone: string;

  @ApiProperty({ example: 'Admin@123', description: 'Password (min 8 chars, 1 uppercase, 1 number)' })
  @IsNotEmpty()
  @IsString()
  @MinLength(8)
  @Matches(/(?=.*[A-Z])(?=.*[0-9])/, {
    message: 'Password must contain at least 1 uppercase letter and 1 number',
  })
  password: string;
}

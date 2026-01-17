import { Controller, Post, Get, Body, Req, Res, Param, HttpException, HttpStatus } from '@nestjs/common';
import { Request, Response } from 'express';
import { ObjectStorageService } from '../storage/objectStorage';
import { DatabaseService } from '../database/database.service';

@Controller('companion/portrait')
export class PortraitUploadController {
  private objectStorage: ObjectStorageService;

  constructor(private readonly db: DatabaseService) {
    this.objectStorage = new ObjectStorageService();
  }

  @Post('request-url')
  async requestUploadUrl(
    @Req() req: Request,
    @Body() body: { name: string; size: number; contentType: string },
  ) {
    const session = (req as any).session;
    if (!session?.discordId) {
      throw new HttpException('Unauthorized', HttpStatus.UNAUTHORIZED);
    }

    if (!body.name) {
      throw new HttpException('Missing required field: name', HttpStatus.BAD_REQUEST);
    }

    if (!body.contentType?.startsWith('image/')) {
      throw new HttpException('Only image files are allowed', HttpStatus.BAD_REQUEST);
    }

    const maxSize = 5 * 1024 * 1024;
    if (body.size > maxSize) {
      throw new HttpException('File too large. Maximum 5MB allowed.', HttpStatus.BAD_REQUEST);
    }

    try {
      const uploadURL = await this.objectStorage.getObjectEntityUploadURL();
      const objectPath = this.objectStorage.normalizeObjectEntityPath(uploadURL);

      return {
        uploadURL,
        objectPath,
        metadata: { name: body.name, size: body.size, contentType: body.contentType },
      };
    } catch (error) {
      console.error('Error generating upload URL:', error);
      throw new HttpException('Failed to generate upload URL', HttpStatus.INTERNAL_SERVER_ERROR);
    }
  }

  @Post('save')
  async savePortrait(
    @Req() req: Request,
    @Body() body: { characterId: string; objectPath: string },
  ) {
    const session = (req as any).session;
    if (!session?.discordId) {
      throw new HttpException('Unauthorized', HttpStatus.UNAUTHORIZED);
    }

    if (!body.characterId || !body.objectPath) {
      throw new HttpException('Missing characterId or objectPath', HttpStatus.BAD_REQUEST);
    }

    try {
      const characterResult = await this.db.query(
        `SELECT c.character_id, c.discord_user_id, e.owner_discord_id, 
                (SELECT role FROM engine_members WHERE engine_id = c.engine_id AND discord_user_id = $1) as member_role
         FROM characters c
         JOIN engines e ON c.engine_id = e.engine_id
         WHERE c.character_id = $2`,
        [session.discordId, body.characterId],
      );

      if (characterResult.rows.length === 0) {
        throw new HttpException('Character not found', HttpStatus.NOT_FOUND);
      }

      const char = characterResult.rows[0];
      const isOwner = char.discord_user_id === session.discordId;
      const isEngineOwner = char.owner_discord_id === session.discordId;
      const isST = char.member_role === 'STORYTELLER';

      if (!isOwner && !isEngineOwner && !isST) {
        throw new HttpException('You can only update your own character portrait', HttpStatus.FORBIDDEN);
      }

      const normalizedPath = this.objectStorage.normalizeObjectEntityPath(body.objectPath);
      
      await this.objectStorage.trySetObjectEntityAclPolicy(normalizedPath, {
        owner: session.discordId,
        visibility: 'public',
      });

      await this.db.query(
        `UPDATE characters SET portrait_url = $1, updated_at = NOW() WHERE character_id = $2`,
        [normalizedPath, body.characterId],
      );

      return { success: true, portraitUrl: normalizedPath };
    } catch (error) {
      if (error instanceof HttpException) throw error;
      console.error('Error saving portrait:', error);
      throw new HttpException('Failed to save portrait', HttpStatus.INTERNAL_SERVER_ERROR);
    }
  }

  @Get(':objectPath(*)')
  async servePortrait(
    @Param('objectPath') objectPath: string,
    @Res() res: Response,
  ) {
    try {
      const fullPath = `/objects/${objectPath}`;
      const objectFile = await this.objectStorage.getObjectEntityFile(fullPath);
      await this.objectStorage.downloadObject(objectFile, res);
    } catch (error) {
      res.status(404).json({ error: 'Portrait not found' });
    }
  }
}

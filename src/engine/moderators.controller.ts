import {
  Controller,
  Post,
  Delete,
  Get,
  Body,
  Req,
  Headers,
} from '@nestjs/common';
import type { Request } from 'express';

import { DatabaseService } from '../database/database.service';
import { CompanionAuthService } from '../companion/auth.service';
import { ModeratorsService } from './moderators.service';
import {
  EngineAccessRoute,
  enforceEngineAccess,
} from './engine.guard';
import { EngineRole } from '../common/enums/engine-role.enum';

@Controller('companion/engine/moderators')
export class ModeratorsController {
  constructor(
    private readonly db: DatabaseService,
    private readonly auth: CompanionAuthService,
    private readonly mods: ModeratorsService,
  ) {}

  private token(req: Request, auth?: string) {
    return req.cookies?.bse
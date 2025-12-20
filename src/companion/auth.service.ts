import { Injectable } from '@nestjs/common';

@Injectable()
export class CompanionAuthService {
  async validateToken(client: any, token: string) {
    const res = await client.query(
      `SELECT * FROM sessions WHERE token=$1 AND expires_at > now()`,
      [token],
    );
    return res.rowCount ? res.rows[0] : null;
  }

  async revokeSession(client: any, token: string) {
    await client.query(`DELETE FROM sessions WHERE token=$1`, [token]);
    return { ok: true };
  }
}
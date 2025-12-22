"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.withTransaction = withTransaction;
async function withTransaction(db, fn) {
    const client = await db.getClient();
    try {
        await client.query('BEGIN');
        const result = await fn(client);
        await client.query('COMMIT');
        return result;
    }
    catch (err) {
        await client.query('ROLLBACK');
        throw err;
    }
    finally {
        client.release();
    }
}
//# sourceMappingURL=transactions.js.map
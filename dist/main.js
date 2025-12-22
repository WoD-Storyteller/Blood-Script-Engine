"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
require("reflect-metadata");
const core_1 = require("@nestjs/core");
const app_module_1 = require("./app.module");
const secrets_1 = require("./config/secrets");
const common_1 = require("@nestjs/common");
async function bootstrap() {
    const logger = new common_1.Logger('Bootstrap');
    try {
        await (0, secrets_1.loadSecrets)();
        logger.log('Secrets loaded successfully');
    }
    catch (err) {
        logger.error('Failed to load secrets', err);
        process.exit(1);
    }
    const app = await core_1.NestFactory.create(app_module_1.AppModule, {
        bufferLogs: true,
    });
    app.useGlobalPipes(new common_1.ValidationPipe({
        whitelist: true,
        forbidNonWhitelisted: true,
        transform: true,
    }));
    const companionUrl = process.env.COMPANION_APP_URL;
    if (companionUrl) {
        app.enableCors({
            origin: companionUrl,
            credentials: true,
        });
        logger.log(`CORS enabled for ${companionUrl}`);
    }
    const port = Number(process.env.PORT) || 3000;
    await app.listen(port);
    logger.log(`Blood Script Engine running on port ${port}`);
}
bootstrap();
//# sourceMappingURL=main.js.map
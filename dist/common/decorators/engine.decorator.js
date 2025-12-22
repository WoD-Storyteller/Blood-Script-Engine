"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.CurrentEngine = void 0;
const common_1 = require("@nestjs/common");
exports.CurrentEngine = (0, common_1.createParamDecorator)((_data, ctx) => {
    const request = ctx.switchToHttp().getRequest();
    return request.engine;
});
//# sourceMappingURL=engine.decorator.js.map
"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
var NarrationService_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.NarrationService = void 0;
const common_1 = require("@nestjs/common");
const gemini_client_1 = require("./gemini.client");
const prompt_builder_1 = require("./prompt.builder");
const tenet_filter_1 = require("./tenet.filter");
const output_validator_1 = require("./output.validator");
let NarrationService = NarrationService_1 = class NarrationService {
    constructor(gemini, prompts, tenets, validator) {
        this.gemini = gemini;
        this.prompts = prompts;
        this.tenets = tenets;
        this.validator = validator;
        this.logger = new common_1.Logger(NarrationService_1.name);
    }
    async narrate(input) {
        try {
            const prompt = this.prompts.build(input);
            const raw = await this.gemini.generate(prompt);
            const validated = this.validator.validate(raw);
            return this.tenets.enforce(validated);
        }
        catch (err) {
            this.logger.warn(`Narration fallback used: ${err.message}`);
            return input.mechanicalResult;
        }
    }
};
exports.NarrationService = NarrationService;
exports.NarrationService = NarrationService = NarrationService_1 = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [gemini_client_1.GeminiClient,
        prompt_builder_1.PromptBuilder,
        tenet_filter_1.TenetFilter,
        output_validator_1.OutputValidator])
], NarrationService);
//# sourceMappingURL=narration.service.js.map
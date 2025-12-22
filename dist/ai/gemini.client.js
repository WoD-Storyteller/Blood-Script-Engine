"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.GeminiClient = void 0;
const common_1 = require("@nestjs/common");
let GeminiClient = class GeminiClient {
    constructor() {
        this.endpoint = 'https://generativelanguage.googleapis.com/v1beta/models/gemini-pro:generateContent';
    }
    async generate(prompt) {
        const apiKey = process.env.GEMINI_API_KEY;
        if (!apiKey) {
            throw new Error('GEMINI_API_KEY not set');
        }
        const res = await fetch(`${this.endpoint}?key=${apiKey}`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                contents: [
                    {
                        role: 'user',
                        parts: [{ text: prompt }],
                    },
                ],
            }),
        });
        if (!res.ok) {
            const text = await res.text();
            throw new Error(`Gemini API error: ${text}`);
        }
        const data = await res.json();
        return (data.candidates?.[0]?.content?.parts?.[0]?.text ??
            '');
    }
};
exports.GeminiClient = GeminiClient;
exports.GeminiClient = GeminiClient = __decorate([
    (0, common_1.Injectable)()
], GeminiClient);
//# sourceMappingURL=gemini.client.js.map
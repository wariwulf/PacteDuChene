"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
exports.EconomyTransaction = void 0;
const mongoose_1 = __importStar(require("mongoose"));
const economyTransactionSchema = new mongoose_1.Schema({
    userId: {
        type: String,
        required: true,
        index: true,
    },
    currencyId: {
        type: String,
        required: true,
        index: true,
    },
    amount: {
        type: Number,
        required: true,
    },
    type: {
        type: String,
        required: true,
        enum: [
            "quest_reward",
            "achievement_reward",
            "purchase",
            "admin_add",
            "admin_remove",
            "exchange",
            "daily_reward",
            "voice_reward",
            "other",
        ],
    },
    source: {
        type: String,
        trim: true,
    },
    sourceId: {
        type: String,
        trim: true,
    },
    description: {
        type: String,
        trim: true,
    },
}, {
    timestamps: true,
});
/*
 * ============================================================
 * PROTECTION CONTRE LES DOUBLES RÉCOMPENSES
 * ============================================================
 *
 * Une même récompense économique ne peut être créée
 * deux fois pour un même utilisateur.
 */
economyTransactionSchema.index({
    userId: 1,
    type: 1,
    source: 1,
    sourceId: 1,
    currencyId: 1,
}, {
    unique: true,
    partialFilterExpression: {
        type: {
            $in: [
                "quest_reward",
                "achievement_reward",
                "daily_reward",
                "voice_reward",
            ],
        },
        sourceId: {
            $exists: true,
        },
    },
});
exports.EconomyTransaction = mongoose_1.default.model("EconomyTransaction", economyTransactionSchema);

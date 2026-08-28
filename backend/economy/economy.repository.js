"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.economyRepository = exports.EconomyRepository = void 0;
const user_model_1 = require("../users/user.model");
const economy_transaction_model_1 = require("./economy-transaction.model");
const economy_constants_1 = require("./economy.constants");
class EconomyRepository {
    async findUserById(id) {
        return user_model_1.User.findById(id);
    }
    async updateUserBalance(userId, currencyId, amount) {
        return user_model_1.User.findByIdAndUpdate(userId, {
            $inc: {
                [`economy.balances.${currencyId}`]: amount,
            },
        }, {
            new: true,
            runValidators: true,
        });
    }
    async findRewardTransaction(userId, type, source, sourceId, currencyId) {
        return economy_transaction_model_1.EconomyTransaction.findOne({
            userId,
            type,
            source,
            sourceId,
            currencyId,
        });
    }
    async findByUserId(userId, limit = 50) {
        return economy_transaction_model_1.EconomyTransaction.find({
            userId,
            currencyId: { $in: economy_constants_1.CURRENCY_IDS },
        })
            .sort({ createdAt: -1 })
            .limit(limit);
    }
}
exports.EconomyRepository = EconomyRepository;
exports.economyRepository = new EconomyRepository();

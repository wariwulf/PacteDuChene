import { User } from "../users/user.model";
import { economyAdminService } from "./economy-admin.service";
import { isCurrencyId, type CurrencyId } from "./economy.constants";
import { economyTransactionRepository } from "./economy-transaction.repository";
const names:Record<CurrencyId,string>={bronze:"Bronze",argent:"Argent",solidus:"Solidus"};
function rate(from:CurrencyId,to:CurrencyId,r:any){const value:Record<CurrencyId,number>={bronze:1,argent:r.bronzePerArgent,solidus:r.bronzePerSolidus};return value[from]/value[to];}
export async function exchangeCurrency(userId:string,from:string,to:string,amount:number){
 if(!isCurrencyId(from)||!isCurrencyId(to)||from===to) throw new Error("Monnaies de conversion invalides.");
 if(!Number.isInteger(amount)||amount<=0) throw new Error("Le montant doit être un entier supérieur à 0.");
 const r=await economyAdminService.getExchangeRates(); const factor=rate(from,to,r); const target=amount*factor;
 if(!Number.isInteger(target)) throw new Error(`Le montant doit être divisible selon le taux de change (${names[from]} → ${names[to]}).`);
 const updated=await User.findOneAndUpdate({_id:userId,status:{$ne:"DELETED"},[`economy.balances.${from}`]:{$gte:amount}},{$inc:{[`economy.balances.${from}`]:-amount,[`economy.balances.${to}`]:target}},{returnDocument: "after"});
 if(!updated) throw new Error("Solde insuffisant ou utilisateur introuvable.");
 const sourceId=`${Date.now()}-${userId}-${from}-${to}-${Math.random().toString(36).slice(2)}`;
 try { await economyTransactionRepository.create({userId,currencyId:from,amount:-amount,type:"exchange",source:"exchange",sourceId,description:`Change : ${amount} ${names[from]} → ${target} ${names[to]}`}); await economyTransactionRepository.create({userId,currencyId:to,amount:target,type:"exchange",source:"exchange",sourceId:`${sourceId}-credit`,description:`Change : ${amount} ${names[from]} → ${target} ${names[to]}`}); } catch(e){ await User.updateOne({_id:userId},{$inc:{[`economy.balances.${from}`]:amount,[`economy.balances.${to}`]:-target}}); throw e; }
 return {balances:updated.economy?.balances,rates:r,from,to,amount,target};
}

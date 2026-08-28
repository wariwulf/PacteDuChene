export type ClanRole = "REX" | "DUX_FOEDERIS" | "FRERE_JURE" | "SOEUR_JUREE" | "INITIE";
export interface ClanMemberInput { memberId:string; role:ClanRole; parentId?:string|null; portrait?:string|null; displayOrder?:number; active?:boolean; }
export interface ClanTreeNode extends ClanMemberInput { id:string; memberId:string; name:string; title?:string; role:ClanRole; displayOrder:number; active:boolean; }

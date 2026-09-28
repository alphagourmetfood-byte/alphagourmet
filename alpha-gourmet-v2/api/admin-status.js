import { createClient } from '@supabase/supabase-js';
const allowed=['received','preparing','ready','out_for_delivery','delivered','cancelled'];
export default async function handler(req,res){
  if(req.method!=='POST') return res.status(405).json({error:'Método não permitido'});
  try{
    const token=(req.headers.authorization||'').replace(/^Bearer\s+/i,'');
    const sb=createClient(process.env.SUPABASE_URL,process.env.SUPABASE_SERVICE_ROLE_KEY);
    const {data:{user},error:ue}=await sb.auth.getUser(token); if(ue||!user) return res.status(401).json({error:'Não autenticado'});
    const {data:profile}=await sb.from('profiles').select('role').eq('id',user.id).single();
    if(profile?.role!=='admin') return res.status(403).json({error:'Acesso restrito ao administrador'});
    const {orderId,status,note}=req.body||{}; if(!orderId||!allowed.includes(status)) return res.status(400).json({error:'Dados inválidos'});
    const {error}=await sb.from('orders').update({status,updated_at:new Date().toISOString()}).eq('id',orderId); if(error) throw error;
    await sb.from('order_status_history').insert({order_id:orderId,status,note:note||null});
    return res.status(200).json({ok:true});
  }catch(e){return res.status(500).json({error:e.message||'Erro interno'});}
}

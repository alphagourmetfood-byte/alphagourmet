import { createClient } from '@supabase/supabase-js';

export default async function handler(req,res){
  if(req.method!=='POST') return res.status(405).json({error:'Método não permitido'});
  try{
    const auth=req.headers.authorization||'';
    const token=auth.replace(/^Bearer\s+/i,'');
    if(!token) return res.status(401).json({error:'Faça login para continuar'});
    const supabase=createClient(process.env.SUPABASE_URL,process.env.SUPABASE_SERVICE_ROLE_KEY);
    const {data:{user},error:userError}=await supabase.auth.getUser(token);
    if(userError||!user) return res.status(401).json({error:'Sessão inválida'});
    const {orderId}=req.body||{};
    const {data:order,error}=await supabase.from('orders').select('*').eq('id',orderId).eq('user_id',user.id).single();
    if(error||!order) return res.status(404).json({error:'Pedido não encontrado'});
    if(!process.env.MERCADOPAGO_ACCESS_TOKEN) return res.status(503).json({error:'Mercado Pago ainda não configurado no Vercel.'});
    const pref={items:[{title:`Alpha Gourmet ${order.plan} - ${order.period}`,quantity:1,currency_id:'BRL',unit_price:Number(order.total)}],external_reference:order.id,payer:{email:user.email},back_urls:{success:`${process.env.SITE_URL}/?pagamento=sucesso`,failure:`${process.env.SITE_URL}/?pagamento=erro`,pending:`${process.env.SITE_URL}/?pagamento=pendente`},auto_return:'approved'};
    const mp=await fetch('https://api.mercadopago.com/checkout/preferences',{method:'POST',headers:{'Content-Type':'application/json','Authorization':`Bearer ${process.env.MERCADOPAGO_ACCESS_TOKEN}`},body:JSON.stringify(pref)});
    const data=await mp.json();
    if(!mp.ok) return res.status(502).json({error:data.message||'Erro ao criar pagamento'});
    await supabase.from('orders').update({payment_method:'mercadopago'}).eq('id',order.id);
    return res.status(200).json({url:data.init_point});
  }catch(e){return res.status(500).json({error:e.message||'Erro interno'});}
}

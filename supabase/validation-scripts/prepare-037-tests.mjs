import fs from 'node:fs';
const root=process.cwd();let s=fs.readFileSync(root+'/certification/run-real-tests.mjs','utf8');
s=s.replace("root+'/certification/RESULTS.json'","root+'/certification/RESULTS_037.json'").replace('{status},200)','{new_status:status},200)');
const start=s.indexOf('  else{const order=await json('),end=s.indexOf('\n }\n const one=',start);
if(start<0||end<0)throw Error('Harness shape changed');
s=s.slice(0,start)+`  else{
   const order=await json(\`SELECT row_to_json(o) FROM (SELECT id,total,discount_total,status FROM orders WHERE id=\${q(result.data)})o\`);
   const discounts=await json(\`SELECT coalesce(json_agg(d),'[]') FROM (SELECT amount_applied,discount_type FROM order_discounts WHERE order_id=\${q(result.data)})d\`);
   const payResult=await service.rpc('create_payment',{p_order_id:result.data,p_customer_phone:'70000999'});
   const state=await json(\`SELECT json_build_object('paymentCount',(SELECT count(*) FROM payments WHERE order_id=\${q(result.data)}),'cashCount',(SELECT count(*) FROM cash_movements WHERE order_id=\${q(result.data)}),'consumed',(SELECT count(*) FROM inventory_reservations WHERE order_id=\${q(result.data)} AND status='consumed'),'stock',(SELECT current_stock FROM inventory_items WHERE id=\${q(promoProduct.item)}))\`);
   const ok=Number(order.total)===spec.total&&discounts.length===1&&(spec.total===0 ? order.status==='confirmado'&&!!payResult.error&&state.paymentCount===0&&state.cashCount===0&&state.consumed===1&&Number(state.stock)===Number(stockBefore)-1 : !payResult.error&&state.paymentCount===1);
   rec('promotions',spec.name,ok,{order,discounts,payment:payResult.data,error:payResult.error,stockBefore,state});
   if(spec.total===0){await expectApi('free order tracking','/api/orders/track','anon',{order_id:result.data,customer_phone:'70000999'},200);for(const new_status of ['en_preparacion','listo','finalizado'])await expectApi('free order '+new_status,'/api/admin/orders/'+result.data+'/status','employee',{new_status},200);}
  }`+s.slice(end);
fs.writeFileSync(root+'/certification/run-037-tests.mjs',s);

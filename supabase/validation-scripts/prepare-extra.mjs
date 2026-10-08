import fs from 'node:fs';
const root=process.cwd();let base=fs.readFileSync(root+'/certification/run-real-tests.mjs','utf8');base=base.slice(0,base.indexOf('\ntry{\n if(Number'));base=base.replace("root+'/certification/RESULTS.json'","root+'/certification/EXTRA_RESULTS.json'");base+=`
Object.assign(users,JSON.parse(fs.readFileSync(root+'/private/auth-sessions.json','utf8').replace(/^\\uFEFF/,'')));
const exp=await product('EXPIRATION OVERLAP',5);
const eo=await anon.rpc('create_order',orderArgs(exp.product,'TEST-NOVA-EXPIRATION-OVERLAP'));
const ep=await service.rpc('create_payment',{p_order_id:eo.data,p_customer_phone:'70000999'});
await sql(\`UPDATE orders SET reserved_until=clock_timestamp()+interval '0.4 seconds' WHERE id=\${q(eo.data)};UPDATE inventory_reservations SET expires_at=(SELECT reserved_until FROM orders WHERE id=\${q(eo.data)}) WHERE order_id=\${q(eo.data)}\`);
const first=session(authSql(\`SELECT id FROM orders WHERE id=\${q(eo.data)} FOR UPDATE; SELECT pg_sleep(1.2); SELECT public.confirm_payment(\${q(ep.data[0].id)})\`),'NOVA-A-expired-overlap');
await new Promise(r=>setTimeout(r,650));
const second=session('BEGIN;SELECT public.release_expired_reservations(NULL);COMMIT;','NOVA-B-expired-overlap');
await new Promise(r=>setTimeout(r,200));
const waiting=await json("SELECT coalesce(json_agg(json_build_object('pid',pid,'application',application_name,'wait',wait_event,'blockers',pg_blocking_pids(pid))),'[]') FROM pg_stat_activity WHERE application_name LIKE 'NOVA-%'");
const sessions=await Promise.all([first,second]);
const final=await json(\`SELECT json_build_object('order',(SELECT status FROM orders WHERE id=\${q(eo.data)}),'payment',(SELECT status FROM payments WHERE id=\${q(ep.data[0].id)}),'reservations',(SELECT json_agg(status) FROM inventory_reservations WHERE order_id=\${q(eo.data)}),'stock',(SELECT current_stock FROM inventory_items WHERE id=\${q(exp.item)}))\`);
rec('concurrency','expiry-confirm-after-deadline',!sessions.some(x=>!x.ok&&x.error.includes('deadlock'))&&!(final.order==='cancelado'&&final.payment==='confirmado'),{sessions,waiting,final});
console.log('Finished extra concurrency');
`;
fs.writeFileSync(root+'/certification/extra-tests.mjs',base);

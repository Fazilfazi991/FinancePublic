begin;
create extension if not exists pgtap with schema extensions;
select plan(43);

insert into auth.users(id,email,raw_user_meta_data) values
 ('10000000-0000-0000-0000-000000000001','user-a@example.invalid','{}'),
 ('20000000-0000-0000-0000-000000000002','user-b@example.invalid','{}'),
 ('30000000-0000-0000-0000-000000000003','user-c@example.invalid','{}');
insert into public.accounts(id,user_id,name,type,currency) values
 ('10000000-0000-0000-0001-000000000001','10000000-0000-0000-0000-000000000001','A account','current','INR'),
 ('10000000-0000-0000-0001-000000000002','10000000-0000-0000-0000-000000000001','A savings','savings','INR'),
 ('20000000-0000-0000-0001-000000000002','20000000-0000-0000-0000-000000000002','B account','current','INR');
insert into public.debts(id,user_id,name,original_amount,balance,apr,minimum_payment) values
 ('10000000-0000-0000-0002-000000000001','10000000-0000-0000-0000-000000000001','A debt',1000,1000,10,100),
 ('20000000-0000-0000-0002-000000000002','20000000-0000-0000-0000-000000000002','B debt',2000,2000,20,200);
insert into public.goals(id,user_id,name,target) values('20000000-0000-0000-0003-000000000002','20000000-0000-0000-0000-000000000002','B goal',100);
insert into public.transactions(id,user_id,type,amount,account_id,category,transaction_date,currency) values
 ('10000000-0000-0000-0004-000000000001','10000000-0000-0000-0000-000000000001','expense',20,'10000000-0000-0000-0001-000000000001','Test',current_date,'INR'),
 ('10000000-0000-0000-0004-000000000002','10000000-0000-0000-0000-000000000001','transfer',30,'10000000-0000-0000-0001-000000000001','Transfer',current_date,'INR'),
 ('20000000-0000-0000-0004-000000000002','20000000-0000-0000-0000-000000000002','expense',10,'20000000-0000-0000-0001-000000000002','Test',current_date,'INR');
update public.transactions set to_account_id='10000000-0000-0000-0001-000000000002' where id='10000000-0000-0000-0004-000000000002';

select lives_ok($$insert into public.transactions(user_id,type,amount,account_id,category,description,transaction_date,currency,source,idempotency_key) values('10000000-0000-0000-0000-000000000001','expense',10,'10000000-0000-0000-0001-000000000001','Test','Quick Entry idempotency',current_date,'INR','quick_entry','40000000-0000-0000-0000-000000000004')$$,'first Quick Entry idempotency key succeeds');
select throws_ok($$insert into public.transactions(user_id,type,amount,account_id,category,description,transaction_date,currency,source,idempotency_key) values('10000000-0000-0000-0000-000000000001','expense',10,'10000000-0000-0000-0001-000000000001','Test','Duplicate Quick Entry',current_date,'INR','quick_entry','40000000-0000-0000-0000-000000000004')$$,'23505','duplicate key value violates unique constraint "transactions_user_idempotency"','duplicate Quick Entry idempotency key is rejected');
delete from public.transactions where idempotency_key='40000000-0000-0000-0000-000000000004';

set local role anon;
select throws_ok('select count(*) from public.accounts','42501','permission denied for table accounts','anonymous cannot list accounts');
select throws_ok('select count(*) from public.debts','42501','permission denied for table debts','anonymous cannot list debts');
select throws_ok('select count(*) from public.transactions','42501','permission denied for table transactions','anonymous cannot list transactions');
reset role;

set local role authenticated;
set local request.jwt.claim.sub='10000000-0000-0000-0000-000000000001';
select is((select count(*) from public.accounts),2::bigint,'User A sees only own accounts');
select is((select count(*) from public.debts),1::bigint,'User A sees only own debts');
select is((select count(*) from public.goals),0::bigint,'User A cannot read User B goals');
select is((select count(*) from public.transactions),2::bigint,'User A reads only their own transactions');
select is((select count(*) from public.user_preferences),1::bigint,'User A sees only own preferences');
select results_eq($$with changed as (update public.accounts set name='stolen' where id='20000000-0000-0000-0001-000000000002' returning 1) select count(*) from changed$$,array[0::bigint],'User A cannot update User B account');
select results_eq($$with changed as (delete from public.debts where id='20000000-0000-0000-0002-000000000002' returning 1) select count(*) from changed$$,array[0::bigint],'User A cannot delete User B debt');
select throws_ok($$select public.record_debt_payment('20000000-0000-0000-0002-000000000002','10000000-0000-0000-0001-000000000001',10,current_date,null,gen_random_uuid())$$,'P0002','debt_not_found','User A cannot pay User B debt');
select throws_ok($$select public.record_debt_payment('10000000-0000-0000-0002-000000000001','20000000-0000-0000-0001-000000000002',10,current_date,null,gen_random_uuid())$$,'P0002','account_not_found','User A cannot use User B account');
select throws_ok($$select public.update_owned_transaction('20000000-0000-0000-0004-000000000002','expense',10,'10000000-0000-0000-0001-000000000001',null,'Test','',current_date,'INR',null,'')$$,'P0002','transaction_not_found','User A cannot edit User B transaction');
select throws_ok($$select public.delete_owned_transaction('20000000-0000-0000-0004-000000000002')$$,'P0002','transaction_not_found','User A cannot delete User B transaction');
select throws_ok($$select public.update_owned_transaction('10000000-0000-0000-0004-000000000001','expense',20,'20000000-0000-0000-0001-000000000002',null,'Test','',current_date,'INR',null,'')$$,'P0002','account_not_found','User A cannot assign User B account');
select throws_ok($$select public.update_owned_transaction('10000000-0000-0000-0004-000000000002','transfer',30,'20000000-0000-0000-0001-000000000002','10000000-0000-0000-0001-000000000002','Transfer','',current_date,'INR',null,'')$$,'P0002','account_not_found','User A cannot transfer from User B account');
select throws_ok($$select public.update_owned_transaction('10000000-0000-0000-0004-000000000002','transfer',30,'10000000-0000-0000-0001-000000000001','20000000-0000-0000-0001-000000000002','Transfer','',current_date,'INR',null,'')$$,'P0002','destination_not_found','User A cannot transfer to User B account');
select throws_ok($$select public.update_owned_transaction('90000000-0000-0000-0004-000000000009','expense',10,'10000000-0000-0000-0001-000000000001',null,'Test','',current_date,'INR',null,'')$$,'P0002','transaction_not_found','unknown transaction ID is rejected');
select throws_ok($$select public.update_owned_transaction('10000000-0000-0000-0004-000000000001','expense',20,'90000000-0000-0000-0001-000000000009',null,'Test','',current_date,'INR',null,'')$$,'P0002','account_not_found','unknown account ID is rejected');
select throws_ok($$select public.update_owned_transaction('10000000-0000-0000-0004-000000000002','transfer',30,'10000000-0000-0000-0001-000000000001','10000000-0000-0000-0001-000000000001','Transfer','',current_date,'INR',null,'')$$,'P0001','invalid_transfer','same-account transfer is rejected');
select throws_ok($$select public.update_owned_transaction('10000000-0000-0000-0004-000000000001','expense',0,'10000000-0000-0000-0001-000000000001',null,'Test','',current_date,'INR',null,'')$$,'P0001','invalid_amount','zero transaction amount is rejected');
select throws_ok($$select public.update_owned_transaction('10000000-0000-0000-0004-000000000001','expense','NaN'::numeric,'10000000-0000-0000-0001-000000000001',null,'Test','',current_date,'INR',null,'')$$,'P0001','invalid_amount','NaN transaction amount is rejected');
select lives_ok($$select public.update_owned_transaction('10000000-0000-0000-0004-000000000002','transfer',50,'10000000-0000-0000-0001-000000000001','10000000-0000-0000-0001-000000000002','Transfer','Edited transfer',current_date,'INR',null,'')$$,'owned transfer edit succeeds');
select ok((select type='transfer' and amount=50 and account_id='10000000-0000-0000-0001-000000000001' and to_account_id='10000000-0000-0000-0001-000000000002' from public.transactions where id='10000000-0000-0000-0004-000000000002'),'transfer edit changes the single ledger row atomically');
reset role;

create function private.test_fail_transfer_update() returns trigger language plpgsql as $$begin if new.id='10000000-0000-0000-0004-000000000002' then raise exception 'forced_transfer_update_failure'; end if; return new; end$$;
create trigger test_fail_transfer_update before update on public.transactions for each row execute function private.test_fail_transfer_update();
set local role authenticated; set local request.jwt.claim.sub='10000000-0000-0000-0000-000000000001';
select throws_ok($$select public.update_owned_transaction('10000000-0000-0000-0004-000000000002','transfer',75,'10000000-0000-0000-0001-000000000001','10000000-0000-0000-0001-000000000002','Transfer','Should roll back',current_date,'INR',null,'')$$,'P0001','forced_transfer_update_failure','forced transfer edit failure rolls back');
select is((select amount from public.transactions where id='10000000-0000-0000-0004-000000000002'),50::numeric,'failed transfer edit leaves the original ledger row unchanged');
reset role; drop trigger test_fail_transfer_update on public.transactions;
create function private.test_fail_transfer_delete() returns trigger language plpgsql as $$begin if old.id='10000000-0000-0000-0004-000000000002' then raise exception 'forced_transfer_delete_failure'; end if; return old; end$$;
create trigger test_fail_transfer_delete before delete on public.transactions for each row execute function private.test_fail_transfer_delete();
set local role authenticated; set local request.jwt.claim.sub='10000000-0000-0000-0000-000000000001';
select throws_ok($$select public.delete_owned_transaction('10000000-0000-0000-0004-000000000002')$$,'P0001','forced_transfer_delete_failure','forced transfer delete failure rolls back');
select ok(exists(select 1 from public.transactions where id='10000000-0000-0000-0004-000000000002' and amount=50),'failed transfer delete leaves the ledger row intact');
reset role; drop trigger test_fail_transfer_delete on public.transactions;
set local role authenticated; set local request.jwt.claim.sub='10000000-0000-0000-0000-000000000001';
select lives_ok($$select public.delete_owned_transaction('10000000-0000-0000-0004-000000000002')$$,'owned transfer delete succeeds');
select ok(not exists(select 1 from public.transactions where id='10000000-0000-0000-0004-000000000002'),'transfer delete removes the single ledger row atomically');
reset role;

create function private.test_fail_debt_update() returns trigger language plpgsql as $$begin raise exception 'forced_atomicity_failure'; end$$;
create trigger test_fail_debt_update before update on public.debts for each row execute function private.test_fail_debt_update();
set local role authenticated; set local request.jwt.claim.sub='10000000-0000-0000-0000-000000000001';
select throws_ok($$select public.record_debt_payment('10000000-0000-0000-0002-000000000001','10000000-0000-0000-0001-000000000001',100,current_date,null,gen_random_uuid())$$,'P0001','forced_atomicity_failure','forced mid-operation failure rolls back');
select ok((select balance=1000 from public.debts where id='10000000-0000-0000-0002-000000000001') and (select count(*)=1 from public.transactions where user_id='10000000-0000-0000-0000-000000000001') and not exists(select 1 from public.debt_payments where user_id='10000000-0000-0000-0000-000000000001'),'rollback leaves debt, transactions, and payment history unchanged');
select throws_ok('select public.load_demo_workspace(false)','P0001','workspace_not_empty','demo data is rejected for a non-empty workspace');
reset role; set local role authenticated; set local request.jwt.claim.sub='30000000-0000-0000-0000-000000000003';
select lives_ok('select public.load_demo_workspace(false)','empty user can load authenticated demo data');
select is((select sum(balance) from public.debts),1068000::numeric,'demo Freedom Number is ₹10,68,000');
select is((select sum(original_amount-balance) from public.debts),452000::numeric,'demo debt paid is ₹4,52,000');
select is((select sum(expected_monthly) from public.incomes)-(select sum(budgeted) from public.budgets),82000::numeric,'demo payoff power is ₹82,000');
select lives_ok('select public.load_demo_workspace(true)','demo reset succeeds for current user');
select is((select sum(balance) from public.debts),1068000::numeric,'reset recreates approved demo values');
select lives_ok('select public.remove_demo_workspace()','demo removal succeeds');
select ok(not exists(select 1 from public.accounts where is_demo) and not exists(select 1 from public.debts where is_demo) and not exists(select 1 from public.incomes where is_demo) and not exists(select 1 from public.budgets where is_demo),'demo removal deletes only current user demo rows');
select * from finish();
rollback;

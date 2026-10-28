import {test,before,after} from 'node:test';
import assert from 'node:assert/strict';
import {spawn} from 'node:child_process';
import {randomBytes} from 'node:crypto';
import {MongoMemoryReplSet} from 'mongodb-memory-server';
import {MongoClient} from 'mongodb';
import {totals} from '../api/index.mjs';
let repl,server,client,db;const base='http://127.0.0.1:4189/api/';
async function call(route,method='GET',body,cookie){const r=await fetch(base+route,{method,headers:{'Content-Type':'application/json',...(cookie?{cookie}:{})},body:body===undefined?undefined:JSON.stringify(body)});return{status:r.status,data:await r.json(),cookie:r.headers.get('set-cookie')?.split(';')[0]}}
before(async()=>{repl=await MongoMemoryReplSet.create({replSet:{count:1,storageEngine:'wiredTiger'}});const uri=repl.getUri();client=new MongoClient(uri);await client.connect();db=client.db('khushi_test');server=spawn(process.execPath,['server.mjs'],{env:{...process.env,PORT:'4189',MONGODB_URI:uri,MONGODB_DB:'khushi_test',JWT_SECRET:randomBytes(48).toString('hex'),ADMIN_EMAIL:'admin@example.test',ADMIN_PASSWORD:'Test-admin-12345'},stdio:'ignore'});for(let i=0;i<100;i++){try{const h=await call('health');if(h.status===200)return}catch{}await new Promise(r=>setTimeout(r,100))}throw Error('Server startup failed')},{timeout:240000});
after(async()=>{server?.kill();await client?.close();await repl?.stop()});
test('Malformed static URLs return 400 and leave the server running',async()=>{
  for(const pathname of ['/%E0%A4%A','/%00']){
    const response=await fetch(base.replace('/api/','')+pathname);
    assert.equal(response.status,400);
    assert.equal(await response.text(),'Invalid request URL');
  }
  const home=await fetch(base.replace('/api/','/'));
  assert.equal(home.status,200);
  assert.match(home.headers.get('content-type'),/text\/html/);
  assert.equal((await call('health')).status,200);
});
test('Delivery threshold counts tins rather than currency or boxes',()=>{const config={deliveryCharge:10,freeDeliveryTins:50,minimumBoxes:1};assert.equal(totals([{price:100,quantity:49,unit:'tin'}],config).delivery,10);assert.equal(totals([{price:100,quantity:50,unit:'tin'}],config).delivery,0);assert.equal(totals([{price:10000,quantity:50,unit:'box'}],config).delivery,10);assert.throws(()=>totals([],config));});
test('Customer and admin APIs protect accounts, totals, inventory and order ownership',async()=>{
let r=await call('catalog');assert.equal(r.status,200);assert.equal(r.data.products.length,9);assert.equal(r.data.categories.length,7);
assert.equal((await call('orders')).status,401);
assert.equal((await call('register','POST',{name:'Bad',email:'broken',password:'1234567890'})).status,400);
assert.equal((await call('register','POST',{name:'Reserved',email:'admin@example.test',password:'1234567890'})).status,400);
r=await call('register','POST',{name:'Test Customer',email:'customer@example.test',password:'Test-customer-12345'});assert.equal(r.status,200);assert.equal(r.data.role,'customer');assert.ok(r.cookie);const customer=r.cookie;assert.ok(!r.data.password);
assert.equal((await call('register','POST',{name:'Test Customer',email:'customer@example.test',password:'Test-customer-12345'})).status,409);
assert.equal((await call('admin/product','POST',{},customer)).status,403);
assert.equal((await call('login','POST',{email:'customer@example.test',password:'Wrong-password'})).status,401);
const stored=await db.collection('users').findOne({email:'customer@example.test'});assert.ok(stored.password.startsWith('$2'));assert.notEqual(stored.password,'Test-customer-12345');
r=await call('cart','PUT',{items:[{id:'mustard',quantity:2}]},customer);assert.equal(r.status,200);r=await call('cart','GET',undefined,customer);assert.equal(r.data[0].quantity,2);
const checkout={name:'Test Customer',phone:'9999999999',address:'Test address in Merta City',pincode:'341510',state:'Rajasthan',payment:'demo-success',items:[{id:'mustard',quantity:2,price:1}],total:1};
r=await call('orders','POST',{...checkout,payment:'demo-failure'},customer);assert.equal(r.status,400);assert.equal((await db.collection('products').findOne({id:'mustard'})).stock,32);
r=await call('orders','POST',{...checkout,items:[{id:'mustard',quantity:999}]},customer);assert.equal(r.status,400);assert.equal(await db.collection('orders').countDocuments(),0);
r=await call('orders','POST',{...checkout,items:[{id:'mustard',quantity:1},{id:'mustard',quantity:1}]},customer);assert.equal(r.status,400);assert.equal((await db.collection('products').findOne({id:'mustard'})).stock,32);
r=await call('orders','POST',{...checkout,items:[{id:'mustard',quantity:1},{id:'sunflower',quantity:999}]},customer);assert.equal(r.status,400);assert.equal((await db.collection('products').findOne({id:'mustard'})).stock,32);
r=await call('orders','POST',checkout,customer);assert.equal(r.status,200);assert.equal(r.data.total,3710);assert.equal(r.data.delivery,10);assert.equal(r.data.paymentStatus,'Demo paid — no money charged');const orderId=r.data.id;
assert.equal((await db.collection('products').findOne({id:'mustard'})).stock,30);assert.deepEqual((await call('cart','GET',undefined,customer)).data,[]);
r=await call('register','POST',{name:'Other Customer',email:'other@example.test',password:'Test-customer-12345'});const other=r.cookie;assert.deepEqual((await call('orders','GET',undefined,other)).data,[]);
r=await call('login','POST',{email:'admin@example.test',password:'Test-admin-12345'});assert.equal(r.status,200);assert.equal(r.data.role,'admin');const admin=r.cookie;
r=await call('admin/order','PATCH',{id:orderId,status:'Packed'},admin);assert.equal(r.status,200);assert.equal((await call('orders','GET',undefined,customer)).data[0].status,'Packed');
const p={id:'test-product',name:'Test Product',category:'Cooking oils',brand:'Test',description:'Test description',size:'15 L tin',unit:'tin',price:100,mrp:110,stock:50,image:''};assert.equal((await call('admin/product','POST',p,admin)).status,200);
r=await call('orders','POST',{...checkout,items:[{id:'test-product',quantity:50}],payment:'cod'},customer);assert.equal(r.status,200);assert.equal(r.data.delivery,0);assert.equal(r.data.total,5000);
assert.equal((await call('admin/category','POST',{name:'Test category'},admin)).status,200);assert.equal((await call('admin/category','DELETE',{name:'Cooking oils'},admin)).status,400);assert.equal((await call('admin/category','DELETE',{name:'Test category'},admin)).status,200);
await call('admin/product','POST',{...p,stock:1},admin);const race=await Promise.all([call('orders','POST',{...checkout,items:[{id:'test-product',quantity:1}]},customer),call('orders','POST',{...checkout,items:[{id:'test-product',quantity:1}]},other)]);assert.deepEqual(race.map(r=>r.status).sort(),[200,400]);assert.equal((await db.collection('products').findOne({id:'test-product'})).stock,0);assert.equal((await call('admin/product/test-product','DELETE',{},admin)).status,200);assert.equal(await db.collection('products').countDocuments({id:'test-product'}),0);
assert.equal((await call('logout','POST',{},customer)).status,200);assert.equal((await call('orders','GET',undefined,customer)).status,401);
},{timeout:60000});

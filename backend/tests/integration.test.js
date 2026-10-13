const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const http = require('node:http');
const mongoose = require('mongoose');
const Form = require('../models/Form');
const { createApp } = require('../app');
const { loadConfig } = require('../config/runtime');
const connectDB = require('../config/db');

test('real Mongo: CRUD, read-only GET, literal search, conflicts, Make failure and P-Konto delivery', {skip: !process.env.TEST_MONGODB_URI_FILE}, async () => {
    const mongoUri = fs.readFileSync(process.env.TEST_MONGODB_URI_FILE,'utf8').trim();
    const db = process.env.TEST_MONGODB_DB_NAME;
    assert.match(db || '',/^formular-test(?:-[a-z0-9]+)?$/);
    const messages = [];
    let makeFails = false;
    const stub = http.createServer((req,res) => {
        let raw=''; req.on('data',chunk=>raw+=chunk);
        req.on('end',()=> { messages.push(JSON.parse(raw)); res.writeHead(makeFails ? 500 : 200); res.end('Accepted'); });
    }).listen(0,'127.0.0.1');
    await new Promise(resolve=>stub.once('listening',resolve));
    const webhook=`http://127.0.0.1:${stub.address().port}`;
    const config=loadConfig({APP_ENV:'test',FRONTEND_URL:'http://localhost:3000',MONGODB_URI:mongoUri,MONGODB_DB_NAME:db,
        AUTH_SECRET:'a'.repeat(48),STAFF_PASSWORD:'synthetic-password',INTEGRATION_API_KEY:'b'.repeat(48),MAKE_WEBHOOKS_ENABLED:'true',MAKE_UPDATE_WEBHOOK_URL:webhook,MAKE_PKONTO_WEBHOOK_URL:webhook});
    let server;
    try {
        await connectDB(config);
        await Form.deleteMany({});
        await Form.init();
        server=createApp(config).listen(0,'127.0.0.1');
        await new Promise(resolve=>server.once('listening',resolve));
        const url=`http://127.0.0.1:${server.address().port}`;
        const api=(path,method='GET',body)=>fetch(url+'/api/forms'+path,{method,headers:{'X-API-Key':config.integrationKey,'Content-Type':'application/json'},body:body===undefined?undefined:JSON.stringify(body)});
        assert.equal((await fetch(url+'/api/health/ready')).status,200);
        assert.equal((await api('/','POST',{taskId:'DEMO-1',leadName:'Synthetic [Client]',phoneNumber:'000-test'})).status,201);
        const before=await Form.findOne({taskId:'DEMO-1'}).lean();
        const loaded=await (await api('/DEMO-1')).json();
        const after=await Form.findOne({taskId:'DEMO-1'}).lean();
        assert.deepEqual(before,after);
        assert.equal(loaded.phoneNumber,'000-test');
        assert.equal((await (await api('/search?name=%5B')).json()).length,1);
        assert.equal((await (await api('/search?name=.%2A')).json()).length,0);
        assert.equal((await api('/DEMO-1','PUT',{$set:{qualifiziert:true}})).status,400);
        const saved=await (await api('/DEMO-1','PUT',{...loaded,taskId:'INVALID-RENAME',nettoEinkommen:'3000',kinderAnzahl:'0',glaeubiger:'0',qualifiziert:true})).json();
        assert.equal(saved.taskId,'DEMO-1');
        assert.equal(saved.preisKalkulation.gesamtPreis,900);
        assert.equal(saved._integration.status,'accepted');
        assert.equal(messages[0].preisKalkulation.gesamtPreis,900);
        assert.equal(messages[0].phoneNumber,'000-test');
        assert.equal((await api('/DEMO-1','PUT',{...loaded,notizen:'stale'})).status,409);
        makeFails=true;
        const failed=await (await api('/DEMO-1','PUT',{...saved,qualifiziert:false})).json();
        assert.equal(failed._integration.status,'failed');
        assert.equal((await Form.findOne({taskId:'DEMO-1'})).qualifiziert,false);
        assert.equal((await Form.findOne({taskId:'DEMO-1'})).makeDelivery.status,'failed');
        assert.equal((await api('/send-pkonto-email','POST',{taskId:'DEMO-1',name:'Synthetic Client'})).status,502);
        makeFails=false;
        assert.equal((await api('/send-pkonto-email','POST',{taskId:'DEMO-1',name:'Synthetic Client',adresse:'Synthetic Street'})).status,200);
        assert.equal(messages.at(-1).type,'pkonto_bescheinigung');
        assert.equal((await api('/','POST',{taskId:'DEMO-1',leadName:'Duplicate'})).status,409);
    } finally {
        if (mongoose.connection.readyState===1) await Form.deleteMany({});
        if(server) await new Promise(resolve=>server.close(resolve));
        await mongoose.disconnect();
        await new Promise(resolve=>stub.close(resolve));
    }
});

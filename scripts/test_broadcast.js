(async function(){
  try{
    const base = 'http://localhost:5000/api';
    const loginResp = await fetch(base + '/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: 'admin@nohungerfoodbank.org', password: 'SAdmin@VMS2026' }),
    });
    const loginData = await loginResp.json().catch(()=>null);
    console.log('LOGIN_STATUS', loginResp.status);
    console.log('LOGIN_BODY', loginData);
    if (!loginResp.ok) return process.exit(1);

    const token = loginData.token;
    const headers = { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` };

    const sendResp = await fetch(base + '/admin/broadcasts', {
      method: 'POST',
      headers,
      body: JSON.stringify({ subject: 'Test Broadcast', message: 'Automated test broadcast', recipientType: 'all' }),
    });
    const sendData = await sendResp.json().catch(()=>null);
    console.log('SEND_STATUS', sendResp.status);
    console.log('SEND_BODY', sendData);

    const listResp = await fetch(base + '/admin/broadcasts', { headers });
    const listData = await listResp.json().catch(()=>null);
    console.log('LIST_STATUS', listResp.status);
    console.log('LIST_LENGTH', Array.isArray(listData) ? listData.length : 0);
    if (Array.isArray(listData)) console.log('FIRST_3', listData.slice(0,3));
  } catch (err) {
    console.error('ERROR', err);
    process.exit(1);
  }
})();

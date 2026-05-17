(async function(){
  const base = 'http://localhost:5000/api';
  const superAdmin = { email: 'admin@nohungerfoodbank.org', password: 'SAdmin@VMS2026' };
  const results = {};
  try{
    // login
    const loginResp = await fetch(base + '/auth/login', { method: 'POST', headers: {'Content-Type':'application/json'}, body: JSON.stringify(superAdmin) });
    results.login = { status: loginResp.status, body: await loginResp.json().catch(()=>null) };
    if (!loginResp.ok) { console.error('Login failed', results.login); return console.log(JSON.stringify(results, null, 2)); }
    const token = results.login.body.token;
    const H = { 'Content-Type':'application/json', Authorization: `Bearer ${token}` };

    // auth/me
    const meResp = await fetch(base + '/auth/me', { headers: H });
    results.me = { status: meResp.status, body: await meResp.json().catch(()=>null) };

    // admin dashboard stats
    const statsResp = await fetch(base + '/admin/dashboard/stats', { headers: H });
    results.stats = { status: statsResp.status, body: await statsResp.json().catch(()=>null) };

    // get volunteers (admin list)
    const volsResp = await fetch(base + '/admin/volunteers', { headers: H });
    results.adminVolunteers = { status: volsResp.status, body: await volsResp.json().catch(()=>null) };

    // broadcasts list
    const bListResp = await fetch(base + '/admin/broadcasts', { headers: H });
    results.broadcasts = { status: bListResp.status, body: await bListResp.json().catch(()=>null) };

    // send a broadcast
    const sendResp = await fetch(base + '/admin/broadcasts', { method: 'POST', headers: H, body: JSON.stringify({ subject: 'Full Test Broadcast', message: 'Full system test broadcast', recipientType: 'all' }) });
    results.sendBroadcast = { status: sendResp.status, body: await sendResp.json().catch(()=>null) };

    // audit logs (admin)
    const auditResp = await fetch(base + '/audit/admin', { headers: H });
    results.auditAdmin = { status: auditResp.status, body: await auditResp.json().catch(()=>null) };

    // pick a volunteer to test profile update and activities
    let volunteerId = null;
    if (results.adminVolunteers && results.adminVolunteers.body && Array.isArray(results.adminVolunteers.body.data) && results.adminVolunteers.body.data.length>0) {
      volunteerId = results.adminVolunteers.body.data[0]._id;
    } else if (Array.isArray(results.broadcasts?.body)) {
      // fallback: use userId from first broadcast
      const first = results.broadcasts.body[0];
      if (first && first.userId && first.userId._id) volunteerId = first.userId._id;
    }
    results.selectedVolunteerId = volunteerId;

    if (volunteerId) {
      // get volunteer public profile
      const pubResp = await fetch(base + '/volunteers/public-profile/' + volunteerId, { headers: H });
      results.volunteerPublic = { status: pubResp.status, body: await pubResp.json().catch(()=>null) };

      // update volunteer profile (change city temporarily)
      const updateResp = await fetch(base + '/volunteers/' + volunteerId, { method: 'PUT', headers: H, body: JSON.stringify({ city: 'Testville' }) });
      results.updateVolunteer = { status: updateResp.status, body: await updateResp.json().catch(()=>null) };

      // get volunteer activities
      const actsResp = await fetch(base + '/volunteers/' + volunteerId + '/activities', { headers: H });
      results.volunteerActivities = { status: actsResp.status, body: await actsResp.json().catch(()=>null) };
    }

    console.log(JSON.stringify(results, null, 2));
  } catch (err) {
    console.error('ERROR', err);
    process.exit(1);
  }
})();

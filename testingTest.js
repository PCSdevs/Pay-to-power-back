const mqtt = require('mqtt');
const fs = require('fs');

// ✅ Use a unique clientId per device
const clientId = 'sensor-01qwewe';

const client = mqtt.connect({
  host: 'hb778060.ala.dedicated.aws.emqxcloud.com',
  port: 8883,
  protocol: 'mqtts',
  username: 'pay2power',
  password: 'pay2power',
  clientId, // 👈 very important
  ca: fs.readFileSync('./app/certs/emqxcloud-ca.crt'),
  rejectUnauthorized: true,
});

client.on('connect', () => {
  console.log(`📡 Device "${clientId}" connected to broker`);


  // ✅ Send registration payload (optional)
  // const payload = {
  //   macAddress: '11:22:33:44:55:66',
  //   boardNumber: 'u7798'
  // };

  

  // client.publish('device/register', JSON.stringify(payload), {}, () => {
  //   console.log('✅ Published registration message');
  //   // Don't end() here — let it stay connected for the server to detect
  // });

  const payload = {
    isDeviceOnline:true
  };
    client.publish('device/1HB/online', JSON.stringify(payload), {}, () => {
    console.log('✅ Published Online Message');
    // Don't end() here — let it stay connected for the server to detect
  });
});

// Optional: disconnect gracefully after a while (if needed)
setTimeout(() => {
  console.log(`🔌 Disconnecting "${clientId}" from broker`);
  client.end();
}, 10000); // disconnect after 10 seconds
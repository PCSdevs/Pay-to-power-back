import { mqtt, iot } from 'aws-iot-device-sdk-v2';
import * as path from 'path';

const endpoint = 'a2b4lrdprbci1j-ats.iot.us-east-1.amazonaws.com'; // ✅ Replace with your endpoint
const certPath = path.resolve('./app/certs/chips.cert.pem');
console.log("🚀 ~ certPath:", certPath)
const keyPath = path.resolve('./app/certs/chips.private.key');
console.log("🚀 ~ keyPath:", keyPath)
const caPath = path.resolve('./app/certs/root-CA.crt');
console.log("🚀 ~ caPath:", caPath)
const clientId = 'basicPubSub';
const topic = 'sdk/test/python';

async function run() {
  // ✅ Use the static builder method
  const configBuilder = iot.AwsIotMqttConnectionConfigBuilder
    .new_mtls_builder_from_path(certPath, keyPath)
    .with_certificate_authority_from_path(undefined, caPath)
    .with_clean_session(false)
    .with_client_id(clientId)
    .with_endpoint(endpoint);

  const client = new mqtt.MqttClient();
  const connection = client.new_connection(configBuilder.build());

  connection.on('connect', () => console.log('✅ Connected to AWS IoT'));
  connection.on('interrupt', () => console.warn('⚠️ Connection interrupted'));
  connection.on('resume', () => console.log('🔁 Reconnected'));
  connection.on('disconnect', () => console.log('🔌 Disconnected'));

  await connection.connect();

  // Subscribe
  await connection.subscribe(topic, mqtt.QoS.AtLeastOnce, (topic, payload) => {
    const message = new TextDecoder('utf-8').decode(payload);
    console.log(`📩 Message on ${topic}:`, message);
  });

  // Publish
  const payload = JSON.stringify({ msg: 'Hello from Node TypeScript' });
  await connection.publish(topic, payload, mqtt.QoS.AtLeastOnce);
  console.log('🚀 Published:', payload);

  // Disconnect after 5 seconds
  setTimeout(async () => {
    await connection.disconnect();
  }, 5000);
}

run().catch(err => {
  console.error('❌ Failed:', err);
});

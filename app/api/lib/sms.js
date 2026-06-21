/**
 * Mock SMS service for logging SMS alerts in development/server console
 */
export async function sendMockSMS(phoneNumbers, message) {
  const targets = Array.isArray(phoneNumbers) ? phoneNumbers : [phoneNumbers];
  
  console.log('\n======================================================');
  console.log('📱 [MOCK SMS SERVICE] - ENVOI DE SMS EN COURS...');
  console.log(`💬 Contenu : "${message}"`);
  console.log(`👥 Destinataires (${targets.length}) :`);
  targets.forEach((phone, idx) => {
    console.log(`   [${idx + 1}] ${phone || 'Numéro inconnu'}`);
  });
  console.log('======================================================\n');
  
  return {
    success: true,
    sentCount: targets.length,
    timestamp: new Date()
  };
}

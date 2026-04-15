/**
 * @file setAdmin.js
 * @description One-time script to grant or revoke admin privileges via Firebase Custom Claims.
 * 
 * Usage:
 *   node scripts/setAdmin.js <email>           → Grants admin
 *   node scripts/setAdmin.js <email> --revoke  → Revokes admin
 */

const admin = require('firebase-admin');
const path = require('path');

// Initialize with your service account
const serviceAccount = require(path.resolve(__dirname, '..', 'serviceAccountKey.json'));

admin.initializeApp({
    credential: admin.credential.cert(serviceAccount)
});

async function run() {
    const email = process.argv[2];
    const revoke = process.argv.includes('--revoke');

    if (!email) {
        console.error('❌ Usage: node scripts/setAdmin.js <email> [--revoke]');
        process.exit(1);
    }

    try {
        // Find the user by email
        const user = await admin.auth().getUserByEmail(email);
        console.log(`Found user: ${user.uid} (${user.email})`);

        if (revoke) {
            // Remove admin claim
            await admin.auth().setCustomUserClaims(user.uid, { admin: false });
            console.log(`🚫 Admin privileges REVOKED for ${email}`);
        } else {
            // Grant admin claim
            await admin.auth().setCustomUserClaims(user.uid, { admin: true });
            console.log(`✅ Admin privileges GRANTED for ${email}`);
        }

        console.log('\n⚠️  The user must log out and log back in for changes to take effect.');
        process.exit(0);
    } catch (err) {
        console.error('❌ Error:', err.message);
        process.exit(1);
    }
}

run();

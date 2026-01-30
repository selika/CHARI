const https = require('https');
const fs = require('fs');

const FHIR_BASE = 'thas.mohw.gov.tw';
const FHIR_PATH = '/v/r4/fhir';

function uploadResource(resourceType, id, data) {
    return new Promise((resolve, reject) => {
        const jsonData = JSON.stringify(data);
        const options = {
            hostname: FHIR_BASE,
            port: 443,
            path: `${FHIR_PATH}/${resourceType}/${id}`,
            method: 'PUT',
            headers: {
                'Content-Type': 'application/fhir+json',
                'Content-Length': Buffer.byteLength(jsonData)
            }
        };

        const req = https.request(options, (res) => {
            let body = '';
            res.on('data', chunk => body += chunk);
            res.on('end', () => {
                console.log(`  ${resourceType}/${id}: ${res.statusCode}`);
                resolve({ status: res.statusCode, body });
            });
        });

        req.on('error', reject);
        req.write(jsonData);
        req.end();
    });
}

async function uploadFile(filePath) {
    const data = JSON.parse(fs.readFileSync(filePath, 'utf8'));
    const items = Array.isArray(data) ? data : [data];

    for (const item of items) {
        await uploadResource(item.resourceType, item.id, item);
    }
}

async function main() {
    console.log('Uploading patients...');
    await uploadFile('test-data/TESTA-01/patient.json');
    await uploadFile('test-data/TESTA-02/patient.json');

    console.log('\nUploading compositions...');
    await uploadFile('test-data/TESTA-01/compositions.json');
    await uploadFile('test-data/TESTA-02/compositions.json');

    console.log('\nDone!');
}

main().catch(console.error);

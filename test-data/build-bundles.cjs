/**
 * 將 test-data 中的散裝 FHIR JSON 組成 Transaction Bundle，
 * 並打包成 ZIP 供衛福部第二階段測試上傳。
 *
 * Usage: node test-data/build-bundles.js
 * Output: test-data/CHARI-test-bundles.zip
 */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

const BASE = path.join(__dirname);

// 每個案例要載入的檔案（順序很重要：Organization → Patient → Practitioner → 其餘）
const CASES = {
  'TESTA-01': [
    'organization.json',
    'patient.json',
    'practitioners.json',
    'encounters.json',
    'outpatient-encounters.json',
    'conditions.json',
    'procedures.json',
    'medication-statements.json',
    'outpatient-medications.json',
    'observations.json',
    'compositions.json',
  ],
  'TESTA-02': [
    // TESTA-02 共用 org-vghtpe（在 TESTA-01 已建立），但為獨立 bundle 需再帶一次
    '../TESTA-01/organization.json',
    'patient.json',
    'practitioners.json',
    'encounters.json',
    'outpatient-encounters.json',
    'conditions.json',
    'procedures.json',
    'medication-statements.json',
    'outpatient-medications.json',
    'observations.json',
    'diagnostic-reports.json',
    'compositions.json',
  ],
  'TESTA-03': [
    // TESTA-03 的 Organization 是關渡分院，但 partOf 參考 org-vghtpe，所以也要帶
    '../TESTA-01/organization.json',
    'organization-kdgh.json',
    'patient.json',
    'practitioners.json',
    'allergy-intolerance.json',
    'encounters.json',
    'conditions.json',
    'procedures.json',
    'medication-statements.json',
    'observations.json',
    'compositions.json',
  ],
};

function loadResources(caseDir, files) {
  const resources = [];
  for (const file of files) {
    const filePath = path.join(BASE, caseDir, file);
    const raw = JSON.parse(fs.readFileSync(filePath, 'utf-8'));
    // 有些檔案是 array（多個 resource），有些是單一 resource
    if (Array.isArray(raw)) {
      resources.push(...raw);
    } else {
      resources.push(raw);
    }
  }
  return resources;
}

function buildTransactionBundle(resources) {
  // 去重：同一個 resourceType/id 只保留第一個（避免跨案例重複的 Organization）
  const seen = new Set();
  const unique = [];
  for (const r of resources) {
    const key = `${r.resourceType}/${r.id}`;
    if (!seen.has(key)) {
      seen.add(key);
      unique.push(r);
    }
  }

  return {
    resourceType: 'Bundle',
    type: 'transaction',
    entry: unique.map((resource) => ({
      fullUrl: `urn:uuid:${resource.resourceType}/${resource.id}`,
      resource,
      request: {
        method: 'PUT',
        url: `${resource.resourceType}/${resource.id}`,
      },
    })),
  };
}

// --- Main ---
const outDir = path.join(BASE, 'bundles');
if (!fs.existsSync(outDir)) fs.mkdirSync(outDir);

const bundleFiles = [];

for (const [caseName, files] of Object.entries(CASES)) {
  console.log(`Building ${caseName}...`);
  const resources = loadResources(caseName, files);
  const bundle = buildTransactionBundle(resources);
  const outFile = path.join(outDir, `${caseName}-bundle.json`);
  fs.writeFileSync(outFile, JSON.stringify(bundle, null, 2), 'utf-8');
  bundleFiles.push(outFile);
  console.log(`  → ${bundle.entry.length} entries → ${path.basename(outFile)}`);
}

// 打包 ZIP
const zipFile = path.join(BASE, 'CHARI-test-bundles.zip');
// 清除舊的
if (fs.existsSync(zipFile)) fs.unlinkSync(zipFile);

try {
  // 用 PowerShell Compress-Archive（Windows 內建）
  const filePaths = bundleFiles.map((f) => `"${f}"`).join(',');
  execSync(
    `powershell -Command "Compress-Archive -Path ${filePaths} -DestinationPath '${zipFile}'"`,
    { stdio: 'inherit' }
  );
  console.log(`\n✅ ZIP created: ${zipFile}`);
} catch {
  console.log('\n⚠️  ZIP 失敗，請手動壓縮 test-data/bundles/ 資料夾');
  console.log('   Bundle JSON 已產出於 test-data/bundles/');
}

console.log('\nDone!');

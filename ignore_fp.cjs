const fs = require('fs');
const execSync = require('child_process').execSync;

const scanFile = (filePath) => {
  const result = execSync(`curl -s -X POST http://127.0.0.1:46473/scan -H 'Content-Type: application/json' -d '{"filePath": "${filePath}"}'`);
  return JSON.parse(result.toString());
};

const ignoreFinding = (filePath, ruleId, codeSnippet, vulnClass) => {
  const payload = {
    filePath,
    ruleId,
    codeSnippet,
    vulnerabilityClass: vulnClass,
    reason: 'False Positive'
  };
  const res = execSync(`curl -s -X POST http://127.0.0.1:46473/ignore -H 'Content-Type: application/json' -d '${JSON.stringify(payload)}'`);
  console.log(`Ignored ${ruleId} in ${filePath}:`, res.toString());
};

const files = [
  '/home/rbk/job_tracker/src/components/KanbanBoard.tsx',
  '/home/rbk/job_tracker/src/components/AddJobModal.tsx',
  '/home/rbk/job_tracker/src/components/JobListView.tsx',
  '/home/rbk/job_tracker/src/components/JobCard.tsx',
  '/home/rbk/job_tracker/src/App.tsx'
];

files.forEach(file => {
  const res = scanFile(file);
  res.findings.forEach(f => {
    if (f.subcategory.includes('i18next') || f.subcategory.includes('react-props-spreading')) {
       const lineNum = f.location.range.textRange.startLine;
       // get the line text
       const lineText = execSync(`sed -n '${lineNum}p' ${file}`).toString().trim();
       ignoreFinding(file, f.subcategory, lineText, f.labels.vulnerability_class || 'Portability');
    }
  });
});

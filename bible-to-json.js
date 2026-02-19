const fs = require('fs');
const path = require('path');

const bibleDir = path.join(__dirname, 'bible');
const outputPath = path.join(__dirname, 'src', 'data', 'bible.json');

const result = { 구약: [], 신약: [] };

const files = fs.readdirSync(bibleDir)
  .filter(f => f.endsWith('.txt'))
  .sort();

for (const file of files) {
  const match = file.match(/^(\d)-(\d+)(.+)\.txt$/);
  if (!match) continue;

  const testament = match[1] === '1' ? '구약' : '신약';
  const order = parseInt(match[2], 10);
  const bookName = match[3];

  const content = fs.readFileSync(path.join(bibleDir, file), 'utf8');
  const lines = content.split('\n').map(l => l.trim()).filter(Boolean);

  const chapters = {};
  let abbr = '';

  for (const line of lines) {
    // 형식: 약어장:절 <소제목?> 내용
    const lineMatch = line.match(/^([^\d]+)(\d+):(\d+)\s+(?:<[^>]+>\s*)?(.+)$/);
    if (!lineMatch) continue;

    abbr = lineMatch[1];
    const chapter = parseInt(lineMatch[2], 10);
    const verse = parseInt(lineMatch[3], 10);
    const text = lineMatch[4].trim();

    if (!chapters[chapter]) chapters[chapter] = {};
    chapters[chapter][verse] = text;
  }

  result[testament].push({ name: bookName, abbr, order, chapters });
}

// 출력 폴더 생성
const outDir = path.dirname(outputPath);
if (!fs.existsSync(outDir)) fs.mkdirSync(outDir, { recursive: true });

fs.writeFileSync(outputPath, JSON.stringify(result, null, 2), 'utf8');
console.log(`완료: ${outputPath}`);

// 통계 출력
const oldCount = result['구약'].length;
const newCount = result['신약'].length;
console.log(`구약 ${oldCount}권, 신약 ${newCount}권 변환됨`);

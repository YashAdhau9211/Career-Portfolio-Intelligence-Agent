const { GoogleGenerativeAI } = require('@google/generative-ai');
const genAI = new GoogleGenerativeAI('AIzaSyAhtpnxCFysdPZquDGB_dWvzAkSnRYPS3c');
const model = genAI.getGenerativeModel({
  model: 'gemini-2.5-flash',
  generationConfig: { temperature: 0.7, topK: 40, topP: 0.95, maxOutputTokens: 4096 }
});

const prompt = `You are a career advisor for the JSO platform. Generate a concise 30-day improvement plan.

CANDIDATE:
- CV Score: 75/100, Job Search Score: 80/100
- GitHub: torvalds | Repos: 10 | Languages: C, Python
- Commits: 500 | Followers: 100000 | Active recently: Yes

RULES:
- 2-3 mini-projects using ONLY free tools, completable in 30 days
- 3 CV bullet rewrites with action verbs and metrics
- 3 FREE learning resources only (freeCodeCamp, MDN, YouTube, official docs — NO paid content)
- 1 JSO pillar alignment (Governance, Workers, Community, Environment, Customers, Sustainability)
- Keep all text fields brief (1-2 sentences max)
- isFree must be true for all resources

Respond with ONLY valid JSON, no markdown, no extra text:
{"summary":"string","miniProjects":[{"title":"string","description":"string","estimatedDays":10,"freeTools":["string"],"learningOutcomes":["string"],"difficulty":"string"}],"cvRewrites":[{"original":"string","improved":"string","rationale":"string","githubProjectReference":null}],"learningResources":[{"title":"string","type":"string","url":"string","provider":"string","estimatedHours":5,"isFree":true}],"jsoAlignment":[{"pillar":"string","recommendation":"string","explanation":"string"}]}`;

const start = Date.now();
model.generateContent(prompt).then(r => {
  const text = r.response.text();
  console.log('OK in', Date.now() - start, 'ms, length:', text.length);
  try {
    let json = text.trim();
    const m = json.match(/```json\s*([\s\S]*?)\s*```/) || json.match(/```\s*([\s\S]*?)\s*```/);
    if (m) { console.log('WARNING: response wrapped in markdown fences'); json = m[1].trim(); }
    const parsed = JSON.parse(json);
    console.log('PARSED OK');
    console.log('  miniProjects:', parsed.miniProjects.length);
    console.log('  cvRewrites:', parsed.cvRewrites.length);
    console.log('  learningResources:', parsed.learningResources.length);
    const paid = parsed.learningResources.filter(r => r.isFree !== true);
    console.log('  paid resources (should be 0):', paid.length, paid.map(r => r.title));
  } catch (e) {
    console.error('PARSE ERROR:', e.message);
    console.log('RAW:', text.substring(0, 800));
  }
}).catch(e => console.error('API ERROR:', e.message.split('\n')[0]));

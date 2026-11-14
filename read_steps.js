const fs = require("fs");
const readline = require("readline");
const rl = readline.createInterface({
  input: fs.createReadStream("C:/Users/Usuario/.gemini/antigravity/brain/17b6decb-7a0d-4b5d-8630-b24b4924365b/.system_generated/logs/transcript.jsonl")
});
rl.on("line", (line) => {
  try {
    const obj = JSON.parse(line);
    if (obj.type === 'USER_INPUT' && /github|pages|link|site|url|vercel/i.test(obj.content || '')) {
      console.log("USER:", obj.step_index, obj.content);
    }
  } catch(e) {}
});

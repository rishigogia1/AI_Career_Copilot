import dotenv from "dotenv";
import path from "path";
dotenv.config({ path: path.join(process.cwd(), ".env") });
import axios from "axios";

const r = await axios.get("https://openrouter.ai/api/v1/models", {
  headers: { "Authorization": `Bearer ${process.env.OPENROUTER_API_KEY}` }
});

const free = r.data.data.filter(m => parseFloat(m.pricing?.prompt) === 0);
console.log(`Total free models: ${free.length}`);
free.slice(0, 25).forEach(m => console.log(m.id));

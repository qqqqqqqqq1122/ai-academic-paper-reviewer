"use strict";
var _a;
Object.defineProperty(exports, "__esModule", { value: true });
const utils_1 = require("./utils");

const GEMINI_API_KEY = process.env.GEMINI_API_KEY;
const GITHUB_TOKEN = process.env.GITHUB_TOKEN;

// Fallback: GitHub 自动提供的完整仓库名 owner/repo
const GH_REPOSITORY = process.env.GITHUB_REPOSITORY || "";
let fallbackOwner = "";
let fallbackRepo = "";
if (GH_REPOSITORY.includes("/")) {
  const parts = GH_REPOSITORY.split("/");
  fallbackOwner = parts[0] || "";
  fallbackRepo = parts[1] || "";
}

// 优先 action.yml 注入，其次 fallback
const OWNER = process.env.GITHUB_OWNER || fallbackOwner;
const REPO = process.env.GITHUB_REPO || fallbackRepo;

// 其它配置
const EXCLUDE_PATHS = ((_a = process.env.EXCLUDE_PATHS) === null || _a === void 0
  ? void 0
  : _a.split(",").map(p => p.trim()).filter(Boolean)) || [];

const LANGUAGE = process.env.LANGUAGE || "English";

// PR 号：空或非数字 → 0 表示“无 PR 评论上下文”
const rawPR = process.env.GITHUB_PR_NUMBER;
const PR_NUMBER = rawPR && /^\d+$/.test(rawPR) ? Number(rawPR) : 0;

const MODEL_CODE = process.env.MODEL_CODE || "models/gemini-2.0-flash";
const USE_SINGLE_COMMENT_REVIEW = process.env.USE_SINGLE_COMMENT_REVIEW === "true";
const REVIEW_MODE = process.env.REVIEW_MODE || "CODE";

// API Key 可选：没设置就跳过
if (!GEMINI_API_KEY) {
  console.log("⚠️  GEMINI_API_KEY not set. Skipping AI review.");
  process.exit(0);
}

// 必需：令牌与仓库标识
if (!GITHUB_TOKEN) throw new Error("GITHUB_TOKEN is missing");
if (!OWNER) throw new Error("GITHUB_OWNER (or fallback) is missing");
if (!REPO) throw new Error("GITHUB_REPO (or fallback) is missing");

console.log(`[ai-reviewer] Repository: ${OWNER}/${REPO}`);
if (PR_NUMBER > 0) {
  console.log(`[ai-reviewer] PR context: #${PR_NUMBER}`);
} else {
  console.log("[ai-reviewer] No PR context (push/manual). Inline PR comments will be skipped if implemented.");
}

// 模式选择
const isAcademicMode = REVIEW_MODE === "ACADEMIC";
const promptFn = isAcademicMode ? utils_1.createAcademicReviewPrompt : utils_1.createReviewPrompt;
const generateFn = USE_SINGLE_COMMENT_REVIEW
  ? (isAcademicMode ? utils_1.generateAcademicReviewText : utils_1.generateReviewCommentText)
  : (isAcademicMode ? utils_1.generateAcademicReviewObject : utils_1.generateReviewCommentObject);

// 执行
(0, utils_1.runReviewBotVercelAI)({
  githubToken: GITHUB_TOKEN,
  owner: OWNER,
  repo: REPO,
  excludePaths: EXCLUDE_PATHS,
  language: LANGUAGE,
  pullNumber: PR_NUMBER,
  modelCode: MODEL_CODE,
  generateReviewCommentFn: generateFn,
  postReviewCommentFn: utils_1.realPostReviewComment,
  createPromptFn: promptFn
});

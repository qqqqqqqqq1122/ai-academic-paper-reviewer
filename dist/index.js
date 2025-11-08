"use strict";
var _a;
Object.defineProperty(exports, "__esModule", { value: true });
const utils_1 = require("./utils");

const GEMINI_API_KEY = process.env.GEMINI_API_KEY;
const GITHUB_TOKEN = process.env.GITHUB_TOKEN;

// GitHub 默认提供：owner/repo
const GH_REPOSITORY = process.env.GITHUB_REPOSITORY || "";
let autoOwner = "";
let autoRepo = "";
if (GH_REPOSITORY.includes("/")) {
  const parts = GH_REPOSITORY.split("/");
  autoOwner = parts[0] || "";
  autoRepo = parts[1] || "";
}

// 优先使用 action.yml 明确注入的变量，缺失则用拆分结果
const OWNER = process.env.GITHUB_OWNER || autoOwner;
const REPO = process.env.GITHUB_REPO || autoRepo;

// 其它配置
const EXCLUDE_PATHS = ((_a = process.env.EXCLUDE_PATHS) === null || _a === void 0
  ? void 0
  : _a.split(",").map(p => p.trim()).filter(Boolean)) || [];
const LANGUAGE = process.env.LANGUAGE || "English";
const RAW_PR_NUMBER = process.env.GITHUB_PR_NUMBER;
const PR_NUMBER = RAW_PR_NUMBER ? Number(RAW_PR_NUMBER) : 0; // 无 PR 用 0
const MODEL_CODE = process.env.MODEL_CODE || "models/gemini-2.0-flash";
const USE_SINGLE_COMMENT_REVIEW = process.env.USE_SINGLE_COMMENT_REVIEW === "true";
const REVIEW_MODE = process.env.REVIEW_MODE || "CODE";

// 1. API Key 可选
if (!GEMINI_API_KEY) {
  console.log("⚠️  GEMINI_API_KEY not set. Skipping AI review.");
  process.exit(0);
}

// 2. 必需令牌
if (!GITHUB_TOKEN) {
  throw new Error("GITHUB_TOKEN is missing");
}

// 3. 仓库识别
if (!OWNER) {
  throw new Error("GITHUB_OWNER (or fallback) is missing");
}
if (!REPO) {
  throw new Error("GITHUB_REPO (or fallback) is missing");
}

console.log(`[ai-reviewer] Repository: ${OWNER}/${REPO}`);
if (PR_NUMBER > 0) {
  console.log(`[ai-reviewer] PR context: #${PR_NUMBER}`);
} else {
  console.log("[ai-reviewer] No PR context (push or manual trigger).");
}

// 模式函数选择
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

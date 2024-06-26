import md5 from "spark-md5";
import { DEFAULT_MODELS } from "../constant";

declare global {
  namespace NodeJS {
    interface ProcessEnv {
      PROXY_URL?: string; // docker only

      OPENAI_API_KEY?: string;
      CODE?: string;

      BASE_URL?: string;
      OPENAI_ORG_ID?: string; // openai only

      VERCEL?: string;
      BUILD_MODE?: "standalone" | "export";
      BUILD_APP?: string; // is building desktop app

      HIDE_USER_API_KEY?: string; // disable user's api key input
      DISABLE_GPT4?: string; // allow user to use gpt-4 or not
      ENABLE_BALANCE_QUERY?: string; // allow user to query balance or not
      DISABLE_FAST_LINK?: string; // disallow parse settings from url or not
      CUSTOM_MODELS?: string; // to control custom models
      DEFAULT_MODEL?: string; // to cnntrol default model in every new chat window

      // azure only
      AZURE_URL?: string; // https://{azure-url}/openai/deployments
      AZURE_API_KEY?: string;
      AZURE_API_VERSION?: string;

      // google only
      GOOGLE_API_KEY?: string;
      GOOGLE_URL?: string;

      // google tag manager
      GTM_ID?: string;
    }
  }
}

const ACCESS_CODES = (function getAccessCodes(): Set<string> {
  const code = process.env.CODE;

  try {
    const codes = (code?.split(",") ?? [])
      .filter((v) => !!v)
      .map((v) => md5.hash(v.trim()));
    return new Set(codes);
  } catch (e) {
    return new Set();
  }
})();

export const getServerSideConfig = () => {
  if (typeof process === "undefined") {
    throw Error(
      "[Server Config] you are importing a nodejs-only module outside of nodejs",
    );
  }

  const disableGPT4 = !!process.env.DISABLE_GPT4;
  let customModels = process.env.CUSTOM_MODELS ?? "";
  let defaultModel = process.env.DEFAULT_MODEL ?? "";

  if (disableGPT4) {
    if (customModels) customModels += ",";
    customModels += DEFAULT_MODELS.filter((m) => m.name.startsWith("gpt-4"))
      .map((m) => "-" + m.name)
      .join(",");
    if (defaultModel.startsWith("gpt-4")) defaultModel = "";
  }

  const isAzure = !!process.env.AZURE_URL;
  const isGoogle = !!process.env.GOOGLE_API_KEY;
  const isAnthropic = !!process.env.ANTHROPIC_API_KEY;

  const apiKeyEnvVar = process.env.OPENAI_API_KEY ?? "";
  const apiKeys = apiKeyEnvVar.split(",").map((v) => v.trim());
  const randomIndex = Math.floor(Math.random() * apiKeys.length);
  const apiKey = apiKeys[randomIndex];
  console.log(
    `[Server Config] using ${randomIndex + 1} of ${apiKeys.length} api key`,
  );

  const whiteWebDevEndpoints = (process.env.WHITE_WEBDEV_ENDPOINTS ?? "").split(
    ",",
  );

  // 添加处理 GOOGLE_API_KEY 的新代码
  const googleApiKeyEnvVar = process.env.GOOGLE_API_KEY ?? "";
  const googleApiKeys = googleApiKeyEnvVar.split(",").map((v) => v.trim());
  const randomGoogleIndex = Math.floor(Math.random() * googleApiKeys.length);
  const googleApiKey = googleApiKeys[randomGoogleIndex];
  console.log(
    `[Server Config] using ${randomGoogleIndex + 1} of ${googleApiKeys.length} Google api key`,
  );
  
  return {
    baseUrl: process.env.BASE_URL,
    apiKey,
    openaiOrgId: process.env.OPENAI_ORG_ID,

    isAzure,
    azureUrl: process.env.AZURE_URL,
    azureApiKey: process.env.AZURE_API_KEY,
    azureApiVersion: process.env.AZURE_API_VERSION,

    // 更新返回的配置对象，使用新的 googleApiKey
    isGoogle: googleApiKeys.length > 0, // 如果有一个或多个 Google API 密钥，则此值为 true
    googleApiKey, // 使用随机选择的 Google API 密钥
    googleUrl: process.env.GEMINI_BASE_URL ?? process.env.GOOGLE_URL,

    isAnthropic,
    anthropicApiKey: process.env.ANTHROPIC_API_KEY,
    anthropicApiVersion: process.env.ANTHROPIC_API_VERSION,
    anthropicUrl: process.env.ANTHROPIC_URL,

    gtmId: process.env.GTM_ID,

    needCode: ACCESS_CODES.size > 0,
    code: process.env.CODE,
    codes: ACCESS_CODES,

    proxyUrl: process.env.PROXY_URL,
    isVercel: !!process.env.VERCEL,

    hideUserApiKey: !!process.env.HIDE_USER_API_KEY,
    disableGPT4,
    hideBalanceQuery: !process.env.ENABLE_BALANCE_QUERY,
    disableFastLink: !!process.env.DISABLE_FAST_LINK,
    customModels,
    defaultModel,
    whiteWebDevEndpoints,

    isStoreFileToLocal:
      !!process.env.NEXT_PUBLIC_ENABLE_NODEJS_PLUGIN &&
      !process.env.R2_ACCOUNT_ID &&
      !process.env.S3_ENDPOINT,

    isEnableRAG: !!process.env.ENABLE_RAG,
    ragEmbeddingModel:
      process.env.RAG_EMBEDDING_MODEL ?? "text-embedding-3-large",
    ragChunkSize: process.env.RAG_CHUNK_SIZE ?? "2000",
    ragChunkOverlap: process.env.RAG_CHUNK_OVERLAP ?? "200",
    ragReturnCount: process.env.RAG_RETURN_COUNT ?? "4",
  };
};

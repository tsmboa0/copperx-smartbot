import dotenv from 'dotenv';

dotenv.config({path: "../../.env"});

interface Config {
  bot: {
    token: string;
  };
  dbClient:{
    uri:string
  };
  model:{
    api:string
  };
  api: {
    baseUrl: string;
  };
  encryption:{
    key:string
  };
  pusher: {
    appKey: string;
    cluster: string;
  };
  isDevelopment: boolean;
}
// Validate required config
if (!process.env.BOT_TOKEN  || !process.env.MONGO_DB_URI || !process.env.GROQ_API_KEY ||!process.env.ENCRYPTION_KEY) {
  throw new Error('One of the required env variable is not found!');
}

const config: Config = {
  bot: {
    token: process.env.BOT_TOKEN,
  },
  dbClient:{
    uri:process.env.MONGO_DB_URI,
  },
  model: {
    api:process.env.GROQ_API_KEY
  },
  api: {
    baseUrl: process.env.API_BASE_URL || 'https://income-api.copperx.io/api',
  },
  encryption:{
    key: process.env.ENCRYPTION_KEY
  },
  pusher: {
    appKey: process.env.PUSHER_APP_KEY || 'e089376087cac1a62785',
    cluster: process.env.PUSHER_CLUSTER || 'ap1',
  },
  isDevelopment: process.env.NODE_ENV !== 'production',
};

export default config;

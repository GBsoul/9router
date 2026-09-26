export default {
  id: "hermes-local",
  priority: 50,
  alias: "hermes-local",
  display: {
    name: "Hermes Local",
    icon: "smart_toy",
    color: "#7C5CFF",
    textIcon: "HE",
  },
  category: "apikey",
  noAuth: true,
  passthroughModels: true,
  transport: {
    baseUrl: "http://localhost:8645/v1/chat/completions",
    format: "openai",
  },
  serviceKinds: ["llm"],
};

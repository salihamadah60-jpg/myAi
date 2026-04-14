export const ENV = {
  databaseUrl: process.env.MONGODB_URI ?? "mongodb+srv://Thaker:772951869Th@cluster0.mkp6hlu.mongodb.net/myai?retryWrites=true&w=majority",
  isProduction: process.env.NODE_ENV === "production",
};

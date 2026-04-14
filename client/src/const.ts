export { COOKIE_NAME, ONE_YEAR_MS } from "@shared/const";

// Mock login URL since OAuth has been removed
export const getLoginUrl = () => {
  return "/chat";
};

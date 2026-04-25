import axios from "axios";

const API = axios.create({
  baseURL: "http://192.168.1.33:5000"  
});

export const loginParent = async (email: string) => {
  const res = await API.post("/parent/login", { email });
  return res.data;
};

export const getWatchHistory = async (childId: string) => {
  const res = await API.get(`/parent/watch-history/${childId}`);
  return res.data;
};

export const getCognitive = async (childId: string) => {
  const res = await API.get(`/parent/cognitive/${childId}`);
  return res.data;
};

export const getTrends = async (childId: string) => {
  const res = await API.get(`/parent/trends/${childId}`);
  return res.data;
};
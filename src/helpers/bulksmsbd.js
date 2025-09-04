import axios from "axios";
import "dotenv/config";

const sendSms = async (to, message) => {
  try {
    const response = await axios.post(process.env.SMS_API_URL, {
        api_key: process.env.SMS_API_KEY,
        senderid: process.env.SMS_SENDER_ID,
        number: Array.isArray(to) ? to.join(",") : to,
        message: message
    });
    return response.data;
  } catch (error) {
    console.error("Error sending SMS:", error);
    throw error;
  }
};

export { sendSms };



// const bulksmsbd = axios.create({
//   baseURL: process.env.SMA_API_URL,
//   params: {
//     api_key: process.env.SMS_API_KEY,
//     senderid: process.env.SMS_SENDER_ID,
//     type: "text",
//     format: "json",
//   },
//   headers: {
//     "Content-Type": "application/json",
//   },
// });
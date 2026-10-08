import API from "./api";

interface CallRequest {
  phone: string;
  course: string;
  topic: string;
}

export const initiateCall = async ({ phone, course, topic }: CallRequest) => {
  const response = await API.post("/vapi/call", {
    phoneNumber: phone,
    preferredCourse: `${course} - ${topic}`,
  });

  return response.data;
};

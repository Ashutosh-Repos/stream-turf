import { z } from "zod";
export const videoSaveParser = z.object({
  id: z.string({ required_error: "please login" }),
  title: z.string({ required_error: "title required" }),
  thumbnail: z.string({ required_error: "thumbnail required" }),
  video: z.string({ required_error: "video required" }),
  description: z.string({ required_error: "description required" }),
  age_restriction: z.boolean({ required_error: "age_restriction required" }),
  visibility: z.boolean({ required_error: "visibility required" }),
});

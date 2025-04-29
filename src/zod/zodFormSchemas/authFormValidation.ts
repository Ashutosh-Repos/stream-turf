import {
  userValidation,
  emailValidation,
  passwordValidation,
  nameValidation,
  ageValidation,
  genderValidation,
} from "../commonValidations";
import { z } from "zod";

export const loginValidation = z.object({
  identifier: z.union([userValidation, emailValidation]),
  password: passwordValidation,
});

export const registerValidation = z
  .object({
    fullname: nameValidation,
    email: emailValidation,
    age: ageValidation,
    gender: genderValidation,
    password: passwordValidation,
    confirmPassword: passwordValidation,
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "Passwords do not match",
    path: ["confirmPassword"],
  });

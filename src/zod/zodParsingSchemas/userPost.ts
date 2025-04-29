import {
  passwordValidation,
  emailValidation,
  nameValidation,
  ageValidation,
  genderValidation,
} from "../commonValidations";
import { z } from "zod";

export const userDataParser = z.object({
  fullname: nameValidation,
  email: emailValidation,
  password: passwordValidation,
  age: ageValidation,
  gender: genderValidation,
});

"use client";
import React, { useState } from "react";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import Noise from "@/components/Noise";
import { z } from "zod";
import { toast } from "sonner";
import { userValidation } from "@/zod/commonValidations";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormMessage,
} from "@/components/ui/form";

interface UsernameFormProps {
  id: string;
}

const userFrom = z.object({
  username: userValidation,
});

const UsernameForm = ({ id }: UsernameFormProps) => {
  const form = useForm<z.infer<typeof userFrom>>({
    resolver: zodResolver(userFrom),
    defaultValues: { username: "" },
    mode: "onChange",
  });

  const [usernameMessage, setUsernameMessage] = useState("");
  const [isCheckingUsername, setIsCheckingUsername] = useState(false);
  const [userNameSuggestions, setUserSuggestions] = useState([]);

  // const checkUsernameUniqueness = async (username: string) => {
  //   if (username) {
  //     setIsCheckingUsername(true);
  //     setUsernameMessage("");
  //     try {
  //       const res = await fetch(
  //         `http://localhost:3000/api/check-username?username=${username}`,
  //         {
  //           method: "GET",
  //         }
  //       );

  //       const result = await res.json();

  //       if (!result) {
  //         setUsernameMessage("unable to check username - server error");
  //       }
  //       if (!result.success) {
  //         if (!result?.suggestions) {
  //           setUsernameMessage(`${result?.error || "not getting suggestions"}`);
  //         }
  //         if (result.suggestions) {
  //           setUsernameMessage("");
  //           setUserSuggestions(result.suggestions);
  //         }
  //         return;
  //       }
  //       setUsernameMessage(result.message);
  //     } catch (error: unknown) {
  //       setUsernameMessage("server error");
  //       toast("unable to check username");
  //     }
  //   }
  // };

  const onSubmit = async (data: z.infer<typeof userFrom>) => {
    try {
      const payload = { ...data, id };
      const response = await fetch("/api/create-username", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({
          message: "Invalid server response",
        }));
        toast.error(errorData.message || "Something went wrong");
        return;
      }

      toast.success("Username created successfully.");
    } catch (error: unknown) {
      if (error instanceof Error)
        toast.error(error?.message || "Network error");
      else toast.error("unknown error");
    } finally {
      form.reset();
    }
  };

  return (
    <Form {...form}>
      <form
        className="w-full max-w-96 gap-4 flex flex-col h-max p-4 border-0 rounded-2xl relative z-40 bg-gray-300 dark:bg-zinc-900 "
        onSubmit={form.handleSubmit(onSubmit)}
      >
        <Noise />
        <FormField
          control={form.control}
          name="username"
          render={({ field }) => (
            <FormItem className="relative">
              <FormControl>
                <Input placeholder="Username" {...field} type="text" />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <span>{isCheckingUsername ? "checking" : ""}</span>
        <div className="w-full h-max flex items-center justify-center">
          <p>{usernameMessage}</p>
        </div>
        <div className="w-full h-max flex items-center justify-center">
          {userNameSuggestions.map((s, index) => (
            <p key={index}>{s}</p>
          ))}
        </div>

        <div className="flex flex-row-reverse items-center justify-between">
          <Button
            type="submit"
            className="cursor-pointer"
            disabled={form.formState.isSubmitting}
          >
            {form.formState.isSubmitting ? "Submitting..." : "Submit"}
          </Button>
        </div>
      </form>
    </Form>
  );
};

export default UsernameForm;

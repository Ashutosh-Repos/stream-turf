import React from "react";
import UsernameForm from "./client";
import { auth } from "@/auth";
import { redirect } from "next/navigation";
// import { BackgroundGradientAnimation } from "@/components/ui/background-gradient-animation";
// import BackgroundCanvas from "@/components/BackgroundCanvas";

const CreateUsername = async () => {
  const session = await auth();
  if (!session?.user.id) redirect("/login");
  return (
    // <BackgroundGradientAnimation className="grid place-items-center absolute w-full h-full">
    <UsernameForm id={session.user.id} />
    // </BackgroundGradientAnimation>
  );
};

export default CreateUsername;

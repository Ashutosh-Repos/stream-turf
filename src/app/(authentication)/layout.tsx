const AuthenticationLayout = ({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) => {
  return (
    <main className="w-screen h-screen relative grid place-items-center bg-zinc-50 dark:bg-zinc-950">
      {children}
    </main>
  );
};

export default AuthenticationLayout;
